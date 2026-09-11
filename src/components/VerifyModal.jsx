import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function VerifyModal({
  reportId,
  onClose,
  onVerified,
}) {
  const [verificationCode, setVerificationCode] =
    useState("");

  const [err, setErr] = useState("");
  const [submitting, setSubmitting] =
    useState(false);

  async function submit(e) {
    e.preventDefault();

    if (verificationCode.length !== 6) {
      setErr(
        "Please enter the 6-digit SmartVerify code."
      );
      return;
    }

    setSubmitting(true);
    setErr("");

    try {
      // Get verification code from report
      const { data: report, error: reportErr } =
        await supabase
          .from("reports")
          .select("verification_code")
          .eq("id", reportId)
          .single();

      if (reportErr) throw reportErr;

      // Verify SmartVerify code
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

      // Complete report
      const { error: rpcErr } = await supabase.rpc(
        "complete_report",
        {
          p_report_id: reportId,
          p_after_photo_url: null,
        }
      );

      if (rpcErr) throw rpcErr;

      onVerified();

    } catch (error) {

      setErr(error.message);

    }

    setSubmitting(false);
  }

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal">

        <button
          className="close-x"
          onClick={onClose}
        >
          ×
        </button>

        <h2>Verify SmartVerify Code</h2>

        <p
          style={{
            fontSize: 13.5,
            color: "var(--ink-soft)",
          }}
        >
          The citizen has approved the completed work.
          Ask the citizen for their 6-digit SmartVerify
          code to complete this task.
        </p>

        <form onSubmit={submit}>

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

          </div>

          <small
            style={{
              color: "var(--ink-soft)",
              display: "block",
              marginTop: 6,
            }}
          >
            The SmartVerify code is visible to the citizen
            after they approve the completion photo.
          </small>

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