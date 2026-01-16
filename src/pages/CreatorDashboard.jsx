import React, { useEffect, useState } from "react";
import axios from "axios";
import { ethers } from "ethers";
import contractABI from "../contractABI.json";

export default function CreatorDashboard({ provider }) {
  const [created, setCreated] = useState([]);
  useEffect(()=>{ async function l(){ try{ const token = localStorage.getItem("hf_token"); if(!token) return; const res = await axios.get(`${import.meta.env.VITE_BACKEND}/api/creator/dashboard`, { headers:{ Authorization:`Bearer ${token}` } }); setCreated(res.data.created || []); }catch(e){console.error(e);} } l(); }, [provider]);

  return (
    <div>
      <h2>My Campaigns</h2>
      <div className="grid">
        {created.length===0 && <div className="card small">No campaigns yet</div>}
        {created.map(c => (
          <div className="card" key={c.metaId}>
            <img className="campaign-img" src={c.imageUrl} alt=""/>
            <h4>{c.title}</h4>
            <div className="small">On-chain ID: {c.campaignId}</div>
            <div className="small">Pledged: {c.pledgedWei ? ethers.utils.formatEther(c.pledgedWei) + " ETH" : "—"}</div>
            <div className="small">Goal: {c.goalEth} ETH</div>
            <div style={{ marginTop:8 }}><a className="link-btn" href={`/campaign/${c.campaignId}`}>View</a></div>
          </div>
        ))}
      </div>
    </div>
  );
}
