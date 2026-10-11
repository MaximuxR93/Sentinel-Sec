import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GitBranch,
  Search,
  Plus,
  ExternalLink,
  ShieldAlert,
  Layers,
  CheckCircle,
  FileCode,
  Play,
} from 'lucide-react';
import { api } from '../lib/api-client';
import { Repository } from '../types';
import { Skeleton, TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Modal } from '../components/ui/Modal';

export const RepositoriesPage: React.FC = () => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newBranch, setNewBranch] = useState('main');
  const [submitting, setSubmitting] = useState(false);

  const loadRepos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getRepositories();
      setRepositories(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepos();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    try {
      setSubmitting(true);
      const newRepo = await api.registerRepository(newUrl, newBranch);
      setRepositories([newRepo, ...repositories]);
      setIsModalOpen(false);
      setNewUrl('');
    } catch (err: any) {
      alert(err?.message || 'Failed to register repository');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = repositories.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.url.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[44px] leading-[1.08] font-[360] tracking-[-0.035em] text-[#020C21]">
            Repositories
          </h1>
          <p className="text-[15px] font-[425] text-[#59627E] mt-1.5">
            Registered codebases with fingerprinting, lockfile resolution, and vulnerability posture.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[#0F1B31] px-5 py-2 text-[14px] font-[500] text-white hover:bg-[#020C21] transition-colors duration-150 cursor-pointer shadow-sm self-start md:self-auto"
        >
          <Plus size={16} strokeWidth={1.7} />
          <span>Register Repository</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3 bg-white border border-[#CED5E0] rounded-[16px] px-4 py-2.5 shadow-sm">
        <Search size={18} strokeWidth={1.7} className="text-[#59627E]" />
        <input
          type="text"
          placeholder="Filter repositories by name, language, or URL..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-[14px] text-[#020C21] placeholder-[#59627E] outline-none"
        />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={loadRepos} />
      ) : loading ? (
        <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6">
          <TableSkeleton rows={5} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No repositories found"
          description={search ? 'No repositories match your filter.' : 'Register a GitHub repository to begin security analysis.'}
          actionText={search ? undefined : 'Register Repository'}
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((repo) => (
            <div
              key={repo.id}
              className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] hover:border-[#CED5E0] transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Link
                      to={`/repositories/${repo.id}`}
                      className="text-[20px] font-[500] text-[#020C21] hover:text-[#2f5f9e] hover:underline"
                    >
                      {repo.name}
                    </Link>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#E6EDF6] px-2.5 py-0.5 text-[12px] font-mono text-[#59627E]">
                      <GitBranch size={12} strokeWidth={1.7} />
                      <span>{repo.defaultBranch}</span>
                    </span>
                    <span className="font-mono text-[12px] text-[#59627E]">
                      {repo.lastCommitSha}
                    </span>
                  </div>

                  <p className="text-[13px] font-[425] text-[#59627E] flex items-center gap-2">
                    <span>{repo.url}</span>
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#4A78B0] hover:text-[#020C21]"
                    >
                      <ExternalLink size={13} strokeWidth={1.7} />
                    </a>
                  </p>

                  {/* Framework and manifest badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[12px]">
                    <span className="font-[470] text-[#59627E]">Frameworks:</span>
                    {repo.frameworks.map((f, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-[#E6EDF6]/80 px-2 py-0.5 text-[#0F182F] font-[470]"
                        title={f.evidence}
                      >
                        {f.name} ({(f.confidence * 100).toFixed(0)}%)
                      </span>
                    ))}
                    <span className="h-3 w-px bg-[#CED5E0]" />
                    <span className="font-[470] text-[#59627E]">Manifests:</span>
                    {repo.manifests.map((m, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-[#E6EDF6]/50 px-2 py-0.5 text-[#59627E] font-mono text-[11px]"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right Column: Scan stats and buttons */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="block text-[11px] font-[470] uppercase text-[#59627E]">
                        SCA Coverage
                      </span>
                      <span className="text-[14px] font-[520] text-[#020C21]">
                        {repo.coveragePercent}% ({repo.scannedDependencies}/{repo.totalDependencies})
                      </span>
                    </div>

                    <div className="h-8 w-px bg-[#CED5E0]" />

                    <div className="flex items-center gap-1.5">
                      {repo.openFindingsCount.critical > 0 && (
                        <span className="px-2.5 py-1 rounded-full text-[12px] font-[520] bg-[#FADADD] text-[#A1121F] border border-[#F4AEB6]">
                          {repo.openFindingsCount.critical} Crit
                        </span>
                      )}
                      {repo.openFindingsCount.high > 0 && (
                        <span className="px-2.5 py-1 rounded-full text-[12px] font-[520] bg-[#FCE4D6] text-[#9A3B0B] border border-[#F7C4A5]">
                          {repo.openFindingsCount.high} High
                        </span>
                      )}
                      {repo.openFindingsCount.medium > 0 && (
                        <span className="px-2.5 py-1 rounded-full text-[12px] font-[520] bg-[#FBF0D9] text-[#7A5200] border border-[#F3DCAB]">
                          {repo.openFindingsCount.medium} Med
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/repositories/${repo.id}`}
                      className="rounded-full border border-[#CED5E0] bg-white px-4 py-1.5 text-[13px] font-[470] text-[#0F1B31] hover:bg-[#F4F7FB] transition-colors duration-150"
                    >
                      Overview & Graph
                    </Link>
                    <Link
                      to={`/scans/scan-123`}
                      className="inline-flex items-center gap-1 rounded-full bg-[#0F1B31] px-4 py-1.5 text-[13px] font-[500] text-white hover:bg-[#020C21] transition-colors duration-150"
                    >
                      <Play size={13} strokeWidth={1.7} />
                      <span>Scan</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Registering a Repository */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Repository for Inspection"
      >
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-[13px] font-[470] text-[#59627E] mb-1.5">
              GitHub Repository URL
            </label>
            <input
              type="url"
              required
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://github.com/org/repo"
              className="w-full rounded-[12px] bg-white border border-[#CED5E0] px-3.5 py-2.5 text-[14px] text-[#020C21] focus:border-[#2f5f9e] focus:ring-1 focus:ring-[#2f5f9e] outline-none"
            />
          </div>

          <div>
            <label className="block text-[13px] font-[470] text-[#59627E] mb-1.5">
              Default Branch
            </label>
            <input
              type="text"
              value={newBranch}
              onChange={(e) => setNewBranch(e.target.value)}
              className="w-full rounded-[12px] bg-white border border-[#CED5E0] px-3.5 py-2 text-[14px] text-[#020C21] focus:border-[#2f5f9e] focus:ring-1 focus:ring-[#2f5f9e] outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-full bg-white border border-[#CED5E0] px-4 py-2 text-[13px] font-[470] text-[#0F1B31] hover:bg-[#F4F7FB] transition-colors duration-150 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-[#0F1B31] px-5 py-2 text-[13px] font-[500] text-white hover:bg-[#020C21] transition-colors duration-150 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
