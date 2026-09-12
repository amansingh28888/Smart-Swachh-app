import { useState, useEffect, useRef } from "react";
import { analyzeWasteImage } from "../lib/gemini";
import { getLocation } from "../lib/location";
import { supabase } from "../supabaseClient";
import { CONFIG } from "../lib/config";

// SVG Icons
const IconSearch = () => (<svg className="location-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
const IconMapPin = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>);
const IconNavigation = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>);

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

  // Location Picker Mode: "auto" vs "manual"
  const [locationMode, setLocationMode] = useState("auto");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Map & Leaflet refs
  const mapRef = useRef(null);
  const leafletInstanceRef = useRef(null);
  const markerRef = useRef(null);

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

  function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async function runAnalysis() {
    if (!file) {
      setErr("Please select a photo first.");
      return;
    }

    setAnalyzing(true);
    setErr("");

    // Auto-detect GPS location
    try {
      const loc = await getLocation();
      setLocation(loc);
    } catch (locationError) {
      console.error("Location error:", locationError);
      // Default fallback location (e.g. New Delhi)
      setLocation({ lat: 28.6139, lng: 77.2090, address: "New Delhi, Delhi, India" });
    }

    // AI Waste Analysis
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
      setErr("AI analysis failed. You can still enter details and select location manually.");
      setAnalyzed(true);
    }

    setAnalyzing(false);
  }

  // Handle Search Location using OpenStreetMap Nominatim Geocoding API
  async function handleLocationSearch(query) {
    setSearchQuery(query);
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      setSearchResults(data || []);
    } catch (e) {
      console.error("Geocoding search error:", e);
    } finally {
      setIsSearching(false);
    }
  }

  function selectSearchResult(item) {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const address = item.display_name;

    const newLoc = { lat, lng, address };
    setLocation(newLoc);
    setSearchResults([]);
    setSearchQuery(address);

    // Pan map to selected location
    if (leafletInstanceRef.current) {
      leafletInstanceRef.current.setView([lat, lng], 16);
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      }
    }
  }

  // Reverse geocode when dragging pin on map
  async function reverseGeocode(lat, lng) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      const address = data.display_name || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
      setLocation({ lat, lng, address });
      setSearchQuery(address);
    } catch (e) {
      setLocation({ lat, lng, address: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}` });
    }
  }

  // Initialize interactive Leaflet map when in manual mode
  useEffect(() => {
    if (!analyzed || locationMode !== "manual") return;

    const defaultLat = location?.lat || 28.6139;
    const defaultLng = location?.lng || 77.2090;

    // Small delay to ensure DOM container is rendered
    const timer = setTimeout(() => {
      if (mapRef.current && window.L) {
        if (!leafletInstanceRef.current) {
          const map = window.L.map(mapRef.current).setView([defaultLat, defaultLng], 15);
          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
          }).addTo(map);

          // Draggable Marker
          const marker = window.L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);
          marker.bindPopup("Drag pin or click map to set waste location").openPopup();

          marker.on('dragend', function (e) {
            const position = marker.getLatLng();
            reverseGeocode(position.lat, position.lng);
          });

          map.on('click', function (e) {
            marker.setLatLng(e.latlng);
            reverseGeocode(e.latlng.lat, e.latlng.lng);
          });

          leafletInstanceRef.current = map;
          markerRef.current = marker;
        } else {
          leafletInstanceRef.current.invalidateSize();
          leafletInstanceRef.current.setView([defaultLat, defaultLng], 15);
          if (markerRef.current) {
            markerRef.current.setLatLng([defaultLat, defaultLng]);
          }
        }
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [analyzed, locationMode]);

  async function submit(e) {
    e.preventDefault();
    if (!file) {
      setErr("Please add a photo first.");
      return;
    }

    setSubmitting(true);
    setErr("");

    try {
      const verificationCode = generateVerificationCode();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${profile.id}/${Date.now()}-${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("waste-photos")
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("waste-photos")
        .getPublicUrl(path);

      const photoUrl = publicUrlData?.publicUrl;
      if (!photoUrl) throw new Error("Could not generate photo URL.");

      const row = {
        citizen_id: profile.id,
        photo_url: photoUrl,
        description: form.description,
        ai_waste_type: form.waste_type,
        ai_category: form.category,
        ai_suggested_bin: form.suggested_bin,
        ai_tips: form.hazard_tips,
        location_lat: location?.lat ?? null,
        location_lng: location?.lng ?? null,
        location_address: location?.address ?? "",
        verification_code: verificationCode,
        points_awarded: CONFIG.POINTS_PER_REPORT,
        status: "pending",
      };

      const { error: insertError } = await supabase.from("reports").insert(row);
      if (insertError) throw insertError;

      onSubmitted();
    } catch (error) {
      console.error("Submit error:", error);
      setErr(error.message || "Something went wrong while submitting the report.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" style={{ maxWidth: 640 }}>

        <button className="close-x" onClick={onClose} type="button">×</button>
        <h2>Report a Waste Problem</h2>

        <form onSubmit={submit}>

          {/* PHOTO */}
          <label className="photo-drop" htmlFor="rf-photo">
            {previewUrl ? (
              <img src={previewUrl} alt="Waste preview" />
            ) : (
              <div>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 6px", display: "block", color: "var(--ink-muted)" }}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                <span style={{ fontSize: 13.5 }}>Tap to take or choose a waste photo</span>
              </div>
            )}
          </label>

          <input
            id="rf-photo"
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={onPhoto}
          />

          {/* ANALYZE BUTTON */}
          {file && !analyzed && (
            <button
              type="button"
              className="btn btn-block"
              style={{ marginTop: 12 }}
              disabled={analyzing}
              onClick={runAnalysis}
            >
              {analyzing && <span className="spinner" />}
              {analyzing ? "Analyzing photo & detecting location..." : "Analyze with AI & Get Location"}
            </button>
          )}

          {/* ERROR ALERT */}
          {err && (
            <div className="msg error" style={{ marginTop: 12 }}>
              {err}
            </div>
          )}

          {/* FORM DETAILS & LOCATION PICKER */}
          {analyzed && (
            <>
              <div className="ai-box" style={{ marginTop: 16 }}>
                <div className="ai-tag">AI SUGGESTED DETAILS — EDITABLE</div>

                <div className="field">
                  <label>Waste Type</label>
                  <input
                    value={form.waste_type}
                    onChange={(e) => setForm({ ...form, waste_type: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label>Category</label>
                  <input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label>Suggested Dustbin</label>
                  <input
                    value={form.suggested_bin}
                    onChange={(e) => setForm({ ...form, suggested_bin: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label>Handling / Hazard Tip</label>
                  <input
                    value={form.hazard_tips}
                    onChange={(e) => setForm({ ...form, hazard_tips: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label>Description</label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>

              {/* =====================================================
                  INTERACTIVE LOCATION PICKER (AUTO GPS vs MANUAL MAP SEARCH)
              ===================================================== */}
              <div className="location-picker-box">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
                    <IconMapPin /> Report Location
                  </label>

                  {/* MODE TABS */}
                  <div className="location-mode-tabs">
                    <button
                      type="button"
                      className={`location-mode-btn ${locationMode === "auto" ? "active" : ""}`}
                      onClick={() => setLocationMode("auto")}
                    >
                      <IconNavigation /> Auto GPS
                    </button>

                    <button
                      type="button"
                      className={`location-mode-btn ${locationMode === "manual" ? "active" : ""}`}
                      onClick={() => setLocationMode("manual")}
                    >
                      🗺️ Search & Pick Map
                    </button>
                  </div>
                </div>

                {/* MANUAL SEARCH & INTERACTIVE MAP */}
                {locationMode === "manual" ? (
                  <>
                    {/* SEARCH INPUT */}
                    <div className="location-search-wrap">
                      <IconSearch />
                      <input
                        type="text"
                        className="location-search-input"
                        placeholder="Search city, area, landmark, or street name..."
                        value={searchQuery}
                        onChange={(e) => handleLocationSearch(e.target.value)}
                      />
                      {isSearching && (
                        <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "var(--ink-soft)" }}>
                          Searching...
                        </div>
                      )}

                      {/* DROPDOWN RESULTS */}
                      {searchResults.length > 0 && (
                        <div className="location-search-results">
                          {searchResults.map((item, i) => (
                            <div key={i} className="search-result-item" onClick={() => selectSearchResult(item)}>
                              <IconMapPin />
                              <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                {item.display_name}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* LEAFLET INTERACTIVE MAP CANVAS */}
                    <div className="map-picker-canvas" ref={mapRef} id="modal-map-picker" />
                    <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 4, textAlign: "center" }}>
                      👆 Drag pin or click/scroll map using mouse or finger touch to set exact location
                    </div>
                  </>
                ) : (
                  /* AUTO GPS DISPLAY */
                  <div className="location-details-box">
                    <IconMapPin />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: "var(--ink)" }}>
                        {location?.address || (location?.lat ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "Detecting GPS location...")}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                        Automatically captured via device GPS sensors
                      </div>
                    </div>
                  </div>
                )}

                {/* EDITABLE ADDRESS INPUT */}
                <div style={{ marginTop: 10 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-soft)", display: "block", marginBottom: 4 }}>
                    Address / Landmark Notes
                  </label>
                  <input
                    type="text"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 12.5 }}
                    placeholder="Add specific landmark notes (e.g. Near Gate 3, Opp. Supermarket)..."
                    value={location?.address || ""}
                    onChange={(e) => setLocation({ ...location, address: e.target.value })}
                  />
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                className="btn btn-block"
                style={{ marginTop: 16 }}
                disabled={submitting}
              >
                {submitting && <span className="spinner" />}
                {submitting ? "Submitting Waste Report..." : "Submit Waste Report"}
              </button>
            </>
          )}

        </form>

      </div>
    </div>
  );
}