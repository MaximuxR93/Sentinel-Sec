import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { authDb } from './src/server/auth-db';
import { aiDispatcher } from './src/server/ai-dispatcher';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// ==========================================
// AUTHENTICATION & MONGODB ATLAS API ROUTES
// ==========================================

// Get database connectivity & auth system status
app.get('/api/auth/status', (_req: Request, res: Response) => {
  res.json(authDb.getStatus());
});

// Configure or test live MongoDB Atlas connection
app.post('/api/auth/configure-db', async (req: Request, res: Response) => {
  try {
    const { mongoUri } = req.body;
    if (!mongoUri || typeof mongoUri !== 'string') {
      return res.status(400).json({ error: 'MongoDB Atlas connection URI is required' });
    }
    const result = await authDb.connect(mongoUri);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to connect to MongoDB Atlas' });
  }
});

// Register new analyst account in MongoDB Atlas
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, department } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = await authDb.createUser({ email, password, name, role, department });
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'SentinelFlow-Client';
    const session = await authDb.createSession(user, ip, userAgent);

    return res.status(201).json({
      token: session.token,
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
      },
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

// Login with email and password (session-based + token-based)
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await authDb.findUserByEmail(email);
    if (!user) {
      const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
      await authDb.logAudit({
        userEmail: email,
        action: 'login_failed',
        timestamp: new Date().toISOString(),
        ip,
        metadata: { reason: 'User not found' },
      });
      return res.status(401).json({ error: 'Invalid email or credentials' });
    }

    const isValid = await authDb.verifyPassword(user, password);
    if (!isValid) {
      const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
      await authDb.logAudit({
        userId: user.id,
        userEmail: user.email,
        action: 'login_failed',
        timestamp: new Date().toISOString(),
        ip,
        metadata: { reason: 'Password mismatch' },
      });
      return res.status(401).json({ error: 'Invalid email or credentials' });
    }

    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'SentinelFlow-Client';
    const session = await authDb.createSession(user, ip, userAgent);

    return res.json({
      token: session.token,
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Authentication error' });
  }
});

// Invalidate session (logout)
app.post('/api/auth/logout', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : req.body?.token;

  if (token) {
    await authDb.invalidateSession(token);
    await authDb.logAudit({
      action: 'logout',
      timestamp: new Date().toISOString(),
      metadata: { tokenPrefix: token.substring(0, 10) },
    });
  }
  return res.json({ success: true, message: 'Logged out successfully' });
});

// Verify current session & return active user (Unrestricted open access mode)
app.get('/api/auth/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const result = await authDb.validateToken(token);
    if (result) {
      return res.json({
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          department: result.user.department,
        },
        session: {
          id: result.session.id,
          expiresAt: result.session.expiresAt,
          createdAt: result.session.createdAt,
        },
      });
    }
  }

  // Open Access Default Profile (No authentication or login barriers required)
  return res.json({
    user: {
      id: 'usr_analyst_01',
      email: 'analyst@sentinelflow.io',
      name: 'Lead SOC Analyst',
      role: 'Senior Incident Responder',
      department: 'SecOps Operations',
    },
    session: {
      id: 'sess_open_access',
      expiresAt: '2099-01-01T00:00:00.000Z',
      createdAt: new Date().toISOString(),
    },
  });
});

// Security Audit Logs
app.get('/api/auth/audit-logs', async (_req: Request, res: Response) => {
  const logs = await authDb.getRecentAuditLogs();
  res.json({ logs });
});

// ==========================================
// MULTI-MODEL AI INTELLIGENCE API ROUTES
// (Google Gemini, Anthropic, OpenRouter, xAI Grok, Groq, SentinelFlow AST)
// ==========================================

// API: AI Status (Multi-provider active status & configured keys)
app.get('/api/ai/status', (_req: Request, res: Response) => {
  const status = aiDispatcher.getStatus();
  res.json({
    configured: status.hasActiveKey,
    provider: status.activeProvider,
    model: status.activeModel,
    configuredProviders: status.configuredProviders,
    providers: status.providers,
    message: status.activeProvider === 'sentinelflow'
      ? 'SentinelFlow AST Engine Active (Built-in Local Analyzer)'
      : `${status.activeProvider.toUpperCase()} Model Active (${status.activeModel})`,
  });
});

// API: Available AI Models across all supported providers
app.get('/api/ai/models', (_req: Request, res: Response) => {
  const status = aiDispatcher.getStatus();
  res.json({
    activeProvider: status.activeProvider,
    activeModel: status.activeModel,
    providers: status.providers,
    configured: status.hasActiveKey,
  });
});

// API: Configure active AI provider, model, and optional API key
app.post('/api/ai/configure', (req: Request, res: Response) => {
  try {
    const { provider, model, apiKey } = req.body;
    if (!provider) {
      return res.status(400).json({ error: 'Provider is required' });
    }
    const updatedStatus = aiDispatcher.setConfig(provider, model, apiKey);
    return res.json({
      success: true,
      status: updatedStatus,
      message: `Configured active AI model: ${updatedStatus.activeModel} (${updatedStatus.activeProvider})`,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to configure AI provider' });
  }
});

// API: Test an API key with live verification
app.post('/api/ai/test-key', async (req: Request, res: Response) => {
  try {
    const { provider, apiKey, model } = req.body;
    if (!provider) {
      return res.status(400).json({ error: 'Provider is required' });
    }
    const result = await aiDispatcher.testApiKey(provider, apiKey, model);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ valid: false, message: err.message || 'Verification test failed' });
  }
});

