import React, { useEffect, useState } from "react";
import axios from "axios";

const BACKEND = import.meta.env.VITE_BACKEND || "http://localhost:4001";

export default function AdminPage() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("hf_token");
    if (!token) {
      setError("Admin login required");
      setLoading(false);
      return;
    }

    axios
      .get(`${BACKEND}/api/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setPending(res.data || []))
      .catch(err => {
        console.error(err);
        setError("Failed to load pending campaigns");
      })
      .finally(() => setLoading(false));
  }, []);

  async function approve(id) {
    const token = localStorage.getItem("hf_token");
    await axios.post(
      `${BACKEND}/api/pending/${id}/approve`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setPending(prev => prev.filter(p => p.id !== id));
  }

  async function reject(id) {
    setPending(prev => prev.filter(p => p.id !== id));
  }

  function riskLabel(stars) {
    if (stars >= 4) return { text: "Low Risk", color: "#15803d" };
    if (stars === 3) return { text: "Medium Risk", color: "#ca8a04" };
    return { text: "High Risk", color: "#b91c1c" };
  }

  if (loading) {
    return <div style={{ padding: 40 }}>Loading admin panel…</div>;
  }

  if (error) {
    return <div style={{ padding: 40, color: "crimson" }}>{error}</div>;
  }

  return (
    <div style={{ maxWidth: 1100, margin: "40px auto", padding: "0 20px" }}>
      <h2 style={{ marginBottom: 6 }}>Admin Review Panel</h2>
      <p className="small muted">
        Review campaigns using AI trust analysis before approval.
      </p>

      {pending.length === 0 && (
        <div style={{ marginTop: 30 }} className="muted">
          No campaigns pending approval.
        </div>
      )}

      {pending.map(c => {
        const stars = c.trust?.stars || 0;
        const risk = riskLabel(stars);

        return (
          <div
            key={c.id}
            style={{
              marginTop: 24,
              padding: 20,
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#fff",
              boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
            }}
          >
            {/* HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ marginBottom: 4 }}>{c.title}</h3>
                <div className="small muted">
                  Created by {c.creatorEmail}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  {"⭐".repeat(stars)}
                  {"☆".repeat(5 - stars)}
                </div>
                <div
                  className="small"
                  style={{ color: risk.color, fontWeight: 600 }}
                >
                  {risk.text}
                </div>
              </div>
            </div>

            {/* SUMMARY */}
            <div
              style={{
                marginTop: 16,
                padding: 14,
                borderRadius: 8,
                background: "#f9fafb",
                lineHeight: 1.6,
              }}
            >
              <strong>AI Summary</strong>
              <p style={{ marginTop: 6 }}>
                {c.ai_summary || "No summary available."}
              </p>
            </div>

            {/* DOCUMENT INFO */}
            <div className="small muted" style={{ marginTop: 10 }}>
              Documents uploaded: {c.documents_count || 0}
            </div>

            {/* ACTIONS */}
            <div
              style={{
                marginTop: 16,
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              <button
                className="btn btn-primary"
                disabled={stars < 3}
                onClick={() => approve(c.id)}
                title={stars < 3 ? "Blocked due to low trust score" : ""}
              >
                Approve Campaign
              </button>

              <button
                className="btn btn-outline"
                onClick={() => reject(c.id)}
              >
                Reject
              </button>

              {stars < 3 && (
                <span className="small" style={{ color: "#b91c1c" }}>
                  Auto-blocked due to low trust
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
