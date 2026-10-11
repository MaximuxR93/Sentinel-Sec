import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  GitBranch,
  ExternalLink,
  ShieldAlert,
  Play,
  Layers,
  FileCode,
  Network,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import { api } from '../lib/api-client';
import { Repository, SecurityFinding } from '../types';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';

export const RepositoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [repository, setRepository] = useState<Repository | null>(null);
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([api.getRepository(id), api.getFindings()])
      .then(([repoData, findingsData]) => {
        setRepository(repoData);
        setFindings(findingsData.filter((f) => f.repositoryId === id || id === 'repo-sentinelflow'));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (error) {
    return (
      <div className="py-6">
        <ErrorState message={error} />
      </div>
    );
  }

  if (loading || !repository) {
    return (
      <div className="space-y-6 py-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Back button & Title */}
      <div className="flex items-center justify-between">
        <Link
          to="/repositories"
          className="inline-flex items-center gap-1.5 text-[13px] font-[470] text-[#59627E] hover:text-[#020C21] transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={1.7} />
          <span>Back to Repositories</span>
        </Link>
        <Link
          to={`/scans/scan-123`}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#0F1B31] px-5 py-2 text-[13px] font-[500] text-white hover:bg-[#020C21] transition-colors duration-150 shadow-sm"
        >
          <Play size={13} strokeWidth={1.7} />
          <span>Trigger New Scan</span>
        </Link>
      </div>

      {/* Main Repository Header Card */}
      <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)]">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-[28px] font-[500] text-[#020C21]">
                {repository.name}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#E6EDF6] px-2.5 py-0.5 text-[12px] font-mono text-[#59627E]">
                <GitBranch size={12} strokeWidth={1.7} />
                <span>{repository.defaultBranch}</span>
              </span>
              <span className="font-mono text-[12px] text-[#59627E]">
                SHA: {repository.lastCommitSha}
              </span>
            </div>
            <p className="text-[14px] text-[#59627E] flex items-center gap-2">
              <span>{repository.url}</span>
              <a
                href={repository.url}
                target="_blank"
                rel="noreferrer"
                className="text-[#4A78B0] hover:text-[#020C21]"
              >
                <ExternalLink size={14} strokeWidth={1.7} />
              </a>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[12px] font-[520] bg-[#FADADD] text-[#A1121F] border border-[#F4AEB6]">
              {repository.openFindingsCount.critical} Critical
            </span>
            <span className="px-3 py-1 rounded-full text-[12px] font-[520] bg-[#FCE4D6] text-[#9A3B0B] border border-[#F7C4A5]">
              {repository.openFindingsCount.high} High
            </span>
            <span className="px-3 py-1 rounded-full text-[12px] font-[520] bg-[#FBF0D9] text-[#7A5200] border border-[#F3DCAB]">
              {repository.openFindingsCount.medium} Medium
            </span>
          </div>
        </div>

        {/* Language Breakdown Bar */}
        <div className="mt-6 pt-6 border-t border-[#CED5E0] space-y-2">
          <div className="flex items-center justify-between text-[12px] font-[470] text-[#59627E]">
            <span>Language Distribution</span>
            <span>
              {repository.languages.map((l) => `${l.name} ${l.percentage}%`).join(' · ')}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#E6EDF6] overflow-hidden flex">
            {repository.languages.map((lang, idx) => (
              <div
                key={idx}
                style={{
                  width: `${lang.percentage}%`,
                  backgroundColor: idx === 0 ? '#0F1B31' : idx === 1 ? '#4A78B0' : '#CED5E0',
                }}
                className="h-full"
                title={`${lang.name}: ${lang.percentage}%`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Frameworks & Manifest Evidence vs Coverage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Framework Evidence Card */}
        <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)]">
          <h3 className="text-[18px] font-[500] text-[#020C21] mb-1">
            Framework & Component Detection
          </h3>
          <p className="text-[13px] font-[470] text-[#59627E] mb-4">
            Evidence-backed detection signals extracted from source trees
          </p>

          <div className="space-y-3">
            {repository.frameworks.map((fw, idx) => (
              <div
                key={idx}
                className="p-3 rounded-[12px] bg-[#E6EDF6]/40 border border-[#DDE4EE] space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-[520] text-[#020C21] text-[14px]">{fw.name}</span>
                  <span className="text-[12px] font-mono text-[#4A78B0]">
                    {(fw.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
                <p className="text-[12px] text-[#59627E] font-mono">{fw.evidence}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-[#CED5E0]">
            <span className="block text-[13px] font-[470] text-[#59627E] mb-2">
              Recognized Manifest Files:
            </span>
            <div className="flex flex-wrap gap-2">
              {repository.manifests.map((m, idx) => (
                <span
                  key={idx}
                  className="rounded-full bg-white border border-[#CED5E0] px-3 py-1 text-[12px] font-mono text-[#0F182F]"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Dependency Coverage & Skip Breakdown */}
        <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] flex flex-col justify-between">
          <div>
            <h3 className="text-[18px] font-[500] text-[#020C21] mb-1">
              Dependency Resolution & OSV Coverage
            </h3>
            <p className="text-[13px] font-[470] text-[#59627E] mb-4">
              Breakdown of resolved packages versus skipped manifest declarations
            </p>

            <div className="grid grid-cols-3 gap-3 text-center mb-4">
              <div className="p-3 rounded-[12px] bg-[#E6EDF6]/40 border border-[#DDE4EE]">
                <span className="text-[11px] uppercase text-[#59627E] block">Declared</span>
                <span className="text-[24px] font-[360] text-[#020C21]">
                  {repository.totalDependencies}
                </span>
              </div>
              <div className="p-3 rounded-[12px] bg-[#E6EDF6]/40 border border-[#DDE4EE]">
                <span className="text-[11px] uppercase text-[#59627E] block">Scanned</span>
                <span className="text-[24px] font-[360] text-[#1F4E79]">
                  {repository.scannedDependencies}
                </span>
              </div>
              <div className="p-3 rounded-[12px] bg-[#E6EDF6]/40 border border-[#DDE4EE]">
                <span className="text-[11px] uppercase text-[#59627E] block">Skipped</span>
                <span className="text-[24px] font-[360] text-[#7A5200]">
                  {repository.skippedDependencies}
                </span>
              </div>
            </div>

            <div className="rounded-[12px] bg-[#FBF0D9]/30 border border-[#F3DCAB] p-3 text-[13px] text-[#7A5200] space-y-1">
              <span className="font-[520] block">Lockfile Integrity Reason:</span>
              <p>
                {repository.skippedDependencies} dependencies were skipped because lockfile entries
                did not specify exact resolved checksums/versions.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#CED5E0] flex justify-end">
            <Link
              to="/attack-paths"
              className="inline-flex items-center gap-1.5 text-[13px] font-[470] text-[#4A78B0] hover:underline"
            >
              <Network size={14} strokeWidth={1.7} />
              <span>Inspect Architecture Attack Paths</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Security Findings for this Repo */}
      <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)]">
        <div className="flex items-center justify-between pb-4 border-b border-[#CED5E0] mb-4">
          <div>
            <h3 className="text-[18px] font-[500] text-[#020C21]">
              Verified Security Findings ({findings.length})
            </h3>
            <p className="text-[13px] font-[470] text-[#59627E]">
              Correlated vulnerability findings with exact file and line references
            </p>
          </div>
          <Link
            to="/findings"
            className="text-[13px] font-[470] text-[#4A78B0] hover:underline"
          >
            Open findings explorer
          </Link>
        </div>

        <div className="divide-y divide-[#DDE4EE]">
          {findings.map((f) => (
            <div key={f.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={f.severity} size="sm" />
                  <span className="text-[14px] font-[500] text-[#020C21]">{f.ruleId}:</span>
                  <span className="text-[14px] font-[425] text-[#020C21]">{f.title}</span>
                </div>
                <p className="text-[13px] font-mono text-[#59627E]">
                  {f.location.file}:{f.location.line || 1} · Engine: <span className="uppercase">{f.engine}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/findings?id=${f.id}`}
                  className="rounded-full border border-[#CED5E0] bg-white px-3 py-1.5 text-[12px] font-[470] text-[#0F1B31] hover:bg-[#F4F7FB] transition-colors duration-150"
                >
                  View Evidence
                </Link>
                <Link
                  to={`/remediation?findingId=${f.id}`}
                  className="rounded-full bg-[#0F1B31] px-3.5 py-1.5 text-[12px] font-[500] text-white hover:bg-[#020C21] transition-colors duration-150"
                >
                  Review Patch
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
