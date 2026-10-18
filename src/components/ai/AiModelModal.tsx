import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Key,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  Zap,
  ShieldCheck,
  Cpu,
  Brain,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';
import { useAi } from '../../context/AiContext';

export const AiModelModal: React.FC = () => {
  const {
    activeProvider,
    activeModel,
    providers,
    isModalOpen,
    closeModal,
    configureProvider,
    testKey,
    userApiKeys,
    setUserApiKey,
  } = useAi();

  const [selectedProvider, setSelectedProvider] = useState<string>(activeProvider);
  const [selectedModel, setSelectedModel] = useState<string>(activeModel);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showKey, setShowKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string; latencyMs?: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      setSelectedProvider(activeProvider);
      setSelectedModel(activeModel);
      setApiKeyInput(userApiKeys[activeProvider] || '');
      setTestResult(null);
      setSaveSuccess(false);
    }
  }, [isModalOpen, activeProvider, activeModel, userApiKeys]);

  const currentProviderObj = providers.find((p) => p.id === selectedProvider) || providers[0];

  const handleProviderSelect = (provId: string) => {
    setSelectedProvider(provId);
    setTestResult(null);
    setSaveSuccess(false);
    const prov = providers.find((p) => p.id === provId);
    if (prov && prov.models.length > 0) {
      setSelectedModel(prov.activeModel || prov.models[0].id);
    }
    setApiKeyInput(userApiKeys[provId] || '');
  };

  const handleTestKey = async () => {
    if (selectedProvider !== 'sentinelflow' && (!apiKeyInput || apiKeyInput.trim().length < 5)) {
      setTestResult({ valid: false, message: 'Please paste your API key first' });
      return;
    }

    setTestingKey(true);
    setTestResult(null);
    try {
      const res = await testKey(selectedProvider, apiKeyInput.trim(), selectedModel);
      setTestResult(res);
      if (res.valid) {
        setUserApiKey(selectedProvider, apiKeyInput.trim());
      }
    } catch (err: any) {
      setTestResult({ valid: false, message: err.message || 'Key test failed' });
    } finally {
      setTestingKey(false);
    }
  };

  const handleSaveAndActivate = async () => {
    setSaving(true);
    try {
      const success = await configureProvider(selectedProvider, selectedModel, apiKeyInput.trim());
      if (success) {
        setSaveSuccess(true);
        setTimeout(() => {
          closeModal();
          setSaveSuccess(false);
        }, 600);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020C21]/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl rounded-[24px] bg-white border border-[#DDE4EE] shadow-[0_20px_60px_rgba(2,12,33,0.18)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-[#CED5E0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#E3EEF8] border border-[#C7DCF0] flex items-center justify-center text-[#1F4E79]">
              <Sparkles size={20} strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-[20px] font-[500] text-[#020C21]">
                AI Intelligence Engine & Model Selection
              </h2>
              <p className="text-[13px] font-[425] text-[#59627E]">
                Select your preferred AI reasoning engine, configure your API key, and test live latency.
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-2 rounded-full text-[#59627E] hover:text-[#020C21] hover:bg-[#E6EDF6] transition-colors cursor-pointer"
            title="Close modal"
          >
            <X size={18} strokeWidth={1.7} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Provider Selection Tabs */}
          <div>
            <label className="block text-[13px] font-[500] text-[#020C21] mb-2.5">
              1. Select AI Reasoning Provider
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {providers.map((prov) => {
                const isSelected = selectedProvider === prov.id;
                const hasKey = prov.hasKey || Boolean(userApiKeys[prov.id]);
                return (
                  <button
                    key={prov.id}
                    onClick={() => handleProviderSelect(prov.id)}
                    className={`p-3 rounded-[16px] text-left border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-[#0F1B31] bg-[#F4F7FB] ring-2 ring-[#0F1B31]/20 shadow-sm'
                        : 'border-[#DDE4EE] bg-white hover:border-[#CED5E0] hover:bg-[#FAFCFF]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[14px] font-[500] text-[#020C21]">
                        {prov.name}
                      </span>
                      {hasKey ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Check size={10} strokeWidth={2.5} /> Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-[#59627E] bg-[#E6EDF6] px-1.5 py-0.5 rounded-full">
                          Needs Key
                        </span>
                      )}
                    </div>
                    <p className="text-[11.5px] text-[#59627E] line-clamp-1">
                      {prov.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* API Key Configuration Section (Only if not Built-in AST) */}
          {selectedProvider !== 'sentinelflow' && (
            <div className="rounded-[18px] bg-[#F4F7FB] border border-[#CED5E0] p-4.5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-[500] text-[#020C21] flex items-center gap-2">
                  <Key size={14} className="text-[#1F4E79]" />
                  <span>2. Paste {currentProviderObj?.name} API Key</span>
                </label>
                {currentProviderObj?.helpUrl && currentProviderObj.helpUrl !== '#' && (
                  <a
                    href={currentProviderObj.helpUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[12px] text-[#1F4E79] hover:underline flex items-center gap-1 font-[470]"
                  >
                    <span>Get API Key</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKeyInput}
                    onChange={(e) => {
                      setApiKeyInput(e.target.value);
                      setTestResult(null);
                    }}
                    placeholder={`e.g. ${currentProviderObj?.keyPrefixHint || 'Paste your API key here'}`}
                    className="w-full rounded-[12px] bg-white border border-[#CED5E0] pl-3.5 pr-10 py-2.5 text-[13px] font-mono text-[#020C21] focus:border-[#2f5f9e] focus:ring-1 focus:ring-[#2f5f9e] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#59627E] hover:text-[#020C21]"
                  >
                    {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={testingKey || !apiKeyInput.trim()}
                  className="rounded-[12px] bg-white border border-[#CED5E0] px-4 py-2 text-[13px] font-[500] text-[#020C21] hover:bg-[#E6EDF6] disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {testingKey ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={13} className="text-amber-600" />
                      <span>Test Key</span>
                    </>
                  )}
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-[12px] text-[12.5px] flex items-center gap-2 border ${
                    testResult.valid
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  {testResult.valid ? (
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle size={15} className="text-red-600 shrink-0" />
                  )}
                  <span className="flex-1">{testResult.message}</span>
                  {testResult.latencyMs && (
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/70 border border-emerald-300">
                      {testResult.latencyMs}ms
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Model Selection Cards */}
          <div>
            <label className="block text-[13px] font-[500] text-[#020C21] mb-2.5">
              3. Choose Model Tier for {currentProviderObj?.name}
            </label>

            <div className="space-y-2.5">
              {currentProviderObj?.models.map((model) => {
                const isSelected = selectedModel === model.id;
                return (
                  <div
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`p-4 rounded-[16px] border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-[#0F1B31] bg-[#F4F7FB] ring-2 ring-[#0F1B31]/20 shadow-sm'
                        : 'border-[#DDE4EE] bg-white hover:border-[#CED5E0] hover:bg-[#FAFCFF]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14.5px] font-[520] text-[#020C21]">
                          {model.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-[#E3EEF8] text-[#1F4E79] border border-[#C7DCF0]">
                          {model.badge}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-[470] bg-[#E6EDF6] text-[#59627E]">
                          {model.tier}
                        </span>
                        {model.isRecommended && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-amber-50 text-amber-800 border border-amber-200">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] font-[425] text-[#59627E]">
                        {model.description}
                      </p>
                      <span className="text-[11px] font-mono text-[#59627E]/80 block">
                        Context window: {model.contextWindow}
                      </span>
                    </div>

                    <div className="shrink-0 flex items-center">
                      <div
                        className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected ? 'border-[#0F1B31] bg-[#0F1B31]' : 'border-[#CED5E0] bg-white'
                        }`}
                      >
                        {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-[#CED5E0] bg-[#FAFCFF] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[12.5px] text-[#59627E] flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>API keys are proxied server-side and never exposed to client bundles.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={closeModal}
              className="px-5 py-2 rounded-full bg-white border border-[#CED5E0] text-[13px] font-[470] text-[#020C21] hover:bg-[#E6EDF6] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndActivate}
              disabled={saving}
              className="px-6 py-2 rounded-full bg-[#0F1B31] text-[13px] font-[500] text-white hover:bg-[#020C21] transition-colors disabled:opacity-50 cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Activating...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check size={14} />
                  <span>Activated!</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Activate {selectedModel}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
