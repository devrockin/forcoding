# Lightweight Model Optimization Guide for ForCoding_Arch

> **Target:** lightweight coding model V4 Flash (and similar lightweight models)  
> **Principle:** Every token injected into LLM context must earn its place

---

## 1. Lightweight Model Profile

| Characteristic | Pro Models | lightweight coding model V4 Flash | ForCoding_Arch Strategy |
|:--|:--|:--|:--|
| Context window | 128K+ | ~32K-48K | Budget tracker at 70%/90% |
| Output reliability | High | Occasional truncation | TruncationRecovery auto-detect |
| Rule compliance | ~70% in prompts | ~35% in prompts | FSM enforces 100% |
| Self-review accuracy | ~60% | ~40% (optimistic bias) | Separate Auditor sub-agent |
| Instruction following | Good with prose | Good with checklists | Structured binary gates |
| Complex branching | Handles well | Hallucinates paths | Deterministic routing in FSM |
| Cost | $0.50-1.00/M tokens | ~$0.05/M tokens | Extra rounds are cheap |
| Latency | 2-5s | 0.5-1.5s | Acceptable to add 2-3 extra rounds |

---

## 2. Context Budget Allocation

```
Total Flash Context Window: ~48K tokens
─────────────────────────────────────────
Orchestrator prompt:          600    (1%)
HITL confirmation:            200    (<1%)
Phase transition context:      50    (<1%)
─────────────────────────────────────────
Available for task prompts: ~47K  (98%)
─────────────────────────────────────────
```

**ForCoding v3.0 Comparison:**

```
Total Flash Context Window: ~48K tokens
─────────────────────────────────────────
Orchestrator prompt:        3,000    (6%)
Skill .md files injected:   5,000    (10%)
Auto-Inject Manifest:       1,500    (3%)
Gate file instructions:     1,500    (3%)
─────────────────────────────────────────
Available for task prompts: ~37K    (77%)
─────────────────────────────────────────
```

**Net gain: 10K tokens freed for actual task work (+27%).**

---

## 3. Prompt Engineering for Flash

### 3.1 Golden Rules

1. **Lead with structure, not exposition.** Flash performs better with checklists than paragraphs.
2. **Constraints before creativity.** State "what NOT to do" before "what to do."
3. **Binary gates over nuanced judgment.** "Check A? Yes/No" better than "Evaluate A on a scale of 1-5."
4. **Single responsibility per dispatch.** One builder = one file or one feature.
5. **Include failure modes.** Flash needs to know "if X fails, do Y" explicitly.

### 3.2 Builder Prompt Template (Flash-Optimized)

```
## TASK
[One sentence. Max 50 words.]

## CONSTRAINTS (MUST follow)
- [ ] [Constraint 1]
- [ ] [Constraint 2]
- [ ] [Constraint 3]
  (Max 5-7 constraints, binary yes/no format)

## VISUAL REFERENCES (if UI)
- [URL 1]: [2-3 specific observations, not paragraphs]
- [URL 2]: [2-3 specific observations]

## OUTPUT FORMAT
- File: [path]
- Language: [html/css/js/python/etc]
- Max lines: [estimate]

## IF FAILURE
- If output is too long: split into 2 parts, label "Part 1/2"
- If unsure about requirement: ask, don't guess
- If API/syntax unknown: use most common pattern

## ROUND
ROUND: [1 or 2]
```

### 3.3 Anti-Patterns (Avoid with Flash)

| ❌ Don't | ✅ Do Instead |
|:--|:--|
| "Build a beautiful, responsive, accessible application..." | "Build a single-page app with: [checklist]" |
| "Consider multiple approaches and select the best one" | "Use approach X. If X fails, fallback to Y." |
| "Ensure high code quality and best practices" | "Pass: [syntax check] [naming convention] [error handling]" |
| Paragraphs of design philosophy | Bullet-pointed design tokens |
| "Use modern JavaScript features" | "Use: const/let (not var), arrow functions, template literals" |
| Open-ended creativity | Concrete references with specific attributes to replicate |

---

## 4. Round Economics

### 4.1 When Extra Rounds are Worth It

| Extra Round | Token Cost (Flash) | Dollar Cost | When to Trigger |
|:--|:--|:--|:--|
| Builder retry (truncation) | ~1500 | ~$0.00008 | Auto-triggered by TruncationRecovery |
| Builder→Audit→Builder loop | ~2500 | ~$0.00013 | Auditor finds fixable issues |
| HITL classification confirm | ~200 + 1 UX | ~$0.00001 | Always (once per session) |
| RSI screenshot review | ~500 | ~$0.00003 | UI tasks only |

**Total worst-case overhead: ~4700 tokens ≈ $0.00025**

