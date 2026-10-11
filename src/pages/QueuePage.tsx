import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Search,
  RefreshCw,
  UserCheck,
  Clock,
  ArrowRight,
  ShieldAlert,
  CheckCircle,
} from 'lucide-react';
import { api } from '../lib/api-client';
import { Incident } from '../types';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { TableSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';

export const QueuePage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchIncidents = async () => {
    try {
      const data = await api.getIncidents();
      setIncidents(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();

    // Poll the queue every 10s only while the tab is visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchIncidents();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleClaim = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const updated = await api.claimIncident(id, 'Sarah Chen');
      setIncidents((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = incidents.filter((inc) => {
    if (statusFilter !== 'all' && inc.status !== statusFilter) return false;
    if (
      search &&
      !inc.title.toLowerCase().includes(search.toLowerCase()) &&
      !inc.id.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 py-4">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[44px] leading-[1.08] font-[360] tracking-[-0.035em] text-[#020C21]">
            Incident Triage Queue
          </h1>
          <p className="text-[15px] font-[425] text-[#59627E] mt-1.5">
            Real-time incident queue polled every 10s while tab is visible. Claim and escalate triage actions.
          </p>
        </div>
        <button
          onClick={fetchIncidents}
          className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#CED5E0] px-4 py-2 text-[13px] font-[470] text-[#0F1B31] hover:bg-[#F4F7FB] transition-colors cursor-pointer self-start md:self-auto"
        >
          <RefreshCw size={14} strokeWidth={1.7} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-white border border-[#CED5E0] rounded-[16px] p-3 shadow-sm">
        <div className="flex items-center gap-2 flex-1 px-2">
          <Search size={16} strokeWidth={1.7} className="text-[#59627E]" />
          <input
            type="text"
            placeholder="Search incident by ID or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-[14px] text-[#020C21] placeholder-[#59627E] outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-full bg-white border border-[#CED5E0] px-3.5 py-1.5 text-[13px] font-[470] text-[#020C21] focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="investigating">Investigating</option>
          <option value="escalated">Escalated</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchIncidents} />
      ) : loading ? (
        <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6">
          <TableSkeleton rows={5} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No incidents in queue"
          description="All current incident escalations have been triaged."
        />
      ) : (
        <div className="rounded-[20px] bg-white border border-[#DDE4EE] shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#E6EDF6]/50 border-b border-[#CED5E0] text-[12px] font-[470] text-[#59627E] uppercase">
                <tr>
                  <th className="py-3 px-4 font-[470]">Severity</th>
                  <th className="py-3 px-4 font-[470]">Incident ID & Title</th>
                  <th className="py-3 px-4 font-[470]">Source</th>
                  <th className="py-3 px-4 font-[470]">Claimed By</th>
                  <th className="py-3 px-4 font-[470]">Status</th>
                  <th className="py-3 px-4 font-[470]">Reported</th>
                  <th className="py-3 px-4 text-right font-[470]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE4EE]">
                {filtered.map((inc) => (
                  <tr key={inc.id} className="hover:bg-[#E6EDF6]/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <SeverityBadge severity={inc.severity} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/incidents/${inc.id}`}
                        className="font-[500] text-[#020C21] hover:underline hover:text-[#2f5f9e]"
                      >
                        {inc.title}
                      </Link>
                      <div className="text-[12px] font-mono text-[#59627E]">{inc.id}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[13px] text-[#59627E]">{inc.source}</td>
                    <td className="py-3.5 px-4 text-[13px]">
                      {inc.claimedBy ? (
                        <span className="font-[470] text-[#0F182F] flex items-center gap-1">
                          <UserCheck size={13} className="text-[#4A78B0]" />
                          <span>{inc.claimedBy}</span>
                        </span>
                      ) : (
                        <span className="text-[#59627E] italic">Unclaimed</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize text-[12px] font-[470] text-[#0F1B31] px-2.5 py-0.5 rounded-full bg-[#E6EDF6]">
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[13px] text-[#59627E]">
                      {new Date(inc.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!inc.claimedBy && (
                          <button
                            onClick={(e) => handleClaim(e, inc.id)}
                            className="rounded-full border border-[#CED5E0] bg-white px-3 py-1 text-[12px] font-[470] text-[#0F1B31] hover:bg-[#F4F7FB] transition-colors"
                          >
                            Claim
                          </button>
                        )}
                        <Link
                          to={`/incidents/${inc.id}`}
                          className="rounded-full bg-[#0F1B31] px-3.5 py-1 text-[12px] font-[500] text-white hover:bg-[#020C21] transition-colors inline-flex items-center gap-1"
                        >
                          <span>Investigate</span>
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
