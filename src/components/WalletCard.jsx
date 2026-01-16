import React from "react";
export default function WalletCard({ account, network }) {
  return (
    <div style={{ textAlign: "right", color: "white", fontSize:12 }}>
      <div style={{ fontWeight:700 }}>{account?.slice(0,6)}...{account?.slice(-4)}</div>
      <div style={{ color: "rgba(255,255,255,0.7)", fontSize:11 }}>{network ? `${network.name} (${network.chainId})` : ""}</div>
    </div>
  );
}
