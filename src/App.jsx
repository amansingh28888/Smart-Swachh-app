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
import NotificationDropdown from "./components/NotificationDropdown";

// ─── Sidebar SVG icons ─────────────────────────────────

const IconRecycle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
    <path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
    <path d="M8 16H3v5"/>
  </svg>
);

const IconGrid = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const IconClipboard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1"/>
  </svg>
);

const IconMapPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const IconBarChart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10"/>
    <line x1="18" y1="20" x2="18" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="16"/>
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

const IconSettings = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const IconLogOut = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const IconBell = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const IconMenu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const IconClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Role Config ───────────────────────────────────────

const ROLE_LABEL = { citizen: "Citizen", worker: "Worker", admin: "Admin" };

const NAV_CONFIG = {
  citizen: [
    { icon: <IconGrid />,      label: "Dashboard" },
    { icon: <IconClipboard />, label: "My Reports" },
    { icon: <IconMapPin />,    label: "Live Map" },
    { icon: <IconBarChart />,  label: "Analytics" },
  ],
  worker: [
    { icon: <IconGrid />,      label: "Dashboard" },
    { icon: <IconClipboard />, label: "Work Queue" },
    { icon: <IconMapPin />,    label: "Locations" },
  ],
  admin: [
    { icon: <IconGrid />,      label: "Dashboard" },
    { icon: <IconClipboard />, label: "Reports" },
    { icon: <IconUsers />,     label: "Workers" },
    { icon: <IconMapPin />,    label: "Live Map" },
    { icon: <IconBarChart />,  label: "Analytics" },
    { icon: <IconSettings />,  label: "Settings" },
  ],
};

// ─── DASHBOARD SHELL (with sidebar) ───────────────────

function Shell() {
  const { profile, signOut } = useAuth();
  const [showLanding, setShowLanding] = useState(false);
  const [activeNav, setActiveNav] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (showLanding) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  const navItems = NAV_CONFIG[profile.role] || [];
  const initials = (profile.full_name || profile.name || "U")
    .split(" ")
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric"
  });

  return (
    <div id="app-root">

      {/* ═══ MOBILE BACKDROP ═══ */}
      <div
        className={`sidebar-backdrop ${mobileSidebarOpen ? "active" : ""}`}
        onClick={() => setMobileSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* ═══ SIDEBAR ═══ */}
      <aside className={`app-sidebar ${mobileSidebarOpen ? "mobile-open" : ""}`}>

        {/* Logo */}
        <div className="sidebar-logo">
          <div
            className="sidebar-logo-brand"
            onClick={() => {
              setShowLanding(true);
              setMobileSidebarOpen(false);
            }}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", flex: 1 }}
            title="Back to Home"
          >
            <div className="sidebar-logo-icon"><IconRecycle /></div>
            <div>
              <div className="sidebar-logo-name">SmartSwachh</div>
              <div className="sidebar-logo-sub">Waste Management</div>
            </div>
          </div>
          <button
            className="mobile-sidebar-close"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close menu"
            title="Close menu"
          >
            <IconClose />
          </button>
        </div>

        {/* User */}
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{profile.full_name || profile.name}</div>
            <div className="sidebar-user-role">{ROLE_LABEL[profile.role]}</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">Menu</div>
          {navItems.map((item, i) => (
            <button
              key={i}
              className={`sidebar-nav-item ${activeNav === i ? "active" : ""}`}
              onClick={() => {
                setActiveNav(i);
                setMobileSidebarOpen(false);
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout at bottom */}
        <div className="sidebar-bottom">
          <button className="sidebar-nav-item" onClick={signOut}>
            <IconLogOut />
            Log out
          </button>
        </div>

      </aside>


      {/* ═══ MAIN AREA ═══ */}
      <div className="app-main">

        {/* Top bar */}
        <div className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open menu"
              title="Open menu"
            >
              <IconMenu />
            </button>
            <div className="topbar-heading">
              <div className="topbar-title">
                {navItems[activeNav]?.label ? `${ROLE_LABEL[profile.role]} · ${navItems[activeNav].label}` : `${ROLE_LABEL[profile.role]} Dashboard`}
              </div>
              <div className="topbar-subtitle">
                Here's what's happening in your city today
              </div>
            </div>
          </div>

          <div className="topbar-right">
            <div className="topbar-date">{today}</div>
            <button
              className="topbar-bell"
              title="Notifications"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <IconBell />
              {unreadCount > 0 && <span className="topbar-bell-badge">{unreadCount}</span>}
            </button>

            {showNotifications && (
              <NotificationDropdown
                profile={profile}
                onClose={() => setShowNotifications(false)}
                onNavigate={(idx) => {
                  setActiveNav(idx);
                  setMobileSidebarOpen(false);
                }}
                onUnreadChange={(count) => setUnreadCount(count)}
              />
            )}

            <span className="role-pill">{ROLE_LABEL[profile.role]}</span>
          </div>
        </div>

        {/* Dashboard content */}
        <main>
          {profile.role === "citizen" && <CitizenDashboard activeNav={activeNav} setActiveNav={setActiveNav} />}
          {profile.role === "worker"  && <WorkerDashboard activeNav={activeNav} setActiveNav={setActiveNav} />}
          {profile.role === "admin"   && <AdminDashboard activeNav={activeNav} setActiveNav={setActiveNav} />}
        </main>

        {/* ═══ MOBILE BOTTOM NAVIGATION ═══ */}
        <nav className="mobile-bottom-nav" aria-label="Mobile Bottom Navigation">
          {navItems.map((item, i) => (
            <button
              key={i}
              className={`mobile-bottom-item ${activeNav === i ? "active" : ""}`}
              onClick={() => {
                setActiveNav(i);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              title={item.label}
            >
              <div className="mobile-bottom-icon">{item.icon}</div>
              <span className="mobile-bottom-label">{item.label}</span>
            </button>
          ))}
        </nav>

      </div>

    </div>
  );
}


// ─── SUPABASE SETUP ERROR ──────────────────────────────

function SetupNeeded() {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Almost ready</h1>
        <p>Please configure Supabase and restart the application.</p>
      </div>
    </div>
  );
}


// ─── APP ROUTER ────────────────────────────────────────

function AppRouter() {
  const { session, profile, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (loading) {
    return (
      <div className="center-page">
        <div style={{ width: 20, height: 20, border: "2.5px solid #E2EDE8", borderTopColor: "#1B5E37", borderRadius: "50%", animation: "spin .7s linear infinite" }}></div>
        Loading SmartSwachh...
      </div>
    );
  }

  if (session && profile) return <Shell />;

  if (!showAuth) {
    return <LandingPage onGetStarted={() => setShowAuth(true)} />;
  }

  return <AuthPage />;
}


import { GoogleOAuthProvider } from '@react-oauth/google';

// ─── MAIN APP ──────────────────────────────────────────

export default function App() {
  if (!isSupabaseConfigured) return <SetupNeeded />;

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <AppRouter />
        <Chatbot />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}