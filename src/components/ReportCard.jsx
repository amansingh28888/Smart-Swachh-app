import { useState, useEffect } from "react";
import Stepper from "./Stepper";

const STATUS_LABEL = {
  pending: "Pending",
  assigned: "Assigned",
  in_progress: "In Progress",
  pending_approval: "Pending Citizen Approval",
  approved: "Approved - Verification Required",
  reopened: "Reopened",
  completed: "Completed",
};

// Lightbox SVG Icons
const IconZoomIn = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>);
const IconZoomOut = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>);
const IconDownload = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>);
const IconExternal = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>);
const IconX = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const IconMaximize = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>);

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

  // Lightbox Modal state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState("after"); // "before" or "after"
  const [zoomScale, setZoomScale] = useState(1);

  function openLightbox(tabType = "after") {
    setActiveTab(tabType);
    setZoomScale(1);
    setIsClosing(false);
    setLightboxOpen(true);
  }

  function closeLightbox() {
    setIsClosing(true);
    setTimeout(() => {
      setLightboxOpen(false);
      setIsClosing(false);
      setZoomScale(1);
    }, 200);
  }

  // Keyboard shortcut listener
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && lightboxOpen) {
        closeLightbox();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen]);

  const currentImgUrl = activeTab === "after" && r.after_photo_url ? r.after_photo_url : r.photo_url;
  const currentTitle = activeTab === "after" && r.after_photo_url ? "Worker Work Completion Photo" : "Reported Waste Photo";

  return (
    <>
      <div className="report">

        {/* BEFORE / REPORTED WASTE PHOTO */}
        <div className="image-thumb-wrapper" onClick={() => openLightbox("before")} style={{ flexShrink: 0 }}>
          <img
            className="report-main-image clickable-image"
            src={r.photo_url}
            alt="Waste report"
          />
          <div className="image-thumb-badge">
            <IconMaximize /> Click to Expand
          </div>
        </div>

        <div className="report-body">

          {/* TOP */}
          <div className="report-top">
            <h3>{r.ai_waste_type || "Waste report"}</h3>
            <span className={`pill ${r.status}`}>
              {STATUS_LABEL[r.status] || r.status}
            </span>
          </div>

          {/* DATE + LOCATION */}
          <p className="report-meta">
            {fmtDate(r.created_at)}
            {r.location_address ? ` · ${r.location_address}` : ""}
          </p>

          {/* DESCRIPTION */}
          {r.description && <p className="desc">{r.description}</p>}

          {/* SUGGESTED BIN */}
          {r.ai_suggested_bin && (
            <p className="desc" style={{ color: "var(--ink-soft)" }}>
              Suggested bin: {r.ai_suggested_bin}
            </p>
          )}

          {/* HAZARD TIP */}
          {r.ai_tips && r.ai_tips.toLowerCase() !== "none" && (
            <p className="desc" style={{ color: "var(--red)" }}>
              Warning: {r.ai_tips}
            </p>
          )}

          {/* WORKER */}
          {workerName !== undefined && (
            <p className="desc" style={{ color: "var(--ink-soft)" }}>
              Worker: {workerName || "—"}
            </p>
          )}

          {/* AFTER CLEANING PHOTO (SUBMITTED BY WORKER) */}
          {r.after_photo_url && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <p style={{ fontSize: 12, fontWeight: 700, margin: 0, color: "var(--primary)" }}>
                  ✨ Work Completion Photo (Submitted by Worker)
                </p>
                <span style={{ fontSize: 11, color: "var(--ink-soft)", fontWeight: 500 }}>Click image to open</span>
              </div>

              <div className="image-thumb-wrapper" onClick={() => openLightbox("after")}>
                <img
                  className="completion-image clickable-image"
                  src={r.after_photo_url}
                  alt="Cleaned location submitted by worker"
                />
                <div className="image-thumb-badge">
                  <IconMaximize /> Open Full Photo
                </div>
              </div>
            </div>
          )}

          {/* SMARTVERIFY CODE */}
          {showVerificationCode && r.verification_code && r.status === "approved" && (
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
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>
                SMARTVERIFY CODE
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 5, marginBottom: 6 }}>
                {r.verification_code}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>
                Share this code with the worker after approving the cleaned location photo.
              </div>
            </div>
          )}

          {/* STEPPER */}
          {showStepper && <Stepper status={r.status} />}

          {/* COMPLETED */}
          {r.status === "completed" && (
            <p className="desc" style={{ marginTop: 8 }}>
              +{r.points_awarded} points earned
            </p>
          )}

          {/* ACTION BUTTON */}
          {rightSlot}

        </div>
      </div>


      {/* =====================================================
          SMOOTH & ATTRACTIVE LIGHTBOX IMAGE VIEWER MODAL
      ===================================================== */}
      {lightboxOpen && (
        <div
          className={`lightbox-overlay ${isClosing ? "closing" : ""}`}
          onClick={closeLightbox}
        >

          {/* HEADER TOOLBAR */}
          <div className="lightbox-header" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-title-box">
              <span className="role-pill" style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}>
                {activeTab === "after" ? "Cleaned Site Photo" : "Reported Waste"}
              </span>
              <span className="lightbox-title">{currentTitle}</span>
            </div>

            {/* BEFORE / AFTER TABS */}
            {r.after_photo_url && (
              <div className="lightbox-tabs">
                <button
                  className={`lightbox-tab-btn ${activeTab === "before" ? "active" : ""}`}
                  onClick={() => { setActiveTab("before"); setZoomScale(1); }}
                >
                  📷 Before (Reported)
                </button>
                <button
                  className={`lightbox-tab-btn ${activeTab === "after" ? "active" : ""}`}
                  onClick={() => { setActiveTab("after"); setZoomScale(1); }}
                >
                  ✨ After (Cleaned)
                </button>
              </div>
            )}

            {/* CONTROLS */}
            <div className="lightbox-actions">
              <button
                className="lightbox-action-btn"
                title="Zoom In"
                onClick={() => setZoomScale((z) => Math.min(z + 0.35, 2.5))}
              >
                <IconZoomIn />
              </button>

              <button
                className="lightbox-action-btn"
                title="Zoom Out"
                onClick={() => setZoomScale((z) => Math.max(z - 0.35, 0.7))}
              >
                <IconZoomOut />
              </button>

              <a
                className="lightbox-action-btn"
                href={currentImgUrl}
                target="_blank"
                rel="noreferrer"
                title="Open original in new tab"
                download="swachh-photo.jpg"
              >
                <IconExternal />
              </a>

              <button
                className="lightbox-action-btn lightbox-close-btn"
                title="Close (Esc)"
                onClick={closeLightbox}
              >
                <IconX />
              </button>
            </div>
          </div>

          {/* STAGE AREA */}
          <div className="lightbox-stage" onClick={closeLightbox}>
            <div className="lightbox-img-wrap" onClick={(e) => e.stopPropagation()}>
              <img
                key={currentImgUrl}
                className="lightbox-main-img"
                src={currentImgUrl}
                alt={currentTitle}
                style={{ transform: `scale(${zoomScale})` }}
              />
            </div>
          </div>

          {/* FOOTER HINT */}
          <div className="lightbox-footer" onClick={(e) => e.stopPropagation()}>
            <div>
              {r.ai_waste_type ? `Type: ${r.ai_waste_type}` : "Waste Inspection Photo"}
              {r.location_address ? ` · ${r.location_address}` : ""}
            </div>
            <div>Press <kbd style={{ background: "rgba(255,255,255,0.2)", padding: "2px 6px", borderRadius: 4, color: "#fff" }}>ESC</kbd> to close</div>
          </div>

        </div>
      )}

    </>
  );
}