export function calculateTrustScore(ai, fraudProbability = 0, documentCount = 0) {
  let stars = 1;
  let reasons = [];

  // 1️⃣ No documents at all
  if (documentCount === 0) {
    return {
      stars: 1,
      risk: "Very High",
      reasons: ["No supporting documents uploaded"]
    };
  }

  // 2️⃣ Documents present but OCR NOT relevant
  if (!ai.ocr_relevant) {
    return {
      stars: 2,
      risk: "High",
      reasons: ["Uploaded documents do not match campaign purpose"]
    };
  }

  // 3️⃣ OCR relevant but language manipulation / poor grammar
  if (ai.emotional_blackmail || ai.grammar_score < 0.55) {
    return {
      stars: 3,
      risk: "Medium",
      reasons: [
        ai.emotional_blackmail ? "Emotional manipulation detected" : null,
        ai.grammar_score < 0.55 ? "Poor linguistic structure" : null
      ].filter(Boolean)
    };
  }

  // 4️⃣ Everything OK but only ONE document
  if (documentCount === 1) {
    return {
      stars: 4,
      risk: "Low",
      reasons: ["Single valid supporting document uploaded"]
    };
  }

  // 5️⃣ Everything OK + MULTIPLE documents
  return {
    stars: 5,
    risk: "Very Low",
    reasons: ["Multiple verified documents uploaded"]
  };
}
