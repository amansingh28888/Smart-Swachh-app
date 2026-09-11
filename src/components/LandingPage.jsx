import React from "react";

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="landing-page">

      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          ♻️ <span>SmartSwachh</span>
        </div>

        <button className="nav-login" onClick={onGetStarted}>
          Login / Sign Up
        </button>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="badge">
            🤖 AI-Powered Waste Management
          </div>

          <h1>
            Smart Waste.<br />
            <span>Cleaner Cities.</span><br />
            Greener Future.
          </h1>

          <p>
            SmartSwachh uses Artificial Intelligence to identify,
            report and manage waste efficiently.
          </p>

          <div className="hero-buttons">
            <button className="primary-btn" onClick={onGetStarted}>
              🚀 Get Started
            </button>

            <a href="#features" className="secondary-btn">
              Learn More ↓
            </a>
          </div>
        </div>

        <div className="hero-visual">
          <div className="earth">🌍</div>
          <div className="floating-card card1">♻️ AI Detection</div>
          <div className="floating-card card2">📍 Smart Reporting</div>
          <div className="floating-card card3">👷 Fast Action</div>
        </div>
      </section>


      {/* Features */}
      <section className="features" id="features">

        <div className="section-title">
          <p>OUR FEATURES</p>
          <h2>Smarter Technology for Cleaner Cities</h2>
        </div>

        <div className="feature-grid">

          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI Waste Detection</h3>
            <p>
              Upload waste images and let AI identify the waste category.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📍</div>
            <h3>Smart Reporting</h3>
            <p>
              Citizens can report waste with images and location details.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👷</div>
            <h3>Worker Management</h3>
            <p>
              Workers receive tasks and update the cleaning status.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Admin Dashboard</h3>
            <p>
              Monitor reports, workers and waste management activities.
            </p>
          </div>

        </div>
      </section>


      {/* How it works */}
      <section className="how-it-works">

        <div className="section-title">
          <p>HOW IT WORKS</p>
          <h2>Simple. Smart. Effective.</h2>
        </div>

        <div className="steps">

          <div className="step">
            <div className="step-number">1</div>
            <div className="step-icon">📸</div>
            <h3>Report Waste</h3>
            <p>Upload a photo and provide location details.</p>
          </div>

          <div className="step">
            <div className="step-number">2</div>
            <div className="step-icon">🤖</div>
            <h3>AI Analysis</h3>
            <p>AI identifies the type and severity of waste.</p>
          </div>

          <div className="step">
            <div className="step-number">3</div>
            <div className="step-icon">👷</div>
            <h3>Worker Action</h3>
            <p>The task is assigned to the responsible worker.</p>
          </div>

          <div className="step">
            <div className="step-number">4</div>
            <div className="step-icon">🌱</div>
            <h3>Cleaner City</h3>
            <p>The waste is cleaned and the report is completed.</p>
          </div>

        </div>

      </section>


      {/* CTA */}
      <section className="cta">

        <h2>Let's Build Cleaner Cities Together 🌍</h2>

        <p>
          Join SmartSwachh and be part of a smarter,
          cleaner and greener future.
        </p>

        <button className="primary-btn" onClick={onGetStarted}>
          🚀 Get Started Now
        </button>

      </section>


      {/* Footer */}
      <footer>
        <div className="logo">♻️ SmartSwachh</div>

        <p>
          Smart Waste. Cleaner Cities. Greener Future.
        </p>

        <p className="copyright">
          © 2026 SmartSwachh. All Rights Reserved.
        </p>
      </footer>

    </div>
  );
}