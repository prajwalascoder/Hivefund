import React, { useEffect, useState } from "react";
import axios from "axios";

const BACKEND = import.meta.env.VITE_BACKEND || "http://localhost:4001";

export default function AdminPage() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectState, setRejectState] = useState({ id: null, reason: "" });
  const [actionLoading, setActionLoading] = useState(null);

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
    setActionLoading(id);
    try {
      const token = localStorage.getItem("hf_token");
      await axios.post(
        `${BACKEND}/api/pending/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPending(prev => prev.filter(p => (p._id || p.id) !== id));
    } catch (err) {
      alert("Approval failed: " + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
  }

  async function reject(id) {
    const reason = rejectState.id === id ? rejectState.reason : "";
    
    if (!reason) {
      // Show reason input first
      setRejectState({ id, reason: "" });
      return;
    }

    setActionLoading(id);
    try {
      const token = localStorage.getItem("hf_token");
      await axios.post(
        `${BACKEND}/api/pending/${id}/reject`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPending(prev => prev.filter(p => (p._id || p.id) !== id));
      setRejectState({ id: null, reason: "" });
    } catch (err) {
      alert("Rejection failed: " + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading(null);
    }
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
        const cId = c._id || c.id;

        return (
          <div
            key={cId}
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
                {c.category && c.category !== "Other" && (
                  <div style={{
                    display: "inline-block",
                    padding: "2px 10px",
                    borderRadius: 12,
                    background: "#f0fdf4",
                    color: "#16a34a",
                    fontSize: 11,
                    fontWeight: 600,
                    marginTop: 4
                  }}>
                    {c.category}
                  </div>
                )}
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

            {/* REJECT REASON INPUT */}
            {rejectState.id === cId && (
              <div style={{
                marginTop: 14,
                padding: 14,
                borderRadius: 8,
                background: "#fef2f2",
                border: "1px solid #fecaca"
              }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: 13, marginBottom: 6, color: "#991b1b" }}>
                  Rejection Reason
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain why this campaign is being rejected..."
                  value={rejectState.reason}
                  onChange={e => setRejectState({ id: cId, reason: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #fca5a5",
                    fontSize: 14,
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box"
                  }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    className="btn"
                    style={{
                      background: "#dc2626",
                      color: "#fff",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: 8,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                    disabled={!rejectState.reason.trim() || actionLoading === cId}
                    onClick={() => reject(cId)}
                  >
                    {actionLoading === cId ? "Rejecting..." : "Confirm Reject & Delete"}
                  </button>
                  <button
                    className="btn"
                    style={{
                      background: "#f3f4f6",
                      color: "#374151",
                      border: "1px solid #d1d5db",
                      padding: "8px 14px",
                      borderRadius: 8,
                      cursor: "pointer"
                    }}
                    onClick={() => setRejectState({ id: null, reason: "" })}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ACTIONS */}
            {rejectState.id !== cId && (
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
                  disabled={stars < 3 || actionLoading === cId}
                  onClick={() => approve(cId)}
                  title={stars < 3 ? "Blocked due to low trust score" : ""}
                >
                  {actionLoading === cId ? "Approving..." : "Approve Campaign"}
                </button>

                <button
                  className="btn btn-outline"
                  style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                  onClick={() => reject(cId)}
                  disabled={actionLoading === cId}
                >
                  Reject & Delete
                </button>

                {stars < 3 && (
                  <span className="small" style={{ color: "#b91c1c" }}>
                    Auto-blocked due to low trust
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
