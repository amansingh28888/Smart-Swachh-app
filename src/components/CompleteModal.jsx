import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function CompleteModal({
  profile,
  reportId,
  onClose,
  onCompleted,
}) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function onPhoto(e) {
    const f = e.target.files[0];

    if (!f) return;

    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setErr("");
  }

  async function submit(e) {
    e.preventDefault();

    if (!file) {
      setErr("Please add a photo of the cleaned spot.");
      return;
    }

    setSubmitting(true);
    setErr("");

    try {
      // Step 1: Upload AFTER photo
      const path =
        `${profile.id}/${Date.now()}-after-${file.name}`;

      const { error: upErr } = await supabase.storage
        .from("waste-photos")
        .upload(path, file);

      if (upErr) throw upErr;

      // Step 2: Get public URL
      const { data: pub } = supabase.storage
        .from("waste-photos")
        .getPublicUrl(path);

      // Step 3: Send work for citizen approval
      const { error: updateErr } = await supabase
        .from("reports")
        .update({
          after_photo_url: pub.publicUrl,
          status: "pending_approval",
        })
        .eq("id", reportId);

      if (updateErr) throw updateErr;

      // Refresh dashboard
      onCompleted();

    } catch (error) {
      setErr(error.message);
    }

    setSubmitting(false);
  }

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">

        <button
          className="close-x"
          onClick={onClose}
        >
          ×
        </button>

        <h2>Send for Citizen Approval</h2>

        <p
          style={{
            fontSize: 13.5,
            color: "var(--ink-soft)",
          }}
        >
          Upload a photo of the cleaned location.
          The citizen will review the work before
          final verification.
        </p>

        <form onSubmit={submit}>

          {/* AFTER PHOTO */}

          <label
            className="photo-drop"
            htmlFor="cf-photo"
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Cleaned location preview"
              />
            ) : (
              <div>
                📷
                <br />

                <span
                  style={{
                    fontSize: 13.5,
                  }}
                >
                  Upload cleaned location photo
                </span>
              </div>
            )}
          </label>

          <input
            id="cf-photo"
            type="file"
            accept="image/*"
            capture="environment"
            style={{
              display: "none",
            }}
            onChange={onPhoto}
          />

          {err && (
            <div
              className="msg error"
              style={{
                marginTop: 12,
              }}
            >
              {err}
            </div>
          )}

          <button
            className="btn btn-block"
            style={{
              marginTop: 14,
            }}
            disabled={submitting}
          >
            {submitting && (
              <span className="spinner" />
            )}

            {submitting
              ? "Sending..."
              : "Send for Citizen Approval"}
          </button>

        </form>

      </div>
    </div>
  );
}