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
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/* ===== Models ===== */
import User from "./models/User.js";
import Campaign, { CATEGORIES } from "./models/Campaign.js";
import Donation from "./models/Donation.js";
import Counter from "./models/Counter.js";
import Notification from "./models/Notification.js";

/* ===== AI / ML (DO NOT TOUCH) ===== */
import { extractTextFromDocuments } from "./services/ocrService.js";
import { extractAIFeatures } from "./services/aiFeatureService.js";
import { getFraudProbabilityFromText } from "./services/mlService.js";
import { calculateTrustScore } from "./services/trustScoreService.js";
import { generateAISummary } from "./services/aiSummaryService.js";

dotenv.config();
console.log("Loaded ENV from:", process.cwd());
console.log("BLOCKCHAIN_ENABLED:", process.env.BLOCKCHAIN_ENABLED);


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
  const auth = req.headers.authorization || (req.query.token ? `Bearer ${req.query.token}` : "");
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
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "email_exists" });

    const user = await User.create({
      email,
      password,
      role: role || "user",
      profile: { name: "", phone: "", photo: "" },
      wallet: { ethAddress: "" }
    });

    res.json({ token: makeToken(user), role: user.role });
  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(400).json({ error: "invalid_credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: "invalid_credentials" });

    res.json({ token: makeToken(user), role: user.role });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
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
      const { title, description, goal_inr, deadline, category } = req.body;

      // Validate deadline is not in the past
      if (deadline) {
        const today = new Date().toISOString().split("T")[0];
        if (deadline <= today) {
          return res.status(400).json({ error: "Deadline must be a future date" });
        }
      }

      const docs = req.files?.documents || [];
      const ocr = docs.length
        ? await extractTextFromDocuments(docs)
        : { ocrText: "", documentCount: 0 };

      const ai = extractAIFeatures(description || "", ocr.ocrText || "");
      const fraud = getFraudProbabilityFromText(`${title} ${description}`);
      const trust = calculateTrustScore(ai, fraud, ocr.documentCount);
      const summary = generateAISummary({ title, description, ai, trust, ocr });

      // Handle image
      let imageUrl = "";
      let imageData = "";
      let imageMime = "";

      if (req.files?.image?.[0]) {
        const imgFile = req.files.image[0];
        imageUrl = `http://localhost:${PORT}/uploads/${imgFile.filename}`;

        // Also store as Base64 in MongoDB
        try {
          const buffer = fs.readFileSync(imgFile.path);
          imageData = buffer.toString("base64");
          imageMime = imgFile.mimetype;
        } catch (e) {
          console.warn("Could not read image for base64:", e.message);
        }
      }

      const pendingId = await Counter.getNextSequence("pendingId");

      await Campaign.create({
        legacyId: pendingId,
        title,
        description,
        category: CATEGORIES.includes(category) ? category : "Other",
        imageUrl,
        imageData,
        imageMime,
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

      res.json({ ok: true });
    } catch (err) {
      console.error("CREATE ERROR", err);
      res.status(500).json({ error: "server_error" });
    }
  }
);

/* ================== ADMIN ================== */
app.get("/api/pending", requireAuth, requireAdmin, async (req, res) => {
  try {
    const pending = await Campaign.find({ status: "pending" })
      .select("-imageData")
      .sort({ created_at: -1 });
    res.json(pending);
  } catch (err) {
    console.error("FETCH PENDING ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});

app.post("/api/pending/:id/approve", requireAuth, requireAdmin, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: "not_found" });

    const metaId = await Counter.getNextSequence("metaId");

    campaign.status = "approved";
    campaign.legacyMetaId = metaId;
    campaign.approved_at = new Date().toISOString();
    await campaign.save();

    // Notify the creator
    await Notification.create({
      userEmail: campaign.creatorEmail,
      type: "campaign_approved",
      severity: "success",
      title: "Campaign Approved!",
      message: `Your campaign "${campaign.title}" has been approved and is now live on HiveFund.`,
      metadata: { campaignTitle: campaign.title, metaId }
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("APPROVE ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});

app.post("/api/pending/:id/reject", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: "not_found" });

    const campaignTitle = campaign.title;
    const creatorEmail = campaign.creatorEmail;

    // Delete the campaign from the database
    await Campaign.findByIdAndDelete(req.params.id);

    // Create a persistent notification for the creator
    await Notification.create({
      userEmail: creatorEmail,
      type: "campaign_rejected",
      severity: "error",
      title: "Campaign Rejected",
      message: reason
        ? `Your campaign "${campaignTitle}" was rejected. Reason: ${reason}`
        : `Your campaign "${campaignTitle}" was rejected. It did not meet our verification standards. Please review and resubmit.`,
      metadata: { campaignTitle, reason: reason || "" }
    });

    console.log(`❌ Campaign rejected & deleted: "${campaignTitle}" (creator: ${creatorEmail})`);
    res.json({ ok: true });
  } catch (err) {
    console.error("REJECT ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});

/* ================== CATEGORIES ================== */
app.get("/api/categories", (req, res) => {
  res.json(CATEGORIES);
});

/* ================== PUBLIC ================== */
app.get("/api/approved", async (req, res) => {
  try {
    const { category } = req.query;
    const now = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const filter = {
      status: "approved",
      // Only show campaigns whose deadline is today or in the future
      $or: [
        { deadline: { $gte: now } },
        { deadline: "" },
        { deadline: { $exists: false } }
      ]
    };
    if (category && category !== "All") filter.category = category;

    // Exclude heavy imageData from query (saves ~2MB per campaign)
    const campaigns = await Campaign.find(filter)
      .select("-imageData")
      .sort({ created_at: -1 })
      .lean();

    // Single batch aggregation for all donation totals (instead of N queries)
    const campaignIds = campaigns.map(c => String(c.legacyMetaId || c._id));
    const donationTotals = await Donation.aggregate([
      { $match: { campaignId: { $in: campaignIds } } },
      { $group: { _id: "$campaignId", total: { $sum: "$amountINR" } } }
    ]);
    const totalMap = Object.fromEntries(donationTotals.map(d => [d._id, d.total]));

    const results = campaigns.map(c => {
      const cId = String(c.legacyMetaId || c._id);
      c.metaId = c.legacyMetaId || c._id;
      c.raised_inr = totalMap[cId] || 0;
      return c;
    });

    res.json(results);
  } catch (err) {
    console.error("FETCH APPROVED ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});

/* ================== SINGLE CAMPAIGN (for Donate page) ================== */
app.get("/api/campaign/:id", async (req, res) => {
  try {
    const paramId = req.params.id;

    const campaign = await Campaign.findOne({
      $or: [
        ...(isNaN(Number(paramId)) ? [] : [{ legacyMetaId: Number(paramId) }]),
        ...(mongoose.isValidObjectId(paramId) ? [{ _id: paramId }] : [])
      ],
      status: "approved"
    }).select("-imageData").lean();

    if (!campaign) return res.status(404).json({ error: "not_found" });

    // Live raised_inr
    const cId = String(campaign.legacyMetaId || campaign._id);
    const agg = await Donation.aggregate([
      { $match: { campaignId: cId } },
      { $group: { _id: null, total: { $sum: "$amountINR" } } }
    ]);
    campaign.raised_inr = agg[0]?.total || 0;
    campaign.metaId = campaign.legacyMetaId || campaign._id;

    // Recent donors
    const recentDonors = await Donation.find({ campaignId: cId })
      .sort({ created_at: -1 })
      .limit(10)
      .lean();
    campaign.recentDonors = recentDonors;

    res.json(campaign);
  } catch (err) {
    console.error("FETCH CAMPAIGN ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});

/* ================== CAMPAIGN IMAGE (serve from DB) ================== */
app.get("/api/campaign/:id/image", async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).select("imageData imageMime imageUrl");
    if (!campaign) return res.status(404).json({ error: "not_found" });

    if (campaign.imageData && campaign.imageMime) {
      const buffer = Buffer.from(campaign.imageData, "base64");
      res.setHeader("Content-Type", campaign.imageMime);
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.send(buffer);
    }

    // Fallback to URL redirect
    if (campaign.imageUrl) return res.redirect(campaign.imageUrl);

    res.status(404).json({ error: "no_image" });
  } catch (err) {
    res.status(500).json({ error: "server_error" });
  }
});

/* ================== RAZORPAY ================== */
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
  console.log("✅ Razorpay initialized");
} else {
  console.warn("⚠️  Razorpay keys not found — payment routes will be disabled");
}

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
  if (!razorpay) return res.status(503).json({ error: "Razorpay not configured" });
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

    // 1. Save donation to MongoDB FIRST (critical — must not be lost)
    const donation = await Donation.create({
      campaignId: String(campaignId),
      amountINR: Number(amountINR),
      donor: req.user.email,
      paymentId: razorpay_payment_id,
      isAnonymous: !!req.body.isAnonymous,
      created_at: new Date().toISOString()
    });

    console.log(`\n💰 DONATION SAVED: ₹${amountINR} → Campaign ${campaignId} by ${req.user.email} (${razorpay_payment_id})`);

    // 2. Update campaign's raised_inr field (denormalized for fast reads)
    const campaign = await Campaign.findOne({
      $or: [
        { legacyMetaId: isNaN(Number(campaignId)) ? -1 : Number(campaignId) },
        ...(mongoose.isValidObjectId(campaignId) ? [{ _id: campaignId }] : [])
      ]
    });

    if (campaign) {
      // Recompute total from all donations
      const agg = await Donation.aggregate([
        { $match: { campaignId: String(campaignId) } },
        { $group: { _id: null, total: { $sum: "$amountINR" } } }
      ]);
      campaign.raised_inr = agg[0]?.total || 0;
      await campaign.save();
      console.log(`📊 Campaign "${campaign.title}" raised_inr updated to ₹${campaign.raised_inr}`);
    }

    // 3. Blockchain deposit (non-blocking — don't fail the donation if blockchain errors)
    if (process.env.BLOCKCHAIN_ENABLED === "true" && vault) {
      try {
        console.log("🔗 Blockchain donation started...");

        const ETH_RATE = 300000;
        const ethAmount = amountINR / ETH_RATE;
        const weiAmount = ethers.parseEther(ethAmount.toFixed(6));

        console.log("💰 INR:", amountINR);
        console.log("💱 ETH:", ethAmount);
        console.log("⚙️ Wei:", weiAmount.toString());

        const gasEstimate = await vault.deposit.estimateGas({
          value: weiAmount
        });

        const tx = await vault.deposit({
          value: weiAmount,
          gasLimit: gasEstimate
        });

        console.log("🚀 TX Hash:", tx.hash);

        const receipt = await tx.wait();

        console.log(`
====== BLOCKCHAIN TRANSACTION ======
Campaign ID: ${campaignId}
Donor: ${req.user.email}
INR: ${amountINR}
ETH: ${ethAmount}
Block: ${receipt.blockNumber}
Gas Used: ${receipt.gasUsed.toString()}
====================================
`);
      } catch (bcErr) {
        // Log blockchain error but DON'T fail the donation
        console.error("⚠️ Blockchain deposit failed (donation still saved):", bcErr.message);
      }
    }

    res.json({ ok: true, donationId: donation._id });
  } catch (err) {
    console.error("VERIFY ERROR", err);
    res.status(500).json({ error: "server_error" });
  }
});

/* ================== DASHBOARD ================== */
app.get("/api/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "server_error" });
  }
});

app.get("/api/me/donations", requireAuth, async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user.email }).sort({ created_at: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ error: "server_error" });
  }
});

app.get("/api/me/campaigns", requireAuth, async (req, res) => {
  try {
    const campaigns = await Campaign.find({
      creatorEmail: req.user.email,
      status: "approved"
    }).select("-imageData").sort({ created_at: -1 });
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: "server_error" });
  }
});

