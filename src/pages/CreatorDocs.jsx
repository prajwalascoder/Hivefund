// src/pages/CreatorDocs.jsx
import React from "react";

export default function CreatorDocs() {
  return (
    <div className="home-root" style={{ padding: "36px 18px" }}>
      <div style={{ maxWidth: 1000, margin: "20px auto" }}>
        <h1>Creator Docs</h1>
        <p className="page-caption">A quick guide for people who want to start fundraisers.</p>

        <div className="auth-card" style={{ marginTop: 12 }}>
          <h3>Step 1 — Prepare</h3>
          <p className="muted">Write a clear story, prepare photos, and decide your INR goal and deadline. Be honest and include receipts where possible.</p>

          <h3 style={{ marginTop: 12 }}>Step 2 — Create</h3>
          <p className="muted">Go to Start a fundraiser. Fill title, description, upload images, set goal (in INR), and select category.</p>

          <h3 style={{ marginTop: 12 }}>Step 3 — Submit for review</h3>
          <p className="muted">Admin reviews campaigns to keep the platform safe. Monitor your Dashboard for approval or feedback.</p>

          <h3 style={{ marginTop: 12 }}>Step 4 — Share & update</h3>
          <p className="muted">Share your campaign link on social media and post frequent updates to build donor trust.</p>
        </div>
      </div>
    </div>
  );
}
