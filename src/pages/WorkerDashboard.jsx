import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

import ReportCard from "../components/ReportCard";
import CompleteModal from "../components/CompleteModal";
import VerifyModal from "../components/VerifyModal";

export default function WorkerDashboard() {
  const { profile } = useAuth();

  const [reports, setReports] = useState([]);
  const [completeTarget, setCompleteTarget] =
    useState(null);
  const [verifyTarget, setVerifyTarget] =
    useState(null);

  const [ok, setOk] = useState("");

  // ===============================
  // LOAD REPORTS
  // ===============================

  async function load() {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("assigned_worker_id", profile.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      return;
    }

    setReports(data || []);
  }

  useEffect(() => {
    if (profile?.id) {
      load();
    }
  }, [profile?.id]);

  // ===============================
  // START WORK
  // ===============================

  async function markInProgress(id) {
    const { error } = await supabase
      .from("reports")
      .update({
        status: "in_progress",
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await load();
  }

  // ===============================
  // LOCATION CHECK
  // ===============================

  function hasLocation(report) {
    return (
      report.location_lat !== null &&
      report.location_lat !== undefined &&
      report.location_lng !== null &&
      report.location_lng !== undefined
    );
  }

  // ===============================
  // VIEW LOCATION
  // ===============================

  function viewLocation(report) {
    if (!hasLocation(report)) {
      alert("Location is not available for this report.");
      return;
    }

    const lat = report.location_lat;
    const lng = report.location_lng;

    const url =
      `https://www.google.com/maps?q=${lat},${lng}`;

    window.open(url, "_blank");
  }

  // ===============================
  // START NAVIGATION
  // ===============================

  function startNavigation(report) {
    if (!hasLocation(report)) {
      alert("Location is not available for this report.");
      return;
    }

    const lat = report.location_lat;
    const lng = report.location_lng;

    const url =
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    window.open(url, "_blank");
  }

  // ===============================
  // FILTER REPORTS
  // ===============================

  const active = reports.filter(
    (r) => r.status !== "completed"
  );

  const done = reports.filter(
    (r) => r.status === "completed"
  );

  const assignedCount = reports.filter(
    (r) => r.status === "assigned"
  ).length;

  const inProgressCount = reports.filter(
    (r) =>
      r.status === "in_progress" ||
      r.status === "reopened"
  ).length;

  const firstName =
    profile?.full_name?.split(" ")[0] ||
    profile?.name?.split(" ")[0] ||
    "Worker";

  return (
    <div className="worker-dashboard">

      {/* ================= HERO ================= */}

      <div className="worker-hero">

        <div className="worker-hero-content">

          <div className="worker-badge">
            👷 SmartSwachh Worker
          </div>

          <h1>
            Ready to make a difference,
            <br />
            {firstName}? 💪
          </h1>

          <p>
            You have <strong>{active.length}</strong> active
            task{active.length !== 1 ? "s" : ""}.
            Every completed task helps build a cleaner city.
          </p>

          <div className="worker-hero-info">

            <div>
              <span>📋</span>
              {assignedCount} New Tasks
            </div>

            <div>
              <span>🚧</span>
              {inProgressCount} In Progress
            </div>

          </div>

        </div>


        <div className="worker-hero-visual">

          <div className="worker-visual-main">
            👷
          </div>

          <div className="worker-float float-1">
            ♻️
          </div>

          <div className="worker-float float-2">
            📍
          </div>

          <div className="worker-float float-3">
            ✓
          </div>

        </div>

      </div>


      {/* ================= STATISTICS ================= */}

      <div className="worker-stats-grid">

        <div className="worker-stat-card">

          <div className="worker-stat-icon tasks">
            📋
          </div>

          <div>

            <div className="worker-stat-number">
              {reports.length}
            </div>

            <div className="worker-stat-label">
              Total Tasks
            </div>

          </div>

        </div>


        <div className="worker-stat-card">

          <div className="worker-stat-icon active">
            🚧
          </div>

          <div>

            <div className="worker-stat-number">
              {active.length}
            </div>

            <div className="worker-stat-label">
              Active Tasks
            </div>

          </div>

        </div>


        <div className="worker-stat-card">

          <div className="worker-stat-icon complete">
            ✓
          </div>

          <div>

            <div className="worker-stat-number">
              {done.length}
            </div>

            <div className="worker-stat-label">
              Completed
            </div>

          </div>

        </div>

      </div>


      {/* ================= SUCCESS MESSAGE ================= */}

      {ok && (

        <div className="modern-message success-message">
          <span>✓</span>
          {ok}
        </div>

      )}


      {/* ================= ACTIVE TASK HEADER ================= */}

      <div className="worker-section-header">

        <div>

          <div className="section-small-title">
            WORK QUEUE
          </div>

          <h2>
            Active Tasks
          </h2>

          <p>
            Manage your assigned tasks and update
            their progress.
          </p>

        </div>


        <div className="task-count-badge">
          {active.length} Active
        </div>

      </div>


      {/* ================= ACTIVE TASKS ================= */}

      {active.length === 0 ? (

        <div className="worker-empty">

          <div className="worker-empty-icon">
            🎉
          </div>

          <h3>
            You're all caught up!
          </h3>

          <p>
            There are no active tasks assigned
            to you right now.
          </p>

        </div>

      ) : (

        <div className="worker-task-list">

          {active.map((r) => (

            <div
              key={r.id}
              className="worker-task-wrapper"
            >

              <ReportCard
                report={r}

                rightSlot={

                  <div className="worker-actions">


                    {/* LOCATION ACTIONS */}

                    <div className="worker-location-actions">

                      <button
                        className="worker-action-btn"
                        onClick={() =>
                          viewLocation(r)
                        }
                      >
                        📍
                        <span>
                          Location
                        </span>
                      </button>


                      <button
                        className="worker-action-btn"
                        onClick={() =>
                          startNavigation(r)
                        }
                      >
                        🧭
                        <span>
                          Navigate
                        </span>
                      </button>

                    </div>


                    {/* ASSIGNED */}

                    {r.status === "assigned" && (

                      <button
                        className="worker-primary-action"
                        onClick={() =>
                          markInProgress(r.id)
                        }
                      >
                        ▶ Start Work
                      </button>

                    )}


                    {/* IN PROGRESS / REOPENED */}

                    {(r.status === "in_progress" ||
                      r.status === "reopened") && (

                      <button
                        className="worker-primary-action"
                        onClick={() =>
                          setCompleteTarget(r.id)
                        }
                      >
                        📸 Send for Approval
                      </button>

                    )}


                    {/* PENDING APPROVAL */}

                    {r.status ===
                      "pending_approval" && (

                      <div className="worker-waiting">

                        <span>
                          ⏳
                        </span>

                        <div>

                          <strong>
                            Awaiting Citizen Approval
                          </strong>

                          <small>
                            The citizen is reviewing
                            your completed work.
                          </small>

                        </div>

                      </div>

                    )}


                    {/* APPROVED */}

                    {r.status === "approved" && (

                      <button
                        className="worker-primary-action verify-action"
                        onClick={() =>
                          setVerifyTarget(r.id)
                        }
                      >
                        🔐 Verify & Complete
                      </button>

                    )}

                  </div>

                }
              />

            </div>

          ))}

        </div>

      )}


      {/* ================= HISTORY ================= */}

      {done.length > 0 && (

        <div className="worker-history">

          <div className="worker-section-header history-header">

            <div>

              <div className="section-small-title">
                PERFORMANCE
              </div>

              <h2>
                Completed Tasks
              </h2>

              <p>
                A record of successfully completed
                cleaning tasks.
              </p>

            </div>

            <div className="task-count-badge completed-badge">
              ✓ {done.length} Completed
            </div>

          </div>


          <div className="worker-task-list">

            {done.map((r) => (

              <div
                key={r.id}
                className="worker-task-wrapper completed-task"
              >

                <ReportCard
                  report={r}
                />

              </div>

            ))}

          </div>

        </div>

      )}


      {/* ================= COMPLETE MODAL ================= */}

      {completeTarget && (

        <CompleteModal
          profile={profile}
          reportId={completeTarget}

          onClose={() =>
            setCompleteTarget(null)
          }

          onCompleted={async () => {

            setCompleteTarget(null);

            setOk(
              "Completion photo sent for citizen approval."
            );

            await load();

          }}
        />

      )}


      {/* ================= VERIFY MODAL ================= */}

      {verifyTarget && (

        <VerifyModal
          reportId={verifyTarget}

          onClose={() =>
            setVerifyTarget(null)
          }

          onVerified={async () => {

            setVerifyTarget(null);

            setOk(
              "Task verified and completed successfully!"
            );

            await load();

          }}
        />

      )}

    </div>
  );
}