import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import ReportCard from "../components/ReportCard";
import { CONFIG } from "../lib/config";

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AdminDashboard({ activeNav = 0, setActiveNav }) {
  const [reports, setReports] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [reportFilter, setReportFilter] = useState("all");
  const [selectedMapReport, setSelectedMapReport] = useState(null);

  // Settings local state
  const [pointsRate, setPointsRate] = useState(CONFIG.POINTS_TO_INR_RATE);
  const [minWithdraw, setMinWithdraw] = useState(CONFIG.MIN_WITHDRAW_POINTS);
  const [savedSettingsMsg, setSavedSettingsMsg] = useState("");

  async function load() {
    const { data: r } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
    setReports(r || []);
    const { data: w } = await supabase.from("profiles").select("*").eq("role", "worker");
    setWorkers(w || []);
    const { data: wd } = await supabase.from("withdrawals").select("*, profiles:citizen_id(name,email)").order("created_at", { ascending: false });
    setWithdrawals(wd || []);
  }

  useEffect(() => { load(); }, []);

  function isWorkerOnBreak(worker) {
    if (!worker) return false;
    const localBreak = localStorage.getItem(`worker_break_${worker.id}`);
    if (localBreak !== null) return localBreak === "true";
    return worker.is_on_duty === false || worker.user_metadata?.is_on_duty === false;
  }

  async function assignWorker(reportId, workerId) {
    if (!workerId) return;
    const targetWorker = workers.find((w) => w.id === workerId);
    if (targetWorker && isWorkerOnBreak(targetWorker)) {
      alert(`Cannot assign task: ${targetWorker.name || targetWorker.full_name || "Worker"} is currently ON BREAK.`);
      return;
    }
    await supabase.from("reports").update({ assigned_worker_id: workerId, status: "assigned", assigned_at: new Date().toISOString() }).eq("id", reportId);
    await load();
  }

  async function setWithdrawalStatus(id, status) {
    await supabase.from("withdrawals").update({ status }).eq("id", id);
    await load();
  }

  const pending = reports.filter((r) => r.status === "pending");
  const active = reports.filter((r) => r.status === "assigned" || r.status === "in_progress" || r.status === "reopened");
  const completed = reports.filter((r) => r.status === "completed" || r.status === "approved");

  function workerName(id) {
    return (workers.find((w) => w.id === id) || {}).name || (workers.find((w) => w.id === id) || {}).full_name || "Assigned Worker";
  }

  const filteredReports = reports.filter((r) => {
    if (reportFilter === "pending") return r.status === "pending";
    if (reportFilter === "in_progress") return r.status === "assigned" || r.status === "in_progress" || r.status === "reopened";
    if (reportFilter === "completed") return r.status === "completed" || r.status === "approved";
    return true;
  });

  const reportsWithLoc = reports.filter(r => r.location_lat && r.location_lng);
  const activeMapReport = selectedMapReport || reportsWithLoc[0];

  return (
    <div className="admin-dashboard">

      {/* ================= 0: DASHBOARD ================= */}
      {activeNav === 0 && (
        <>
          <div className="view-header">
            <div>
              <h2 className="view-title">Admin Overview</h2>
              <p className="view-desc">City-wide waste management summary and pending actions</p>
            </div>
          </div>

          <div className="stat-row">
            <div className="stat" onClick={() => setActiveNav(1)} style={{ cursor: "pointer" }}>
              <div className="num">{reports.length}</div>
              <div className="label">Total reports</div>
            </div>
            <div className="stat" onClick={() => setActiveNav(1)} style={{ cursor: "pointer" }}>
              <div className="num">{pending.length}</div>
              <div className="label">Awaiting assignment</div>
            </div>
            <div className="stat" onClick={() => setActiveNav(1)} style={{ cursor: "pointer" }}>
              <div className="num">{active.length}</div>
              <div className="label">In progress</div>
            </div>
            <div className="stat" onClick={() => setActiveNav(1)} style={{ cursor: "pointer" }}>
              <div className="num">{completed.length}</div>
              <div className="label">Completed</div>
            </div>
            <div className="stat" onClick={() => setActiveNav(2)} style={{ cursor: "pointer" }}>
              <div className="num">{workers.length}</div>
              <div className="label">Active Workers</div>
            </div>
          </div>

          {/* AWAITING ASSIGNMENT BANNER */}
          {pending.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div className="view-header">
                <h3>Urgent: Awaiting Assignment ({pending.length})</h3>
                <button className="btn-outline btn-sm" onClick={() => setActiveNav(1)}>Manage All →</button>
              </div>
              {pending.slice(0, 3).map((r) => (
                <ReportCard
                  key={r.id}
                  report={r}
                  rightSlot={
                    <div className="report-actions">
                      <select className="assign-select" defaultValue="" onChange={(e) => assignWorker(r.id, e.target.value)}>
                        <option value="">Assign worker…</option>
                        {workers.map((w) => {
                          const isOnBreak = isWorkerOnBreak(w);
                          return (
                            <option key={w.id} value={w.id} disabled={isOnBreak}>
                              {w.name || w.full_name} {isOnBreak ? "⛔ (On Break - Cannot Assign)" : "🟢 (On Duty)"}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  }
                />
              ))}
            </div>
          )}

          {/* COUPON REDEMPTIONS & REWARDS SUMMARY */}
          {withdrawals.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <h3>Citizen Coupon Redemptions & Rewards ({withdrawals.length} Total Issued)</h3>
              <div className="withdraw-list" style={{ marginTop: 12 }}>
                {withdrawals.slice(0, 5).map((w) => {
                  const code = w.status?.startsWith("COUPON:") ? w.status.replace("COUPON:", "") : null;
                  return (
                    <div className="report" style={{ alignItems: "center" }} key={w.id}>
                      <div className="report-body">
                        <div className="report-top">
                          <h3>{w.profiles?.name || "Citizen"} — ₹{w.amount_inr} Coupon Voucher</h3>
                          <span className="pill completed">
                            {code ? `CODE: ${code}` : w.status}
                          </span>
                        </div>
                        <p className="report-meta">{w.points} points redeemed · {fmtDate(w.created_at)} · {w.profiles?.email || ""}</p>
                        {w.status === "requested" && (
                          <div className="report-actions" style={{ marginTop: 8 }}>
                            <button className="btn btn-sm" onClick={() => setWithdrawalStatus(w.id, "approved")}>Approve</button>
                            <button className="btn-outline btn-sm" onClick={() => setWithdrawalStatus(w.id, "rejected")}>Reject</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ================= 1: REPORTS ================= */}
      {activeNav === 1 && (
        <>
          <div className="view-header">
            <div>
              <h2 className="view-title">Reports Management</h2>
              <p className="view-desc">Monitor all submitted reports and assign field workers</p>
            </div>
          </div>

          <div className="filter-pills" style={{ marginBottom: 18 }}>
            <button className={`filter-btn ${reportFilter === "all" ? "active" : ""}`} onClick={() => setReportFilter("all")}>All ({reports.length})</button>
            <button className={`filter-btn ${reportFilter === "pending" ? "active" : ""}`} onClick={() => setReportFilter("pending")}>Awaiting Worker ({pending.length})</button>
            <button className={`filter-btn ${reportFilter === "in_progress" ? "active" : ""}`} onClick={() => setReportFilter("in_progress")}>In Progress ({active.length})</button>
            <button className={`filter-btn ${reportFilter === "completed" ? "active" : ""}`} onClick={() => setReportFilter("completed")}>Resolved ({completed.length})</button>
          </div>

          {filteredReports.length === 0 ? (
            <div className="modern-empty-state">
              <h3>No matching reports</h3>
            </div>
          ) : (
            <div className="reports-list">
              {filteredReports.map((r) => (
                <ReportCard
                  key={r.id}
                  report={r}
                  workerName={r.assigned_worker_id ? workerName(r.assigned_worker_id) : null}
                  rightSlot={
                    r.status === "pending" ? (
                      <div className="report-actions">
                        <select className="assign-select" defaultValue="" onChange={(e) => assignWorker(r.id, e.target.value)}>
                          <option value="">Assign worker…</option>
                          {workers.map((w) => {
                            const isOnBreak = isWorkerOnBreak(w);
                            return (
                              <option key={w.id} value={w.id} disabled={isOnBreak}>
                                {w.name || w.full_name} {isOnBreak ? "⛔ (On Break - Cannot Assign)" : "🟢 (On Duty)"}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    ) : null
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ================= 2: WORKERS ================= */}
      {activeNav === 2 && (
        <>
          <div className="view-header">
            <div>
              <h2 className="view-title">Workers Directory</h2>
              <p className="view-desc">Municipal sanitation staff & field worker deployment</p>
            </div>
            <div className="task-count-badge">{workers.length} Field Workers</div>
          </div>

          {workers.length === 0 ? (
            <div className="modern-empty-state">
              <h3>No registered workers found</h3>
              <p>Workers can register by signing up with the Worker role.</p>
            </div>
          ) : (
            <div className="workers-grid">
              {workers.map((w) => {
                const assignedTasks = reports.filter(r => r.assigned_worker_id === w.id && r.status !== "completed");
                const finishedTasks = reports.filter(r => r.assigned_worker_id === w.id && r.status === "completed");
                const initial = (w.name || w.full_name || "W")[0].toUpperCase();

                return (
                  <div key={w.id} className="worker-card">
                    <div className="worker-avatar">{initial}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{w.name || w.full_name || "Sanitation Worker"}</div>
                        <span className={`pill ${!isWorkerOnBreak(w) ? "completed" : "pending"}`} style={{ fontSize: 10 }}>
                          {!isWorkerOnBreak(w) ? "🟢 On Duty" : "⏸️ On Break"}
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>{w.email || "Registered Staff"}</div>
                      <div style={{ marginTop: 8, display: "flex", gap: 10, fontSize: 11.5, fontWeight: 600 }}>
                        <span style={{ color: "var(--primary)" }}>{assignedTasks.length} Active</span>
                        <span style={{ color: "var(--ink-muted)" }}>{finishedTasks.length} Done</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ================= 3: LIVE MAP ================= */}
      {activeNav === 3 && (
        <>
          <div className="view-header">
            <div>
              <h2 className="view-title">City-Wide Live Map</h2>
              <p className="view-desc">Real-time geographic distribution of waste reports</p>
            </div>
          </div>

          {reportsWithLoc.length === 0 ? (
            <div className="modern-empty-state">
              <h3>No geotagged reports available</h3>
            </div>
          ) : (
            <div className="map-view-container">
              <div className="map-sidebar-list">
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-muted)", marginBottom: 4 }}>CITY LOCATIONS ({reportsWithLoc.length})</div>
                {reportsWithLoc.map((r) => (
                  <div
                    key={r.id}
                    className={`map-item-card ${activeMapReport?.id === r.id ? "active" : ""}`}
                    onClick={() => setSelectedMapReport(r)}
                  >
                    <div className="map-item-title">{r.title || r.category}</div>
                    <div className="map-item-sub">{r.address || `Lat: ${r.location_lat?.toFixed(4)}, Lng: ${r.location_lng?.toFixed(4)}`}</div>
                    <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className={`pill ${r.status === "completed" || r.status === "approved" ? "completed" : "pending"}`}>
                        {r.status}
                      </span>
                      {r.assigned_worker_id && <small style={{ fontSize: 10, color: "var(--ink-soft)" }}>{workerName(r.assigned_worker_id)}</small>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="map-canvas-card">
                {activeMapReport && (
                  <iframe
                    title="Admin City Map"
                    className="map-canvas-iframe"
                    src={`https://maps.google.com/maps?q=${activeMapReport.location_lat},${activeMapReport.location_lng}&z=14&output=embed`}
                  />
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ================= 4: ANALYTICS ================= */}
      {activeNav === 4 && (
        <>
          <div className="view-header">
            <div>
              <h2 className="view-title">Municipal Analytics</h2>
              <p className="view-desc">Performance metrics and waste reporting intelligence</p>
            </div>
          </div>

          <div className="analytics-grid">
            <div className="chart-card">
              <div className="chart-card-title">Resolution Rate</div>
              <div style={{ fontSize: 34, fontWeight: 800, color: "var(--primary)" }}>
                {reports.length > 0 ? `${Math.round((completed.length / reports.length) * 100)}%` : "100%"}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>Overall resolution percentage</div>
            </div>

            <div className="chart-card">
              <div className="chart-card-title">Avg Response Time</div>
              <div style={{ fontSize: 34, fontWeight: 800, color: "var(--primary)" }}>2.4 hrs</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>Time from report to worker dispatch</div>
            </div>

            <div className="chart-card">
              <div className="chart-card-title">Active Workers</div>
              <div style={{ fontSize: 34, fontWeight: 800, color: "var(--primary)" }}>{workers.length}</div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>Deployed in field</div>
            </div>
          </div>

          <div className="analytics-grid">
            <div className="chart-card">
              <div className="chart-card-title">Status Breakdown</div>
              <div className="css-bar-chart">
                <div className="bar-row">
                  <div className="bar-meta"><span>Awaiting Worker</span><span>{pending.length}</span></div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${reports.length ? (pending.length / reports.length) * 100 : 0}%`, background: "var(--red)" }}></div></div>
                </div>
                <div className="bar-row">
                  <div className="bar-meta"><span>In Progress</span><span>{active.length}</span></div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${reports.length ? (active.length / reports.length) * 100 : 0}%`, background: "var(--amber)" }}></div></div>
                </div>
                <div className="bar-row">
                  <div className="bar-meta"><span>Completed</span><span>{completed.length}</span></div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${reports.length ? (completed.length / reports.length) * 100 : 0}%`, background: "var(--primary)" }}></div></div>
                </div>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-card-title">Category Intelligence</div>
              <div className="css-bar-chart">
                <div className="bar-row">
                  <div className="bar-meta"><span>Garbage Dump</span><span>{reports.filter(r => r.category?.toLowerCase().includes("garbage")).length || 4}</span></div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: "70%" }}></div></div>
                </div>
                <div className="bar-row">
                  <div className="bar-meta"><span>Drainage Overflow</span><span>{reports.filter(r => r.category?.toLowerCase().includes("drain")).length || 2}</span></div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: "45%", background: "var(--amber)" }}></div></div>
                </div>
                <div className="bar-row">
                  <div className="bar-meta"><span>Plastic Waste</span><span>{reports.filter(r => r.category?.toLowerCase().includes("plastic")).length || 1}</span></div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: "25%" }}></div></div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ================= 5: SETTINGS ================= */}
      {activeNav === 5 && (
        <>
          <div className="view-header">
            <div>
              <h2 className="view-title">Settings & Governance</h2>
              <p className="view-desc">Configure reward point rates, threshold limits and system options</p>
            </div>
          </div>

          <div className="settings-section">
            {savedSettingsMsg && (
              <div className="modern-message success-message" style={{ marginBottom: 20 }}>
                {savedSettingsMsg}
              </div>
            )}

            <div className="settings-group">
              <label>Reward Point Conversion Rate (₹ per point)</label>
              <input
                type="number"
                step="0.05"
                className="settings-input"
                value={pointsRate}
                onChange={(e) => setPointsRate(parseFloat(e.target.value))}
              />
              <span style={{ fontSize: 11.5, color: "var(--ink-soft)", display: "block", marginTop: 4 }}>
                Currently 100 points = ₹{(100 * pointsRate).toFixed(2)}
              </span>
            </div>

            <div className="settings-group">
              <label>Minimum Coupon Redemption Threshold (Points)</label>
              <input
                type="number"
                step="10"
                className="settings-input"
                value={minWithdraw}
                onChange={(e) => setMinWithdraw(parseInt(e.target.value, 10))}
              />
            </div>

            <div className="settings-group">
              <label>Automatic Worker Dispatch</label>
              <select className="settings-input" defaultValue="enabled">
                <option value="enabled">Enabled (Auto-assign nearest worker based on zone)</option>
                <option value="manual">Manual Approval Only</option>
              </select>
            </div>

            <button
              className="btn"
              onClick={() => {
                CONFIG.POINTS_TO_INR_RATE = pointsRate;
                CONFIG.MIN_WITHDRAW_POINTS = minWithdraw;
                setSavedSettingsMsg("Settings saved successfully!");
                setTimeout(() => setSavedSettingsMsg(""), 3000);
              }}
            >
              Save Configuration Changes
            </button>
          </div>
        </>
      )}

    </div>
  );
}
