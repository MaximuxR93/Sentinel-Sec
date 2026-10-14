# SentinelFlow / SentinelAI — Architecture & Technical Interview Guide

> **Target Audience:** Technical Interviewers, Staff/Principal Engineers, Security Architects, and Engineering Managers.  
> **Elevator Pitch:** SentinelFlow is an autonomous Application Security & Incident Triage Platform that performs repository vulnerability discovery, static code analysis (SAST), software composition analysis (SCA), and attack path graph generation. It couples an autonomous AI triage agent with strict Human-in-the-Loop (HITL) escalation protocols, automated git diff patch synthesis, and defense-in-depth guardrails.

---

## 1. System Overview & Problem Statement

### The Problem It Solves
Modern engineering teams face an overwhelming volume of security alerts from traditional scanners (Snyk, Dependabot, SonarQube). Security Operations Centers (SOC) and AppSec teams suffer from:
1. **Alert Fatigue:** 85%+ of alerts are unreachable dependencies or harmless false positives.
2. **Context Fragmentation:** Scanners identify isolated CVEs, but fail to map whether an external request can actually reach the vulnerable function (lack of call-graph reachability).
3. **Manual Patch Lag:** Drafting, testing, and verifying code patches for each CVE takes hours per incident.

### The SentinelFlow Solution
SentinelFlow acts as a **Level-2 Autonomous Security Analyst**:
- **Discovers and ingests code repositories** safely with sandboxed network isolation and strict Anti-SSRF DNS pinning.
- **Correlates multi-layer findings:** Combines package dependencies (OSV / CVE databases), AST syntax analysis, and ingress-to-sink reachability.
- **Constructs Attack Path Graphs:** Visualizes the full kill-chain from external HTTP route to database/memory sink.
- **Autonomous Triage with HITL Controls:** High-confidence/low-risk items are automatically remediated with generated git patches; high-blast-radius or ambiguous threats generate an `interrupt` event that escalates to human analysts in a real-time triage queue.

---

## 2. End-to-End Workflow: How SentinelFlow Researches & Triages Repositories

```
  [ GitHub Repository URL / Zip / Webhook ]
                     │
                     ▼
  ┌─────────────────────────────────────────────────────────┐
  │ 1. INGESTION & DEFENSE-IN-DEPTH GUARDRAILS             │
  │    • Anti-SSRF DNS pinning (blocks RFC 1918 & metadata) │
  │    • Sandboxed git command execution (argv array delimiters)│
  │    • Ephemeral isolated workspace isolation              │
  └──────────────────────────┬──────────────────────────────┘
                             │
                             ▼
  ┌─────────────────────────────────────────────────────────┐
  │ 2. REPOSITORY RESEARCH & STATIC DISCOVERY ENGINE        │
  │    • Manifest Parsers (package.json, requirements.txt)  │
  │    • OSV.dev Database Querying & Advisory Cache         │
  │    • Abstract Syntax Tree (AST) & Code Pattern Matcher  │
  │    • Ingress / Route Extraction (Express, FastAPI, etc.)│
  └──────────────────────────┬──────────────────────────────┘
                             │
                             ▼
  ┌─────────────────────────────────────────────────────────┐
  │ 3. GRAPH-BASED ATTACK PATH MODELING                     │
  │    • Directed Graph: Entrypoint ➔ Component ➔ Sink     │
  │    • Reachability Analysis (Call-Graph Validation)      │
  │    • Blast Radius & CVSS v3.1 Composite Scoring         │
  └──────────────────────────┬──────────────────────────────┘
                             │
                             ▼
  ┌─────────────────────────────────────────────────────────┐
  │ 4. AUTONOMOUS AI TRIAGE AGENT (Groq / GPT-OSS 120B)    │
  │    • Server-Sent Events (SSE) Execution Trace Stream    │
  │    • Events: step ➔ interrupt (if critical) ➔ done       │
  │    • Confidence Threshold Evaluation & Context Memory   │
  └──────────────────────────┬──────────────────────────────┘
                             │
               ┌─────────────┴─────────────┐
               ▼                           ▼
     [ Low/Medium Severity ]      [ High/Critical Threat ]
     Automated Patch Synthesis    Human-in-the-Loop Escalation
     • Unified Git Diffs (.patch) • Incident Triage Queue (/queue)
     • Verified AST Substitutions • Idempotent Claim & Decision
```

