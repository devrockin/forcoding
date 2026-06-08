---
name: forcoding-gate
description: ⛔ MANDATORY pre-code gate. Count subsystems → determine depth → select flow → commit to delegation. Auto-triggered on: build, create, implement, make, design, UI, page, 做, 实现, 构建, 创建, 界面, 页面, 计时器, 动画. NEVER bypass. If Builder count > 0 → edit/write tools BLOCKED. Two prior incidents (weather card 2026-06-06, focus forest 2026-06-08) caused by skipping this gate.
---
# forcoding-gate — Pre-Flight Gate v3.0

## ⛔ Purpose

This gate has **one job**: prevent the orchestrator from writing code directly.

Two incidents (2026-06-06 weather card NaN bug + 2026-06-08 focus forest 36KB single-hand build) share the same root cause: orchetrator bypassed delegation and wrote code. This gate is the structural fix.

## Execution Rule

**When**: At session start, or whenever the user requests build/create/implement/design/UI/页面/做/构建.

**How**: Before ANY response, execute 4 steps. Do NOT pass Go. Do NOT collect $200.

**Duration**: ≤30 seconds. This is a gate, not a meeting.

---

## Step 1: Count Subsystems

List EVERY independent subsystem. Be honest. Think: "could this be its own class/file?"

```
  [ ] Timer/progress engine (SVG, countdown, state machine)
  [ ] Drag/touch interaction (gesture handling)
  [ ] Particle/animation system (Canvas, requestAnimationFrame)
  [ ] Data persistence (localStorage, IndexedDB, files)
  [ ] UI component (forest grid, cards, modals)
  [ ] Sound/audio (Web Audio)
  [ ] Stats/analytics (calculations, display)
  [ ] History/log (drawer, filtering, sorting)
  [ ] Platform adaptation (safe-area, responsive)
  [ ] Other: _________

  Total subsystems: [N]
```

**Rule**: "one HTML file" ≠ one subsystem. The file is a container, not a subsystem count.

### Step 1.5: Detect Project Type (v3.0)

```
Does the request involve BOTH backend code AND frontend code?
  □ Backend (server, routes, API, models, controllers): [Y/N]
  □ Frontend (HTML, CSS, components, pages, views): [Y/N]

  project_type:
    Both Y → "fullstack"
    Frontend only → "frontend-only"
    Backend only → "backend-only"
    Neither → "other"
```

## Step 2: Determine Depth

```
  Base depth:
    N = 1, no animation, no interaction states → ⚡ quick
    N = 2-3, has interaction states → 📋 standard
    N = 4+, or drag/gesture, or 3+ animation types → 🏗️ deep

  Project type override (v3.0, I4):
    project_type=fullstack → FORCE deep (regardless of N)

  Final depth = max(base_depth, project_type_depth)

  Auto-upgrade:
    - project_type=fullstack → deep (I4)
    - Touch/drag interaction → minimum standard
    - 3+ animation types → minimum standard
    - Platform adaptation (safe-area) → minimum standard
    - Data persistence + UI → minimum standard
    - Auth/payments/PII → deep
```

## Step 3: Select Flow

```
  ⚡ quick    → Intent → Builder → Auditor
  📋 standard → Intent → Discovery(light) → Designer → Builder(s) → Auditor
  🏗️ deep     → Intent → Discovery → Designer → Planner → Builder(s) → Auditor(s) → RSI
```

**Same-File Parallel 规则 (v3.0)**:
```
  同一文件的 N 个子系统 → 可启用 PARALLEL SAME-FILE 模式
  条件:
    □ 子系统之间逻辑独立（无共享可变状态）
    □ 无循环引用
    □ Section Marker Standard 可用（forcoding-core 已包含）
    □ Merge Protocol 可用（forcoding.md 已包含）

  启用后:
    → dispatch N 个 Builder（同文件并行）
    → 每个 Builder 输出 SECTION 标记包裹的内容
    → Orchestrator 执行 Merge Protocol 组装最终文件

  注意:
    - 非 HTML 文件：Builder 使用对应注释语法
    - 合并失败 → 回退 SEQUENTIAL
```

## Step 4: Commit to Delegation

```
  🔴 write/edit tools are PHYSICALLY REMOVED from orchestrator (I1).

  I will delegate to:
    □ Discovery     → [orchestrator — question tool only]
    □ Designer      → [Y/N — forcoding-designer]
    □ Planner       → [Y/N — forcoding-planner]
    □ Builder(s)    → [{count} — forcoding-builder]
    □ Auditor       → [Y/N — forcoding-auditor]

  🔴 If Builder count > 0:
     I MUST dispatch to forcoding-builder via task() tool.
     I CANNOT use write/edit (tools are denied).
     ALL file creation MUST go through Builder agents.

  🔴 Same-File Parallel (Builder count > 1, same target file):
     - Each Builder output MUST use Section Marker format
     - Orchestrator MUST execute Merge Protocol after all complete
     - If Merge Protocol would fail → fall back to SEQUENTIAL
```

## Output Format

After completing 4 steps, output this report:

```
┌────────────────────────────────────────┐
│           PRE-FLIGHT GATE              │
├────────────────────────────────────────┤
│ Subsystems: [N]    Depth: [quick/std/deep] │
│ Flow: [Intent→X→Y→Z]                   │
│ Delegation: D[N] P[N] B[{count}] A[N]  │
│ 🔴 I will write ZERO code.             │
└────────────────────────────────────────┘
```

## Rationalization Shield

If you catch yourself thinking any of these → the gate is working:

| Thought | Reality |
|:--------|:--------|
| "It's just one file" | File count ≠ subsystem count |
| "I'll do it faster myself" | 4 builders in parallel beat you |
| "The spec is clear, I can just build it" | Spec ≠ permission. You delegate. |
| "This doesn't need the full workflow" | Every incident started with this thought |
| "Delegating takes too long" | NaN bugs take longer |

## Incident Reference

| Date | Task | Subsystems | Violation | Result |
|:-----|:-----|:-----------|:----------|:-------|
| 2026-06-06 | Weather card | 4 (particle×4) | Orchestrator wrote code | NaN CSS bugs |
| 2026-06-08 | Focus forest | 8 (timer+particle+forest+data+history+sound+stats+drag) | Gate skipped entirely | 14 quality gaps vs reference |
