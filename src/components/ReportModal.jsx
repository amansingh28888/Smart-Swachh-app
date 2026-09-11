import { useState } from "react";
import { analyzeWasteImage } from "../lib/gemini";
import { getLocation } from "../lib/location";
import { supabase } from "../supabaseClient";
import { CONFIG } from "../lib/config";

export default function ReportModal({
  profile,
  onClose,
  onSubmitted,
}) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [location, setLocation] = useState(null);

  const [form, setForm] = useState({
    waste_type: "",
    category: "",
    suggested_bin: "",
    hazard_tips: "",
    description: "",
  });

  function onPhoto(e) {
    const f = e.target.files?.[0];

    if (!f) return;

    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));

    setAnalyzed(false);
    setErr("");
    setLocation(null);

    setForm({
      waste_type: "",
      category: "",
      suggested_bin: "",
      hazard_tips: "",
      description: "",
    });
  }

  // Generate 6 digit SmartVerify Code
  function generateVerificationCode() {
    return Math.floor(
      100000 + Math.random() * 900000
    ).toString();
  }

  async function runAnalysis() {
    if (!file) {
      setErr("Please select a photo first.");
      return;
    }

    setAnalyzing(true);
    setErr("");

    // Get location separately
    try {
      const loc = await getLocation();
      setLocation(loc);
    } catch (locationError) {
      console.error("Location error:", locationError);
    }

    // AI Analysis separately
    try {
      const ai = await analyzeWasteImage(file);

      setForm({
        waste_type: ai.waste_type || "",
        category: ai.category || "",
        suggested_bin: ai.suggested_bin || "",
        hazard_tips: ai.hazard_tips || "",
        description: ai.description || "",
      });

      setAnalyzed(true);

    } catch (error) {
      console.error("AI Error:", error);

      setErr(
        "AI analysis failed. You can still enter the details manually."
      );

      setAnalyzed(true);
    }

    setAnalyzing(false);
  }

  async function submit(e) {
    e.preventDefault();

    if (!file) {
      setErr("Please add a photo first.");
      return;
    }

    setSubmitting(true);
    setErr("");

    try {
      // Generate SmartVerify Code
      const verificationCode =
        generateVerificationCode();

      // Create unique file path
      const safeFileName = file.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

      const path =
        `${profile.id}/${Date.now()}-${safeFileName}`;

      // Upload photo
      const { error: uploadError } =
        await supabase.storage
          .from("waste-photos")
          .upload(path, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public photo URL
      const { data: publicUrlData } =
        supabase.storage
          .from("waste-photos")
          .getPublicUrl(path);

      const photoUrl =
        publicUrlData?.publicUrl;

      if (!photoUrl) {
        throw new Error(
          "Could not generate photo URL."
        );
      }

      // Insert report into database
      const row = {
        citizen_id: profile.id,

        photo_url: photoUrl,

        description: form.description,

        ai_waste_type: form.waste_type,

        ai_category: form.category,

        ai_suggested_bin:
          form.suggested_bin,

        ai_tips: form.hazard_tips,

        location_lat:
          location?.lat ?? null,

        location_lng:
          location?.lng ?? null,

        location_address:
          location?.address ?? "",

        // 🔐 SMARTVERIFY CODE
        verification_code:
          verificationCode,

        points_awarded:
          CONFIG.POINTS_PER_REPORT,

        status: "pending",
      };

      const { error: insertError } =
        await supabase
          .from("reports")
          .insert(row);

      if (insertError) {
        throw insertError;
      }

      // Success
      onSubmitted();

    } catch (error) {
      console.error("Submit error:", error);

      setErr(
        error.message ||
        "Something went wrong while submitting the report."
      );

    } finally {
      setSubmitting(false);
    }
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
          type="button"
        >
          ×
        </button>

        <h2>Report a Problem</h2>

        <form onSubmit={submit}>

          {/* PHOTO */}

          <label
            className="photo-drop"
            htmlFor="rf-photo"
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Waste preview"
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
                  Tap to take or choose a photo
                </span>

              </div>
            )}
          </label>

          <input
            id="rf-photo"
            type="file"
            accept="image/*"
            capture="environment"
            style={{
              display: "none",
            }}
            onChange={onPhoto}
          />

          {/* ANALYZE BUTTON */}

          {file && !analyzed && (

            <button
              type="button"
              className="btn btn-block"
              style={{
                marginTop: 12,
              }}
              disabled={analyzing}
              onClick={runAnalysis}
            >

              {analyzing && (
                <span className="spinner" />
              )}

              {analyzing
                ? "Analyzing with AI..."
                : "Analyze with AI"
              }

            </button>

          )}

          {/* ERROR */}

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

          {/* ANALYSIS RESULT */}

          {analyzed && (

            <>

              <div className="ai-box">

                <div className="ai-tag">
                  AI SUGGESTED — YOU CAN EDIT
                </div>


                {/* WASTE TYPE */}

                <div className="field">

                  <label>
                    Waste Type
                  </label>

                  <input
                    value={form.waste_type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        waste_type:
                          e.target.value,
                      })
                    }
                  />

                </div>


                {/* CATEGORY */}

                <div className="field">

                  <label>
                    Category
                  </label>

                  <input
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category:
                          e.target.value,
                      })
                    }
                  />

                </div>


                {/* DUSTBIN */}

                <div className="field">

                  <label>
                    Suggested Dustbin
                  </label>

                  <input
                    value={
                      form.suggested_bin
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        suggested_bin:
                          e.target.value,
                      })
                    }
                  />

                </div>


                {/* HANDLING TIP */}

                <div className="field">

                  <label>
                    Handling Tip
                  </label>

                  <input
                    value={
                      form.hazard_tips
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        hazard_tips:
                          e.target.value,
                      })
                    }
                  />

                </div>


                {/* DESCRIPTION */}

                <div className="field">

                  <label>
                    Description
                  </label>

                  <textarea
                    rows={2}
                    value={
                      form.description
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description:
                          e.target.value,
                      })
                    }
                  />

                </div>


                {/* LOCATION */}

                {location ? (

                  <p
                    style={{
                      fontSize: 12.5,
                      color:
                        "var(--ink-soft)",
                    }}
                  >

                    📍{" "}

                    {location.address ||

                      `${location.lat?.toFixed(4)},
                       ${location.lng?.toFixed(4)}`

                    }

                  </p>

                ) : (

                  <p
                    style={{
                      fontSize: 12.5,
                      color:
                        "var(--ink-soft)",
                    }}
                  >

                    📍 Location not available.
                    You can still submit.

                  </p>

                )}

              </div>


              {/* SUBMIT */}

              <button
                type="submit"
                className="btn btn-block"
                disabled={submitting}
              >

                {submitting && (
                  <span className="spinner" />
                )}

                {submitting
                  ? "Submitting..."
                  : "Submit Report"
                }

              </button>

            </>

          )}

        </form>

      </div>
    </div>
  );
}