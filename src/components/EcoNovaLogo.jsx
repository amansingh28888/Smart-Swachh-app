import React from "react";

/**
 * EcoNova Logo — pure SVG, always crisp at any size.
 *
 * Props:
 *   size      – controls overall height (default 44)
 *   showTag   – show "Sustainable Solutions" tagline (default true)
 *   dark      – use white text for dark backgrounds (default false)
 */
export default function EcoNovaLogo({ size = 44, showTag = true, dark = false }) {
  const scale = size / 44;
  const textColor = dark ? "#fff" : "#1B3C2A";
  const accentColor = "#2E7D4F";
  const leafColor1 = "#1B5E37";
  const leafColor2 = "#4CAF50";

  return (
    <svg
      width={showTag ? 210 * scale : 180 * scale}
      height={size}
      viewBox={showTag ? "0 0 210 44" : "0 0 180 44"}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      {/* ── Leaf Icon ── */}
      <g transform="translate(2, 2)">
        {/* Outer circle */}
        <circle cx="20" cy="20" r="19" stroke={leafColor1} strokeWidth="2.2" fill="none" opacity="0.2" />
        
        {/* Main leaf shape */}
        <path
          d="M20 6C20 6 32 12 32 24C32 30 27 34 20 34C13 34 8 30 8 24C8 12 20 6 20 6Z"
          fill={leafColor1}
          opacity="0.9"
        />
        
        {/* Lighter inner leaf */}
        <path
          d="M20 10C20 10 29 15 29 24C29 28.5 25.5 31.5 20 31.5C14.5 31.5 11 28.5 11 24C11 15 20 10 20 10Z"
          fill={leafColor2}
          opacity="0.6"
        />
        
        {/* Leaf vein - center */}
        <path
          d="M20 12V30"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />
        
        {/* Leaf veins - left */}
        <path
          d="M20 18L14 22"
          stroke="#fff"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.5"
        />
        <path
          d="M20 23L14.5 26"
          stroke="#fff"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.5"
        />
        
        {/* Leaf veins - right */}
        <path
          d="M20 18L26 22"
          stroke="#fff"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.5"
        />
        <path
          d="M20 23L25.5 26"
          stroke="#fff"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* Small sparkle/dot */}
        <circle cx="31" cy="9" r="2.2" fill={leafColor2} opacity="0.8" />
        <circle cx="31" cy="9" r="1" fill="#fff" opacity="0.9" />
      </g>

      {/* ── Text: EcoNova ── */}
      <text
        x="48"
        y={showTag ? "24" : "28"}
        fontFamily="'Plus Jakarta Sans', 'Inter', 'Segoe UI', sans-serif"
        fontWeight="800"
        fontSize="22"
        fill={textColor}
        letterSpacing="-0.5"
      >
        Eco
        <tspan fill={accentColor}>Nova</tspan>
      </text>

      {/* ── Tagline ── */}
      {showTag && (
        <text
          x="49"
          y="38"
          fontFamily="'Inter', 'Segoe UI', sans-serif"
          fontWeight="500"
          fontSize="8.5"
          fill={accentColor}
          letterSpacing="2.5"
          opacity="0.8"
        >
          SUSTAINABLE SOLUTIONS
        </text>
      )}
    </svg>
  );
}
