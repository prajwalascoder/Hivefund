/**
 * seed.js — Migrate db.json → MongoDB Atlas
 *
 * Reads the flat-file db.json, converts local images to Base64,
 * auto-assigns categories based on campaign content, and inserts
 * everything into the MongoDB Atlas cluster.
 *
 * Usage:
 *   node seed.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import User from "./models/User.js";
import Campaign from "./models/Campaign.js";
import Donation from "./models/Donation.js";
import Counter from "./models/Counter.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ──────────── Category Detection ──────────── */

const CATEGORY_KEYWORDS = {
  "Medical": [
    "hospital", "surgery", "treatment", "medical", "health", "kidney",
    "cancer", "disease", "doctor", "medicine", "clinic", "therapy",
    "dialysis", "operation", "emergency medical", "ICU", "patient",
    "heart", "transplant", "blood", "ambulance"
  ],
  "Education": [
    "school", "college", "university", "tuition", "scholarship",
    "education", "student", "learn", "course", "study", "books",
    "exam", "degree", "teacher"
  ],
  "Emergency": [
    "emergency", "urgent", "crisis", "immediate", "sudden",
    "accident", "fire", "flood", "earthquake"
  ],
  "Community": [
    "community", "neighborhood", "village", "town", "local",
    "public", "society", "civic", "welfare"
  ],
  "Environment": [
    "environment", "climate", "tree", "forest", "pollution",
    "clean water", "ocean", "wildlife", "sustainable", "green"
  ],
  "Animal Welfare": [
    "animal", "pet", "dog", "cat", "rescue", "shelter",
    "wildlife", "veterinary", "stray"
  ],
  "Technology": [
    "technology", "tech", "software", "hardware", "app",
    "digital", "AI", "blockchain", "coding", "startup"
  ],
  "Creative & Arts": [
    "art", "music", "film", "dance", "theater", "creative",
    "painting", "photography", "design"
  ],
  "Sports": [
    "sports", "football", "cricket", "basketball", "athlete",
    "tournament", "team", "training", "olympics"
  ],
  "Religious & Spiritual": [
    "temple", "church", "mosque", "prayer", "religious",
    "spiritual", "pilgrimage", "charity"
  ],
  "Startup & Business": [
    "startup", "business", "entrepreneur", "company",
    "venture", "product", "market", "launch"
  ],
  "Disaster Relief": [
    "disaster", "relief", "earthquake", "flood", "cyclone",
    "tsunami", "hurricane", "rescue", "rehabilitation"
  ]
};

function detectCategory(title, description) {
  const text = `${title} ${description}`.toLowerCase();

  let bestCategory = "Other";
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase())) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

/* ──────────── Image → Base64 ──────────── */

const MIME_MAP = {
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif":  "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg":  "image/svg+xml"
};

function loadImageAsBase64(imageUrl) {
  if (!imageUrl) return { imageData: "", imageMime: "" };

  try {
    // Extract filename from URL like http://localhost:4001/uploads/filename.ext
    let filename = "";
    if (imageUrl.includes("/uploads/")) {
      filename = imageUrl.split("/uploads/").pop();
    } else {
      return { imageData: "", imageMime: "" };
    }

    const filePath = path.join(__dirname, "uploads", filename);

    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠ Image file not found: ${filePath}`);
      return { imageData: "", imageMime: "" };
    }

    const ext = path.extname(filename).toLowerCase();
    const mime = MIME_MAP[ext] || "application/octet-stream";
    const buffer = fs.readFileSync(filePath);
    const base64 = buffer.toString("base64");

    console.log(`  📷 Loaded image: ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);

    return { imageData: base64, imageMime: mime };
  } catch (err) {
    console.warn(`  ⚠ Failed to load image: ${err.message}`);
    return { imageData: "", imageMime: "" };
  }
}

/* ──────────── Main Seed ──────────── */

