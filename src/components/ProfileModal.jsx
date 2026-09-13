import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

export default function ProfileModal({ onClose, onUpdated }) {
  const { profile } = useAuth();
  
  const [name, setName] = useState(profile?.name || profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setError("");

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("waste-photos") // Reusing the same bucket for simplicity
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("waste-photos")
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      // First check if avatar_url column exists
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          name,
          phone,
          // If avatar_url column hasn't been added yet, this will error, but we'll try
          avatar_url: avatarUrl
        })
        .eq("id", profile.id);

      // If it fails due to column missing, retry without avatar_url
      if (updateError && updateError.message.includes("Could not find the 'avatar_url' column")) {
        const { error: retryError } = await supabase
          .from("profiles")
          .update({ name, phone })
          .eq("id", profile.id);
        
        if (retryError) throw retryError;
        else alert("Profile updated, but 'avatar_url' column is missing in database. Please run the SQL migration.");
      } else if (updateError) {
         throw updateError;
      }
      
      onUpdated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 450 }}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Edit Profile</h2>
        <p className="modal-desc">Update your personal information and contact details.</p>

        {error && <div className="modern-message error-message" style={{ marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <div 
              style={{
                width: 80, 
                height: 80, 
                borderRadius: "50%", 
                background: "var(--bg-card-highlight, #f3f4f6)", 
                margin: "0 auto 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                border: "2px solid var(--border)"
              }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 24, fontWeight: "bold", color: "var(--ink-muted)" }}>
                  {(name || "U")[0].toUpperCase()}
                </span>
              )}
            </div>
            
            <label className="btn-outline btn-sm" style={{ cursor: "pointer", display: "inline-block" }}>
              {uploading ? "Uploading..." : "Change Photo"}
              <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} style={{ display: "none" }} />
            </label>
          </div>

          <div className="form-group">
            <label>Full Name</label>
            <input 
              type="text" 
              className="modern-input" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Mobile Number (for OTP & Contact)</label>
            <input 
              type="tel" 
              className="modern-input" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              placeholder="+91 9876543210"
            />
            <small style={{ color: "var(--ink-soft)", marginTop: 4, display: "block", lineHeight: "1.4" }}>
              {profile.role === "citizen" ? "Shared with assigned workers to contact you for task verification." : "Citizens may contact you for task updates."}
            </small>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              className="modern-input" 
              value={profile.email} 
              disabled 
              style={{ background: "#f9fafb", cursor: "not-allowed", color: "var(--ink-muted)" }}
            />
            <small style={{ color: "var(--ink-soft)", marginTop: 4, display: "block" }}>
              Email address cannot be changed.
            </small>
          </div>

          <button type="submit" className="btn" disabled={saving || uploading} style={{ marginTop: 8 }}>
            {saving ? "Saving Changes..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
