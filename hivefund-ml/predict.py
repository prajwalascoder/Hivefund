# predict.py (inside ML folder)

import sys, json

text = json.loads(sys.stdin.read())["text"].lower()

# 🚨 STRONG FRAUD KEYWORDS
fraud_keywords = [
    "earn money fast",
    "no experience required",
    "work from home",
    "guaranteed income",
    "limited offer",
    "investment return",
    "click link",
    "whatsapp number"
]

score = 0.0

for word in fraud_keywords:
    if word in text:
        score += 0.2

# Cap at 1.0
fraud_probability = min(score, 1.0)

print(json.dumps({
    "fraud_probability": fraud_probability
}))
