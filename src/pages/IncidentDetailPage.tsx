import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Code2,
  Sparkles,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { api } from '../lib/api-client';
import { Incident, IncidentTraceStep } from '../types';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { Modal } from '../components/ui/Modal';

export const IncidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [traceSteps, setTraceSteps] = useState<IncidentTraceStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Groq AI Triage State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAssessment, setAiAssessment] = useState<{
    recommendation: string;
    model: string;
    provider: string;
  } | null>(null);

  // Expanded trace steps (trace JSON rendered only when expanded)
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});

  // Decision Modal
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decision, setDecision] = useState<'escalate' | 'resolve' | 'dismiss'>('escalate');
  const [reason, setReason] = useState('');
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([api.getIncident(id), api.getIncidentTrace(id)])
      .then(([incData, traceData]) => {
        setIncident(incData);
        setTraceSteps(traceData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const handleClaim = async () => {
    if (!incident) return;
    try {
      const updated = await api.claimIncident(incident.id, 'Sarah Chen');
      setIncident(updated);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRelease = async () => {
    if (!incident) return;
    try {
      const updated = await api.releaseIncident(incident.id);
      setIncident(updated);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incident) return;
    try {
      setDecisionSubmitting(true);
      const updated = await api.decideIncident(
        incident.id,
        decision,
        reason,
        incident.version
      );
      setIncident(updated);
      setIsDecisionModalOpen(false);
      setReason('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDecisionSubmitting(false);
    }
  };

  const handleGenerateAiAssessment = async () => {
    if (!incident) return;
    setAiLoading(true);
    try {
      const res = await api.triageWithAi({
        incidentTitle: incident.title,
        severity: incident.severity,
        description: incident.summary,
      });
      setAiAssessment(res);
    } catch (err: any) {
      alert(`AI triage analysis error: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  if (error) {
    return (
      <div className="py-8">
        <ErrorState message={error} />
      </div>
    );
  }

  if (loading || !incident) {
    return (
      <div className="space-y-6 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Top back nav */}
      <div className="flex items-center justify-between">
        <Link
          to="/queue"
          className="inline-flex items-center gap-1.5 text-[13px] font-[470] text-[#59627E] hover:text-[#020C21] transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={1.7} />
          <span>Back to Triage Queue</span>
        </Link>
        <div className="flex items-center gap-2">
          {incident.claimedBy ? (
            <button
              onClick={handleRelease}
              className="rounded-full bg-white border border-[#CED5E0] px-4 py-1.5 text-[13px] font-[470] text-[#0F1B31] hover:bg-[#F4F7FB] transition-colors cursor-pointer"
            >
              Release Claim
            </button>
          ) : (
            <button
              onClick={handleClaim}
              className="rounded-full bg-white border border-[#CED5E0] px-4 py-1.5 text-[13px] font-[470] text-[#0F1B31] hover:bg-[#F4F7FB] transition-colors cursor-pointer"
            >
              Claim Incident
            </button>
          )}
          <button
            onClick={() => setIsDecisionModalOpen(true)}
            className="rounded-full bg-[#0F1B31] px-5 py-1.5 text-[13px] font-[500] text-white hover:bg-[#020C21] transition-colors cursor-pointer"
          >
            Submit Decision
          </button>
        </div>
      </div>

      {/* Incident Header Card */}
      <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <SeverityBadge severity={incident.severity} size="md" />
              <span className="font-mono text-[12px] text-[#59627E]">{incident.id}</span>
              <span className="text-[12px] text-[#59627E]">· Version {incident.version}</span>
            </div>
            <h1 className="text-[26px] font-[500] text-[#020C21]">
              {incident.title}
            </h1>
            <p className="text-[13px] text-[#59627E]">
              Source: <span className="font-[470] text-[#020C21]">{incident.source}</span> · Reported: {new Date(incident.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="capitalize px-3 py-1 rounded-full text-[12px] font-[500] bg-[#E6EDF6] text-[#0F1B31]">
              Status: {incident.status}
            </span>
            {incident.claimedBy && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-[470] bg-[#E3EEF8] text-[#1F4E79]">
                <UserCheck size={13} />
                <span>{incident.claimedBy}</span>
              </span>
            )}
          </div>
        </div>

        {/* Report Text Plain Text Rendering */}
        <div className="pt-4 border-t border-[#CED5E0] space-y-2">
          <h3 className="text-[15px] font-[500] text-[#020C21]">Incident Summary</h3>
          <p className="text-[14px] font-[425] text-[#59627E] leading-relaxed whitespace-pre-wrap">
            {incident.summary}
          </p>
        </div>

        {/* Indicators of Compromise */}
        <div className="pt-2">
          <span className="text-[12px] font-[470] text-[#59627E] block mb-1.5">
            Reported Indicators & Payloads:
          </span>
          <div className="flex flex-wrap gap-2">
            {incident.indicators.map((ind, i) => (
              <span
                key={i}
                className="font-mono text-[12px] px-2.5 py-1 rounded-md bg-[#E6EDF6]/60 text-[#020C21] border border-[#DDE4EE]"
              >
                {ind}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Groq AI Triage Intelligence Card */}
      <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-[#0F1B31] text-white flex items-center justify-center">
                <Zap size={13} strokeWidth={2} className="text-[#4A78B0]" />
              </div>
              <h3 className="text-[18px] font-[500] text-[#020C21]">
                Groq AI Triage Reasoning
              </h3>
              <span className="font-mono text-[11px] text-[#1F4E79] bg-[#E3EEF8] px-2 py-0.5 rounded-full font-[500]">
                openai/gpt-oss-120b
              </span>
            </div>
            <p className="text-[13px] font-[470] text-[#59627E]">
              Accelerated LLM reasoning for root cause verification, blast radius estimation, and containment actions.
            </p>
          </div>

          <button
            onClick={handleGenerateAiAssessment}
            disabled={aiLoading}
            className="inline-flex items-center gap-2 rounded-full bg-[#0F1B31] px-4 py-2 text-[13px] font-[500] text-white hover:bg-[#020C21] disabled:opacity-50 transition-colors cursor-pointer shrink-0"
          >
            {aiLoading ? (
              <>
                <RefreshCw size={13} className="animate-spin text-[#4A78B0]" />
                <span>Synthesizing Assessment...</span>
              </>
            ) : (
              <>
                <Sparkles size={13} strokeWidth={1.7} className="text-[#4A78B0]" />
                <span>{aiAssessment ? 'Re-run Groq Analysis' : 'Run Groq AI Triage'}</span>
              </>
            )}
          </button>
        </div>

        {aiAssessment && (
          <div className="rounded-[16px] bg-[#F8FAFD] border border-[#CED5E0] p-4.5 space-y-3">
            <div className="flex items-center justify-between text-[12px] text-[#59627E] pb-2 border-b border-[#CED5E0]">
              <span className="font-[520] text-[#020C21]">Groq Incident Assessment Output:</span>
              <span className="font-mono text-[11px]">Model: {aiAssessment.model}</span>
            </div>
            <div className="text-[14px] font-[425] text-[#0F182F] leading-relaxed whitespace-pre-wrap">
              {aiAssessment.recommendation}
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setReason(
                    `[Groq AI Recommendation (${aiAssessment.model})]:\n${aiAssessment.recommendation.slice(0, 300)}...`
                  );
                  setIsDecisionModalOpen(true);
                }}
                className="text-[12px] font-[500] text-[#1F4E79] bg-white border border-[#CED5E0] px-3.5 py-1.5 rounded-full hover:bg-[#E6EDF6] transition-colors"
              >
                Copy to Decision Form →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Investigation Timeline & Expandable Trace */}
      <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)] space-y-4">
        <div>
          <h3 className="text-[18px] font-[500] text-[#020C21]">Agent Investigation Trace</h3>
          <p className="text-[13px] font-[470] text-[#59627E]">
            Step-by-step diagnostic actions. Expand any row to inspect serialized input/output payload JSON.
          </p>
        </div>

        <div className="space-y-3">
          {traceSteps.map((step) => {
            const isExpanded = !!expandedSteps[step.stepId];
            return (
              <div
                key={step.stepId}
                className="rounded-[16px] border border-[#DDE4EE] bg-white overflow-hidden transition-colors"
              >
                <div
                  onClick={() => toggleStep(step.stepId)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#E6EDF6]/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[12px] text-[#59627E]">{step.stepId}</span>
                    <span className="font-[520] text-[#020C21] text-[14px]">{step.action}</span>
                    <span className="text-[12px] text-[#59627E]">[{step.tool}]</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[12px] text-[#59627E]">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </span>
                    <button className="text-[#59627E]">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {step.notes && (
                  <div className="px-4 pb-2 text-[13px] text-[#59627E] font-[425]">
                    {step.notes}
                  </div>
                )}

                {/* Render Trace JSON ONLY when row is expanded */}
                {isExpanded && (
                  <div className="bg-[#020C21] text-[#E6EDF6] p-4 border-t border-[#CED5E0] font-mono text-[12px] space-y-3">
                    <div>
                      <span className="text-[#4A78B0] block text-[11px] mb-1 uppercase font-sans">
                        Input Payload
                      </span>
                      <pre className="overflow-x-auto whitespace-pre">
                        {JSON.stringify(step.input, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <span className="text-[#4A78B0] block text-[11px] mb-1 uppercase font-sans">
                        Output Payload
                      </span>
                      <pre className="overflow-x-auto whitespace-pre">
                        {JSON.stringify(step.output, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Decision Modal */}
      <Modal
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        title="Submit Incident Triage Decision"
      >
        <form onSubmit={handleSubmitDecision} className="space-y-4">
          <div>
            <label className="block text-[13px] font-[470] text-[#59627E] mb-1.5">
              Action Decision
            </label>
            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value as any)}
              className="w-full rounded-[12px] bg-white border border-[#CED5E0] px-3.5 py-2 text-[14px] text-[#020C21] outline-none"
            >
              <option value="escalate">Escalate to Senior Security Engineering</option>
              <option value="resolve">Resolve Incident (Remediation Validated)</option>
              <option value="dismiss">Dismiss as False Positive / Authorized Test</option>
            </select>
          </div>

          <div>
            <label className="block text-[13px] font-[470] text-[#59627E] mb-1.5">
              Triage Rationale & Notes
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State verified evidence and justification..."
              className="w-full rounded-[12px] bg-white border border-[#CED5E0] px-3.5 py-2 text-[14px] text-[#020C21] outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsDecisionModalOpen(false)}
              className="rounded-full bg-white border border-[#CED5E0] px-4 py-2 text-[13px] font-[470] text-[#0F1B31] hover:bg-[#F4F7FB] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={decisionSubmitting}
              className="rounded-full bg-[#0F1B31] px-5 py-2 text-[13px] font-[500] text-white hover:bg-[#020C21] transition-colors disabled:opacity-50"
            >
              {decisionSubmitting ? 'Submitting...' : 'Confirm Decision'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
