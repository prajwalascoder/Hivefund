// src/pages/CampaignDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";

const BACKEND = import.meta.env.VITE_BACKEND || "http://localhost:4001";

export default function CampaignDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${BACKEND}/api/approved`)
      .then(res => {
        const found = (res.data || []).find(
          c => String(c.metaId) === String(id)
        );
        setCampaign(found || null);
      })
      .catch(() => setCampaign(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 20 }}>Loading…</div>;
  if (!campaign) return <div style={{ padding: 20 }}>Campaign not found</div>;

  const raised = Number(campaign.raised_inr || 0);
  const goal = Number(campaign.goal_inr || 1);
  const pct = Math.min(100, Math.round((raised / goal) * 100));

  return (
    <div className="details-wrap">
      <div className="details-card">
        <img
          src={campaign.imageUrl || "/placeholder-campaign.png"}
          alt={campaign.title}
          className="details-img"
        />

        <div className="details-body">
          <h2>{campaign.title}</h2>

          {campaign.trust?.stars !== undefined && (
            <div className="trust">
              {"⭐".repeat(campaign.trust.stars)}
              {"☆".repeat(5 - campaign.trust.stars)}
              <span className="muted"> AI Trust Score</span>
            </div>
          )}

          <p className="desc">{campaign.description}</p>

          <div className="progress-bar big">
            <div
              className="progress-fill"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="meta">
            <strong>₹{raised.toLocaleString()}</strong>
            <span className="muted">
              {" "}raised of ₹{goal.toLocaleString()}
            </span>
          </div>

          <div className="deadline">
            Deadline:{" "}
            {campaign.deadline
              ? new Date(campaign.deadline).toLocaleDateString()
              : "—"}
          </div>

          <div className="actions">
            <Link
              to={`/campaign/${campaign.metaId}/donate`}
              className="btn-primary"
            >
              Donate
            </Link>

            <button className="btn-outline" onClick={() => nav(-1)}>
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
