'use client';

import { signIn } from "next-auth/react";
export default function LandingPage() {

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Helvetica Neue', sans-serif",
    }}>

      {/* ── Dark gradient overlay ── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        background: 'rgba(0, 0, 0, 0.55)',
      }} />

      {/* ── Grain texture f── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        opacity: 0.3,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '200px 200px',
        pointerEvents: 'none',
      }} />

      {/* ── Content ── */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '0 24px',
        maxWidth: 720,
      }}>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(2.8rem, 6vw, 4.2rem)',
          fontWeight: 300,
          color: '#fff',
          lineHeight: 1.12,
          letterSpacing: '-0.02em',
          marginBottom: 24,
        }}>
          Turn your syllabus into a<br />
          <span style={{ fontWeight: 600 }}>study strategy</span>
        </h1>

        {/* Description */}
        <p style={{
          fontSize: 17,
          color: 'rgba(255,255,255,0.72)',
          lineHeight: 1.6,
          maxWidth: 540,
          marginBottom: 40,
        }}>
          <span style={{ color: '#fca311', fontSize: 14, fontWeight: 500, letterSpacing: '0.02em' }}>By pj10-syllabus-to-cal-3pm</span><br />
          Upload your course syllabi and let our system extract deadlines, assignments,
          and exams automatically. Build a personalized calendar that keeps you on track.
        </p>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}>
          {/* Primary */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/has_navbar/upload" })}
            style={{
              padding: '14px 32px',
              borderRadius: 10,
              border: 'none',
              background: '#fff',
              color: '#111',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
              boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.3)';
              e.currentTarget.style.background = '#f0f0f0';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.2)';
              e.currentTarget.style.background = '#fff';
            }}
          >
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}