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

  return (
    <>
      {/* HEADER */}

      <div className="section-head">
        <h2>Your Tasks</h2>
      </div>


      {/* STATISTICS */}

      <div className="stat-row">

        <div className="stat">
          <div className="num">
            {active.length}
          </div>

          <div className="label">
            Active
          </div>
        </div>


        <div className="stat">
          <div className="num">
            {done.length}
          </div>

          <div className="label">
            Completed
          </div>
        </div>

      </div>


      {/* SUCCESS MESSAGE */}

      {ok && (
        <div className="msg ok">
          {ok}
        </div>
      )}


      {/* ACTIVE TASKS */}

      {active.length === 0 ? (

        <div className="empty">
          No tasks assigned right now.
        </div>

      ) : (

        active.map((r) => (

          <ReportCard
            key={r.id}
            report={r}

            rightSlot={

              <div className="report-actions">


                {/* 📍 VIEW LOCATION */}

                <button
                  className="btn-outline btn-sm"
                  onClick={() => viewLocation(r)}
                >
                  📍 View Location
                </button>


                {/* 🧭 NAVIGATE */}

                <button
                  className="btn-outline btn-sm"
                  onClick={() =>
                    startNavigation(r)
                  }
                >
                  🧭 Navigate
                </button>


                {/* ASSIGNED */}

                {r.status === "assigned" && (

                  <button
                    className="btn-outline btn-sm"
                    onClick={() =>
                      markInProgress(r.id)
                    }
                  >
                    Start Work
                  </button>

                )}


                {/* IN PROGRESS / REOPENED */}

                {(r.status === "in_progress" ||
                  r.status === "reopened") && (

                  <button
                    className="btn btn-sm"
                    onClick={() =>
                      setCompleteTarget(r.id)
                    }
                  >
                    📸 Send for Approval
                  </button>

                )}


                {/* PENDING APPROVAL */}

                {r.status === "pending_approval" && (

                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ink-soft)",
                      padding: "6px 0",
                    }}
                  >
                    ⏳ Waiting for citizen approval
                  </div>

                )}


                {/* APPROVED */}

                {r.status === "approved" && (

                  <button
                    className="btn btn-sm"
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

        ))

      )}


      {/* HISTORY */}

      {done.length > 0 && (

        <>

          <h2
            style={{
              fontSize: 16,
              marginTop: 26,
            }}
          >
            History
          </h2>


          {done.map((r) => (

            <ReportCard
              key={r.id}
              report={r}
            />

          ))}

        </>

      )}


      {/* COMPLETE MODAL */}

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


      {/* VERIFY MODAL */}

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

    </>
  );
}