async function seed() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error("❌ MONGO_URI not set in .env");
    process.exit(1);
  }

  console.log("🔌 Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected!\n");

  /* ---- Read db.json ---- */
  const dbPath = path.join(__dirname, "db.json");
  if (!fs.existsSync(dbPath)) {
    console.error("❌ db.json not found at", dbPath);
    process.exit(1);
  }

  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  console.log(`📄 db.json loaded:`);
  console.log(`   Users: ${db.users?.length || 0}`);
  console.log(`   Pending: ${db.pending?.length || 0}`);
  console.log(`   Approved: ${db.campaigns_meta?.length || 0}`);
  console.log(`   Donations: ${db.donations?.length || 0}\n`);

  /* ---- Clear existing data ---- */
  console.log("🧹 Clearing existing collections...");
  await User.deleteMany({});
  await Campaign.deleteMany({});
  await Donation.deleteMany({});
  await Counter.deleteMany({});
  console.log("   Done.\n");

  /* ---- Seed Users ---- */
  console.log("👤 Seeding users...");
  for (const u of (db.users || [])) {
    await User.create({
      email:       u.email,
      password:    u.password,
      role:        u.role || "user",
      isAnonymous: !!u.isAnonymous,
      profile: {
        name:    u.profile?.name || "",
        phone:   u.profile?.phone || "",
        photo:   u.profile?.photo || "",
        gender:  u.profile?.gender || "",
        dob:     u.profile?.dob || "",
        country: u.profile?.country || "",
        mobile:  u.profile?.mobile || ""
      },
      wallet: {
        ethAddress: u.wallet?.ethAddress || ""
      },
      bankAccount: u.bankAccount || {}
    });
    console.log(`   ✅ ${u.email} (${u.role || "user"})`);
  }

  /* ---- Seed Pending Campaigns ---- */
  console.log("\n📝 Seeding pending campaigns...");
  for (const p of (db.pending || [])) {
    const category = detectCategory(p.title, p.description);
    const { imageData, imageMime } = loadImageAsBase64(p.imageUrl);

    await Campaign.create({
      legacyId:     p.id,
      title:        p.title,
      description:  p.description,
      category,
      imageUrl:     p.imageUrl || "",
      imageData,
      imageMime,
      creatorEmail: p.creatorEmail,
      goal_inr:     p.goal_inr,
      raised_inr:   p.raised_inr || 0,
      deadline:     p.deadline || "",
      status:       "pending",
      ai:           p.ai || {},
      fraud_probability: p.fraud_probability || 0,
      trust:        p.trust || {},
      ai_summary:   p.ai_summary || "",
      documents_count: p.documents_count || 0,
      created_at:   p.created_at || new Date().toISOString()
    });
    console.log(`   ✅ [PENDING] "${p.title}" → Category: ${category}`);
  }

  /* ---- Seed Approved Campaigns ---- */
  console.log("\n🏆 Seeding approved campaigns...");
  for (const c of (db.campaigns_meta || [])) {
    const category = detectCategory(c.title, c.description);
    const { imageData, imageMime } = loadImageAsBase64(c.imageUrl);

    await Campaign.create({
      legacyId:     c.id,
      legacyMetaId: c.metaId,
      title:        c.title,
      description:  c.description,
      category,
      imageUrl:     c.imageUrl || "",
      imageData,
      imageMime,
      creatorEmail: c.creatorEmail,
      goal_inr:     c.goal_inr,
      raised_inr:   c.raised_inr || 0,
      deadline:     c.deadline || "",
      status:       "approved",
      ai:           c.ai || {},
      fraud_probability: c.fraud_probability || 0,
      trust:        c.trust || {},
      ai_summary:   c.ai_summary || "",
      documents_count: c.documents_count || 0,
      wallet:       c.wallet || "",
      withdrawn:    c.withdrawn || false,
      withdrawnAt:  c.withdrawnAt || c.withdrawn_at || "",
      withdrawMethod: c.withdrawMethod || "",
      approved_at:  c.approved_at || "",
      created_at:   c.created_at || new Date().toISOString()
    });
    console.log(`   ✅ [APPROVED] "${c.title}" → Category: ${category}`);
  }

  /* ---- Seed Donations ---- */
  console.log("\n💰 Seeding donations...");
  for (const d of (db.donations || [])) {
    await Donation.create({
      campaignId:  d.campaignId,
      amountINR:   d.amountINR,
      donor:       d.donor,
      paymentId:   d.paymentId || "",
      isAnonymous: !!d.isAnonymous,
      created_at:  d.created_at || new Date().toISOString()
    });
  }
  console.log(`   ✅ ${db.donations?.length || 0} donations inserted`);

  /* ---- Set Counters ---- */
  console.log("\n🔢 Setting counters...");
  await Counter.findByIdAndUpdate("pendingId", { seq: db.nextPendingId || 45 }, { upsert: true });
  await Counter.findByIdAndUpdate("metaId", { seq: db.nextMetaId || 13 }, { upsert: true });
  console.log(`   pendingId → ${db.nextPendingId || 45}`);
  console.log(`   metaId    → ${db.nextMetaId || 13}`);

  /* ---- Summary ---- */
  const totalUsers     = await User.countDocuments();
  const totalCampaigns = await Campaign.countDocuments();
  const totalDonations = await Donation.countDocuments();

  console.log("\n" + "=".repeat(50));
  console.log("🎉 SEED COMPLETE!");
  console.log("=".repeat(50));
  console.log(`   Users:     ${totalUsers}`);
  console.log(`   Campaigns: ${totalCampaigns}`);
  console.log(`   Donations: ${totalDonations}`);

  /* ---- Category Breakdown ---- */
  const categories = await Campaign.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  console.log("\n📂 Category Breakdown:");
  for (const cat of categories) {
    console.log(`   ${cat._id}: ${cat.count}`);
  }

  console.log("\n✅ All done. Disconnecting...");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
