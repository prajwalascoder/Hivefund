// server.js
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import multer from "multer";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import crypto from "crypto";
import { ethers } from "ethers";
import PDFDocument from "pdfkit";


/* ===== AI / ML (DO NOT TOUCH) ===== */
import { extractTextFromDocuments } from "./services/ocrService.js";
import { extractAIFeatures } from "./services/aiFeatureService.js";
import { getFraudProbabilityFromText } from "./services/mlService.js";
import { calculateTrustScore } from "./services/trustScoreService.js";
import { generateAISummary } from "./services/aiSummaryService.js";

dotenv.config();

/* ================== BASIC SETUP ================== */
const app = express();
const PORT = process.env.PORT || 4001;
const __dirname = path.resolve();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:4001",
    "https://hivefundr.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Handle preflight requests
app.options("*", cors());

app.use(express.json());
app.use("/uploads", express.static("uploads"));


/* ================== DATABASE ================== */
const dbPath = path.join(__dirname, "db.json");

function readDB() {
  try {
    const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    db.users ||= [];
    db.pending ||= [];
    db.campaigns_meta ||= [];
    db.donations ||= [];
    db.nextPendingId ||= 1;
    db.nextMetaId ||= 1;
    return db;
  } catch {
    return {
      users: [],
      pending: [],
      campaigns_meta: [],
      donations: [],
      nextPendingId: 1,
      nextMetaId: 1
    };
  }
}

function writeDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

/* ================== AUTH ================== */
const JWT_SECRET = process.env.JWT_SECRET || "HIVEFUND_SECRET";

function makeToken(user) {
  return jwt.sign(
    { email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer "))
    return res.status(401).json({ error: "unauthenticated" });

  try {
    req.user = jwt.verify(auth.replace("Bearer ", ""), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "admin_only" });
  next();
}

/* ================== AUTH ROUTES ================== */
app.post("/api/auth/signup", (req, res) => {
  const db = readDB();
  const { email, password, role } = req.body;

  if (db.users.find(u => u.email === email))
    return res.status(400).json({ error: "email_exists" });

  db.users.push({
    email,
    password,
    role: role || "user",
    profile: { name: "", phone: "", photo: "" },
    wallet: { ethAddress: "" }
  });

  writeDB(db);
  res.json({ token: makeToken({ email, role }), role });
});

app.post("/api/auth/login", (req, res) => {
  const db = readDB();
  const { email, password } = req.body;

  const user = db.users.find(
    u => u.email === email && u.password === password
  );
  if (!user) return res.status(400).json({ error: "invalid_credentials" });

  res.json({ token: makeToken(user), role: user.role });
});

/* ================== FILE UPLOAD ================== */
const storage = multer.diskStorage({
  destination(req, file, cb) {
    if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"));
  }
});
const upload = multer({ storage });

/* ================== CREATE CAMPAIGN ================== */
app.post(
  "/api/pending",
  requireAuth,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "documents", maxCount: 5 }
  ]),
  async (req, res) => {
    try {
      const { title, description, goal_inr, deadline } = req.body;
      const db = readDB();

      const docs = req.files?.documents || [];
      const ocr = docs.length
        ? await extractTextFromDocuments(docs)
        : { ocrText: "", documentCount: 0 };

      const ai = extractAIFeatures(description || "", ocr.ocrText || "");
      const fraud = getFraudProbabilityFromText(`${title} ${description}`);
      const trust = calculateTrustScore(ai, fraud, ocr.documentCount);
      const summary = generateAISummary({ title, description, ai, trust, ocr });

      db.pending.push({
        id: db.nextPendingId++,
        title,
        description,
        imageUrl: req.files?.image?.[0]
          ? `http://localhost:${PORT}/uploads/${req.files.image[0].filename}`
          : "",
        creatorEmail: req.user.email,
        goal_inr: Number(goal_inr),
        raised_inr: 0,
        deadline,
        status: "pending",
        ai,
        fraud_probability: fraud,
        trust,
        ai_summary: summary,
        documents_count: ocr.documentCount,
        created_at: new Date().toISOString()
      });

      writeDB(db);
      res.json({ ok: true });
    } catch (err) {
      console.error("CREATE ERROR", err);
      res.status(500).json({ error: "server_error" });
    }
  }
);

/* ================== ADMIN ================== */
app.get("/api/pending", requireAuth, requireAdmin, (req, res) => {
  res.json(readDB().pending);
});

app.post("/api/pending/:id/approve", requireAuth, requireAdmin, (req, res) => {
  const db = readDB();
  const p = db.pending.find(x => x.id === Number(req.params.id));
  if (!p) return res.status(404).json({ error: "not_found" });

  db.campaigns_meta.push({
    metaId: db.nextMetaId++,
    ...p,
    status: "approved",
    raised_inr: 0,
    approved_at: new Date().toISOString()
  });

  db.pending = db.pending.filter(x => x.id !== p.id);
  writeDB(db);
  res.json({ ok: true });
});

