// src/pages/HelpCenter.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function HelpCenter() {
  return (
    <div className="home-root" style={{ padding: "36px 18px" }}>
      <div style={{ maxWidth: 1000, margin: "20px auto" }}>
        <h1>Help Center</h1>
        <p className="page-caption">Find answers to common questions.</p>

        <div className="auth-card" style={{ marginTop: 12 }}>
          <h3>Frequently Asked Questions</h3>

          <div style={{ marginTop: 12 }}>
            <strong>How do I start a campaign?</strong>
            <p className="muted">Click "Start a fundraiser", fill the form, upload images, set goal & deadline and submit for review.</p>
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>How do donations work?</strong>
            <p className="muted">Donors pay via Razorpay in INR. After payment verification, totals update on the campaign page.</p>
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>I am a creator — how do I withdraw funds?</strong>
            <p className="muted">Creators will find withdrawal instructions and receipts in their Dashboard after approval.</p>
          </div>

          <div style={{ marginTop: 16 }}>
            <Link to="/contact" className="btn btn-outline">Contact Support</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
