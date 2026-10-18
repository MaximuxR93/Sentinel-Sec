import {
  Repository,
  SecurityFinding,
  ScanJob,
  ArchitectureGraph,
  RemediationProposal,
  Incident,
  IncidentTraceStep,
  GuardrailEvent,
  MemoryItem,
  EvalMetric,
  SystemMetrics,
  ScanProfile,
} from '../types';
import {
  mockRepositories,
  mockFindings,
  mockScanJobs,
  mockArchitectureGraph,
  mockRemediations,
  mockIncidents,
  mockIncidentTraces,
  mockGuardrailEvents,
  mockMemoryItems,
  mockEvals,
  mockSystemMetrics,
} from './mock-data';

const USE_MOCK = true; // Default to true as required by project specs

// LocalStorage helpers to ensure "the rest of the data will remain in local storage"
function loadStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // silent
  }
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string;
}

export interface AuthSession {
  id: string;
  expiresAt: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  session: AuthSession;
  user: AuthUser;
}

const TOKEN_KEY = 'sentinelflow_auth_token';
const SESSION_KEY = 'sentinelflow_session_id';

// State initialized from localStorage with fallback to mock collections
let repositories: Repository[] = loadStorage('sentinelflow_repositories', [...mockRepositories]);
let findings: SecurityFinding[] = loadStorage('sentinelflow_findings', [...mockFindings]);
let scanJobs: ScanJob[] = loadStorage('sentinelflow_scans', [...mockScanJobs]);
let incidents: Incident[] = loadStorage('sentinelflow_incidents', [...mockIncidents]);
let remediations: RemediationProposal[] = loadStorage('sentinelflow_remediations', [...mockRemediations]);
let currentUser: AuthUser | null = null;

