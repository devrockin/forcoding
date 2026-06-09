# ForCoding v3.0 → ForCoding_Arch Migration Guide

> **For:** ForCoding contributors  
> **Target:** ForCoding ForCoding v3.0 → ForCoding_Arch.0  
> **Est. effort:** 14.5 person-days  
> **Risk:** Medium (plugin is completely rewritten; agents are slimmed)

---

## Migration Summary

| Component | ForCoding v3.0 | ForCoding_Arch | Action |
|:--|:--|:--|:--|
| Plugin entry | 333 lines, all logic inline | ~80 lines, delegates to src/ | **Rewrite** |
| Orchestrator prompt | 188 lines | ~45 lines | **Slim** |
| Builder prompt | 508 lines | ~280 lines | **Slim** |
| Auditor prompt | 564 lines | ~450 lines | **Slim** |
| Skills (13) | Injected via `skill()` | Reference docs only | **Demote** |
| Policies (5) | Evaluated by plugin | Reference docs only | **Demote** |
| New: src/fsm/ | — | 4 files | **Create** |
| New: src/classifier/ | — | 5 files | **Create** |
| New: src/workflow/ | — | 10 files | **Create** |
| New: src/enforcer/ | — | 7 files | **Create** |
| New: src/hitl/ | — | 3 files | **Create** |
| New: src/observability/ | — | 2 files | **Create** |

---

## Phase 1: Core Infrastructure (6 days)

### M1: State Machine (2 days)

**Create files:**
- `src/fsm/state-machine.js`
- `src/fsm/state-store.js`  
- `src/fsm/transitions.js`
- `src/fsm/errors.js`

**Key decisions:**
- State persistence: `docs/forcoding/state/{sessionId}.json`
- Atomic writes: Write to `.tmp` → rename (prevents corruption)
- Error types: `IllegalTransitionError`, `GateMissingError`, `StateCorruptionError`
- Session isolation: Each `sessionID` gets a separate state file

**Test criteria:**
- [ ] All valid transitions succeed
- [ ] All invalid transitions throw
- [ ] State persists across plugin reloads
- [ ] Crash recovery: load state from disk
- [ ] Gate auto-generation on each transition

### M2: Intent Classifier (2 days)

**Create files:**
- `src/classifier/intent-classifier.js`
- `src/classifier/project-scanner.js`
- `src/classifier/tech-detector.js`
- `src/classifier/density-analyzer.js`
- `src/classifier/subtype-validator.js`

**Key decisions:**
- Regex-based type scoring (no LLM for classification)
- One-shot LLM for subsystem estimation only
- Composable tag system (4 axes: domain, form, framework, lifecycle)
- 10 shortcut presets for common patterns
- Confidence: high/medium/low → affects HITL rendering

**Test criteria:**
- [ ] "make a game" → canvas-game (confidence: high)
- [ ] "build a REST API" → backend-api (confidence: high)
- [ ] "create a React dashboard" → spa-app (confidence: high)
- [ ] "fix the login button" → hotfix (confidence: high)
- [ ] Ambiguous: "make an app" → asks HITL (confidence: low)
- [ ] Existing project: detects framework from files

### M3: Workflow Registry (0.5 day)

**Create files:**
- `src/workflow/registry.js`
- `src/workflow/profiles/frontend.js`
- `src/workflow/profiles/backend.js`
- `src/workflow/profiles/game.js`
- `src/workflow/profiles/cli.js`
- `src/workflow/profiles/data.js`
- `src/workflow/profiles/library.js`
- `src/workflow/profiles/maintenance.js`
- `src/workflow/profiles/devops.js`
- `src/workflow/profiles/setup.js`

**Key decisions:**
- Each profile defines: pre-build checks, post-build checks, required skills, audit passes
- Game profile: NO CSS/typography checks
- CLI profile: NO DESIGN stage for light tasks
- Maintenance profile: Skip DESIGN, skip Discovery for hotfix

