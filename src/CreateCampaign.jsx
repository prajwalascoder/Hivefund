import React, { useState } from "react";
import { ethers } from "ethers";
import contractABI from "./contractABI.json";

export default function CreateCampaign({ signer, contractAddress, onDone }) {
  const [goal, setGoal] = useState("0.1");
  const [durationDays, setDurationDays] = useState("7");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleCreate(e) {
    e.preventDefault();
    if (!signer) return alert("Connect wallet first");
    if (!contractAddress) return alert("Contract address not set in .env");

    setLoading(true);
    setMsg("");
    try {
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const goalWei = ethers.utils.parseEther(goal);
      const duration = Math.max(1, Number(durationDays)) * 24 * 3600;
      const tx = await contract.createCampaign(goalWei, duration);
      setMsg("Waiting for confirmation...");
      await tx.wait();
      setMsg("Campaign created ✅");
      setGoal("0.1");
      setDurationDays("7");
      onDone && onDone();
    } catch (err) {
      console.error(err);
      setMsg("Error: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Create campaign</h2>
      <form onSubmit={handleCreate} className="form">
        <label>
          Goal (ETH)
          <input value={goal} onChange={(e) => setGoal(e.target.value)} />
        </label>

        <label>
          Duration (days)
          <input value={durationDays} onChange={(e) => setDurationDays(e.target.value)} />
        </label>

        <div style={{ marginTop: 10 }}>
          <button className="btn" disabled={loading}>
            {loading ? "Creating..." : "Create Campaign"}
          </button>
        </div>

        <div className="muted">{msg}</div>
      </form>
    </div>
  );
}
