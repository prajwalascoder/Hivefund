// src/pages/Campaigns.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BACKEND = import.meta.env.VITE_BACKEND || "http://localhost:4001";

function resolveImageUrl(campaign) {
  if (!campaign.imageUrl) return "/placeholder-campaign.png";
  if (campaign.imageUrl.startsWith("http")) return campaign.imageUrl;
  return `${BACKEND}${campaign.imageUrl}`;
}

const CATEGORY_ICONS = {
  "All":                  "🌐",
  "Medical":              "🏥",
  "Education":            "📚",
  "Emergency":            "🚨",
  "Community":            "🏘️",
  "Environment":          "🌿",
  "Animal Welfare":       "🐾",
  "Technology":           "💻",
  "Creative & Arts":      "🎨",
  "Sports":               "⚽",
  "Religious & Spiritual":"🙏",
  "Startup & Business":   "🚀",
  "Disaster Relief":      "🆘",
  "Other":                "📌"
};

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  /* 🔄 FETCH CATEGORIES */
  useEffect(() => {
    axios.get(`${BACKEND}/api/categories`)
      .then(res => setCategories(["All", ...(res.data || [])]))
      .catch(() => setCategories(["All"]));
  }, []);

  /* 🔄 FETCH CAMPAIGNS */
  useEffect(() => {
    fetchCampaigns();
  }, [activeCategory]);

  async function fetchCampaigns() {
    try {
      setLoading(true);
      const params = activeCategory !== "All" ? { category: activeCategory } : {};
      const res = await axios.get(`${BACKEND}/api/approved`, { params });
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
    <div className="page-transition" style={{ background: "#f8fafc", minHeight: "100vh" }}>
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

      {/* 📂 CATEGORY FILTER */}
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 16px 16px",
        overflowX: "auto"
      }}>
        <div style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          justifyContent: "center"
        }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                border: activeCategory === cat ? "2px solid #16a34a" : "1px solid #e2e8f0",
                background: activeCategory === cat
                  ? "linear-gradient(135deg, #22c55e, #16a34a)"
                  : "#fff",
                color: activeCategory === cat ? "#fff" : "#475569",
                fontWeight: activeCategory === cat ? 700 : 500,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
                boxShadow: activeCategory === cat
                  ? "0 4px 12px rgba(22,163,74,0.3)"
                  : "0 1px 3px rgba(0,0,0,0.05)"
              }}
            >
              {CATEGORY_ICONS[cat] || "📌"} {cat}
            </button>
          ))}
        </div>
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
                  key={c._id || c.metaId}
                  onClick={() => navigate(`/campaign/${c.metaId || c._id}/donate`)}
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
                    src={resolveImageUrl(c)}
                    alt={c.title}
                    style={{
                      width: "100%",
                      height: 180,
                      objectFit: "cover"
                    }}
                  />

                  {/* BODY */}
                  <div style={{ padding: 16 }}>
                    {/* CATEGORY BADGE */}
                    {c.category && c.category !== "Other" && (
                      <div style={{
                        display: "inline-block",
                        padding: "3px 10px",
                        borderRadius: 12,
                        background: "#f0fdf4",
                        color: "#16a34a",
                        fontSize: 11,
                        fontWeight: 600,
                        marginBottom: 8,
                        letterSpacing: 0.3
                      }}>
                        {CATEGORY_ICONS[c.category] || "📌"} {c.category}
                      </div>
                    )}

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
