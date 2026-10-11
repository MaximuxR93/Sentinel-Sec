import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  ArrowRight,
  Sparkles,
  GitBranch,
  Terminal,
  Activity,
  CheckCircle2,
  Lock,
  ChevronRight,
  Zap,
  Play,
  Layers,
  Cpu,
  Search,
} from 'lucide-react';
import { api } from '../lib/api-client';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [repoInput, setRepoInput] = useState('');
  const [branch, setBranch] = useState('main');
  const [status, setStatus] = useState<'idle' | 'error' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const repoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = 'SentinelFlow — Autonomous Application Security & Triage Intelligence';
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
    return () => {
      document.body.classList.remove('menu-open');
    };
  }, [menuOpen]);

  // Handle escape key and auto-close at desktop breakpoint
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
        hamburgerRef.current?.focus();
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 901 && menuOpen) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [menuOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = repoInput.trim();
    if (!cleanUrl) {
      setStatus('error');
      setErrorMessage('PLEASE ENTER A VALID GITHUB REPOSITORY URL');
      return;
    }

    if (!cleanUrl.includes('github.com')) {
      setStatus('error');
      setErrorMessage('ONLY GITHUB REPOSITORIES (github.com/owner/repo) ARE CURRENTLY SUPPORTED');
      return;
    }

    try {
      setIsSubmitting(true);
      setStatus('idle');
      setErrorMessage('');
      const repo = await api.registerRepository(cleanUrl, branch);
      const scan = await api.startScan(repo.id, 'standard', branch);
      navigate(`/scans/${scan.id}`);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'FAILED TO INITIALIZE SANDBOX SCAN');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLaunchSample = () => {
    setRepoInput('https://github.com/MaximuxR93/The2ndBrain');
    setTimeout(() => {
      repoInputRef.current?.focus();
    }, 50);
  };

  return (
    <div
      className="hero relative w-full h-screen overflow-hidden grid isolate text-white antialiased select-none"
      style={{
        height: '100svh',
        minHeight: '640px',
        gridTemplateRows: 'auto 1fr auto',
        backgroundColor: 'var(--bg, #000000)',
        fontFamily: 'var(--font-display, "Sora", sans-serif)',
      }}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. MEDIA LAYER (Video + Fallback Still)
          Full-bleed edge-to-edge cinematic video background
      ───────────────────────────────────────────────────────────── */}
      <div
        className="media-layer absolute inset-0 -z-10 bg-black pointer-events-none"
        aria-hidden="true"
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260806_132328_5f9029c8-218f-4489-82b6-29ff2849920e.png"
          className="w-full h-full object-cover object-center"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260806_133255_956f653f-5d80-4b06-abd5-0f46c98b60fa.mp4"
            type="video/mp4"
          />
        </video>

        {/* ───────────────────────────────────────────────────────────
            SCRIM (Dual gradient overlay on video)
            Desktop (≥721px): two stacked linear gradients (to right & to bottom)
            Mobile (≤720px): single bottom gradient
        ─────────────────────────────────────────────────────────── */}
        <div
          className="absolute inset-0 hidden min-[721px]:block pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, transparent 0%, transparent 40%, rgba(0,0,0,0.50) 68%, rgba(0,0,0,0.85) 100%),
              linear-gradient(to bottom, rgba(0,0,0,0.60) 0%, transparent 20%, transparent 75%, rgba(0,0,0,0.75) 100%)
            `,
          }}
        />
        <div
          className="absolute inset-0 block min-[721px]:hidden pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.30) 30%, rgba(0,0,0,0.85) 100%)',
          }}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. NAVBAR (Row 1)
          Left: SentinelFlow Brand
          Right: Cluster (Overview, Repos, Triage, Live Demo CTA) | Mobile Hamburger
      ───────────────────────────────────────────────────────────── */}
      <nav
        className="relative z-[60] flex items-center justify-between w-full"
        style={{
          gap: '32px',
          paddingTop: 'clamp(20px, 2.4vw, 34px)',
          paddingBottom: 'clamp(20px, 2.4vw, 34px)',
          paddingLeft: 'max(clamp(20px, 5vw, 100px), env(safe-area-inset-left))',
          paddingRight: 'max(clamp(20px, 5vw, 100px), env(safe-area-inset-right))',
        }}
      >
        {/* Left — Logo link "SENTINEL-W" */}
        <Link
          to="/"
          className="flex items-center gap-3 text-white no-underline transition-opacity hover:opacity-85"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-none border border-white/30 bg-white/10 backdrop-blur-md text-white">
            <Shield size={19} strokeWidth={1.7} />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-display, "Sora", sans-serif)',
              fontWeight: 200,
              fontSize: 'clamp(20px, 1.75vw, 30px)',
              letterSpacing: '0.16em',
              lineHeight: 1,
            }}
          >
            SENTINEL-W
          </span>
        </Link>

        {/* Right — nav cluster */}
        <div
          className="flex items-center"
          style={{
            gap: 'clamp(20px, 2.8vw, 48px)',
          }}
        >
          {/* Desktop links (≥901px) */}
          <div
            className="hidden min-[901px]:flex items-center"
            style={{
              gap: 'clamp(18px, 2.4vw, 42px)',
              fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              fontWeight: 400,
              fontSize: 'clamp(11px, 0.78vw, 13px)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            <Link
              to="/dashboard"
              className="text-white transition-colors duration-250 hover:text-[rgba(255,255,255,0.62)]"
            >
              Console
            </Link>
            <Link
              to="/repositories"
              className="text-white transition-colors duration-250 hover:text-[rgba(255,255,255,0.62)]"
            >
              Repositories
            </Link>
            <Link
              to="/findings"
              className="text-white transition-colors duration-250 hover:text-[rgba(255,255,255,0.62)]"
            >
              Findings
            </Link>
            <Link
              to="/queue"
              className="text-white transition-colors duration-250 hover:text-[rgba(255,255,255,0.62)]"
            >
              Triage
            </Link>
            <Link
              to="/monitoring"
              className="text-white transition-colors duration-250 hover:text-[rgba(255,255,255,0.62)]"
            >
              Metrics
            </Link>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden min-[901px]:flex items-center gap-3">
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 text-white transition-all duration-250 cursor-pointer"
              style={{
                fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                fontWeight: 400,
                fontSize: 'clamp(11px, 0.78vw, 13px)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                padding: 'clamp(11px, 0.9vw, 15px) clamp(18px, 1.5vw, 26px)',
                border: '1px solid var(--line-strong, rgba(255,255,255,0.26))',
                backgroundColor: 'rgba(255,255,255,0.06)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--fill-solid, rgba(255,255,255,0.15))';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.borderColor = 'var(--line-strong, rgba(255,255,255,0.26))';
              }}
            >
              <Sparkles size={13} strokeWidth={1.7} />
              <span>Live Demo</span>
            </Link>

            <Link
              to="/dashboard"
              className="inline-block text-black bg-white transition-all duration-250 cursor-pointer"
              style={{
                fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                fontWeight: 500,
                fontSize: 'clamp(11px, 0.78vw, 13px)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                padding: 'clamp(11px, 0.9vw, 15px) clamp(20px, 1.6vw, 30px)',
                border: '1px solid #ffffff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#000000';
              }}
            >
              Enter Console
            </Link>
          </div>

          {/* Mobile hamburger (≤900px only) */}
          <button
            ref={hamburgerRef}
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
            className="block min-[901px]:hidden relative w-[44px] h-[44px] bg-transparent border-0 cursor-pointer p-0 focus:outline-none"
          >
            {/* Bar 1 */}
            <span
              className="absolute left-1/2 w-[22px] h-[1px] bg-white transition-all"
              style={{
                top: menuOpen ? '22px' : '16px',
                transform: menuOpen ? 'translateX(-50%) rotate(45deg)' : 'translateX(-50%)',
                transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), top 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
            {/* Bar 2 */}
            <span
              className="absolute left-1/2 top-[22px] w-[22px] h-[1px] bg-white transition-all"
              style={{
                transform: menuOpen ? 'translateX(-50%) scaleX(0)' : 'translateX(-50%) scaleX(1)',
                opacity: menuOpen ? 0 : 1,
                transition: 'transform 0.25s ease, opacity 0.25s ease',
              }}
            />
            {/* Bar 3 */}
            <span
              className="absolute left-1/2 w-[22px] h-[1px] bg-white transition-all"
              style={{
                top: menuOpen ? '22px' : '28px',
                transform: menuOpen ? 'translateX(-50%) rotate(-45deg)' : 'translateX(-50%)',
                transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), top 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </button>
        </div>
      </nav>

      {/* ─────────────────────────────────────────────────────────────
          MOBILE MENU OVERLAY
      ───────────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center min-[901px]:hidden"
        style={{
          backgroundColor: 'rgba(4,4,6,0.96)',
          backdropFilter: 'blur(28px) saturate(140%)',
          WebkitBackdropFilter: 'blur(28px) saturate(140%)',
          clipPath: menuOpen
            ? 'circle(150% at calc(100% - 42px) 42px)'
            : 'circle(3% at calc(100% - 42px) 42px)',
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'auto' : 'none',
          transition: 'clip-path 0.7s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s ease',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setMenuOpen(false);
          }
        }}
      >
        <div className="flex flex-col items-center gap-7 text-center">
          {[
            { label: 'Live Demo', href: '/demo' },
            { label: 'Security Console', href: '/dashboard' },
            { label: 'Repositories', href: '/repositories' },
            { label: 'Findings & CVEs', href: '/findings' },
            { label: 'Triage Queue', href: '/queue' },
            { label: 'Metrics', href: '/monitoring' },
          ].map((item, index) => (
            <Link
              key={item.label}
              to={item.href}
              onClick={() => setMenuOpen(false)}
              className="text-white hover:text-[rgba(255,255,255,0.62)] uppercase transition-all duration-300"
              style={{
                fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                fontWeight: 400,
                fontSize: 'clamp(18px, 5vw, 24px)',
                letterSpacing: '0.14em',
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? 'translateY(0)' : 'translateY(16px)',
                transition: 'opacity 0.4s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                transitionDelay: `${160 + index * 50}ms`,
              }}
            >
              {item.label}
            </Link>
          ))}

          {/* Mobile CTA */}
          <Link
            to="/dashboard"
            onClick={() => setMenuOpen(false)}
            className="mt-4 text-black bg-white uppercase transition-all duration-300 px-8 py-3.5"
            style={{
              fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              fontWeight: 500,
              fontSize: '13px',
              letterSpacing: '0.22em',
              opacity: menuOpen ? 1 : 0,
              transform: menuOpen ? 'translateY(0)' : 'translateY(16px)',
              transition: 'opacity 0.4s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
              transitionDelay: `${160 + 6 * 50}ms`,
            }}
          >
            Launch Console
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. RIGHT PANEL (Row 2 — Security Intelligence Entry)
          Desktop: right-aligned with black negative space on left
          Mobile: centered
      ───────────────────────────────────────────────────────────── */}
      <main
        className="hero__body relative flex items-center min-h-0 overflow-y-auto w-full"
        style={{
          justifyContent: 'flex-end',
          paddingLeft: 'max(clamp(20px, 5vw, 100px), env(safe-area-inset-left))',
          paddingRight: 'max(clamp(20px, 5vw, 100px), env(safe-area-inset-right))',
        }}
      >
        <div
          className="panel flex flex-col items-start w-full"
          style={{
            maxWidth: 'min(38vw, 680px)',
            minWidth: '380px',
          }}
        >
          {/* Element 1: CHIP "[ SECURITY INTELLIGENCE ]" (Sharp rectangle, no pill) */}
          <div
            className="panel__chip self-start text-white leading-none inline-flex items-center gap-2"
            style={{
              fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              fontWeight: 400,
              fontSize: 'clamp(11px, 0.72vw, 14px)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              backgroundColor: 'rgba(255,255,255,0.09)',
              padding: 'clamp(9px, 0.8vw, 14px) clamp(14px, 1.1vw, 20px)',
              borderRadius: '0px',
            }}
          >
            <span className="inline-block w-1.5 h-1.5 bg-[#4A78B0] animate-pulse" />
            <span>[ AUTONOMOUS TRIAGE ENGINE ]</span>
          </div>

          {/* Element 2: H1 "SENTINEL-W" (Dominant hero typography) */}
          <h1
            className="hero-h1 text-white tracking-[0.03em] select-text"
            style={{
              fontFamily: 'var(--font-display, "Sora", sans-serif)',
              fontWeight: 200,
              fontSize: 'clamp(52px, 5.8vw, 112px)',
              lineHeight: 0.95,
              marginTop: 'clamp(26px, 2.8vw, 48px)',
            }}
          >
            SENTINEL-W
          </h1>

          {/* Element 3: TAGLINE */}
          <p
            className="leading-[1.4]"
            style={{
              fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              fontWeight: 300,
              fontSize: 'clamp(11px, 0.9vw, 16px)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--text-dim, rgba(255,255,255,0.62))',
              marginTop: 'clamp(14px, 1.4vw, 24px)',
            }}
          >
            Evidence-backed application security & incident orchestration.
          </p>

          {/* Feature Micro-Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-4 text-[11px] font-mono text-white/60">
            <span className="border border-white/15 px-2.5 py-1 bg-white/5 uppercase tracking-wider">
              OSV VULNERABILITY FEEDS
            </span>
            <span className="border border-white/15 px-2.5 py-1 bg-white/5 uppercase tracking-wider">
              ATTACK PATH GRAPH
            </span>
            <span className="border border-white/15 px-2.5 py-1 bg-white/5 uppercase tracking-wider">
              GROQ 120B ACCELERATED
            </span>
          </div>

          {/* Element 4: REPOSITORY SCAN FORM */}
          <div
            className="w-full"
            style={{
              marginTop: 'clamp(32px, 3.8vw, 64px)',
            }}
          >
            <form
              noValidate
              onSubmit={handleSubmit}
              className="flex flex-col w-full"
              style={{
                gap: 'clamp(14px, 1.4vw, 20px)',
              }}
            >
              {/* Repository Input Field */}
              <div className="relative w-full">
                <input
                  ref={repoInputRef}
                  type="url"
                  name="repoUrl"
                  id="repoUrl"
                  value={repoInput}
                  onChange={(e) => {
                    setRepoInput(e.target.value);
                    if (status === 'error') {
                      setStatus('idle');
                      setErrorMessage('');
                    }
                  }}
                  placeholder="GITHUB REPO (e.g. github.com/owner/repo)"
                  autoComplete="off"
                  spellCheck="false"
                  className="w-full text-white placeholder-[rgba(255,255,255,0.42)] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.26)] transition-all duration-250 focus:border-white focus:bg-[rgba(255,255,255,0.08)] focus:outline-none"
                  style={{
                    fontFamily: 'var(--font-display, "Sora", sans-serif)',
                    fontWeight: 300,
                    fontSize: 'clamp(13px, 0.9vw, 15px)',
                    letterSpacing: '0.05em',
                    padding: 'clamp(14px, 1.1vw, 20px) clamp(16px, 1.4vw, 24px)',
                    borderRadius: '0px',
                  }}
                />
                {status === 'error' && (
                  <div
                    className="mt-2 text-[#ff6b6b] text-left uppercase"
                    style={{
                      fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                      fontWeight: 400,
                      fontSize: '11px',
                      letterSpacing: '0.12em',
                    }}
                  >
                    {errorMessage}
                  </div>
                )}
              </div>

              {/* Action Buttons: Start Scan + Quick Sample Launch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full text-black bg-white border border-white cursor-pointer transition-all duration-250 hover:bg-transparent hover:text-white disabled:opacity-60 font-mono text-[12px] uppercase tracking-[0.2em] py-3.5 px-4 text-center"
                  style={{
                    borderRadius: '0px',
                  }}
                >
                  {isSubmitting ? 'SANDBOX SCANNING...' : 'START SCAN'}
                </button>

                <Link
                  to="/demo"
                  className="w-full text-white bg-transparent border border-white/30 cursor-pointer transition-all duration-250 hover:bg-white/10 hover:border-white font-mono text-[12px] uppercase tracking-[0.2em] py-3.5 px-4 text-center inline-flex items-center justify-center gap-2"
                  style={{
                    borderRadius: '0px',
                  }}
                >
                  <Sparkles size={14} strokeWidth={1.7} />
                  <span>VIEW LIVE DEMO</span>
                </Link>
              </div>

              {/* Sample Repository Quick-Fill */}
              <div className="flex items-center justify-between text-[11px] font-mono text-white/50 pt-1">
                <span>Try sample verified repo:</span>
                <button
                  type="button"
                  onClick={handleLaunchSample}
                  className="text-white/80 hover:text-white underline underline-offset-2 cursor-pointer transition-colors"
                >
                  MaximuxR93/The2ndBrain
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          4. LEGAL FOOTER (Row 3)
          Pinned bottom, respect safe-area insets
      ───────────────────────────────────────────────────────────── */}
      <footer
        className="relative z-10 flex flex-wrap items-center justify-between w-full"
        style={{
          gap: '16px',
          paddingTop: 'clamp(16px, 2vw, 28px)',
          paddingBottom: 'clamp(16px, 2vw, 28px)',
          paddingLeft: 'max(clamp(20px, 5vw, 100px), env(safe-area-inset-left))',
          paddingRight: 'max(clamp(20px, 5vw, 100px), env(safe-area-inset-right))',
          fontFamily: 'var(--font-display, "Sora", sans-serif)',
          fontWeight: 300,
          fontSize: 'clamp(10px, 0.72vw, 12px)',
          letterSpacing: '0.05em',
          color: 'var(--text-dimmer, rgba(255,255,255,0.42))',
        }}
      >
        <div className="flex items-center gap-3">
          <span>© 2026 SENTINEL-W SECURITY PLATFORM.</span>
          <span className="hidden sm:inline text-white/20">|</span>
          <span className="hidden sm:inline font-mono text-[10px] text-white/60">
            FASTAPI GATEWAY + ISOLATED SANDBOX
          </span>
        </div>

        <div className="flex items-center gap-6 font-mono text-[11px] tracking-wider uppercase">
          <Link
            to="/dashboard"
            className="text-[rgba(255,255,255,0.42)] hover:text-white transition-colors duration-200 no-underline"
          >
            Console
          </Link>
          <Link
            to="/queue"
            className="text-[rgba(255,255,255,0.42)] hover:text-white transition-colors duration-200 no-underline"
          >
            Triage
          </Link>
          <Link
            to="/demo"
            className="text-[rgba(255,255,255,0.42)] hover:text-white transition-colors duration-200 no-underline"
          >
            Interactive Graph
          </Link>
        </div>
      </footer>
    </div>
  );
};
