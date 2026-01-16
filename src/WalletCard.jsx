import React from "react";

export default function WalletCard({ account, network }) {
  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 6 }}>
      <div><strong>Account:</strong> {account}</div>
      <div>
        <strong>Network:</strong>{" "}
        {network ? `${network.name} (Chain ID: ${network.chainId})` : "—"}
      </div>
    </div>
  );
}
