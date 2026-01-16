import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import contractABI from "../contractABI.json";
import CampaignCard from "./CampaignCard";

export default function CampaignList({ provider, contractAddress }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function load() {
      if (!provider || !contractAddress) return;
      try {
        const contract = new ethers.Contract(contractAddress, contractABI, provider);
        const cntBN = await contract.campaignCount();
        const cnt = Number(cntBN.toString());
        const arr = [];
        for (let i = 1; i <= cnt; i++) {
          const c = await contract.campaigns(i);
          arr.push({
            id: i,
            creator: c.creator,
            goalWei: c.goalWei.toString(),
            pledgedWei: c.pledgedWei.toString(),
            deadline: Number(c.deadline.toString()),
            withdrawn: c.withdrawn
          });
        }
        setItems(arr.reverse());
      } catch (err) { console.error(err); }
    }
    load();
  }, [provider, contractAddress]);

  if (!items.length) return <div className="card small">No campaigns on-chain.</div>;

  return (
    <div className="grid" style={{ marginTop: 12 }}>
      {items.map(c => <CampaignCard key={c.id} campaign={c} />)}
    </div>
  );
}
