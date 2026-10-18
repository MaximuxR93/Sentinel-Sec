import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  GitBranch,
  ShieldAlert,
  GitFork,
  Wrench,
  Layers,
  ChevronDown,
  Activity,
  Cpu,
  Brain,
  CheckCircle2,
  Plus,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { AiAssistantModal } from '../ui/AiAssistantModal';
import { api } from '../../lib/api-client';
import { useAi } from '../../context/AiContext';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { activeProvider, activeModel, openModal: openAiModelModal } = useAi();
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [scanProfile, setScanProfile] = useState<'quick' | 'standard' | 'deep'>('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const handleStartScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;
    try {
      setIsSubmitting(true);
      const repo = await api.registerRepository(repoUrl, branch);
      const scan = await api.startScan(repo.id, scanProfile, branch);
      setIsScanModalOpen(false);
      setRepoUrl('');
      navigate(`/scans/${scan.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-[470] transition-colors duration-150 ${
      isActive
        ? 'bg-[#0F1B31] text-white shadow-sm'
        : 'text-[#59627E] hover:text-[#020C21] hover:bg-[#E6EDF6]/60'
    }`;

  return (
    <>
      <header className="sticky top-4 z-40 px-4 max-w-7xl mx-auto w-full mb-6">
        <nav className="flex items-center justify-between bg-white border border-[#CED5E0] shadow-[0_2px_12px_rgba(28,52,92,0.06)] rounded-full px-4 py-2.5">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F1B31] text-white group-hover:scale-105 transition-transform duration-150">
                <Shield size={17} strokeWidth={1.7} />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-[570] tracking-tight text-[#020C21] leading-none">
                  SentinelFlow
                </span>
                <span className="text-[10px] font-[470] tracking-wider uppercase text-[#59627E] mt-0.5">
                  Security Intelligence
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/dashboard" className={navLinkClass}>
              <LayoutDashboard size={14} strokeWidth={1.7} />
              <span>Overview</span>
            </NavLink>
            <NavLink to="/repositories" className={navLinkClass}>
              <GitBranch size={14} strokeWidth={1.7} />
              <span>Repositories</span>
            </NavLink>
            <NavLink to="/findings" className={navLinkClass}>
              <ShieldAlert size={14} strokeWidth={1.7} />
              <span>Findings</span>
            </NavLink>
            <NavLink to="/attack-paths" className={navLinkClass}>
              <GitFork size={14} strokeWidth={1.7} />
              <span>Attack Paths</span>
            </NavLink>
            <NavLink to="/remediation" className={navLinkClass}>
              <Wrench size={14} strokeWidth={1.7} />
              <span>Remediation</span>
            </NavLink>
            <NavLink to="/queue" className={navLinkClass}>
              <Layers size={14} strokeWidth={1.7} />
              <span>Triage Queue</span>
            </NavLink>

            {/* More Menu */}
            <div className="relative">
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                onBlur={() => setTimeout(() => setMoreOpen(false), 200)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] font-[470] text-[#59627E] hover:text-[#020C21] hover:bg-[#E6EDF6]/60 transition-colors duration-150 cursor-pointer"
              >
                <span>Ops</span>
                <ChevronDown size={12} strokeWidth={1.7} />
              </button>
              {moreOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-[16px] bg-white border border-[#CED5E0] shadow-[0_8px_24px_rgba(28,52,92,0.12)] py-1.5 z-50">
                  <Link
                    to="/monitoring"
                    className="flex items-center gap-2 px-3.5 py-2 text-[13px] font-[470] text-[#020C21] hover:bg-[#E6EDF6]"
                  >
                    <Activity size={14} strokeWidth={1.7} className="text-[#4A78B0]" />
                    <span>Monitoring</span>
                  </Link>
                  <Link
                    to="/guardrails"
                    className="flex items-center gap-2 px-3.5 py-2 text-[13px] font-[470] text-[#020C21] hover:bg-[#E6EDF6]"
                  >
                    <Cpu size={14} strokeWidth={1.7} className="text-[#4A78B0]" />
                    <span>Guardrails</span>
                  </Link>
                  <Link
                    to="/memory"
                    className="flex items-center gap-2 px-3.5 py-2 text-[13px] font-[470] text-[#020C21] hover:bg-[#E6EDF6]"
                  >
                    <Brain size={14} strokeWidth={1.7} className="text-[#4A78B0]" />
                    <span>Context Memory</span>
                  </Link>
                  <Link
                    to="/evals"
                    className="flex items-center gap-2 px-3.5 py-2 text-[13px] font-[470] text-[#020C21] hover:bg-[#E6EDF6]"
                  >
                    <CheckCircle2 size={14} strokeWidth={1.7} className="text-[#4A78B0]" />
                    <span>Evals & Accuracy</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Action Button & Auth Cluster */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#CED5E0] bg-white px-3 py-1.5 text-[12px] font-[520] text-[#0F1B31] hover:bg-[#F4F7FB] transition-colors duration-150 cursor-pointer shadow-sm"
              title="Groq AI Acceleration Active (openai/gpt-oss-120b)"
            >
              <Zap size={13} strokeWidth={2} className="text-[#2f5f9e]" />
              <span className="hidden sm:inline">Groq AI</span>
              <span className="font-mono text-[10px] text-[#4A78B0] bg-[#E6EDF6] px-1.5 py-0.2 rounded font-[500]">
                120B
              </span>
            </button>
            <Link
              to="/demo"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#2f5f9e]/30 bg-[#E3EEF8] px-3.5 py-1.5 text-[13px] font-[520] text-[#0F1B31] hover:bg-[#D4E4F4] transition-colors duration-150 cursor-pointer shadow-sm"
            >
              <Sparkles size={13} strokeWidth={1.7} className="text-[#2f5f9e]" />
              <span className="hidden sm:inline">Live Demo</span>
            </Link>
            <button
              onClick={openAiModelModal}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#CED5E0] bg-white px-3 py-1.5 text-[12px] font-[500] text-[#020C21] hover:bg-[#F4F7FB] transition-colors cursor-pointer shadow-sm"
              title={`Active AI Model: ${activeModel} (${activeProvider.toUpperCase()}). Click to change model or configure API keys.`}
            >
              <Sparkles size={13} strokeWidth={1.8} className="text-[#1F4E79]" />
              <span className="font-mono text-[11px] font-[520] truncate max-w-[130px]">
                {activeModel}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </button>

            <button
              onClick={() => setIsScanModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0F1B31] px-3.5 py-1.5 text-[13px] font-[500] text-white hover:bg-[#020C21] transition-colors duration-150 cursor-pointer shadow-sm"
            >
              <Plus size={14} strokeWidth={1.7} />
              <span className="hidden sm:inline">Scan Repo</span>
            </button>

            {/* SOC Analyst Identity Badge - Always Unrestricted */}
            <div className="flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-full border border-[#CED5E0] bg-[#F4F7FB] shadow-sm select-none">
              <div className="h-6 w-6 rounded-full bg-[#0F1B31] text-white flex items-center justify-center text-[10px] font-[600]">
                SA
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-[12px] font-[520] text-[#020C21] leading-tight">
                  SOC Analyst
                </span>
                <span className="text-[10px] text-[#4A78B0] font-[470] leading-none">
                  Full Access
                </span>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-500" title="Unrestricted Console Access Active" />
            </div>
          </div>
        </nav>
      </header>

      {/* Quick Scan Modal */}
      <Modal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        title="Analyze a Repository"
      >
        <form onSubmit={handleStartScan} className="space-y-4">
          <div>
            <label className="block text-[13px] font-[470] text-[#59627E] mb-1.5">
              GitHub Repository URL
            </label>
            <input
              type="url"
              required
              placeholder="https://github.com/owner/repository"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="w-full rounded-[12px] bg-white border border-[#CED5E0] px-3.5 py-2.5 text-[14px] text-[#020C21] focus:border-[#2f5f9e] focus:ring-1 focus:ring-[#2f5f9e] outline-none"
            />
            <p className="text-[12px] text-[#59627E] mt-1">
              Supports public repositories or configured workspace access tokens.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-[470] text-[#59627E] mb-1.5">
                Branch / Reference
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
                className="w-full rounded-[12px] bg-white border border-[#CED5E0] px-3.5 py-2 text-[14px] text-[#020C21] focus:border-[#2f5f9e] focus:ring-1 focus:ring-[#2f5f9e] outline-none"
              />
            </div>
            <div>
              <label className="block text-[13px] font-[470] text-[#59627E] mb-1.5">
                Scan Profile
              </label>
              <select
                value={scanProfile}
                onChange={(e) => setScanProfile(e.target.value as any)}
                className="w-full rounded-[12px] bg-white border border-[#CED5E0] px-3 py-2 text-[14px] text-[#020C21] focus:border-[#2f5f9e] focus:ring-1 focus:ring-[#2f5f9e] outline-none"
              >
                <option value="quick">Quick (Inventory & SCA)</option>
                <option value="standard">Standard (SCA, SAST, Secrets)</option>
                <option value="deep">Deep (Data-flow & Attack Graph)</option>
              </select>
            </div>
          </div>

          <div className="rounded-[12px] bg-[#E6EDF6]/60 border border-[#DDE4EE] p-3 text-[12px] text-[#59627E]">
            <span className="font-[520] text-[#020C21]">Isolation Guarantee:</span> Scans execute inside dedicated sandboxes with network egress limits and strict SSRF filters.
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsScanModalOpen(false)}
              className="rounded-full bg-white border border-[#CED5E0] px-4 py-2 text-[13px] font-[470] text-[#0F1B31] hover:bg-[#F4F7FB] transition-colors duration-150 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-[#0F1B31] px-5 py-2 text-[13px] font-[500] text-white hover:bg-[#020C21] transition-colors duration-150 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Starting Job...' : 'Start Security Analysis'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Groq AI Assistant & Model Management Modal */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
      />
    </>
  );
};
