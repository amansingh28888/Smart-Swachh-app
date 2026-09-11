import Stepper from "./Stepper";

const STATUS_LABEL = { pending: "Pending", assigned: "Assigned", in_progress: "In progress", completed: "Completed" };

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function ReportCard({ report, workerName, rightSlot, showStepper = true }) {
  const r = report;
  return (
    <div className="report">
      <img src={r.photo_url} alt="waste report" />
      <div className="report-body">
        <div className="report-top">
          <h3>{r.ai_waste_type || "Waste report"}</h3>
          <span className={`pill ${r.status}`}>{STATUS_LABEL[r.status] || r.status}</span>
        </div>
        <p className="report-meta">
          {fmtDate(r.created_at)}
          {r.location_address ? ` · ${r.location_address}` : ""}
        </p>
        {r.description && <p className="desc">{r.description}</p>}
        {r.ai_suggested_bin && (
          <p className="desc" style={{ color: "var(--ink-soft)" }}>
            Suggested bin: {r.ai_suggested_bin}
          </p>
        )}
        {r.ai_tips && r.ai_tips.toLowerCase() !== "none" && (
          <p className="desc" style={{ color: "var(--red)" }}>⚠ {r.ai_tips}</p>
        )}
        {workerName !== undefined && (
          <p className="desc" style={{ color: "var(--ink-soft)" }}>Worker: {workerName || "—"}</p>
        )}
        {showStepper && <Stepper status={r.status} />}
        {r.status === "completed" && (
          <p className="desc" style={{ marginTop: 8 }}>+{r.points_awarded} points earned</p>
        )}
        {rightSlot}
      </div>
    </div>
  );
}
