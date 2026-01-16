// src/pages/Terms.jsx
import React from "react";

export default function Terms() {
  return (
    <div className="home-root" style={{ padding: "36px 18px" }}>
      <div className="auth-card" style={{ maxWidth: 900, margin: "24px auto" }}>
        <h2>Terms &amp; Conditions</h2>
        <p className="page-caption">Last updated: Dec 10, 2025</p>

        <section style={{ marginTop: 18 }}>
          <h3>1. Introduction</h3>
          <p>
            These Terms &amp; Conditions ("Terms") govern your use of HiveFund. By accessing or using the Site,
            you agree to be bound by these Terms. If you do not agree, please do not use the Site.
          </p>
        </section>

        <section style={{ marginTop: 12 }}>
          <h3>2. Accounts</h3>
          <p>
            You must provide accurate information when creating an account. You are responsible for all activity
            on your account and must keep your credentials secure.
          </p>
        </section>

        <section style={{ marginTop: 12 }}>
          <h3>3. Campaign content</h3>
          <p>
            Creators are solely responsible for the content of their campaigns. HiveFund may review and remove
            content that violates these Terms or applicable law.
          </p>
        </section>

        <section style={{ marginTop: 12 }}>
          <h3>4. Payments</h3>
          <p>
            Payments are processed by our payment providers (e.g., Razorpay). We do not hold responsibility for
            provider outages. Refunds and disputes follow the payment provider's policy.
          </p>
        </section>

        <section style={{ marginTop: 12 }}>
          <h3>5. Limitations of liability</h3>
          <p>
            To the maximum extent permitted by law, HiveFund is not liable for indirect or consequential damages
            arising from use of the Service.
          </p>
        </section>

        <p style={{ marginTop: 18 }} className="muted small">
          This is a summary terms page. For legal use, consult a lawyer and expand these sections as needed.
        </p>
      </div>
    </div>
  );
}
