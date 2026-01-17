// src/components/Header.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Header({ auth, onAuthChange }) {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  function logout() {
    if (typeof onAuthChange === "function") onAuthChange(null);
    setOpen(false);
    nav("/");
  }

  return (
    <header className="hf-header">
      <div className="hf-header-inner">

        {/* LEFT (DESKTOP ONLY) */}
        <div className="hf-left">
          <nav className="hf-left-nav">
            <Link to="/" className="hf-nav-link">Home</Link>
            <Link to="/campaigns" className="hf-nav-link">Campaigns</Link>
            <Link to="/contact" className="hf-nav-link">Contact</Link>
          </nav>
        </div>

        {/* CENTER: LOGO (ALWAYS VISIBLE) */}
        <div className="hf-center">
          <Link to="/" className="hf-logo">HiveFund</Link>
        </div>

        {/* RIGHT */}
        <div className="hf-right">
          {/* DESKTOP AUTH LINKS */}
          {!auth?.token ? (
            <>
              <Link to="/login" className="hf-link desktop-only">Sign in</Link>
              <Link to="/signup" className="hf-link desktop-only">Sign up</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="hf-link desktop-only">My Dashboard</Link>
              {auth.role === "admin" && (
                <Link to="/admin" className="hf-link desktop-only">Admin</Link>
              )}
              <button onClick={logout} className="hf-ghost desktop-only">Logout</button>
            </>
          )}

          {/* CTA ALWAYS VISIBLE */}
          <Link to="/create" className="hf-cta">Start a fundraiser</Link>

          {/* MOBILE MENU BUTTON */}
          <button
            className="hf-menu-btn mobile-only"
            onClick={() => setOpen(!open)}
          >
            ⋮
          </button>
        </div>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      {open && (
        <div className="hf-mobile-menu">
          <Link to="/" onClick={() => setOpen(false)}>Home</Link>
          <Link to="/campaigns" onClick={() => setOpen(false)}>Campaigns</Link>
          <Link to="/contact" onClick={() => setOpen(false)}>Contact</Link>

          {!auth?.token ? (
            <>
              <Link to="/login" onClick={() => setOpen(false)}>Sign in</Link>
              <Link to="/signup" onClick={() => setOpen(false)}>Sign up</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" onClick={() => setOpen(false)}>My Dashboard</Link>
              {auth.role === "admin" && (
                <Link to="/admin" onClick={() => setOpen(false)}>Admin</Link>
              )}
              <button onClick={logout} className="hf-mobile-logout">
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
