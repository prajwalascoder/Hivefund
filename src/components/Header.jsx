// src/components/Header.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Header({ auth, onAuthChange }) {
  const nav = useNavigate();

  function logout() {
    if (typeof onAuthChange === "function") onAuthChange(null);
    nav("/");
  }

  return (
    <header className="hf-header">
      <div className="hf-header-inner">

        {/* LEFT: Home, Campaigns, Contact */}
        <div className="hf-left">
          <nav className="hf-left-nav">
            <Link to="/" className="hf-nav-link">Home</Link>
            <Link to="/campaigns" className="hf-nav-link">Campaigns</Link>
            <Link to="/contact" className="hf-nav-link">Contact</Link>
          </nav>
        </div>

        {/* CENTER: logo */}
        <div className="hf-center">
          <Link to="/" className="hf-logo">HiveFund</Link>
        </div>

        {/* RIGHT: auth + CTA */}
        <div className="hf-right">
          {!auth?.token ? (
            <>
              <Link to="/login" className="hf-link">Sign in</Link>
              <Link to="/signup" className="hf-link">Sign up</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="hf-link">My Dashboard</Link>
              {auth.role === "admin" && <Link to="/admin" className="hf-link">Admin</Link>}
              <button onClick={logout} className="hf-ghost">Logout</button>
            </>
          )}

          <Link to="/create" className="hf-cta">Start a fundraiser</Link>
        </div>
      </div>
    </header>
  );
}
