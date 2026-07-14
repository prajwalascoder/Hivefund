import mongoose from "mongoose";

const donationSchema = new mongoose.Schema({
  campaignId:  { type: String, required: true },
  amountINR:   { type: Number, required: true },
  donor:       { type: String, required: true },
  paymentId:   { type: String, default: "" },
  isAnonymous: { type: Boolean, default: false },
  created_at:  { type: String, default: "" }
}, { timestamps: true });

donationSchema.index({ campaignId: 1 });
donationSchema.index({ donor: 1 });

export default mongoose.model("Donation", donationSchema);
