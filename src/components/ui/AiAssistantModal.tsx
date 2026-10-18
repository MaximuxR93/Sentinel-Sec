import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  RefreshCw,
  Send,
  ShieldAlert,
  Terminal,
  Cpu,
  ArrowRight,
  Info,
  Copy,
  Check,
  Key,
} from 'lucide-react';
import { Modal } from './Modal';
import { useAi } from '../../context/AiContext';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  context?: string;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  initialPrompt,
  context,
}) => {
  const { activeProvider, activeModel, openModal: openModelModal, askCopilot } = useAi();
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [usedModel, setUsedModel] = useState<string>(activeModel);
  const [usedProvider, setUsedProvider] = useState<string>(activeProvider);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUsedModel(activeModel);
      setUsedProvider(activeProvider);
      if (initialPrompt && !response) {
        handleSend(initialPrompt);
      }
    }
  }, [isOpen, initialPrompt, activeModel, activeProvider]);

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || prompt).trim();
    if (!q) return;

    setLoading(true);
    setResponse(null);
    try {
      const res = await askCopilot(q, context);
      setResponse(res.answer);
      setUsedModel(res.model);
      setUsedProvider(res.provider);
    } catch (err: any) {
      setResponse(`Error processing query: ${err?.message || 'Server error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!response) return;
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickPrompts = [
    'How do I remediate Prompt Injection in server/services/rag.ts?',
    'What is the blast radius of unauthenticated /api/chat invocation?',
    'Explain the AST taint trace for prototype pollution in PDF parsers.',
    'Formulate a zero-downtime security patch for SQLite WAL locking.',
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Security Intelligence Assistant"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Active Engine Pill & Model Switcher */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#CED5E0] pb-3 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-[500] text-[#59627E]">Active Engine:</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E3EEF8] border border-[#4A78B0]/30 text-[12px] font-[520] text-[#1F4E79]">
              <Sparkles size={12} className="text-[#2f5f9e]" />
              <span className="font-mono">{activeModel}</span>
              <span className="text-[10px] uppercase font-sans text-[#59627E]">({activeProvider})</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              openModelModal();
            }}
            className="inline-flex items-center gap-1 text-[12px] font-[500] text-[#1F4E79] hover:underline cursor-pointer"
          >
            <Key size={12} />
            <span>Switch Model / Enter API Key</span>
          </button>
        </div>

        <div className="space-y-4">
          {/* Context preview if passed */}
          {context && (
            <div className="rounded-[12px] bg-[#E6EDF6]/60 p-2.5 text-[12px] text-[#59627E] border border-[#DDE4EE]">
              <span className="font-[520] text-[#020C21]">Context Loaded:</span> {context}
            </div>
          )}

          {/* Quick Prompts */}
          {!response && !loading && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-[520] uppercase tracking-wider text-[#59627E]">
                Suggested Inquiries
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {quickPrompts.map((qp, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPrompt(qp);
                      handleSend(qp);
                    }}
                    className="text-left p-2.5 rounded-[12px] border border-[#DDE4EE] bg-white hover:bg-[#E6EDF6]/40 hover:border-[#CED5E0] transition-colors text-[12px] text-[#0F182F] font-[425] leading-relaxed cursor-pointer flex items-center justify-between group"
                  >
                    <span>{qp}</span>
                    <ArrowRight
                      size={12}
                      className="text-[#59627E] group-hover:text-[#020C21] shrink-0 ml-1.5 transition-colors"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Response Section */}
          {loading && (
            <div className="rounded-[16px] bg-white border border-[#DDE4EE] p-5 space-y-3">
              <div className="flex items-center gap-2 text-[13px] font-[500] text-[#0F182F]">
                <RefreshCw size={14} className="animate-spin text-[#4A78B0]" />
                <span>Synthesizing response with {activeModel} ({activeProvider})...</span>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-[#E6EDF6] rounded w-full animate-pulse" />
                <div className="h-4 bg-[#E6EDF6] rounded w-5/6 animate-pulse" />
                <div className="h-4 bg-[#E6EDF6] rounded w-3/4 animate-pulse" />
              </div>
            </div>
          )}

          {response && (
            <div className="rounded-[16px] bg-white border border-[#DDE4EE] p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#CED5E0]">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} strokeWidth={1.7} className="text-[#4A78B0]" />
                  <span className="text-[13px] font-[520] text-[#020C21]">
                    AI Security Reasoning Output
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-[#59627E] bg-[#E6EDF6] px-2 py-0.5 rounded">
                    {usedModel}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="p-1 text-[#59627E] hover:text-[#020C21] transition-colors cursor-pointer"
                    title="Copy response"
                  >
                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="text-[14px] font-[425] text-[#0F182F] leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto pr-1">
                {response}
              </div>
            </div>
          )}

          {/* Input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 pt-2"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask about vulnerabilities, patch strategies, or repository AST flows..."
              className="flex-1 rounded-[12px] border border-[#CED5E0] bg-white px-3.5 py-2.5 text-[13px] text-[#020C21] placeholder-[#59627E]/60 focus:outline-none focus:ring-1 focus:ring-[#2f5f9e]"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0F1B31] px-5 py-2.5 text-[13px] font-[500] text-white hover:bg-[#020C21] disabled:opacity-40 transition-colors cursor-pointer shrink-0"
            >
              <Send size={13} strokeWidth={1.7} />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
};
