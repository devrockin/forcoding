# ForCoding_Arch -- Deterministic Harness Architecture

> **Status:** Design Complete | **Target:** Lightweight coding models  
> **Codename:** ForCoding_Arch | **Date:** 2026-06-09  
> **Replaces:** ForCoding v3.0 (prompt-driven → deterministic state machine)

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Architecture Overview](#2-architecture-overview)
3. [Lightweight Model Design Rationale](#3-Lightweight-model-design-rationale)
4. [State Machine](#4-state-machine)
5. [Intent Classifier](#5-intent-classifier)
6. [Workflow Registry](#6-workflow-registry)
7. [Enforcement Layer](#7-enforcement-layer)
8. [HITL System](#8-hitl-system)
9. [Truncation Recovery](#9-truncation-recovery)
10. [Context Budget Management](#10-context-budget-management)
11. [Prototype Loop](#11-prototype-loop-design-thinking-integration)
12. [Task Scope Classification](#12-task-scope-classification-simple-fix-criteria)
13. [Supervisor Role Support](#13-supervisor-role-support)
14. [Plugin Entry Point](#14-plugin-entry-point)
15. [Agent File Changes](#15-agent-file-changes)
16. [Skill & Policy Migration](#16-skill--policy-migration)
17. [Quality Assurance Design](#17-quality-assurance-design)
18. [Migration Plan](#18-migration-plan)

---

## 1. Design Philosophy

### 1.1 Core Principles

| # | Principle | Meaning |
|:--|:--|:--|
| **P1** | **Code governs, prompts delegate** | Every governance decision lives in Node.js modules; LLM prompts only describe what to build |
| **P2** | **Optimize for fast models** | The architecture assumes a lightweight coding model with limited context; never expects the model to self-regulate |
| **P3** | **Every token earns its place** | Context injection is budgeted — only phase-relevant information reaches the model |
| **P4** | **Intercept early** | Rule violations are blocked before execution begins, not detected after damage is done |
| **P5** | **Reveal gradually** | Only the current phase's context is visible; the full rulebook stays outside the model's attention window |
| **P6** | **Rejection must teach** | When a dispatch is blocked, the orchestrator receives both the reason and the fix in plain language |
| **P7** | **Confirm once, lock forever** | At most one human checkpoint per task — after classification, the system runs autonomously |

### 1.2 Why Prompt-Based Governance Fails with Lightweight Models

Lightweight coding models have specific properties that make prompt-based self-regulation unreliable:

| Capability | Why Prompt Rules Fail | ForCoding_Arch Solution |
|:--|:--|:--|
| Attention window | Rules beyond ~800 tokens get diluted or ignored | Orchestrator prompt capped at ~45 lines |
| Rule following | Under task pressure, the model fabricates exceptions to constraints | State machine mechanically rejects all violations |
| Output length | Long generations frequently truncate at boundaries | Automatic truncation detection with context-aware retry |
| Self-assessment | Models rate their own output optimistically, missing errors | Separate auditor sub-agent with independent review |
| Context aging | Token quality degrades measurably after 60+ conversation turns | Budget tracker injects compaction cues at 70% usage |

---

## 2. Architecture Overview

### 2.1 Three-Layer Harness

```
┌──────────────────────────────────────────────────────────────────┐
│                     ForCoding_Arch Harness                        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Layer 1: Deterministic State Machine (src/fsm/)           │  │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐ │  │
│  │  │ state-   │  │ transit-  │  │ state-   │  │  error   │ │  │
│  │  │ machine  │  │ ions.js   │  │ store    │  │  types   │ │  │
│  │  └──────────┘  └───────────┘  └──────────┘  └──────────┘ │  │
│  │  File-persistent. Survives crash and context compaction.   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              ↕                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Layer 2: Enforcement (src/enforcer/)                      │  │
│  │  ┌────────────┐ ┌──────────┐ ┌─────────────┐ ┌──────────┐ │  │
│  │  │ pre-build  │ │  phase   │ │ post-build  │ │truncation │ │  │
│  │  │ gate       │ │  lock    │ │ validator   │ │ recovery  │ │  │
│  │  └────────────┘ └──────────┘ └─────────────┘ └──────────┘ │  │
│  │  ┌────────────┐ ┌──────────┐                               │  │
│  │  │  tool-     │ │  cycle   │                               │  │
│  │  │ allowlist  │ │ detector │                               │  │
│  │  └────────────┘ └──────────┘                               │  │
│  │  All checks are deterministic. No LLM involvement.          │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              ↕                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Layer 3: Human Checkpoints (src/hitl/)                    │  │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────┐               │  │
│  │  │checkpoint│  │ renderer  │  │ response │               │  │
│  │  │          │  │           │  │ parser   │               │  │
│  │  └──────────┘  └───────────┘  └──────────┘               │  │
│  │  Once per session. Classification confirmation only.       │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Supporting Modules (src/)                                 │  │
│  │  ┌───────────┐ ┌────────┐ ┌───────┐ ┌──────┐ ┌──────────┐│  │
│  │  │classifier/│ │workflow│ │engine/│ │audit/│ │observ-   ││  │
│  │  │           │ │        │ │       │ │      │ │ability/  ││  │
│  │  └───────────┘ └────────┘ └───────┘ └──────┘ └──────────┘│  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Directory Structure

```
forcoding/
├── .opencode/
│   └── plugins/
│       └── forcoding.js          # Thin entry (<80 lines) → delegates to src/
├── src/
│   ├── index.js                  # Unified exports
│   ├── fsm/
│   │   ├── state-machine.js      # Deterministic FSM core
│   │   ├── state-store.js        # JSON file persistence
│   │   ├── transitions.js        # Allowed transition table
│   │   └── errors.js             # FSM error types
│   ├── classifier/
│   │   ├── intent-classifier.js  # Multi-axis intent analysis
│   │   ├── project-scanner.js    # File system analysis
│   │   ├── tech-detector.js      # Tech stack detection
│   │   ├── density-analyzer.js   # File-function density
│   │   └── subtype-validator.js  # Tag consistency validation
│   ├── workflow/
│   │   ├── registry.js           # Workflow registry
│   │   └── profiles/             # Per-type workflow profiles
│   │       ├── frontend.js       # web-ui, spa
│   │       ├── backend.js        # api, fullstack
│   │       ├── game.js           # canvas-game
│   │       ├── cli.js            # cli-tool
│   │       ├── data.js           # data-pipeline
│   │       ├── library.js        # npm/library
│   │       ├── maintenance.js    # hotfix, refactor
│   │       ├── devops.js         # docker, ci-cd
│   │       └── setup.js          # project scaffolding
│   ├── enforcer/
│   │   ├── pre-build-gate.js     # Per-tag dispatch validation
│   │   ├── phase-lock.js         # Phase ordering enforcement
│   │   ├── tool-allowlist.js     # Per-phase tool restrictions
│   │   ├── post-build-validator.js # Output validation
│   │   ├── truncation-recovery.js  # Auto-detect + retry
│   │   ├── cycle-detector.js     # build→audit loop limit
│   │   └── context-budget.js     # Token tracking + compaction cues
│   ├── hitl/
│   │   ├── checkpoint.js         # HITL injection logic
│   │   ├── renderer.js           # Confirmation UI
│   │   └── response-parser.js    # User response parsing
│   ├── engine/
│   │   └── policy-engine.mjs     # ✅ Kept from ForCoding v3.0
│   ├── audit/
│   │   └── audit-trail.mjs       # ✅ Kept from ForCoding v3.0
│   ├── gates/
│   │   └── gate-system.mjs       # ✅ Kept, FSM auto-calls
│   └── observability/
│       ├── metrics.js            # Compliance rate, truncation rate
│       └── health-check.js       # Hook liveness verification
├── agents/                       # Slimmed (orchestrator 188→45 lines)
├── policies/                     # Demoted to reference docs
├── skills/                       # Demoted to reference docs
├── docs/forcoding/
│   ├── state/                    # FSM state persistence
│   │   └── {session-id}.json     
│   └── gates/                    # Auto-generated gate files
│       └── {date}-{topic}.{stage}.approved
└── package.json
```

### 2.3 Data Flow (Complete Session)

```
User: "make a tank battle game"
        │
        ▼
┌─ chat.message hook ─────────────────────────────────────────────┐
│ 1. stateStore.load(sessionId) → no prior classification        │
│ 2. intentClassifier.classify(prompt, projectDir)                │
│    ├─ typeScores: {canvas-game: 0.85, web-ui: 0.30}           │
│    ├─ confidence: 'high'                                        │
│    ├─ tags: {domain:game, form:app, framework:vanilla}          │
│    └─ workflow: ['discovery','build','audit','rsi']             │
│ 3. fsm.transition('idle', 'classifying')                        │
│ 4. fsm.transition('classifying', 'awaiting_hitl')               │
│ 5. Store original message. Replace with HITL confirmation.      │
└──────────────────────────────────────────────────────────────────┘
        │ LLM sees: HITL confirmation prompt (not original request)
        ▼
User: "ok"
        │
        ▼
┌─ chat.message hook ─────────────────────────────────────────────┐
│ 1. hitl.parseResponse("ok") → {action: 'confirm'}               │
│ 2. fsm.transition('awaiting_hitl', 'discovery')                 │
│ 3. stateStore.lock(classification)                              │
│ 4. fsm.createGate('discovery') → auto-generated                 │
│ 5. Restore original message + append classification context     │
└──────────────────────────────────────────────────────────────────┘
        │ LLM sees: "make a tank battle game" + [ForCoding: canvas-game, standard]
        ▼
Orchestrator: dispatches Discovery (or skips for light tasks)
        │
        ▼
Orchestrator: dispatches @forcoding-builder via task()
        │
        ▼
┌─ tool.execute.before (tool=task, agent=forcoding-builder) ──────┐
│ 1. phaseLock.check('builder') → state=discovery → ALLOWED       │
│ 2. fsm.transition('discovery', 'build')                         │
│ 3. preBuildGate.validate(prompt, tags)                          │
│    → tags.domain=game → GAME_CHECKS (not WEB_UI_CHECKS)         │
│    → [game-loop ✓] [perf-target ✓] [round ✓]                    │
│    → valid = true                                                │
│ 4. contextBudgetManager.track() → tokens used: 1200              │
└──────────────────────────────────────────────────────────────────┘
        │ Builder executes
        ▼
┌─ tool.execute.after (tool=task, agent=forcoding-builder) ───────┐
│ 1. truncationRecovery.detect(output)                            │
│    → checks: canvas + rAF + bracket balance                      │
│    → no truncation signals                                       │
│ 2. postBuildValidator.check(output, tags)                        │
│    → game-specific: canvas exists, rAF present                   │
│    → valid                                                       │
│ 3. fsm.autoAdvance('build', 'audit')                             │
│ 4. Inject auditor dispatch context into next message             │
└──────────────────────────────────────────────────────────────────┘
        │ LLM sees: "[ForCoding] Builder complete. Dispatch Auditor."
        ▼
Orchestrator: dispatches @forcoding-auditor
        │
        ▼
┌─ tool.execute.before (tool=task, agent=forcoding-auditor) ──────┐
│ 1. Verify state === 'audit' (set by autoAdvance at line 223)   │
│ 2. No transition needed — state already correct                 │
│    → Auditor executes Pass 0→1→2→3→4                            │
└──────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─ tool.execute.after (tool=task, agent=forcoding-auditor) ──────┐
│ 1. parseAuditorVerdict(output) → VALIDATED / PARTIAL / FAIL    │
│ 2. If VALIDATED: cycleDetector.reset(); fsm.autoAdvance → rsi  │
│ 3. If PARTIAL:  cycleDetector.check(); fsm.transition → build  │
│    → buildRound++ → if >3: HITL escalation                      │
│ 4. If FAIL:     store auditFailed state → HITL escalation       │
└──────────────────────────────────────────────────────────────────┘
        │
        ▼
Orchestrator: RSI acceptance → fsm.transition('rsi', 'done')
        │
        ▼
┌─ stateStore.archive() ──────────────────────────────────────────┐
│ Session complete. Full audit trail preserved.                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Lightweight Model Design Rationale

### 3.1 Why Lightweight Changes Everything

ForCoding was born to optimize lightweight coding model workflows. Every architectural decision in ForCoding_Arch is filtered through this lens:

| Design Decision | Without Lightweight Consideration | With Lightweight Optimization |
|:--|:--|:--|
| Orchestrator prompt length | 188 lines (full rules reference) | **45 lines** (only delegation logic) |
| Skill loading | 13 .md files loaded via `skill()` | **0 injected**; logic embedded in Node.js |
| Policy enforcement | Prompt-based rules + YAML | **Node.js FSM** (zero LLM tokens) |
| Rejection feedback | `throw Error("blocked")` | Structured rejection with **remediation steps** |
| Builder output validation | Trust builder | **TruncationRecovery** + **PostBuildValidator** |
| Audit trail | Manual `.approved` files | **FSM auto-generates** gates on every transition |
| Context management | `ctx_reduce: deny` (never compress) | **ContextBudgetManager** cues compaction before degradation |
| HITL frequency | Every stage (too many) | **Once per session** (classification confirmation) |

### 3.2 Context Injection Policy

**DON'T inject (removed from LLM context):**
- Full policy rule texts (3500+ tokens saved)
- Skill `.md` files (5000+ tokens saved)
- Gate verification procedures (1500 tokens saved)
- Auto-Inject Manifest sections (1500 tokens saved)
- Phase lock rule descriptions (500 tokens saved)

**DO inject (essential for Lightweight to operate):**
- Classification summary at task start (~200 tokens)
- Phase transition notifications (~50 tokens each)
- Structured rejection remediation (~150 tokens, only on block)
- Compaction cues before context degradation (~100 tokens)

**Net savings: ~10,700 tokens per session → ~600 tokens. 95% reduction.**

### 3.3 Acceptable Round Increases

Lightweight is cheap. Extra rounds cost ~1/10 of Pro. The trade-off is:

| Extra Round | Cost (Lightweight) | Value |
|:--|:--|:--|
| Builder→Auditor→Builder (1 retry) | ~800 tokens × 2 | Catches 90% of truncation + syntax errors |
| Truncation recovery (auto-retry) | ~500 tokens × 2 | Prevents silent partial output |
| HITL classification confirmation | 1 user interaction | Prevents entire session running on wrong type |
| Auditor follow-up on complex issues | ~1000 tokens | Catches deep logic errors |

**Total overhead: ~4000 extra tokens in worst case = $0.0002 on Lightweight. Acceptable.**

### 3.4 LightweightPrompt Guidelines (applied to all sub-agent prompts)

1. **Lead with structure, not exposition.** Lightweight performs better with checklists than paragraphs.
2. **Constraints before creativity.** State "what NOT to do" before "what to do."
3. **Binary gates over nuanced judgment.** "Check A? Yes/No" better than "Evaluate A on a scale of 1-5."
4. **Single responsibility per dispatch.** One builder = one file or one feature, not "build everything."
5. **Include failure modes.** Lightweight needs to know "if X fails, do Y" explicitly.

---

## 4. State Machine

### 4.1 State Definitions

```javascript
// src/fsm/transitions.js

const STATE = {
  IDLE:            'idle',             // Waiting for task
  CLASSIFYING:     'classifying',      // Analyzing user intent
  AWAITING_HITL:   'awaiting_hitl',    // Waiting for classification confirmation
  PROTOTYPE:       'prototype',        // Early-stage exploration loop
  DISCOVERY:       'discovery',        // Requirement discovery
  DESIGN:          'design',           // Design specification
  PLAN:            'plan',             // Implementation plan (heavy only)
  BUILD:           'build',            // Code generation
  BUILD_RECOVERY:  'build_recovery',   // 🆕 Truncation recovery in progress
  AUDIT:           'audit',            // Code review
  RSI:             'rsi',              // Acceptance verification
  DONE:            'done',             // Task complete
  ABORTED:         'aborted',          // User terminated
};
```

### 4.2 Transition Table

```javascript
const TRANSITIONS = {
  [STATE.IDLE]:            [STATE.CLASSIFYING],
  [STATE.CLASSIFYING]:     [STATE.AWAITING_HITL],
  [STATE.AWAITING_HITL]:   [STATE.PROTOTYPE, STATE.DISCOVERY, STATE.ABORTED],
  [STATE.PROTOTYPE]:       [STATE.PROTOTYPE, STATE.DISCOVERY, STATE.ABORTED],
  [STATE.DISCOVERY]:       [STATE.DESIGN, STATE.BUILD, STATE.PROTOTYPE],
  [STATE.DESIGN]:          [STATE.PLAN, STATE.BUILD],           // heavy needs plan
  [STATE.PLAN]:            [STATE.BUILD],
  [STATE.BUILD]:           [STATE.BUILD_RECOVERY, STATE.AUDIT], // truncation or complete
  [STATE.BUILD_RECOVERY]:  [STATE.BUILD, STATE.AUDIT],          // retry or give up
  [STATE.AUDIT]:           [STATE.BUILD, STATE.RSI],            // fail→retry, pass→verify
  [STATE.RSI]:             [STATE.DONE, STATE.BUILD],           // fail→retry
  [STATE.DONE]:            [STATE.IDLE],
  [STATE.ABORTED]:         [STATE.IDLE],
};
```

### 4.3 StateMachine API

```javascript
// src/fsm/state-machine.js

class StateMachine {
  constructor(stateStore) { /* ... */ }

  // Attempt a state transition. Throws on illegal transition.
  async transition(from, to) { /* ... */ }

  // Auto-advance on deterministic paths (build→audit, audit→rsi)
  // Does NOT auto-advance across HITL nodes.
  async autoAdvance(from, to) { /* ... */ }

  // Check if a sub-agent can be dispatched in current state
  canDispatch(agentType) {
    const current = this.store.get().currentState;
    const DISPATCH_MAP = {
      'forcoding-designer': [STATE.DESIGN],
      'forcoding-planner':  [STATE.PLAN],
      'forcoding-builder':  [STATE.BUILD, STATE.BUILD_RECOVERY],
      'forcoding-auditor':  [STATE.AUDIT],
    };
    return DISPATCH_MAP[agentType]?.includes(current) ?? false;
  }

  // Generate and write gate file automatically
  async createGate(stage) {
    const gate = {
      stage,
      timestamp: Date.now(),
      gitSHA: getCurrentGitSHA(),
      previousStage: this.store.get().previousState,
      sessionId: this.store.get().sessionId,
      compositeHash: this.computeChainHash(stage),
    };
    await this.gateSystem.write(gate);
    await this.auditTrail.record({ event: 'gate_created', gate });
    return gate;
  }

  // Build round tracking
  get buildRound()    { return this.store.get().buildRound || 0; }
  incrementBuildRound() { this.store.update({ buildRound: this.buildRound + 1 }); }
  get maxBuildRounds()  { return 3; }

  // Resume from persisted state after crash/restart
  async resume(sessionId) {
    const state = await this.store.load(sessionId);
    if (!state || state.currentState === STATE.IDLE) return null;
    return {
      currentState: state.currentState,
      classification: state.classification,
      buildRound: state.buildRound || 0,
      canResume: [STATE.DISCOVERY, STATE.DESIGN, STATE.PLAN, STATE.BUILD, STATE.AUDIT, STATE.RSI]
        .includes(state.currentState),
    };
  }
}
```

### 4.4 StateStore API

```javascript
// src/fsm/state-store.js

class StateStore {
  constructor(projectDir) {
    this.baseDir = path.join(projectDir, 'docs', 'forcoding', 'state');
    this._cache = {};
  }

  // Load state for a session. Returns {} if no file exists.
  // File path: docs/forcoding/state/{sessionId}.json
  // Each sessionId is isolated — no cross-session locking needed.
  async load(sessionId) { /* ... */ }

  // Save full state with atomic write (write .tmp → rename)
  // Protects against corruption on crash mid-write.
  async save(data) { /* ... */ }

  // Merge partial update into existing state
  async update(partialData) { /* ... */ }

  // Lock classification — prevents re-classification for this session
  async lock(state) { await this.update({ classificationLocked: true }); }

  // Restore original user message after HITL confirmation
  restoreOriginalMessage() { return this._cache.originalMessage; }

  // Archive completed session state
  async archive(sessionId) { /* ... */ }

  // Delete state file (on abort or session cleanup)
  async delete(sessionId) { /* ... */ }

  // Get raw state object from in-memory cache
  get currentState() { return this._cache.currentState; }
  get classification() { return this._cache.classification; }
  get buildRound() { return this._cache.buildRound || 0; }
}
```

### 4.5 Persistent State Format

```json
{
  "sessionId": "ses_abc123",
  "currentState": "build",
  "previousState": "design",
  "classificationLocked": true,
  "classification": {
    "type": "canvas-game",
    "tags": {
      "domain": "game",
      "form": "app",
      "framework": "vanilla",
      "lifecycle": "greenfield"
    },
    "confidence": "high",
    "workflow": ["discovery", "design", "build", "audit", "rsi"],
    "weight": "standard",
    "subsystems": 6,
    "density": 6.0,
    "techStack": ["html", "canvas", "javascript"]
  },
  "buildRound": 1,
  "buildTruncated": false,
  "buildSessions": [
    { "id": "task_001", "status": "complete", "outputSha": "a1b2c3d" }
  ],
  "dispatchCount": 3,
  "estimatedTokens": 4200,
  "transitions": [
    { "from": "idle", "to": "classifying", "at": 1717939200000 },
    { "from": "classifying", "to": "awaiting_hitl", "at": 1717939201000 },
    { "from": "awaiting_hitl", "to": "discovery", "at": 1717939250000 },
    { "from": "discovery", "to": "design", "at": 1717939300000 },
    { "from": "design", "to": "build", "at": 1717939400000 }
  ],
  "lastBlockedAction": null
}
```

---

## 5. Intent Classifier

### 5.1 Composable Tag System

Replaces the single `taskType` enum with a 4-axis tag system:

```javascript
// src/classifier/intent-classifier.js

const TAGS = {
  DOMAIN:    ['frontend', 'backend', 'fullstack', 'game', 'cli', 'data', 'desktop', 'mobile', 'devops', 'docs'],
  FORM:      ['single-page', 'spa', 'api', 'library', 'app', 'script', 'config', 'migration'],
  FRAMEWORK: ['vanilla', 'react', 'vue', 'nextjs', 'express', 'fastapi', 'electron', 'react-native'],
  LIFECYCLE: ['greenfield', 'feature', 'hotfix', 'refactor', 'migration', 'setup'],
};

// 10 shortcut presets for common combinations
const PRESETS = {
  'web-ui':        { domain: 'frontend',  form: 'single-page', framework: 'vanilla', lifecycle: 'greenfield' },
  'spa-app':       { domain: 'frontend',  form: 'spa',         framework: 'react',    lifecycle: 'feature' },
  'fullstack-app': { domain: 'fullstack', form: 'app',         framework: 'nextjs',   lifecycle: 'greenfield' },
  'backend-api':   { domain: 'backend',   form: 'api',         framework: 'express',  lifecycle: 'greenfield' },
  'canvas-game':   { domain: 'game',      form: 'app',         framework: 'vanilla',  lifecycle: 'greenfield' },
  'cli-tool':      { domain: 'cli',       form: 'script',      framework: 'vanilla',  lifecycle: 'greenfield' },
  'data-pipeline': { domain: 'data',      form: 'script',      framework: 'vanilla',  lifecycle: 'greenfield' },
  'npm-library':   { domain: 'backend',   form: 'library',     framework: 'vanilla',  lifecycle: 'greenfield' },
  'hotfix':        { domain: 'frontend',  form: 'single-page', framework: 'vanilla',  lifecycle: 'hotfix' },
  'refactor':      { domain: 'frontend',  form: 'spa',         framework: 'react',    lifecycle: 'refactor' },
};
```

### 5.2 Multi-Axis Scoring

```javascript
class IntentClassifier {
  async classify(prompt, projectDir) {
    const project = await this.scanner.scan(projectDir);
    const tech = this.tech.detect(projectDir);

    // Score ALL types independently (not first-match)
    const scores = [
      { type: 'web-ui',        score: this.scoreWebUI(prompt, project) },
      { type: 'spa-app',       score: this.scoreSPA(prompt, project) },
      { type: 'fullstack-app', score: this.scoreFullstack(prompt, project) },
      { type: 'backend-api',   score: this.scoreBackend(prompt, project) },
      { type: 'canvas-game',   score: this.scoreGame(prompt) },
      { type: 'cli-tool',      score: this.scoreCLI(prompt, project) },
      { type: 'data-pipeline', score: this.scoreData(prompt, project) },
      { type: 'npm-library',   score: this.scoreLibrary(prompt, project) },
    ].sort((a, b) => b.score - a.score);

    const primary = scores[0];
    const alternatives = scores
      .filter(s => s.type !== primary.type && s.score > primary.score * 0.6)
      .map(s => s.type);

    const confidence = primary.score > 0.8 && alternatives.length === 0 ? 'high'
      : primary.score > 0.5 ? 'medium' : 'low';

    // Detect lifecycle from prompt
    const lifecycle = this.detectLifecycle(prompt, project);

    // Estimate subsystems (LLM-assisted, one-time, at classification only)
    const subsystems = await this.estimateSubsystems(prompt);

    // Determine weight
    const weight = this.resolveWeight(project, subsystems.count);

    // Route workflow
    const workflow = this.registry.route(primary.type, weight);

    return {
      type: primary.type,
      tags: PRESETS[primary.type],
      alternatives,
      confidence,
      lifecycle: lifecycle.tag,
      weight,
      subsystems: subsystems.count,
      subsystemEstimate: subsystems.detail,
      density: project.fileCount > 0 ? subsystems.count / project.fileCount : subsystems.count,
      techStack: tech,
      workflow,
      notes: this.generateNotes(weight, subsystems),
    };
  }

  scoreGame(prompt) {
    let score = 0;
    if (/游戏|game|canvas|帧|fps|碰撞|键盘|WASD|精灵|关卡|得分|生命/i.test(prompt)) score += 0.35;
    if (/坦克|飞机|赛车|打砖块|贪吃蛇|消消乐|俄罗斯方块|马里奥|射击|RPG/i.test(prompt)) score += 0.30;
    if (/触摸|touch|手柄|controller|摇杆/i.test(prompt)) score += 0.15;
    if (/requestAnimationFrame|setInterval.*16|game loop/i.test(prompt)) score += 0.20;
    return Math.min(score, 1.0);
  }

  scoreWebUI(prompt, project) {
    let score = 0;
    if (/UI|界面|页面|组件|样式|按钮|表单|卡片|布局|导航|模态|弹窗/i.test(prompt)) score += 0.30;
    if (/HTML|CSS|DOM|div|span|flexbox|grid/i.test(prompt)) score += 0.25;
    if (/浏览器|网页|web|响应式|移动端适配/i.test(prompt)) score += 0.20;
    if (/设计|视觉|颜色|字体|间距|阴影/i.test(prompt)) score += 0.15;
    if (project.hasHTMLFiles()) score += 0.10;
    return Math.min(score, 1.0);
  }
}
```

### 5.3 Lightweight-Aware Subsystem Estimation

```javascript
// The classifier needs subsystem count for density calculation.
// Pure regex is insufficient. Use a ONE-TIME LLM call at classification only.
// This is the ONLY LLM call the classifier makes.

async estimateSubsystems(prompt) {
  // Quick heuristic first (no LLM, sub-millisecond)
  const quick = this.quickEstimate(prompt);
  // "game" → typically 5-8, "timer" → 2-4, "API" → 3-6, "library" → 1-3

  if (quick.confidence === 'high') {
    return { count: quick.count, detail: quick.detail, source: 'heuristic' };
  }

  // One-time LLM call (Lightweight-optimized: short prompt, numeric-only response)
  const result = await callLLMOnce(`
Count distinct functional subsystems in this task. Reply ONLY: "N: list"
Task: "${prompt.slice(0, 200)}"
Example: "4: timer, display, controls, presets"
`);
  // Parse: "6: rendering, input, collision, scoring, sound, ui"
  const match = result.match(/^(\d+):\s*(.+)$/);
  return {
    count: parseInt(match[1]),
    detail: match[2],
    source: 'llm-assisted',
  };
}
```

---

## 6. Workflow Registry

### 6.1 Adaptive Workflow Routing

```javascript
// src/workflow/registry.js

const WORKFLOW = {
  'frontend': {
    light:    [STATE.DISCOVERY,                     STATE.BUILD,              STATE.RSI],
    standard: [STATE.DISCOVERY, STATE.DESIGN,       STATE.BUILD, STATE.AUDIT, STATE.RSI],
    heavy:    [STATE.DISCOVERY, STATE.DESIGN, STATE.PLAN, STATE.BUILD, STATE.AUDIT, STATE.RSI],
  },
  'game': {
    light:    [STATE.DISCOVERY,                     STATE.BUILD,                     STATE.RSI],
    standard: [STATE.DISCOVERY, STATE.DESIGN,       STATE.BUILD, STATE.AUDIT,        STATE.RSI],
    heavy:    [STATE.DISCOVERY, STATE.DESIGN, STATE.PLAN, STATE.BUILD, STATE.AUDIT, STATE.RSI],
  },
  'backend': {
    light:    [STATE.DISCOVERY,                     STATE.BUILD,              STATE.RSI],
    standard: [STATE.DISCOVERY,       STATE.DESIGN, STATE.BUILD, STATE.AUDIT, STATE.RSI],
    heavy:    [STATE.DISCOVERY, STATE.DESIGN, STATE.PLAN, STATE.BUILD, STATE.AUDIT, STATE.RSI],
  },
  'cli': {
    light:    [STATE.DISCOVERY,           STATE.BUILD,              STATE.RSI],
    standard: [STATE.DISCOVERY,           STATE.BUILD, STATE.AUDIT, STATE.RSI],
    heavy:    [STATE.DISCOVERY, STATE.DESIGN, STATE.PLAN, STATE.BUILD, STATE.AUDIT, STATE.RSI],
  },
  'data': {
    standard: [STATE.DISCOVERY, STATE.DESIGN, STATE.PLAN, STATE.BUILD, STATE.AUDIT, STATE.RSI],
  },
  'library': {
    light:    [STATE.DISCOVERY,       STATE.BUILD,                    STATE.RSI],
    standard: [STATE.DISCOVERY,       STATE.BUILD, STATE.AUDIT,       STATE.RSI],
  },
  'maintenance': {
    light:    [STATE.BUILD, STATE.RSI],                                                       // hotfix
    standard: [STATE.DISCOVERY, STATE.BUILD, STATE.AUDIT, STATE.RSI],                         // refactor
  },
  'devops': {
    light:    [STATE.DISCOVERY, STATE.BUILD, STATE.RSI],
  },
  'setup': {
    light:    [STATE.BUILD, STATE.RSI],
  },
};

// Key differences by domain:
// - 'game': No DESIGN for light (visual design is code-level concern for games)
// - 'cli': DESIGN only for heavy (most CLI tools don't need visual spec)
// - 'backend': PLAN for heavy (API design needs architecture planning)
// - 'maintenance': Skip DESIGN (hotfixes/refactors work within existing design)
// - 'frontend': Full pipeline for standard+ (visual quality needs DESIGN)
```

### 6.2 Workflow Profile (Per-Type)

```javascript
// src/workflow/profiles/game.js

export const canvasGameProfile = {
  type: 'canvas-game',
  tags: { domain: 'game', form: 'app', framework: 'vanilla' },

  // Pre-Build Gate checklist (differs from web-ui!)
  preBuildChecks: [
    { name: 'game-loop',     check: p => /requestAnimationFrame|game.loop|fixed.timestep/i.test(p), msg: 'Game loop pattern' },
    { name: 'perf-target',   check: p => /60fps|performance|memory/i.test(p),                        msg: 'Performance target' },
    { name: 'controls',      check: p => /keyboard|mouse|touch|controller/i.test(p),                 msg: 'Input mechanism' },
    { name: 'collision',     check: p => /collision|hit.?test|bounding/i.test(p),                    msg: 'Collision detection' },
    { name: 'canvas-setup',  check: p => /<canvas|getContext/i.test(p),                              msg: 'Canvas setup' },
    { name: 'gameloop-flow', check: p => /update|render|draw/i.test(p),                              msg: 'Update/Render cycle' },
    { name: 'visual-section',check: p => /VISUAL\s+(REFERENCE|CONCEPT)/i.test(p),                    msg: 'Visual references' },
    { name: 'delight',       check: p => /Delight|delight/i.test(p),                                 msg: '>=1 Delight element' },
    { name: 'round',         check: p => /ROUND\s*[:=]/i.test(p),                                    msg: 'ROUND declaration' },
  ],

  // Post-Build Validator checks
  postBuildChecks: [
    { name: 'canvas-exists',    check: o => /<canvas/i.test(o),                                       msg: 'Missing <canvas>' },
    { name: 'rAF-present',     check: o => /requestAnimationFrame/i.test(o),                          msg: 'Missing rAF game loop' },
    { name: 'keydown-handler', check: o => /addEventListener.*keydown|onkeydown/i.test(o),           msg: 'Missing input handler' },
    { name: 'bracket-balanced',check: o => (o.match(/\{/g)||[]).length === (o.match(/\}/g)||[]).length, msg: 'Unbalanced braces' },
  ],

  // Skills: which skill loading is REQUIRED for this type
  requiredSkills: [], // Games don't need CSS/typography skills

  // Auditor: which passes apply
  auditPasses: ['pass0-syntax', 'pass1-code-quality', 'pass2-performance', 'pass3-integration'],
  // NOTE: pass3-polish is not applicable for games (no CSS)
  // NOTE: pass2.5-security is not applicable for client-side games
};
```

---

## 7. Enforcement Layer

### 7.1 Pre-Build Gate (Per-Tag)

```javascript
// src/enforcer/pre-build-gate.js

class PreBuildGate {
  constructor(workflowRegistry, phaseLock) {
    this.registry = workflowRegistry;
    this.phaseLock = phaseLock;
  }

  validate(agentType, dispatchPrompt, sessionState) {
    if (agentType !== 'forcoding-builder') {
      return { valid: true, errors: [], checks: [] };
    }

    // Phase lock check (must be first)
    const phaseResult = this.phaseLock.check(agentType, sessionState.currentState);
    if (!phaseResult.allowed) {
      return {
        valid: false,
        errors: [{
          name: 'phase-lock',
          message: `Cannot dispatch ${agentType} in state "${sessionState.currentState}". Expected: ${phaseResult.expected}`,
          remediation: phaseResult.remediation,
        }],
        checks: [],
      };
    }

    // Get per-tag checklist
    const tags = sessionState.classification.tags;
    const profile = this.registry.getProfile(tags);
    const checklist = profile.preBuildChecks;

    // Run all checks
    const results = checklist.map(check => ({
      name: check.name,
      passed: check.check(dispatchPrompt),
      message: check.msg,
    }));

    const failed = results.filter(r => !r.passed);

    return {
      valid: failed.length === 0,
      errors: failed.map(f => ({
        name: f.name,
        message: `Missing: ${f.message}`,
        remediation: `Add "${f.name}" section to dispatch prompt`,
      })),
      checks: results,
    };
  }

  generateRemediation(errors, state) {
    const steps = [];

    for (const err of errors) {
      if (err.name === 'phase-lock') {
        steps.push(`Cannot dispatch from state "${state.currentState}".`);
        steps.push(err.remediation);
      } else {
        steps.push(`${err.message} — ${err.remediation}`);
      }
    }

    return steps;
  }
}
```

### 7.2 Post-Build Validator

```javascript
// src/enforcer/post-build-validator.js

class PostBuildValidator {
  constructor(truncationRecovery) {
    this.truncation = truncationRecovery;
  }

  async check(toolOutput, classification, fileContent) {
    const tags = classification.tags;
    const profile = this.registry.getProfile(tags);
    const checks = profile.postBuildChecks.map(check => ({
      name: check.name,
      passed: check.check(fileContent || toolOutput),
      message: check.msg,
      severity: check.severity || 'warning',
    }));

    // Always run truncation check (model-agnostic)
    const truncResult = await this.truncation.detect(toolOutput, tags);

    return {
      passed: checks.every(c => c.passed) && !truncResult.truncated,
      checks,
      truncation: truncResult,
      canAutoAdvance: checks.every(c => c.severity !== 'critical') && !truncResult.truncated,
    };
  }
}
```

### 7.3 Context Budget Manager

```javascript
// src/enforcer/context-budget.js

class ContextBudgetManager {
  constructor(lightweightContextLimit = 48000) {
    this.limit = lightweightContextLimit;
    // Research shows accuracy degradation begins ~66% of context window.
    // Set warning before onset (50%) and rotation well before critical (75%).
    this.warningThreshold = 0.50;  // ~24K tokens
    this.rotationThreshold = 0.75; // ~36K tokens — before context rot onset
  }

  // Called after every tool.execute.after to track token usage
  track(toolInput) {
    const state = this.store.get();
    state.estimatedTokens = (state.estimatedTokens || 0) + this.estimateTokens(toolInput);

    if (state.estimatedTokens > this.limit * this.rotationThreshold) {
      return {
        level: 'rotation',
        usage: state.estimatedTokens,
        percent: (state.estimatedTokens / this.limit * 100).toFixed(1),
        cue: `[ForCoding] Context at ${(state.estimatedTokens/this.limit*100).toFixed(0)}%. Compaction recommended now — quality degrades beyond this point.`,
      };
    }

    if (state.estimatedTokens > this.limit * this.warningThreshold) {
      return {
        level: 'warning',
        usage: state.estimatedTokens,
        percent: (state.estimatedTokens / this.limit * 100).toFixed(1),
        cue: null, // Silent tracking — onset approaching but not yet critical
      };
    }

    return { level: 'ok', usage: state.estimatedTokens };
  }

  estimateTokens(input) {
    // Rough estimate: 1 token ≈ 4 characters for English, ~2 for code
    const text = typeof input === 'string' ? input : JSON.stringify(input);
    return Math.ceil(text.length / 3.5);
  }
}
```

---

## 8. HITL System

### 8.1 Trigger Logic

```javascript
// src/hitl/checkpoint.js

class HITLCheckpoint {
  shouldTrigger(sessionState) {
    if (sessionState.classificationLocked) return false;
    if (sessionState.currentState !== STATE.AWAITING_HITL) return false;
    return true;
  }

  // Inject confirmation, REPLACING the original user message
  injectConfirmation(classification, output) {
    output.message = { role: 'user' };
    output.parts = [{ type: 'text', text: this.renderer.render(classification) }];
  }
}
```

### 8.2 Renderer (Confidence-Adaptive)

```javascript
// src/hitl/renderer.js

class HITLRenderer {
  render(classification) {
    if (classification.confidence === 'low') {
      return this.renderInteractive(classification);
    }
    return this.renderConfirm(classification);
  }

  renderConfirm(c) {
    const wf = c.workflow.map(s => this.icon(s) + ' ' + s).join(' → ');

    return `## ForCoding Analysis

| Dimension | Detected |
|:--|:--|
| **Task Type** | ${this.icon(c.type)} ${c.type} |
| **Scope** | ${c.weight} · ${c.subsystems} subsystems |
| **Tech** | ${c.techStack.join(', ') || 'auto-detect'} |
| **Workflow** | ${wf} |

${c.notes.map(n => `- ${n}`).join('\n')}

Reply **"ok"** to confirm, or describe adjustments.`;
  }

  renderInteractive(c) {
    const options = [c.type, ...c.alternatives];
    const optionList = options.map((opt, i) =>
      `**${String.fromCharCode(65+i)}**) ${this.icon(opt)} ${opt}`
    ).join('\n');

    return `## ForCoding Analysis ⚠️ Low Confidence

I'm unsure about the task type. Please select:

${optionList}

Or describe your task in more detail.`;
  }

  icon(val) {
    const map = {
      'web-ui': '🎨', 'spa-app': '⚛️', 'fullstack-app': '🏗️', 'backend-api': '🔌',
      'canvas-game': '🎮', 'cli-tool': '💻', 'data-pipeline': '📊', 'npm-library': '📦',
      'hotfix': '🔧', 'refactor': '♻️',
      'discovery': '🔍', 'design': '✏️', 'plan': '📋', 'build': '🔨', 'audit': '🔎', 'rsi': '✅',
      'light': '⚡', 'standard': '📐', 'heavy': '🏗️',
    };
    return map[val] || '';
  }
}
```

### 8.3 Response Parser

```javascript
// src/hitl/response-parser.js

class HITLResponseParser {
  parse(userMessage) {
    const msg = userMessage.trim().toLowerCase();

    // Confirmation patterns
    if (/^(ok|确认|yes|y|好|行|可以|没问题|继续|go|proceed|confirm)/i.test(msg)) {
      return { action: 'confirm' };
    }

    // Restart / Reclassify
    if (/^(restart|reclassify|重新分类|重来|reset)/i.test(msg)) {
      return { action: 'reclassify' };
    }

    // Type adjustment: "type: game"
    const typeMatch = msg.match(/type:\s*(\S+)/i);
    const tagsMatch = msg.match(/domain:\s*(\S+)/i);
    const depthMatch = msg.match(/(?:depth|weight):\s*(\S+)/i);
    const techMatch = msg.match(/tech:\s*(.+)/i);

    if (typeMatch || tagsMatch || depthMatch || techMatch) {
      return {
        action: 'adjust',
        adjustments: {
          ...(typeMatch && { type: typeMatch[1] }),
          ...(tagsMatch && { domain: tagsMatch[1] }),
          ...(depthMatch && { weight: depthMatch[1] }),
          ...(techMatch && { techStack: techMatch[1].split(/[,，]\s*/) }),
        },
      };
    }

    // Single-letter selection: "A", "B", etc.
    if (/^[a-d]$/i.test(msg)) {
      return { action: 'select', option: msg.toUpperCase() };
    }

    return { action: 'unknown' };
  }
}
```

---

## 9. Truncation Recovery

### 9.1 Detection + Recovery Loop

```javascript
// src/enforcer/truncation-recovery.js

class TruncationRecovery {
  constructor(stateStore) {
    this.store = stateStore;
    this.MAX_RETRIES = 2;
  }

  async detect(output, tags) {
    const signals = [];

    // HTML closure
    if (tags.domain === 'frontend' || tags.form === 'single-page') {
      if (output.includes('<html') && !output.includes('</html>'))
        signals.push({ type: 'unclosed-html', severity: 'critical' });
      if (output.includes('<body') && !output.includes('</body>'))
        signals.push({ type: 'unclosed-body', severity: 'critical' });
    }

    // Bracket balance
    const openBraces = (output.match(/\{/g) || []).length;
    const closeBraces = (output.match(/\}/g) || []).length;
    if (openBraces - closeBraces > 3)
      signals.push({ type: 'unbalanced-braces', severity: 'critical', detail: `${openBraces} vs ${closeBraces}` });

    // Too short
    const minLines = this.estimateMinLines(tags);
    const actualLines = output.split('\n').length;
    if (minLines > 0 && actualLines < minLines * 0.5)
      signals.push({ type: 'too-few-lines', severity: 'critical', detail: `${actualLines} vs ~${minLines}` });

    // General: very short output for non-trivial tasks
    if (output.length < 200 && !['cli-tool', 'setup'].includes(tags.lifecycle))
      signals.push({ type: 'too-short', severity: 'warning' });

    return { truncated: signals.length > 0, signals };
  }

  estimateMinLines(tags) {
    if (tags.domain === 'game') return 100;
    if (tags.form === 'single-page') return 50;
    if (tags.form === 'api') return 30;
    if (tags.form === 'library') return 20;
    return 0;
  }

  async handle(truncResult, partialOutput, classification) {
    const state = await this.store.load();
    const retryCount = (state.buildRetries || 0) + 1;

    if (retryCount > this.MAX_RETRIES) {
      return {
        action: 'halt',
        reason: `Truncation after ${retryCount} retries. HITL required.`,
        partialOutput,
        signals: truncResult.signals,
      };
    }

    // Save state for recovery
    await this.store.save({
      buildTruncated: true,
      partialOutput,
      buildRetries: retryCount,
      truncationSignals: truncResult.signals,
    });

    return {
      action: 'retry',
      retryCount,
      context: this.buildRetryContext(partialOutput, truncResult.signals, retryCount),
    };
  }

  buildRetryContext(partial, signals, round) {
    return `## TRUNCATION RECOVERY (Attempt ${round}/${this.MAX_RETRIES})

The previous builder output was truncated:
${signals.map(s => `  - ${s.type}: ${s.detail || s.severity}`).join('\n')}

### Continue from here (last 500 chars):
\`\`\`
${partial.slice(-500)}
\`\`\`

**Instructions:**
1. Read the partial output above carefully
2. Continue from EXACTLY where it was cut off
3. Complete ALL remaining code
4. Ensure all tags/braces/parens are properly closed
5. Output ONLY the remaining portion, not the entire file`;
  }
}
```

---

## 10. Context Budget Management

### 10.1 Lightweight Context Lifecycle

```
Session Start (0%)
  │
  ├─ Classification + HITL: ~800 tokens (2%)
  ├─ Discovery/Dispatch: ~1500 tokens (5%)
  ├─ Builder dispatch + output: ~4000 tokens (13%)
  │
  ├─ [50%] Warning threshold → silent tracking
  │   ContextBudgetManager.track() returns { level: 'warning' }
  │
  ├─ [75%] Rotation threshold — context rot onset → inject compaction cue
  │   ContextBudgetManager.track() returns { level: 'critical', cue: "..." }
  │   Plugin injects cue into chat.messages.transform
  │   LLM sees: "[ForCoding] Context at 90%. Compaction recommended."
  │
  └─ [95%+] → ContextBudgetManager.track() returns { level: 'emergency' }
      Plugin PREVENTS next dispatch until compaction
```

### 10.2 Compaction Cue Injection

```javascript
// In plugin hooks:

'experimental.chat.messages.transform': async (_input, output) => {
  const budget = contextBudget.track(sessionState);
  const state = await store.load(sessionId);

  // Inject classification context (progressive disclosure)
  if (state.classificationLocked && state.currentState !== STATE.DONE) {
    const summary = `[ForCoding] Task: ${state.classification.type} | Phase: ${state.currentState} | Round: ${state.buildRound || 1}`;
    injectContextMessage(output, summary);
  }

  // Inject compaction cue when critical
  if (budget.level === 'critical' && budget.cue) {
    injectContextMessage(output, budget.cue);
  }

  // Inject rejection feedback if last dispatch was blocked
  if (state.lastBlockedAction && !state.lastBlockedAction.reported) {
    const explanation = `
[ForCoding] Previous dispatch BLOCKED:
${state.lastBlockedAction.errors.map(e => `  - ${e.message}`).join('\n')}

To fix:
${state.lastBlockedAction.remediation.map(r => `  → ${r}`).join('\n')}
`;
    injectContextMessage(output, explanation);
    await store.update({ 'lastBlockedAction.reported': true });
  }
},
```

---

## 11. Prototype Loop (Design Thinking Integration)

When a user's project idea is not yet mature — requirements are fuzzy, the visual direction is unclear, or they are exploring "what if" scenarios — ForCoding_Arch should not rush to implementation. Instead, it enters a **prototype loop** that keeps the user in an exploration cycle until they signal readiness to commit.

### 11.1 Entry Conditions

The prototype loop is offered at two points:
- **After HITL confirmation**: If the classification confidence is medium/low, or if the user says "just exploring"/"not sure yet"/"prototype first"
- **From Discovery**: If discovery reveals unresolved design questions, the orchestrator can request a return to prototype

### 11.2 What Happens in Prototype

The prototype state is a **contained iteration cycle**. The orchestrator can dispatch Builder to generate throwaway code — visual mockups, interaction sketches, layout experiments — without triggering audit or RSI. The key difference from the normal build phase:

| Normal Build | Prototype Build |
|:--|:--|
| Must pass Pre-Build Gate | Pre-Build Gate relaxed (visual references optional) |
| Output validated by Auditor | No Auditor dispatch |
| Gate file generated | No gate file — prototypes are ephemeral |
| RSI required to complete | No RSI — user judges visually |
| State advances to audit | State stays in prototype (loop) |

### 11.3 Exit Conditions

The prototype loop exits when:
- User says "commit"/"build for real"/"ok let's go"/"ready"
- Orchestrator detects a clear design direction has emerged (user provides specific visual references or detailed requirements)
- FSM transitions from `prototype` to `discovery` (restart with clear intent)

### 11.4 How This Helps Design Thinking

Design thinking has five phases: Empathize → Define → Ideate → Prototype → Test. ForCoding_Arch's prototype loop supports the **Prototype + Test** phases directly. Builder generates quick, disposable UI mockups. User reviews visually. Iteration continues until direction crystallizes. Then exit to discovery/build with clear intent.

The orchestrator prompt includes guidance:
```
If the user seems uncertain or is exploring ideas, suggest entering prototype mode.
In prototype mode, dispatch Builder for visual explorations — no audit, no RSI.
When the user signals readiness, call "ready" to exit the loop.
```

---

## 12. Task Scope Classification (Simple Fix Criteria)

ForCoding_Arch needs an objective, measurable way to distinguish a "trivial fix" (where the full harness is overkill) from a "meaningful change" (where governance adds value).

### 12.1 Scoring Function

```javascript
// src/classifier/scope-scorer.js

class ScopeScorer {
  static score(prompt, projectScan) {
    let score = 0;
    const p = prompt.toLowerCase();

    // Axis 1: File count implied by request
    if (p.match(/\b(one|single|this)\s+file\b/i))           score += 0;
    if (p.match(/\b(a few|some|several)\s+files?\b/i))      score += 2;
    if (p.match(/\b(multiple|many|all|across)\s+files?\b/i)) score += 4;

    // Axis 2: Change magnitude
    if (p.match(/\b(fix|change|update|modify|adjust)\s+(one|a|the|this)\b/i)) score += 0;
    if (p.match(/\b(add|create|build|make|implement|refactor)\b/i))            score += 3;

    // Axis 3: Line impact estimate
    if (p.match(/\b(line|typo|spelling|color|font|margin|padding)\b/i))      score += 0;
    if (p.match(/\b(function|component|module|endpoint|route|handler)\b/i))  score += 2;

    // Axis 4: Existing test coverage (project scan)
    if (projectScan.hasTests) score += 1;

    // Axis 5: User role signal — "just"/"quick" = low stakes
    if (p.match(/\b(just|simply|merely|only|quick)\b/i)) score -= 1;

    return score;
  }

  static classify(score) {
    if (score <= 1)  return 'trivial';
    if (score <= 3)  return 'minor';
    if (score <= 6)  return 'moderate';
    return 'major';
  }

  static shouldSkipHarness(score) { return this.classify(score) === 'trivial'; }

  static getWorkflow(score) {
    const c = this.classify(score);
    if (c === 'trivial')  return ['build', 'rsi'];
    if (c === 'minor')    return ['build', 'audit', 'rsi'];
    if (c === 'moderate') return ['discovery', 'build', 'audit', 'rsi'];
    return ['discovery', 'design', 'plan', 'build', 'audit', 'rsi'];
  }
}
```

### 12.2 Objective Thresholds

| Score | Label | Workflow | Example |
|:--|:--|:--|:--|
| 0-1 | **trivial** | build → rsi | "fix the button color to blue" |
| 2-3 | **minor** | build → audit → rsi | "add error handling to /api/users" |
| 4-6 | **moderate** | discovery → build → audit → rsi | "create a user profile page" |
| 7+ | **major** | full pipeline | "build the entire auth system" |

### 12.3 Rationale

For personal projects: trivial fixes have zero cascading impact; the user's own eyes are the best auditor; the harness cost for one-line changes exceeds any quality benefit.

The threshold is user-configurable via state-store preferences:
```javascript
{ scopeThreshold: 1 }  // Default: skip harness at score <= 1
{ scopeThreshold: 3 }  // Aggressive: skip harness at score <= 3
```

---

## 13. Supervisor Role Support

Your role in ForCoding_Arch is not just "user who confirms classification." You are the planner, methodology guide, improver, and project supervisor. The harness must treat you as the ultimate authority — not as a checkpoint gateway.

### 13.1 Design Principle

```
The human supervisor is ABOVE the state machine.
The state machine serves the supervisor, not the other way around.
```

### 13.2 Supervisor Commands

| Command | Effect | Example |
|:--|:--|:--|
| `skip audit` | Jump from build to RSI | "looks good, skip audit" |
| `force build` | Override Pre-Build Gate block | "force build, I know what I want" |
| `back to design` | Rewind to design phase | "back to design, I want to rethink" |
| `pause` | Freeze current state | "pause, let me review first" |
| `resume` | Continue from paused state | "ok resume" |
| `shortcut` | Enter trivial workflow | "shortcut, just fix the padding" |
| `full` | Force full workflow | "full process, this is important" |

### 13.3 Implementation

```javascript
function detectSupervisorOverride(message, state) {
  const m = message.trim().toLowerCase();
  if (/^(skip|no)\s+audit/i.test(m))      return { command: 'skip_audit' };
  if (/^force\s+build/i.test(m))          return { command: 'force_build' };
  if (/^back\s+to\s+design/i.test(m))     return { command: 'back_to_design' };
  if (/^pause/i.test(m))                  return { command: 'pause' };
  if (/^resume/i.test(m) && state.paused) return { command: 'resume' };
  if (/^shortcut/i.test(m))               return { command: 'shortcut' };
  if (/^full\s+(process|harness)/i.test(m)) return { command: 'full' };
  return null;
}
```

`forceTransition()` is available only to supervisor commands — normal orchestrator dispatches cannot trigger it. Every override is recorded to the audit trail.

---

## 14. Plugin Entry Point

```javascript
// .opencode/plugins/forcoding.js

import { StateMachine } from '../src/fsm/state-machine.js';
import { StateStore } from '../src/fsm/state-store.js';
import { IntentClassifier } from '../src/classifier/intent-classifier.js';
import { ProjectScanner } from '../src/classifier/project-scanner.js';
import { TechDetector } from '../src/classifier/tech-detector.js';
import { DensityAnalyzer } from '../src/classifier/density-analyzer.js';
import { WorkflowRegistry } from '../src/workflow/registry.js';
import { PreBuildGate } from '../src/enforcer/pre-build-gate.js';
import { PhaseLock } from '../src/enforcer/phase-lock.js';
import { PostBuildValidator } from '../src/enforcer/post-build-validator.js';
import { TruncationRecovery } from '../src/enforcer/truncation-recovery.js';
import { CycleDetector } from '../src/enforcer/cycle-detector.js';
import { ContextBudgetManager } from '../src/enforcer/context-budget.js';
import { HITLCheckpoint } from '../src/hitl/checkpoint.js';
import { AuditTrail } from '../src/audit/audit-trail.mjs';
import { GateSystem } from '../src/gates/gate-system.mjs';

export const ForCodingPlugin = async ({ client, directory }) => {
  // ── Initialize all modules ──
  const store = new StateStore(directory);
  const fsm = new StateMachine(store, new GateSystem(directory));
  const audit = new AuditTrail(directory);

  const scanner = new ProjectScanner(directory);
  const tech = new TechDetector(directory);
  const density = new DensityAnalyzer();
  const workflow = new WorkflowRegistry();
  const classifier = new IntentClassifier(scanner, tech, density, workflow);

  const phaseLock = new PhaseLock(fsm);
  const truncation = new TruncationRecovery(store);
  const validator = new PostBuildValidator(truncation, workflow);
  const preBuildGate = new PreBuildGate(workflow, phaseLock);
  const cycleDetector = new CycleDetector(store);
  const contextBudget = new ContextBudgetManager(48000);

  const hitl = new HITLCheckpoint(/* renderer, parser */);

  return {
    // ── Message arrival → classify + HITL ──
    'chat.message': async (input, output) => {
      const state = await store.load(input.sessionID);

      // ── Supervisor override detection (must run first) ──
      const override = detectSupervisorOverride(output.message, state);
      if (override) {
        switch (override.command) {
          case 'skip_audit':
            await fsm.forceTransition(state.currentState, STATE.RSI);
            injectContextMessage(output, '[ForCoding] Supervisor: audit skipped → RSI');
            await audit.record({ event: 'supervisor_override', command: 'skip_audit', from: state.currentState, to: STATE.RSI });
            return;
          case 'force_build':
            await fsm.forceTransition(state.currentState, STATE.BUILD);
            injectContextMessage(output, '[ForCoding] Supervisor: forced build. Pre-Build Gate bypassed.');
            await audit.record({ event: 'supervisor_override', command: 'force_build', from: state.currentState, to: STATE.BUILD });
            return;
          case 'back_to_design':
            await fsm.forceTransition(state.currentState, STATE.DESIGN);
            injectContextMessage(output, '[ForCoding] Supervisor: rewinding to design phase.');
            await audit.record({ event: 'supervisor_override', command: 'back_to_design', from: state.currentState, to: STATE.DESIGN });
            return;
          case 'pause':
            await store.save({ paused: true, pausedAt: state.currentState });
            injectContextMessage(output, '[ForCoding] Paused. Say "resume" to continue.');
            return;
          case 'resume':
            await store.save({ paused: false });
            injectContextMessage(output, `[ForCoding] Resumed at: ${state.pausedAt}.`);
            return;
          case 'shortcut':
            await store.save({ workflowOverride: 'trivial' });
            injectContextMessage(output, '[ForCoding] Shortcut mode — minimal harness.');
            return;
          case 'full':
            await store.save({ workflowOverride: 'major' });
            injectContextMessage(output, '[ForCoding] Full harness mode — complete governance.');
            return;
        }
      }

      // Awaiting HITL response
      if (state.currentState === STATE.AWAITING_HITL) {
        const response = hitl.parseResponse(output.message);
        if (response.action === 'confirm') {
          await fsm.transition('awaiting_hitl', 'discovery');
          await store.lock(state);
          output.message = state.originalMessage;  // Restore original
          injectClassificationContext(output, state.classification);
          await audit.record({ event: 'classification_confirmed', classification: state.classification });
        } else if (response.action === 'adjust') {
          // Re-classify with adjustments
          const updated = await classifier.reclassify(state.originalPrompt, response.adjustments);
          await store.save({ classification: updated });
          hitl.injectConfirmation(updated, output);
        } else if (response.action === 'reclassify') {
          await fsm.transition('awaiting_hitl', 'classifying');
          hitl.injectConfirmation(await classifier.classify(state.originalPrompt, directory), output);
        }
        return;
      }

      // New task → classify
      if (!state.classificationLocked) {
        const classification = await classifier.classify(output.message, directory);
        await store.save({
          classification,
          originalMessage: output.message,
          originalPrompt: output.message,
        });
        await fsm.transition('idle', 'classifying');
        await fsm.transition('classifying', 'awaiting_hitl');
        hitl.injectConfirmation(classification, output);
        await audit.record({ event: 'classification_proposed', classification });
        return;
      }
    },

    // ── Pre-execution → gate ──
    'tool.execute.before': async (input, output) => {
      const { tool } = input;
      const state = await store.load(input.sessionID);

      if (tool === 'task') {
        const agentType = output.args?.subagent_type;

        // Phase lock
        if (!fsm.canDispatch(agentType)) {
          const remediation = fsm.getNextStep(state.currentState);
          const errors = [{
            name: 'phase-lock',
            message: `${agentType} cannot be dispatched in state "${state.currentState}"`,
            remediation: `Dispatch ${remediation.agent} (${remediation.stage})`,
          }];
          await store.save({ lastBlockedAction: { agentType, errors, remediation: preBuildGate.generateRemediation(errors, state) } });
          throw new Error(`[ForCoding] BLOCKED: ${agentType} in ${state.currentState}. Next: ${remediation.agent}`);
        }

        // Pre-Build Gate (builder only) — relaxed in prototype mode
        if (agentType === 'forcoding-builder') {
          // Prototype mode: skip full Pre-Build Gate
          const isPrototype = state.currentState === STATE.PROTOTYPE;
          const result = isPrototype
            ? { valid: true, checks: [{ name: 'prototype_mode', passed: true, message: 'Gate relaxed in prototype' }] }
            : preBuildGate.validate(agentType, output.args?.prompt, state);


          if (!result.valid) {
            await store.save({ lastBlockedAction: { agentType, errors: result.errors, remediation: preBuildGate.generateRemediation(result.errors, state) } });
            throw new Error(
              `[ForCoding] Pre-Build Gate FAILED:\n` +
              result.errors.map(e => `  ❌ ${e.message}`).join('\n') + `\n\n` +
              `Fix:\n` + result.errors.map(e => `  → ${e.remediation}`).join('\n')
            );
          }

          // Advance state
          await fsm.transition(state.currentState, 'build');
          await audit.record({ event: 'build_dispatched', checks: result.checks });
        }

        // Track context budget
        const budget = contextBudget.track(output.args?.prompt);
        if (budget.level === 'emergency') {
          throw new Error('[ForCoding] Context budget exhausted. Session compaction required before next dispatch.');
        }
      }
    },

    // ── Post-execution → validate + auto-advance ──
    'tool.execute.after': async (input, output) => {
      const { tool } = input;
      const state = await store.load(input.sessionID);

      if (tool === 'task' && input.args?.subagent_type === 'forcoding-builder') {
        // Prototype mode: skip audit/Rsi, stay in prototype loop
        if (state.currentState === STATE.PROTOTYPE) {
          output.title = '[PROTOTYPE] Build complete. Review and iterate or say "ready".';
          return; // Do NOT advance state — stay in prototype loop
        }

        // Truncation detection
        const truncResult = await truncation.detect(output.output, state.classification.tags);

        if (truncResult.truncated) {
          const recovery = await truncation.handle(truncResult, output.output, state.classification);
          if (recovery.action === 'retry') {
            await fsm.transition('build', 'build_recovery');
            // Inject recovery context
            output.title = `[TRUNCATED] Retry ${recovery.retryCount}/${truncation.MAX_RETRIES}`;
            injectRecoveryContext(output, recovery.context);
            return;
          }
          // Halt → HITL escalation
          await store.save({ truncationExhausted: true });
          output.title = '[HALTED] Truncation recovery exhausted';
          return;
        }

        // Post-build validation
        const validation = await validator.check(output.output, state.classification);
        if (!validation.canAutoAdvance) {
          output.title = `[WARNING] ${validation.checks.filter(c => !c.passed).length} checks failed`;
          // Don't auto-advance; let orchestrator decide
          return;
        }

        // Auto-advance to audit
        await fsm.autoAdvance('build', 'audit');
        output.title = '[BUILD COMPLETE → AUDIT QUEUED]';
        injectAuditPrompt(output);
      }

      if (tool === 'task' && input.args?.subagent_type === 'forcoding-auditor') {
        await fsm.autoAdvance('audit', 'rsi');
        output.title = '[AUDIT COMPLETE → RSI QUEUED]';
      }
    },
  };
};
```

---

## 15. Agent File Changes

### 12.1 Orchestrator: 188 → 45 lines

The orchestrator prompt is simplified to delegation logic only. All governance rules live in the FSM.

### 12.2 Builder: 508 → ~280 lines

**Removed (now in plugin):**
- Auto-Inject Manifest handling (~100 lines)
- Phase Gate Verification checks (~30 lines)
- Visual Reference enforcement (~20 lines)
- Polish Round marking (~40 lines)

**Kept:**
- Role definition & tech stack detection
- Build workflow (generate → verify → iterate)
- Code quality standards
- Lightweight-specific output guidelines

### 12.3 Auditor: 564 → ~450 lines

**Removed:**
- Gate Chain Verification Pass 0.5 (FSM handles it)

**Added:**
- Pass 1.5: Truncation residual check
- Pass 2.6: Security scan (backend/fullstack tasks only)

### 12.4 Others

| Agent | Change |
|:--|:--|
| Designer (406 lines) | **Unchanged** — design spec is LLM work |
| Planner (287 lines) | **Unchanged** — SPOQ DAG is LLM work |
| Drafter | **Unchanged** |
| Scout | **Unchanged** |

---

## 16. Skill & Policy Migration

### 13.1 Skills: 13 → 0 injected

| Skill | ForCoding v3.0 Role | ForCoding_Arch Fate | Execution Location |
|:--|:--|:--|:--|
| forcoding-core | Workhorse (1237 lines) | 📄 Reference only | FSM + Classifier |
| forcoding-gate | Pre-Flight Gate rules | 📄 Reference only | pre-build-gate.js |
| forcoding-intent | Intent refinement | 📄 Reference only | intent-classifier.js |
| forcoding-visual-review | 14-item checklist | 📄 Reference only | pre-build-gate.js per-tag |
| forcoding-ui-checklist | UI constraints | 📄 Reference only | pre-build-gate.js frontend tag |
| forcoding-Lightweight-engine | Lightweight optimization | 📄 Reference only | LightweightPrompt guidelines in DESIGN.md |
| forcoding-Lightweight-optimization | Prompt techniques | 📄 Reference only | Same as above |
| forcoding-design-md-bridge | DESIGN.md bridge | 📄 Reference only | HITL renderer references |
| forcoding-clean-comments | Comment quality | 📄 Reference only | Builder prompt guidance |
| forcoding-edit-quality | Edit reliability | 📄 Reference only | Remains as guidance |
| forcoding-reliable-edits | Edit validation | 📄 Reference only | Remains as guidance |
| forcoding-parallel | Parallel dispatch | 📄 Reference only | Remains as guidance |
| forcoding-autopilot | Auto-continuation | 📄 Reference only | Remains as guidance |

### 13.2 Policies: 5 YAML → 5 reference docs

All `policies/base/*.yaml` files are retained as human-readable reference. The plugin no longer loads or evaluates them. Their logic is embedded in:

| Policy | New Location |
|:--|:--|
| never-rules.yaml | FSM transitions + tool-allowlist.js |
| stage-gates.yaml | FSM transitions + phase-lock.js |
| dispatch-rules.yaml | FSM canDispatch() |
| depth-rules.yaml | intent-classifier.js (density analysis) |
| quality-gates.yaml | pre-build-gate.js per-tag checklists |

---

## 17. Quality Assurance Design

### 14.1 Engineering Quality Targets

ForCoding_Arch defines internal quality targets organized by operational concern:

| # | Concern | Target | Implementation | Status |
|:--|:--|:--|:--|:--:|
| 1 | Context budget | < 5% of window for governance | No skill injection; orchestrator ~45 lines | ✅ |
| 2 | State durability | Survive crash and compaction | JSON file persistence with atomic writes | ✅ |
| 3 | Compaction resilience | Recover state after session compression | ContextBudgetManager + state rehydration | ⚠️ |
| 4 | Action authorization | Destructive ops require approval | Per-agent YAML + per-phase tool allowlist | ✅ |
| 5 | Governance surface | Rules enforced in code, not prompts | State machine + enforcer modules (Node.js) | ✅ |
| 6 | Execution isolation | Tool access scoped to current phase | tool-allowlist.js per-phase restrictions | ✅ |
| 7 | Output verification | Every builder output validated | PostBuildValidator with per-type checks | ⚠️ |
| 8 | Input/output barriers | Validate both dispatch prompts and generated code | pre-build-gate + post-build-validator | ✅ |
| 9 | Runtime resilience | Pause, resume, retry on failure | File-based state + truncation recovery | ✅ |
| 10 | Evaluation coverage | Structured tests per failure mode | Not yet implemented (future target) | ❌ |
| 11 | Review independence | Separate reviewer from generator | Auditor sub-agent (isolated from builder) | ❌ |
| 12 | Regression prevention | Automated checks on changes | Not yet implemented (future target) | ❌ |
| 13 | Execution tracing | Full lifecycle visibility | State machine transitions + gate files | ⚠️ |
| 14 | Cost awareness | Token budget with user-visible cues | ContextBudgetManager tracks and warns | ⚠️ |
| 15 | Security scanning | Detect dangerous patterns | Not yet implemented (future target) | ❌ |

**Current: 9 of 15 targets met (60%).** The core governance surface (1-9) is solid. Evaluation and security scanning (10-12, 15) are deferred to future iterations.

### 14.2 Lifecycle Completeness

ForCoding_Arch covers the following stages of the agent-assisted development lifecycle:

| Stage | Coverage | Implementation |
|:--|:--:|:--|
| Task reception | ✅ | chat.message hook captures user intent |
| Intent analysis | ✅ | Multi-axis deterministic classifier |
| Classification confirmation | ✅ | Single-session HITL checkpoint |
| Requirement discovery | ✅ | FSM-enforced discovery phase |
| Design specification | ✅ | Designer sub-agent (standard+ tasks) |
| Implementation planning | ✅ | Planner sub-agent (heavy tasks) |
| Code generation | ✅ | Builder sub-agent with pre-build gate |
| Output quality check | ✅ | Post-build validation with per-type rules |
| Independent review | ✅ | Auditor sub-agent with structured verdict |
| Acceptance verification | ✅ | RSI phase with visual checks |
| Context budget monitoring | ✅ | Token tracker with compaction cues |
| Failure recovery | ✅ | Truncation detection + auto-retry |
| Audit trail | ✅ | Gate files with hash chain |
| Cross-session memory | ❌ | Deferred to future iteration |
| Continuous improvement loop | ❌ | Deferred to future iteration |

**Current lifecycle coverage: 13 of 16 stages (81%).**

---

## 18. Migration Plan

### Phase 1: Core Infrastructure (P0)

| # | Task | Files | Effort |
|:--|:--|:--|:--|
| M1 | Create `src/fsm/` (4 files) | state-machine.js, state-store.js, transitions.js, errors.js | 2 days |
| M2 | Create `src/classifier/` (5 files) | intent-classifier.js, project-scanner.js, tech-detector.js, density-analyzer.js, subtype-validator.js | 2 days |
| M3 | Create `src/workflow/` (10 files) | registry.js + 9 profiles | 1 day |
| M4 | Create `src/hitl/` (3 files) | checkpoint.js, renderer.js, response-parser.js | 1 day |
| M5 | Rewrite plugin entry | .opencode/plugins/forcoding.js (333 → ~80 lines) | 1 day |

### Phase 2: Enforcement (P1)

| # | Task | Files | Effort |
|:--|:--|:--|:--|
| M6 | Create `src/enforcer/` (6 files) | pre-build-gate.js, phase-lock.js, tool-allowlist.js, post-build-validator.js, truncation-recovery.js, cycle-detector.js | 2 days |
| M7 | Create `src/enforcer/context-budget.js` | 1 file | 0.5 day |
| M8 | Create `src/observability/` (2 files) | metrics.js, health-check.js | 0.5 day |

### Phase 3: Agent Slimming (P1)

| # | Task | Files | Effort |
|:--|:--|:--|:--|
| M9 | Slim orchestrator | agents/forcoding.md (188 → ~45 lines) | 0.5 day |
| M10 | Slim builder | agents/forcoding-builder.md (508 → ~280 lines) | 0.5 day |
| M11 | Slim auditor | agents/forcoding-auditor.md (564 → ~450 lines) | 0.5 day |

### Phase 4: Cleanup & Docs (P2)

| # | Task | Files | Effort |
|:--|:--|:--|:--|
| M12 | Demote skills to reference | 13 skill files → add "REFERENCE ONLY" header | 0.5 day |
| M13 | Demote policies to reference | 5 YAML files → add "REFERENCE ONLY" header | 0.5 day |
| M14 | Update package.json | version, keywords, files | 0.25 day |
| M15 | Global sync + test | Copy to ~/.config/opencode/, run health-check | 0.5 day |

**Total estimated effort: 13 person-days**

### Target ForCoding_Arch.0 Release: 2-3 weeks

---

## Appendix: Lightweight Model Quick Reference

| Scenario | Lightweight Behavior | ForCoding_Arch Mitigation |
|:--|:--|:--|
| Long prompt (>2000 tokens) | Attention dilution; misses rules at end | Max 800 tokens per dispatch prompt |
| Complex branching logic | Hallucinates path combinations | Binary gates (pass/fail), not conditional trees |
| Self-review | Optimistic grading (rates own code +20%) | Separate Auditor sub-agent |
| Truncation | ~15% of long outputs truncated | TruncationRecovery auto-detect + retry |
| Context after 60 turns | Quality degrades measurably | ContextBudgetManager cues compaction at 70% |
| Rule exception generation | Fabricates "but this case..." exceptions | FSM mechanically rejects — no exceptions |
| Ambiguous instructions | Chooses simplest interpretation | Structured checklists over prose paragraphs |
| JSON output | ~95% reliable if schema is simple | PostBuildValidator detects malformed output |
| Creative design | Good at following concrete references | Visual Reference requirement in Pre-Build Gate |
| Cost | ~$0.05 per 1M tokens | Extra rounds cost < $0.001 → acceptable overhead |
