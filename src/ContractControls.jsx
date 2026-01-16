import React, { useState } from "react";
import { ethers } from "ethers";
import contractABI from "./contractABI.json";

export default function ContractControls({ signer, contractAddress }) {
  const [campaignGoal, setCampaignGoal] = useState("0.1");
  const [pledgeAmount, setPledgeAmount] = useState("0.01");
  const [message, setMessage] = useState("");

  if (!contractAddress) {
    return <div>Add contract address in .env file</div>;
  }

  async function createCampaign() {
    try {
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const tx = await contract.createCampaign(
        ethers.utils.parseEther(campaignGoal),
        7 * 24 * 3600
      );

      setMessage("Creating campaign...");
      await tx.wait();
      setMessage("Campaign created!");
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function pledge() {
    try {
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const tx = await contract.pledge(1, {
        value: ethers.utils.parseEther(pledgeAmount),
      });

      setMessage("Pledging...");
      await tx.wait();
      setMessage("Pledged!");
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div>
      <h3>Contract Actions</h3>

      <div>
        <input
          value={campaignGoal}
          onChange={(e) => setCampaignGoal(e.target.value)}
        />{" "}
        ETH Goal
        <button onClick={createCampaign}>Create</button>
      </div>

      <div style={{ marginTop: 10 }}>
        <input
          value={pledgeAmount}
          onChange={(e) => setPledgeAmount(e.target.value)}
        />{" "}
        ETH Pledge
        <button onClick={pledge}>Pledge to Campaign 1</button>
      </div>

      <p>{message}</p>
    </div>
  );
}
