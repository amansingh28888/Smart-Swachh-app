import { AuthProvider, useAuth } from "./context/AuthContext";
import { isSupabaseConfigured } from "./supabaseClient";
import AuthPage from "./pages/AuthPage";
import CitizenDashboard from "./pages/CitizenDashboard";
import WorkerDashboard from "./pages/WorkerDashboard";
import AdminDashboard from "./pages/AdminDashboard";

const ROLE_LABEL = { citizen: "Citizen", worker: "Worker", admin: "Admin" };

function Shell() {
  const { profile, signOut } = useAuth();
  return (
    <div id="app-root">
      <div className="topbar">
        <div className="brand">
          <span className="leaf">🌿</span>Smart Swachh
          <span className="role-pill">{ROLE_LABEL[profile.role]}</span>
        </div>
        <div className="topbar-right">
          <span>{profile.name}</span>
          <button className="btn-ghost-light" onClick={signOut}>Log out</button>
        </div>
      </div>
      <main>
        {profile.role === "citizen" && <CitizenDashboard />}
        {profile.role === "worker" && <WorkerDashboard />}
        {profile.role === "admin" && <AdminDashboard />}
      </main>
    </div>
  );
}

function SetupNeeded() {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1 style={{ fontSize: 20, color: "var(--green-900)" }}>Almost ready</h1>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6 }}>
          Copy <code>.env.example</code> to <code>.env</code> at the project root and fill in your
          Supabase URL, Supabase anon key, and Gemini API key. Then restart <code>npm run dev</code>.
          See <code>README.md</code> for the full step-by-step setup.
        </p>
      </div>
    </div>
  );
}

function Router() {
  const { session, profile, loading } = useAuth();
  if (loading) return <div className="center-page">Loading…</div>;
  if (!session || !profile) return <AuthPage />;
  return <Shell />;
}

export default function App() {
  if (!isSupabaseConfigured) return <SetupNeeded />;
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
