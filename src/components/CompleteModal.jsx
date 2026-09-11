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
  const [verificationCode, setVerificationCode] = useState("");

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

    if (verificationCode.length !== 6) {
      setErr("Please enter the 6-digit SmartVerify code.");
      return;
    }

    setSubmitting(true);
    setErr("");

    try {
      // Step 1: Get report verification code
      const { data: report, error: reportErr } = await supabase
        .from("reports")
        .select("verification_code")
        .eq("id", reportId)
        .single();

      if (reportErr) throw reportErr;

      // Step 2: Verify code
      if (
        String(report.verification_code) !==
        String(verificationCode)
      ) {
        setErr(
          "❌ Incorrect SmartVerify code. Ask the citizen for the correct code."
        );
        setSubmitting(false);
        return;
      }

      // Step 3: Upload AFTER photo
      const path =
        `${profile.id}/${Date.now()}-after-${file.name}`;

      const { error: upErr } = await supabase.storage
        .from("waste-photos")
        .upload(path, file);

      if (upErr) throw upErr;

      const { data: pub } = supabase.storage
        .from("waste-photos")
        .getPublicUrl(path);

      // Step 4: Complete report
      const { error: rpcErr } = await supabase.rpc(
        "complete_report",
        {
          p_report_id: reportId,
          p_after_photo_url: pub.publicUrl,
        }
      );

      if (rpcErr) throw rpcErr;

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

        <h2>Complete Task</h2>

        <p
          style={{
            fontSize: 13.5,
            color: "var(--ink-soft)",
          }}
        >
          Upload proof of the cleaned location and enter the
          SmartVerify code provided by the citizen.
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

          {/* SMARTVERIFY CODE */}

          <div
            className="field"
            style={{
              marginTop: 16,
            }}
          >
            <label>
              🔐 SmartVerify Code
            </label>

            <input
              type="text"
              inputMode="numeric"
              maxLength="6"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) =>
                setVerificationCode(
                  e.target.value.replace(/\D/g, "")
                )
              }
              style={{
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: 4,
                textAlign: "center",
              }}
              required
            />

            <small
              style={{
                color: "var(--ink-soft)",
                display: "block",
                marginTop: 6,
              }}
            >
              Ask the citizen for this code after the waste has
              been cleaned.
            </small>

          </div>

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
              ? "Verifying..."
              : "Verify & Complete Task"}
          </button>

        </form>

      </div>
    </div>
  );
}