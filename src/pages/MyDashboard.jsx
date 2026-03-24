import React, { useEffect, useState } from "react";

export default function MyDashboard() {
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState({ name: "", dob: "" });
  const [bank, setBank] = useState({
    accountName: "",
    accountNumber: "",
    ifsc: ""
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch("/api/user/dashboard", {
      headers: { Authorization: "Bearer " + token }
    })
      .then(res => res.json())
      .then(res => setData(res));
  }, []);

  const updateProfile = async () => {
    await fetch("/api/user/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify(profile)
    });
    alert("Profile Updated ✅");
  };

  const saveBank = async () => {
    await fetch("/api/user/bank", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify(bank)
    });
    alert("Bank Details Saved ✅");
  };

  const withdraw = async (id) => {
    const res = await fetch("/api/campaign/withdraw", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({ campaignId: id })
    });

    const result = await res.json();
    alert(result.message || result.error);
  };

  if (!data) return <div style={{ padding: 40 }}>Loading...</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>MyDashboard</h1>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <h3>Total Donated</h3>
          <p style={styles.amount}>₹{data.totalDonated}</p>
        </div>

        <div style={styles.statCard}>
          <h3>Total Raised</h3>
          <p style={styles.amount}>₹{data.totalRaised}</p>
        </div>
      </div>

      {/* Profile Section */}
      <div style={styles.card}>
        <h3>Update Profile</h3>
        <input
          style={styles.input}
          placeholder="Full Name"
          onChange={e => setProfile({ ...profile, name: e.target.value })}
        />
        <input
          style={styles.input}
          type="date"
          onChange={e => setProfile({ ...profile, dob: e.target.value })}
        />
        <button style={styles.button} onClick={updateProfile}>
          Save Profile
        </button>
      </div>

      {/* Bank Section */}
      <div style={styles.card}>
        <h3>Bank Details (Required for Withdrawal)</h3>
        <input
          style={styles.input}
          placeholder="Account Holder Name"
          onChange={e => setBank({ ...bank, accountName: e.target.value })}
        />
        <input
          style={styles.input}
          placeholder="Account Number"
          onChange={e => setBank({ ...bank, accountNumber: e.target.value })}
        />
        <input
          style={styles.input}
          placeholder="IFSC Code"
          onChange={e => setBank({ ...bank, ifsc: e.target.value })}
        />
        <button style={styles.button} onClick={saveBank}>
          Save Bank Details
        </button>
      </div>

      {/* Campaigns */}
      <div style={styles.card}>
        <h3>My Campaigns</h3>
        {data.campaigns?.length === 0 && <p>No campaigns yet.</p>}

        {data.campaigns?.map(c => (
          <div key={c.id} style={styles.campaignBox}>
            <h4>{c.title}</h4>
            <p>Goal: ₹{c.goal}</p>
            <p>Raised: ₹{c.raised}</p>

            {c.raised >= c.goal * 0.7 ? (
              <button
                style={{ ...styles.button, background: "#00b894" }}
                onClick={() => withdraw(c.id)}
              >
                Withdraw Funds
              </button>
            ) : (
              <button style={styles.disabledButton} disabled>
                Goal Not Reached (70% Required)
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  container: {
    maxWidth: "900px",
    margin: "40px auto",
    padding: "20px",
    fontFamily: "system-ui, sans-serif"
  },
  title: {
    textAlign: "center",
    marginBottom: "30px"
  },
  statsRow: {
    display: "flex",
    gap: "20px",
    marginBottom: "30px"
  },
  statCard: {
    flex: 1,
    padding: "20px",
    borderRadius: "12px",
    background: "#f1f3f6",
    textAlign: "center"
  },
  amount: {
    fontSize: "24px",
    fontWeight: "bold"
  },
  card: {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    marginBottom: "25px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid #ddd"
  },
  button: {
    padding: "10px 18px",
    borderRadius: "8px",
    border: "none",
    background: "#6c5ce7",
    color: "white",
    cursor: "pointer"
  },
  disabledButton: {
    padding: "10px 18px",
    borderRadius: "8px",
    border: "none",
    background: "#ccc",
    color: "#555"
  },
  campaignBox: {
    padding: "15px",
    borderRadius: "10px",
    background: "#fafafa",
    marginBottom: "15px"
  }
};
