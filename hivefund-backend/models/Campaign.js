import mongoose from "mongoose";

const CATEGORIES = [
  "Medical",
  "Education",
  "Emergency",
  "Community",
  "Environment",
  "Animal Welfare",
  "Technology",
  "Creative & Arts",
  "Sports",
  "Religious & Spiritual",
  "Startup & Business",
  "Disaster Relief",
  "Other"
];

const campaignSchema = new mongoose.Schema({
  /* --- Core fields --- */
  title:        { type: String, required: true },
  description:  { type: String, default: "" },
  category:     { type: String, enum: CATEGORIES, default: "Other" },
  imageUrl:     { type: String, default: "" },

  /* Base64-encoded image for portability (MongoDB storage) */
  imageData:    { type: String, default: "" },
  imageMime:    { type: String, default: "" },

  creatorEmail: { type: String, required: true },
  goal_inr:     { type: Number, required: true },
  raised_inr:   { type: Number, default: 0 },
  deadline:     { type: String, default: "" },

  /* --- Workflow status --- */
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "expired"],
    default: "pending"
  },

  /* --- AI / ML trust fields --- */
  ai: {
    ocr_relevant:       { type: Boolean, default: false },
    ocr_suspicious:     { type: Boolean, default: false },
    emotional_blackmail: { type: Boolean, default: false },
    urgency_score:       { type: Number, default: 0 },
    emotional_score:     { type: Number, default: 0 },
    grammar_score:       { type: Number, default: 0 }
  },

  fraud_probability: { type: Number, default: 0 },

  trust: {
    stars:      { type: Number, default: 0 },
    score:      { type: Number, default: 0 },
    risk:       { type: String, default: "" },
    risk_level: { type: String, default: "" },
    reasons:    [String]
  },

  ai_summary:       { type: String, default: "" },
  documents_count:  { type: Number, default: 0 },

  /* --- Withdrawal --- */
  wallet:         { type: String, default: "" },
  withdrawn:      { type: Boolean, default: false },
  withdrawnAt:    { type: String, default: "" },
  withdrawMethod: { type: String, default: "" },
  autoWithdrawn:  { type: Boolean, default: false },

  /* --- Legacy IDs (from db.json migration) --- */
  legacyId:     { type: Number },
  legacyMetaId: { type: Number },

  approved_at: { type: String, default: "" },
  created_at:  { type: String, default: "" }
}, { timestamps: true });

/* Text index for search */
campaignSchema.index({ title: "text", description: "text" });
campaignSchema.index({ category: 1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ creatorEmail: 1 });

export { CATEGORIES };
export default mongoose.model("Campaign", campaignSchema);
