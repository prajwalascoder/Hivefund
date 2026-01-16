import Tesseract from "tesseract.js";
import fs from "fs";

export async function extractTextFromDocuments(filePaths = []) {
  let combinedText = "";

  for (const filePath of filePaths) {
    if (!fs.existsSync(filePath)) continue;

    const result = await Tesseract.recognize(filePath, "eng");
    combinedText += " " + result.data.text;
  }

  return {
    ocrText: combinedText.trim(),
    documentCount: filePaths.length
  };
}