### Detailed Execution Stages

#### Step 1: Ingestion & Sandboxing Guardrails
- **Input:** A GitHub URL (e.g., `https://github.com/MaximuxR93/The2ndBrain`) or repository reference.
- **Security Guardrail:** Before connecting, public DNS resolution validates that the host is an authorized remote host. Private IP spaces (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), localhost (`127.0.0.1`), and cloud metadata IP addresses (`169.254.169.254`) are blocked at the socket level.
- **Git Isolation:** Shell execution (`shell=True`) is prohibited. Commands are executed via strict array arguments separated by explicit flag barriers (`--`).

#### Step 2: Repository Vulnerability Discovery
- **Software Composition Analysis (SCA):** Scans package manifests (`package.json`, `package-lock.json`, `requirements.txt`, `Pipfile`, `go.mod`, `pom.xml`, `Cargo.toml`).
- **OSV Integration:** Queries the Open Source Vulnerabilities database (`api.osv.dev/v1/query`) for verified CVE identifiers, affected version ranges, and fixed versions. Responses are cached locally to prevent rate limiting.
- **Static Application Security Testing (SAST):** AST pattern extractors scan source code for dangerous sinks:
  - Command Injection: `child_process.exec()`, `os.system()`, `subprocess.Popen()` without array args.
  - SQL Injection: String concatenation or template strings passed into `.query()` or raw ORM methods.
  - Prototype Pollution: Unsanitized recursive object merging (`lodash.merge`, `deepAssign`).
  - Secret Leakage: High-entropy regex scanners detecting API keys, private keys, and OAuth secrets.

#### Step 3: Graph-Based Attack Path Construction
- Traditional scanners dump flat tables of 100+ vulnerabilities. SentinelFlow constructs a **Directed Acyclic Graph (DAG)** connecting:
  - **Node 1 (Source / Ingress):** Public HTTP routes (e.g., `POST /api/documents/parse`).
  - **Node 2 (Transmission):** Controller passing untrusted payload `req.body.filename`.
  - **Node 3 (Vulnerability):** Unpatched library (e.g., `xml2js <= 0.4.19` vulnerable to XXE / CVE-2023-0824).
  - **Node 4 (Impact / Sink):** Cloud credential read or server crash.
- **Reachability Validation:** If a vulnerability exists in `node_modules` but no code path imports or calls it, its priority is downgraded from critical to low, cutting triage fatigue by 80%.

#### Step 4: Autonomous AI Agent Triage & Human-in-the-Loop (HITL)
- **Agent Architecture:** Powered by high-speed inference (Groq `openai/gpt-oss-120b` or backend LLM proxy).
- **Streaming Execution Protocol (SSE):**
  - Sends progressive updates via Server-Sent Events (`/runs/{id}/stream`).
  - Yields `step` events containing agent reasoning, tools executed, and confidence scores.
  - If severity is **Critical** or if destructive changes are needed, the agent emits an `interrupt` event, pausing execution until a human analyst reviews it.
  - Yields `done` upon completion.
- **Triage Queue (`/queue`):** Analysts can claim incidents (`POST /incidents/{id}/claim`), inspect full chronological trace steps (`GET /incidents/{id}/trace`), and approve or dismiss patches (`POST /incidents/{id}/decision`) with optimistic locking (`If-Match` ETags) and `Idempotency-Key` headers.

