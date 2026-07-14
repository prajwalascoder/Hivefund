// services/mlService.js
import { execSync } from "child_process";
import path from "path";

export function getFraudProbabilityFromText(text) {
  try {
    const scriptPath = path.join(process.cwd(), "..", "hivefund-ml", "predict.py");
    const output = execSync(
      `python "${scriptPath}"`,
      { input: JSON.stringify({ text }) }
    ).toString();

    return JSON.parse(output).fraud_probability;
  } catch (e) {
    console.error("ML error:", e.message);
    return 0.3; // safe fallback
  }
}
