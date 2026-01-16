// src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="hf-footer">
      <div className="hf-footer-inner">

        {/* Logo */}
        <div className="hf-col">
          <Link to="/" className="hf-logo-small">HiveFund</Link>
        </div>

        {/* About column */}
        <div className="hf-col">
          <h4>About</h4>
          <Link to="/our-story">Our Story</Link>
          <a href="#how-it-works">How it works</a>
        </div>

        {/* Resources */}
        <div className="hf-col">
          <h4>Resources</h4>
          <Link to="/help">Help Center</Link>
          <Link to="/creator-docs">Creator Docs</Link>
        </div>

        {/* Legal */}
        <div className="hf-col">
          <h4>Legal</h4>
          <Link to="/terms">Terms & Conditions</Link>
          <Link to="/privacy">Privacy Policy</Link>
        </div>

      </div>

      <div className="hf-footer-bottom">
        <div>© {new Date().getFullYear()} HiveFund</div>
      </div>
    </footer>
  );
}
