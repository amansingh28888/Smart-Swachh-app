import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

import ReportCard from "../components/ReportCard";
import CompleteModal from "../components/CompleteModal";
import VerifyModal from "../components/VerifyModal";
import ProfileSettings from "../components/ProfileSettings";

// SVG Icons
const IconHardHat = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"/><path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/><path d="M4 15v-3a8 8 0 0 1 16 0v3"/></svg>);
const IconClipboard = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>);
const IconTool = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>);
const IconMapPin = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>);
const IconNavigation = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>);
const IconPlay = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>);
const IconCamera = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>);
const IconClock = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>);
const IconShield = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>);
const IconCheck = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>);
const IconCheckCircle = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>);
const IconStar = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);

export default function WorkerDashboard({ activeNav = 0, setActiveNav }) {
  const { profile, reloadProfile } = useAuth();

  const [reports, setReports] = useState([]);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [queueFilter, setQueueFilter] = useState("all");
  const [selectedMapTask, setSelectedMapTask] = useState(null);

  // Duty status persisted in localStorage & Auth Metadata
  const [onDuty, setOnDuty] = useState(() => {
    if (!profile?.id) return true;
    return localStorage.getItem(`worker_break_${profile.id}`) !== "true";
  });

  const [ok, setOk] = useState("");

  useEffect(() => {
    if (profile?.id) {
      const savedBreak = localStorage.getItem(`worker_break_${profile.id}`);
      setOnDuty(savedBreak !== "true");
    }
  }, [profile?.id]);

  async function toggleShift() {
    const nextDuty = !onDuty;
    setOnDuty(nextDuty);

    if (profile?.id) {
      localStorage.setItem(`worker_break_${profile.id}`, nextDuty ? "false" : "true");
    }

    try {
      await supabase.auth.updateUser({
        data: { is_on_duty: nextDuty }
      });
    } catch (err) {
      // Ignore if auth update fails
    }

    if (reloadProfile) await reloadProfile();

    setOk(
      nextDuty
        ? "Shift resumed: Status is ACTIVE ON DUTY. Admin can assign new tasks."
        : "Shift paused: Status is ON BREAK. Admin is BLOCKED from assigning new tasks to you."
    );
  }

  async function load() {
    if (!profile?.id) return;
    const { data, error } = await supabase
      .from("reports")
      .select("*, profiles(name, phone)")
      .eq("assigned_worker_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }
    setReports(data || []);
  }

  useEffect(() => {
    if (profile?.id) load();
  }, [profile?.id]);

  async function markInProgress(id) {
    const { error } = await supabase.from("reports").update({ status: "in_progress" }).eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    setOk("Task marked as In Progress. Time to clean!");
    await load();
  }

  function hasLocation(report) {
    return report?.location_lat != null && report?.location_lng != null;
  }

  function viewLocation(report) {
    if (!hasLocation(report)) {
      alert("Location coordinates not provided.");
      return;
    }
    window.open(`https://www.google.com/maps?q=${report.location_lat},${report.location_lng}`, "_blank");
  }

  function startNavigation(report) {
    if (!hasLocation(report)) {
      alert("Location coordinates not provided.");
      return;
    }
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${report.location_lat},${report.location_lng}`, "_blank");
  }

  const active = reports.filter((r) => r.status !== "completed");
  const done = reports.filter((r) => r.status === "completed");
  const assignedCount = reports.filter((r) => r.status === "assigned").length;
  const inProgressCount = reports.filter((r) => r.status === "in_progress" || r.status === "reopened").length;
  const reviewCount = reports.filter((r) => r.status === "pending_approval" || r.status === "approved").length;

  const firstName = profile?.full_name?.split(" ")[0] || profile?.name?.split(" ")[0] || "Worker";

  const filteredQueue = active.filter((r) => {
    if (queueFilter === "assigned") return r.status === "assigned";
    if (queueFilter === "in_progress") return r.status === "in_progress" || r.status === "reopened";
    if (queueFilter === "pending_approval") return r.status === "pending_approval";
    if (queueFilter === "approved") return r.status === "approved";
    return true;
  });

  const activeWithLoc = active.filter(r => r.location_lat && r.location_lng);
  const currentMapTask = selectedMapTask || activeWithLoc[0] || reports.find(r => r.location_lat && r.location_lng);

  return (
    <div className="worker-dashboard">

      {/* Global Alert Notification */}
      {ok && (
        <div className="modern-message success-message">
          <IconCheck />
          {ok}
        </div>
      )}

      {/* ================= 0: DASHBOARD ================= */}
      {activeNav === 0 && (
        <>
          {/* HERO BANNER V2 */}
          <div className="worker-hero-v2">
            <div>
              <div className="worker-hero-badge">
                <IconHardHat /> Sanitation Staff · Sector 4 Fleet
              </div>
              <h1 className="worker-hero-title">
                Ready for today's tasks,<br />{firstName}.
              </h1>
              <p className="worker-hero-desc">
                You have <strong>{active.length} active cleanup assignment{active.length !== 1 ? "s" : ""}</strong> pending.
                Complete tasks, upload completion photos, and collect citizen verification codes.
              </p>
            </div>

            <div className="worker-hero-right">
              <div className="shift-status-pill">
                <span className={`shift-pulse-dot ${onDuty ? "" : "paused"}`} style={{ background: onDuty ? "#10B981" : "#F59E0B" }}></span>
                {onDuty ? "Active Duty • Zone 4" : "On Break"}
              </div>
              <button
                className="btn-outline btn-sm"
                style={{ background: "rgba(255,255,255,0.15)", color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}
                onClick={toggleShift}
              >
                {onDuty ? "Take a Break" : "Resume Duty"}
              </button>
            </div>
          </div>

          {/* 4-KPI METRICS GRID */}
          <div className="worker-kpi-grid">
            <div className="worker-kpi-card" onClick={() => { setActiveNav(1); setQueueFilter("assigned"); }}>
              <div className="worker-kpi-icon assigned"><IconClipboard /></div>
              <div>
                <div className="worker-kpi-num">{assignedCount}</div>
                <div className="worker-kpi-label">New Assigned</div>
              </div>
            </div>

            <div className="worker-kpi-card" onClick={() => { setActiveNav(1); setQueueFilter("in_progress"); }}>
              <div className="worker-kpi-icon progress"><IconTool /></div>
              <div>
                <div className="worker-kpi-num">{inProgressCount}</div>
                <div className="worker-kpi-label">In Progress</div>
              </div>
            </div>

            <div className="worker-kpi-card" onClick={() => { setActiveNav(1); setQueueFilter("pending_approval"); }}>
              <div className="worker-kpi-icon review"><IconClock /></div>
              <div>
                <div className="worker-kpi-num">{reviewCount}</div>
                <div className="worker-kpi-label">Review / Verify</div>
              </div>
            </div>

            <div className="worker-kpi-card" onClick={() => { setActiveNav(1); setQueueFilter("all"); }}>
              <div className="worker-kpi-icon done"><IconCheck /></div>
              <div>
                <div className="worker-kpi-num">{done.length}</div>
                <div className="worker-kpi-label">Completed</div>
              </div>
            </div>
          </div>

          {/* ACTIVE WORK QUEUE LIST */}
          <div className="view-header">
            <div>
              <h2 className="view-title">Active Work Queue ({active.length})</h2>
              <p className="view-desc">Priority task list assigned by municipal admin</p>
            </div>
            <button className="btn-outline btn-sm" onClick={() => setActiveNav(1)}>
              View All Work Queue →
            </button>
          </div>

          {active.length === 0 ? (
            <div className="worker-empty" style={{ background: "var(--card)", padding: 40, borderRadius: 16, border: "1px solid var(--border)", textAlign: "center" }}>
              <div className="worker-empty-icon" style={{ color: "var(--primary)", marginBottom: 10 }}><IconCheckCircle /></div>
              <h3>All clear! No pending assignments</h3>
              <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>Great job! New tasks assigned by admin will appear here automatically.</p>
            </div>
          ) : (
            <div className="worker-task-list">
              {active.slice(0, 3).map((r) => (
                <ReportCard
                  key={r.id}
                  report={r}
                  rightSlot={
                    <div className="worker-actions" style={{ marginTop: 12 }}>
                      <div className="worker-location-group">
                        <button className="btn-location-map" onClick={() => viewLocation(r)} title="View Map Location">
                          <IconMapPin /><span>View Spot</span>
                        </button>
                        <button className="btn-navigate-gps" onClick={() => startNavigation(r)} title="Open GPS Navigation">
                          <IconNavigation /><span>GPS Directions</span>
                        </button>
                      </div>

                      {/* Display Citizen Contact if available and task not completed */}
                      {r.status !== "completed" && r.profiles?.phone && (
                        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span>📞</span>
                          <div>
                            <strong>Citizen Contact:</strong> <a href={`tel:${r.profiles.phone}`} style={{ color: "#15803d", textDecoration: "underline" }}>{r.profiles.phone}</a>
                          </div>
                        </div>
                      )}

                      {r.status === "assigned" && (
                        <button className="btn-worker-primary" onClick={() => markInProgress(r.id)}>
                          <IconPlay /> Start Cleanup Task
                        </button>
                      )}

                      {(r.status === "in_progress" || r.status === "reopened") && (
                        <button className="btn-worker-primary" onClick={() => setCompleteTarget(r.id)}>
                          <IconCamera /> Upload Completion Photo
                        </button>
                      )}

                      {r.status === "pending_approval" && (
                        <div className="worker-waiting" style={{ background: "#F3E8FF", color: "#6D28D9", padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600 }}>
                          <IconClock /> Awaiting Citizen Approval
                        </div>
                      )}

                      {r.status === "approved" && (
                        <button className="btn-worker-verify" onClick={() => setVerifyTarget(r.id)}>
                          <IconShield /> Enter Citizen Verify Code
                        </button>
                      )}
                    </div>
                  }
                />
              ))}
            </div>
          )}

          {/* PERFORMANCE SCORECARD */}
          <div className="chart-card" style={{ marginTop: 28 }}>
            <div className="chart-card-title">
              <span>Worker Performance & Rating</span>
              <span className="role-pill" style={{ background: "#FEF3C7", color: "#D97706" }}>Top 10% Staff</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 12 }}>
              <div style={{ background: "var(--bg)", padding: 16, borderRadius: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#D97706", fontSize: 22, fontWeight: 800 }}>
                  <IconStar /> 4.9 <span style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 500 }}>/ 5.0</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>Citizen Satisfaction Score</div>
              </div>

              <div style={{ background: "var(--bg)", padding: 16, borderRadius: 10 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--primary)" }}>{done.length} Sites</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>Total Waste Locations Cleaned</div>
              </div>

              <div style={{ background: "var(--bg)", padding: 16, borderRadius: 10 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#2563EB" }}>100%</div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2 }}>On-Time Verification Rate</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ================= 1: WORK QUEUE ================= */}
      {activeNav === 1 && (
        <>
          <div className="view-header">
            <div>
              <h2 className="view-title">Work Queue Roster</h2>
              <p className="view-desc">Manage active tasks, start work, and request citizen approval</p>
            </div>
            <div className="task-count-badge">{active.length} Tasks Remaining</div>
          </div>

          <div className="filter-pills" style={{ marginBottom: 18 }}>
            <button className={`filter-btn ${queueFilter === "all" ? "active" : ""}`} onClick={() => setQueueFilter("all")}>All Active ({active.length})</button>
            <button className={`filter-btn ${queueFilter === "assigned" ? "active" : ""}`} onClick={() => setQueueFilter("assigned")}>New Assigned ({assignedCount})</button>
            <button className={`filter-btn ${queueFilter === "in_progress" ? "active" : ""}`} onClick={() => setQueueFilter("in_progress")}>In Progress ({inProgressCount})</button>
            <button className={`filter-btn ${queueFilter === "pending_approval" ? "active" : ""}`} onClick={() => setQueueFilter("pending_approval")}>Citizen Review</button>
            <button className={`filter-btn ${queueFilter === "approved" ? "active" : ""}`} onClick={() => setQueueFilter("approved")}>Ready for Verification</button>
          </div>

          {filteredQueue.length === 0 ? (
            <div className="worker-empty" style={{ background: "var(--card)", padding: 40, borderRadius: 16, textAlign: "center" }}>
              <div className="worker-empty-icon" style={{ color: "var(--primary)" }}><IconCheckCircle /></div>
              <h3>No tasks match filter "{queueFilter}"</h3>
              <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>Switch filter to view other tasks.</p>
            </div>
          ) : (
            <div className="worker-task-list">
              {filteredQueue.map((r) => (
                <ReportCard
                  key={r.id}
                  report={r}
                  rightSlot={
                    <div className="worker-actions" style={{ marginTop: 12 }}>
                      <div className="worker-location-group">
                        <button className="btn-location-map" onClick={() => viewLocation(r)} title="View Map Location">
                          <IconMapPin /><span>View Spot</span>
                        </button>
                        <button className="btn-navigate-gps" onClick={() => startNavigation(r)} title="Open GPS Navigation">
                          <IconNavigation /><span>GPS Directions</span>
                        </button>
                      </div>

                      {/* Display Citizen Contact if available and task not completed */}
                      {r.status !== "completed" && r.profiles?.phone && (
                        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span>📞</span>
                          <div>
                            <strong>Citizen Contact:</strong> <a href={`tel:${r.profiles.phone}`} style={{ color: "#15803d", textDecoration: "underline" }}>{r.profiles.phone}</a>
                          </div>
                        </div>
                      )}

                      {r.status === "assigned" && (
                        <button className="btn-worker-primary" onClick={() => markInProgress(r.id)}>
                          <IconPlay /> Start Cleanup Task
                        </button>
                      )}

                      {(r.status === "in_progress" || r.status === "reopened") && (
                        <button className="btn-worker-primary" onClick={() => setCompleteTarget(r.id)}>
                          <IconCamera /> Upload Completion Photo
                        </button>
                      )}

                      {r.status === "pending_approval" && (
                        <div className="worker-waiting" style={{ background: "#F3E8FF", color: "#6D28D9", padding: "8px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600 }}>
                          <IconClock /> Awaiting Citizen Approval
                        </div>
                      )}

                      {r.status === "approved" && (
                        <button className="btn-worker-verify" onClick={() => setVerifyTarget(r.id)}>
                          <IconShield /> Enter Citizen Verify Code
                        </button>
                      )}
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ================= 2: LOCATIONS ================= */}
      {activeNav === 2 && (
        <>
          <div className="view-header">
            <div>
              <h2 className="view-title">Task Locations & GPS Navigation</h2>
              <p className="view-desc">Coordinates and driving directions for assigned sanitation sites</p>
            </div>
          </div>

          {!currentMapTask ? (
            <div className="worker-empty" style={{ background: "var(--card)", padding: 40, borderRadius: 16, textAlign: "center" }}>
              <div className="worker-empty-icon" style={{ color: "var(--primary)" }}><IconMapPin /></div>
              <h3>No location data available</h3>
              <p style={{ color: "var(--ink-soft)", fontSize: 13 }}>Locations will be plotted here as tasks are assigned.</p>
            </div>
          ) : (
            <div className="map-view-container">
              <div className="map-sidebar-list">
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-muted)", marginBottom: 4 }}>ASSIGNED LOCATIONS ({activeWithLoc.length})</div>
                {activeWithLoc.map((r) => (
                  <div
                    key={r.id}
                    className={`map-item-card ${currentMapTask?.id === r.id ? "active" : ""}`}
                    onClick={() => setSelectedMapTask(r)}
                  >
                    <div className="map-item-title">{r.title || r.category || "Waste Spot"}</div>
                    <div className="map-item-sub">{r.location_address || `Lat: ${r.location_lat?.toFixed(4)}, Lng: ${r.location_lng?.toFixed(4)}`}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button className="btn-location-map" style={{ padding: "5px 10px", fontSize: 11 }} onClick={(e) => { e.stopPropagation(); viewLocation(r); }}>
                        <IconMapPin /> View Spot
                      </button>
                      <button className="btn-navigate-gps" style={{ padding: "5px 12px", fontSize: 11 }} onClick={(e) => { e.stopPropagation(); startNavigation(r); }}>
                        <IconNavigation /> GPS Directions
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="map-canvas-card">
                {currentMapTask && (
                  <iframe
                    title="Task Map Location"
                    className="map-canvas-iframe"
                    src={`https://maps.google.com/maps?q=${currentMapTask.location_lat},${currentMapTask.location_lng}&z=15&output=embed`}
                  />
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ================= 3: PROFILE SETTINGS ================= */}
      {activeNav === 3 && (
        <ProfileSettings />
      )}

      {/* ================= COMPLETE MODAL ================= */}
      {completeTarget && (
        <CompleteModal
          profile={profile}
          reportId={completeTarget}
          onClose={() => setCompleteTarget(null)}
          onCompleted={async () => {
            setCompleteTarget(null);
            setOk("Completion photo sent for citizen approval.");
            await load();
          }}
        />
      )}

      {/* ================= VERIFY MODAL ================= */}
      {verifyTarget && (
        <VerifyModal
          reportId={verifyTarget}
          onClose={() => setVerifyTarget(null)}
          onVerified={async () => {
            setVerifyTarget(null);
            setOk("Task verified and completed successfully!");
            await load();
          }}
        />
      )}

    </div>
  );
}