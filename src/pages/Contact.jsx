// src/pages/Contact.jsx
import React, { useState } from "react";

export default function Contact() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSent(true);

    // You can also POST to backend:
    // fetch("http://localhost:4001/api/contact", { method:"POST", body:... })
  }

  return (
    <div className="auth-page-wrap">
      <div className="auth-card" style={{ maxWidth: "620px" }}>
        <h2>Contact Us</h2>
        <p className="page-caption">
          We're here to help. Send us your query and our team will respond soon.
        </p>

        {sent && (
          <div className="alert alert-success">
            Message sent successfully. We’ll reach out to you shortly.
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          <label className="lbl">Your Name</label>
          <input className="input" type="text" required placeholder="Enter your name" />

          <label className="lbl">Email Address</label>
          <input className="input" type="email" required placeholder="you@example.com" />

          <label className="lbl">Message</label>
          <textarea className="input" required placeholder="Write your message here..." />

          <div className="form-actions" style={{ marginTop: "12px" }}>
            <button type="submit" className="btn btn-primary">
              Send Message
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
