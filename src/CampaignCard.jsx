import React, { useState } from "react";
import { ethers } from "ethers";
import contractABI from "./contractABI.json";

function formatEth(weiStr) {
  try { return ethers.utils.formatEther(ethers.BigNumber.from(weiStr)); } catch { return "0"; }
}
function formatDate(ts) {
  try { return new Date(ts * 1000).toLocaleString(); } catch { return "-"; }
}

export default function CampaignCard({ campaign, signer, contractAddress, onActionComplete }) {
  const [pledgeAmount, setPledgeAmount] = useState("0.01");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const isEnded = campaign.deadline > 0 && Date.now() / 1000 > campaign.deadline;

  async function handlePledge() {
    if (!signer) return alert("Connect wallet");
    setLoading(true);
    setMsg("");
    try {
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const tx = await contract.pledge(campaign.id, { value: ethers.utils.parseEther(pledgeAmount) });
      setMsg("Waiting for confirmation...");
      await tx.wait();
      setMsg("Pledged ✅");
      onActionComplete && onActionComplete();
    } catch (err) {
      console.error(err);
      setMsg("Error: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw() {
    if (!signer) return alert("Connect wallet");
    setLoading(true);
    setMsg("");
    try {
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const tx = await contract.withdraw(campaign.id);
      setMsg("Waiting for withdraw confirmation...");
      await tx.wait();
      setMsg("Withdrawn ✅");
      onActionComplete && onActionComplete();
    } catch (err) {
      console.error(err);
      setMsg("Error: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="card-head">
        <strong>Campaign #{campaign.id}</strong>
        <div className="muted small">by {campaign.creator}</div>
      </div>

      <div className="card-body">
        <p>Goal: <strong>{formatEth(campaign.goalWei)} ETH</strong></p>
        <p>Pledged: <strong>{formatEth(campaign.pledgedWei)} ETH</strong></p>
        <p>Deadline: <span className="muted">{formatDate(campaign.deadline)}</span></p>

        <div style={{ marginTop: 10 }}>
          {!isEnded ? (
            <div className="pledge-row">
              <input className="small-input" value={pledgeAmount} onChange={(e)=>setPledgeAmount(e.target.value)} />
              <button className="btn" onClick={handlePledge} disabled={loading}>
                {loading ? "Processing..." : "Pledge"}
              </button>
            </div>
          ) : (
            <div>
              <div className="muted">Campaign ended</div>
              <button className="btn" onClick={handleWithdraw} disabled={loading}>
                {loading ? "Processing..." : "Withdraw (creator only)"}
              </button>
            </div>
          )}
        </div>

        <div className="muted" style={{ marginTop: 8 }}>{msg}</div>
      </div>
    </div>
  );
}
