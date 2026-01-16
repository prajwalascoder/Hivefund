import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.metrics import accuracy_score, confusion_matrix, precision_score, recall_score, f1_score


print("🚀 Loading datasets...")

# =================================================
# ======================================================
jobs = pd.read_csv("datasets/donation1.csv")

jobs["text"] = (
    jobs["title"].fillna("") + " " + jobs["description"].fillna("")
)
jobs["label"] = jobs["fraudulent"]  # already: 1 = fraud

jobs = jobs[["text", "label"]]
print("✅ Loaded fake job postings")

# ======================================================
# ======================================================
sms = pd.read_csv("datasets/spam.csv", encoding="latin-1")

# Keep only useful columns
sms = sms.iloc[:, 0:2]
sms.columns = ["label", "text"]

# Convert labels → 1 = fraud
sms["label"] = sms["label"].map({"spam": 1, "ham": 0})

sms = sms[["text", "label"]]
print("✅ Loaded SMS spam dataset")

# ======================================================
#
# ======================================================
phish = pd.read_csv("datasets/donation2.csv")

# Convert numeric features into synthetic text
feature_cols = phish.drop(columns=["CLASS_LABEL"]).columns

phish["text"] = phish[feature_cols].apply(
    lambda row: " ".join(
        [f"{col}_{int(row[col])}" for col in feature_cols if row[col] > 0]
    ),
    axis=1
)

# CLASS_LABEL: 0 = phishing (fraud), 1 = legitimate
phish["label"] = phish["CLASS_LABEL"].apply(lambda x: 1 if x == 0 else 0)

phish = phish[["text", "label"]]

print("✅ Loaded phishing dataset (feature-to-text converted)")



# ======================================================
# COMBINE DATASETS
# ======================================================
df = pd.concat([jobs, sms, phish], ignore_index=True)
df = df.dropna()

print(f"📊 Total samples loaded: {len(df)}")

X = df["text"]
y = df["label"]

# ======================================================
# TF-IDF VECTORISATION
# ======================================================
vectorizer = TfidfVectorizer(
    max_features=8000,
    ngram_range=(1, 2),
    stop_words="english",
    min_df=3
)

X_vec = vectorizer.fit_transform(X)

# ======================================================
# TRAIN / TEST SPLIT
# ======================================================
X_train, X_test, y_train, y_test = train_test_split(
    X_vec,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# ======================================================
# LOGISTIC REGRESSION (BALANCED)
# ======================================================
model = LogisticRegression(
    max_iter=2000,
    class_weight="balanced",
    solver="liblinear"
)

model.fit(X_train, y_train)

# ======================================================
# EVALUATION
# ======================================================
y_pred = model.predict(X_test)

print("\n📊 MODEL PERFORMANCE METRICS")

print(f"Accuracy  : {accuracy_score(y_test, y_pred):.4f}")
print(f"Precision : {precision_score(y_test, y_pred, average='weighted'):.4f}")
print(f"Recall    : {recall_score(y_test, y_pred, average='weighted'):.4f}")
print(f"F1-Score  : {f1_score(y_test, y_pred, average='weighted'):.4f}")

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=['LEGIT', 'FRAUD']))

# ======================================================
# SAVE MODEL
# ======================================================
joblib.dump(model, "model.joblib")
joblib.dump(vectorizer, "vectorizer.joblib")

print("\n✅ ML model trained & saved successfully")