// API: Switch active model
app.post('/api/ai/models/select', (req: Request, res: Response) => {
  const { provider, model } = req.body;
  try {
    const currentStatus = aiDispatcher.getStatus();
    const targetProvider = provider || currentStatus.activeProvider;
    const updatedStatus = aiDispatcher.setConfig(targetProvider, model);
    return res.json({ success: true, activeProvider: updatedStatus.activeProvider, activeModel: updatedStatus.activeModel });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to select model' });
  }
});

// API: AI Vulnerability Analysis & Explanation
app.post('/api/ai/explain', async (req: Request, res: Response) => {
  const { title, ruleId, cwe, file, codeSnippet, explanation, cvss, provider, model, apiKey } = req.body;

  const systemPrompt =
    'You are SentinelFlow Security Intelligence Assistant. Provide a crisp, expert, evidence-grounded analysis of the given vulnerability. Include: 1) AST Root Cause, 2) Attack Mechanism & Threat Actor Impact, 3) Defense-in-depth mitigation guidance. Format in clean Markdown without conversational filler.';

  const prompt = `Vulnerability: ${title} (${ruleId})\nClassification: ${cwe} · CVSS ${cvss || 'N/A'}\nFile: ${file}\nCode:\n\`\`\`\n${codeSnippet}\n\`\`\`\nStatic Analysis Context:\n${explanation}`;

  const result = await aiDispatcher.complete({
    systemPrompt,
    prompt,
    provider,
    model,
    apiKey,
    maxTokens: 1000,
  });

  return res.json({
    success: true,
    provider: result.provider,
    model: result.model,
    analysis: result.text,
  });
});

// API: AI Remediation & Patch Generation
app.post('/api/ai/remediate', async (req: Request, res: Response) => {
  const { title, ruleId, file, codeSnippet, provider, model, apiKey } = req.body;

  const systemPrompt =
    'You are SentinelFlow Automated Remediation Engine. Generate a secure, production-grade code fix for the specified vulnerability. Output a unified git diff format code block (```diff) followed by concise AST mutation notes.';

  const prompt = `Generate a remediation patch for:\nRule: ${ruleId} - ${title}\nFile: ${file}\nVulnerable snippet:\n\`\`\`\n${codeSnippet}\n\`\`\``;

  const result = await aiDispatcher.complete({
    systemPrompt,
    prompt,
    provider,
    model,
    apiKey,
    maxTokens: 1100,
  });

  return res.json({
    success: true,
    provider: result.provider,
    model: result.model,
    patchExplanation: result.text,
  });
});

// API: Automated Incident Triage Assistance
app.post('/api/ai/triage', async (req: Request, res: Response) => {
  const { incidentTitle, severity, description, provider, model, apiKey } = req.body;

  const systemPrompt =
    'You are SentinelFlow Incident Triage AI. Analyze the security report and formulate triage recommendations, priority justification, and immediate containment steps.';

  const prompt = `Incident: ${incidentTitle}\nSeverity: ${severity}\nDescription:\n${description}`;

  const result = await aiDispatcher.complete({
    systemPrompt,
    prompt,
    provider,
    model,
    apiKey,
    maxTokens: 900,
  });

  return res.json({
    success: true,
    provider: result.provider,
    model: result.model,
    recommendation: result.text,
  });
});

// API: General AI Security Assistance
app.post('/api/ai/assist', async (req: Request, res: Response) => {
  const { prompt, context, provider, model, apiKey } = req.body;

  const systemPrompt =
    'You are SentinelFlow Security Assistant, an elite application security and incident response copilot. Provide actionable, concise, technically rigorous guidance for security analysts triaging vulnerabilities and incidents.';

  const fullPrompt = `${context ? `Context: ${context}\n\n` : ''}Query: ${prompt}`;

  const result = await aiDispatcher.complete({
    systemPrompt,
    prompt: fullPrompt,
    provider,
    model,
    apiKey,
    maxTokens: 1200,
  });

  return res.json({
    success: true,
    provider: result.provider,
    model: result.model,
    answer: result.text,
  });
});

// API: Real-time Repository Architectural Analysis
app.post('/api/ai/analyze-repo', async (req: Request, res: Response) => {
  const { repoUrl, repoName, fileList, provider, model, apiKey } = req.body;

  const systemPrompt =
    'You are SentinelFlow Architecture Graph Synthesizer. Based on repository files and tech stack, analyze the architectural attack surfaces and critical taint paths. Return clean markdown with identified ingress points, microservices, execution sinks, and threat vectors.';

  const prompt = `Repository: ${repoName || repoUrl}\nTarget: ${repoUrl}\nFiles detected:\n${(fileList || ['server.js', 'package.json', 'src/app.tsx']).slice(0, 25).join('\n')}`;

  const result = await aiDispatcher.complete({
    systemPrompt,
    prompt,
    provider,
    model,
    apiKey,
    maxTokens: 1000,
  });

  return res.json({
    success: true,
    provider: result.provider,
    model: result.model,
    analysis: result.text,
  });
});

// Mount Vite or serve static assets
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    const aiStatus = aiDispatcher.getStatus();
    console.log(`[SentinelFlow] Server running on http://localhost:${PORT}`);
    console.log(`[SentinelFlow] Multi-Model AI Engine: ${aiStatus.activeModel} (${aiStatus.activeProvider})`);
  });
}

startServer();