app.post("/api/creator/wallet", requireAuth, async (req, res) => {
  try {
    const { wallet } = req.body;
    if (!wallet || !wallet.startsWith("0x"))
      return res.status(400).json({ error: "Invalid wallet" });

    await Campaign.updateMany(
      { creatorEmail: req.user.email },
      { $set: { wallet } }
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "server_error" });
  }
});

app.get("/api/donor/certificate", requireAuth, async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user.email });

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
  } catch (err) {
    res.status(500).json({ error: "server_error" });
  }
});

app.post("/api/campaign/:id/withdraw", requireAuth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      $or: [
        { legacyMetaId: Number(req.params.id) },
        { _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : null }
      ]
    });

    if (!campaign)
      return res.status(404).json({ error: "Campaign not found" });

    if (campaign.creatorEmail !== req.user.email)
      return res.status(403).json({ error: "Unauthorized" });

    if (campaign.withdrawn)
      return res.status(400).json({ error: "Already withdrawn" });

    const now = new Date();
    const deadline = new Date(campaign.deadline);

    // Get raised amount from donations
    const agg = await Donation.aggregate([
      { $match: { campaignId: String(campaign.legacyMetaId || campaign._id) } },
      { $group: { _id: null, total: { $sum: "$amountINR" } } }
    ]);
    const raisedINR = agg[0]?.total || 0;

    const goalReached = raisedINR >= campaign.goal_inr;
    const deadlinePassed = now > deadline;

    if (!goalReached && !deadlinePassed)
      return res.status(400).json({ error: "Withdrawal not allowed yet" });

    if (!campaign.wallet)
      return res.status(400).json({ error: "Wallet not set" });

    const ETH_RATE = 300000;
    const eth = (raisedINR / ETH_RATE).toFixed(6);

    console.log("🔐 Withdrawal started...");

    const tx = await vault.withdraw(
      campaign.wallet,
      ethers.parseEther(eth)
    );

    console.log("🚀 Withdraw TX:", tx.hash);

    const receipt = await tx.wait();

    console.log("✅ Withdraw Confirmed at Block:", receipt.blockNumber);
    console.log("⛽ Gas Used:", receipt.gasUsed.toString());

    campaign.withdrawn = true;
    campaign.withdrawnAt = new Date().toISOString();
    await campaign.save();

    res.json({ ok: true });
  } catch (err) {
    console.error("WITHDRAW ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});


/* ================== DASHBOARD ROUTES ================== */
app.get("/api/dashboard/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ error: "user_not_found" });

    const donorDonations = await Donation.find({ donor: req.user.email })
      .sort({ created_at: -1 });

    const totalDonated = donorDonations.reduce((sum, d) => sum + Number(d.amountINR), 0);

    const myCampaigns = await Campaign.find({
      creatorEmail: req.user.email,
      status: { $in: ["approved", "expired"] }
    }).select("-imageData").sort({ created_at: -1 }).lean();

    // Batch-compute raised amounts for creator's campaigns
    const myCampIds = myCampaigns.map(c => String(c.legacyMetaId || c._id));
    const raisedAgg = await Donation.aggregate([
      { $match: { campaignId: { $in: myCampIds } } },
      { $group: { _id: "$campaignId", total: { $sum: "$amountINR" } } }
    ]);
    const raisedMap = Object.fromEntries(raisedAgg.map(d => [d._id, d.total]));

    // Enrich campaigns with live raised_inr
    for (const c of myCampaigns) {
      const cId = String(c.legacyMetaId || c._id);
      c.raised_inr = raisedMap[cId] || c.raised_inr || 0;
      c.metaId = c.legacyMetaId || c._id;
    }

    const totalRaised = myCampaigns.reduce((sum, c) => sum + Number(c.raised_inr), 0);

    const analytics = myCampaigns.map(c => ({
      title: c.title,
      goal: c.goal_inr,
      raised: c.raised_inr,
      views: (c.documents_count || 1) * Math.floor(Math.random() * 50 + 10), // mock metric
      status: c.status,
      deadline: c.deadline
    }));

    // Batch-fetch campaign titles for all donations (single query instead of N)
    const donationCampaignIds = [...new Set(donorDonations.map(d => d.campaignId))];
    const relatedCampaigns = await Campaign.find({
      $or: donationCampaignIds.flatMap(id => [
        ...(isNaN(Number(id)) ? [] : [{ legacyMetaId: Number(id) }]),
        ...(mongoose.isValidObjectId(id) ? [{ _id: id }] : [])
      ])
    }).select("title legacyMetaId").lean();

    const campTitleMap = {};
    for (const camp of relatedCampaigns) {
      if (camp.legacyMetaId) campTitleMap[String(camp.legacyMetaId)] = camp.title;
      campTitleMap[String(camp._id)] = camp.title;
    }

    const enrichedDonations = donorDonations.map(d => {
      const dObj = d.toObject();
      dObj.campaignTitle = campTitleMap[String(d.campaignId)] || "Unknown Campaign";
      return dObj;
    });

    // --- Detect expired campaigns & build notifications ---
    const now = new Date();
    const notifications = [];

    for (const c of myCampaigns) {
      const deadlinePassed = c.deadline && now > new Date(c.deadline);
      if (deadlinePassed && !c.withdrawn) {
        const cId = String(c.legacyMetaId || c._id);
        const raised = raisedMap[cId] || 0;

        notifications.push({
          type: "deadline_expired",
          severity: "warning",
          campaignId: c.legacyMetaId || c._id,
          title: c.title,
          message: raised > 0
            ? `Your campaign "${c.title}" has expired. ₹${raised.toLocaleString()} was raised and is being auto-withdrawn to your account.`
            : `Your campaign "${c.title}" has expired with no donations raised.`,
          raised,
          deadline: c.deadline,
          autoWithdrawn: !!c.autoWithdrawn
        });
      }

      if (c.withdrawn) {
        notifications.push({
          type: "withdrawal_complete",
          severity: "success",
          campaignId: c.legacyMetaId || c._id,
          title: c.title,
          message: `Funds from "${c.title}" have been withdrawn via ${c.withdrawMethod || "auto"}.`,
          deadline: c.deadline
        });
      }
    }

    // --- Merge persistent notifications from DB (rejections, approvals, etc.) ---
    const dbNotifications = await Notification.find({ userEmail: req.user.email })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    for (const n of dbNotifications) {
      notifications.push({
        _id: n._id,
        type: n.type,
        severity: n.severity,
        title: n.title,
        message: n.message,
        read: n.read,
        createdAt: n.createdAt,
        metadata: n.metadata
      });
    }

    res.json({
      user: {
        email: user.email,
        profile: {
          name: user.profile?.name || "",
          gender: user.profile?.gender || "",
          dob: user.profile?.dob || "",
          country: user.profile?.country || "",
          mobile: user.profile?.mobile || ""
        },
        isAnonymous: !!user.isAnonymous,
        wallet: user.wallet?.ethAddress || "",
        bankAccount: user.bankAccount || {}
      },
      totalDonated,
      totalRaised,
      donations: enrichedDonations,
      campaigns: myCampaigns,
      analytics,
      notifications
    });
  } catch (err) {
    console.error("DASHBOARD ME ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});

app.put("/api/dashboard/preferences", requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ error: "not_found" });

    const { isAnonymous, walletAddress, bankAccount, profile } = req.body;

    if (isAnonymous !== undefined) user.isAnonymous = isAnonymous;
    if (walletAddress !== undefined) {
      user.wallet = user.wallet || {};
      user.wallet.ethAddress = walletAddress;
    }
    if (bankAccount !== undefined) user.bankAccount = bankAccount;
    if (profile !== undefined) {
      user.profile = { ...user.profile.toObject(), ...profile };
    }

    await user.save();
    res.json({ ok: true, user });
  } catch (err) {
    console.error("PREFERENCES ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});

app.get("/api/dashboard/receipt/:paymentId", requireAuth, async (req, res) => {
  try {
    const donation = await Donation.findOne({
      paymentId: req.params.paymentId,
      donor: req.user.email
    });
    if (!donation) return res.status(404).json({ error: "not_found" });

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Receipt_${donation.paymentId}.pdf`);

    doc.pipe(res);
    doc.fontSize(24).text("HiveFund Donation Receipt", { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text(`Payment ID: ${donation.paymentId}`);

    const donorUser = await User.findOne({ email: donation.donor });
    const donorName = donorUser?.profile?.name || donation.donor;

    doc.text(`Date: ${new Date(donation.created_at).toLocaleString()}`);
    doc.text(`Amount: INR ${donation.amountINR}`);
    doc.text(`Campaign ID: ${donation.campaignId}`);
    doc.text(`Donor: ${donation.isAnonymous ? "Anonymous User" : donorName}`);
    doc.moveDown();
    doc.fontSize(12).text("Thank you for your generous contribution!");
    doc.end();
  } catch (err) {
    res.status(500).json({ error: "server_error" });
  }
});

app.post("/api/dashboard/withdraw", requireAuth, async (req, res) => {
  try {
    const { campaignId, method } = req.body;

    const campaign = await Campaign.findOne({
      $or: [
        { legacyMetaId: Number(campaignId) },
        { _id: mongoose.isValidObjectId(campaignId) ? campaignId : null }
      ]
    });

    if (!campaign) return res.status(404).json({ error: "not_found" });
    if (campaign.creatorEmail !== req.user.email) return res.status(403).json({ error: "forbidden" });
    if (campaign.withdrawn) return res.status(400).json({ error: "already_withdrawn" });

    // Get raised amount
    const agg = await Donation.aggregate([
      { $match: { campaignId: String(campaign.legacyMetaId || campaign._id) } },
      { $group: { _id: null, total: { $sum: "$amountINR" } } }
    ]);
    const raisedINR = agg[0]?.total || 0;

    const goalReached = raisedINR >= campaign.goal_inr;
    const deadlinePassed = new Date() > new Date(campaign.deadline);

    if (!goalReached && !deadlinePassed) {
      return res.status(400).json({ error: "Withdrawal not eligible (goal not reached and deadline not passed)" });
    }

    const user = await User.findOne({ email: req.user.email });

    if (method === "wallet") {
      const address = user.wallet?.ethAddress;
      if (!address) return res.status(400).json({ error: "no_wallet", message: "Please configure your wallet address in settings." });
      console.log(`Withdrawing ${raisedINR} to wallet ${address}`);
    } else if (method === "bank") {
      const bank = user.bankAccount;
      if (!bank || !bank.accountNumber) return res.status(400).json({ error: "no_bank", message: "Please configure your bank account in settings." });
      console.log(`Withdrawing ${raisedINR} to bank account ${bank.accountNumber}`);
    } else {
      return res.status(400).json({ error: "invalid_method" });
    }

    campaign.withdrawn = true;
    campaign.withdrawnAt = new Date().toISOString();
    campaign.withdrawMethod = method;
    await campaign.save();

    res.json({ ok: true, message: `Withdrawal successfully processed via ${method}` });
  } catch (err) {
    res.status(500).json({ error: "server_error" });
  }
});

/* ================== AUTO-WITHDRAW EXPIRED CAMPAIGNS ================== */
async function autoWithdrawExpired() {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Find approved campaigns that have expired and haven't been withdrawn
    const expiredCampaigns = await Campaign.find({
      status: "approved",
      withdrawn: { $ne: true },
      deadline: { $lt: todayStr, $ne: "" }
    }).select("-imageData");

    if (expiredCampaigns.length === 0) return;

    console.log(`\n⏰ Auto-withdraw: Found ${expiredCampaigns.length} expired campaign(s)`);

    for (const campaign of expiredCampaigns) {
      const cId = String(campaign.legacyMetaId || campaign._id);

      // Get raised amount
      const agg = await Donation.aggregate([
        { $match: { campaignId: cId } },
        { $group: { _id: null, total: { $sum: "$amountINR" } } }
      ]);
      const raisedINR = agg[0]?.total || 0;

      // Find the campaign creator
      const creator = await User.findOne({ email: campaign.creatorEmail });

      if (raisedINR > 0 && creator) {
        const method = creator.wallet?.ethAddress ? "wallet" : 
                       creator.bankAccount?.accountNumber ? "bank" : "pending";

        if (method !== "pending") {
          console.log(`   💸 Auto-withdrawing ₹${raisedINR} from "${campaign.title}" → ${method}`);
        } else {
          console.log(`   ⚠️  "${campaign.title}" expired with ₹${raisedINR} but creator has no wallet/bank configured`);
        }

        campaign.withdrawn = true;
        campaign.withdrawnAt = now.toISOString();
        campaign.withdrawMethod = method === "pending" ? "pending_setup" : method;
        campaign.autoWithdrawn = true;
        await campaign.save();
      } else if (raisedINR === 0) {
        // Mark as expired with no funds
        campaign.status = "expired";
        campaign.withdrawnAt = now.toISOString();
        await campaign.save();
        console.log(`   📋 "${campaign.title}" expired with ₹0 raised — marked as expired`);
      }
    }
  } catch (err) {
    console.error("Auto-withdraw error:", err);
  }
}

/* ================== CONNECT & START ================== */
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hivefund").then(() => {
  console.log("✅ Connected to MongoDB");

  // Run auto-withdraw on startup and every 5 minutes
  autoWithdrawExpired();
  setInterval(autoWithdrawExpired, 5 * 60 * 1000);

  app.listen(PORT, () =>
    console.log(`✅ HiveFund backend running on http://localhost:${PORT}`)
  );
}).catch(err => {
  console.error("❌ MongoDB connection failed:", err);
  process.exit(1);
});
