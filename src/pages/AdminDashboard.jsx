import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import ReportCard from "../components/ReportCard";

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [tab, setTab] = useState("reports");

  async function load() {
    const { data: r } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
    setReports(r || []);
    const { data: w } = await supabase.from("profiles").select("*").eq("role", "worker");
    setWorkers(w || []);
    const { data: wd } = await supabase.from("withdrawals").select("*, profiles:citizen_id(name,email)").order("created_at", { ascending: false });
    setWithdrawals(wd || []);
  }

  useEffect(() => { load(); }, []);

  async function assignWorker(reportId, workerId) {
    if (!workerId) return;
    await supabase.from("reports").update({ assigned_worker_id: workerId, status: "assigned", assigned_at: new Date().toISOString() }).eq("id", reportId);
    await load();
  }

  async function setWithdrawalStatus(id, status) {
    await supabase.from("withdrawals").update({ status }).eq("id", id);
    await load();
  }

  const pending = reports.filter((r) => r.status === "pending");
  const active = reports.filter((r) => r.status === "assigned" || r.status === "in_progress");
  const completed = reports.filter((r) => r.status === "completed");

  function workerName(id) {
    return (workers.find((w) => w.id === id) || {}).name;
  }

  return (
    <>
      <div className="section-head"><h2>Admin overview</h2></div>
      <div className="stat-row">
        <div className="stat"><div className="num">{reports.length}</div><div className="label">Total reports</div></div>
        <div className="stat"><div className="num">{pending.length}</div><div className="label">Awaiting assignment</div></div>
        <div className="stat"><div className="num">{active.length}</div><div className="label">In progress</div></div>
        <div className="stat"><div className="num">{completed.length}</div><div className="label">Completed</div></div>
        <div className="stat"><div className="num">{workers.length}</div><div className="label">Workers</div></div>
      </div>

      <div className="tab-row">
        <button className={tab === "reports" ? "active" : ""} onClick={() => setTab("reports")}>Reports</button>
        <button className={tab === "withdrawals" ? "active" : ""} onClick={() => setTab("withdrawals")}>Withdrawals</button>
      </div>

      {tab === "reports" ? (
        <>
          {pending.length > 0 && (
            <>
              <h3 style={{ fontSize: 15, margin: "22px 0 10px" }}>Awaiting assignment ({pending.length})</h3>
              {pending.map((r) => (
                <ReportCard
                  key={r.id}
                  report={r}
                  rightSlot={
                    <div className="report-actions">
                      <select className="assign-select" defaultValue="" onChange={(e) => assignWorker(r.id, e.target.value)}>
                        <option value="">Assign worker…</option>
                        {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    </div>
                  }
                />
              ))}
            </>
          )}
          {active.length > 0 && (
            <>
              <h3 style={{ fontSize: 15, margin: "22px 0 10px" }}>In progress ({active.length})</h3>
              {active.map((r) => <ReportCard key={r.id} report={r} workerName={workerName(r.assigned_worker_id)} />)}
            </>
          )}
          {completed.length > 0 && (
            <>
              <h3 style={{ fontSize: 15, margin: "22px 0 10px" }}>Completed ({completed.length})</h3>
              {completed.map((r) => <ReportCard key={r.id} report={r} workerName={workerName(r.assigned_worker_id)} />)}
            </>
          )}
          {reports.length === 0 && <div className="empty">No reports yet.</div>}
        </>
      ) : (
        <>
          {withdrawals.length === 0 ? (
            <div className="empty">No withdrawal requests yet.</div>
          ) : (
            withdrawals.map((w) => (
              <div className="report" style={{ alignItems: "center" }} key={w.id}>
                <div className="report-body">
                  <div className="report-top">
                    <h3>{w.profiles?.name || "Citizen"} — ₹{w.amount_inr}</h3>
                    <span className={`pill ${w.status === "approved" || w.status === "paid" ? "completed" : w.status === "rejected" ? "rejected" : "pending"}`}>
                      {w.status}
                    </span>
                  </div>
                  <p className="report-meta">{w.points} points · {fmtDate(w.created_at)} · {w.profiles?.email || ""}</p>
                  {w.status === "requested" && (
                    <div className="report-actions">
                      <button className="btn btn-sm" onClick={() => setWithdrawalStatus(w.id, "approved")}>Approve</button>
                      <button className="btn-outline btn-sm" onClick={() => setWithdrawalStatus(w.id, "rejected")}>Reject</button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </>
      )}
    </>
  );
}
