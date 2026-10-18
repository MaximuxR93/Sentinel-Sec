import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api-client';

export interface AiModelItem {
  id: string;
  name: string;
  provider: 'gemini' | 'anthropic' | 'openrouter' | 'grok' | 'groq' | 'sentinelflow';
  description: string;
  badge: string;
  tier: string;
  contextWindow: string;
  isRecommended?: boolean;
}

export interface AiProviderItem {
  id: 'gemini' | 'anthropic' | 'openrouter' | 'grok' | 'groq' | 'sentinelflow';
  name: string;
  description: string;
  keyPrefixHint: string;
  helpUrl: string;
  hasKey: boolean;
  activeModel: string;
  models: AiModelItem[];
}

interface AiContextType {
  activeProvider: 'gemini' | 'anthropic' | 'openrouter' | 'grok' | 'groq' | 'sentinelflow';
  activeModel: string;
  providers: AiProviderItem[];
  hasActiveKey: boolean;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  configureProvider: (provider: string, model?: string, apiKey?: string) => Promise<boolean>;
  testKey: (provider: string, apiKey: string, model?: string) => Promise<{ valid: boolean; message: string; latencyMs?: number }>;
  explainFinding: (finding: {
    title: string;
    ruleId: string;
    cwe: string;
    file: string;
    codeSnippet: string;
    explanation: string;
    cvss?: number;
  }) => Promise<{ analysis: string; provider: string; model: string }>;
  remediateFinding: (finding: {
    title: string;
    ruleId: string;
    file: string;
    codeSnippet: string;
  }) => Promise<{ patchExplanation: string; provider: string; model: string }>;
  triageReport: (report: {
    incidentTitle: string;
    severity: string;
    description: string;
  }) => Promise<{ recommendation: string; provider: string; model: string }>;
  askCopilot: (prompt: string, context?: string) => Promise<{ answer: string; provider: string; model: string }>;
  analyzeRepository: (repoUrl: string, repoName?: string, fileList?: string[]) => Promise<{ analysis: string; provider: string; model: string }>;
  refreshStatus: () => Promise<void>;
  userApiKeys: Record<string, string>;
  setUserApiKey: (provider: string, key: string) => void;
}

const AiContext = createContext<AiContextType | undefined>(undefined);

export const AiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeProvider, setActiveProvider] = useState<'gemini' | 'anthropic' | 'openrouter' | 'grok' | 'groq' | 'sentinelflow'>('gemini');
  const [activeModel, setActiveModel] = useState<string>('gemini-2.5-flash');
  const [providers, setProviders] = useState<AiProviderItem[]>([]);
  const [hasActiveKey, setHasActiveKey] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [userApiKeys, setUserApiKeys] = useState<Record<string, string>>(() => {
    try {
      const saved = sessionStorage.getItem('sentinelflow_ai_keys');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const setUserApiKey = (provider: string, key: string) => {
    setUserApiKeys((prev) => {
      const updated = { ...prev, [provider]: key };
      try {
        sessionStorage.setItem('sentinelflow_ai_keys', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const refreshStatus = useCallback(async () => {
    try {
      const data = await api.getAiModels();
      if (data.providers && data.providers.length > 0) {
        setProviders(data.providers as any);
      }
      if (data.activeProvider) {
        setActiveProvider(data.activeProvider as any);
      }
      if (data.activeModel) {
        setActiveModel(data.activeModel);
      }
      setHasActiveKey(Boolean(data.configured));
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const configureProvider = async (provider: string, model?: string, apiKey?: string): Promise<boolean> => {
    try {
      const res = await api.configureAi({ provider, model, apiKey });
      if (res.success) {
        setActiveProvider(provider as any);
        if (model) setActiveModel(model);
        if (apiKey) setUserApiKey(provider, apiKey);
        await refreshStatus();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to configure AI provider:', err);
      return false;
    }
  };

  const testKey = async (provider: string, apiKey: string, model?: string) => {
    return api.testAiKey({ provider, apiKey, model });
  };

  const explainFinding = async (finding: {
    title: string;
    ruleId: string;
    cwe: string;
    file: string;
    codeSnippet: string;
    explanation: string;
    cvss?: number;
  }) => {
    const key = userApiKeys[activeProvider];
    const res = await api.explainWithAi({
      ...finding,
      provider: activeProvider,
      model: activeModel,
      apiKey: key,
    });
    return {
      analysis: res.analysis,
      provider: res.provider,
      model: res.model,
    };
  };

  const remediateFinding = async (finding: {
    title: string;
    ruleId: string;
    file: string;
    codeSnippet: string;
  }) => {
    const key = userApiKeys[activeProvider];
    const res = await api.remediateWithAi({
      ...finding,
      provider: activeProvider,
      model: activeModel,
      apiKey: key,
    });
    return {
      patchExplanation: res.patchExplanation,
      provider: res.provider,
      model: res.model,
    };
  };

  const triageReport = async (report: {
    incidentTitle: string;
    severity: string;
    description: string;
  }) => {
    const key = userApiKeys[activeProvider];
    const res = await api.triageWithAi({
      ...report,
      provider: activeProvider,
      model: activeModel,
      apiKey: key,
    });
    return {
      recommendation: res.recommendation,
      provider: res.provider,
      model: res.model,
    };
  };

  const askCopilot = async (prompt: string, context?: string) => {
    const key = userApiKeys[activeProvider];
    const res = await api.assistWithAi({
      prompt,
      context,
      provider: activeProvider,
      model: activeModel,
      apiKey: key,
    });
    return {
      answer: res.answer,
      provider: res.provider,
      model: res.model,
    };
  };

  const analyzeRepository = async (repoUrl: string, repoName?: string, fileList?: string[]) => {
    const key = userApiKeys[activeProvider];
    const res = await api.analyzeRepoWithAi({
      repoUrl,
      repoName,
      fileList,
      provider: activeProvider,
      model: activeModel,
      apiKey: key,
    });
    return {
      analysis: res.analysis,
      provider: res.provider,
      model: res.model,
    };
  };

  return (
    <AiContext.Provider
      value={{
        activeProvider,
        activeModel,
        providers,
        hasActiveKey,
        isModalOpen,
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
        configureProvider,
        testKey,
        explainFinding,
        remediateFinding,
        triageReport,
        askCopilot,
        analyzeRepository,
        refreshStatus,
        userApiKeys,
        setUserApiKey,
      }}
    >
      {children}
    </AiContext.Provider>
  );
};

export const useAi = (): AiContextType => {
  const context = useContext(AiContext);
  if (!context) {
    throw new Error('useAi must be used within an AiProvider');
  }
  return context;
};