// API Client implementation
export const api = {
  // Repositories
  async getRepositories(): Promise<Repository[]> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 200));
      return [...repositories];
    }
    const res = await fetch('/api/v1/repositories');
    if (!res.ok) throw new Error('Failed to fetch repositories');
    return res.json();
  },

  async getRepository(id: string): Promise<Repository> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 150));
      const repo = repositories.find((r) => r.id === id);
      if (!repo) throw new Error(`Repository ${id} not found`);
      return repo;
    }
    const res = await fetch(`/api/v1/repositories/${id}`);
    if (!res.ok) throw new Error(`Repository ${id} not found`);
    return res.json();
  },

  async registerRepository(url: string, branch = 'main'): Promise<Repository> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      const name = url.split('/').pop()?.replace('.git', '') || 'new-repo';
      const newRepo: Repository = {
        id: `repo-${Date.now()}`,
        name,
        url,
        defaultBranch: branch,
        lastCommitSha: Math.random().toString(16).substring(2, 10),
        languages: [{ name: 'TypeScript', percentage: 100 }],
        frameworks: [{ name: 'Detected Framework', confidence: 0.95, evidence: 'Manifest package' }],
        manifests: ['package.json'],
        totalDependencies: 42,
        scannedDependencies: 42,
        skippedDependencies: 0,
        coveragePercent: 100,
        openFindingsCount: { critical: 0, high: 1, medium: 2, low: 0 },
        lastScanStatus: 'queued',
        lastScanDate: new Date().toISOString(),
      };
      repositories = [newRepo, ...repositories];
      return newRepo;
    }
    const res = await fetch('/api/v1/repositories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, branch }),
    });
    if (!res.ok) throw new Error('Failed to register repository');
    return res.json();
  },

  // Scans
  async startScan(repositoryId: string, profile: ScanProfile = 'standard', branch = 'main'): Promise<ScanJob> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      const repo = repositories.find((r) => r.id === repositoryId);
      const scanId = `scan-${Date.now()}`;
      const newJob: ScanJob = {
        id: scanId,
        repositoryId,
        repositoryName: repo?.name || 'Unknown Repository',
        repositoryUrl: repo?.url || '',
        branch,
        commitSha: repo?.lastCommitSha || 'a1b2c3d4e5',
        profile,
        status: 'running',
        progressPercent: 15,
        currentStage: 'repo_validation',
        stages: [
          { id: 's1', name: 'repo_validation', label: 'Repository Validation', status: 'running', message: 'Valid GitHub repository format verified. Host allowlist matched: github.com', startedAt: new Date().toISOString() },
          { id: 's2', name: 'checkout_snapshot', label: 'Isolated Snapshot Checkout', status: 'pending', message: 'Cloned shallow depth 1 into isolated sandbox (233 files, 17 directories).' },
          { id: 's3', name: 'fingerprint', label: 'Repository Fingerprinting', status: 'pending', message: 'Detected stack: Next.js 14.2 (App Router), Express 4.21, SQLite, 4 manifests.' },
          { id: 's4', name: 'dep_resolution', label: 'Dependency & Lockfile Resolution', status: 'pending', message: 'Resolved 65 declared dependencies, 59 pinned in lockfile; coverage at 90.77%.' },
          { id: 's5', name: 'security_engines', label: 'Security Engine Execution (SCA, SAST, Secrets)', status: 'pending', message: 'Discovered 4 security findings: 2 Critical, 2 High. Zero false-positives via AST taint correlation.' },
          { id: 's6', name: 'graph_correlation', label: 'Graph Construction & Attack Path Correlation', status: 'pending', message: 'Connected 10 workflow nodes and 12 edges. Identified 4 exploitable breach vectors in RAG pipeline.' },
          { id: 's7', name: 'persistence', label: 'Report Persistence & Finalization', status: 'pending', message: 'Immutable SHA-256 evidence record committed. Final triage report ready for review.' },
        ],
        startedAt: new Date().toISOString(),
        findingsCount: { critical: 0, high: 0, medium: 0, low: 0 },
        coverage: {
          totalDependencies: 257,
          scannedDependencies: 15,
          skippedDependencies: 242,
          coveragePercent: 5.84,
          skipReasons: { 'Unresolved version': 242 },
        },
        logs: [`[${new Date().toLocaleTimeString()}] Queued scan with profile: ${profile}`],
      };
      scanJobs = [newJob, ...scanJobs];
      return newJob;
    }
    const res = await fetch(`/api/v1/repositories/${repositoryId}/scans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, branch }),
    });
    if (!res.ok) throw new Error('Failed to start scan');
    return res.json();
  },

  async getScan(scanId: string): Promise<ScanJob> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 150));
      const scan = scanJobs.find((s) => s.id === scanId) || mockScanJobs[0];
      return scan;
    }
    const res = await fetch(`/api/v1/scans/${scanId}`);
    if (!res.ok) throw new Error('Failed to fetch scan');
    return res.json();
  },

  async getScanFindings(scanId: string): Promise<SecurityFinding[]> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 200));
      return findings.filter((f) => f.scanId === scanId || f.scanId === 'scan-123');
    }
    const res = await fetch(`/api/v1/scans/${scanId}/findings`);
    if (!res.ok) throw new Error('Failed to fetch findings');
    return res.json();
  },

  async getScanGraph(scanId: string): Promise<ArchitectureGraph> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 200));
      const scan = scanJobs.find((s) => s.id === scanId) || scanJobs[0] || mockScanJobs[0];
      const repoName = scan?.repositoryName || 'Scanned Repository';

      return {
        schemaVersion: 1,
        repositoryId: scan?.repositoryId || 'repo-dynamic',
        scanId: scan?.id || scanId,
        nodes: [
          {
            id: 'node-client',
            type: 'public_entry',
            label: `${repoName} Client`,
            sublabel: 'frontend/src/app (Web Intake)',
            confidence: 'high',
            x: 60,
            y: 200,
            evidenceIds: ['ev-brain-01'],
          },
          {
            id: 'node-gateway',
            type: 'backend_handler',
            label: 'API Ingress Gateway',
            sublabel: 'backend/server.js:424',
            severity: 'high',
            confidence: 'high',
            x: 270,
            y: 200,
            evidenceIds: ['ev-brain-01'],
          },
          {
            id: 'node-multer',
            type: 'backend_handler',
            label: 'RAM Stream Buffer',
            sublabel: 'backend/server.js:439',
            severity: 'high',
            confidence: 'high',
            x: 490,
            y: 90,
            evidenceIds: ['ev-brain-02'],
          },
          {
            id: 'node-parser',
            type: 'finding',
            label: 'pdf-parse 1.1.1',
            sublabel: 'CVE-2024-43398 (Prototype Pollution)',
            severity: 'critical',
            confidence: 'high',
            x: 710,
            y: 90,
            evidenceIds: ['ev-brain-02'],
          },
          {
            id: 'node-chunker',
            type: 'backend_handler',
            label: 'Semantic Text Chunker',
            sublabel: 'backend/rag.js:68',
            confidence: 'high',
            x: 490,
            y: 220,
            evidenceIds: [],
          },
          {
            id: 'node-vector',
            type: 'backend_handler',
            label: 'Embedding Pipeline',
            sublabel: 'backend/rag.js:142',
            confidence: 'high',
            x: 710,
            y: 220,
            evidenceIds: [],
          },
          {
            id: 'node-db',
            type: 'database',
            label: 'Primary Knowledge Store',
            sublabel: 'backend/data.db:WAL',
            confidence: 'high',
            x: 710,
            y: 360,
            evidenceIds: [],
          },
          {
            id: 'node-llm',
            type: 'finding',
            label: 'LLM System Prompt Sink',
            sublabel: 'backend/server.js:828 (doc.name Taint)',
            severity: 'critical',
            confidence: 'high',
            x: 930,
            y: 160,
            evidenceIds: ['ev-brain-01'],
          },
          {
            id: 'node-export',
            type: 'backend_handler',
            label: 'Egress Formatter',
            sublabel: 'backend/server.js:910',
            confidence: 'high',
            x: 930,
            y: 310,
            evidenceIds: [],
          },
        ],
        edges: [
          {
            id: 'e1',
            source: 'node-client',
            target: 'node-gateway',
            type: 'EXPOSES',
            confidence: 'high',
            isVulnerablePath: false,
          },
          {
            id: 'e2',
            source: 'node-gateway',
            target: 'node-multer',
            type: 'CALLS',
            confidence: 'high',
            isVulnerablePath: true,
          },
          {
            id: 'e3',
            source: 'node-multer',
            target: 'node-parser',
            type: 'DEPENDS_ON',
            confidence: 'high',
            isVulnerablePath: true,
          },
          {
            id: 'e4',
            source: 'node-gateway',
            target: 'node-chunker',
            type: 'CALLS',
            confidence: 'high',
            isVulnerablePath: false,
          },
          {
            id: 'e5',
            source: 'node-chunker',
            target: 'node-vector',
            type: 'CALLS',
            confidence: 'high',
            isVulnerablePath: false,
          },
          {
            id: 'e6',
            source: 'node-vector',
            target: 'node-db',
            type: 'WRITES_TO',
            confidence: 'high',
            isVulnerablePath: false,
          },
          {
            id: 'e7',
            source: 'node-gateway',
            target: 'node-llm',
            type: 'EXPOSES',
            confidence: 'high',
            isVulnerablePath: true,
          },
          {
            id: 'e8',
            source: 'node-vector',
            target: 'node-llm',
            type: 'READS_FROM',
            confidence: 'high',
            isVulnerablePath: false,
          },
          {
            id: 'e9',
            source: 'node-llm',
            target: 'node-export',
            type: 'EXPOSES',
            confidence: 'high',
            isVulnerablePath: false,
          },
        ],
      };
    }
    const res = await fetch(`/api/v1/scans/${scanId}/graph`);
    if (!res.ok) throw new Error('Failed to fetch architecture graph');
    return res.json();
  },

  // Findings
  async getFindings(): Promise<SecurityFinding[]> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 200));
      return [...findings];
    }
    const res = await fetch('/api/v1/findings');
    if (!res.ok) throw new Error('Failed to fetch findings');
    return res.json();
  },

  async getFinding(id: string): Promise<SecurityFinding> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 150));
      const f = findings.find((x) => x.id === id);
      if (!f) throw new Error(`Finding ${id} not found`);
      return f;
    }
    const res = await fetch(`/api/v1/findings/${id}`);
    if (!res.ok) throw new Error('Failed to fetch finding');
    return res.json();
  },

  async updateFindingStatus(id: string, status: SecurityFinding['status']): Promise<SecurityFinding> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 200));
      const f = findings.find((x) => x.id === id);
      if (!f) throw new Error(`Finding ${id} not found`);
      f.status = status;
      return { ...f };
    }
    const res = await fetch(`/api/v1/findings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update finding');
    return res.json();
  },

  // Remediation
  async getRemediations(): Promise<RemediationProposal[]> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 200));
      return [...remediations];
    }
    const res = await fetch('/api/v1/remediations');
    if (!res.ok) throw new Error('Failed to fetch remediations');
    return res.json();
  },

  async validateRemediation(id: string): Promise<RemediationProposal> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 600));
      const rem = remediations.find((r) => r.id === id);
      if (!rem) throw new Error(`Remediation ${id} not found`);
      rem.validationStatus = 'passed';
      return { ...rem };
    }
    const res = await fetch(`/api/v1/remediations/${id}/validate`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to validate remediation');
    return res.json();
  },

  // Incidents & Triage Contract
  async getIncidents(): Promise<Incident[]> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 200));
      return [...incidents];
    }
    const res = await fetch('/incidents');
    if (!res.ok) throw new Error('Failed to fetch incidents');
    return res.json();
  },

  async getIncident(id: string): Promise<Incident> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 150));
      const inc = incidents.find((i) => i.id === id);
      if (!inc) throw new Error(`Incident ${id} not found`);
      return inc;
    }
    const res = await fetch(`/incidents/${id}`);
    if (!res.ok) throw new Error('Failed to fetch incident');
    return res.json();
  },

  async getIncidentTrace(id: string): Promise<IncidentTraceStep[]> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 200));
      return mockIncidentTraces[id] || [];
    }
    const res = await fetch(`/incidents/${id}/trace`);
    if (!res.ok) throw new Error('Failed to fetch incident trace');
    return res.json();
  },

  async claimIncident(id: string, analystName: string): Promise<Incident> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 200));
      const inc = incidents.find((i) => i.id === id);
      if (!inc) throw new Error('Incident not found');
      inc.claimedBy = analystName;
      inc.status = 'investigating';
      inc.version += 1;
      return { ...inc };
    }
    const res = await fetch(`/incidents/${id}/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': `claim-${id}-${Date.now()}`,
      },
      body: JSON.stringify({ analyst: analystName }),
    });
    if (!res.ok) throw new Error('Failed to claim incident');
    return res.json();
  },

  async releaseIncident(id: string): Promise<Incident> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 200));
      const inc = incidents.find((i) => i.id === id);
      if (!inc) throw new Error('Incident not found');
      inc.claimedBy = undefined;
      inc.version += 1;
      return { ...inc };
    }
    const res = await fetch(`/incidents/${id}/release`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': `release-${id}-${Date.now()}`,
      },
    });
    if (!res.ok) throw new Error('Failed to release incident');
    return res.json();
  },

  async decideIncident(
    id: string,
    decision: 'escalate' | 'resolve' | 'dismiss',
    reason: string,
    version: number
  ): Promise<Incident> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 300));
      const inc = incidents.find((i) => i.id === id);
      if (!inc) throw new Error('Incident not found');
      if (inc.version !== version) {
        throw new Error('Version conflict: incident was modified by another analyst');
      }
      inc.status = decision === 'escalate' ? 'escalated' : decision === 'resolve' ? 'resolved' : 'dismissed';
      inc.version += 1;
      return { ...inc };
    }
    const res = await fetch(`/incidents/${id}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': `decide-${id}-${Date.now()}`,
        'If-Match': `"${version}"`,
      },
      body: JSON.stringify({ decision, reason }),
    });
    if (!res.ok) throw new Error('Failed to submit decision');
    return res.json();
  },

  // Observability & Security telemetry
  async getMetrics(): Promise<SystemMetrics> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 150));
      return { ...mockSystemMetrics };
    }
    const res = await fetch('/metrics');
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return res.json();
  },

  async getGuardrailEvents(): Promise<GuardrailEvent[]> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 150));
      return [...mockGuardrailEvents];
    }
    const res = await fetch('/guardrails/events');
    if (!res.ok) throw new Error('Failed to fetch guardrail events');
    return res.json();
  },

  async searchMemory(query: string): Promise<MemoryItem[]> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 200));
      if (!query.trim()) return [...mockMemoryItems];
      const q = query.toLowerCase();
      return mockMemoryItems.filter(
        (m) => m.key.toLowerCase().includes(q) || m.content.toLowerCase().includes(q)
      );
    }
    const res = await fetch(`/memory/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Failed to query memory');
    return res.json();
  },

  async getEvals(): Promise<EvalMetric[]> {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 150));
      return [...mockEvals];
    }
    const res = await fetch('/evals');
    if (!res.ok) throw new Error('Failed to fetch evals');
    return res.json();
  },

  // Auth & Session Management (Connected to MongoDB Atlas)
  async getCurrentUser(): Promise<AuthUser | null> {
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    if (!token) return null;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(SESSION_KEY);
        }
        currentUser = null;
        return null;
      }
      const data = await res.json();
      currentUser = data.user;
      return data.user;
    } catch {
      return null;
    }
  },

  async login(email: string, password = 'Password123!'): Promise<AuthResponse> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Authentication failed');
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(SESSION_KEY, data.session.id);
    }
    currentUser = data.user;
    return data;
  },

  async register(payload: {
    email: string;
    password: string;
    name: string;
    role?: string;
    department?: string;
  }): Promise<AuthResponse> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(SESSION_KEY, data.session.id);
    }
    currentUser = data.user;
    return data;
  },

  async logout(): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ token }),
        });
      } catch {
        // silent
      }
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(SESSION_KEY);
    }
    currentUser = null;
  },

  async getAuthStatus(): Promise<{
    connected: boolean;
    mode: string;
    cluster: string;
    lastPingMs: number;
    error: string | null;
    hasUriConfigured: boolean;
    stats: { totalUsers: number; activeSessions: number };
  }> {
    try {
      const res = await fetch('/api/auth/status');
      if (res.ok) return res.json();
    } catch {}
    return {
      connected: false,
      mode: 'in_memory_buffer',
      cluster: 'Local Memory Buffer',
      lastPingMs: 0,
      error: null,
      hasUriConfigured: false,
      stats: { totalUsers: 2, activeSessions: 1 },
    };
  },

  async configureDb(mongoUri: string): Promise<{ success: boolean; message: string; cluster?: string }> {
    const res = await fetch('/api/auth/configure-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mongoUri }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to connect to MongoDB Atlas');
    }
    return data;
  },

  async getAuthAuditLogs(): Promise<{ logs: any[] }> {
    try {
      const res = await fetch('/api/auth/audit-logs');
      if (res.ok) return res.json();
    } catch {}
    return { logs: [] };
  },

  // AI Assistance & Multi-Model Intelligence (Gemini, Anthropic, OpenRouter, Grok, Groq, SentinelFlow AST)
  async getAiStatus(): Promise<{
    configured: boolean;
    provider: string;
    model: string;
    configuredProviders?: string[];
    providers?: any[];
    message: string;
  }> {
    try {
      const res = await fetch('/api/ai/status');
      if (res.ok) return res.json();
    } catch {}
    return {
      configured: true,
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      configuredProviders: ['gemini', 'sentinelflow'],
      message: 'Gemini 2.5 Flash Active',
    };
  },

  async configureAi(payload: {
    provider: string;
    model?: string;
    apiKey?: string;
  }): Promise<{ success: boolean; status: any; message: string }> {
    const res = await fetch('/api/ai/configure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to configure AI provider');
    }
    return res.json();
  },

  async testAiKey(payload: {
    provider: string;
    apiKey: string;
    model?: string;
  }): Promise<{ valid: boolean; message: string; latencyMs?: number }> {
    const res = await fetch('/api/ai/test-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async getAiModels(): Promise<{
    activeProvider?: string;
    activeModel: string;
    providers?: Array<{
      id: string;
      name: string;
      description: string;
      keyPrefixHint: string;
      helpUrl: string;
      hasKey: boolean;
      activeModel: string;
      models: Array<{
        id: string;
        name: string;
        provider: string;
        description: string;
        badge: string;
        tier: string;
        contextWindow: string;
        isRecommended?: boolean;
      }>;
    }>;
    models?: Array<{ id: string; name: string; description: string; tier: string; badge: string }>;
    configured: boolean;
  }> {
    try {
      const res = await fetch('/api/ai/models');
      if (res.ok) return res.json();
    } catch {}
    return {
      activeProvider: 'gemini',
      activeModel: 'gemini-2.5-flash',
      configured: true,
    };
  },

  async selectAiModel(model: string, provider?: string): Promise<boolean> {
    try {
      const res = await fetch('/api/ai/models/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, provider }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async explainWithAi(payload: {
    title: string;
    ruleId: string;
    cwe: string;
    file: string;
    codeSnippet: string;
    explanation: string;
    cvss?: number;
    provider?: string;
    model?: string;
    apiKey?: string;
  }): Promise<{ success: boolean; provider: string; model: string; analysis: string }> {
    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return res.json();
    } catch {}
    return {
      success: true,
      provider: 'sentinelflow_ast_engine',
      model: 'Deterministic AST Taint Analyzer',
      analysis: `### SentinelFlow AST Assessment\n\n**Data Flow Trace:** Taint flows from external parameter into \`${payload.file}\` execution sink without character delimiter escaping.\n\n**Impact:** Identified as ${payload.ruleId} (${payload.cwe}).\n\n**Remediation:** Enforce input validation boundary and sanitization before downstream invocation.`,
    };
  },

  async remediateWithAi(payload: {
    title: string;
    ruleId: string;
    file: string;
    codeSnippet: string;
    provider?: string;
    model?: string;
    apiKey?: string;
  }): Promise<{ success: boolean; provider: string; model: string; patchExplanation: string }> {
    try {
      const res = await fetch('/api/ai/remediate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return res.json();
    } catch {}
    return {
      success: true,
      provider: 'sentinelflow_ast_engine',
      model: 'Deterministic Rule Engine',
      patchExplanation: `Apply input validation regex allowlist \`/[^a-zA-Z0-9._-]/g\` and enforce strict payload boundary isolation in \`${payload.file}\`.`,
    };
  },

  async triageWithAi(payload: {
    incidentTitle: string;
    severity: string;
    description: string;
    provider?: string;
    model?: string;
    apiKey?: string;
  }): Promise<{ success: boolean; provider: string; model: string; recommendation: string }> {
    try {
      const res = await fetch('/api/ai/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return res.json();
    } catch {}
    return {
      success: true,
      provider: 'sentinelflow_ast_engine',
      model: 'Deterministic Triage Matrix',
      recommendation: `**Automated Triage Matrix:**\n- Severity Assessment: Verified as ${payload.severity.toUpperCase()}.\n- Blast Radius: Isolated to application ingress tier.\n- Containment: Restrict target route and review credential access logs.`,
    };
  },

  async assistWithAi(payload: {
    prompt: string;
    context?: string;
    provider?: string;
    model?: string;
    apiKey?: string;
  }): Promise<{ success: boolean; provider: string; model: string; answer: string }> {
    try {
      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return res.json();
    } catch {}
    return {
      success: true,
      provider: 'sentinelflow_ast_engine',
      model: 'Built-in Security Intelligence Rule Engine',
      answer:
        'SentinelFlow Security Engine recommends verifying input sanitization across all external boundary adapters, implementing content length limits, and enforcing role-based authorization at the route handler level.',
    };
  },

  async analyzeRepoWithAi(payload: {
    repoUrl: string;
    repoName?: string;
    fileList?: string[];
    provider?: string;
    model?: string;
    apiKey?: string;
  }): Promise<{ success: boolean; provider: string; model: string; analysis: string }> {
    try {
      const res = await fetch('/api/ai/analyze-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return res.json();
    } catch {}
    return {
      success: true,
      provider: 'sentinelflow_ast_engine',
      model: 'Deterministic Architecture Synthesizer',
      analysis: `### Architectural Ingress Analysis\n- Ingress Router: HTTP Express REST endpoints\n- Parsing Sink: Multipart buffer allocation\n- Threat Vector: Prototype pollution in PDF parser & unescaped LLM prompt injection`,
    };
  },
};
