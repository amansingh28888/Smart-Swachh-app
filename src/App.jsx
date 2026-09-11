import { useState } from "react";
import LandingPage from "./components/LandingPage";
import "./components/LandingPage.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { isSupabaseConfigured } from "./supabaseClient";
import AuthPage from "./pages/AuthPage";
import CitizenDashboard from "./pages/CitizenDashboard";
import WorkerDashboard from "./pages/WorkerDashboard";
import AdminDashboard from "./pages/AdminDashboard";

const ROLE_LABEL = {
  citizen: "Citizen",
  worker: "Worker",
  admin: "Admin",
};

function Shell() {
  const { profile, signOut } = useAuth();

  return (
    <div id="app-root">
      <div className="topbar">
        <div className="brand">
          <span className="leaf">🌿</span>
          Smart Swachh
          <span className="role-pill">
            {ROLE_LABEL[profile.role]}
          </span>
        </div>

        <div className="topbar-right">
          <span>{profile.name}</span>
          <button
            className="btn-ghost-light"
            onClick={signOut}
          >
            Log out
          </button>
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
        <h1 style={{ fontSize: 20 }}>
          Almost ready
        </h1>

        <p>
          Please configure Supabase and restart the application.
        </p>
      </div>
    </div>
  );
}

function AppContent({ showAuth }) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <div className="center-page">Loading...</div>;
  }

  // User logged in
  if (session && profile) {
    return <Shell />;
  }

  // User not logged in
  if (showAuth) {
    return <AuthPage />;
  }

  return null;
}

export default function App() {
  const [showAuth, setShowAuth] = useState(false);

  // Landing Page FIRST
  if (!showAuth) {
    return (
      <LandingPage
        onGetStarted={() => setShowAuth(true)}
      />
    );
  }

  if (!isSupabaseConfigured) {
    return <SetupNeeded />;
  }

  return (
    <AuthProvider>
      <AppContent showAuth={showAuth} />
    </AuthProvider>
  );
}