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
} from 'lucide-react';
import { Modal } from './Modal';
import { api } from '../../lib/api-client';

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
  const [activeTab, setActiveTab] = useState<'assistant' | 'models'>('assistant');
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [usedModel, setUsedModel] = useState<string>('openai/gpt-oss-120b');
  const [usedProvider, setUsedProvider] = useState<string>('groq');

  // Models state
  const [models, setModels] = useState<Array<{ id: string; name: string; description: string; tier: string; badge: string }>>([]);
  const [activeModel, setActiveModel] = useState<string>('openai/gpt-oss-120b');
  const [isConfigured, setIsConfigured] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadModelData();
      if (initialPrompt && !response) {
        handleSend(initialPrompt);
      }
    }
  }, [isOpen, initialPrompt]);

  const loadModelData = async () => {
    try {
      const data = await api.getAiModels();
      setModels(data.models);
      setActiveModel(data.activeModel);
      setIsConfigured(data.configured);
      setUsedModel(data.activeModel);
    } catch {
      // fallback
    }
  };

  const handleSelectModel = async (modelId: string) => {
    setSwitching(modelId);
    setTestStatus(null);
    try {
      const ok = await api.selectAiModel(modelId);
      if (ok) {
        setActiveModel(modelId);
        setUsedModel(modelId);
        setTestStatus(`Switched active model to ${modelId}`);
      }
    } finally {
      setSwitching(null);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || prompt).trim();
    if (!q) return;

    setLoading(true);
    setResponse(null);
    try {
      const res = await api.assistWithAi({
        prompt: q,
        context,
        model: activeModel,
      });
      setResponse(res.answer);
      setUsedModel(res.model);
      setUsedProvider(res.provider);
    } catch (err: any) {
      setResponse(`Error processing query: ${err?.message || 'Server error'}`);
    } finally {
      setLoading(false);
    }
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
      title="Groq AI Security Intelligence"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Navigation tabs */}
        <div className="flex items-center justify-between border-b border-[#CED5E0] pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('assistant')}
              className={`px-3 py-1.5 rounded-full text-[13px] font-[500] transition-colors cursor-pointer ${
                activeTab === 'assistant'
                  ? 'bg-[#0F1B31] text-white'
                  : 'text-[#59627E] hover:text-[#020C21] hover:bg-[#E6EDF6]'
              }`}
            >
              Security Assistant
            </button>
            <button
              onClick={() => setActiveTab('models')}
              className={`px-3 py-1.5 rounded-full text-[13px] font-[500] transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                activeTab === 'models'
                  ? 'bg-[#0F1B31] text-white'
                  : 'text-[#59627E] hover:text-[#020C21] hover:bg-[#E6EDF6]'
              }`}
            >
              <Cpu size={13} strokeWidth={1.7} />
              <span>Models & Engine ({activeModel.split('/')[1] || activeModel})</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E3EEF8] border border-[#4A78B0]/30 text-[11px] font-[520] text-[#1F4E79]">
            <Zap size={11} strokeWidth={2} className="text-[#2f5f9e]" />
            <span>Groq Accelerated</span>
          </div>
        </div>

        {activeTab === 'models' ? (
          <div className="space-y-4 py-1">
            <div className="rounded-[14px] bg-[#E6EDF6]/50 p-3.5 border border-[#DDE4EE] text-[13px] text-[#59627E] flex items-start gap-2.5">
              <Info size={16} strokeWidth={1.7} className="text-[#4A78B0] shrink-0 mt-0.5" />
              <div>
                <span className="font-[520] text-[#020C21] block">
                  Best Available Groq Model Selected: <code className="font-mono text-[#0F182F] bg-white px-1.5 py-0.5 rounded border border-[#CED5E0]">{activeModel}</code>
                </span>
                SentinelFlow automatically queries your Groq API key and prioritizes <strong>openai/gpt-oss-120b</strong> (120-Billion parameter open-weights reasoning model) for maximal depth in AST taint analysis and patch synthesis.
              </div>
            </div>

            {testStatus && (
              <div className="rounded-lg bg-[#E3EEF8] text-[#1F4E79] px-3 py-2 text-[12px] font-[500] border border-[#CED5E0] flex items-center gap-2">
                <CheckCircle2 size={14} />
                <span>{testStatus}</span>
              </div>
            )}

            <div className="space-y-2.5">
              <span className="text-[12px] font-[520] uppercase tracking-wider text-[#59627E]">
                Available Groq Models on Account
              </span>
              {models.map((m) => {
                const isSelected = m.id === activeModel;
                return (
                  <div
                    key={m.id}
                    onClick={() => handleSelectModel(m.id)}
                    className={`p-3.5 rounded-[16px] border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-[#0F1B31] bg-white shadow-sm ring-1 ring-[#0F1B31]'
                        : 'border-[#DDE4EE] bg-white hover:border-[#CED5E0] hover:bg-[#F8FAFD]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-[520] text-[#020C21]">{m.name}</span>
                        <span className="font-mono text-[11px] text-[#59627E] bg-[#E6EDF6] px-1.5 py-0.5 rounded">
                          {m.id}
                        </span>
                        <span
                          className={`text-[10px] font-[500] px-2 py-0.5 rounded-full ${
                            m.tier.includes('Best')
                              ? 'bg-[#E3EEF8] text-[#1F4E79]'
                              : 'bg-[#E6EDF6] text-[#0F1B31]'
                          }`}
                        >
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#59627E] leading-normal">{m.description}</p>
                    </div>

                    <div className="pl-3">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 text-[12px] font-[520] text-[#1F4E79] bg-[#E3EEF8] px-3 py-1 rounded-full">
                          <CheckCircle2 size={13} strokeWidth={2} />
                          <span>Active</span>
                        </span>
                      ) : (
                        <button
                          disabled={switching === m.id}
                          className="text-[12px] font-[470] text-[#0F1B31] border border-[#CED5E0] bg-white px-3 py-1 rounded-full hover:bg-[#E6EDF6] transition-colors"
                        >
                          {switching === m.id ? 'Switching...' : 'Select'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
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
                  <span>Synthesizing response with Groq ({activeModel})...</span>
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
                      Groq Security Reasoning Output
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#59627E] bg-[#E6EDF6] px-2 py-0.5 rounded">
                    <span>{usedModel}</span>
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
                className="inline-flex items-center gap-1.5 rounded-full bg-[#0F1B31] px-5 py-2.5 text-[13px] font-[500] text-white hover:bg-[#020C21] disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Send size={13} strokeWidth={1.7} />
                <span>Send</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </Modal>
  );
};
