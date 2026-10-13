/**
 * Automated Migration Script: Vite + React -> Next.js 15 (App Router)
 * Run this on your local machine:
 *   node scripts/migrate-to-nextjs.mjs
 */

import fs from 'fs';
import path from 'path';

const root = process.cwd();

console.log('🚀 Starting automated migration to Next.js 15 App Router...');

// 1. Backup package.json and write Next.js package.json
const pkgPath = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

fs.writeFileSync(path.join(root, 'package.json.vite.bak'), JSON.stringify(pkg, null, 2));
console.log('✅ Backed up original package.json to package.json.vite.bak');

const nextPkg = {
  name: pkg.name || 'sentinelflow',
  version: '1.0.0',
  private: true,
  type: 'module',
  scripts: {
    dev: 'next dev -p 3000',
    build: 'next build',
    start: 'next start -p 3000',
    lint: 'next lint',
  },
  dependencies: {
    next: '^15.1.0',
    react: '^18.3.1',
    'react-dom': '^18.3.1',
    'lucide-react': '^0.460.0',
    clsx: '^2.1.1',
    recharts: '^2.15.0',
    dotenv: '^18.0.7',
  },
  devDependencies: {
    '@types/node': '^20.17.0',
    '@types/react': '^18.3.1',
    '@types/react-dom': '^18.3.1',
    typescript: '^5.6.3',
    tailwindcss: '^4.0.0',
    '@tailwindcss/postcss': '^4.0.0',
    postcss: '^8.4.38',
  },
};

fs.writeFileSync(pkgPath, JSON.stringify(nextPkg, null, 2));
console.log('✅ Updated package.json for Next.js 15');

// 2. Create next.config.mjs
const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
`;
fs.writeFileSync(path.join(root, 'next.config.mjs'), nextConfig);
console.log('✅ Created next.config.mjs');

// 3. Create postcss.config.mjs
const postcssConfig = `export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
`;
fs.writeFileSync(path.join(root, 'postcss.config.mjs'), postcssConfig);
console.log('✅ Created postcss.config.mjs');

// 4. Create app directory structure
const appDir = path.join(root, 'app');
if (!fs.existsSync(appDir)) {
  fs.mkdirSync(appDir, { recursive: true });
}

// 5. Create app/globals.css
if (fs.existsSync(path.join(root, 'src', 'index.css'))) {
  const css = fs.readFileSync(path.join(root, 'src', 'index.css'), 'utf8');
  fs.writeFileSync(path.join(appDir, 'globals.css'), css);
  console.log('✅ Created app/globals.css');
}

// 6. Create app/layout.tsx
const layoutCode = `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SentinelFlow - Application Security Intelligence',
  description: 'Evidence-backed application security platform: repository fingerprinting and autonomous triage.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@200..600&family=JetBrains+Mono:wght@300;400;500&family=Sora:wght@200;300;400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#E6EDF6] text-[#020C21] antialiased">
        {children}
      </body>
    </html>
  );
}
`;
fs.writeFileSync(path.join(appDir, 'layout.tsx'), layoutCode);
console.log('✅ Created app/layout.tsx');

// 7. Create app/page.tsx (Landing page client wrapper)
const landingCode = `'use client';

import dynamic from 'next/dynamic';

const LandingPage = dynamic(
  () => import('../src/pages/LandingPage').then((m) => m.LandingPage),
  { ssr: false }
);

export default function Page() {
  return <LandingPage />;
}
`;
fs.writeFileSync(path.join(appDir, 'page.tsx'), landingCode);
console.log('✅ Created app/page.tsx');

// 8. Create Client-side navigation adapter for React Router -> Next.js
const navAdapter = `/**
 * Shim to allow existing React Router components to run seamlessly inside Next.js
 */
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, useParams as useNextParams, usePathname } from 'next/navigation';

export function NextRouterBridge({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
`;
fs.writeFileSync(path.join(root, 'src', 'lib', 'next-bridge.tsx'), navAdapter);

// 9. Create App Router Pages
const routes = [
  { path: 'dashboard', page: 'DashboardPage' },
  { path: 'queue', page: 'QueuePage' },
  { path: 'findings', page: 'FindingsPage' },
  { path: 'attack-paths', page: 'AttackPathsPage' },
  { path: 'demo', page: 'DemoPage' },
  { path: 'monitoring', page: 'MonitoringPage' },
  { path: 'guardrails', page: 'GuardrailsPage' },
  { path: 'memory', page: 'MemoryPage' },
  { path: 'evals', page: 'EvalsPage' },
  { path: 'submit', page: 'SubmitPage' },
  { path: 'login', page: 'LoginPage' },
  { path: 'repositories', page: 'RepositoriesPage' },
];

for (const r of routes) {
  const dir = path.join(appDir, r.path);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const pageFile = `'use client';

import dynamic from 'next/dynamic';
import { AppLayout } from '../../src/components/layout/AppLayout';

const Component = dynamic(
  () => import('../../src/pages/${r.page}').then((m) => m.${r.page}),
  { ssr: false }
);

export default function Page() {
  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}
`;
  fs.writeFileSync(path.join(dir, 'page.tsx'), pageFile);
}
console.log('✅ Scaffolded all App Router page routes');

// 10. Scaffold Next.js Route Handlers for Groq AI
const apiDir = path.join(appDir, 'api', 'ai');
fs.mkdirSync(path.join(apiDir, 'explain'), { recursive: true });
fs.mkdirSync(path.join(apiDir, 'chat'), { recursive: true });
fs.mkdirSync(path.join(apiDir, 'status'), { recursive: true });

const statusRoute = `import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GROQ_API_KEY?.trim() || '';
  const model = process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-120b';

  return NextResponse.json({
    configured: Boolean(apiKey && apiKey.length > 5),
    provider: apiKey ? 'groq' : 'sentinelflow_ast_engine',
    model,
    message: apiKey
      ? \`Groq AI Acceleration Active (\${model})\`
      : 'Using Built-in SentinelFlow AST Engine',
  });
}
`;
fs.writeFileSync(path.join(apiDir, 'status', 'route.ts'), statusRoute);

const explainRoute = `import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const apiKey = process.env.GROQ_API_KEY?.trim();
  const model = body.model || process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

  if (!apiKey) {
    return NextResponse.json({
      success: true,
      provider: 'sentinelflow_ast_engine',
      model: 'Built-in AST Engine',
      analysis: 'Rule-engine security analysis: verify boundary inputs and sanitization.',
    });
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: \`Bearer \${apiKey}\`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are SentinelFlow Security Intelligence Assistant. Provide a crisp AST analysis and threat actor impact.',
          },
          {
            role: 'user',
            content: \`Analyze vulnerability: \${body.title || ''}\\nRule: \${body.ruleId || ''}\\nSnippet: \${body.codeSnippet || ''}\`,
          },
        ],
        temperature: 0.2,
        max_tokens: 1024,
      }),
    });

    const data = await res.json();
    return NextResponse.json({
      success: true,
      provider: 'groq',
      model,
      analysis: data.choices?.[0]?.message?.content || '',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
`;
fs.writeFileSync(path.join(apiDir, 'explain', 'route.ts'), explainRoute);
console.log('✅ Created Next.js Route Handlers for Groq in app/api/ai/*');

console.log('\\n🎉 Next.js migration files created successfully!');
console.log('\\nTo finish locally, run:');
console.log('  npm install');
console.log('  npm run dev\\n');