**Test criteria:**
- [ ] Correct workflow for each type × weight combination
- [ ] Game checklist ≠ Web UI checklist
- [ ] CLI light skips DESIGN
- [ ] Frontend heavy includes PLAN

### M4: HITL System (1 day)

**Create files:**
- `src/hitl/checkpoint.js`
- `src/hitl/renderer.js`
- `src/hitl/response-parser.js`

**Key decisions:**
- One HITL per session (classification confirmation only)
- Confidence-adaptive rendering (high → simple confirm; low → interactive select)
- Support: "ok", type/depth adjustment, "restart"/"reclassify"
- Must REPLACE original message (not append) to avoid race condition

**Test criteria:**
- [ ] High confidence → renders simple confirm
- [ ] Low confidence → renders interactive selection
- [ ] "ok" / "确认" / "yes" → confirm
- [ ] "type: game" → reclassify
- [ ] "restart" → reset to classifying
- [ ] Unknown response → re-prompt

### M5: Plugin Entry Rewrite (1 day)

**Rewrite:** `.opencode/plugins/forcoding.js`

**Key changes:**
- Remove all inline logic (PolicyEngine, gate system, 7-item Pre-Build Gate)
- Create module instances
- Wire hooks to module methods
- Add supervisor command detection in chat.message hook
- Add prototype state handling
- Add ScopeScorer integration for trivial fix detection

### M5a: Prototype State Support (0.5 day)

**New/Update files:**
- `src/fsm/transitions.js` — add `PROTOTYPE` state + loop/re-entry transitions
- Plugin entry — handle `prototype` state in chat.message and tool.execute hooks
- `agents/forcoding.md` — add prototype mode guidance to orchestrator prompt

### M5b: ScopeScorer Integration (0.5 day)

**Create:** `src/classifier/scope-scorer.js`
**Update:** Plugin entry — call `ScopeScorer.score()` at task start to determine workflow

### M5c: Supervisor Command Support (0.5 day)

**Update files:**
- Plugin entry — add `detectSupervisorOverride()` + `forceTransition()` handling
- `src/fsm/state-machine.js` — add `forceTransition()` method (bypass all checks)
- `src/audit/audit-trail.mjs` — log supervisor overrides

---

## Phase 2: Enforcement (3 days)

### M6: Enforcer Modules (2 days)

**Create files:**
- `src/enforcer/pre-build-gate.js`
- `src/enforcer/phase-lock.js`
- `src/enforcer/tool-allowlist.js`
- `src/enforcer/post-build-validator.js`
- `src/enforcer/truncation-recovery.js`
- `src/enforcer/cycle-detector.js`

**Migration from ForCoding v3.0 plugin inline code:**
- ForCoding v3.0 Pre-Build Gate (7 hard-coded checks) → `pre-build-gate.js` per-tag variable checks
- ForCoding v3.0 Phase Lock (prompt-based) → `phase-lock.js` deterministic check
- ForCoding v3.0 Post-build (nonexistent) → `post-build-validator.js`
- ForCoding v3.0 Truncation (nonexistent) → `truncation-recovery.js`

### M7: Context Budget (0.5 day)

**Create:** `src/enforcer/context-budget.js`

### M8: Observability (0.5 day)

**Create files:**
- `src/observability/metrics.js`
- `src/observability/health-check.js`

---

## Phase 3: Agent Slimming (1.5 days)

### M9: Orchestrator (0.5 day)

**Edit:** `agents/forcoding.md`

**Remove:**
- Phase Lock Rules section (lines 81-98)
- UPSTREAM GATES template (lines 83-90)
- Pre-Flight Gate checklist (lines 100-105)
- Discovery detailed flow (lines 107-110)
- Visual Reference Collection protocol (lines 112-149)
- Acceptance Screenshot Gate (lines 161-188)

