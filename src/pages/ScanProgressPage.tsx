import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Terminal,
  ShieldCheck,
  ArrowRight,
  GitBranch,
  ShieldAlert,
  Loader2,
  ListOrdered,
  FileText,
  Activity,
  Wrench,
  ExternalLink,
  Code2,
  Shield,
  Database,
  Check,
} from 'lucide-react';
import { api } from '../lib/api-client';
import { ScanJob, SecurityFinding } from '../types';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';

export const ScanProgressPage: React.FC = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const [scan, setScan] = useState<ScanJob | null>(null);
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'roadmap' | 'explanation'>('pipeline');
  const [resolvedFindingIds, setResolvedFindingIds] = useState<string[]>([]);

  useEffect(() => {
    if (!scanId) return;
    setLoading(true);
    Promise.all([api.getScan(scanId), api.getFindings()])
      .then(([scanData, findingsData]) => {
        setScan(scanData);
        setFindings(findingsData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [scanId]);

  const handleApplyFix = (findingId: string) => {
    setResolvedFindingIds((prev) =>
      prev.includes(findingId) ? prev : [...prev, findingId]
    );
  };

  const handleApplyAll = () => {
    setResolvedFindingIds(findings.map((f) => f.id));
  };

  if (error) {
    return (
      <div className="py-8">
        <ErrorState message={error} />
      </div>
    );
  }

  if (loading || !scan) {
    return (
      <div className="space-y-6 py-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const isScanDone = scan.status === 'completed';
  const openFindings = findings.filter((f) => !resolvedFindingIds.includes(f.id));
  const fixedCount = resolvedFindingIds.length;

  return (
    <div className="space-y-6 py-4">
      {/* Top Header Card */}
      <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-mono text-[#59627E] uppercase">
                Job ID: {scan.id}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-[520] ${
                  isScanDone
                    ? 'bg-[#E3EEF8] text-[#1F4E79] border border-[#C7DCF0]'
                    : 'bg-[#FBF0D9] text-[#7A5200] border border-[#F3DCAB]'
                }`}
              >
                {isScanDone ? (
                  <ShieldCheck size={13} strokeWidth={1.7} />
                ) : (
                  <Loader2 size={13} strokeWidth={1.7} className="animate-spin" />
                )}
                <span className="capitalize">{scan.status}</span>
              </span>
            </div>
            <h1 className="text-[28px] font-[500] text-[#020C21]">
              Scan Analysis: {scan.repositoryName}
            </h1>
            <p className="text-[13px] font-[425] text-[#59627E] flex items-center gap-2">
              <GitBranch size={13} strokeWidth={1.7} />
              <span>{scan.branch} · Commit:</span>
              <span className="font-mono text-[#020C21]">{scan.commitSha}</span>
              <span>· Profile:</span>
              <span className="capitalize font-[500] text-[#020C21]">{scan.profile}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                if (!scan) return;
                let currentIdx = 0;
                setScan((s) => (s ? {
                  ...s,
                  status: 'running',
                  progressPercent: 14,
                  stages: s.stages.map((st, i) => ({
                    ...st,
                    status: i === 0 ? 'running' : 'pending',
                    durationMs: undefined,
                  })),
                  findingsCount: { critical: 0, high: 0, medium: 0, low: 0 },
                } : null));

                const interval = setInterval(() => {
                  currentIdx += 1;
                  setScan((s) => {
                    if (!s) return null;
                    const updatedStages = s.stages.map((st, i) => {
                      if (i < currentIdx) return { ...st, status: 'completed' as const, durationMs: st.durationMs || 400 + i * 250 };
                      if (i === currentIdx) return { ...st, status: 'running' as const };
                      return { ...st, status: 'pending' as const };
                    });

                    const progress = Math.min(100, Math.round(((currentIdx + 1) / 7) * 100));
                    const newFindings = currentIdx >= 4 ? { critical: 2, high: 2, medium: 1, low: 0 } : { critical: 0, high: 0, medium: 0, low: 0 };

                    return {
                      ...s,
                      progressPercent: progress,
                      stages: updatedStages,
                      findingsCount: newFindings,
                      status: currentIdx >= 6 ? 'completed' : 'running',
                    };
                  });

                  if (currentIdx >= 6) {
                    clearInterval(interval);
                  }
                }, 1200);
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#CED5E0] px-4 py-2 text-[13px] font-[470] text-[#020C21] hover:bg-[#E6EDF6] transition-colors duration-150 shadow-sm cursor-pointer"
            >
              <Clock size={14} strokeWidth={1.7} />
              <span>Re-run Live Simulation</span>
            </button>
            <Link
              to="/demo"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0F1B31] px-5 py-2 text-[13px] font-[500] text-white hover:bg-[#020C21] transition-colors duration-150 shadow-sm"
            >
              <span>Explore Architecture Graph</span>
              <ArrowRight size={14} strokeWidth={1.7} />
            </Link>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="mt-6 pt-4 border-t border-[#CED5E0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center bg-[#E6EDF6] p-1 rounded-full text-[13px]">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-4 py-1.5 rounded-full font-[500] transition-colors ${
                activeTab === 'pipeline'
                  ? 'bg-white text-[#020C21] shadow-sm'
                  : 'text-[#59627E] hover:text-[#020C21]'
              }`}
            >
              Pipeline Stages & Logs
            </button>
            <button
              onClick={() => setActiveTab('roadmap')}
              className={`px-4 py-1.5 rounded-full font-[500] transition-colors flex items-center gap-1.5 ${
                activeTab === 'roadmap'
                  ? 'bg-white text-[#020C21] shadow-sm'
                  : 'text-[#59627E] hover:text-[#020C21]'
              }`}
            >
              <ListOrdered size={14} strokeWidth={1.7} />
              <span>Remediation Roadmap</span>
            </button>
            <button
              onClick={() => setActiveTab('explanation')}
              className={`px-4 py-1.5 rounded-full font-[500] transition-colors flex items-center gap-1.5 ${
                activeTab === 'explanation'
                  ? 'bg-white text-[#020C21] shadow-sm'
                  : 'text-[#59627E] hover:text-[#020C21]'
              }`}
            >
              <FileText size={14} strokeWidth={1.7} />
              <span>Deep Audit Report</span>
            </button>
          </div>

          <div className="text-[13px] text-[#59627E]">
            Status: <span className="font-[520] text-[#020C21]">{scan.progressPercent}% Completed</span>
          </div>
        </div>

        {/* Overall progress indicator bar */}
        <div className="mt-3">
          <div className="h-2 w-full rounded-full bg-[#E6EDF6] overflow-hidden">
            <div
              className="h-full bg-[#0F1B31] transition-all duration-300"
              style={{ width: `${scan.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Completion Banner with Quick Roadmap / Explanation Triggers */}
      {isScanDone && (
        <div className="rounded-[20px] bg-white border border-[#4A78B0]/40 p-5 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#E3EEF8] border border-[#C7DCF0] flex items-center justify-center text-[#1F4E79] shrink-0">
              <ShieldCheck size={20} strokeWidth={1.7} />
            </div>
            <div>
              <h3 className="text-[16px] font-[500] text-[#020C21] flex items-center gap-2">
                <span>Deterministic AST Scan Complete</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-[#FADADD] text-[#A1121F] border border-[#F4AEB6]">
                  {scan.findingsCount.critical} Critical · {scan.findingsCount.high} High
                </span>
              </h3>
              <p className="text-[13px] font-[425] text-[#59627E]">
                AST call traces analyzed without false positives. Review the prioritized fix roadmap or inspect the comprehensive deep audit report.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('roadmap')}
              className="px-4 py-2 rounded-full bg-[#0F1B31] text-white text-[13px] font-[500] hover:bg-[#020C21] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <ListOrdered size={14} strokeWidth={1.7} />
              <span>Open Roadmap</span>
            </button>
            <button
              onClick={() => setActiveTab('explanation')}
              className="px-4 py-2 rounded-full bg-white border border-[#CED5E0] text-[#020C21] text-[13px] font-[470] hover:bg-[#E6EDF6] transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <FileText size={14} strokeWidth={1.7} />
              <span>View Audit Report</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: PIPELINE TELEMETRY & SANDBOX LOGS                                 */}
      {/* ========================================================================= */}
      {activeTab === 'pipeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: 7 Defined Scan Stages (7 cols) */}
          <div className="lg:col-span-7 rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)]">
            <div className="flex items-center justify-between pb-4 border-b border-[#CED5E0] mb-4">
              <div>
                <h3 className="text-[18px] font-[500] text-[#020C21]">Analysis Pipeline Stages</h3>
                <p className="text-[13px] font-[470] text-[#59627E]">
                  Deterministic execution steps per the SentinelFlow specification
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {scan.stages.map((stage, idx) => {
                const isDone = stage.status === 'completed';
                const isRunning = stage.status === 'running';

                return (
                  <div
                    key={stage.id}
                    className={`flex items-start gap-3.5 p-3.5 rounded-[16px] border transition-colors ${
                      isRunning
                        ? 'bg-[#E3EEF8]/40 border-[#4A78B0]'
                        : isDone
                        ? 'bg-white border-[#DDE4EE]'
                        : 'bg-[#E6EDF6]/30 border-transparent text-[#59627E]'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isDone ? (
                        <CheckCircle2 size={18} strokeWidth={1.7} className="text-[#1F4E79]" />
                      ) : isRunning ? (
                        <Loader2 size={18} strokeWidth={1.7} className="text-[#4A78B0] animate-spin" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-[#CED5E0] flex items-center justify-center text-[10px] text-[#59627E]">
                          {idx + 1}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[14px] font-[520] text-[#020C21]">
                          Stage {idx + 1}: {stage.label}
                        </span>
                        {stage.durationMs && (
                          <span className="text-[12px] font-mono text-[#59627E]">
                            {stage.durationMs}ms
                          </span>
                        )}
                      </div>
                      {stage.message && (
                        <p className="text-[13px] font-[425] text-[#59627E]">
                          {stage.message}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Findings Summary & Real-time Logs (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)]">
              <h3 className="text-[16px] font-[500] text-[#020C21] mb-3">
                Scan Results Summary
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div className="p-3 rounded-[12px] bg-[#FADADD]/40 border border-[#F4AEB6]">
                  <span className="text-[11px] uppercase font-[500] text-[#A1121F] block">Critical</span>
                  <span className="text-[22px] font-[360] text-[#A1121F]">
                    {scan.findingsCount.critical}
                  </span>
                </div>
                <div className="p-3 rounded-[12px] bg-[#FCE4D6]/40 border border-[#F7C4A5]">
                  <span className="text-[11px] uppercase font-[500] text-[#9A3B0B] block">High</span>
                  <span className="text-[22px] font-[360] text-[#9A3B0B]">
                    {scan.findingsCount.high}
                  </span>
                </div>
                <div className="p-3 rounded-[12px] bg-[#FBF0D9]/40 border border-[#F3DCAB]">
                  <span className="text-[11px] uppercase font-[500] text-[#7A5200] block">Medium</span>
                  <span className="text-[22px] font-[360] text-[#7A5200]">
                    {scan.findingsCount.medium}
                  </span>
                </div>
              </div>

              <div className="text-[13px] text-[#59627E] space-y-1 border-t border-[#CED5E0] pt-3">
                <div className="flex justify-between">
                  <span>Coverage:</span>
                  <span className="font-[520] text-[#020C21]">{scan.coverage.coveragePercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Scanned Packages:</span>
                  <span className="font-mono text-[#020C21]">{scan.coverage.scannedDependencies}</span>
                </div>
                <div className="flex justify-between">
                  <span>Skipped Packages:</span>
                  <span className="font-mono text-[#7A5200]">{scan.coverage.skippedDependencies} (unresolved)</span>
                </div>
              </div>
            </div>

            {/* Real-time Sandbox Logs Card */}
            <div className="rounded-[20px] bg-[#020C21] text-white p-5 border border-[#CED5E0] shadow-sm font-mono text-[12px]">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3 text-[#CED5E0]">
                <span className="flex items-center gap-1.5 font-sans font-[500] text-[13px] text-white">
                  <Terminal size={14} strokeWidth={1.7} />
                  <span>Sandbox Execution Logs</span>
                </span>
                <span className="text-[11px] text-[#CED5E0]/60">ISO 8601</span>
              </div>

              <div className="space-y-1.5 max-h-[260px] overflow-y-auto text-[#CED5E0]/90 pr-1">
                {scan.logs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: REMEDIATION ROADMAP GUIDE VIEW                                   */}
      {/* ========================================================================= */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6">
          <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[12px] font-mono text-[#4A78B0] uppercase block">
                Phased Remediation Playbook
              </span>
              <h2 className="text-[22px] font-[500] text-[#020C21] flex items-center gap-2">
                <ListOrdered size={20} strokeWidth={1.7} className="text-[#4A78B0]" />
                <span>Actionable Developer Fix Guide</span>
              </h2>
              <p className="text-[14px] text-[#59627E]">
                Prioritized mitigation sequence calculated from CVSS risk, attack path reachability, and implementation complexity.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[13px] text-[#59627E]">
                Resolved: <span className="font-semibold text-[#020C21]">{fixedCount}/{findings.length}</span>
              </span>
              <button
                onClick={handleApplyAll}
                className="px-4 py-2 rounded-full bg-[#0F1B31] text-white text-[13px] font-[500] hover:bg-[#020C21] transition-colors shadow-sm cursor-pointer"
              >
                1-Click Apply All Patches
              </button>
            </div>
          </div>

          {/* Phase 1: P0 Emergency Fixes */}
          <div className="rounded-[20px] bg-white border border-[#F4AEB6] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#CED5E0] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-[#FADADD] text-[#A1121F] border border-[#F4AEB6]">
                  PHASE 1 · P0 CRITICAL
                </span>
                <h3 className="text-[16px] font-[500] text-[#020C21]">
                  Emergency Exploit Neutralization (Target SLA: &lt; 1 hour)
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {findings
                .filter((f) => f.severity === 'critical')
                .map((f) => {
                  const isFixed = resolvedFindingIds.includes(f.id);
                  return (
                    <div
                      key={f.id}
                      className={`p-4 rounded-[16px] border transition-colors space-y-3 ${
                        isFixed
                          ? 'bg-[#E3EEF8]/30 border-[#C7DCF0]'
                          : 'bg-white border-[#DDE4EE]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-mono text-[#1F4E79] font-medium">{f.ruleId}</span>
                        <SeverityBadge severity={f.severity} size="sm" />
                      </div>

                      <h4 className="text-[14px] font-[520] text-[#020C21]">{f.title}</h4>
                      <p className="text-[13px] text-[#59627E] line-clamp-2">{f.description}</p>
                      <span className="text-[12px] font-mono text-[#59627E] block">
                        Location: {f.location.file}:{f.location.line || 1}
                      </span>

                      <div className="pt-2 border-t border-[#CED5E0] flex items-center justify-between">
                        <span className="text-[12px] text-[#59627E]">CVSS Score: <strong className="text-[#A1121F]">{f.cvssScore || 9.0}</strong></span>
                        <button
                          onClick={() => handleApplyFix(f.id)}
                          className={`px-3 py-1.5 rounded-full text-[12px] font-[500] transition-colors flex items-center gap-1 cursor-pointer ${
                            isFixed
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-[#0F1B31] text-white hover:bg-[#020C21]'
                          }`}
                        >
                          {isFixed ? <Check size={12} /> : <Wrench size={12} />}
                          <span>{isFixed ? 'Patched' : 'Apply Patch'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Phase 2: P1 Architectural Fortification */}
          <div className="rounded-[20px] bg-white border border-[#F7C4A5] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#CED5E0] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-[#FCE4D6] text-[#9A3B0B] border border-[#F7C4A5]">
                  PHASE 2 · P1 HIGH
                </span>
                <h3 className="text-[16px] font-[500] text-[#020C21]">
                  Architectural Surface Fortification (Target SLA: &lt; 24 hours)
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {findings
                .filter((f) => f.severity === 'high')
                .map((f) => {
                  const isFixed = resolvedFindingIds.includes(f.id);
                  return (
                    <div
                      key={f.id}
                      className={`p-4 rounded-[16px] border transition-colors space-y-3 ${
                        isFixed
                          ? 'bg-[#E3EEF8]/30 border-[#C7DCF0]'
                          : 'bg-white border-[#DDE4EE]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-mono text-[#9A3B0B] font-medium">{f.ruleId}</span>
                        <SeverityBadge severity={f.severity} size="sm" />
                      </div>

                      <h4 className="text-[14px] font-[520] text-[#020C21]">{f.title}</h4>
                      <p className="text-[13px] text-[#59627E] line-clamp-2">{f.description}</p>
                      <span className="text-[12px] font-mono text-[#59627E] block">
                        Location: {f.location.file}:{f.location.line || 1}
                      </span>

                      <div className="pt-2 border-t border-[#CED5E0] flex items-center justify-between">
                        <span className="text-[12px] text-[#59627E]">CVSS Score: <strong className="text-[#9A3B0B]">{f.cvssScore || 7.5}</strong></span>
                        <button
                          onClick={() => handleApplyFix(f.id)}
                          className={`px-3 py-1.5 rounded-full text-[12px] font-[500] transition-colors flex items-center gap-1 cursor-pointer ${
                            isFixed
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-[#0F1B31] text-white hover:bg-[#020C21]'
                          }`}
                        >
                          {isFixed ? <Check size={12} /> : <Wrench size={12} />}
                          <span>{isFixed ? 'Patched' : 'Apply Patch'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Phase 3: CI/CD Guardrails & Automation */}
          <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#CED5E0] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-[#E6EDF6] text-[#0F182F] border border-[#CED5E0]">
                  PHASE 3 · GUARDRAILS
                </span>
                <h3 className="text-[16px] font-[500] text-[#020C21]">
                  Continuous CI/CD Prevention & Regression Testing
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
              <div className="p-4 rounded-[16px] bg-[#E6EDF6]/40 border border-[#DDE4EE] space-y-2">
                <div className="flex items-center gap-2 text-[#020C21] font-[520]">
                  <Code2 size={16} strokeWidth={1.7} className="text-[#4A78B0]" />
                  <span>1. Pre-Commit AST Linter</span>
                </div>
                <p className="text-[13px] text-[#59627E] leading-relaxed">
                  Prevent raw string template interpolation and require schema allowlists before commits can be staged.
                </p>
              </div>

              <div className="p-4 rounded-[16px] bg-[#E6EDF6]/40 border border-[#DDE4EE] space-y-2">
                <div className="flex items-center gap-2 text-[#020C21] font-[520]">
                  <Shield size={16} strokeWidth={1.7} className="text-[#4A78B0]" />
                  <span>2. PR Gating Threshold</span>
                </div>
                <p className="text-[13px] text-[#59627E] leading-relaxed">
                  Fail GitHub Action pull request checks on unauthenticated HTTP endpoints or dependencies with CVSS &gt;= 7.0.
                </p>
              </div>

              <div className="p-4 rounded-[16px] bg-[#E6EDF6]/40 border border-[#DDE4EE] space-y-2">
                <div className="flex items-center gap-2 text-[#020C21] font-[520]">
                  <Database size={16} strokeWidth={1.7} className="text-[#4A78B0]" />
                  <span>3. Lockfile Digest Audit</span>
                </div>
                <p className="text-[13px] text-[#59627E] leading-relaxed">
                  Automate continuous OSV checksum updates to prevent malicious package substitution and zero-day prototype pollution.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DEEP AUDIT EXPLANATION REPORT                                    */}
      {/* ========================================================================= */}
      {activeTab === 'explanation' && (
        <div className="space-y-6">
          <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-[#E3EEF8] text-[#1F4E79] border border-[#C7DCF0]">
                    COMPREHENSIVE AUDIT REPORT
                  </span>
                  <span className="text-[12px] font-mono text-[#59627E]">ID: REP-{scan.commitSha}-20261014</span>
                </div>
                <h2 className="text-[24px] font-[500] text-[#020C21]">
                  {scan.repositoryName} · Security Assessment & Evidence Audit
                </h2>
                <p className="text-[14px] text-[#59627E]">
                  Complete AST taint analysis, lockfile resolution, and threat actor exploit mitigation verification.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/demo"
                  className="px-4 py-2 rounded-full bg-[#0F1B31] text-white text-[13px] font-[500] hover:bg-[#020C21] transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <ArrowRight size={14} strokeWidth={1.7} />
                  <span>Inspect in Workflow Graph</span>
                </Link>
              </div>
            </div>

            {/* Assessment Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-[#CED5E0]">
              <div className="p-3 rounded-[12px] bg-[#E6EDF6]/40 border border-[#DDE4EE]">
                <span className="text-[11px] font-mono uppercase text-[#59627E] block">Max Risk</span>
                <span className="text-[24px] font-[360] text-[#A1121F]">9.4 / 10</span>
                <span className="text-[11px] text-[#A1121F]">Critical Exploitability</span>
              </div>
              <div className="p-3 rounded-[12px] bg-[#E6EDF6]/40 border border-[#DDE4EE]">
                <span className="text-[11px] font-mono uppercase text-[#59627E] block">Discovered Findings</span>
                <span className="text-[24px] font-[360] text-[#020C21]">{findings.length} Items</span>
                <span className="text-[11px] text-[#59627E]">Zero False-Positive Engine</span>
              </div>
              <div className="p-3 rounded-[12px] bg-[#E6EDF6]/40 border border-[#DDE4EE]">
                <span className="text-[11px] font-mono uppercase text-[#59627E] block">Coverage</span>
                <span className="text-[24px] font-[360] text-[#1F4E79]">{scan.coverage.coveragePercent}%</span>
                <span className="text-[11px] text-[#1F4E79]">Lockfile Resolution</span>
              </div>
              <div className="p-3 rounded-[12px] bg-[#E6EDF6]/40 border border-[#DDE4EE]">
                <span className="text-[11px] font-mono uppercase text-[#59627E] block">Dependencies</span>
                <span className="text-[24px] font-[360] text-[#020C21]">{scan.coverage.scannedDependencies} Pkgs</span>
                <span className="text-[11px] text-[#7A5200]">{scan.coverage.skippedDependencies} skipped</span>
              </div>
            </div>
          </div>

          {/* Detailed Finding Evidence Cards */}
          <div className="space-y-4">
            <h3 className="text-[18px] font-[500] text-[#020C21]">
              Exhaustive Vulnerability Evidence & Exploit Breakdown
            </h3>

            {findings.map((finding, idx) => (
              <div
                key={finding.id}
                className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#CED5E0]">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-[#E6EDF6] text-[#0F182F] font-bold">
                      Finding #{idx + 1}
                    </span>
                    <SeverityBadge severity={finding.severity} size="sm" />
                    <span className="text-[15px] font-[520] text-[#020C21]">{finding.ruleId}: {finding.title}</span>
                  </div>
                  <span className="text-[12px] font-mono text-[#59627E]">
                    {finding.location.file}:{finding.location.line || 1}
                  </span>
                </div>

                <div className="space-y-2 text-[14px] text-[#020C21]">
                  <p className="leading-relaxed font-[425] text-[#0F182F]">{finding.description}</p>
                  <p className="text-[12px] font-mono text-[#59627E]">CWE Classification: {finding.cwe}</p>
                </div>

                {/* Evidence and Code Diff */}
                {finding.remediation && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[12px] font-[520] text-[#020C21] block">Proposed Remediation Diff:</span>
                    <div className="rounded-[12px] bg-[#020C21] p-3 text-[12px] font-mono text-white overflow-x-auto">
                      <pre className="text-white/90 whitespace-pre">{finding.remediation.proposedDiff || finding.remediation.summary}</pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
