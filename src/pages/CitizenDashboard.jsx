import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { CONFIG } from "../lib/config";
import ReportCard from "../components/ReportCard";
import ReportModal from "../components/ReportModal";

export default function CitizenDashboard() {
  const { profile, reloadProfile } = useAuth();

  const [reports, setReports] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

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
      const { error } = await supabase
        .from("reports")
        .update({
          status: "approved",
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
  // WITHDRAW POINTS
  // ===============================

  async function requestWithdraw(e) {
    e.preventDefault();

    setErr("");
    setOk("");

    const pts = parseInt(e.target.points.value, 10);

    if (!pts || pts < CONFIG.MIN_WITHDRAW_POINTS) {
      setErr(
        `Minimum withdrawal is ${CONFIG.MIN_WITHDRAW_POINTS} points.`
      );
      return;
    }

    if (pts > profile.points) {
      setErr("You don't have that many points yet.");
      return;
    }

    const amount = +(
      pts * CONFIG.POINTS_TO_INR_RATE
    ).toFixed(2);

    const { error: wErr } = await supabase
      .from("withdrawals")
      .insert({
        citizen_id: profile.id,
        points: pts,
        amount_inr: amount,
      });

    if (wErr) {
      setErr(wErr.message);
      return;
    }

    const { error: pErr } = await supabase
      .from("profiles")
      .update({
        points: profile.points - pts,
      })
      .eq("id", profile.id);

    if (pErr) {
      setErr(pErr.message);
      return;
    }

    await reloadProfile();

    setOk(
      `Withdrawal request for ₹${amount} submitted.`
    );

    await load();
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

  // ===============================
  // UI
  // ===============================

  return (
    <div className="citizen-dashboard">

      {/* ================= HERO ================= */}

      <div className="citizen-hero">

        <div className="hero-content">

          <div className="hero-badge">
            ♻️ Smart Citizen
          </div>

          <h1>
            Welcome back, {firstName}! 👋
          </h1>

          <p>
            Help keep your city clean. Report waste,
            track progress and earn rewards.
          </p>

          <button
            className="hero-report-btn"
            onClick={() => setShowModal(true)}
          >
            <span>＋</span>
            Report a Problem
          </button>

        </div>

        <div className="hero-illustration">

          <div className="eco-circle circle-1">
            ♻️
          </div>

          <div className="eco-circle circle-2">
            🌱
          </div>

          <div className="eco-circle circle-3">
            🏙️
          </div>

        </div>

      </div>


      {/* ================= POINTS + STATS ================= */}

      <div className="dashboard-top-grid">

        {/* WALLET */}

        <div className="modern-wallet">

          <div className="wallet-top">

            <div>

              <div className="wallet-label">
                💰 SmartSwachh Rewards
              </div>

              <div className="wallet-points">
                {profile.points || 0}
                <span> pts</span>
              </div>

            </div>

            <div className="wallet-icon">
              🪙
            </div>

          </div>

          <div className="wallet-bottom">

            <div>

              <div className="wallet-value">
                ≈ ₹
                {(
                  (profile.points || 0) *
                  CONFIG.POINTS_TO_INR_RATE
                ).toFixed(2)}
              </div>

              <div className="wallet-info">
                Minimum withdrawal:
                {" "}
                {CONFIG.MIN_WITHDRAW_POINTS} points
              </div>

            </div>

            <button
              className="wallet-btn"
              onClick={() =>
                setShowWithdraw((s) => !s)
              }
            >
              Withdraw →
            </button>

          </div>

        </div>


        {/* QUICK STATS */}

        <div className="modern-stats">

          <div className="modern-stat-card">

            <div className="stat-icon total">
              📋
            </div>

            <div>

              <div className="modern-stat-number">
                {reports.length}
              </div>

              <div className="modern-stat-label">
                Total Reports
              </div>

            </div>

          </div>


          <div className="modern-stat-card">

            <div className="stat-icon progress">
              ⏳
            </div>

            <div>

              <div className="modern-stat-number">
                {activeCount}
              </div>

              <div className="modern-stat-label">
                Active Reports
              </div>

            </div>

          </div>


          <div className="modern-stat-card">

            <div className="stat-icon resolved">
              ✓
            </div>

            <div>

              <div className="modern-stat-number">
                {doneCount}
              </div>

              <div className="modern-stat-label">
                Resolved
              </div>

            </div>

          </div>

        </div>

      </div>


      {/* ================= MESSAGES ================= */}

      {err && (

        <div className="modern-message error-message">
          <span>⚠️</span>
          {err}
        </div>

      )}

      {ok && (

        <div className="modern-message success-message">
          <span>✓</span>
          {ok}
        </div>

      )}


      {/* ================= WITHDRAW ================= */}

      {showWithdraw && (

        <div className="withdraw-panel">

          <div className="withdraw-header">

            <div>

              <div className="panel-icon">
                💸
              </div>

              <div>

                <h3>
                  Redeem Your Points
                </h3>

                <p>
                  Convert your SmartSwachh points
                  into rewards.
                </p>

              </div>

            </div>

            <button
              className="close-panel"
              onClick={() =>
                setShowWithdraw(false)
              }
            >
              ×
            </button>

          </div>


          <form onSubmit={requestWithdraw}>

            <div className="withdraw-form-row">

              <div className="field withdraw-field">

                <label>
                  Points to Redeem
                </label>

                <input
                  name="points"
                  type="number"
                  min={CONFIG.MIN_WITHDRAW_POINTS}
                  step="1"
                  placeholder={`Minimum ${CONFIG.MIN_WITHDRAW_POINTS} points`}
                  required
                />

              </div>


              <button className="withdraw-submit-btn">

                💰 Submit Request

              </button>

            </div>

          </form>


          {/* WITHDRAWAL HISTORY */}

          {withdrawals.length > 0 && (

            <div className="withdraw-history">

              <h4>
                Recent Withdrawal Requests
              </h4>

              <div className="withdraw-list">

                {withdrawals.map((w) => (

                  <div
                    key={w.id}
                    className="withdraw-item"
                  >

                    <div className="withdraw-left">

                      <div className="withdraw-mini-icon">
                        ₹
                      </div>

                      <div>

                        <strong>
                          {w.points} points
                        </strong>

                        <span>
                          Reward value ₹{w.amount_inr}
                        </span>

                      </div>

                    </div>


                    <span
                      className={`pill ${
                        w.status === "approved" ||
                        w.status === "paid"
                          ? "completed"
                          : w.status === "rejected"
                          ? "rejected"
                          : "pending"
                      }`}
                    >
                      {w.status}
                    </span>

                  </div>

                ))}

              </div>

            </div>

          )}

        </div>

      )}


      {/* ================= REPORTS HEADER ================= */}

      <div className="reports-section-header">

        <div>

          <div className="section-small-title">
            ACTIVITY
          </div>

          <h2>
            Your Reports
          </h2>

          <p>
            Track the progress of all waste reports
            submitted by you.
          </p>

        </div>


        <button
          className="secondary-report-btn"
          onClick={() =>
            setShowModal(true)
          }
        >
          ＋ New Report
        </button>

      </div>


      {/* ================= REPORTS ================= */}

      {reports.length === 0 ? (

        <div className="modern-empty-state">

          <div className="empty-icon">
            ♻️
          </div>

          <h3>
            No reports yet
          </h3>

          <p>
            Spotted waste or a cleanliness issue?
            Help your community by reporting it.
          </p>

          <button
            className="btn"
            onClick={() =>
              setShowModal(true)
            }
          >
            Report Your First Problem
          </button>

        </div>

      ) : (

        <div className="reports-list">

          {reports.map((r) => (

            <div
              key={r.id}
              className="report-wrapper"
            >

              <ReportCard
                report={r}
                showVerificationCode={true}
              />


              {/* CITIZEN APPROVAL */}

              {r.status ===
                "pending_approval" && (

                <div className="approval-card">

                  <div className="approval-top">

                    <div className="approval-icon">
                      📸
                    </div>

                    <div>

                      <h3>
                        Review Completed Work
                      </h3>

                      <p>
                        Please check the completion
                        photo and confirm whether
                        the cleaning work has been
                        completed properly.
                      </p>

                    </div>

                  </div>


                  <div className="approval-actions">

                    <button
                      className="approve-btn"
                      onClick={() =>
                        approveWork(r.id)
                      }
                      disabled={
                        actionLoading === r.id
                      }
                    >

                      {actionLoading === r.id
                        ? "Processing..."
                        : "✓ Approve Work"}

                    </button>


                    <button
                      className="reject-btn"
                      onClick={() =>
                        rejectWork(r.id)
                      }
                      disabled={
                        actionLoading === r.id
                      }
                    >

                      ✕ Reject Work

                    </button>

                  </div>

                </div>

              )}

            </div>

          ))}

        </div>

      )}


      {/* ================= REPORT MODAL ================= */}

      {showModal && (

        <ReportModal
          profile={profile}

          onClose={() =>
            setShowModal(false)
          }

          onSubmitted={async () => {

            setShowModal(false);

            setOk(
              "Report submitted successfully. An admin will assign it to a worker."
            );

            await load();

          }}
        />

      )}

    </div>
  );
}