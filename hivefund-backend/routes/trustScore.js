import express from "express";
import { extractAIFeatures } from "../services/aiFeatureService.js";
import { getFraudProbabilityFromText } from "../services/mlService.js";
import { calculateTrustScore } from "../services/trustScoreService.js";

const router = express.Router();

router.post("/trust-score", async (req, res) => {
  const { description, documents } = req.body;

  const aiFeatures = extractAIFeatures(description, documents);

  const mlFeatures = {
    donation_amount: 5000,
    frequency: 1,
    risk_flag: 0,
    ...aiFeatures
  };

  const fraudProb = getFraudProbabilityFromText(text);
  const trust = calculateTrustScore(aiFeatures, fraudProb);

  res.json({
    aiFeatures,
    fraud_probability: fraudProb,
    trust
  });
});

export default router;
