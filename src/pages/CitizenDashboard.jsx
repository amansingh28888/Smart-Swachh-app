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

  async function load() {
    const { data: r } = await supabase.from("reports").select("*").eq("citizen_id", profile.id).order("created_at", { ascending: false });
    setReports(r || []);
    const { data: w } = await supabase.from("withdrawals").select("*").eq("citizen_id", profile.id).order("created_at", { ascending: false });
    setWithdrawals(w || []);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function requestWithdraw(e) {
    e.preventDefault();
    setErr(""); setOk("");
    const pts = parseInt(e.target.points.value, 10);
    if (!pts || pts < CONFIG.MIN_WITHDRAW_POINTS) {
      setErr(`Minimum withdrawal is ${CONFIG.MIN_WITHDRAW_POINTS} points.`);
      return;
    }
    if (pts > profile.points) {
      setErr("You don't have that many points yet.");
      return;
    }
    const amount = +(pts * CONFIG.POINTS_TO_INR_RATE).toFixed(2);
    const { error: wErr } = await supabase.from("withdrawals").insert({ citizen_id: profile.id, points: pts, amount_inr: amount });
    if (wErr) { setErr(wErr.message); return; }
    const { error: pErr } = await supabase.from("profiles").update({ points: profile.points - pts }).eq("id", profile.id);
    if (!pErr) await reloadProfile();
    setOk(`Withdrawal request for ₹${amount} submitted.`);
    await load();
  }

  const activeCount = reports.filter((r) => r.status !== "completed").length;
  const doneCount = reports.filter((r) => r.status === "completed").length;

  return (
    <>
      <div className="points-banner">
        <div>
          <div className="amt">{profile.points} pts</div>
          <div className="sub">
            ≈ ₹{(profile.points * CONFIG.POINTS_TO_INR_RATE).toFixed(2)} · withdraw {CONFIG.MIN_WITHDRAW_POINTS}+ points anytime
          </div>
        </div>
        <button className="btn-outline" style={{ borderColor: "#fff", color: "#fff" }} onClick={() => setShowWithdraw((s) => !s)}>
          Withdraw
        </button>
      </div>

      <div className="section-head">
        <h2>Your reports</h2>
        <button className="btn" onClick={() => setShowModal(true)}>+ Report a problem</button>
      </div>

      <div className="stat-row">
        <div className="stat"><div className="num">{reports.length}</div><div className="label">Total reports</div></div>
        <div className="stat"><div className="num">{activeCount}</div><div className="label">In progress</div></div>
        <div className="stat"><div className="num">{doneCount}</div><div className="label">Resolved</div></div>
      </div>

      {err && <div className="msg error">{err}</div>}
      {ok && <div className="msg ok">{ok}</div>}

      {showWithdraw && (
        <div className="auth-card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0, fontSize: 15 }}>Request a withdrawal</h3>
          <form onSubmit={requestWithdraw}>
            <div className="field">
              <label>Points to redeem (min {CONFIG.MIN_WITHDRAW_POINTS})</label>
              <input name="points" type="number" min={CONFIG.MIN_WITHDRAW_POINTS} step="1" required />
            </div>
            <button className="btn btn-sm">Submit request</button>
          </form>
          {withdrawals.length > 0 && (
            <div style={{ marginTop: 14 }}>
              {withdrawals.map((w) => (
                <div key={w.id} style={{ fontSize: 13, padding: "6px 0", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between" }}>
                  <span>{w.points} pts → ₹{w.amount_inr}</span>
                  <span className={`pill ${w.status === "approved" || w.status === "paid" ? "completed" : w.status === "rejected" ? "rejected" : "pending"}`}>
                    {w.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {reports.length === 0 ? (
        <div className="empty">No reports yet. Spotted some waste on your street? Tap "Report a problem".</div>
      ) : (
        reports.map((r) => <ReportCard key={r.id} report={r} />)
      )}

      {showModal && (
        <ReportModal
          profile={profile}
          onClose={() => setShowModal(false)}
          onSubmitted={async () => { setShowModal(false); setOk("Report submitted. An admin will assign it to a worker."); await load(); }}
        />
      )}
    </>
  );
}
