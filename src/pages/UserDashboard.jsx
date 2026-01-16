import React, { useEffect, useState } from "react";
import axios from "axios";

export default function UserDashboard(){
  const [donations, setDonations] = useState([]);
  useEffect(()=>{ async function l(){ try{ const token = localStorage.getItem("hf_token"); if(!token) return; const r = await axios.get(`${import.meta.env.VITE_BACKEND}/api/user/dashboard`, { headers:{ Authorization:`Bearer ${token}` } }); setDonations(r.data.donations || []);}catch(e){console.error(e);} } l(); }, []);
  return (
    <div>
      <h2>My Donations</h2>
      <div className="grid">
        {donations.length===0 && <div className="card small">You haven't donated yet.</div>}
        {donations.map(d => (
          <div className="card" key={d.id}>
            <div style={{ fontWeight:700 }}>{d.type} — {d.amount} {d.currency}</div>
            <div className="small">{d.verified ? "Verified" : "Pending"} • {new Date(d.createdAt).toLocaleString()}</div>
            <div className="mono" style={{ marginTop:6 }}>{d.txHash || d.razorpayPaymentId || d.razorpayOrderId || ""}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
