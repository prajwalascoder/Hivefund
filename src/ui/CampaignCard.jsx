import React from "react";
import { ethers } from "ethers";

function format(wei){
  try { return ethers.utils.formatEther(ethers.BigNumber.from(wei)); } catch { return "0"; }
}
function formatDate(ts){
  try { return new Date(ts*1000).toLocaleString(); } catch { return "-"; }
}

export default function CampaignCard({ campaign }) {
  return (
    <div className="card">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <strong>#{campaign.id}</strong>
        <div className="small">by {campaign.creator}</div>
      </div>
      <div style={{ marginTop: 8 }}>
        <div className="small">Goal: <strong>{format(campaign.goalWei)} ETH</strong></div>
        <div className="small">Pledged: <strong>{format(campaign.pledgedWei)} ETH</strong></div>
        <div className="small">Deadline: <span className="mono">{formatDate(campaign.deadline)}</span></div>
      </div>
    </div>
  );
}