#### Step 5: Automated AST Patch Synthesis
- Generates clean, unified git diffs ready for direct pull-request review.
- Upgrades package manifests to minimum non-breaking secure versions.
- Rewires vulnerable sinks with safe alternatives (e.g., replacing `eval()` with `JSON.parse()`, replacing string queries with parameterized prepared statements).

---

## 3. Technology Stack Breakdown

| Layer | Technology | Rationale & Architectural Choice |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18 + TypeScript (Strict)** | Strict compile-time type safety; React 18 Concurrent rendering for fluid graph rendering. |
| **Build & Tooling** | **Vite** | Ultra-fast Hot Module Replacement (HMR) and optimized rollup production bundles. |
| **Routing** | **React Router v6** | Declarative nested routing with lazy route loading (`React.lazy`) for minimal initial payload. |
| **Styling & Design System** | **Tailwind CSS** | Zero-runtime CSS footprint; strict token enforcement (ink `#020C21`, frame `#E6EDF6`, cta `#0F1B31`, accent `#4A78B0`). |
| **Typography** | **Inter (Variable)** | Specialized weights (200, 360, 400, 425, 470, 500, 520, 570) loaded via `@fontsource/inter` for high-density SOC readability. |
| **Iconography** | **lucide-react** | Lightweight vector SVGs, individually imported with uniform `strokeWidth={1.7}`. |
| **Data Visualization** | **Recharts (Lazy-Loaded)** | SVG metrics charts (MTTD, MTTR, False Positive Rate) isolated only to monitoring pages to preserve landing load speeds. |
| **AI Inference** | **Groq SDK (`openai/gpt-oss-120b`)** | Sub-second token generation for deep security reasoning and fast patch diff synthesis. |
| **Data Persistence Layer** | **Dual Mode: MongoDB Atlas + LocalStorage** | MongoDB Atlas schema for audit logs, sessions, and telemetry; automatic fallback to zero-config local storage for instant offline evaluation. |
| **Backend Contract** | **FastAPI / Express Gateway** | Standardized RESTful endpoints and Server-Sent Events (SSE) streaming gateway. |

---

## 4. Key Design Patterns & Architectural Highlights

### 1. Unified Dual Data Layer (Real API + High-Fidelity Mock)
- Configured via `VITE_USE_MOCK=true`.
- The data layer implements identical TypeScript interfaces for both the real FastAPI backend and the offline mock engine.
- Allows immediate end-to-end demonstrations, automated CI testing, and evaluation without requiring live external services.

### 2. Zero-Slop "Glass vs. Flat" UI Philosophy
- **Landing Page (`/`):** Features the high-impact "ConSentinel" dark aesthetic with frosted glass, design-unit grid, video backdrop, and typography.
- **Operational Console (`/dashboard`, `/queue`, `/findings`, etc.):** Shifts immediately to a **pure flat, light, ultra-fast design system**:
  - No slow backdrop filters or glass gradients on operational screens.
  - Page background: flat `#E6EDF6`.
  - Cards: opaque white `#FFFFFF` with precise 1px borders (`#DDE4EE`) and 20px border radius.
  - Color-blind accessible severity indicators: Severity is conveyed using text labels + SVG icons + dual tint (never color alone).

### 3. Concurrency & Idempotency Controls
- All state transitions on incidents (claims, releases, triage decisions) use:
  - `Idempotency-Key` headers to prevent double-submitting remediation actions.
  - `If-Match` version headers (optimistic concurrency control) to avoid race conditions when multiple analysts are triaging the same incident.

### 4. Performance & Resource Discipline
- **Lazy Loading:** All 14 operational routes are wrapped in `React.lazy()` chunks.
- **Smart Queue Polling:** Incident queue polls every 10 seconds only when the document tab is active (`document.visibilityState === 'visible'`).
- **Memory Footprint:** Full incident execution trace JSON is rendered only when an analyst explicitly expands an incident row.

---

## 5. Potential Interview Questions & Strong Answers

