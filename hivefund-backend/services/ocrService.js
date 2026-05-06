import Tesseract from "tesseract.js";
import fs from "fs";

export async function extractTextFromDocuments(files = []) {
  let combinedText = "";

  for (const file of files) {
    const actualPath = file.path || file; // support both Multer obj and plain string

    if (!fs.existsSync(actualPath)) continue;

    try {
      const result = await Tesseract.recognize(actualPath, "eng");
      combinedText += " " + result.data.text;
    } catch (e) {
      console.error("Tesseract error on", actualPath, e);
    }
  }

  return {
    ocrText: combinedText.trim(),
    documentCount: files.length
  };
}
