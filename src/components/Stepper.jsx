const STEPS = ["Reported", "Assigned", "Cleaning", "Done"];
const INDEX = { pending: 0, assigned: 1, in_progress: 2, completed: 3 };

export default function Stepper({ status }) {
  const idx = INDEX[status] ?? 0;
  return (
    <div className="stepper">
      {STEPS.map((label, i) => (
        <div className={`step ${i <= idx ? "done" : ""}`} key={label}>
          <div className="bar" />
          <div className="dot" />
          <div className="lbl">{label}</div>
        </div>
      ))}
    </div>
  );
}
