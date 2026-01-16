import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import contractABI from "./contractABI.json";
import CampaignCard from "./CampaignCard";

export default function CampaignList({ provider, signer, contractAddress, refreshKey, onActionComplete }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setCampaigns([]);
      if (!contractAddress || !provider) {
        setLoading(false);
        return;
      }

      try {
        const readProvider = provider; // provider is Web3Provider
        const contract = new ethers.Contract(contractAddress, contractABI, readProvider);
        const countBN = await contract.campaignCount();
        const count = Number(countBN.toString());
        const items = [];
        for (let i = 1; i <= count; i++) {
          const c = await contract.campaigns(i);
          // returned tuple: (creator, goalWei, pledgedWei, deadline, withdrawn)
          items.push({
            id: i,
            creator: c.creator,
            goalWei: c.goalWei.toString(),
            pledgedWei: c.pledgedWei.toString(),
            deadline: Number(c.deadline.toString()),
            withdrawn: c.withdrawn
          });
        }
        if (!cancelled) setCampaigns(items.reverse()); // newest first
      } catch (err) {
        console.error("load campaigns err", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [provider, contractAddress, refreshKey]);

  return (
    <div style={{ marginTop: 18 }}>
      <h2>Campaigns</h2>
      {loading && <div className="muted">Loading campaigns…</div>}
      {!loading && campaigns.length === 0 && <div className="muted">No campaigns yet.</div>}
      <div className="grid">
        {campaigns.map((c) => (
          <CampaignCard
            key={c.id}
            campaign={c}
            signer={signer}
            contractAddress={contractAddress}
            onActionComplete={onActionComplete}
          />
        ))}
      </div>
    </div>
  );
}
