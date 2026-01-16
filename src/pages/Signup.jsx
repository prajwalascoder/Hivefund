// src/pages/Signup.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Signup({ onAuthChange }) {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await axios.post(`${import.meta.env.VITE_BACKEND || "http://localhost:4001"}/api/auth/signup`, { email: email.trim(), password });
      const data = r.data;
      localStorage.setItem("hf_token", data.token);
      localStorage.setItem("hf_role", data.role);
      localStorage.setItem("hf_email", data.email || "");
      if (typeof onAuthChange === "function") onAuthChange({ token: data.token, role: data.role, email: data.email });
      nav("/");
    } catch (err) {
      const e = err?.response?.data?.error;
      if (e === "email_exists") alert("Email already exists. Try logging in.");
      else alert("Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page-wrap">
      <div className="auth-card">
        <h2>Create account</h2>
        <div className="page-caption">Sign up to start or donate to fundraisers.</div>

        <form className="form" onSubmit={submit} style={{ marginTop: 18 }}>
          <label>Email
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" required />
          </label>

          <label style={{ marginTop: 12 }}>Password
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" required minLength={6} />
          </label>

          <div className="form-actions" style={{ marginTop: 16 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Creating…" : "Create account"}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => { setEmail(""); setPassword(""); }}>
              Clear
            </button>
            <div style={{ marginLeft: "auto" }}>
              <Link to="/login" className="btn-link">Already have an account?</Link>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
