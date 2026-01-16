export function generateAISummary(input = {}) {
  const {
    title = "",
    ai = {},
    trust = { stars: 1 },
    ocrResult = {}
  } = input;

  const documentCount = Number(ocrResult.documentCount || 0);
  const grammar = Number(ai.grammar_score || 0);
  const ocrRelevant = Boolean(ai.ocr_relevant);
  const stars = Number(trust.stars || 1);

  // ---- Dynamic Summary ----
  if (documentCount === 0) {
    return `The campaign "${title}" has no supporting documents uploaded. 
Without verifiable documents, the system cannot confirm authenticity, 
resulting in a low trust rating.`;
  }

  if (!ocrRelevant) {
    return `Documents were uploaded for "${title}", but extracted text does not 
contain verifiable keywords such as invoices, certificates, or official records. 
This limits confidence in the campaign’s legitimacy.`;
  }

  if (grammar < 0.6) {
    return `The campaign "${title}" includes relevant documents, however the 
description quality and structure raise concerns. Ambiguous language and poor 
clarity reduce overall trust.`;
  }

  if (documentCount === 1) {
    return `The campaign "${title}" is supported by a verified document and 
clear description. While credibility is high, additional documentation could 
further strengthen trust.`;
  }

  return `The campaign "${title}" is well-documented with multiple verified 
documents and a clear, well-written description. Extracted records align with 
the stated purpose, indicating strong legitimacy and low fraud risk.`;
}
