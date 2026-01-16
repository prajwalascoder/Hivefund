// src/pages/Campaigns.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BACKEND = import.meta.env.VITE_BACKEND || "http://localhost:4001";

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return "/placeholder-campaign.png";
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${BACKEND}${imageUrl}`;
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  /* 🔄 ALWAYS FETCH LATEST DATA */
  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND}/api/approved`);
      setCampaigns(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Campaign fetch failed", err);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const query = q.toLowerCase();
    return campaigns.filter(c =>
      `${c.title} ${c.description}`.toLowerCase().includes(query)
    );
  }, [campaigns, q]);

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      {/* 🔷 HERO HEADER */}
      <div style={{
        padding: "40px 16px 28px",
        textAlign: "center"
      }}>
        <h1 style={{
          fontSize: 32,
          fontWeight: 800,
          marginBottom: 8
        }}>
          Explore Campaigns
        </h1>

        <p style={{
          color: "#64748b",
          marginBottom: 20
        }}>
          Support verified fundraisers powered by AI & blockchain
        </p>

        {/* 🔍 SEARCH BAR */}
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search by campaign name or story..."
          style={{
            width: "100%",
            maxWidth: 520,
            padding: "14px 18px",
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            fontSize: 15,
            outline: "none"
          }}
        />
      </div>

      {/* 🔳 CAMPAIGN GRID */}
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 16px 40px"
      }}>
        {loading ? (
          <p className="muted">Loading campaigns…</p>
        ) : filtered.length === 0 ? (
          <p className="muted">No campaigns found.</p>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20
          }}>
            {filtered.map(c => {
              const raised = Number(c.raised_inr || 0);
              const goal = Math.max(1, Number(c.goal_inr || 1));
              const pct = Math.min(100, Math.round((raised / goal) * 100));

              return (
                /* 🔥 ENTIRE CARD CLICKABLE */
                <div
                  key={c.metaId}
                  onClick={() => navigate(`/campaign/${c.metaId}/donate`)}
                  style={{
                    cursor: "pointer",
                    background: "#fff",
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
                    transition: "0.2s ease"
                  }}
                >
                  {/* IMAGE */}
                  <img
                    src={resolveImageUrl(c.imageUrl)}
                    alt={c.title}
                    style={{
                      width: "100%",
                      height: 180,
                      objectFit: "cover"
                    }}
                  />

                  {/* BODY */}
                  <div style={{ padding: 16 }}>
                    <h3 style={{
                      fontSize: 18,
                      fontWeight: 700,
                      marginBottom: 6
                    }}>
                      {c.title}
                    </h3>

                    {/* ⭐ TRUST */}
                    {c.trust?.stars !== undefined && (
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ color: "#16a34a" }}>
                          {"⭐".repeat(c.trust.stars)}
                          {"☆".repeat(5 - c.trust.stars)}
                        </span>
                        <span style={{ fontSize: 12, color: "#64748b", marginLeft: 6 }}>
                          AI verified
                        </span>
                      </div>
                    )}

                    <p style={{
                      fontSize: 14,
                      color: "#475569",
                      marginBottom: 14
                    }}>
                      {c.description?.slice(0, 100)}…
                    </p>

                    {/* 📊 PROGRESS BAR */}
                    <div style={{
                      background: "#e5e7eb",
                      height: 8,
                      borderRadius: 999,
                      overflow: "hidden",
                      marginBottom: 10
                    }}>
                      <div style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #22c55e, #16a34a)"
                      }} />
                    </div>

                    {/* 💰 AMOUNTS */}
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 14
                    }}>
                      <strong>₹{raised.toLocaleString()}</strong>
                      <span style={{ color: "#64748b" }}>
                        of ₹{goal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
