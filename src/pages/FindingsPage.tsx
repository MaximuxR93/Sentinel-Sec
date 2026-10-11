import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ShieldAlert,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  X,
  FileCode,
  CheckCircle,
  Copy,
  Wrench,
  AlertTriangle,
  Zap,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { api } from '../lib/api-client';
import { SecurityFinding, Severity, SecurityEngineType, FindingStatus } from '../types';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';

export const FindingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Groq AI Analysis State
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    analysis: string;
    model: string;
    provider: string;
  } | null>(null);

  // Filters
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedEngine, setSelectedEngine] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected finding drawer
  const [activeFinding, setActiveFinding] = useState<SecurityFinding | null>(null);

  // Pagination (25 + "Load more")
  const [displayCount, setDisplayCount] = useState(25);

  const loadFindings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getFindings();
      setFindings(data);

      const targetId = searchParams.get('id');
      if (targetId) {
        const found = data.find((f) => f.id === targetId);
        if (found) setActiveFinding(found);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load findings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFindings();
  }, []);

  const handleSelectFinding = (finding: SecurityFinding) => {
    setActiveFinding(finding);
    setAiAnalysisResult(null);
    setSearchParams({ id: finding.id });
  };

  const handleCloseDrawer = () => {
    setActiveFinding(null);
    setAiAnalysisResult(null);
    setSearchParams({});
  };

  const handleRunAiAnalysis = async () => {
    if (!activeFinding) return;
    setAiAnalyzing(true);
    try {
      const codeSnippet =
        activeFinding.evidence.map((e) => e.snippet || '').join('\n') || 'Source context unavailable';
      const res = await api.explainWithAi({
        title: activeFinding.title,
        ruleId: activeFinding.ruleId,
        cwe: activeFinding.cwe || 'CWE-Unknown',
        file: activeFinding.location.file,
        codeSnippet,
        explanation: activeFinding.description,
        cvss: activeFinding.cvssScore,
      });
      setAiAnalysisResult(res);
    } catch (err: any) {
      alert(`AI Analysis error: ${err.message}`);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleUpdateStatus = async (status: FindingStatus) => {
    if (!activeFinding) return;
    try {
      const updated = await api.updateFindingStatus(activeFinding.id, status);
      setActiveFinding(updated);
      setFindings(findings.map((f) => (f.id === updated.id ? updated : f)));
    } catch (err: any) {
      alert(err?.message || 'Failed to update status');
    }
  };

  const filtered = findings.filter((f) => {
    if (selectedSeverity !== 'all' && f.severity !== selectedSeverity) return false;
    if (selectedEngine !== 'all' && f.engine !== selectedEngine) return false;
    if (selectedStatus !== 'all' && f.status !== selectedStatus) return false;
    if (
      searchQuery &&
      !f.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !f.ruleId.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !f.location.file.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const paginated = filtered.slice(0, displayCount);

  return (
    <div className="space-y-6 py-4">
      {/* Title */}
      <div>
        <h1 className="text-[44px] leading-[1.08] font-[360] tracking-[-0.035em] text-[#020C21]">
          Security Findings
        </h1>
        <p className="text-[15px] font-[425] text-[#59627E] mt-1.5">
          Deterministic and evidence-backed vulnerabilities identified across AST, SCA, and secrets engines.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-white border border-[#CED5E0] rounded-[16px] p-3 shadow-sm">
        <div className="flex items-center gap-2 flex-1 w-full px-2">
          <Search size={16} strokeWidth={1.7} className="text-[#59627E]" />
          <input
            type="text"
            placeholder="Search by title, rule ID (e.g. SAST-CMD-002), or file..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-[14px] text-[#020C21] placeholder-[#59627E] outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="rounded-full bg-white border border-[#CED5E0] px-3 py-1.5 text-[13px] font-[470] text-[#020C21] focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={selectedEngine}
            onChange={(e) => setSelectedEngine(e.target.value)}
            className="rounded-full bg-white border border-[#CED5E0] px-3 py-1.5 text-[13px] font-[470] text-[#020C21] focus:outline-none"
          >
            <option value="all">All Engines</option>
            <option value="sca">SCA (OSV)</option>
            <option value="sast">SAST (Code)</option>
            <option value="secrets">Secrets</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="auth_flow">Auth Flow</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-full bg-white border border-[#CED5E0] px-3 py-1.5 text-[13px] font-[470] text-[#020C21] focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="accepted_risk">Accepted Risk</option>
            <option value="fixed">Fixed</option>
          </select>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadFindings} />
      ) : loading ? (
        <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6">
          <TableSkeleton rows={8} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No findings matched"
          description="Try broadening your filter criteria or execute a deep scan on the repository."
          actionText="Clear Filters"
          onAction={() => {
            setSelectedSeverity('all');
            setSelectedEngine('all');
            setSelectedStatus('all');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="rounded-[20px] bg-white border border-[#DDE4EE] shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#E6EDF6]/50 border-b border-[#CED5E0] text-[12px] font-[470] text-[#59627E] uppercase">
                <tr>
                  <th className="py-3 px-4 font-[470]">Severity</th>
                  <th className="py-3 px-4 font-[470]">Finding Title & ID</th>
                  <th className="py-3 px-4 font-[470]">Location</th>
                  <th className="py-3 px-4 font-[470]">Engine</th>
                  <th className="py-3 px-4 font-[470]">Confidence</th>
                  <th className="py-3 px-4 font-[470]">Status</th>
                  <th className="py-3 px-4 text-right font-[470]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE4EE]">
                {paginated.map((finding) => (
                  <tr
                    key={finding.id}
                    onClick={() => handleSelectFinding(finding)}
                    className="hover:bg-[#E6EDF6]/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <SeverityBadge severity={finding.severity} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-[500] text-[#020C21] line-clamp-1">{finding.title}</div>
                      <div className="text-[12px] font-mono text-[#59627E]">{finding.ruleId}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[13px] text-[#020C21]">
                      {finding.location.file}:{finding.location.line || 1}
                    </td>
                    <td className="py-3.5 px-4 uppercase font-mono text-[12px] text-[#59627E]">
                      {finding.engine}
                    </td>
                    <td className="py-3.5 px-4 capitalize text-[13px] text-[#59627E]">
                      {finding.confidence}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize text-[12px] font-[470] text-[#0F1B31] px-2 py-0.5 rounded-full bg-[#E6EDF6]">
                        {finding.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectFinding(finding);
                        }}
                        className="rounded-full border border-[#CED5E0] bg-white px-3 py-1 text-[12px] font-[470] text-[#0F1B31] hover:bg-[#F4F7FB] transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination: 25 + "Load more" */}
          {filtered.length > displayCount && (
            <div className="p-4 border-t border-[#CED5E0] text-center bg-white">
              <button
                onClick={() => setDisplayCount((c) => c + 25)}
                className="rounded-full bg-white border border-[#CED5E0] px-6 py-2 text-[13px] font-[470] text-[#0F1B31] hover:bg-[#F4F7FB] transition-colors duration-150 cursor-pointer"
              >
                Load More ({filtered.length - displayCount} remaining)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Slide-over Evidence Detail Panel */}
      {activeFinding && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-none">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl border-l border-[#CED5E0] flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-[#CED5E0] flex items-start justify-between bg-white sticky top-0 z-10">
              <div className="space-y-1 pr-4">
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={activeFinding.severity} size="md" />
                  <span className="text-[13px] font-mono text-[#59627E]">
                    {activeFinding.ruleId}
                  </span>
                  <span className="text-[12px] text-[#59627E] uppercase font-mono">
                    [{activeFinding.engine}]
                  </span>
                </div>
                <h2 className="text-[20px] font-[500] text-[#020C21] leading-tight">
                  {activeFinding.title}
                </h2>
              </div>
              <button
                onClick={handleCloseDrawer}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#59627E] hover:text-[#020C21] hover:bg-[#E6EDF6] transition-colors cursor-pointer shrink-0"
              >
                <X size={18} strokeWidth={1.7} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6 flex-1">
              {/* Location & Component Info */}
              <div className="rounded-[14px] bg-[#E6EDF6]/50 p-4 border border-[#DDE4EE] space-y-2">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[#59627E]">Location:</span>
                  <span className="font-mono text-[#020C21]">
                    {activeFinding.location.file}:{activeFinding.location.line || 1}
                  </span>
                </div>
                {activeFinding.component && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#59627E]">Affected Package:</span>
                    <span className="font-mono text-[#020C21]">
                      {activeFinding.component.name} @ {activeFinding.component.version}
                    </span>
                  </div>
                )}
                {activeFinding.cwe && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#59627E]">Vulnerability Standard:</span>
                    <span className="font-[470] text-[#020C21]">{activeFinding.cwe}</span>
                  </div>
                )}
                {activeFinding.cvssScore && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#59627E]">CVSS v3.1 Score:</span>
                    <span className="font-[520] text-[#A1121F]">{activeFinding.cvssScore} / 10.0</span>
                  </div>
                )}
              </div>

              {/* Description (Plain Text Only per prompt specification) */}
              <div>
                <h3 className="text-[15px] font-[500] text-[#020C21] mb-1.5">
                  Vulnerability Description
                </h3>
                <p className="text-[14px] font-[425] text-[#59627E] leading-relaxed whitespace-pre-wrap">
                  {activeFinding.description}
                </p>
              </div>

              {/* Groq AI Deep AST Intelligence Card */}
              <div className="rounded-[16px] bg-[#F8FAFD] border border-[#CED5E0] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap size={14} strokeWidth={2} className="text-[#2f5f9e]" />
                    <span className="text-[14px] font-[520] text-[#020C21]">
                      Groq AST Deep Analysis
                    </span>
                    <span className="font-mono text-[10px] text-[#1F4E79] bg-[#E3EEF8] px-2 py-0.5 rounded-full font-[500]">
                      openai/gpt-oss-120b
                    </span>
                  </div>

                  <button
                    onClick={handleRunAiAnalysis}
                    disabled={aiAnalyzing}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#0F1B31] px-3.5 py-1.5 text-[12px] font-[500] text-white hover:bg-[#020C21] disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {aiAnalyzing ? (
                      <>
                        <RefreshCw size={12} className="animate-spin text-[#4A78B0]" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={12} strokeWidth={1.7} className="text-[#4A78B0]" />
                        <span>{aiAnalysisResult ? 'Re-run Groq' : 'Run Groq Analysis'}</span>
                      </>
                    )}
                  </button>
                </div>

                {aiAnalysisResult ? (
                  <div className="text-[13px] font-[425] text-[#0F182F] leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto pt-2 border-t border-[#CED5E0]">
                    {aiAnalysisResult.analysis}
                  </div>
                ) : (
                  <p className="text-[12px] text-[#59627E] leading-normal">
                    Generate an LLM-grounded breakdown of the AST data-flow taint sink, adversary exploit mechanics, and defense-in-depth mitigations using Groq’s 120B reasoning model.
                  </p>
                )}
              </div>

              {/* Exact Evidence Snippets */}
              <div>
                <h3 className="text-[15px] font-[500] text-[#020C21] mb-2 flex items-center justify-between">
                  <span>Verifiable Evidence</span>
                  <span className="text-[12px] font-mono text-[#59627E]">Deterministic Source</span>
                </h3>

                {activeFinding.evidence.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-[14px] bg-[#020C21] text-white p-4 font-mono text-[12px] space-y-2 mb-3"
                  >
                    <div className="flex items-center justify-between text-[#CED5E0]/70 text-[11px] pb-2 border-b border-white/10 font-sans">
                      <span>{ev.filePath} (Lines {ev.startLine}–{ev.endLine})</span>
                      <span className="uppercase text-[#4A78B0]">{ev.type}</span>
                    </div>

                    {ev.snippet && (
                      <pre className="overflow-x-auto whitespace-pre leading-relaxed text-[#CED5E0]">
                        {ev.snippet}
                      </pre>
                    )}

                    {ev.description && (
                      <div className="text-[11px] text-[#CED5E0]/70 pt-2 border-t border-white/10 font-sans">
                        {ev.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Remediation & Proposed Diff Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[15px] font-[500] text-[#020C21]">Suggested Remediation</h3>
                  <Link
                    to={`/remediation?findingId=${activeFinding.id}`}
                    className="text-[13px] font-[470] text-[#4A78B0] hover:underline inline-flex items-center gap-1"
                  >
                    <Wrench size={13} strokeWidth={1.7} />
                    <span>Open in Remediation Workspace</span>
                  </Link>
                </div>

                <p className="text-[14px] font-[425] text-[#59627E] mb-3 leading-relaxed whitespace-pre-wrap">
                  {activeFinding.remediation.summary}
                </p>

                {activeFinding.remediation.proposedDiff && (
                  <div className="rounded-[14px] bg-[#0F182F] text-[#CED5E0] p-4 font-mono text-[12px] overflow-x-auto">
                    <pre className="whitespace-pre">
                      {activeFinding.remediation.proposedDiff}
                    </pre>
                  </div>
                )}
              </div>

              {/* Status Update Actions */}
              <div className="border-t border-[#CED5E0] pt-4 flex items-center justify-between">
                <span className="text-[13px] font-[470] text-[#59627E]">Manage Finding Status:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus('accepted_risk')}
                    className="rounded-full bg-white border border-[#CED5E0] px-3.5 py-1.5 text-[12px] font-[470] text-[#7A5200] hover:bg-[#FBF0D9] transition-colors"
                  >
                    Accept Risk
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('fixed')}
                    className="rounded-full bg-[#0F1B31] px-4 py-1.5 text-[12px] font-[500] text-white hover:bg-[#020C21] transition-colors"
                  >
                    Mark as Fixed
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
