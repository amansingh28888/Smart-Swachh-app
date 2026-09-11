import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState("login");
  const [role, setRole] = useState("citizen");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

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
    const password = e.target.password.value;
    try {
      const result = await signUp({ email, password, name, role });
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
      <div className="auth-hero">
        <div style={{ fontSize: 34 }}>🌿</div>
        <h1>Smart Swachh</h1>
        <p>Report waste. Get it cleaned. Earn points.</p>
      </div>
      <div className="auth-card">
        <div className="tabs">
          <button className={`tab ${tab === "login" ? "active" : ""}`} onClick={() => { setTab("login"); setErr(""); setOk(""); }}>
            Log in
          </button>
          <button className={`tab ${tab === "signup" ? "active" : ""}`} onClick={() => { setTab("signup"); setErr(""); setOk(""); }}>
            Sign up
          </button>
        </div>
        {err && <div className="msg error">{err}</div>}
        {ok && <div className="msg ok">{ok}</div>}

        {tab === "login" ? (
          <form onSubmit={handleLogin}>
            <div className="field">
              <label>Email</label>
              <input name="email" type="email" required placeholder="you@example.com" />
            </div>
            <div className="field">
              <label>Password</label>
              <input name="password" type="password" required placeholder="••••••••" />
            </div>
            <button className="btn btn-block" disabled={loading}>
              {loading && <span className="spinner" />}Log in
            </button>
            <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 12 }}>
              Admin logs in here too — role is read from your profile.
            </p>
          </form>
        ) : (
          <form onSubmit={handleSignup}>
            <div className="field">
              <label>I am a</label>
              <div className="role-choice">
                <button type="button" className={`role-opt ${role === "citizen" ? "selected" : ""}`} onClick={() => setRole("citizen")}>
                  Citizen
                </button>
                <button type="button" className={`role-opt ${role === "worker" ? "selected" : ""}`} onClick={() => setRole("worker")}>
                  Worker
                </button>
              </div>
            </div>
            <div className="field">
              <label>Full name</label>
              <input name="name" type="text" required placeholder="Your name" />
            </div>
            <div className="field">
              <label>Email</label>
              <input name="email" type="email" required placeholder="you@example.com" />
            </div>
            <div className="field">
              <label>Password</label>
              <input name="password" type="password" required minLength={6} placeholder="At least 6 characters" />
            </div>
            <button className="btn btn-block" disabled={loading}>
              {loading && <span className="spinner" />}Create account
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
