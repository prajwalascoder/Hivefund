import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BACKEND = import.meta.env.VITE_BACKEND || "http://localhost:4001";

export default function MyDashboard() {
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile"); // 'profile', 'donor', 'creator', 'settings'

  // Settings State
  const [profile, setProfile] = useState({ name: "", gender: "", dob: "", country: "", mobile: "" });
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [bankAccount, setBankAccount] = useState({ accountName: "", accountNumber: "", ifsc: "" });

  const [withdrawState, setWithdrawState] = useState({ campaignId: null, method: "wallet" });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("hf_token");
      if (!token) {
        nav("/login");
        return;
      }

      const res = await axios.get(`${BACKEND}/api/dashboard/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setData(res.data);
      setProfile(res.data.user.profile || { name: "", gender: "", dob: "", country: "", mobile: "" });
      setIsAnonymous(res.data.user.isAnonymous);
      setWalletAddress(res.data.user.wallet || "");
      setBankAccount(res.data.user.bankAccount || { accountName: "", accountNumber: "", ifsc: "" });
      
      const p = res.data.user.profile;
      if (p?.name && p?.gender && p?.dob && p?.country && p?.mobile) {
        setActiveTab("donor");
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        localStorage.removeItem("hf_token");
        nav("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!profile.name || !profile.gender || !profile.dob || !profile.country || !profile.mobile) {
      alert("Please fill in all mandatory profile fields first!");
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem("hf_token");
      await axios.put(`${BACKEND}/api/dashboard/preferences`, {
        profile,
        isAnonymous,
        walletAddress,
        bankAccount
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Settings saved successfully!");
      fetchDashboard();
    } catch (err) {
      console.error(err);
      alert("Failed to save settings");
    } finally {
      setActionLoading(false);
    }
  };

  const downloadReceipt = (paymentId) => {
    const token = localStorage.getItem("hf_token");
    window.open(`${BACKEND}/api/dashboard/receipt/${paymentId}?token=${token}`, '_blank');
  };

  const handleWithdraw = async (campaignId) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("hf_token");
      const res = await axios.post(`${BACKEND}/api/dashboard/withdraw`, {
        campaignId,
        method: withdrawState.method
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(res.data.message);
      fetchDashboard();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.response?.data?.error || "Failed to process withdrawal");
    } finally {
      setActionLoading(false);
      setWithdrawState({ campaignId: null, method: "wallet" });
    }
  };

  if (loading) return <div style={styles.loading}>Loading your dashboard...</div>;
  if (!data) return <div style={styles.loading}>Failed to load data.</div>;

  return (
    <div className="page-transition" style={styles.container}>
      {/* Header Section */}
      <div style={styles.header}>
        <h1 style={styles.title}>Welcome back, {profile.name || 'User'}!</h1>
        <p style={styles.subtitle}>Manage your campaigns, donations, and settings from here.</p>
      </div>

      {/* Stats Summary */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Total Donated</p>
          <h2 style={styles.statValue}>₹{data.totalDonated.toLocaleString()}</h2>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Total Raised</p>
          <h2 style={styles.statValue}>₹{data.totalRaised.toLocaleString()}</h2>
        </div>
      </div>

      {/* Notifications */}
      {data.notifications && data.notifications.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {data.notifications.map((n, i) => {
            const severityStyles = {
              error:   { bg: "#fef2f2", border: "#fecaca", color: "#991b1b", icon: "🚫" },
              warning: { bg: "#fef3c7", border: "#fbbf24", color: "#92400e", icon: "⚠️" },
              success: { bg: "#d1fae5", border: "#34d399", color: "#065f46", icon: "✅" },
              info:    { bg: "#f0f9ff", border: "#93c5fd", color: "#1e40af", icon: "ℹ️" }
            };
            const s = severityStyles[n.severity] || severityStyles.info;

            const titleMap = {
              campaign_rejected:   "Campaign Rejected",
              campaign_approved:   "Campaign Approved!",
              deadline_expired:    "Campaign Expired",
              withdrawal_complete: "Withdrawal Complete"
            };

            return (
              <div key={n._id || i} style={{
                padding: "14px 18px",
                borderRadius: 10,
                marginBottom: 8,
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                background: s.bg,
                border: `1px solid ${s.border}`,
                color: s.color
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{s.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: 2 }}>
                    {n.title || titleMap[n.type] || "Notification"}
                  </div>
                  <div style={{ fontSize: "0.82rem", lineHeight: 1.5 }}>
                    {n.message}
                  </div>
                  {n.type === "deadline_expired" && !n.autoWithdrawn && n.raised > 0 && (
                    <div style={{ fontSize: "0.78rem", marginTop: 4, fontStyle: "italic" }}>
                      Funds will be automatically transferred to your configured payment method.
                    </div>
                  )}
                  {n.createdAt && (
                    <div style={{ fontSize: "0.72rem", marginTop: 4, opacity: 0.7 }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Tabs */}
      <div style={styles.tabsMenu}>
        <button 
          style={activeTab === 'profile' ? styles.tabActive : styles.tab} 
          onClick={() => {
            if (activeTab !== 'profile' && (!profile.name || !profile.gender || !profile.dob || !profile.country || !profile.mobile)) {
               alert("Please complete all mandatory profile fields before proceeding.");
               return;
            }
            setActiveTab('profile')
          }}
        >
          My Profile
        </button>
        <button 
          style={activeTab === 'donor' ? styles.tabActive : styles.tab} 
          onClick={() => {
            if (!profile.name || !profile.gender || !profile.dob || !profile.country || !profile.mobile) {
               alert("Please complete your profile first.");
               setActiveTab('profile'); return;
            }
            setActiveTab('donor')
          }}
        >
          Donor Dashboard
        </button>
        <button 
          style={activeTab === 'creator' ? styles.tabActive : styles.tab} 
          onClick={() => {
            if (!profile.name || !profile.gender || !profile.dob || !profile.country || !profile.mobile) {
               alert("Please complete your profile first.");
               setActiveTab('profile'); return;
            }
            setActiveTab('creator')
          }}
        >
          Creator Dashboard
        </button>
        <button 
          style={activeTab === 'settings' ? styles.tabActive : styles.tab} 
          onClick={() => {
            if (!profile.name || !profile.gender || !profile.dob || !profile.country || !profile.mobile) {
               alert("Please complete your profile first.");
               setActiveTab('profile'); return;
            }
            setActiveTab('settings')
          }}
        >
          Payment Settings
        </button>
      </div>

      <div style={styles.tabContent}>
        {/* ================= PROFILE SECTION ================= */}
        {activeTab === 'profile' && (
          <div className="fade-in" style={styles.settingsGrid}>
            <div style={styles.settingsCard}>
              <h3 style={styles.cardTitle}>Complete Your Profile</h3>
              <p style={{ color: "#d97706", fontSize: "0.9rem", marginBottom: "16px" }}>All fields below are mandatory.</p>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>Full Name*</label>
                <input 
                  type="text" 
                  style={styles.input} 
                  value={profile.name}
                  onChange={e => setProfile({...profile, name: e.target.value})}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Gender*</label>
                <select 
                  style={styles.selectInput}
                  value={profile.gender}
                  onChange={e => setProfile({...profile, gender: e.target.value})}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Date of Birth*</label>
                <input 
                  type="date" 
                  style={styles.input} 
                  value={profile.dob}
                  onChange={e => setProfile({...profile, dob: e.target.value})}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Country*</label>
                <select 
                  style={styles.selectInput}
                  value={profile.country}
                  onChange={e => setProfile({...profile, country: e.target.value})}
                  required
                >
                  <option value="">Select Country</option>
                  <option value="India">India</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Germany">Germany</option>
                  <option value="Singapore">Singapore</option>
                  {/* Additional countries can go here */}
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Mobile Number*</label>
                <input 
                  type="tel" 
                  style={styles.input} 
                  placeholder="+91 9999999999"
                  value={profile.mobile}
                  onChange={e => setProfile({...profile, mobile: e.target.value})}
                  required
                />
              </div>

              {/* Anonymity settings included in profile section directly to streamline experience */}
              <div style={{...styles.inputGroup, marginTop: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px'}}>
                 <label style={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={isAnonymous} 
                    onChange={e => setIsAnonymous(e.target.checked)} 
                    style={styles.checkbox}
                  />
                  <strong>Donate Anonymously</strong>
                </label>
                <p style={styles.helperText}>When checked, your real name will be hidden from public donation lists, but we still securely store your profile information for legitimate receipting purposes.</p>
              </div>

              <div style={{textAlign: 'right', marginTop: '16px'}}>
                 <button 
                  style={styles.btnPrimaryLg} 
                  onClick={saveSettings} 
                  disabled={actionLoading}
                >
                  {actionLoading ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ================= DONOR SECTION ================= */}
        {activeTab === 'donor' && (
          <div className="animate-fade-in">
            <h2 style={styles.sectionTitle}>My Donations</h2>
            {data.donations.length === 0 ? (
              <p style={styles.emptyText}>You haven't made any donations yet.</p>
            ) : (
              <div style={styles.listContainer}>
                {data.donations.map((d, i) => (
                  <div key={i} style={styles.listItem}>
                    <div>
                      <h4 style={styles.itemTitle}>{d.campaignTitle}</h4>
                      <p style={styles.itemMeta}>Date: {new Date(d.created_at).toLocaleDateString()} | Payment ID: {d.paymentId}</p>
                      <p style={styles.itemMeta}>Amount: <span style={{fontWeight: 'bold', color: '#10b981'}}>₹{d.amountINR.toLocaleString()}</span></p>
                    </div>
                    <div>
                      <button style={styles.btnSecondary} onClick={() => downloadReceipt(d.paymentId)}>
                        Download Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= CREATOR SECTION ================= */}
        {activeTab === 'creator' && (
          <div className="animate-fade-in">
            <h2 style={styles.sectionTitle}>My Campaigns</h2>
            {data.campaigns.length === 0 ? (
              <p style={styles.emptyText}>You haven't created any campaigns yet.</p>
            ) : (
              <div style={styles.listContainer}>
                {data.campaigns.map((c, i) => {
                  const goalReached = c.raised_inr >= c.goal_inr;
                  const deadlinePassed = new Date() > new Date(c.deadline);
                  const canWithdraw = (goalReached || deadlinePassed) && !c.withdrawn;

                  return (
                    <div key={i} style={styles.listItemConfig}>
                      <div style={styles.campaignHeader}>
                        <h4 style={styles.itemTitle}>{c.title}</h4>
                        <span style={c.status === "approved" ? styles.badgeSuccess : styles.badgeWarning}>{c.status}</span>
                      </div>
                      
                      <div style={styles.analyticsGrid}>
                        <div style={styles.analyticsBox}>
                          <p style={styles.analyticsLabel}>Raised</p>
                          <p style={styles.analyticsValue}>₹{c.raised_inr.toLocaleString()} <span style={styles.analyticsSub}>/ ₹{c.goal_inr.toLocaleString()}</span></p>
                        </div>
                        <div style={styles.analyticsBox}>
                          <p style={styles.analyticsLabel}>Deadline</p>
                          <p style={styles.analyticsValue}>{new Date(c.deadline).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div style={styles.actionRow}>
                        {c.withdrawn ? (
                          <div style={styles.withdrawnBadge}>Withdrawn Successfully via {c.withdrawMethod}</div>
                        ) : (
                          <>
                            {canWithdraw ? (
                              <div style={styles.withdrawControls}>
                                <select 
                                  style={styles.selectInput}
                                  value={withdrawState.campaignId === c.metaId ? withdrawState.method : "wallet"}
                                  onChange={(e) => setWithdrawState({ campaignId: c.metaId, method: e.target.value })}
                                >
                                  <option value="wallet">Crypto Wallet</option>
                                  <option value="bank">Bank Account</option>
                                </select>
                                <button 
                                  style={styles.btnPrimary} 
                                  onClick={() => handleWithdraw(c.metaId)}
                                  disabled={actionLoading}
                                >
                                  {actionLoading && withdrawState.campaignId === c.metaId ? "Processing..." : "Withdraw Funds"}
                                </button>
                              </div>
                            ) : (
                              <p style={styles.lockText}> Withdrawal locked until goal is reached or deadline passes. </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= SETTINGS SECTION ================= */}
        {activeTab === 'settings' && (
          <div className="animate-fade-in" style={styles.settingsGrid}>
            <div style={styles.settingsCard}>
              <h3 style={styles.cardTitle}>Crypto Wallet (Web3)</h3>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Ethereum / Polygon Address</label>
                <input 
                  type="text" 
                  style={styles.input} 
                  placeholder="0x..." 
                  value={walletAddress}
                  onChange={e => setWalletAddress(e.target.value)}
                />
                <p style={styles.helperText}>Used for withdrawing funds natively via Blockchain.</p>
              </div>
            </div>

            <div style={styles.settingsCard}>
              <h3 style={styles.cardTitle}>Bank Account details</h3>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Account Holder Name</label>
                <input 
                  type="text" 
                  style={styles.input} 
                  value={bankAccount.accountName}
                  onChange={e => setBankAccount({...bankAccount, accountName: e.target.value})}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Account Number</label>
                <input 
                  type="text" 
                  style={styles.input} 
                  value={bankAccount.accountNumber}
                  onChange={e => setBankAccount({...bankAccount, accountNumber: e.target.value})}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>IFSC Code</label>
                <input 
                  type="text" 
                  style={styles.input} 
                  value={bankAccount.ifsc}
                  onChange={e => setBankAccount({...bankAccount, ifsc: e.target.value})}
                />
              </div>
            </div>

            <div style={{gridColumn: '1 / -1', textAlign: 'right', marginTop: '16px'}}>
              <button 
                style={styles.btnPrimaryLg} 
                onClick={saveSettings} 
                disabled={actionLoading}
              >
                {actionLoading ? "Saving..." : "Save Payment Settings"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================== STYLES ================== */
const styles = {
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "50vh",
    fontSize: "1rem",
    color: "#1f6f3a"
  },
  container: {
    maxWidth: "850px",
    margin: "30px auto",
    padding: "0 16px",
    fontFamily: "'Inter', system-ui, sans-serif"
  },
  header: {
    marginBottom: "24px",
    textAlign: "center"
  },
  title: {
    fontSize: "1.85rem",
    color: "#111827",
    marginBottom: "6px",
    fontWeight: "800",
    letterSpacing: "-0.02em"
  },
  subtitle: {
    fontSize: "0.9rem",
    color: "#6b7280"
  },
  statsRow: {
    display: "flex",
    gap: "18px",
    marginBottom: "30px"
  },
  statCard: {
    flex: 1,
    background: "linear-gradient(135deg, #1f6f3a 0%, #2fa66a 100%)",
    padding: "18px",
    borderRadius: "12px",
    color: "#fff",
    boxShadow: "0 8px 15px -3px rgba(31, 111, 58, 0.3)"
  },
  statLabel: {
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    opacity: 0.9,
    marginBottom: "6px"
  },
  statValue: {
    fontSize: "1.9rem",
    fontWeight: "700",
    margin: 0
  },
  tabsMenu: {
    display: "flex",
    borderBottom: "2px solid #e5e7eb",
    marginBottom: "24px",
    gap: "24px"
  },
  tab: {
    background: "none",
    border: "none",
    padding: "10px 0",
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#6b7280",
    cursor: "pointer",
    borderBottom: "3px solid transparent",
    transition: "all 0.2s"
  },
  tabActive: {
    background: "none",
    border: "none",
    padding: "10px 0",
    fontSize: "0.9rem",
    fontWeight: "700",
    color: "#1f6f3a",
    cursor: "pointer",
    borderBottom: "3px solid #1f6f3a"
  },
  tabContent: {
    minHeight: "300px"
  },
  sectionTitle: {
    fontSize: "1.4rem",
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: "16px"
  },
  emptyText: {
    color: "#6b7280",
    fontSize: "0.9rem",
    background: "#f9fafb",
    padding: "24px",
    borderRadius: "10px",
    textAlign: "center"
  },
  listContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  listItem: {
    background: "#ffffff",
    border: "1px solid #f3f4f6",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    padding: "16px",
    borderRadius: "10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    transition: "transform 0.2s",
    ":hover": { transform: "translateY(-2px)" }
  },
  listItemConfig: {
    background: "#ffffff",
    border: "1px solid #f3f4f6",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    padding: "18px",
    borderRadius: "10px"
  },
  campaignHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    borderBottom: "1px solid #f3f4f6",
    paddingBottom: "10px"
  },
  itemTitle: {
    margin: 0,
    fontSize: "1rem",
    fontWeight: "600",
    color: "#111827"
  },
  itemMeta: {
    margin: "4px 0 0 0",
    color: "#4b5563",
    fontSize: "0.8rem"
  },
  badgeSuccess: {
    background: "#d1fae5",
    color: "#065f46",
    padding: "3px 8px",
    borderRadius: "16px",
    fontSize: "0.75rem",
    fontWeight: "600",
    textTransform: "uppercase"
  },
  badgeWarning: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "3px 8px",
    borderRadius: "16px",
    fontSize: "0.75rem",
    fontWeight: "600",
    textTransform: "uppercase"
  },
  analyticsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "12px"
  },
  analyticsBox: {
    background: "#f8fafc",
    padding: "12px",
    borderRadius: "8px"
  },
  analyticsLabel: {
    margin: "0 0 4px 0",
    fontSize: "0.7rem",
    color: "#64748b",
    textTransform: "uppercase",
    fontWeight: "600"
  },
  analyticsValue: {
    margin: 0,
    fontSize: "1.15rem",
    fontWeight: "700",
    color: "#0f172a"
  },
  analyticsSub: {
    fontSize: "0.8rem",
    color: "#94a3b8",
    fontWeight: "500"
  },
  actionRow: {
    marginTop: "16px",
    display: "flex",
    justifyContent: "flex-end"
  },
  withdrawnBadge: {
    background: "#ecfdf5",
    color: "#059669",
    padding: "8px 12px",
    borderRadius: "6px",
    fontWeight: "600",
    fontSize: "0.85rem",
    border: "1px solid #a7f3d0"
  },
  withdrawControls: {
    display: "flex",
    gap: "10px"
  },
  lockText: {
    color: "#9ca3af",
    fontSize: "0.8rem",
    fontStyle: "italic",
    background: "#f3f4f6",
    padding: "6px 12px",
    borderRadius: "6px"
  },
  settingsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "18px",
    alignItems: "start"
  },
  settingsCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "18px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
  },
  cardTitle: {
    margin: "0 0 16px 0",
    fontSize: "1rem",
    color: "#1f2937",
    borderBottom: "1px solid #f3f4f6",
    paddingBottom: "8px"
  },
  inputGroup: {
    marginBottom: "12px"
  },
  label: {
    display: "block",
    marginBottom: "4px",
    fontWeight: "500",
    color: "#374151",
    fontSize: "0.8rem"
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "0.85rem",
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.2s"
  },
  selectInput: {
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "0.85rem",
    backgroundColor: "#fff",
    outline: "none",
    width: "100%"
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    lineHeight: "1.4",
    fontSize: "0.9rem"
  },
  checkbox: {
    width: "16px",
    height: "16px",
    accentColor: "#1f6f3a"
  },
  helperText: {
    margin: "4px 0 0 0",
    fontSize: "0.75rem",
    color: "#6b7280"
  },
  btnPrimary: {
    background: "#1f6f3a",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    fontWeight: "600",
    fontSize: "0.9rem",
    cursor: "pointer",
    transition: "background 0.2s"
  },
  btnPrimaryLg: {
    background: "#1f6f3a",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "0.9rem",
    cursor: "pointer",
    boxShadow: "0 4px 6px -1px rgba(31, 111, 58, 0.3)"
  },
  btnSecondary: {
    background: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
    padding: "6px 12px",
    borderRadius: "6px",
    fontWeight: "500",
    fontSize: "0.85rem",
    cursor: "pointer"
  }
};
