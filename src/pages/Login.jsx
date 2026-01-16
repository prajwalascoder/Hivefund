// src/pages/Login.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Login({ onAuthChange }) {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await axios.post(`${import.meta.env.VITE_BACKEND || "http://localhost:4001"}/api/auth/login`, { email: email.trim(), password });
      const data = r.data;
      localStorage.setItem("hf_token", data.token);
      localStorage.setItem("hf_role", data.role);
      localStorage.setItem("hf_email", data.email || "");
      if (typeof onAuthChange === "function") onAuthChange({ token: data.token, role: data.role, email: data.email });
      nav("/");
    } catch (err) {
      alert(err?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page-wrap">
      <div className="auth-card">
        <h2>Sign in</h2>
        <div className="page-caption">Welcome back — sign in to manage donations and start campaigns.</div>

        <form className="form" onSubmit={submit} style={{ marginTop: 18 }}>
          <label>Email
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" required />
          </label>

          <label style={{ marginTop: 12 }}>Password
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" required />
          </label>

          <div className="form-actions" style={{ marginTop: 16 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => { setEmail(""); setPassword(""); }}>
              Clear
            </button>
            <div style={{ marginLeft: "auto" }}>
              <Link to="/signup" className="btn-link">Create account</Link>
            </div>
          </div>
        </form>

        <div className="auth-footer-links" style={{ marginTop: 12 }}>
          Need help? <a href="/help" style={{ color: "#1f6f3a" }}>Visit Help Center</a>
        </div>
      </div>
    </div>
  );
}
