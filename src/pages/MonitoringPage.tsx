import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Activity, Clock, Database, ShieldCheck, RefreshCw } from 'lucide-react';
import { api } from '../lib/api-client';
import { SystemMetrics } from '../types';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';

const throughputData = [
  { time: '02:00', scans: 45, findings: 12 },
  { time: '04:00', scans: 60, findings: 18 },
  { time: '06:00', scans: 110, findings: 34 },
  { time: '08:00', scans: 240, findings: 78 },
  { time: '10:00', scans: 320, findings: 92 },
  { time: '12:00', scans: 290, findings: 64 },
  { time: '14:00', scans: 210, findings: 46 },
];

const latencyDistribution = [
  { stage: 'Validation', ms: 340 },
  { stage: 'Checkout', ms: 1420 },
  { stage: 'Fingerprint', ms: 820 },
  { stage: 'Dependency', ms: 1650 },
  { stage: 'Engines', ms: 3200 },
  { stage: 'Graph', ms: 1100 },
  { stage: 'Persist', ms: 410 },
];

export const MonitoringPage: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (error) {
    return (
      <div className="py-8">
        <ErrorState message={error} onRetry={fetchMetrics} />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[44px] leading-[1.08] font-[360] tracking-[-0.035em] text-[#020C21]">
            Operational Monitoring
          </h1>
          <p className="text-[15px] font-[425] text-[#59627E] mt-1.5">
            Throughput, OSV cache hit rates, engine latency, and automated triage health.
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#CED5E0] px-4 py-2 text-[13px] font-[470] text-[#0F1B31] hover:bg-[#F4F7FB] transition-colors cursor-pointer self-start md:self-auto"
        >
          <RefreshCw size={14} strokeWidth={1.7} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)]">
          <div className="flex items-center justify-between text-[#59627E]">
            <span className="text-[13px] font-[470]">Avg Pipeline Duration</span>
            <Clock size={16} strokeWidth={1.7} />
          </div>
          {loading ? (
            <Skeleton className="h-14 w-24 my-2" />
          ) : (
            <div className="text-[56px] font-[200] leading-none text-[#020C21] my-1">
              {metrics?.avgScanDurationSec}s
            </div>
          )}
          <span className="text-[13px] text-[#59627E]">End-to-end sandbox time</span>
        </div>

        <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)]">
          <div className="flex items-center justify-between text-[#59627E]">
            <span className="text-[13px] font-[470]">OSV API Cache Hit Rate</span>
            <Database size={16} strokeWidth={1.7} />
          </div>
          {loading ? (
            <Skeleton className="h-14 w-24 my-2" />
          ) : (
            <div className="text-[56px] font-[200] leading-none text-[#1F4E79] my-1">
              {metrics?.osvApiCacheHitRate}%
            </div>
          )}
          <span className="text-[13px] text-[#59627E]">Local advisory database cache</span>
        </div>

        <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)]">
          <div className="flex items-center justify-between text-[#59627E]">
            <span className="text-[13px] font-[470]">Escalation Rate</span>
            <Activity size={16} strokeWidth={1.7} />
          </div>
          {loading ? (
            <Skeleton className="h-14 w-24 my-2" />
          ) : (
            <div className="text-[56px] font-[200] leading-none text-[#7A5200] my-1">
              {metrics?.agentEscalationRate}%
            </div>
          )}
          <span className="text-[13px] text-[#59627E]">Agent to human analyst tier</span>
        </div>

        <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)]">
          <div className="flex items-center justify-between text-[#59627E]">
            <span className="text-[13px] font-[470]">Mean Time To Triage</span>
            <ShieldCheck size={16} strokeWidth={1.7} />
          </div>
          {loading ? (
            <Skeleton className="h-14 w-24 my-2" />
          ) : (
            <div className="text-[56px] font-[200] leading-none text-[#020C21] my-1">
              {metrics?.meanTimeToTriageMin}m
            </div>
          )}
          <span className="text-[13px] text-[#59627E]">From intake to validated decision</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Scan Volume & Findings Over Time */}
        <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] space-y-4">
          <div>
            <h3 className="text-[18px] font-[500] text-[#020C21]">Scan Throughput & Findings Volume</h3>
            <p className="text-[13px] font-[470] text-[#59627E]">
              Scans analyzed versus discovered vulnerabilities
            </p>
          </div>
          <div className="h-[260px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={throughputData}>
                <defs>
                  <linearGradient id="scansGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F1B31" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0F1B31" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="findGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A1121F" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#A1121F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#59627E" fontSize={12} tickLine={false} />
                <YAxis stroke="#59627E" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    border: '1px solid #CED5E0',
                    fontSize: '13px',
                  }}
                />
                <Area type="monotone" dataKey="scans" stroke="#0F1B31" strokeWidth={2} fill="url(#scansGrad)" />
                <Area type="monotone" dataKey="findings" stroke="#A1121F" strokeWidth={2} fill="url(#findGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Pipeline Stage Latency Breakdown */}
        <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] space-y-4">
          <div>
            <h3 className="text-[18px] font-[500] text-[#020C21]">Stage Execution Latency (ms)</h3>
            <p className="text-[13px] font-[470] text-[#59627E]">
              Benchmark duration across all 7 analyzer pipeline stages
            </p>
          </div>
          <div className="h-[260px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyDistribution}>
                <XAxis dataKey="stage" stroke="#59627E" fontSize={11} tickLine={false} />
                <YAxis stroke="#59627E" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    border: '1px solid #CED5E0',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="ms" fill="#4A78B0" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
