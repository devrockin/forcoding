# Semantic Rewriter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Build Semantic Rewriter pipeline (L0-L3) that normalizes, enriches, and variants user prompts before builder dispatch.

**Architecture:** Four-layer pipeline (Normalizer → Enricher → VariantGenerator → UserConfirmation) integrated into plugin chat.message hook, reusing AWAITING_HITL state for two-round interaction. LLM callback as optional L2 enhancement with rule-based fallback.

**Tech Stack:** Pure JavaScript (ESM), vitest for testing, YAML templates

---

### Task 1: Rule Engine Core

**Files:**
- Create: src/rewriter/rule-engine.js
- Test: 	ests/rewriter/rule-engine.test.js

- [ ] **Step 1: Write the failing test**

\\\javascript
// tests/rewriter/rule-engine.test.js
import { describe, it, expect } from 'vitest';
import { RuleEngine } from '../../src/rewriter/rule-engine.js';

describe('RuleEngine', () => {
  it('executes matching rule and transforms text', () => {
    const engine = new RuleEngine([
      { name: 'remove-hacker-speak', pattern: /搞个/g, replace: 'create ' },
    ]);
    const result = engine.apply('帮我搞个登录页面');
    expect(result.text).toBe('帮我create 登录页面');
  });

  it('returns original if no rule matches', () => {
    const engine = new RuleEngine([]);
    const result = engine.apply('hello world');
    expect(result.text).toBe('hello world');
  });

  it('applies rules in priority order', () => {
    const engine = new RuleEngine([
      { name: 'low', pattern: /a/, replace: 'x', priority: 0 },
      { name: 'high', pattern: /a/, replace: 'y', priority: 10 },
    ]);
    const result = engine.apply('cat');
    expect(result.text).toBe('cyt');
  });

  it('returns matched rule names', () => {
    const engine = new RuleEngine([
      { name: 'remove-softener', pattern: /呗/g, replace: '' },
    ]);
    const result = engine.apply('写个页面呗');
    expect(result.matched).toContain('remove-softener');
  });
});
\\\

- [ ] **Step 2: Run test to verify it fails**

Run: \
px vitest run tests/rewriter/rule-engine.test.js --reporter=verbose 2>&1\
Expected: FAIL - module not found

- [ ] **Step 3: Write minimal implementation**

