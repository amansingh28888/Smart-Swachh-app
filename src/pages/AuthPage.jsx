import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin } from '@react-oauth/google';

// ── SVG icons ──────────────────────────────────────────────
const IconRecycle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
    <path d="M21 3v5h-5"/>
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
    <path d="M8 16H3v5"/>
  </svg>
);

const IconCpu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2"/>
    <rect x="9" y="9" width="6" height="6"/>
    <path d="M15 2v2M9 2v2M15 20v2M9 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/>
  </svg>
);

const IconMapPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

// Removed IconGoogle as we're using the official GoogleLogin component

// ──────────────────────────────────────────────────────────

export default function AuthPage() {
  const { signIn, signUp, signInWithGoogleToken } = useAuth();
  const [tab, setTab] = useState("login");
  const [role, setRole] = useState("citizen");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  async function handleGoogleSuccess(credentialResponse) {
    setErr(""); setOk(""); setLoading(true);
    try {
      await signInWithGoogleToken(credentialResponse.credential, { role });
    } catch (error) {
      setErr(error.message);
      setLoading(false);
    }
  }

  function handleGoogleError() {
    setErr("Google Sign In was unsuccessful. Try again later.");
  }

  async function handleLogin(e) {
    e.preventDefault();
    setErr(""); setOk(""); setLoading(true);
    const email = e.target.email.value.trim();
    const password = e.target.password.value;
    try {
      await signIn({ email, password });
    } catch (error) {
      setErr(error.message);
    }
    setLoading(false);
  }

  async function handleSignup(e) {
    e.preventDefault();
    setErr(""); setOk(""); setLoading(true);
    const name = e.target.name.value.trim();
    const email = e.target.email.value.trim();
    const phone = e.target.phone.value.trim();
    const password = e.target.password.value;
    try {
      const result = await signUp({ email, password, name, phone, role });
      if (result.needsEmailConfirm) {
        setOk("Account created. Check your email to confirm, then log in.");
        setTab("login");
      }
    } catch (error) {
      setErr(error.message);
    }
    setLoading(false);
  }

  return (
    <div className="auth-wrap">

      {/* ── LEFT BRAND PANEL ── */}
      <div className="auth-brand-panel">

        <div className="auth-brand-logo">
          <img src="/logo.png" alt="EcoNova Logo" style={{ width: "240px", height: "auto", objectFit: "contain", marginBottom: "16px", transform: "scale(1.1)" }} />
        </div>

        <h2 className="auth-brand-heading">
          Cleaner cities.<br />
          <em>Smarter solutions.</em>
        </h2>

        <p className="auth-brand-desc">
          Report waste, track cleanups and earn rewards — all powered by AI and real-time data.
        </p>

        <ul className="auth-brand-features">
          <li>
            <span className="auth-feature-icon"><IconCpu /></span>
            AI-powered waste detection & classification
          </li>
          <li>
            <span className="auth-feature-icon"><IconMapPin /></span>
            Location-based smart reporting system
          </li>
          <li>
            <span className="auth-feature-icon"><IconUsers /></span>
            Coordinated worker management dashboard
          </li>
        </ul>

      </div>


      {/* ── RIGHT FORM PANEL ── */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">

          <h2>{tab === "login" ? "Welcome back" : "Create an account"}</h2>
          <p>{tab === "login" ? "Sign in to your EcoNova account." : "Join the smarter way to manage waste."}</p>

          {/* Tabs */}
          <div className="tabs">
            <button
              id="tab-login"
              className={`tab ${tab === "login" ? "active" : ""}`}
              onClick={() => { setTab("login"); setErr(""); setOk(""); }}
            >
              Log in
            </button>
            <button
              id="tab-signup"
              className={`tab ${tab === "signup" ? "active" : ""}`}
              onClick={() => { setTab("signup"); setErr(""); setOk(""); }}
            >
              Sign up
            </button>
          </div>

          {err && <div className="msg error">{err}</div>}
          {ok  && <div className="msg ok">{ok}</div>}

          {/* Google Sign In Button */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              theme="outline"
              size="large"
              width="100%"
              text={tab === "login" ? "signin_with" : "signup_with"}
            />
          </div>

          <div className="auth-divider">
            <span>or continue with email</span>
          </div>

          {tab === "login" ? (

            <form onSubmit={handleLogin}>
              <div className="field">
                <label>Email address</label>
                <input id="login-email" name="email" type="email" required placeholder="you@example.com" />
              </div>
              <div className="field">
                <label>Password</label>
                <input id="login-password" name="password" type="password" required placeholder="••••••••" />
              </div>
              <button id="login-submit" className="btn btn-block" disabled={loading}>
                {loading && <span className="spinner" />}
                Sign in
              </button>
              <p style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 14, textAlign: "center" }}>
                Admin access uses the same login — role is determined by your profile.
              </p>
            </form>

          ) : (

            <form onSubmit={handleSignup}>
              <div className="field">
                <label>I am a</label>
                <div className="role-choice">
                  <button
                    id="role-citizen"
                    type="button"
                    className={`role-opt ${role === "citizen" ? "selected" : ""}`}
                    onClick={() => setRole("citizen")}
                  >
                    Citizen
                  </button>
                  <button
                    id="role-worker"
                    type="button"
                    className={`role-opt ${role === "worker" ? "selected" : ""}`}
                    onClick={() => setRole("worker")}
                  >
                    Worker
                  </button>
                </div>
              </div>
              <div className="field">
                <label>Full name</label>
                <input id="signup-name" name="name" type="text" required placeholder="Your full name" />
              </div>
              <div className="field">
                <label>Email address</label>
                <input id="signup-email" name="email" type="email" required placeholder="you@example.com" />
              </div>
              <div className="field">
                <label>Phone number</label>
                <input id="signup-phone" name="phone" type="tel" required placeholder="Your phone number" />
              </div>
              <div className="field">
                <label>Password</label>
                <input id="signup-password" name="password" type="password" required minLength={6} placeholder="At least 6 characters" />
              </div>
              <button id="signup-submit" className="btn btn-block" disabled={loading}>
                {loading && <span className="spinner" />}
                Create account
              </button>
            </form>

          )}

        </div>
      </div>

    </div>
  );
}