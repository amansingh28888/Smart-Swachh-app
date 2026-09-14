import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { CONFIG } from "../lib/config";
import ReportCard from "../components/ReportCard";
import ReportModal from "../components/ReportModal";
import ProfileSettings from "../components/ProfileSettings";

// SVG Icons
const IconRecycle = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>);
const IconLeaf = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>);
const IconCity = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>);
const IconWallet = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>);
const IconClipboard = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>);
const IconClock = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>);
const IconCheck = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>);
const IconAlertCircle = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>);
const IconArrowUpRight = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>);
const IconCamera = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>);
const IconPlus = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>);
const IconX = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>);

export default function CitizenDashboard({ activeNav = 0, setActiveNav }) {
  const { profile, reloadProfile } = useAuth();

  const [reports, setReports] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [topCitizens, setTopCitizens] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [reportFilter, setReportFilter] = useState("all");
  const [selectedMapReport, setSelectedMapReport] = useState(null);

  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  async function load() {
    const { data: r, error: reportError } = await supabase
      .from("reports")
      .select("*")
      .eq("citizen_id", profile.id)
      .order("created_at", { ascending: false });

    if (reportError) {
      setErr(reportError.message);
    }

    setReports(r || []);

    const { data: w, error: withdrawalError } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("citizen_id", profile.id)
      .order("created_at", { ascending: false });

    if (withdrawalError) {
      setErr(withdrawalError.message);
    }

    setWithdrawals(w || []);

    const { data: top } = await supabase
      .from("profiles")
      .select("id, name, points")
      .eq("role", "citizen")
      .order("points", { ascending: false })
      .limit(5);
    setTopCitizens(top || []);
  }

  useEffect(() => {
    if (profile?.id) {
      load();
    }
  }, [profile?.id]);

  // ===============================
  // APPROVE WORK
  // ===============================

  async function approveWork(reportId) {
    const confirmed = window.confirm(
      "Are you satisfied with the cleaning work shown in the photo?"
    );

    if (!confirmed) return;

    setActionLoading(reportId);
    setErr("");
    setOk("");

    try {
      // Generate a 6-digit SmartVerify code
      const verificationCode = String(Math.floor(100000 + Math.random() * 900000));

      const { error } = await supabase
        .from("reports")
        .update({
          status: "approved",
          verification_code: verificationCode,
        })
        .eq("id", reportId)
        .eq("citizen_id", profile.id);

      if (error) throw error;

      setOk(
        "Work approved successfully. Please share your SmartVerify code with the worker to complete verification."
      );

      await load();

    } catch (error) {
      setErr(error.message);
    }

    setActionLoading(null);
  }

  // ===============================
  // REJECT WORK
  // ===============================

  async function rejectWork(reportId) {
    const confirmed = window.confirm(
      "Are you sure the work has not been completed properly?"
    );

    if (!confirmed) return;

    setActionLoading(reportId);
    setErr("");
    setOk("");

    try {
      const { error } = await supabase
        .from("reports")
        .update({
          status: "reopened",
        })
        .eq("id", reportId)
        .eq("citizen_id", profile.id);

      if (error) throw error;

      setOk(
        "The report has been reopened. The worker will need to complete the task again."
      );

      await load();

    } catch (error) {
      setErr(error.message);
    }

    setActionLoading(null);
  }

  // ===============================
  // COUPON CATALOG & REDEMPTION
  // ===============================

  const COUPONS = [
    {
      id: "amazon",
      title: "₹100 Amazon Gift Voucher",
      brand: "Amazon Pay",
      pointsRequired: 100,
      valueInr: 100,
      icon: "🛍️",
      bgGradient: "linear-gradient(135deg, #FF9900 0%, #FF6600 100%)",
      codePrefix: "SWACHH-AMZ-",
      desc: "Valid on all purchases & utility bill payments on Amazon.",
    },
    {
      id: "flipkart",
      title: "₹150 Flipkart E-Voucher",
      brand: "Flipkart",
      pointsRequired: 150,
      valueInr: 150,
      icon: "🛒",
      bgGradient: "linear-gradient(135deg, #2874F0 0%, #0052CC 100%)",
      codePrefix: "SWACHH-FK-",
      desc: "Valid across Flipkart electronics, fashion & appliances.",
    },
    {
      id: "swiggy",
      title: "₹75 Food & Dining Pass",
      brand: "Swiggy / Zomato",
      pointsRequired: 75,
      valueInr: 75,
      icon: "🍕",
      bgGradient: "linear-gradient(135deg, #FC8019 0%, #E23744 100%)",
      codePrefix: "SWACHH-FOOD-",
      desc: "Discount coupon valid on food delivery & dining orders.",
    },
    {
      id: "utility",
      title: "₹200 Electricity & Utility Rebate",
      brand: "Municipal Utility",
      pointsRequired: 200,
      valueInr: 200,
      icon: "⚡",
      bgGradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
      codePrefix: "SWACHH-BILL-",
      desc: "Redeem against municipal water, electricity, or waste fees.",
    },
    {
      id: "metro",
      title: "₹50 City Transit Bus Pass",
      brand: "City Transport",
      pointsRequired: 50,
      valueInr: 50,
      icon: "🚌",
      bgGradient: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
      codePrefix: "SWACHH-BUS-",
      desc: "Valid for eco-friendly public transit & metro bus passes.",
    },
  ];

  async function redeemCoupon(coupon) {
    setErr("");
    setOk("");

    if ((profile?.points || 0) < coupon.pointsRequired) {
      setErr(`You need at least ${coupon.pointsRequired} points to redeem this ${coupon.title}.`);
      return;
    }

    const uniqueCode = `${coupon.codePrefix}${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const { error: wErr } = await supabase.from("withdrawals").insert({
        citizen_id: profile.id,
        points: coupon.pointsRequired,
        amount_inr: coupon.valueInr,
        status: `COUPON:${uniqueCode}`,
      });

      if (wErr) throw wErr;

      const { error: pErr } = await supabase
        .from("profiles")
        .update({ points: (profile.points || 0) - coupon.pointsRequired })
        .eq("id", profile.id);

      if (pErr) throw pErr;

      if (reloadProfile) await reloadProfile();
      setOk(`🎉 Success! Redeemed ${coupon.title}. Your Code: ${uniqueCode}`);
      await load();
    } catch (error) {
      setErr(error.message || "Failed to redeem coupon.");
    }
  }

  // ===============================
  // STATISTICS
  // ===============================

  const activeCount = reports.filter(
    (r) =>
      r.status !== "completed" &&
      r.status !== "approved"
  ).length;

  const doneCount = reports.filter(
    (r) =>
      r.status === "completed" ||
      r.status === "approved"
  ).length;

  const firstName =
    profile?.full_name?.split(" ")[0] ||
    profile?.name?.split(" ")[0] ||
    "Citizen";

  const filteredReports = reports.filter((r) => {
    if (reportFilter === "pending") return r.status === "pending" || r.status === "assigned";
    if (reportFilter === "in_progress") return r.status === "in_progress" || r.status === "pending_approval" || r.status === "reopened";
    if (reportFilter === "completed") return r.status === "completed" || r.status === "approved";
    return true;
  });

  const reportsWithLoc = reports.filter(r => r.location_lat && r.location_lng);
  const activeMapReport = selectedMapReport || reportsWithLoc[0];

  return (
    <div className="citizen-dashboard">

      {/* Global Alerts */}
      {err && (
        <div className="modern-message error-message">
          <IconAlertCircle />
          {err}
        </div>
      )}
      {ok && (
        <div className="modern-message success-message">
          <IconCheck />
          {ok}
        </div>
      )}

      {/* ================= 0: DASHBOARD ================= */}
      {activeNav === 0 && (
        <>
          {/* HERO */}
          <div className="citizen-hero">
            <div className="hero-content">
              <div className="hero-badge">
                <IconRecycle /> Smart Citizen
              </div>
              <h1>Welcome back, {firstName}.</h1>
              <p>Help keep your city clean. Report waste, track progress and earn rewards.</p>
              <button className="hero-report-btn" onClick={() => setShowModal(true)} id="hero-report-btn">
                <IconPlus /> Report a Problem
              </button>
            </div>
            <div className="hero-illustration">
              <div className="eco-circle circle-1"><IconRecycle /></div>
              <div className="eco-circle circle-2"><IconLeaf /></div>
              <div className="eco-circle circle-3"><IconCity /></div>
            </div>
          </div>

          {/* POINTS + STATS */}
          <div className="dashboard-top-grid">
            <div className="modern-wallet">
              <div className="wallet-top">
                <div>
                  <div className="wallet-label">EcoNova Rewards</div>
                  <div className="wallet-points">{profile.points || 0}<span> pts</span></div>
                </div>
                <div className="wallet-icon"><IconWallet /></div>
              </div>
              <div className="wallet-bottom">
                <div>
                  <div className="wallet-value">≈ ₹{((profile.points || 0) * CONFIG.POINTS_TO_INR_RATE).toFixed(2)} Voucher Value</div>
                  <div className="wallet-info">Redeem points for Amazon, Flipkart, Swiggy & Bill Coupons</div>
                </div>
                <button className="wallet-btn" onClick={() => setShowWithdraw((s) => !s)}>Redeem Coupons →</button>
              </div>
            </div>

            <div className="modern-stats">
              <div className="modern-stat-card" onClick={() => setActiveNav(1)} style={{ cursor: "pointer" }}>
                <div className="stat-icon total"><IconClipboard /></div>
                <div>
                  <div className="modern-stat-number">{reports.length}</div>
                  <div className="modern-stat-label">Total Reports</div>
                </div>
              </div>
              <div className="modern-stat-card" onClick={() => setActiveNav(1)} style={{ cursor: "pointer" }}>
                <div className="stat-icon progress"><IconClock /></div>
                <div>
                  <div className="modern-stat-number">{activeCount}</div>
                  <div className="modern-stat-label">Active Reports</div>
                </div>
              </div>
              <div className="modern-stat-card" onClick={() => setActiveNav(1)} style={{ cursor: "pointer" }}>
                <div className="stat-icon resolved"><IconCheck /></div>
                <div>
                  <div className="modern-stat-number">{doneCount}</div>
                  <div className="modern-stat-label">Resolved</div>
                </div>
              </div>
            </div>
          </div>

          {/* TOP ECO-WARRIORS LEADERBOARD */}
          {topCitizens.length > 0 && (
            <div className="reports-section-header" style={{ marginTop: "32px", marginBottom: "16px" }}>
              <div>
                <div className="section-small-title">GAMIFICATION</div>
                <h2>🏆 Top Eco-Warriors Leaderboard</h2>
              </div>
            </div>
          )}
          {topCitizens.length > 0 && (
            <div className="leaderboard-grid" style={{ display: "grid", gap: "12px", marginBottom: "32px" }}>
              {topCitizens.map((tc, index) => {
                let badge = "";
                if (index === 0) badge = "🥇 Gold";
                else if (index === 1) badge = "🥈 Silver";
                else if (index === 2) badge = "🥉 Bronze";

                return (
                  <div key={tc.id} className="report-wrapper" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: tc.id === profile.id ? "var(--bg-card-highlight, #f2f9f5)" : "var(--bg-card)", border: tc.id === profile.id ? "2px solid var(--primary)" : "1px solid var(--border)", borderRadius: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--ink-muted)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                        #{index + 1}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "16px" }}>{tc.name} {tc.id === profile.id && "(You)"}</div>
                        <div style={{ fontSize: "12px", color: "var(--ink-soft)" }}>{badge}</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: "18px", color: "var(--primary)" }}>
                      {tc.points} pts
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* REWARDS & COUPONS PANEL */}
          {showWithdraw && (
            <div className="withdraw-panel" style={{ maxWidth: 900 }}>
              <div className="withdraw-header">
                <div>
                  <div className="panel-icon"><IconArrowUpRight /></div>
                  <div>
                    <h3>Redeem Points for Discount & Gift Coupons</h3>
                    <p>Select your favorite reward coupon voucher to instantly generate a digital coupon code.</p>
                  </div>
                </div>
                <button className="close-panel" onClick={() => setShowWithdraw(false)}>×</button>
              </div>

              {/* COUPONS CATALOG GRID */}
              <div className="coupon-grid">
                {COUPONS.map((c) => {
                  const canAfford = (profile?.points || 0) >= c.pointsRequired;
                  return (
                    <div key={c.id} className="coupon-card">
                      <div className="coupon-card-header" style={{ background: c.bgGradient }}>
                        <div className="coupon-brand-icon">{c.icon}</div>
                        <div className="coupon-pts-badge">{c.pointsRequired} Points</div>
                      </div>
                      <div className="coupon-card-body">
                        <div>
                          <div className="coupon-title">{c.title}</div>
                          <div className="coupon-desc">{c.desc}</div>
                        </div>
                        <button
                          className="btn-redeem-coupon"
                          disabled={!canAfford}
                          onClick={() => redeemCoupon(c)}
                        >
                          {canAfford ? `Redeem Coupon (${c.pointsRequired} pts)` : `Need ${c.pointsRequired - (profile?.points || 0)} more pts`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* MY REDEEMED COUPONS WALLET */}
              {withdrawals.filter(w => w.status?.startsWith("COUPON:")).length > 0 && (
                <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
                  <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                    🎟️ My Issued Coupon Codes Wallet ({withdrawals.filter(w => w.status?.startsWith("COUPON:")).length})
                  </h4>
                  <p style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 12 }}>
                    Copy your active coupon codes below to redeem on checkout.
                  </p>

                  <div className="coupon-wallet-list">
                    {withdrawals.filter(w => w.status?.startsWith("COUPON:")).map((w) => {
                      const code = w.status.replace("COUPON:", "");
                      return (
                        <div key={w.id} className="coupon-wallet-item">
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>
                              ₹{w.amount_inr} Reward Voucher ({w.points} pts)
                            </div>
                            <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 2 }}>
                              Issued on {fmtDate(w.created_at)} · Status: <span className="pill completed" style={{ fontSize: 10 }}>Valid Code</span>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div className="coupon-code-pill">
                              <span>🏷️</span> {code}
                            </div>
                            <button
                              className="btn-copy-code"
                              onClick={() => {
                                navigator.clipboard.writeText(code);
                                setOk(`Copied coupon code ${code} to clipboard!`);
                              }}
                            >
                              📋 Copy Code
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* RECENT REPORTS HEADER */}
          <div className="reports-section-header">
            <div>
              <div className="section-small-title">RECENT ACTIVITY</div>
              <h2>Your Reports</h2>
            </div>
            <button className="secondary-report-btn" onClick={() => setShowModal(true)}>
              <IconPlus /> New Report
            </button>
          </div>

          {/* RECENT REPORTS LIST */}
          {reports.length === 0 ? (
            <div className="modern-empty-state">
              <div className="empty-icon"><IconRecycle /></div>
              <h3>No reports yet</h3>
              <p>Spotted waste or a cleanliness issue? Help your community by reporting it.</p>
              <button className="btn" onClick={() => setShowModal(true)}>Report Your First Problem</button>
            </div>
          ) : (
            <div className="reports-list">
              {reports.slice(0, 3).map((r) => (
                <div key={r.id} className="report-wrapper">
                  <ReportCard report={r} showVerificationCode={true} />
                </div>
              ))}
              {reports.length > 3 && (
                <div style={{ textAlign: "center", marginTop: 14 }}>
                  <button className="btn-outline" onClick={() => setActiveNav(1)}>
                    View All {reports.length} Reports →
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ================= 1: MY REPORTS ================= */}
      {activeNav === 1 && (
        <>
          <div className="view-header">
            <div>
              <h2 className="view-title">My Reports</h2>
              <p className="view-desc">Track and manage all waste reports submitted by you</p>
            </div>
            <button className="btn" onClick={() => setShowModal(true)}>
              <IconPlus /> Report Problem
            </button>
          </div>

          <div className="filter-pills" style={{ marginBottom: 18 }}>
            <button className={`filter-btn ${reportFilter === "all" ? "active" : ""}`} onClick={() => setReportFilter("all")}>All ({reports.length})</button>
            <button className={`filter-btn ${reportFilter === "pending" ? "active" : ""}`} onClick={() => setReportFilter("pending")}>Pending Assignment</button>
            <button className={`filter-btn ${reportFilter === "in_progress" ? "active" : ""}`} onClick={() => setReportFilter("in_progress")}>In Progress ({activeCount})</button>
            <button className={`filter-btn ${reportFilter === "completed" ? "active" : ""}`} onClick={() => setReportFilter("completed")}>Resolved ({doneCount})</button>
          </div>

          {filteredReports.length === 0 ? (
            <div className="modern-empty-state">
              <h3>No matching reports found</h3>
              <p>Try selecting a different filter above.</p>
            </div>
          ) : (
            <div className="reports-list">
              {filteredReports.map((r) => (
                <div key={r.id} className="report-wrapper">
                  <ReportCard report={r} showVerificationCode={true} />
                  {r.status === "pending_approval" && (
                    <div style={{ marginTop: 16, background: "var(--bg-card-highlight, #f8fafc)", padding: 16, borderRadius: 12, border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <IconCamera />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>Review Completed Work</h3>
                          <p style={{ margin: 0, fontSize: 13, color: "var(--ink-soft)" }}>Check the completion photo and confirm if the site is clean.</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 12 }}>
                        <button 
                          className="btn" 
                          style={{ flex: 1, padding: "10px 0" }} 
                          onClick={() => approveWork(r.id)} 
                          disabled={actionLoading === r.id}
                        >
                          {actionLoading === r.id ? "Processing..." : "✓ Approve & Release Points"}
                        </button>
                        <button 
                          className="btn-outline" 
                          style={{ flex: 1, padding: "10px 0", color: "var(--red)", borderColor: "var(--red)" }} 
                          onClick={() => rejectWork(r.id)} 
                          disabled={actionLoading === r.id}
                        >
                          ✗ Reject Work
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ================= 2: LIVE MAP ================= */}
      {activeNav === 2 && (
        <>
          <div className="view-header">
            <div>
              <h2 className="view-title">Live Cleanliness Map</h2>
              <p className="view-desc">Geographic view of your reported waste issues</p>
            </div>
          </div>

          {reportsWithLoc.length === 0 ? (
            <div className="modern-empty-state">
              <div className="empty-icon"><IconCity /></div>
              <h3>No location data available yet</h3>
              <p>When you submit reports with GPS coordinates, they will appear on this interactive map.</p>
              <button className="btn" onClick={() => setShowModal(true)}>Submit Report with Location</button>
            </div>
          ) : (
            <div className="map-view-container">
              <div className="map-sidebar-list">
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-muted)", marginBottom: 4 }}>LOCATIONS ({reportsWithLoc.length})</div>
                {reportsWithLoc.map((r) => (
                  <div
                    key={r.id}
                    className={`map-item-card ${activeMapReport?.id === r.id ? "active" : ""}`}
                    onClick={() => setSelectedMapReport(r)}
                  >
                    <div className="map-item-title">{r.title || r.category}</div>
                    <div className="map-item-sub">{r.address || `Lat: ${r.location_lat?.toFixed(4)}, Lng: ${r.location_lng?.toFixed(4)}`}</div>
                    <div style={{ marginTop: 6 }}>
                      <span className={`pill ${r.status === "completed" || r.status === "approved" ? "completed" : "pending"}`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="map-canvas-card">
                {activeMapReport ? (
                  <iframe
                    title="Map Location"
                    className="map-canvas-iframe"
                    src={`https://maps.google.com/maps?q=${activeMapReport.location_lat},${activeMapReport.location_lng}&z=15&output=embed`}
                  />
                ) : (
                  <div style={{ padding: 40, textAlign: "center" }}>Select a location from the list</div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ================= 3: ANALYTICS ================= */}
      {activeNav === 3 && (
        <>
          <div className="view-header">
            <div>
              <h2 className="view-title">Personal Impact & Analytics</h2>
              <p className="view-desc">Your contribution to a cleaner city and reward statistics</p>
            </div>
          </div>

          <div className="analytics-grid">
            <div className="chart-card">
              <div className="chart-card-title">Cleanliness Score</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "var(--primary)" }}>{doneCount > 0 ? `${Math.round((doneCount / reports.length) * 100)}%` : "100%"}</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>Resolution efficiency rate</div>
            </div>

            <div className="chart-card">
              <div className="chart-card-title">Points Earned</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "var(--primary)" }}>{profile.points || 0} pts</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>Total EcoNova reward balance</div>
            </div>

            <div className="chart-card">
              <div className="chart-card-title">Total Resolved</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "var(--primary)" }}>{doneCount}</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>Cleaned waste sites</div>
            </div>
          </div>

          <div className="analytics-grid">
            <div className="chart-card">
              <div className="chart-card-title">Reports by Status</div>
              <div className="css-bar-chart">
                <div className="bar-row">
                  <div className="bar-meta"><span>Pending</span><span>{reports.filter(r => r.status === "pending").length}</span></div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${reports.length ? (reports.filter(r => r.status === "pending").length / reports.length) * 100 : 0}%` }}></div></div>
                </div>
                <div className="bar-row">
                  <div className="bar-meta"><span>In Progress</span><span>{activeCount}</span></div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${reports.length ? (activeCount / reports.length) * 100 : 0}%`, background: "var(--amber)" }}></div></div>
                </div>
                <div className="bar-row">
                  <div className="bar-meta"><span>Resolved</span><span>{doneCount}</span></div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${reports.length ? (doneCount / reports.length) * 100 : 0}%`, background: "var(--primary)" }}></div></div>
                </div>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-card-title">Reward Tier Level</div>
              <div style={{ padding: "10px 0" }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Level 2 Eco Citizen</div>
                <p style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 12 }}>Report 5 more issues to unlock Level 3 Green Champion badge & 2x bonus points!</p>
                <div className="bar-track" style={{ height: 10 }}>
                  <div className="bar-fill" style={{ width: `${Math.min(100, ((profile.points || 0) / 200) * 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ================= 4: PROFILE SETTINGS ================= */}
      {activeNav === 4 && (
        <ProfileSettings />
      )}

      {/* ================= REPORT MODAL ================= */}
      {showModal && (
        <ReportModal
          profile={profile}
          onClose={() => setShowModal(false)}
          onSubmitted={async () => {
            setShowModal(false);
            setOk("Report submitted successfully. An admin will assign it to a worker.");
            await load();
          }}
        />
      )}

    </div>
  );
}