**Keep:**
- YAML frontmatter
- Governance summary
- Dispatch priority table
- Context management (ctx_reduce denied)
- Key rules (simplified)
- Add: "Phase progression is enforced by plugin FSM"

**Target: ~45 lines, ~600 tokens**

### M10: Builder (0.5 day)

**Edit:** `agents/forcoding-builder.md`

**Remove:**
- Auto-Inject Manifest handling (~100 lines)
- Phase Gate Verification (~30 lines)
- Visual Reference enforcement (~20 lines)
- Polish Round marking (~40 lines)

**Keep:**
- Role definition
- Tech stack detection
- Build workflow
- Code quality standards
- Flash-specific output formatting

**Target: ~280 lines**

### M11: Auditor (0.5 day)

**Edit:** `agents/forcoding-auditor.md`

**Remove:**
- Gate Chain Verification Pass 0.5

**Add:**
- Pass 1.5: Truncation residual check
- Pass 2.6: Security scan (backend/fullstack only)

**Target: ~450 lines**

---

## Phase 4: Cleanup & Docs (1.5 days)

### M12: Demote Skills (0.5 day)

For each of 13 skill `.md` files, add header:
```markdown
> **ForCoding_Arch STATUS: REFERENCE ONLY.** This skill is no longer injected into LLM context.
> Its logic has been migrated to `src/` Node.js modules. See `ForCoding_Arch/DESIGN.md`.
```

### M13: Demote Policies (0.25 day)

For each of 5 `policies/base/*.yaml`, add header:
```yaml
# ForCoding_Arch STATUS: REFERENCE ONLY. No longer evaluated by plugin.
# Logic migrated to src/fsm/ and src/enforcer/ modules.
```

### M14: Update package.json (0.25 day)

```json
{
  "version": "4.0.0",
  "description": "ForCoding_Arch — Flash-first deterministic harness. FSM-governed plugin for OpenCode.",
  "keywords": [
    "opencode", "opencode-plugin", "coding-agent", "orchestrator", "ai",
    "lightweight coding model "lightweight coding model "flash-optimized",
    "design-thinking", "verimap", "intent-refinement",
    "policy-engine", "governance", "agent-governance", "audit-trail",
    "gate-system", "workflow-automation", "code-generation",
    "harness", "state-machine", "deterministic", "fsm"
  ]
}
```

### M15: Global Sync & Test (0.5 day)

1. Copy all files to `~/.config/opencode/forcoding/`
2. Copy agents and skills to `~/.config/opencode/agents/` and `~/.config/opencode/skills/`
3. Run health-check.js: verify all hooks fire, FSM transitions work
4. Manual test: start OpenCode, enter task, verify HITL confirmation
5. Git tag: `ForCoding_Arch.0`

---

## Rollback Plan

If ForCoding_Arch fails in production:
1. Revert `package.json` version to `3.0.3`
2. Restore `.opencode/plugins/forcoding.js` from ForCoding ForCoding v3.0
3. Restore `agents/forcoding.md` from ForCoding ForCoding v3.0
4. Restore `agents/forcoding-builder.md` from ForCoding ForCoding v3.0
5. Restore `agents/forcoding-auditor.md` from ForCoding ForCoding v3.0
6. New `src/` files can remain (not loaded by ForCoding v3.0 plugin)

---

## Breaking Changes

| Change | Impact | Mitigation |
|:--|:--|:--|
| Skills no longer injected | Orchestrator loses access to skill content in context | Skills' key assertions are embedded in enforcer checks |
| Policies no longer evaluated | No YAML-based policy engine | FSM + enforcer Node.js provide equivalent gates |
| HITL at every task start | +1 user interaction per session | Confidence-adaptive: high confidence = single "ok" |
| State file required | First session creates files in docs/forcoding/state/ | Directory auto-created; no manual setup |
| Agent prompts slimmed | Sub-agents receive shorter, more focused prompts | Lightweight Models perform BETTER with shorter prompts |
