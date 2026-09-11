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

  // Approval loading state
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
    (r) => r.status !== "completed"
  ).length;

  const doneCount = reports.filter(
    (r) => r.status === "completed"
  ).length;

  // ===============================
  // UI
  // ===============================

  return (
    <>
      {/* POINTS BANNER */}

      <div className="points-banner">
        <div>
          <div className="amt">
            {profile.points} pts
          </div>

          <div className="sub">
            ≈ ₹
            {(
              profile.points *
              CONFIG.POINTS_TO_INR_RATE
            ).toFixed(2)}

            {" · "}

            withdraw {CONFIG.MIN_WITHDRAW_POINTS}+ points anytime
          </div>
        </div>

        <button
          className="btn-outline"
          style={{
            borderColor: "#fff",
            color: "#fff",
          }}
          onClick={() => setShowWithdraw((s) => !s)}
        >
          Withdraw
        </button>
      </div>

      {/* REPORT HEADER */}

      <div className="section-head">
        <h2>Your Reports</h2>

        <button
          className="btn"
          onClick={() => setShowModal(true)}
        >
          + Report a Problem
        </button>
      </div>

      {/* STATISTICS */}

      <div className="stat-row">

        <div className="stat">
          <div className="num">
            {reports.length}
          </div>

          <div className="label">
            Total Reports
          </div>
        </div>

        <div className="stat">
          <div className="num">
            {activeCount}
          </div>

          <div className="label">
            In Progress
          </div>
        </div>

        <div className="stat">
          <div className="num">
            {doneCount}
          </div>

          <div className="label">
            Resolved
          </div>
        </div>

      </div>

      {/* ERROR */}

      {err && (
        <div className="msg error">
          {err}
        </div>
      )}

      {/* SUCCESS */}

      {ok && (
        <div className="msg ok">
          {ok}
        </div>
      )}

      {/* WITHDRAW */}

      {showWithdraw && (
        <div
          className="auth-card"
          style={{ marginBottom: 20 }}
        >

          <h3
            style={{
              marginTop: 0,
              fontSize: 15,
            }}
          >
            Request a Withdrawal
          </h3>

          <form onSubmit={requestWithdraw}>

            <div className="field">

              <label>
                Points to redeem (min{" "}
                {CONFIG.MIN_WITHDRAW_POINTS})
              </label>

              <input
                name="points"
                type="number"
                min={CONFIG.MIN_WITHDRAW_POINTS}
                step="1"
                required
              />

            </div>

            <button className="btn btn-sm">
              Submit Request
            </button>

          </form>

          {withdrawals.length > 0 && (
            <div style={{ marginTop: 14 }}>

              {withdrawals.map((w) => (

                <div
                  key={w.id}
                  style={{
                    fontSize: 13,
                    padding: "6px 0",
                    borderTop:
                      "1px solid var(--line)",
                    display: "flex",
                    justifyContent:
                      "space-between",
                  }}
                >

                  <span>
                    {w.points} pts → ₹{w.amount_inr}
                  </span>

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
          )}

        </div>
      )}

      {/* REPORTS */}

      {reports.length === 0 ? (

        <div className="empty">
          No reports yet. Spotted some waste on your street?
          Tap "Report a problem".
        </div>

      ) : (

        reports.map((r) => (

          <div
            key={r.id}
            style={{
              marginBottom: 16,
            }}
          >

            <ReportCard
              report={r}
              showVerificationCode={true}
            />

            {/* CITIZEN APPROVAL */}

            {r.status === "pending_approval" && (

              <div
                style={{
                  padding: 14,
                  marginTop: -8,
                  borderRadius: "0 0 12px 12px",
                  border: "1px solid var(--line)",
                  borderTop: "none",
                  background: "#f8fbff",
                }}
              >

                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  📸 Review Completed Work
                </div>

                <p
                  style={{
                    fontSize: 13,
                    color: "var(--ink-soft)",
                    marginTop: 0,
                  }}
                >
                  Please check the completion photo. Are you
                  satisfied with the cleaning work?
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                  }}
                >

                  <button
                    className="btn"
                    style={{
                      flex: 1,
                    }}
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
                    className="btn-outline"
                    style={{
                      flex: 1,
                    }}
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

        ))

      )}

      {/* REPORT MODAL */}

      {showModal && (

        <ReportModal
          profile={profile}
          onClose={() => setShowModal(false)}

          onSubmitted={async () => {

            setShowModal(false);

            setOk(
              "Report submitted successfully. An admin will assign it to a worker."
            );

            await load();

          }}
        />

      )}

    </>
  );
}