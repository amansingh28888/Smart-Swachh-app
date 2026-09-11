import { useState } from "react";
import LandingPage from "./components/LandingPage";
import "./components/LandingPage.css";
import Chatbot from "./components/Chatbot";

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

// ===============================
// DASHBOARD SHELL
// ===============================

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
        {profile.role === "citizen" && (
          <CitizenDashboard />
        )}

        {profile.role === "worker" && (
          <WorkerDashboard />
        )}

        {profile.role === "admin" && (
          <AdminDashboard />
        )}
      </main>
    </div>
  );
}

// ===============================
// SUPABASE SETUP ERROR
// ===============================

function SetupNeeded() {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Almost ready</h1>

        <p>
          Please configure Supabase and restart the application.
        </p>
      </div>
    </div>
  );
}

// ===============================
// APP ROUTER
// ===============================

function AppRouter() {
  const {
    session,
    profile,
    loading
  } = useAuth();

  const [showAuth, setShowAuth] =
    useState(false);

  if (loading) {
    return (
      <div className="center-page">
        Loading...
      </div>
    );
  }

  // Already logged in
  if (session && profile) {
    return <Shell />;
  }

  // Landing Page
  if (!showAuth) {
    return (
      <LandingPage
        onGetStarted={() =>
          setShowAuth(true)
        }
      />
    );
  }

  // Login / Signup
  return <AuthPage />;
}

// ===============================
// MAIN APP
// ===============================

export default function App() {
  if (!isSupabaseConfigured) {
    return <SetupNeeded />;
  }

  return (
    <AuthProvider>
      <AppRouter />

      {/* Global AI Chatbot */}
      <Chatbot />
    </AuthProvider>
  );
}