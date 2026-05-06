import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userEmail:  { type: String, required: true, index: true },
  type:       { type: String, required: true },  // "campaign_rejected", "campaign_approved", "withdrawal_complete", etc.
  severity:   { type: String, enum: ["info", "warning", "success", "error"], default: "info" },
  title:      { type: String, default: "" },
  message:    { type: String, default: "" },
  read:       { type: Boolean, default: false },
  metadata:   { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

notificationSchema.index({ userEmail: 1, read: 1 });

export default mongoose.model("Notification", notificationSchema);
