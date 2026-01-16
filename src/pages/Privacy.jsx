// src/pages/Privacy.jsx
import React from "react";

export default function Privacy() {
  return (
    <div className="home-root" style={{ padding: "36px 18px" }}>
      <div className="auth-card" style={{ maxWidth: 900, margin: "24px auto" }}>
        <h2>Privacy Policy</h2>
        <p className="page-caption">Last updated: Dec 10, 2025</p>

        <section style={{ marginTop: 18 }}>
          <h3>What we collect</h3>
          <p>
            We collect information you provide (name, email, campaign details), payment details via providers,
            and usage data (logs, IP) to operate and improve the service.
          </p>
        </section>

        <section style={{ marginTop: 12 }}>
          <h3>How we use it</h3>
          <p>
            Data is used to run campaigns, process payments, send notifications, and prevent abuse. We do not sell
            personal data to third parties.
          </p>
        </section>

        <section style={{ marginTop: 12 }}>
          <h3>Security</h3>
          <p>
            We take reasonable measures to protect data, but no system is 100% secure. For payment data, we rely on
            payment processors (Razorpay) and do not store raw card details on our servers.
          </p>
        </section>

        <section style={{ marginTop: 12 }}>
          <h3>Your rights</h3>
          <p>
            You can request access, correction, or deletion of personal data by contacting support at the email on
            our Contact page.
          </p>
        </section>

        <p className="muted small" style={{ marginTop: 16 }}>
          This is a basic privacy summary — tailor to your legal requirements and consult a privacy lawyer.
        </p>
      </div>
    </div>
  );
}
