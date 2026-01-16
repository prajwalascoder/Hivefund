export function extractAIFeatures(description = "", ocrText = "") {
  const desc = (description || "").toLowerCase();
  const ocr = (ocrText || "").toLowerCase();

  const importantKeywords = [
    "hospital", "medical", "treatment", "surgery",
    "fees", "college", "school", "tuition",
    "certificate", "invoice", "bill", "receipt",
    "admission", "diagnosis"
  ];

  const ocrRelevant = importantKeywords.some(word => ocr.includes(word));

  const emotionalWords = [
    "urgent", "immediately", "please help",
    "last hope", "no other option", "otherwise die"
  ];

  const emotionalBlackmail = emotionalWords.some(w => desc.includes(w));

  // Very simple grammar proxy (explainable)
  const grammarScore =
    desc.length > 40 &&
    /[.!?]/.test(desc) &&
    desc.split(" ").length > 8
      ? 0.8
      : 0.4;

  return {
    ocr_relevant: ocrRelevant,
    emotional_blackmail: emotionalBlackmail,
    grammar_score: grammarScore
  };
}
