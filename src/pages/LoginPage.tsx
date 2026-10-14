import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  Layers,
  ShieldAlert,
  GitBranch,
  Activity,
  CheckCircle2,
  Unlock,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  // Automatic seamless transition to dashboard
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 1800);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-10 px-4">
      <div className="w-full max-w-xl space-y-6">
        {/* Status card */}
        <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-8 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E3EEF8] text-[#1F4E79] border border-[#CED5E0]">
            <Unlock size={26} strokeWidth={1.7} />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[12px] font-[500] mb-3">
              <CheckCircle2 size={13} strokeWidth={1.7} className="text-emerald-600" />
              <span>Authentication Gate Disabled</span>
            </div>
            <h1 className="text-[28px] font-[500] tracking-[-0.02em] text-[#020C21]">
              Unrestricted Console Access
            </h1>
            <p className="text-[15px] font-[425] text-[#59627E] mt-2 max-w-md mx-auto">
              Password credentials, session logins, and account barriers have been completely removed.
              All security triage queues, vulnerability graphs, and remediation controls are immediately open.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0F1B31] px-7 py-3 text-[14px] font-[500] text-white hover:bg-[#020C21] transition-colors duration-150 cursor-pointer shadow-sm w-full sm:w-auto"
            >
              <span>Launch Incident Console</span>
              <ArrowRight size={15} strokeWidth={1.7} />
            </button>
            <p className="text-[12px] text-[#59627E] mt-2 font-[470]">
              Redirecting automatically in a moment...
            </p>
          </div>

          <div className="border-t border-[#DDE4EE] pt-5 mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
            <Link
              to="/dashboard"
              className="p-2.5 rounded-[12px] hover:bg-[#F4F7FB] transition-colors border border-transparent hover:border-[#DDE4EE]"
            >
              <Activity size={15} strokeWidth={1.7} className="text-[#4A78B0] mb-1" />
              <div className="text-[12px] font-[500] text-[#020C21]">Overview</div>
              <div className="text-[10px] text-[#59627E]">Live posture</div>
            </Link>

            <Link
              to="/queue"
              className="p-2.5 rounded-[12px] hover:bg-[#F4F7FB] transition-colors border border-transparent hover:border-[#DDE4EE]"
            >
              <Layers size={15} strokeWidth={1.7} className="text-[#4A78B0] mb-1" />
              <div className="text-[12px] font-[500] text-[#020C21]">Triage Queue</div>
              <div className="text-[10px] text-[#59627E]">Active incidents</div>
            </Link>

            <Link
              to="/findings"
              className="p-2.5 rounded-[12px] hover:bg-[#F4F7FB] transition-colors border border-transparent hover:border-[#DDE4EE]"
            >
              <ShieldAlert size={15} strokeWidth={1.7} className="text-[#4A78B0] mb-1" />
              <div className="text-[12px] font-[500] text-[#020C21]">Findings</div>
              <div className="text-[10px] text-[#59627E]">SAST & OSV</div>
            </Link>

            <Link
              to="/repositories"
              className="p-2.5 rounded-[12px] hover:bg-[#F4F7FB] transition-colors border border-transparent hover:border-[#DDE4EE]"
            >
              <GitBranch size={15} strokeWidth={1.7} className="text-[#4A78B0] mb-1" />
              <div className="text-[12px] font-[500] text-[#020C21]">Repositories</div>
              <div className="text-[10px] text-[#59627E]">Scanned code</div>
            </Link>
          </div>
        </div>

        {/* Operational badge */}
        <div className="flex items-center justify-center gap-2 text-[12px] font-[470] text-[#59627E]">
          <ShieldCheck size={14} strokeWidth={1.7} className="text-[#4A78B0]" />
          <span>SentinelFlow Enterprise Defense · Open Analyst Seat</span>
        </div>
      </div>
    </div>
  );
};
