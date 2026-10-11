import React, { useState, useEffect } from 'react';
import { Cpu, ShieldCheck, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api-client';
import { GuardrailEvent } from '../types';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { TableSkeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';

export const GuardrailsPage: React.FC = () => {
  const [events, setEvents] = useState<GuardrailEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.getGuardrailEvents()
      .then(setEvents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 py-4">
      <div>
        <h1 className="text-[44px] leading-[1.08] font-[360] tracking-[-0.035em] text-[#020C21]">
          Guardrail Interventions
        </h1>
        <p className="text-[15px] font-[425] text-[#59627E] mt-1.5">
          Autonomous safety enforcement: parameter validation, SSRF prevention, and sensitive credential masking.
        </p>
      </div>

      {error ? (
        <ErrorState message={error} />
      ) : loading ? (
        <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6">
          <TableSkeleton rows={5} />
        </div>
      ) : (
        <div className="rounded-[20px] bg-white border border-[#DDE4EE] shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-[#E6EDF6]/50 border-b border-[#CED5E0] text-[12px] font-[470] text-[#59627E] uppercase">
                <tr>
                  <th className="py-3 px-4 font-[470]">Threat</th>
                  <th className="py-3 px-4 font-[470]">Rule Triggered</th>
                  <th className="py-3 px-4 font-[470]">Action Taken</th>
                  <th className="py-3 px-4 font-[470]">Target / Target File</th>
                  <th className="py-3 px-4 font-[470]">Reason</th>
                  <th className="py-3 px-4 font-[470]">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE4EE]">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-[#E6EDF6]/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <SeverityBadge severity={ev.threatLevel} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[13px] font-[500] text-[#020C21]">
                      {ev.ruleName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-[520] uppercase ${
                        ev.actionTaken === 'blocked'
                          ? 'bg-[#FADADD] text-[#A1121F]'
                          : ev.actionTaken === 'redacted'
                          ? 'bg-[#FCE4D6] text-[#9A3B0B]'
                          : 'bg-[#FBF0D9] text-[#7A5200]'
                      }`}>
                        {ev.actionTaken}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[12px] text-[#59627E]">
                      {ev.target}
                    </td>
                    <td className="py-3.5 px-4 text-[13px] text-[#020C21]">
                      {ev.reason}
                    </td>
                    <td className="py-3.5 px-4 text-[12px] text-[#59627E]">
                      {new Date(ev.timestamp).toLocaleTimeString()}
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
