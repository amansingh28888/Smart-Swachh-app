import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import ReportCard from "../components/ReportCard";
import CompleteModal from "../components/CompleteModal";

export default function WorkerDashboard() {
  const { profile } = useAuth();
  const [reports, setReports] = useState([]);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [ok, setOk] = useState("");

  async function load() {
    const { data } = await supabase.from("reports").select("*").eq("assigned_worker_id", profile.id).order("created_at", { ascending: false });
    setReports(data || []);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function markInProgress(id) {
    await supabase.from("reports").update({ status: "in_progress" }).eq("id", id);
    await load();
  }

  const active = reports.filter((r) => r.status !== "completed");
  const done = reports.filter((r) => r.status === "completed");

  return (
    <>
      <div className="section-head"><h2>Your tasks</h2></div>
      <div className="stat-row">
        <div className="stat"><div className="num">{active.length}</div><div className="label">Active</div></div>
        <div className="stat"><div className="num">{done.length}</div><div className="label">Completed</div></div>
      </div>

      {ok && <div className="msg ok">{ok}</div>}

      {active.length === 0 ? (
        <div className="empty">No tasks assigned right now.</div>
      ) : (
        active.map((r) => (
          <ReportCard
            key={r.id}
            report={r}
            rightSlot={
              <div className="report-actions">
                {r.status === "assigned" && (
                  <button className="btn-outline btn-sm" onClick={() => markInProgress(r.id)}>Start work</button>
                )}
                <button className="btn btn-sm" onClick={() => setCompleteTarget(r.id)}>Mark complete</button>
              </div>
            }
          />
        ))
      )}

      {done.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, marginTop: 26 }}>History</h2>
          {done.map((r) => <ReportCard key={r.id} report={r} />)}
        </>
      )}

      {completeTarget && (
        <CompleteModal
          profile={profile}
          reportId={completeTarget}
          onClose={() => setCompleteTarget(null)}
          onCompleted={async () => {
            setCompleteTarget(null);
            setOk("Task marked complete. Citizen has been awarded points.");
            await load();
          }}
        />
      )}
    </>
  );
}