/* ================== PUBLIC ================== */
app.get("/api/approved", (req, res) => {
  const db = readDB();

  const campaigns = db.campaigns_meta.map(c => {
    const total = db.donations
      .filter(d => String(d.campaignId) === String(c.metaId))
      .reduce((s, d) => s + Number(d.amountINR), 0);

    return { ...c, raised_inr: total };
  });

  res.json(campaigns);
});

/* ================== RAZORPAY ================== */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/* ================== BLOCKCHAIN ================== */
/* ================== BLOCKCHAIN ================== */
let vault = null;

if (process.env.BLOCKCHAIN_ENABLED === "true") {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  vault = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    ["function deposit() payable"],
    wallet
  );
}
/* ================== DONATION ================== */
app.post("/api/donate/create-order", requireAuth, async (req, res) => {
  const order = await razorpay.orders.create({
    amount: req.body.amountINR * 100,
    currency: "INR",
    receipt: "hf_" + Date.now()
  });

  res.json({ order, key: process.env.RAZORPAY_KEY_ID });
});

app.post("/api/donate/verify", requireAuth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      campaignId,
      amountINR
    } = req.body;

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (expected !== razorpay_signature)
      return res.status(400).json({ error: "invalid_signature" });

    const db = readDB();

    db.donations.push({
      campaignId: String(campaignId),
      amountINR: Number(amountINR),
      donor: req.user.email,
      paymentId: razorpay_payment_id,
      created_at: new Date().toISOString()
    });

    // Dummy INR → ETH (safe precision)
if (process.env.BLOCKCHAIN_ENABLED === "true" && vault) {
  const wei = BigInt(Math.floor((amountINR / 300000) * 1e18));
  await vault.deposit({ value: wei });
}

    writeDB(db);
    res.json({ ok: true });
  } catch (err) {
    console.error("VERIFY ERROR", err);
    res.status(500).json({ error: "server_error" });
  }
});

/* ================== DASHBOARD ================== */
app.get("/api/me", requireAuth, (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.email === req.user.email);
  res.json(user);
});

app.get("/api/me/donations", requireAuth, (req, res) => {
  const db = readDB();
  res.json(db.donations.filter(d => d.donor === req.user.email));
});

app.get("/api/me/campaigns", requireAuth, (req, res) => {
  const db = readDB();
  res.json(db.campaigns_meta.filter(c => c.creatorEmail === req.user.email));
});

app.post("/api/creator/wallet", requireAuth, (req, res) => {
  const { wallet } = req.body;
  if (!wallet || !wallet.startsWith("0x"))
    return res.status(400).json({ error: "Invalid wallet" });

  const db = readDB();
  const campaigns = db.campaigns_meta.filter(
    c => c.creatorEmail === req.user.email
  );

  campaigns.forEach(c => {
    c.wallet = wallet;
  });

  writeDB(db);
  res.json({ ok: true });
});

app.get("/api/donor/certificate", requireAuth, (req, res) => {
  const db = readDB();
  const donations = db.donations.filter(
    d => d.donor === req.user.email
  );

  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=donation_certificate.pdf");

  doc.pipe(res);
  doc.fontSize(20).text("Donation Certificate\n\n");

  donations.forEach(d => {
    doc.fontSize(12).text(
      `Campaign ID: ${d.campaignId}\nAmount: ₹${d.amountINR}\nDate: ${new Date(d.created_at).toDateString()}\n\n`
    );
  });

  doc.end();
});

app.post("/api/campaign/:id/withdraw", requireAuth, async (req, res) => {
  try {
    const campaignId = Number(req.params.id);
    const db = readDB();

    const campaign = db.campaigns_meta.find(
      c => c.metaId === campaignId
    );

    if (!campaign)
      return res.status(404).json({ error: "Campaign not found" });

    if (campaign.creatorEmail !== req.user.email)
      return res.status(403).json({ error: "Unauthorized" });

    if (campaign.withdrawn)
      return res.status(400).json({ error: "Already withdrawn" });

    const now = new Date();
    const deadline = new Date(campaign.deadline);

    const goalReached = campaign.raised_inr >= campaign.goal_inr;
    const deadlinePassed = now > deadline;

    if (!goalReached && !deadlinePassed)
      return res.status(400).json({ error: "Withdrawal not allowed yet" });

    if (!campaign.wallet)
      return res.status(400).json({ error: "Wallet not set" });

    const ETH_RATE = 300000;
    const eth = (campaign.raised_inr / ETH_RATE).toFixed(6);

    await vault.withdraw(
      campaign.wallet,
      ethers.parseEther(eth)
    );

    campaign.withdrawn = true;
    campaign.withdrawn_at = new Date().toISOString();

    writeDB(db);
    res.json({ ok: true });
  } catch (err) {
    console.error("WITHDRAW ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});


/* ================== START ================== */
app.listen(PORT, () =>
  console.log(`✅ HiveFund backend running on http://localhost:${PORT}`)
);
