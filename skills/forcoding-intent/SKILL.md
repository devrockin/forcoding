> ⚠️ **REFERENCE ONLY** — ForCoding_Arch v4.0
> This skill is NO LONGER loaded into LLM context. All governance logic
> has been migrated to deterministic Node.js modules in `src/`.
> This file exists for human maintainers only.

---
name: forcoding-intent
description: Use when receiving any user request — lightweight intent refinement that extracts goal, autonomy level, scope hint, and complexity from user's raw expression. Preserves original meaning without over-transforming.
---

# Intent Refinement

Two-step process: first extract structure, then map to classification.

## Step 1: Extraction (Flash model)

Extract **4 fields** from user's raw expression. **Preserve user's original words, don't rewrite**:

```
Input: user's raw expression (complete, unmodified)
Output:
  goal: core objective (1 sentence, prefer user's original words)
  autonomy: self-directed / confirm-per-step / plan-first
  scope_hint: single-file / small-change / feature / refactor / research
  complexity: simple / medium / complex
```

### Autonomy Judgment
- Short affirmative tone ("do", "add", "change") → self-directed
- Question markers ("can you", "how to", uncertainty) → confirm-per-step
- Explicit "plan first", "let's see" → plan-first
- Uncertain → confirm-per-step (safe default)

### Scope Hint Judgment
- Mentions single file/function/variable → single-file
- Mentions bug fix / small addition → small-change
- Mentions new feature/module/API → feature
- Mentions refactor/split/architecture → refactor
- Mentions research/competitor/paper → research
- Uncertain → small-change (safe default)

### Complexity Judgment (prevents "single file = trivial" trap)

**Core principle: Judge by logical complexity, not file count.**

Count "independent subsystems":
- One independent animation/particle system = 1 subsystem
- One independent module/API/component = 1 subsystem
- One data structure/state machine = 1 subsystem

Then map:

| Independent subsystems | Typical scenario | complexity |
|:-----------|:--------|:----------|
| 1 — change one function/variable/naming | Rename, config change, single-line bug fix | **simple** |
| 1 — create single component/function | New button, utility function | **simple** |
| 2-3 — single file or 2-3 files | New form, multi-file fix | **medium** |
| 4+ — single file with multiple systems | **4 weather animations in one file** | **complex** |
| 4+ — multi-file/module | Refactor, new feature module | **complex** |
| Involves database/architecture changes | Migration, tech selection | **complex** |

**Key rules**:
- If scope_hint=single-file but complexity=complex → **use complexity, ignore scope_hint**
- That is: single file with 4+ subsystems → escalate to **complex**, NO "direct implementation" allowed
- Uncertain → take the higher value (safe default)

## Step 2: Classification Mapping

Map refined results to task categories:

| scope_hint + goal signals | Category | Workflow (affected by complexity) |
|:---------------------|:----|:------------------------|
| feature + new/create | build | Standard 4-stage (forced when complex) |
| any + fix/error | fix | Clarify → implement (+plan when complex) |
| any + view/understand | explore | Scan → report |
| any + audit/check | review | Direct review (+plan when complex) |
| refactor + restructure/split | refactor | Standard + safety |
| any + design/beautify | design | **Standard 4-stage (even if scope=single-file, forced when complexity=complex)** |
| research + investigate/competitor | research | Research mode |
| single-file + naming/format + complexity=simple | quick | Direct implement |

**Note**: `quick` type requires **both** scope=single-file AND complexity=simple. Missing either condition = cannot downgrade to direct implement.

## Extraction Notes

- **Don't rewrite user intent**, only extract structured fields
- User uses colloquial/vague terms → goal retains original words, infer specific meaning from context
- User says "also", "while you're at it" → possibly multiple independent tasks, mark as multi
- User incomplete or vague → autonomy=confirm-per-step, ask clarification before classification

## Output Format

Extracted internally (not shown to user):

```
🎯 goal: [core objective]
🤖 autonomy: [self-directed / confirm-per-step / plan-first]
📏 scope: [single-file / small-change / feature / refactor / research]
⚙️  complexity: [simple / medium / complex]
📂 task_type: [build / fix / explore / review / refactor / design / research / quick]
```

Then enter corresponding workflow. Orchestrator uses `complexity` + `task_type` together to determine workflow depth. **`complexity` takes priority over `scope_hint`**: even if scope_hint=single-file, if complexity=complex, must go full 4-stage.
