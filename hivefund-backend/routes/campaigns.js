import express from "express";
import multer from "multer";
import { extractAIFeatures } from "../services/aiFeatureService.js";
import { getFraudProbability } from "../services/mlService.js";
import { calculateTrustScore } from "../services/trustScoreService.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.array("documents"), async (req, res) => {
  const { title, description, goal_inr, deadline } = req.body;
  const docs = req.files.map(f => ({ path: f.path, name: f.originalname }));

  const ai = await extractAIFeatures(description, docs);
  const fraudProb = getFraudProbability({
    donation_amount: Number(goal_inr),
    grammar_score: ai.grammar_score,
    document_score: ai.document_score
  });

  const trust = calculateTrustScore(ai, fraudProb);

  res.json({
    status: "pending",
    trust,
    ai,
    fraud_probability: fraudProb
  });
});

export default router;
