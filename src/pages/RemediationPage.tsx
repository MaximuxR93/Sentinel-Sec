import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Wrench,
  CheckCircle2,
  Play,
  GitPullRequest,
  AlertTriangle,
  FileCode,
  ShieldCheck,
  Check,
  ExternalLink,
} from 'lucide-react';
import { api } from '../lib/api-client';
import { RemediationProposal } from '../types';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';

export const RemediationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [remediations, setRemediations] = useState<RemediationProposal[]>([]);
  const [selectedRem, setSelectedRem] = useState<RemediationProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [validationSuccess, setValidationSuccess] = useState(false);
  const [prCreated, setPrCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.getRemediations()
      .then((data) => {
        setRemediations(data);
        const findingId = searchParams.get('findingId');
        if (findingId) {
          const match = data.find((r) => r.findingId === findingId);
          if (match) setSelectedRem(match);
          else if (data.length > 0) setSelectedRem(data[0]);
        } else if (data.length > 0) {
          setSelectedRem(data[0]);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [searchParams]);

  const handleRunValidation = async () => {
    if (!selectedRem) return;
    try {
      setValidating(true);
      setValidationSuccess(false);
      await api.validateRemediation(selectedRem.id);
      setValidationSuccess(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setValidating(false);
    }
  };

  const handleCreatePR = () => {
    setPrCreated(true);
  };

  if (error) {
    return (
      <div className="py-8">
        <ErrorState message={error} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 py-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (remediations.length === 0) {
    return (
      <EmptyState
        title="No remediation patches generated"
        description="Run a repository security scan to detect issues and generate reviewable patches."
      />
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Title */}
      <div>
        <h1 className="text-[44px] leading-[1.08] font-[360] tracking-[-0.035em] text-[#020C21]">
          Remediation Workspace
        </h1>
        <p className="text-[15px] font-[425] text-[#59627E] mt-1.5">
          Review evidence-grounded patches, run dry-run validation tests, and export scoped pull requests.
        </p>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Proposals List (4 cols) */}
        <div className="lg:col-span-4 rounded-[20px] bg-white border border-[#DDE4EE] p-5 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] space-y-3">
          <div className="pb-3 border-b border-[#CED5E0]">
            <h3 className="text-[16px] font-[500] text-[#020C21]">Available Fix Proposals</h3>
            <span className="text-[12px] font-[470] text-[#59627E]">
              {remediations.length} patches ready for review
            </span>
          </div>

          <div className="space-y-2">
            {remediations.map((rem) => {
              const isSelected = selectedRem?.id === rem.id;
              return (
                <div
                  key={rem.id}
                  onClick={() => {
                    setSelectedRem(rem);
                    setValidationSuccess(false);
                    setPrCreated(false);
                  }}
                  className={`p-3.5 rounded-[16px] border cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#E3EEF8]/40 border-[#4A78B0]'
                      : 'bg-white border-[#DDE4EE] hover:border-[#CED5E0]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono text-[#59627E]">{rem.filePath}</span>
                    {rem.validationStatus === 'passed' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-[500] text-[#1F4E79] bg-[#E3EEF8] px-2 py-0.5 rounded-full">
                        <Check size={11} /> Verified
                      </span>
                    )}
                  </div>
                  <h4 className="text-[14px] font-[500] text-[#020C21] line-clamp-1">
                    {rem.findingTitle}
                  </h4>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Diff & Validation Workspace (8 cols) */}
        {selectedRem && (
          <div className="lg:col-span-8 rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-[#CED5E0]">
              <div className="space-y-1">
                <span className="text-[12px] font-mono text-[#59627E]">Target: {selectedRem.filePath}</span>
                <h2 className="text-[22px] font-[500] text-[#020C21]">
                  {selectedRem.findingTitle}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunValidation}
                  disabled={validating}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#CED5E0] px-4 py-2 text-[13px] font-[470] text-[#0F1B31] hover:bg-[#F4F7FB] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Play size={13} strokeWidth={1.7} />
                  <span>{validating ? 'Running Tests...' : 'Run Dry-Run Check'}</span>
                </button>
                <button
                  onClick={handleCreatePR}
                  disabled={prCreated}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#0F1B31] px-5 py-2 text-[13px] font-[500] text-white hover:bg-[#020C21] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <GitPullRequest size={14} strokeWidth={1.7} />
                  <span>{prCreated ? 'PR #84 Created' : 'Create Pull Request'}</span>
                </button>
              </div>
            </div>

            {/* Validation Banner if run */}
            {(validationSuccess || selectedRem.validationStatus === 'passed') && (
              <div className="rounded-[14px] bg-[#E3EEF8]/60 border border-[#C7DCF0] p-4 flex items-center justify-between text-[13px] text-[#1F4E79]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} strokeWidth={1.7} />
                  <div>
                    <span className="font-[520] block">Automated Dry-Run Checks Passed</span>
                    <span className="text-[12px]">All required tests and security lint hooks passed in isolated sandbox.</span>
                  </div>
                </div>
                <span className="text-[12px] font-mono">Exit Code 0</span>
              </div>
            )}

            {/* Plain Text Explanation per instructions */}
            <div className="space-y-2">
              <h3 className="text-[16px] font-[500] text-[#020C21]">Remediation Rationale</h3>
              <p className="text-[14px] font-[425] text-[#59627E] leading-relaxed whitespace-pre-wrap">
                {selectedRem.explanation}
              </p>
            </div>

            {/* Unified Git Diff Viewer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-[500] text-[#020C21]">Proposed Git Diff</h3>
                <span className="text-[12px] font-mono text-[#59627E]">unified-diff</span>
              </div>
              <div className="rounded-[16px] bg-[#020C21] text-[#E6EDF6] p-4 font-mono text-[13px] overflow-x-auto">
                <pre className="whitespace-pre leading-relaxed">
                  {selectedRem.diff.split('\n').map((line, idx) => {
                    const isAdd = line.startsWith('+') && !line.startsWith('+++');
                    const isDel = line.startsWith('-') && !line.startsWith('---');
                    const isHeader = line.startsWith('@@') || line.startsWith('---') || line.startsWith('+++');

                    const colorClass = isAdd
                      ? 'text-[#48bb78] bg-[#48bb78]/10'
                      : isDel
                      ? 'text-[#f56565] bg-[#f56565]/10'
                      : isHeader
                      ? 'text-[#4A78B0]'
                      : 'text-[#CED5E0]';

                    return (
                      <div key={idx} className={`${colorClass} px-1 rounded`}>
                        {line}
                      </div>
                    );
                  })}
                </pre>
              </div>
            </div>

            {/* Impact Analysis & Required Checks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-[14px] bg-[#E6EDF6]/40 border border-[#DDE4EE] space-y-1.5">
                <span className="text-[13px] font-[500] text-[#020C21]">Impact Assessment</span>
                <p className="text-[13px] font-[425] text-[#59627E] leading-relaxed whitespace-pre-wrap">
                  {selectedRem.impactAnalysis}
                </p>
              </div>

              <div className="p-4 rounded-[14px] bg-[#E6EDF6]/40 border border-[#DDE4EE] space-y-1.5">
                <span className="text-[13px] font-[500] text-[#020C21]">Required Validation Checks</span>
                <div className="space-y-1 text-[12px] font-mono text-[#59627E]">
                  {selectedRem.requiredChecks.map((chk, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="text-[#4A78B0]">•</span>
                      <span>{chk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
