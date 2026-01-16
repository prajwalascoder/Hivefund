// src/pages/CreatePage.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BACKEND = "http://localhost:4001";

export default function CreatePage() {
  const nav = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalINR, setGoalINR] = useState("");
  const [deadline, setDeadline] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("hf_token");
    if (!token) {
      alert("Login required");
      return nav("/login");
    }

    if (!title || !goalINR || !deadline)
      return setError("Please fill all required fields");

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("title", title);
      fd.append("description", description);
      fd.append("goal_inr", goalINR);
      fd.append("deadline", deadline);

      if (imageFile) fd.append("image", imageFile);
      documents.forEach(doc => fd.append("documents", doc));

      await axios.post(`${BACKEND}/api/pending`, fd, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Campaign submitted for AI + Admin review");
      nav("/campaigns");
    } catch (err) {
      console.error(err);
      setError("Submission failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-transition">
      <div
        className="page-create"
        style={{ maxWidth: 1100, margin: "30px auto", padding: 20 }}
      >
        <h2>Start a Fundraiser</h2>
        <p className="small muted">
          Campaigns are reviewed by AI + Admin before going live
        </p>

        <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
          <div
            className="create-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr",
              gap: 30
            }}
          >
            {/* LEFT COLUMN */}
            <div>
              <label className="lbl">Title</label>
              <input
                className="input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Short campaign title"
              />

              <label className="lbl" style={{ marginTop: 12 }}>
                Description
              </label>
              <textarea
                className="input"
                rows={7}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Explain your situation clearly..."
              />

              {/* ✅ GOAL INPUT */}
              <label className="lbl" style={{ marginTop: 12 }}>
                Goal Amount (INR)
              </label>
              <input
                type="number"
                className="input"
                value={goalINR}
                onChange={e => setGoalINR(e.target.value)}
                placeholder="e.g. 150000"
              />

              {/* ✅ DEADLINE INPUT */}
              <label className="lbl" style={{ marginTop: 12 }}>
                Deadline
              </label>
              <input
                type="date"
                className="input"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
              />

              <label className="lbl" style={{ marginTop: 12 }}>
                Banner Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={e => setImageFile(e.target.files[0])}
              />

              <label className="lbl" style={{ marginTop: 16 }}>
                Supporting Documents (Proof)
              </label>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => {
                  const newDocs = Array.from(e.target.files);
                  setDocuments(prev => [...prev, ...newDocs].slice(0, 5));
                  e.target.value = null;
                }}
              />

              {documents.length > 0 && (
                <ul className="small muted" style={{ marginTop: 6 }}>
                  {documents.map((d, i) => (
                    <li key={i}>{d.name}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* RIGHT COLUMN – PREVIEW */}
            <div>
              <div className="small muted">Preview</div>
              <div className="card" style={{ padding: 14, marginTop: 8 }}>
                {imageFile ? (
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="preview"
                    style={{
                      width: "100%",
                      height: 160,
                      objectFit: "cover",
                      borderRadius: 8,
                      marginBottom: 10
                    }}
                  />
                ) : (
                  <div
                    style={{
                      height: 160,
                      background: "#f3f4f6",
                      borderRadius: 8,
                      marginBottom: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#9ca3af"
                    }}
                  >
                    Image preview
                  </div>
                )}

                <strong>{title || "Campaign title"}</strong>
                <div className="small muted" style={{ marginTop: 6 }}>
                  {description
                    ? description.slice(0, 120) + "..."
                    : "Campaign description preview"}
                </div>

                <div style={{ marginTop: 12 }}>
                  <div className="small muted">Goal</div>
                  <div style={{ fontWeight: 700 }}>
                    ₹{goalINR ? Number(goalINR).toLocaleString() : "0"}
                  </div>
                </div>

                <div style={{ marginTop: 8 }}>
                  <div className="small muted">Deadline</div>
                  <div>
                    {deadline
                      ? new Date(deadline).toLocaleDateString()
                      : "—"}
                  </div>
                </div>

                <div className="small muted" style={{ marginTop: 8 }}>
                  Documents uploaded: {documents.length}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ color: "crimson", marginTop: 12 }}>{error}</div>
          )}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{ marginTop: 20 }}
          >
            {loading ? "Submitting…" : "Submit for approval"}
          </button>
        </form>
      </div>
    </div>
  );
}
