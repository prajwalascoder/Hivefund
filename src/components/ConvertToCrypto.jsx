// src/components/ConvertToCrypto.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

/*
 Props:
  - amountINR (number)  : the INR donation amount (e.g. 500)
  - recipientAddress (string) : the Ethereum address to receive the crypto
  - onComplete (fn) optional : callback after tx submitted/confirmed
*/
export default function ConvertToCrypto({ amountINR, recipientAddress, onComplete }) {
  const [priceINR, setPriceINR] = useState(null);
  const [ethAmount, setEthAmount] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!amountINR) return;
    let mounted = true;
    (async () => {
      try {
        const r = await axios.get(`${import.meta.env.VITE_BACKEND || "http://localhost:4001"}/api/price/eth`);
        const price = r.data?.inr;
        if (!mounted) return;
        setPriceINR(price);
        const eth = Number(amountINR) / Number(price);
        // round to 6 decimal places for UX
        setEthAmount(Number(eth.toFixed(6)));
      } catch (err) {
        console.error("price fetch failed", err);
      }
    })();
    return () => { mounted = false; };
  }, [amountINR]);

  async function sendViaMetaMask() {
    if (!window.ethereum) return alert("MetaMask not detected. Install MetaMask or use a compatible wallet.");
    if (!recipientAddress) return alert("Recipient address missing.");
    if (!ethAmount || ethAmount <= 0) return alert("Invalid eth amount.");

    try {
      setLoading(true);
      // request accounts
      await window.ethereum.request({ method: "eth_requestAccounts" });

      // compute value in wei hex
      // Avoid floating errors: convert via BigInt
      const wei = BigInt(Math.floor(ethAmount * 1e18)); // careful: 1e18 fits in JS safe integer? Using BigInt of floor is fine for demo
      const hexValue = "0x" + wei.toString(16);

      const txParams = {
        from: (await window.ethereum.request({ method: "eth_accounts" }))[0],
        to: recipientAddress,
        value: hexValue,
        // gas, gasPrice optional — MetaMask will estimate
      };

      // open MetaMask send dialog
      const txHash = await window.ethereum.request({ method: "eth_sendTransaction", params: [txParams] });
      // txHash returned (pending)
      alert("Transaction submitted. Hash: " + txHash);
      if (typeof onComplete === "function") onComplete({ txHash, ethAmount, amountINR });
    } catch (err) {
      console.error("MetaMask send error", err);
      alert("Transaction failed or was cancelled by user.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ padding: 14, marginTop: 12 }}>
      <h4>Convert INR donation to crypto</h4>
      <p className="small muted">You paid ₹{amountINR}. We estimate this equals <strong>{ethAmount ?? "—" } ETH</strong> (1 ETH ≈ ₹{priceINR ?? "—"}).</p>

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button className="btn btn-primary" onClick={sendViaMetaMask} disabled={loading || !ethAmount}>
          {loading ? "Opening MetaMask..." : `Send ≈ ${ethAmount ?? "—"} ETH via MetaMask`}
        </button>
        <button className="btn btn-outline" onClick={() => {
          // copy amount or show QR
          navigator.clipboard?.writeText(ethAmount ? ethAmount.toString() : "");
          alert("ETH amount copied to clipboard.");
        }}>Copy ETH amount</button>
      </div>

      <div style={{ marginTop: 8 }} className="small muted">
        Note: you must have ETH in your wallet to pay gas. This action sends crypto from your wallet to the campaign's wallet — HiveFund does not custody the crypto.
      </div>
    </div>
  );
}
