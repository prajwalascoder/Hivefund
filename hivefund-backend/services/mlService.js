// services/mlService.js
import { execSync } from "child_process";

export function getFraudProbabilityFromText(text) {
  try {
    const output = execSync(
      "python hivefund-ml/predict.py",
      { input: JSON.stringify({ text }) }
    ).toString();

    return JSON.parse(output).fraud_probability;
  } catch (e) {
    console.error("ML error:", e.message);
    return 0.3; // safe fallback
  }
}
