import { useState } from "react";
import { analyzeWasteImage } from "../lib/gemini";
import { getLocation } from "../lib/location";
import { supabase } from "../supabaseClient";
import { CONFIG } from "../lib/config";

export default function ReportModal({ profile, onClose, onSubmitted }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [location, setLocation] = useState(null);
  const [form, setForm] = useState({ waste_type: "", category: "", suggested_bin: "", hazard_tips: "", description: "" });

  function onPhoto(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setAnalyzed(false);
    setErr("");
  }

  async function runAnalysis() {
    if (!file) return;
    setAnalyzing(true); setErr("");
    try {
      const [ai, loc] = await Promise.all([analyzeWasteImage(file), getLocation()]);
      setForm({
        waste_type: ai.waste_type || "",
        category: ai.category || "",
        suggested_bin: ai.suggested_bin || "",
        hazard_tips: ai.hazard_tips || "",
        description: ai.description || "",
      });
      setLocation(loc);
      setAnalyzed(true);
    } catch (e) {
      setErr("AI analysis failed (" + e.message + "). You can still fill details manually and submit.");
      setAnalyzed(true);
    }
    setAnalyzing(false);
  }

  async function submit(e) {
    e.preventDefault();
    if (!file) { setErr("Please add a photo first."); return; }
    setSubmitting(true); setErr("");
    try {
      const path = `${profile.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("waste-photos").upload(path, file);
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("waste-photos").getPublicUrl(path);
      const row = {
        citizen_id: profile.id,
        photo_url: pub.publicUrl,
        description: form.description,
        ai_waste_type: form.waste_type,
        ai_category: form.category,
        ai_suggested_bin: form.suggested_bin,
        ai_tips: form.hazard_tips,
        location_lat: location?.lat ?? null,
        location_lng: location?.lng ?? null,
        location_address: location?.address ?? "",
        points_awarded: CONFIG.POINTS_PER_REPORT,
        status: "pending",
      };
      const { error: insErr } = await supabase.from("reports").insert(row);
      if (insErr) throw insErr;
      onSubmitted();
    } catch (error) {
      setErr(error.message);
    }
    setSubmitting(false);
  }

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <button className="close-x" onClick={onClose}>×</button>
        <h2>Report a problem</h2>
        <form onSubmit={submit}>
          <label className="photo-drop" htmlFor="rf-photo">
            {previewUrl ? (
              <img src={previewUrl} alt="preview" />
            ) : (
              <div>📷<br /><span style={{ fontSize: 13.5 }}>Tap to take or choose a photo</span></div>
            )}
          </label>
          <input id="rf-photo" type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={onPhoto} />

          {file && !analyzed && (
            <button type="button" className="btn btn-block" style={{ marginTop: 12 }} disabled={analyzing} onClick={runAnalysis}>
              {analyzing && <span className="spinner" />}
              {analyzing ? "Analyzing with AI" : "Analyze with AI"}
            </button>
          )}

          {err && <div className="msg error" style={{ marginTop: 12 }}>{err}</div>}

          {analyzed && (
            <>
              <div className="ai-box">
                <div className="ai-tag">AI SUGGESTED — you can edit before submitting</div>
                <div className="field">
                  <label>Waste type</label>
                  <input value={form.waste_type} onChange={(e) => setForm({ ...form, waste_type: e.target.value })} />
                </div>
                <div className="field">
                  <label>Category</label>
                  <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
                <div className="field">
                  <label>Suggested dustbin</label>
                  <input value={form.suggested_bin} onChange={(e) => setForm({ ...form, suggested_bin: e.target.value })} />
                </div>
                <div className="field">
                  <label>Handling tip</label>
                  <input value={form.hazard_tips} onChange={(e) => setForm({ ...form, hazard_tips: e.target.value })} />
                </div>
                <div className="field">
                  <label>Description</label>
                  <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                {location ? (
                  <p style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
                    📍 {location.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
                  </p>
                ) : (
                  <p style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>Location not available — you can still submit.</p>
                )}
              </div>
              <button className="btn btn-block" disabled={submitting}>
                {submitting && <span className="spinner" />}Submit report
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
