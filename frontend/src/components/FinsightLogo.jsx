import React from 'react';

/**
 * Finsight logo — Concept 02 "Rising Bar"
 * Emerald → Indigo rising bar chart with bold wordmark.
 *
 * Props:
 *   size   — 'sm' | 'md' (default) | 'lg'
 *   mono   — true for single-colour (white) version (e.g. dark backgrounds)
 *   light  — true when placed on a light background (wordmark goes dark)
 */
export default function FinsightLogo({ size = 'md', light = false }) {
  const scales = { sm: 0.72, md: 1, lg: 1.4 };
  const s = scales[size] ?? 1;

  const W = Math.round(200 * s);
  const H = Math.round(48 * s);

  return (
    <svg
      width={W}
      height={H}
      viewBox="0 0 200 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Finsight"
      role="img"
    >
      <defs>
        <linearGradient id="fs-bar-grad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%"   stopColor="#10b981" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="fs-trend" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#10b981" stopOpacity="0" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.7" />
        </linearGradient>
      </defs>

      {/* ── Rising bars ── */}
      <rect x="2"  y="34" width="7" height="10" rx="2" fill="url(#fs-bar-grad)" opacity="0.40" />
      <rect x="12" y="26" width="7" height="18" rx="2" fill="url(#fs-bar-grad)" opacity="0.58" />
      <rect x="22" y="16" width="7" height="28" rx="2" fill="url(#fs-bar-grad)" opacity="0.78" />
      <rect x="32" y="6"  width="7" height="38" rx="2" fill="url(#fs-bar-grad)" />

      {/* ── Trend line ── */}
      <polyline
        points="5,39 15,31 25,21 36,11"
        stroke="url(#fs-trend)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="3 3"
      />

      {/* ── Wordmark ── */}
      <text
        x="50"
        y="34"
        fontFamily="'Segoe UI', system-ui, -apple-system, sans-serif"
        fontSize="26"
        fontWeight="800"
        letterSpacing="-0.8"
        fill={light ? '#1a1a2e' : '#ffffff'}
      >
        FIN
      </text>
      <text
        x="101"
        y="34"
        fontFamily="'Segoe UI', system-ui, -apple-system, sans-serif"
        fontSize="26"
        fontWeight="300"
        letterSpacing="-0.8"
        fill="#6366f1"
      >
        SIGHT
      </text>
    </svg>
  );
}
