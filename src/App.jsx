// src/App.jsx
import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Campaigns from "./pages/Campaigns";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CreatePage from "./pages/CreatePage";
import CampaignDetails from "./pages/CampaignDetails";
import Donate from "./pages/Donate";
import AdminPage from "./pages/AdminPage";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import HelpCenter from "./pages/HelpCenter";
import OurStory from "./pages/OurStory";
import CreatorDocs from "./pages/CreatorDocs";
import MyDashboard from "./pages/MyDashboard";


export default function App() {
  const [auth, setAuth] = useState({
    token: localStorage.getItem("hf_token") || null,
    role: localStorage.getItem("hf_role") || null,
    email: localStorage.getItem("hf_email") || null,
  });

  function onAuthChange(newAuth) {
    if (!newAuth) {
      localStorage.removeItem("hf_token");
      localStorage.removeItem("hf_role");
      localStorage.removeItem("hf_email");
      setAuth({ token: null, role: null, email: null });
      return;
    }
    if (newAuth.token) localStorage.setItem("hf_token", newAuth.token);
    if (newAuth.role) localStorage.setItem("hf_role", newAuth.role);
    if (newAuth.email) localStorage.setItem("hf_email", newAuth.email);
    setAuth({ token: newAuth.token || null, role: newAuth.role || null, email: newAuth.email || null });
  }

  return (
    <div className="app-root">
      <Header auth={auth} onAuthChange={onAuthChange} />
      <main style={{ minHeight: "72vh" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/login" element={<Login onAuthChange={onAuthChange} />} />
          <Route path="/signup" element={<Signup onAuthChange={onAuthChange} />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/campaign/:id" element={<CampaignDetails />} />
          <Route path="/campaign/:id/donate" element={<Donate />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/our-story" element={<OurStory />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/creator-docs" element={<CreatorDocs />} />
          <Route path="/dashboard" element={<MyDashboard />} />

          <Route path="*" element={<div style={{ padding: 40 }}>Page not found</div>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
