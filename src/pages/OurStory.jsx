// src/pages/OurStory.jsx
import React from "react";

export default function OurStory() {
  return (
    <div className="home-root" style={{ padding: "36px 18px" }}>
      <div style={{ maxWidth: 1000, margin: "20px auto" }}>
        <div style={{ marginBottom: 18 }}>
          <h1>Our Story</h1>
          <p className="page-caption">Helping communities, one fundraiser at a time.</p>
        </div>

        <div className="auth-card">
          <p>
            HiveFund was founded to make grassroots fundraising transparent, local and trustworthy. We started as a
            small team of volunteers who saw the power of community-led fundraising and built a simple platform to
            help people raise money for urgent needs.
          </p>

          <p style={{ marginTop: 12 }}>
            Our mission: enable creators to raise funds in INR, provide donor trust via admin verification, and
            support optional blockchain-native flows for transparency and future-proofing.
          </p>

          <h3 style={{ marginTop: 16 }}>Values</h3>
          <ul style={{ marginTop: 8 }}>
            <li>Trust & safety</li>
            <li>Local currency clarity (INR)</li>
            <li>Transparency and impact reporting</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
