import Stepper from "./Stepper";

const STATUS_LABEL = {
  pending: "Pending",
  assigned: "Assigned",
  in_progress: "In progress",
  completed: "Completed",
};

function fmtDate(d) {
  if (!d) return "";

  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReportCard({
  report,
  workerName,
  rightSlot,
  showStepper = true,
  showVerificationCode = false,
}) {
  const r = report;

  return (
    <div className="report">
      <img src={r.photo_url} alt="waste report" />

      <div className="report-body">

        {/* TOP */}

        <div className="report-top">
          <h3>
            {r.ai_waste_type || "Waste report"}
          </h3>

          <span className={`pill ${r.status}`}>
            {STATUS_LABEL[r.status] || r.status}
          </span>
        </div>

        {/* DATE + LOCATION */}

        <p className="report-meta">
          {fmtDate(r.created_at)}

          {r.location_address
            ? ` · ${r.location_address}`
            : ""}
        </p>

        {/* DESCRIPTION */}

        {r.description && (
          <p className="desc">
            {r.description}
          </p>
        )}

        {/* SUGGESTED BIN */}

        {r.ai_suggested_bin && (
          <p
            className="desc"
            style={{
              color: "var(--ink-soft)",
            }}
          >
            Suggested bin: {r.ai_suggested_bin}
          </p>
        )}

        {/* HAZARD TIP */}

        {r.ai_tips &&
          r.ai_tips.toLowerCase() !== "none" && (
            <p
              className="desc"
              style={{
                color: "var(--red)",
              }}
            >
              ⚠ {r.ai_tips}
            </p>
          )}

        {/* WORKER */}

        {workerName !== undefined && (
          <p
            className="desc"
            style={{
              color: "var(--ink-soft)",
            }}
          >
            Worker: {workerName || "—"}
          </p>
        )}

        {/* 🔐 SMARTVERIFY CODE - ONLY CITIZEN */}

        {showVerificationCode &&
          r.verification_code &&
          r.status !== "completed" && (

            <div
              style={{
                marginTop: 12,
                padding: "12px",
                borderRadius: 10,
                background: "#f0f7ff",
                border: "1px solid #b9d9ff",
                textAlign: "center",
              }}
            >

              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1,
                  marginBottom: 6,
                }}
              >
                🔐 SMARTVERIFY CODE
              </div>

              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  letterSpacing: 5,
                  marginBottom: 6,
                }}
              >
                {r.verification_code}
              </div>

              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--ink-soft)",
                }}
              >
                Share this code with the worker ONLY after
                your waste has been cleaned.
              </div>

            </div>

          )}

        {/* STEPPER */}

        {showStepper && (
          <Stepper status={r.status} />
        )}

        {/* COMPLETED */}

        {r.status === "completed" && (
          <p
            className="desc"
            style={{
              marginTop: 8,
            }}
          >
            +{r.points_awarded} points earned
          </p>
        )}

        {/* ACTION BUTTON */}

        {rightSlot}

      </div>
    </div>
  );
}