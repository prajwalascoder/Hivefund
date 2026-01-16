import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="page-transition">

      {/* HERO (now full-screen banner, using utility classes) */}
      <section className="hf-hero home-hero-v2">
        <div className="hf-hero-inner home-hero-v2-inner">
          <h1 className="hero-eyebrow">Successful fundraisers start here</h1>
          <h2 className="hero-title">Turn hope into help — fundraise for people, projects & communities.</h2>
          <p className="hero-sub">
            Trusted platform for creators and donors. Create a campaign, get reviewed by our team, and raise funds in INR — donors can pay with Razorpay or contribute crypto via MetaMask.
          </p>

          <div className="hero-ctas">
            <Link to="/campaigns" className="btn btn-secondary">Explore campaigns</Link>
            <Link to="/create" className="btn btn-primary">Start a fundraiser</Link>
          </div>

          <div className="hero-trust">
            <div className="trust-item"><strong>Verified</strong> admin approval</div>
            <div className="trust-item"><strong>INR payments</strong> via Razorpay</div>
            <div className="trust-item"><strong>Optional crypto</strong> (donor-controlled)</div>
          </div>
        </div>
      </section>

      {/* BIG: How HiveFund Works (now set to horizontal layout) */}
      <section className="how-it-works" id="how-it-works">
        <div className="how-inner">
          <h3 className="how-eyebrow">How HiveFund works</h3>
          <h2 className="how-title">Simple. Secure. Transparent.</h2>

          <div className="how-steps horizontal-steps"> 
            <div className="how-step">
              <div className="step-num">1</div>
              <div className="step-body">
                <h4 className="step-title">Start your campaign</h4>
                <ul>
                    <li>Create a clear, heartfelt campaign.</li>
                    <li>Add your story, photos, funding goal in INR and a deadline.</li>
                    <li>Submit for admin review to keep the platform trusted.</li>
                </ul>
              </div>
            </div>

            <div className="how-step">
              <div className="step-num">2</div>
              <div className="step-body">
                <h4 className="step-title">Admin verification</h4>
                <ul>
                    <li>Our team reviews each campaign to prevent misuse.</li>
                    <li>Once approved, your fundraiser goes live.</li>
                    <li>Becomes visible to donors.</li>
                </ul>
              </div>
            </div>

            <div className="how-step">
              <div className="step-num">3</div>
              <div className="step-body">
                <h4 className="step-title">Donations in INR</h4>
                 <ul>
                    <li>Donors pay securely via Razorpay (INR).</li>
                    <li>Payments are verified on the backend.</li>
                    <li>Shown in campaign totals immediately after confirmation.</li>
                </ul>
              </div>
            </div>

            <div className="how-step">
              <div className="step-num">4</div>
              <div className="step-body">
                <h4 className="step-title">Optional crypto conversion</h4>
                <ul>
                    <li>Donors can optionally convert their donation into crypto.</li>
                    <li>Send via MetaMask (non-custodial).</li>
                    <li>Platform also supports future on-chain campaign creation.</li>
                </ul>
              </div>
            </div>

            <div className="how-step">
              <div className="step-num">5</div>
              <div className="step-body">
                <h4 className="step-title">Withdraw & share updates</h4>
                <ul>
                    <li>Creators receive funds.</li>
                    <li>Can post progress updates and receipts.</li>
                    <li>Admins help with reconciliation if needed.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Unique blocks: Why choose HiveFund + Testimonials */}
      <section className="why-and-testimonials">
        <div className="why-inner">
          <div className="why-col">
            <h3 className="why-title">Why HiveFund</h3>
            <ul className="why-list">
              <li><strong>Local currency first:</strong> Goals and donations shown in INR for clarity.</li>
              <li><strong>Admin-approved listings:</strong> reduces spam and builds trust.</li>
              <li><strong>Payments you trust:</strong> Razorpay for INR, MetaMask for crypto.</li>
              <li><strong>Creator tools:</strong> dashboard, receipts, and updates.</li>
            </ul>
            <div style={{ marginTop: 12 }}>
              <Link to="/create" className="btn btn-primary">Start your fundraiser</Link>
            </div>
          </div>

          <div className="testi-col">
            <h3 className="why-title">Stories of impact</h3>
            <div className="testi">
              <blockquote>
                “We raised life-saving funds in 48 hours. The process was clear and the donors were amazing.” 
                <div className="muted small">— Asha, Campaign creator</div>
              </blockquote>
            </div>
            <div className="testi" style={{ marginTop: 12 }}>
              <blockquote>
                “The verification made me confident to donate.” 
                <div className="muted small">— Raj, Donor</div>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}