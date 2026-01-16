import React, { useEffect, useState } from "react";
import axios from "axios";

const BACKEND = import.meta.env.VITE_BACKEND || "http://localhost:4001";

export default function MyDashboard() {
  const token = localStorage.getItem("hf_token");
  const email = localStorage.getItem("hf_email");

  const [campaigns, setCampaigns] = useState([]);
  const [wallet, setWallet] = useState("");

  useEffect(() => {
    axios.get(`${BACKEND}/api/approved`)
      .then(res => {
        const all = res.data || [];
        setCampaigns(all.filter(c => c.creatorEmail === email));
      });
  }, []);

  async function saveWallet() {
    await axios.post(
      `${BACKEND}/api/creator/wallet`,
      { wallet },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    alert("Wallet saved");
  }

  async function withdraw(id) {
    await axios.post(
      `${BACKEND}/api/campaign/${id}/withdraw`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    alert("Withdrawal successful");
    window.location.reload();
  }

  return (
    <div style={{ maxWidth: 900, margin: "30px auto" }}>
      <h2>My Dashboard</h2>

      <h3>Creator Settings</h3>
      <input
        placeholder="Your MetaMask wallet"
        value={wallet}
        onChange={e => setWallet(e.target.value)}
      />
      <button onClick={saveWallet}>Save Wallet</button>

      <h3 style={{ marginTop: 30 }}>My Campaigns</h3>

      {campaigns.map(c => {
        const canWithdraw =
          c.raised_inr >= c.goal_inr ||
          new Date() > new Date(c.deadline);

        return (
          <div key={c.metaId} className="card">
            <strong>{c.title}</strong>
            <div>₹{c.raised_inr} / ₹{c.goal_inr}</div>

            {!c.withdrawn && canWithdraw && (
              <button onClick={() => withdraw(c.metaId)}>
                Withdraw Funds
              </button>
            )}

            {c.withdrawn && <span>Withdrawn</span>}
          </div>
        );
      })}

      <hr />

      <h3>Donor Section</h3>
      <a
        href={`${BACKEND}/api/donor/certificate`}
        target="_blank"
        rel="noreferrer"
      >
        Download Donation Certificate
      </a>
    </div>
  );
}