### 4.2 Round Limit Table

| Loop | Max Rounds | Rationale |
|:--|:--|:--|
| Classification re-prompt | 2 | If user can't confirm in 2 tries, something is wrong |
| Truncation recovery | 2 | If output truncates 3x, model context is too full |
| Build→Audit→Build | 3 | After 3 cycles, issue is likely fundamental |
| HITL timeout (no response) | 1 reminder | User might be away |

---

## 5. Progressive Disclosure Strategy

### 5.1 What Gets Disclosed When

| Phase | Injected Context | Tokens | Purpose |
|:--|:--|:--|:--|
| **Classification** | Full HITL confirmation | ~200 | User confirms task type |
| **Discovery** | Classification summary only | ~100 | Orchestrator knows task type |
| **Design** | Classification + upstream gates | ~150 | Designer knows constraints |
| **Build** | Classification + design summary | ~250 | Builder knows what to build |
| **Audit** | Classification + build metadata | ~200 | Auditor knows what to review |
| **RSI** | Classification + all gates | ~300 | Final verification |
| **Blocked dispatch** | Rejection reason + remediation | ~150 | Orchestrator knows how to fix |
| **Budget > 90%** | Compaction cue | ~100 | Prevent context degradation |

**Average per-phase injection: ~180 tokens. ForCoding v3.0 average: ~3000 tokens.**

### 5.2 Context Never Injected (Removed)

- Full policy rule texts (YAML files)
- Skill .md files (13 files, 5000+ total tokens)
- Gate verification procedures
- Auto-Inject Manifest sections
- Phase lock rule descriptions
- Accepted "Key Rules" reference (moved to plugin)

---

## 6. Flash-Specific Error Patterns

| Pattern | Detection | Recovery |
|:--|:--|:--|
| **Truncation** (output cut mid-sentence) | Bracket balance < 0, no closing `</html>` | TruncationRecovery auto-retry |
| **Hallucinated exceptions** (model fabricates rule exceptions) | Can't happen in ForCoding_Arch — FSM is deterministic, no exceptions | N/A (mechanically prevented) |
| **Omitted sections** (model skips requested output sections) | PostBuildValidator checks required elements | Per-tag checklists detect omissions |
| **Oversimplification** (model chooses simplest path when ambiguous) | Pre-Build Gate forces specificity | Checklist requires concrete values, not "use best practice" |
| **Repetition** (model repeats itself in long outputs) | PostBuildValidator line count estimate | ContextBudgetManager suggests compaction |
| **Forgetfulness** (later turns lose earlier context) | ContextBudgetManager tracks usage | Compaction cue at 70%, hard stop at 90% |

---

## 7. Lightweight Model Calibration Baseline

These are empirically observed tendencies of lightweight coding model V4 Flash (not formal benchmarks, but consistent patterns across ForCoding sessions):

| Task | Flash Accuracy | Mitigation |
|:--|:--|:--|
| HTML structure | ~90% | Post-build HTML closure check |
| CSS layout | ~85% | Per-tag checklist verifies key properties |
| JavaScript logic | ~75% | Auditor Pass 2 catches logic errors |
| Canvas/game code | ~70% | Game-specific post-build checks (canvas + rAF) |
| Following 10+ constraints | ~60% (attention dilution) | Max 5-7 constraints per dispatch |
| Self-review | ~40% (biased high) | Separate Auditor (unbiased) |
| Long output (>500 lines) | ~65% (truncation risk) | TruncationRecovery + output length guidance |
| Multi-step planning | ~50% | Planner sub-agent (dedicated reasoning pass) |

---

## 8. Decision Flow for Flash-Aware Dispatch

```
Should I dispatch Builder now?
│
├─ State = build or build_recovery?
│  ├─ Yes → Check Pre-Build Gate
│  │  ├─ Pass → Dispatch. Include:
│  │  │  • Classification summary (1 line)
│  │  │  • Phase context (1 line)
│  │  │  • Constraints (5-7 bullet points, binary format)
│  │  │  • Output format spec
│  │  │  • Round declaration
│  │  └─ Fail → Inject rejection context. WAIT for orchestrator fix.
│  └─ No → Block with phase-lock error + remediation
│
├─ Context > 90%?
│  └─ Yes → Block with compaction required message
│
└─ Budget remaining > 5000 tokens?
   └─ No → Warn: "Low context remaining. Consider compaction."
```

---

## Summary

ForCoding_Arch's Flash-first design achieves **95% token savings** on governance overhead (11,300 → 600 tokens) by moving all policy enforcement into deterministic Node.js code. The trade-off is acceptable: ~3 extra rounds per session at a cost of ~$0.00025, in exchange for mechanically guaranteed workflow compliance and 100% gate file generation.
