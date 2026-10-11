import React, { useState, useEffect } from 'react';
import { CheckCircle2, ShieldAlert, Award, FileSpreadsheet } from 'lucide-react';
import { api } from '../lib/api-client';
import { EvalMetric } from '../types';
import { TableSkeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';

export const EvalsPage: React.FC = () => {
  const [evals, setEvals] = useState<EvalMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.getEvals()
      .then(setEvals)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 py-4">
      <div>
        <h1 className="text-[44px] leading-[1.08] font-[360] tracking-[-0.035em] text-[#020C21]">
          Evals & Benchmark Accuracy
        </h1>
        <p className="text-[15px] font-[425] text-[#59627E] mt-1.5">
          Empirical evaluation benchmarks across Juliet Test Suite, OWASP, and real-world CVE corpora.
        </p>
      </div>

      {error ? (
        <ErrorState message={error} />
      ) : loading ? (
        <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6">
          <TableSkeleton rows={3} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {evals.map((metric) => (
            <div
              key={metric.id}
              className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Award size={20} strokeWidth={1.7} className="text-[#4A78B0]" />
                  <h3 className="text-[18px] font-[500] text-[#020C21]">{metric.dataset}</h3>
                </div>
                <span className="text-[12px] font-mono text-[#59627E]">
                  Evaluated {metric.sampleCount} test cases · {new Date(metric.lastRun).toLocaleDateString()}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-[14px] bg-[#E6EDF6]/50 border border-[#DDE4EE]">
                  <span className="text-[12px] uppercase text-[#59627E] block">Overall Accuracy</span>
                  <span className="text-[28px] font-[360] text-[#020C21]">
                    {metric.accuracy}%
                  </span>
                </div>
                <div className="p-3.5 rounded-[14px] bg-[#E6EDF6]/50 border border-[#DDE4EE]">
                  <span className="text-[12px] uppercase text-[#59627E] block">Precision</span>
                  <span className="text-[28px] font-[360] text-[#1F4E79]">
                    {metric.precision}%
                  </span>
                </div>
                <div className="p-3.5 rounded-[14px] bg-[#E6EDF6]/50 border border-[#DDE4EE]">
                  <span className="text-[12px] uppercase text-[#59627E] block">Recall</span>
                  <span className="text-[28px] font-[360] text-[#020C21]">
                    {metric.recall}%
                  </span>
                </div>
                <div className="p-3.5 rounded-[14px] bg-[#E6EDF6]/50 border border-[#DDE4EE]">
                  <span className="text-[12px] uppercase text-[#59627E] block">False Positive Rate</span>
                  <span className="text-[28px] font-[360] text-[#7A5200]">
                    {metric.falsePositiveRate}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
