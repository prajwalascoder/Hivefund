// src/pages/Donate.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const BACKEND = import.meta.env.VITE_BACKEND || "http://localhost:4001";

export default function Donate() {
  const { id } = useParams(); // metaId / campaignId
  const nav = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [amount, setAmount] = useState(500);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  /* ---------------- PROFILE CHECK ---------------- */
  useEffect(() => {
    const token = localStorage.getItem("hf_token");
    if (token) {
      axios.get(`${BACKEND}/api/dashboard/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          const p = res.data?.user?.profile;
          if (!p || !p.name || !p.gender || !p.dob || !p.country || !p.mobile) {
            alert("Please complete your profile inside the Dashboard before making a donation.");
            nav("/dashboard");
          }
        }).catch(console.error);
    }
  }, [nav]);

  /* ---------------- FETCH CAMPAIGN ---------------- */
  useEffect(() => {
    let cancelled = false;

    axios.get(`${BACKEND}/api/campaign/${id}`)
      .then(res => {
        if (!cancelled) setCampaign(res.data || null);
      })
      .catch(() => {
        if (!cancelled) setCampaign(null);
      });

    return () => { cancelled = true; };
  }, [id]);

  /* ---------------- AUTH CHECK ---------------- */
  function ensureAuth() {
    const token = localStorage.getItem("hf_token");
    if (!token) {
      nav("/login");
      return false;
    }
    return true;
  }

  /* ---------------- PAYMENT FLOW ---------------- */
  async function startPayment(selectedAmount) {
    if (!ensureAuth()) return;

    const useAmount = Number(selectedAmount || amount || custom || 0);
    if (!useAmount || useAmount <= 0) {
      alert("Enter a valid amount");
      return;
    }

    setLoading(true);

    try {
      /* 1️⃣ Create Razorpay Order */
      const resp = await axios.post(
        `${BACKEND}/api/donate/create-order`,
        { amountINR: useAmount, campaignId: id },
        { headers: { Authorization: `Bearer ${localStorage.getItem("hf_token")}` } }
      );

      const { order, key } = resp.data;

      /* 2️⃣ Load Razorpay Script */
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = resolve;
          s.onerror = reject;
          document.body.appendChild(s);
        });
      }

      /* 3️⃣ Razorpay Options */
      const options = {
        key,
        order_id: order.id,
        amount: order.amount,
        currency: "INR",
        name: "HiveFund",
        description: `Donation for ${campaign?.title || "Campaign"}`,

        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true
        },

        prefill: {
          email: localStorage.getItem("hf_email") || ""
        },

        handler: async function (response) {
          try {
            await axios.post(
              `${BACKEND}/api/donate/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                campaignId: id,
                amountINR: useAmount,
                isAnonymous
              },
              { headers: { Authorization: `Bearer ${localStorage.getItem("hf_token")}` } }
            );

            alert("Donation successful — thank you!");
            nav("/campaigns");
          } catch (err) {
            console.error("Verification failed:", err);
            alert("Payment verification failed");
          }
        },

        modal: {
          ondismiss: () => setLoading(false)
        }
      };

      /* 4️⃣ Open Razorpay */
      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error("Payment error:", err);
      alert("Unable to start payment");
    } finally {
      setLoading(false);
    }
  }

  if (!campaign) {
    return <div style={{ padding: 20 }}>Loading campaign…</div>;
  }

  /* ---------------- UI ---------------- */
  return (
    <div style={{ maxWidth: 820, margin: "28px auto", padding: 18 }}>
      <div className="card">
        <h2>Donate to: {campaign.title}</h2>
        <p className="small muted">{campaign.description}</p>

        {/* Preset buttons */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          {[100, 250, 500, 1000, 2000].map(x => (
            <button
              key={x}
              className="btn"
              style={{
                background: amount === x ? "#1f6f3a" : "#f1f5f9",
                color: amount === x ? "#fff" : "#0b1220",
                borderRadius: 10
              }}
              onClick={() => { setAmount(x); setCustom(""); }}
            >
              ₹{x}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontWeight: 600 }}>Custom amount (INR)</label>
          <input
            type="number"
            value={custom}
            onChange={e => setCustom(e.target.value)}
            placeholder="Enter amount"
            style={{
              padding: 10,
              borderRadius: 8,
              border: "1px solid #e6eef8",
              width: 220,
              display: "block",
              marginTop: 6
            }}
          />
        </div>

        {/* Anonymous toggle */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input 
              type="checkbox" 
              checked={isAnonymous} 
              onChange={e => setIsAnonymous(e.target.checked)} 
              style={{ width: 18, height: 18 }} 
            />
            Donate anonymously (Hide my name)
          </label>
        </div>

        {/* Donate button */}
        <button
          className="btn btn-primary"
          onClick={() => startPayment(custom ? Number(custom) : amount)}
          disabled={loading}
        >
          {loading ? "Opening payment…" : `Donate ₹${custom || amount}`}
        </button>
      </div>
    </div>
  );
}
