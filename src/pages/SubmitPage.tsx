import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, FileText, Send } from 'lucide-react';
import { api } from '../lib/api-client';

export const SubmitPage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [source, setSource] = useState('External Intake Form');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Simulate POST /reports
      await new Promise((r) => setTimeout(r, 400));
      navigate('/queue');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-[44px] leading-[1.08] font-[360] tracking-[-0.035em] text-[#020C21]">
          Submit Incident Report
        </h1>
        <p className="text-[15px] font-[425] text-[#59627E] mt-1.5">
          Ingest an external telemetry report or vulnerability disclosure for automated triage.
        </p>
      </div>

      <div className="rounded-[20px] bg-white border border-[#DDE4EE] p-6 shadow-[0_1px_2px_rgba(28,52,92,0.04),0_8px_24px_rgba(28,52,92,0.05)]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-[470] text-[#59627E] mb-1.5">
              Incident Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Suspected credential exfiltration via webhook"
              className="w-full rounded-[12px] bg-white border border-[#CED5E0] px-3.5 py-2.5 text-[14px] text-[#020C21] focus:border-[#2f5f9e] focus:ring-1 focus:ring-[#2f5f9e] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-[470] text-[#59627E] mb-1.5">
                Initial Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full rounded-[12px] bg-white border border-[#CED5E0] px-3.5 py-2 text-[14px] text-[#020C21] outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-[470] text-[#59627E] mb-1.5">
                Intake Source
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded-[12px] bg-white border border-[#CED5E0] px-3.5 py-2 text-[14px] text-[#020C21] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-[470] text-[#59627E] mb-1.5">
              Description / Raw Evidence (Plain Text)
            </label>
            <textarea
              required
              rows={5}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Detail observations, timestamps, affected IP addresses, or suspicious payload snippets..."
              className="w-full rounded-[12px] bg-white border border-[#CED5E0] px-3.5 py-2.5 text-[14px] text-[#020C21] focus:border-[#2f5f9e] focus:ring-1 focus:ring-[#2f5f9e] outline-none resize-none font-mono text-[13px]"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-[#0F1B31] px-6 py-2.5 text-[14px] font-[500] text-white hover:bg-[#020C21] transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <Send size={15} strokeWidth={1.7} />
              <span>{submitting ? 'Submitting Report...' : 'Submit to Queue'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
