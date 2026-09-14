import React, { useEffect, useState } from "react";
import WasteGame from "./WasteGame";
import { supabase } from "../supabaseClient";
import "./LandingPage.css";
import EcoNovaLogo from "./EcoNovaLogo";

// ════════════════════════════════════════════════════════
// SVG ICONS
// ════════════════════════════════════════════════════════

const IconRecycle = ({ s = 20 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
    <path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
    <path d="M8 16H3v5"/>
  </svg>
);
const IconCpu = ({ s = 20 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
    <path d="M15 2v2M9 2v2M15 20v2M9 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/>
  </svg>
);
const IconMapPin = ({ s = 20 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconHardHat = ({ s = 20 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"/>
    <path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/>
    <path d="M4 15v-3a8 8 0 0 1 16 0v3"/>
  </svg>
);
const IconBarChart = ({ s = 20 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="16"/>
  </svg>
);
const IconCamera = ({ s = 20 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
    <circle cx="12" cy="13" r="3"/>
  </svg>
);

const IconCheckCircle = ({ s = 20 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const IconArrowRight = ({ s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);
const IconChevronRight = ({ s = 14 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);
const IconUsers = ({ s = 20 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconShield = ({ s = 20 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconGamepad = ({ s = 20 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/>
    <line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/>
    <rect x="2" y="6" width="20" height="12" rx="2"/>
  </svg>
);
const IconBell = ({ s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);


// ════════════════════════════════════════════════════════
// LANDING PAGE
// ════════════════════════════════════════════════════════

export default function LandingPage({ onGetStarted }) {
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });
  const [recentReports, setRecentReports] = useState([]);

  async function fetchLiveData() {
    try {
      const { data } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });
      const r = data || [];
      setStats({
        total: r.length,
        active: r.filter(x => x.status === "assigned" || x.status === "in_progress").length,
        completed: r.filter(x => x.status === "completed").length,
      });
      setRecentReports(r.slice(0, 4));
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchLiveData();
    const sub = supabase
      .channel("landing-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, fetchLiveData)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const statusLabel = s => ({ pending:"Pending", assigned:"Active", in_progress:"Active", completed:"Resolved" }[s] || "New");
  const statusBadge = s => s === "completed" ? "resolved" : (s === "assigned" || s === "in_progress") ? "active" : "pending";
  const fmtDate    = d => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Recently";

  const maxV = Math.max(stats.total, stats.active, stats.completed, 1);

  return (
    <div className="landing-page">

      {/* ════════════ NAVBAR ════════════ */}
      <nav className="landing-navbar">
        <div className="landing-container navbar-inner">

          <div className="landing-logo">
            <EcoNovaLogo size={38} showTag={false} />
          </div>

          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it Works</a>
            <a href="#insights">Live Insights</a>
            <a href="#game">SmartSort</a>
          </div>

          <div className="nav-cta-group">
            <button className="nav-login-btn" onClick={onGetStarted} id="nav-login-btn">
              Login
            </button>
            <button className="nav-signup-btn" onClick={onGetStarted} id="nav-signup-btn">
              Sign Up <IconChevronRight s={13} />
            </button>
          </div>

        </div>
      </nav>


      {/* ════════════ HERO ════════════ */}
      <section className="landing-hero">
        <div className="landing-container hero-grid">

          {/* LEFT */}
          <div className="hero-content-col">

            <div className="hero-eyebrow">
              <span></span>
              AI-POWERED WASTE MANAGEMENT
            </div>

            <h1 className="hero-headline">
              Smart Waste.<br/>
              <span className="green-text">Cleaner Cities.</span><br/>
              Greener Future.
            </h1>

            <p className="hero-description">
              EcoNova connects citizens, Artificial Intelligence and sanitation workers to make waste reporting, monitoring and cleanup smarter.
            </p>

            <div className="hero-actions">
              <button className="hero-get-started" onClick={onGetStarted} id="hero-get-started-btn">
                Get Started <IconArrowRight s={16} />
              </button>
              <a href="#features" className="hero-explore-btn">
                Explore Platform <IconChevronRight s={14} />
              </a>
            </div>

            <div className="hero-trust-row">
              <div className="trust-badge">
                <div className="trust-badge-icon"><IconCpu s={16} /></div>
                <div>
                  <div className="trust-badge-title">AI Powered</div>
                  <div className="trust-badge-sub">Detection</div>
                </div>
              </div>
              <div className="trust-badge">
                <div className="trust-badge-icon"><IconBarChart s={16} /></div>
                <div>
                  <div className="trust-badge-title">Real-Time</div>
                  <div className="trust-badge-sub">Monitoring</div>
                </div>
              </div>
              <div className="trust-badge">
                <div className="trust-badge-icon"><IconMapPin s={16} /></div>
                <div>
                  <div className="trust-badge-title">Citizen</div>
                  <div className="trust-badge-sub">Reporting</div>
                </div>
              </div>
              <div className="trust-badge">
                <div className="trust-badge-icon"><IconShield s={16} /></div>
                <div>
                  <div className="trust-badge-title">Cleaner</div>
                  <div className="trust-badge-sub">Cities</div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT — Illustration */}
          <div className="hero-illustration-col">

            <div className="hero-illustration-img">
              <img src="/hero-illustration.jpg" alt="EcoNova — Smart city waste management illustration" />
            </div>

            {/* Floating card */}
            <div className="hero-float-card">
              <div className="hero-float-card-icon"><IconCheckCircle s={20} /></div>
              <div className="hero-float-card-text">
                <strong>Waste Reported</strong>
                <span>High priority · 2 hours ago</span>
              </div>
            </div>

            {/* Floating stat badge */}
            <div className="hero-float-badge">
              <span className="badge-num">{stats.completed || "78"}%</span>
              <span className="badge-label">Resolve Rate</span>
            </div>

          </div>

        </div>
      </section>


      {/* ════════════ STATS BAR ════════════ */}
      <div className="landing-stats">
        <div className="landing-container">
          <div className="stats-row">

            <div className="stat-item">
              <div className="stat-item-icon"><IconUsers s={20} /></div>
              <div>
                <div className="stat-item-value">10K+</div>
                <div className="stat-item-label">Active Citizens</div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-item-icon"><IconRecycle s={20} /></div>
              <div>
                <div className="stat-item-value">{stats.total || "1.2K"}+</div>
                <div className="stat-item-label">Reports Handled</div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-item-icon"><IconMapPin s={20} /></div>
              <div>
                <div className="stat-item-value">500+</div>
                <div className="stat-item-label">Cleaned Locations</div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-item-icon"><IconShield s={20} /></div>
              <div>
                <div className="stat-item-value">98%</div>
                <div className="stat-item-label">Success Rate</div>
              </div>
            </div>

          </div>
        </div>
      </div>


      {/* ════════════ FEATURES ════════════ */}
      <section className="landing-features" id="features">
        <div className="landing-container">

          <div className="features-header">
            <div className="section-label">OUR FEATURES</div>
            <h2 className="section-title">
              Smarter technology.<br />
              <em>Cleaner cities.</em>
            </h2>
            <p className="section-desc">
              One connected platform for citizens, AI-powered analysis, workers and administrators.
            </p>
          </div>

          <div className="features-grid">

            <div className="feature-card">
              <div className="feature-card-number">01</div>
              <div className="feature-icon"><IconCpu s={22} /></div>
              <h3>AI Waste Detection</h3>
              <p>Upload a waste image and let AI analyze its category and severity for targeted action.</p>
            </div>

            <div className="feature-card">
              <div className="feature-card-number">02</div>
              <div className="feature-icon"><IconMapPin s={22} /></div>
              <h3>Smart Reporting</h3>
              <p>Citizens can report waste with photos, descriptions and precise location details.</p>
            </div>

            <div className="feature-card">
              <div className="feature-card-number">03</div>
              <div className="feature-icon"><IconHardHat s={22} /></div>
              <h3>Worker Management</h3>
              <p>Workers receive assigned tasks and update cleanup progress in real time.</p>
            </div>

            <div className="feature-card">
              <div className="feature-card-number">04</div>
              <div className="feature-icon"><IconBarChart s={22} /></div>
              <h3>Admin Dashboard</h3>
              <p>Monitor reports, workers, task progress and overall waste management activity.</p>
            </div>

          </div>

        </div>
      </section>


      {/* ════════════ HOW IT WORKS ════════════ */}
      <section className="landing-process" id="how-it-works">
        <div className="landing-container">

          <div className="process-header">
            <div className="section-label">HOW IT WORKS</div>
            <h2 className="section-title">From report to resolution.</h2>
          </div>

          <div className="process-steps">

            <div className="process-step">
              <div className="process-step-num">01</div>
              <div className="process-step-icon"><IconCamera s={24} /></div>
              <h3>Report</h3>
              <p>Citizens upload a waste photo with location and description.</p>
            </div>

            <div className="process-arrow"><IconChevronRight s={22} /></div>

            <div className="process-step">
              <div className="process-step-num">02</div>
              <div className="process-step-icon"><IconCpu s={24} /></div>
              <h3>AI Analysis</h3>
              <p>AI identifies waste category and severity for better action.</p>
            </div>

            <div className="process-arrow"><IconChevronRight s={22} /></div>

            <div className="process-step">
              <div className="process-step-num">03</div>
              <div className="process-step-icon"><IconHardHat s={24} /></div>
              <h3>Worker Action</h3>
              <p>The task is assigned and workers update cleanup progress.</p>
            </div>

            <div className="process-arrow"><IconChevronRight s={22} /></div>

            <div className="process-step">
              <div className="process-step-num">04</div>
              <div className="process-step-icon"><IconCheckCircle s={24} /></div>
              <h3>Verified</h3>
              <p>Cleanup is completed and the report is successfully resolved.</p>
            </div>

          </div>

        </div>
      </section>


      {/* ════════════ LIVE DASHBOARD PREVIEW ════════════ */}
      <section className="landing-dashboard-preview" id="insights">
        <div className="landing-container preview-layout">

          <div className="preview-content">
            <div className="section-label">
              <span style={{width:6,height:6,borderRadius:'50%',background:'#4CAF7D',display:'inline-block',animation:'pulse 2s infinite'}}></span>
              LIVE PLATFORM DATA
            </div>
            <h2 className="section-title">
              See your city<br/>
              <em>getting cleaner.</em>
            </h2>
            <p className="section-desc">
              Every report, worker action and completed cleanup updates the EcoNova system in real time — giving you full visibility into city-wide sanitation.
            </p>
            <button className="preview-cta-btn" onClick={onGetStarted} id="preview-explore-btn">
              Explore Dashboard <IconArrowRight s={16} />
            </button>
          </div>

          {/* Dashboard mockup */}
          <div className="dashboard-mockup">

            <div className="mock-topbar">
              <div className="mock-topbar-left">
                Dashboard
                <span>Here's what's happening in your city today</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="mock-live"><span></span> Live Data</div>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: '#EBF7F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1B5E37' }}>
                  <IconBell s={13} />
                </div>
              </div>
            </div>

            <div className="mock-body">

              {/* Stats */}
              <div className="mock-stats-row">
                <div className="mock-stat">
                  <div className="mock-stat-label">Total Reports</div>
                  <div className="mock-stat-value">{stats.total}</div>
                </div>
                <div className="mock-stat active-mock">
                  <div className="mock-stat-label">Active Tasks</div>
                  <div className="mock-stat-value">{stats.active}</div>
                </div>
                <div className="mock-stat">
                  <div className="mock-stat-label">Resolved</div>
                  <div className="mock-stat-value">{stats.completed}</div>
                </div>
              </div>

              {/* Chart */}
              <div className="mock-section-label">CITY ACTIVITY</div>
              <div className="mini-chart">
                <div className="mini-bar b-total"    style={{ height: `${Math.max((stats.total / maxV) * 100, 10)}%` }}></div>
                <div className="mini-bar b-active"   style={{ height: `${Math.max((stats.active / maxV) * 100, 10)}%` }}></div>
                <div className="mini-bar b-resolved" style={{ height: `${Math.max((stats.completed / maxV) * 100, 10)}%` }}></div>
                <div className="mini-bar b-total"    style={{ height: `${Math.max((stats.total / maxV) * 80, 10)}%`, opacity:.4 }}></div>
                <div className="mini-bar b-active"   style={{ height: `${Math.max((stats.active / maxV) * 90, 10)}%`, opacity:.4 }}></div>
                <div className="mini-bar b-resolved" style={{ height: `${Math.max((stats.completed / maxV) * 95, 10)}%`, opacity:.4 }}></div>
              </div>

              {/* Activity */}
              <div className="mock-section-label">RECENT ACTIVITY</div>
              <div className="mock-activity-list">
                {recentReports.length === 0 ? (
                  <div style={{ color: '#8BA898', fontSize: 11, padding: '8px 0', textAlign: 'center' }}>
                    Waiting for live city data...
                  </div>
                ) : recentReports.map(r => (
                  <div className="mock-activity-item" key={r.id}>
                    <div className="mock-activity-dot">
                      {r.status === 'completed' ? <IconCheckCircle s={13} /> : <IconRecycle s={13} />}
                    </div>
                    <div className="mock-activity-info">
                      <strong>{r.waste_type || r.category || "Waste Report"}</strong>
                      <span>{fmtDate(r.created_at)}</span>
                    </div>
                    <div className={`mock-badge ${statusBadge(r.status)}`}>
                      {statusLabel(r.status)}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </section>


      {/* ════════════ GAME ════════════ */}
      <section className="landing-game" id="game">
        <div className="landing-container">

          <div className="game-header">
            <div className="game-header-left">
              <div className="section-label">LEARN WHILE PLAYING</div>
              <h2 className="section-title">
                Can you sort waste<br/>
                <em>correctly?</em>
              </h2>
            </div>
            <div className="game-header-right">
              <IconGamepad s={15} style={{ verticalAlign: 'middle', marginRight: 6, color: '#1B5E37' }} />
              Test your waste segregation knowledge and become an Eco Champion.
            </div>
          </div>

          <WasteGame />

        </div>
      </section>


      {/* ════════════ CTA ════════════ */}
      <section className="landing-cta">
        <div className="landing-container">
          <div className="cta-inner">

            <div className="cta-badge">START TODAY</div>

            <h2>
              Let's build<br/>
              <em>cleaner cities.</em>
            </h2>

            <p>
              Join EcoNova and become part of a smarter, cleaner and greener future for your city.
            </p>

            <button className="cta-btn" onClick={onGetStarted} id="cta-get-started-btn">
              Get Started Free <IconArrowRight s={16} />
            </button>

          </div>
        </div>
      </section>


      {/* ════════════ FOOTER ════════════ */}
      <footer className="landing-footer">
        <div className="landing-container footer-inner">

          <div className="footer-brand">
            <EcoNovaLogo size={42} showTag={true} />
          </div>

          <div className="footer-right">
            <div className="footer-platform">AI-Powered Waste Management Platform</div>
            <div className="footer-copy">© 2026 EcoNova. All Rights Reserved.</div>
          </div>

        </div>
      </footer>

    </div>
  );
}