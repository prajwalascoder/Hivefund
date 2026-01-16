const OFFICIAL_KEYWORDS = [
  "hospital",
  "invoice",
  "receipt",
  "bill",
  "college",
  "school",
  "university",
  "certificate",
  "government",
  "id",
  "aadhaar",
  "pan",
  "amount",
  "date"
];

export function verifyOCRText(ocrText, campaignText) {
  let score = 0;
  const reasons = [];

  const text = ocrText.toLowerCase();

  // 1. OCR readability
  if (ocrText.length > 80) {
    score++;
    reasons.push("Readable text successfully extracted from documents.");
  } else {
    reasons.push("Very limited readable content in uploaded documents.");
  }

  // 2. Official keyword check
  const matched = OFFICIAL_KEYWORDS.filter(k => text.includes(k));
  if (matched.length >= 2) {
    score++;
    reasons.push(`Official terms detected: ${matched.join(", ")}.`);
  } else {
    reasons.push("Documents lack strong official terminology.");
  }

  // 3. Numeric / date patterns
  if (/\d{2,}/.test(text)) {
    score++;
    reasons.push("Documents contain numeric values such as dates or amounts.");
  } else {
    reasons.push("No numeric values found in documents.");
  }

  // 4. Consistency with campaign description
  const overlap = campaignText
    .toLowerCase()
    .split(" ")
    .filter(w => w.length > 4 && text.includes(w));

  if (overlap.length >= 3) {
    score++;
    reasons.push("Document content aligns with campaign description.");
  } else {
    reasons.push("Low semantic alignment between documents and campaign text.");
  }

  return {
    document_score: score / 4, // normalize
    reasons,
    extracted_length: ocrText.length
  };
}
