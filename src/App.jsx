import { useState } from "react";

import LandingPage from "./components/LandingPage";
import "./components/LandingPage.css";
import Chatbot from "./components/Chatbot";

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext";

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

  const [showLanding, setShowLanding] =
    useState(false);


  // ===============================
  // SHOW LANDING PAGE
  // ===============================

  if (showLanding) {
    return (
      <LandingPage
        onGetStarted={() =>
          setShowLanding(false)
        }
      />
    );
  }


  return (
    <div id="app-root">

      {/* ===============================
          TOPBAR
      =============================== */}

      <div className="topbar">

        {/* CLICKABLE BRAND */}

        <div
          className="brand"
          onClick={() =>
            setShowLanding(true)
          }
          style={{
            cursor: "pointer",
          }}
          title="Go to Smart Swachh Home"
        >

          <span className="leaf">
            🌿
          </span>

          Smart Swachh

          <span className="role-pill">
            {ROLE_LABEL[profile.role]}
          </span>

        </div>


        {/* USER + LOGOUT */}

        <div className="topbar-right">

          <span>
            {profile.name}
          </span>

          <button
            className="btn-ghost-light"
            onClick={signOut}
          >
            Log out
          </button>

        </div>

      </div>


      {/* ===============================
          DASHBOARD
      =============================== */}

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

        <h1>
          Almost ready
        </h1>

        <p>
          Please configure Supabase and restart
          the application.
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
    loading,
  } = useAuth();


  const [showAuth, setShowAuth] =
    useState(false);


  // ===============================
  // LOADING
  // ===============================

  if (loading) {

    return (

      <div className="center-page">
        Loading...
      </div>

    );

  }


  // ===============================
  // ALREADY LOGGED IN
  // ===============================

  if (session && profile) {

    return (
      <Shell />
    );

  }


  // ===============================
  // LANDING PAGE
  // ===============================

  if (!showAuth) {

    return (

      <LandingPage
        onGetStarted={() =>
          setShowAuth(true)
        }
      />

    );

  }


  // ===============================
  // LOGIN / SIGNUP
  // ===============================

  return (
    <AuthPage />
  );

}


// ===============================
// MAIN APP
// ===============================

export default function App() {

  if (!isSupabaseConfigured) {

    return (
      <SetupNeeded />
    );

  }


  return (

    <AuthProvider>

      <AppRouter />

      {/* GLOBAL AI CHATBOT */}

      <Chatbot />

    </AuthProvider>

  );

}