### Q1: "How does SentinelFlow differentiate between a critical vulnerability and an unreachable false positive?"
> **Answer:** "Traditional SCA tools flag any CVE present in dependencies. SentinelFlow adds reachability graph analysis: it scans the codebase's Abstract Syntax Tree (AST) to build a call graph starting from public entrypoints (like HTTP routes). If a vulnerable method from a library is never imported or invoked along any execution path, SentinelFlow downgrades the alert and prioritizes genuine exploitable paths, cutting alert fatigue dramatically."

### Q2: "How is the AI agent prevented from hallucinating or executing dangerous actions?"
> **Answer:** "We employ three defensive layers:
> 1. **Structural Guardrails:** Strict prompt injection filters, output schemas, and AST-level lint checks on any synthesized patch.
> 2. **Human-in-the-Loop Interrupts:** Any action with a high blast radius or critical severity pauses the agent and emits an `interrupt` SSE event, requiring human sign-off before code can be modified.
> 3. **Auditing & Replay:** Every reasoning step and tool call is recorded into an append-only audit log with deterministic step timestamps."

### Q3: "What happens if the remote backend or MongoDB Atlas goes down?"
> **Answer:** "The frontend architecture is decoupled via a unified API client. If the backend or database connection is offline, the client seamlessly falls back to local storage and in-memory operational buffers with zero UI disruption. Critical triage workflows, scan progress visualization, and remediation reviews remain fully functional."

### Q4: "Why did you choose React 18, Vite, and strict TypeScript instead of a heavier framework?"
> **Answer:** "A security operations console demands millisecond responsiveness, instant table sorting, and zero runtime lag. React 18 with Vite provides fast compilation, optimal code-splitting, and typed data contracts. We avoided heavy component libraries to maintain full control over DOM size, keyboard accessibility, and adherence to our flat light design system."

---

## 6. Route & API Contract Reference

### Frontend Routes
- `/` — Glassy High-Impact Landing Page (ConSentinel design unit)
- `/demo` — Interactive Sandbox Walkthrough
- `/dashboard` — SOC Posture, Vulnerability Distribution, and Key Metrics
- `/repositories` — Monitored Codebases, Branches, and Scan Histories
- `/scans/:scanId` — Real-Time Visual Scanner (Discovery, AST, Dependency & Graph stages)
- `/findings` — Searchable & Filterable Vulnerability Table (CVSS, Reachability, Sinks)
- `/attack-paths` — Directed Graph Visualization of Exploit Chains
- `/remediation` — Unified Git Diffs, Automated AST Patches, and PR Creation
- `/queue` — Live Incident Triage Queue with Analyst Claiming
- `/incidents/:id` — Deep Incident Forensic View with Step-by-Step Execution Traces
- `/monitoring` — MTTD, MTTR, Precision/Recall, and System Health
- `/guardrails` — Ingress DNS Pinning, SSRF Protection, and Injection Detection
- `/memory` — Associative Memory of Past Triage Decisions & False Positives
- `/evals` — Ground-Truth Benchmarks, Accuracy Tests, and LLM Scoring
- `/submit` — Security Report Submission Ingestion Portal
- `/settings` — Database Connections & Policy Configurations

### Core Backend API Endpoints
- `POST /reports` — Ingest new security report or repository alert
- `GET /runs/{id}/stream` — Server-Sent Events (SSE) stream (`step`, `interrupt`, `done`)
- `GET /incidents` & `GET /incidents/{id}` — Fetch incidents and metadata
- `GET /incidents/{id}/trace` — Retrieve chronological agent reasoning steps
- `POST /incidents/{id}/claim` — Claim incident for analyst review
- `POST /incidents/{id}/release` — Release claim back to general queue
- `POST /incidents/{id}/decision` — Record triage verdict (Suppress, Fix, Escalate)
- `GET /metrics` — Operational SOC telemetry and response times
- `GET /guardrails/events` — Security boundary violations and blocked requests
- `GET /memory/search` — Query historical triage memory
- `GET /evals` — Benchmark suite results