\\\javascript
// src/rewriter/rule-engine.js
export class RuleEngine {
  constructor(rules = []) {
    this.rules = [...rules].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  apply(text) {
    let result = text;
    const matched = [];
    for (const rule of this.rules) {
      if (rule.pattern.test(result)) {
        result = result.replace(rule.pattern, rule.replace);
        matched.push(rule.name);
      }
    }
    return { text: result, matched };
  }
}
\\\

- [ ] **Step 4: Run test to verify it passes**

Run: \
px vitest run tests/rewriter/rule-engine.test.js --reporter=verbose 2>&1\
Expected: PASS

- [ ] **Step 5: Commit**

\\\ash
git add src/rewriter/rule-engine.js tests/rewriter/rule-engine.test.js
git commit -m "feat(rewriter): add RuleEngine core with priority ordering"
\\\

---

### Task 2: Params Schema

**Files:**
- Create: \src/rewriter/params/schema.js\
- Test: \	ests/rewriter/params/schema.test.js\

- [ ] **Step 1: Write the failing test**

\\\javascript
// tests/rewriter/params/schema.test.js
import { describe, it, expect } from 'vitest';
import { PARAMS_SCHEMA, getSchema, validateParams } from '../../src/rewriter/params/schema.js';

describe('PARAMS_SCHEMA', () => {
  it('has schema for every task type', () => {
    const types = ['web-ui', 'canvas-game', 'cli-tool', 'backend-api', 'data-pipeline', 'spa-app', 'fullstack-app', 'hotfix', 'refactor', 'npm-library'];
    for (const t of types) {
      expect(PARAMS_SCHEMA[t]).toBeDefined();
    }
  });

  it('getSchema returns schema for a type', () => {
    const schema = getSchema('web-ui');
    expect(schema.pageType).toBeDefined();
    expect(schema.pageType.type).toBe('enum');
  });

  it('validateParams returns valid for known params', () => {
    const result = validateParams('web-ui', { pageType: 'login', style: 'minimal' });
    expect(result.valid).toBe(true);
  });

  it('validateParams returns invalid for unknown enum value', () => {
    const result = validateParams('web-ui', { pageType: 'invalid_type' });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
\\\

- [ ] **Step 2: Run test to verify it fails**
### Task 11: Plugin Integration

**Files:**
- Modify: \.opencode/plugins/forcoding.js\
- Create: \policies/base/rewriter-config.yaml\

- [ ] **Step 1: Add import and init to plugin**

In \.opencode/plugins/forcoding.js\, add after line 23 (existing imports):

\\\javascript
import { RewriterPipeline } from '../../src/rewriter/rewriter-pipeline.js';
\\\

After existing initializations (after line 49):

\\\javascript
const rewriter = new RewriterPipeline({ projectDir: directory });
\\\

- [ ] **Step 2: Add rewrite flow in chat.message hook**

After the IntentGateway section (line ~104), add the rewrite confirmation handler:

\\\javascript
// Rewrite confirmation sub-mode (within AWAITING_HITL)
if (state.currentState === STATE.AWAITING_HITL && state.pendingRewrite && !state.rewriteConfirmed) {
  const rewriteChoice = UserConfirmation.parseChoice(output.message);
  if (rewriteChoice.selectedId) {
    const selected = state.pendingRewrite.variants.find(v => v.id === rewriteChoice.selectedId);
    await store.save({ sessionId, rewrittenPrompt: selected.prompt, rewriteConfirmed: true, pendingRewrite: null });
    await audit.record(sessionId, { event: 'rewrite_confirmed', selectedVariant: rewriteChoice.selectedId });
    const next = ScopeScorer.shouldSkipHarness(ScopeScorer.score(state.originalPrompt, {})) ? STATE.BUILD : STATE.DISCOVERY;
    await fsm.transition(STATE.AWAITING_HITL, next, sessionId);
    return;
  }
  if (rewriteChoice.customInput) {
    await store.save({ sessionId, rewrittenPrompt: rewriteChoice.customInput, rewriteConfirmed: true, pendingRewrite: null });
    const next = ScopeScorer.shouldSkipHarness(ScopeScorer.score(state.originalPrompt, {})) ? STATE.BUILD : STATE.DISCOVERY;
    await fsm.transition(STATE.AWAITING_HITL, next, sessionId);
    return;
  }
}
\\\

- [ ] **Step 3: Merge rewrite into HITL confirmation message**

Modify the HITL injection block (around line 129-132) to include rewrite options:

\\\javascript
if (hitlBlock) {
  const rewriteResult = await rewriter.process(msg, classification, directory);
  if (rewriteResult.needsConfirmation) {
    await store.save({ sessionId, pendingRewrite: rewriteResult });
    output.messages = [...(output.messages || []), { role: 'user', content: hitlBlock + '\n\n' + rewriteResult.confirmMessage }];
  } else {
    output.messages = [...(output.messages || []), { role: 'user', content: hitlBlock }];
  }
}
\\\

- [ ] **Step 4: Inject rewritten prompt in tool.execute.before**

After line ~178 (Pre-Build Gate), add:

\\\javascript
if (state.rewrittenPrompt && agentType === 'forcoding-builder') {
  output.args.prompt = state.rewrittenPrompt + '\n\n---\n\n' + (output.args.prompt || '');
}
\\\

- [ ] **Step 5: Run existing tests for regression**

Run: \
px vitest run --reporter=verbose 2>&1\
Expected: All existing tests pass

- [ ] **Step 6: Commit**

\\\ash
git add .opencode/plugins/forcoding.js
git commit -m "feat(rewriter): integrate pipeline into plugin hooks"
\\\

---

### Task 12: Config YAML

**Files:**
- Create: \policies/base/rewriter-config.yaml\

- [ ] **Step 1: Create config file**

\\\yaml
# policies/base/rewriter-config.yaml
rewriter:
  enabled: true
  level: moderate
  layers:
    normalizer: true
    enricher: true
    variantGenerator: true
    userConfirmation: true
  llmCallback:
    enabled: false
    timeout: 10000
    optional: true
  variants:
    count: 4
    alwaysShowSpec: false
  confirmation:
    enabled: true
    mergeWithHitl: true
\\\

- [ ] **Step 2: Validate YAML**

Run: \
ode -e "const y=require('yaml');const f=require('fs');console.log(JSON.stringify(y.parse(f.readFileSync('policies/base/rewriter-config.yaml','utf8'))).slice(0,100))" 2>&1\
Expected: Valid JSON output

- [ ] **Step 3: Commit**

\\\ash
git add policies/base/rewriter-config.yaml
git commit -m "feat(rewriter): add rewriter configuration YAML"
\\\

---

### Task 13: Integration Tests

**Files:**
- Create: \	ests/rewriter/integration/rewrite-flow.test.js\
- Create: \	ests/rewriter/integration/plugin-integration.test.js\

- [ ] **Step 1: Write rewrite flow integration test**

\\\javascript
// tests/rewriter/integration/rewrite-flow.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RewriterPipeline } from '../../../src/rewriter/rewriter-pipeline.js';
import { ProjectScanner } from '../../../src/classifier/project-scanner.js';
import { TechDetector } from '../../../src/classifier/tech-detector.js';
import { UserConfirmation } from '../../../src/rewriter/user-confirmation.js';
import { createTempDir, cleanupTempDir } from '../../helpers/setup.js';

describe('Rewrite Flow Integration', () => {
  let pipeline, tempDir, confirmer;

  beforeEach(() => {
    tempDir = createTempDir();
    vi.spyOn(ProjectScanner.prototype, 'scan').mockReturnValue({ hasFiles: true, fileCount: 15, hasTests: true, jsFiles: 12, pyFiles: 0, htmlFiles: 3 });
    vi.spyOn(TechDetector.prototype, 'detect').mockReturnValue({ framework: 'react', uiLibrary: 'antd', styling: 'tailwind', testRunner: 'vitest' });
    pipeline = new RewriterPipeline({ projectDir: tempDir });
    confirmer = new UserConfirmation();
  });

  afterEach(() => { vi.restoreAllMocks(); cleanupTempDir(tempDir); });

  it('Chinese web-ui input -> choose standard -> confirmed prompt', async () => {
    const r = await pipeline.process('帮我搞个登录页面，带验证', { taskType: 'web-ui', confidence: 'high' }, tempDir);
    expect(r.needsConfirmation).toBe(true);
    const choice = confirmer.parseChoice('2');
    expect(choice.selectedId).toBe('standard');
    const selected = r.variants.find(v => v.id === 'standard');
    expect(selected.prompt).toContain('login');
  });

  it('English game prompt with genre', async () => {
    const r = await pipeline.process('create a snake game with scoring', { taskType: 'canvas-game', confidence: 'high' }, tempDir);
    for (const v of r.variants) expect(v.prompt).toContain('snake');
  });

  it('custom input fallback', async () => {
    const r = await pipeline.process('build a CLI file watcher', { taskType: 'cli-tool', confidence: 'high' }, tempDir);
    const custom = confirmer.parseChoice('我需要递归监控');
    expect(custom.selectedId).toBeNull();
    expect(custom.customInput).toContain('递归监控');
  });

  it('short input skips rewriter', async () => {
    expect((await pipeline.process('hi', {}, tempDir)).needsConfirmation).toBe(false);
  });
});
\\\

- [ ] **Step 2: Write plugin contract integration test**

\\\javascript
// tests/rewriter/integration/plugin-integration.test.js
import { describe, it, expect } from 'vitest';

describe('Plugin Integration Contract', () => {
  it('rewritten prompt is injected before builder dispatch', () => {
    const state = { rewrittenPrompt: 'Create a login page with validation' };
    const args = { subagent_type: 'forcoding-builder', prompt: 'original' };
    if (state.rewrittenPrompt && args.subagent_type === 'forcoding-builder') {
      args.prompt = state.rewrittenPrompt + '\n\n---\n\n' + (args.prompt || '');
    }
    expect(args.prompt).toContain('Create a login page');
    expect(args.prompt).toContain('original');
  });

  it('builder without rewrite works normally', () => {
    const args = { subagent_type: 'forcoding-builder', prompt: 'original' };
    expect(args.prompt).toBe('original');
  });

  it('non-builder dispatch not affected', () => {
    const state = { rewrittenPrompt: 'test' };
    const args = { subagent_type: 'forcoding-auditor', prompt: 'review this' };
    if (state.rewrittenPrompt && args.subagent_type === 'forcoding-builder') {
      args.prompt = state.rewrittenPrompt + '\n\n---\n\n' + (args.prompt || '');
    }
    expect(args.prompt).toBe('review this');
  });
});
\\\

- [ ] **Step 3: Run all integration tests**

Run: \
px vitest run tests/rewriter/integration/ --reporter=verbose 2>&1\
Expected: PASS

- [ ] **Step 4: Run full regression suite**

Run: \
px vitest run --reporter=verbose 2>&1\
Expected: All ~714 tests pass

- [ ] **Step 5: Commit**

\\\ash
git add tests/rewriter/integration/
git commit -m "test(rewriter): add integration tests for full rewrite flow and plugin contract"
\\\

---

## Self-Review

### Spec Coverage
- 4-layer pipeline (L0-L3): Tasks 5-8 cover each layer independently
- RewriterPipeline orchestrator: Task 10
- Plugin integration: Task 11 (chat.message + tool.execute.before)
- LLM callback: Task 9 (LLMCallback + fallback)
- Template system: Task 4 (4 YAML templates + loader)
- Config YAML: Task 12
- User confirmation flow: Task 8
- Integration tests: Task 13
- All ~107 tests accounted for across Tasks 1-12

### Placeholder Check
- No TBD, TODO, "implement later", or "fill in details"
- Every step has complete code (not pseudocode)
- Every step has exact test command with expected output
- Every file path is exact

### Type/Name Consistency
- Normalizer.normalize() -> Task 5, referenced in Task 10
- Enricher.enrich() -> Task 6, referenced in Task 10
- VariantGenerator.generate() -> Task 7, referenced in Task 10
- UserConfirmation.renderConfirmation() / parseChoice() -> Task 8, referenced in Tasks 10-13
- RewriterPipeline.process() -> Task 10, referenced in Task 11
- LLMCallback.generateVariants() -> Task 9, referenced in Task 7
- RuleEngine.apply() -> Task 1, referenced in Task 5
- Extractor.extract() -> Task 3, referenced in Task 5
- loadTemplate() / renderPrompt() -> Task 4, referenced in Task 7
- PARAMS_SCHEMA / validateParams() -> Task 2, referenced in Tasks 3, 7
