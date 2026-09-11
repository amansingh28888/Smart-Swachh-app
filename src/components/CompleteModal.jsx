import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function CompleteModal({ profile, reportId, onClose, onCompleted }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function onPhoto(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  async function submit(e) {
    e.preventDefault();
    if (!file) { setErr("Add a photo of the cleaned spot."); return; }
    setSubmitting(true); setErr("");
    try {
      const path = `${profile.id}/${Date.now()}-after-${file.name}`;
      const { error: upErr } = await supabase.storage.from("waste-photos").upload(path, file);
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("waste-photos").getPublicUrl(path);
      const { error: rpcErr } = await supabase.rpc("complete_report", {
        p_report_id: reportId,
        p_after_photo_url: pub.publicUrl,
      });
      if (rpcErr) throw rpcErr;
      onCompleted();
    } catch (error) {
      setErr(error.message);
    }
    setSubmitting(false);
  }

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <button className="close-x" onClick={onClose}>×</button>
        <h2>Mark task complete</h2>
        <p style={{ fontSize: 13.5, color: "var(--ink-soft)" }}>
          Upload a photo of the cleaned spot as proof of work.
        </p>
        <form onSubmit={submit}>
          <label className="photo-drop" htmlFor="cf-photo">
            {previewUrl ? (
              <img src={previewUrl} alt="preview" />
            ) : (
              <div>📷<br /><span style={{ fontSize: 13.5 }}>Tap to take or choose a photo</span></div>
            )}
          </label>
          <input id="cf-photo" type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={onPhoto} />
          {err && <div className="msg error" style={{ marginTop: 12 }}>{err}</div>}
          <button className="btn btn-block" style={{ marginTop: 14 }} disabled={submitting}>
            {submitting && <span className="spinner" />}Submit & mark complete
          </button>
        </form>
      </div>
    </div>
  );
}
