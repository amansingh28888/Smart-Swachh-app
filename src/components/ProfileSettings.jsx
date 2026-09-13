import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";

// SVG Icons for the UI
const IconCamera = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>);
const IconUser = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const IconMail = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>);
const IconPhone = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>);

export default function ProfileSettings() {
  const { profile, reloadProfile } = useAuth();
  
  const [name, setName] = useState(profile?.name || profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("waste-photos") // Reusing bucket
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("waste-photos")
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
    } catch (err) {
      setError("Failed to upload photo: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          name,
          phone,
          avatar_url: avatarUrl
        })
        .eq("id", profile.id);

      if (updateError && updateError.message.includes("Could not find the 'avatar_url' column")) {
        const { error: retryError } = await supabase
          .from("profiles")
          .update({ name, phone })
          .eq("id", profile.id);
        
        if (retryError) throw retryError;
        else setError("Profile updated, but 'avatar_url' column is missing in database. Please run the SQL migration.");
      } else if (updateError) {
         throw updateError;
      }
      
      setSuccess("Profile settings saved successfully!");
      if (reloadProfile) await reloadProfile();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const roleLabels = {
    citizen: "Citizen Account",
    worker: "Worker Account",
    admin: "Admin Account"
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", paddingBottom: 40 }}>
      <div className="view-header">
        <div>
          <h2 className="view-title">Profile & Settings</h2>
          <p className="view-desc">Manage your personal information and account preferences</p>
        </div>
      </div>

      {error && <div className="modern-message error-message" style={{ marginBottom: 20 }}>{error}</div>}
      {success && <div className="modern-message success-message" style={{ marginBottom: 20 }}>{success}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
        
        {/* Top Banner / Avatar Card */}
        <div className="chart-card" style={{ padding: 0, overflow: "hidden", position: "relative" }}>
          {/* Banner Background */}
          <div style={{ height: 120, background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)" }}></div>
          
          <div style={{ padding: "0 24px 24px 24px", position: "relative", display: "flex", alignItems: "flex-end", gap: 20, marginTop: -40 }}>
            {/* Avatar */}
            <div style={{ position: "relative" }}>
              <div style={{ 
                width: 100, 
                height: 100, 
                borderRadius: "50%", 
                background: "var(--card)", 
                border: "4px solid var(--card)",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
              }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 36, fontWeight: 700, color: "var(--primary)" }}>
                    {(name || "U")[0].toUpperCase()}
                  </span>
                )}
              </div>
              
              <label 
                style={{ 
                  position: "absolute", 
                  bottom: 0, 
                  right: 0, 
                  background: "var(--primary)", 
                  color: "#fff",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  border: "2px solid var(--card)"
                }}
                title="Change Photo"
              >
                {uploading ? (
                  <div style={{ width: 14, height: 14, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                ) : (
                  <IconCamera />
                )}
                <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} style={{ display: "none" }} />
              </label>
            </div>

            <div style={{ paddingBottom: 8 }}>
              <h3 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "var(--ink)" }}>{name || "User"}</h3>
              <div style={{ fontSize: 14, color: "var(--ink-soft)", fontWeight: 500 }}>{roleLabels[profile.role]}</div>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="chart-card">
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: "var(--ink)" }}>Personal Information</h3>
          
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: 6 }}><IconUser /> Full Name</label>
                <input 
                  type="text" 
                  className="modern-input" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: 6 }}><IconMail /> Email Address</label>
                <input 
                  type="email" 
                  className="modern-input" 
                  value={profile.email} 
                  disabled 
                  style={{ background: "var(--bg-card-highlight)", cursor: "not-allowed", color: "var(--ink-muted)" }}
                />
              </div>
            </div>

            <div className="form-group" style={{ maxWidth: 400 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}><IconPhone /> Mobile Number</label>
              <input 
                type="tel" 
                className="modern-input" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                placeholder="+91 9876543210"
              />
              <small style={{ color: "var(--ink-soft)", marginTop: 6, display: "block", lineHeight: "1.4" }}>
                {profile.role === "citizen" 
                  ? "Your mobile number will be securely shared with assigned workers so they can contact you to receive the OTP/Verify Code." 
                  : "Citizens may contact you for updates on assigned cleanup tasks."}
              </small>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20, marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="btn" disabled={saving || uploading} style={{ minWidth: 140 }}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
