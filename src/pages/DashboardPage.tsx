import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  GitBranch,
  ArrowUpRight,
  ExternalLink,
  RefreshCw,
  Clock,
  Layers,
  CheckCircle,
  AlertTriangle,
  Play,
} from 'lucide-react';
import { api } from '../lib/api-client';
import { Repository, SecurityFinding, ScanJob } from '../types';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { Skeleton, TableSkeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';

export const DashboardPage: React.FC = () => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [recentScans, setRecentScans] = useState<ScanJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [reposData, findingsData, scansData] = await Promise.all([
        api.getRepositories(),
        api.getFindings(),
        api.getScan('scan-123'),
      ]);
      setRepositories(reposData);
      setFindings(findingsData);
      setRecentScans([scansData]);
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (error) {
    return (
      <div className="py-8">
        <ErrorState message={error} onRetry={loadData} />
      </div>
    );
  }

  const criticalAndHigh = findings.filter(
    (f) => f.severity === 'critical' || f.severity === 'high'
  );

  const totalDeps = repositories.reduce((acc, r) => acc + r.totalDependencies, 0);
  const scannedDeps = repositories.reduce((acc, r) => acc + r.scannedDependencies, 0);
  const overallCoverage = totalDeps > 0 ? ((scannedDeps / totalDeps) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-8 py-4">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[44px] leading-[1.08] font-[360] tracking-[-0.035em] text-[#020C21]">
            Security Posture
          </h1>
          <p className="text-[15px] font-[425] text-[#59627E] mt-1.5">
            Real-time security analysis across monitored repositories and verified dependency graphs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#CED5E0] px-4 py-2 text-[13px] font-[470] text-[#0F1B31] hover:bg-[#F4F7FB] transition-colors duration-150 cursor-pointer"
          >
            <RefreshCw size={14} strokeWidth={1.7} />
            <span>Refresh</span>
          </button>
          <Link
            to="/repositories"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#0F1B31] px-5 py-2 text-[13px] font-[500] text-white hover:bg-[#020C21] transition-colors duration-150 shadow-sm"
          >
            <span>Add Repository</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards (Big numbers: 56px wght 200) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)]">
          <div className="flex items-center justify-between text-[#59627E]">
            <span className="text-[13px] font-[470]">Repositories Monitored</span>
            <GitBranch size={16} strokeWidth={1.7} />
          </div>
          {loading ? (
            <Skeleton className="h-14 w-24 my-2" />
          ) : (
            <div className="text-[56px] font-[200] leading-none text-[#020C21] my-1">
              {repositories.length}
            </div>
          )}
          <div className="flex items-center gap-1 text-[13px] font-[470] text-[#59627E]">
            <span>Active codebases tracked</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)]">
          <div className="flex items-center justify-between text-[#59627E]">
            <span className="text-[13px] font-[470]">Critical & High Risks</span>
            <ShieldAlert size={16} strokeWidth={1.7} className="text-[#A1121F]" />
          </div>
          {loading ? (
            <Skeleton className="h-14 w-24 my-2" />
          ) : (
            <div className="text-[56px] font-[200] leading-none text-[#A1121F] my-1">
              {criticalAndHigh.length}
            </div>
          )}
          <Link
            to="/findings"
            className="inline-flex items-center gap-1 text-[13px] font-[470] text-[#4A78B0] hover:underline"
          >
            <span>Inspect in findings explorer</span>
            <ArrowUpRight size={13} strokeWidth={1.7} />
          </Link>
        </div>

        {/* Card 3 */}
        <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)]">
          <div className="flex items-center justify-between text-[#59627E]">
            <span className="text-[13px] font-[470]">Dependency Coverage</span>
            <Layers size={16} strokeWidth={1.7} />
          </div>
          {loading ? (
            <Skeleton className="h-14 w-24 my-2" />
          ) : (
            <div className="text-[56px] font-[200] leading-none text-[#020C21] my-1">
              {overallCoverage}%
            </div>
          )}
          <div className="text-[13px] font-[470] text-[#59627E]">
            {scannedDeps} of {totalDeps} resolved
          </div>
        </div>

        {/* Card 4 */}
        <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)]">
          <div className="flex items-center justify-between text-[#59627E]">
            <span className="text-[13px] font-[470]">Scans Executed</span>
            <Clock size={16} strokeWidth={1.7} />
          </div>
          {loading ? (
            <Skeleton className="h-14 w-24 my-2" />
          ) : (
            <div className="text-[56px] font-[200] leading-none text-[#020C21] my-1">
              1,482
            </div>
          )}
          <div className="text-[13px] font-[470] text-[#59627E]">
            <span>Average scan time: 4.8s</span>
          </div>
        </div>
      </div>

      {/* Coverage Integrity Notice (Prompt explicit emphasis) */}
      <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#7A5200]" />
              <h3 className="text-[18px] font-[500] text-[#020C21]">
                Coverage Reporting & Unresolved Lockfile Notice
              </h3>
            </div>
            <p className="text-[14px] font-[425] text-[#59627E] max-w-3xl">
              SentinelFlow never labels a partially-scanned repository as fully secure. In the active scan of
              SentinelFlow, 6 vulnerabilities were detected while 242 dependencies were skipped because
              supported lockfile versions could not be deterministically resolved. Coverage is reported as a first-class metric.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-[#E6EDF6]/60 rounded-[12px] p-3 text-[13px] font-[470]">
            <div>
              <span className="text-[#59627E] block text-[11px] uppercase">SentinelFlow Coverage</span>
              <span className="text-[#020C21] font-[520]">5.84% (15 / 257 packages)</span>
            </div>
            <div className="h-8 w-px bg-[#CED5E0]" />
            <div>
              <span className="text-[#59627E] block text-[11px] uppercase">Skip Reason</span>
              <span className="text-[#7A5200] font-[520]">242 Unresolved versions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: High Priority Findings & Repositories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Findings Card */}
        <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#CED5E0]">
              <div>
                <h3 className="text-[18px] font-[500] text-[#020C21]">Urgent Findings</h3>
                <p className="text-[13px] font-[470] text-[#59627E]">
                  Issues with verified code evidence requiring immediate remediation
                </p>
              </div>
              <Link
                to="/findings"
                className="text-[13px] font-[470] text-[#4A78B0] hover:underline"
              >
                View all ({findings.length})
              </Link>
            </div>

            {loading ? (
              <TableSkeleton rows={4} />
            ) : (
              <div className="divide-y divide-[#DDE4EE]">
                {criticalAndHigh.slice(0, 4).map((f) => (
                  <div key={f.id} className="py-3.5 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={f.severity} size="sm" />
                        <span className="text-[14px] font-[500] text-[#020C21]">
                          {f.ruleId}
                        </span>
                        <span className="text-[12px] text-[#59627E] font-mono">
                          {f.location.file}:{f.location.line || 1}
                        </span>
                      </div>
                      <p className="text-[13px] font-[425] text-[#020C21] line-clamp-1">
                        {f.title}
                      </p>
                      <p className="text-[12px] font-[425] text-[#59627E]">
                        Engine: <span className="uppercase font-mono">{f.engine}</span> · Confidence: {f.confidence}
                      </p>
                    </div>
                    <Link
                      to={`/findings?id=${f.id}`}
                      className="shrink-0 rounded-full border border-[#CED5E0] bg-white px-3 py-1 text-[12px] font-[470] text-[#0F1B31] hover:bg-[#F4F7FB] transition-colors duration-150"
                    >
                      Evidence
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="pt-4 mt-2 border-t border-[#CED5E0] flex justify-end">
            <Link
              to="/remediation"
              className="text-[13px] font-[470] text-[#0F1B31] hover:underline inline-flex items-center gap-1"
            >
              <span>Review proposed patches</span>
              <ArrowUpRight size={13} strokeWidth={1.7} />
            </Link>
          </div>
        </div>

        {/* Most Affected Repositories Card */}
        <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#CED5E0]">
              <div>
                <h3 className="text-[18px] font-[500] text-[#020C21]">Tracked Codebases</h3>
                <p className="text-[13px] font-[470] text-[#59627E]">
                  Status, dependency resolution coverage, and vulnerability counts
                </p>
              </div>
              <Link
                to="/repositories"
                className="text-[13px] font-[470] text-[#4A78B0] hover:underline"
              >
                View all ({repositories.length})
              </Link>
            </div>

            {loading ? (
              <TableSkeleton rows={4} />
            ) : (
              <div className="divide-y divide-[#DDE4EE]">
                {repositories.map((repo) => (
                  <div key={repo.id} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/repositories/${repo.id}`}
                          className="text-[14px] font-[500] text-[#020C21] hover:underline hover:text-[#2f5f9e]"
                        >
                          {repo.name}
                        </Link>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#E6EDF6] text-[#59627E] font-mono">
                          {repo.defaultBranch}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[12px] text-[#59627E]">
                        <span>{repo.frameworks.map((f) => f.name).join(', ') || 'Frameworks'}</span>
                        <span>·</span>
                        <span>Coverage: {repo.coveragePercent}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {repo.openFindingsCount.critical > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-[520] bg-[#FADADD] text-[#A1121F] border border-[#F4AEB6]">
                          {repo.openFindingsCount.critical} Crit
                        </span>
                      )}
                      {repo.openFindingsCount.high > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-[520] bg-[#FCE4D6] text-[#9A3B0B] border border-[#F7C4A5]">
                          {repo.openFindingsCount.high} High
                        </span>
                      )}
                      <Link
                        to={`/repositories/${repo.id}`}
                        className="rounded-full border border-[#CED5E0] bg-white px-3 py-1 text-[12px] font-[470] text-[#0F1B31] hover:bg-[#F4F7FB] transition-colors duration-150"
                      >
                        Inspect
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="pt-4 mt-2 border-t border-[#CED5E0] flex justify-end">
            <Link
              to="/attack-paths"
              className="text-[13px] font-[470] text-[#0F1B31] hover:underline inline-flex items-center gap-1"
            >
              <span>Explore attack paths</span>
              <ArrowUpRight size={13} strokeWidth={1.7} />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Scans Activity */}
      <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)]">
        <div className="flex items-center justify-between pb-4 border-b border-[#CED5E0] mb-4">
          <div>
            <h3 className="text-[18px] font-[500] text-[#020C21]">Recent Scan Executions</h3>
            <p className="text-[13px] font-[470] text-[#59627E]">
              Stage execution status, duration timings, and commit snapshots
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead>
              <tr className="border-b border-[#DDE4EE] text-[12px] font-[470] text-[#59627E] uppercase">
                <th className="pb-3 pl-1 font-[470]">Repository</th>
                <th className="pb-3 font-[470]">Commit SHA</th>
                <th className="pb-3 font-[470]">Profile</th>
                <th className="pb-3 font-[470]">Status</th>
                <th className="pb-3 font-[470]">Findings</th>
                <th className="pb-3 font-[470]">Executed At</th>
                <th className="pb-3 pr-1 text-right font-[470]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DDE4EE]">
              {recentScans.map((scan) => (
                <tr key={scan.id} className="hover:bg-[#E6EDF6]/40 transition-colors">
                  <td className="py-3.5 pl-1 font-[500] text-[#020C21]">
                    {scan.repositoryName}
                  </td>
                  <td className="py-3.5 font-mono text-[13px] text-[#59627E]">
                    {scan.commitSha}
                  </td>
                  <td className="py-3.5 capitalize text-[#59627E]">{scan.profile}</td>
                  <td className="py-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-[500] bg-[#FBF0D9] text-[#7A5200] border border-[#F3DCAB]">
                      <AlertTriangle size={12} strokeWidth={1.7} />
                      <span>{scan.status}</span>
                    </span>
                  </td>
                  <td className="py-3.5">
                    <span className="text-[#A1121F] font-[520]">
                      {scan.findingsCount.critical + scan.findingsCount.high + scan.findingsCount.medium} found
                    </span>
                  </td>
                  <td className="py-3.5 text-[#59627E] text-[13px]">
                    {new Date(scan.startedAt).toLocaleString()}
                  </td>
                  <td className="py-3.5 pr-1 text-right">
                    <Link
                      to={`/scans/${scan.id}`}
                      className="inline-flex items-center gap-1 rounded-full border border-[#CED5E0] bg-white px-3 py-1 text-[12px] font-[470] text-[#0F1B31] hover:bg-[#F4F7FB] transition-colors duration-150"
                    >
                      <span>Progress & Stages</span>
                      <ExternalLink size={12} strokeWidth={1.7} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
