---
name: forcoding-core
description: Master orchestrator skill (v3.0). Policy-enforced by plugin engine. Design thinking double-diamond workflow, Pre-Flight Gate, intent refinement, constraint-driven insight, VERIMAP VFs, Green/Red zone classification, gate metrics, RSI reality check, capability scan, delegation mandate. Rules enforced by policies/base/*.yaml — NOT by prompt compliance.
---

# ForCoding Core v3.0 — Design Thinking Workflow

## Design Thinking Phases

ForCoding follows the Double Diamond model adapted for code generation:

```
Discovery         →  Definition      →  Development             →  Delivery
(Empathize)          (Define)           (Ideate → Prototype)       (Test)
    │                    │                    │                        │
  Insight           Discovery (v3.0)  Define → Explore → Plan    Prototype → Build → Verify
```

| Phase | ForCoding Stage | Design Thinking | Key Method |
|:------|:---------------|:----------------|:-----------|
| Insight | Intent Refinement | Empathize — understand the real need | Constraint-driven: "constraint + direction = creativity" |
| Discovery | Discovery 阶段 (v3.0) | Define — define the right problem | 三级分流: FAST-TRACK/STANDARD/FULL + USER_GATE |
| Define | Designer spec | Define — scope, Given/When/Then | Spike: decompose → research → build → verdict |
| Explore | Designer spec | Ideate — multiple approaches, tradeoffs | Creative-ideation: pick constraint, generate 3 approaches |
| Plan | Planner | Plan — bite-sized task decomposition | 2-5 min/task, DRY/YAGNI/TDD, exact paths |
| Prototype | Builder (first pass) | Prototype — build disposable, validate core | Spike loop: iterate on findings |
| Build | Builder (implementation) | Build — production-quality code | TDD cycle, LSP-assisted navigation |
| Verify | Auditor | Test | Pass 0 (流程合规) → Pass 1-4 → VALIDATED |

## Skill Priority

1. **Gate skills** — forcoding-gate（Pre-Flight Gate 强制门禁，必须最先加载）
2. **Process skills** — insight（约束驱动洞察）, systematic-debugging
3. **Quality skills** — forcoding-edit-quality, test-driven-development
4. **UX skills** — ux-flow, uxui-principles, design-taste-frontend, ui-ux-pro-max, forcoding-ui-checklist, accessibility-a11y（对前端任务自动注入）
5. **Flash engine** — forcoding-flash-engine（auto-embedded, never manually loaded）
6. **Domain skills** — api-design-principles, architecture-patterns
7. **Implementation skills** — react-patterns, python-backend

## Self-Check Table

| Item | Required | Description |
|:------|:---:|:----|
| **Gate loaded?** | ✅ | forcoding-gate skill loaded before ANY response to build/design tasks |
| Intent refined? | ✅ | Goal/autonomy/scope/complexity extracted before any response |
| UX-relevant? | ⚠️ | design/build task → Designer MUST include user journey + interaction states |
| Design taste? | ⚠️ | Frontend task → MUST load design-taste-frontend + check 20+ rules |
| Model mode confirmed? | ✅ | Flash never uses Non-Think |
| Skills loaded? | ✅ | Even 1% chance → load |
| Complexity correct? | ✅ | Count subsystems, not files |
| UI task special flow? | ⚠️ | UI/build tasks → MUST follow enhanced UI workflow (see UX Injection) |
| Visual concept defined? | ⚠️ | UI tasks → MUST define visual concept (style/colors/feeling) before dispatching builder |
| Design system seeded? | ⚠️ | UI tasks → Recommend running ui-ux-pro-max search.py --design-system for data-backed design |
| Delight floor met? | ⚠️ | UI tasks → MUST include ≥ 2 delight elements (haptic/badge/ring/export/shine etc.) |
| Code budget balanced? | ⚠️ | UI tasks → Ensure visual + delight code ≥ functional code in priority |
| Delegated? | ✅ | Orchestrator writes NO code |
| Sub-agent count? | ⚠️ | 1 subsystem = 1 builder; 4+ = parallel |
| Prompt quality gate? | ✅ | Pre-dispatch 7-item self-check passed (改进2) |
| Polish round scheduled? | ⚠️ | UI tasks → Round 2 polish planned (改进3) |
| Auto-inject manifest? | ✅ | Skill knowledge injected to Builder prompt (改进4) |
| Auto-inject manifest EXECUTED? | ⚠️ | Auditor verifies ≥ 70% manifest items were actually executed (v3.0) |
| Visual Lead Protocol? | ⚠️ | UI tasks → CSS/HTML by SINGLE builder (v3.0 新增) |
| Visual lead identified? | ⚠️ | UI tasks → One Builder designated as Visual Lead in prompt (v3.0) |
| Polish round mandatory? | ✅ | UI tasks → Round 2 is NOT optional, is STRUCTURAL (v3.0 强制执行) |
| Priority triage done? | ⚠️ | UI tasks → P0/P1/P2/P3 grading (改进10+13) |
| Delight elements chosen? | ⚠️ | UI tasks → ≥2 elements explicitly selected (改进14) |
| Visual review criteria injected? | ⚠️ | UI tasks → forcoding-visual-review 26 criteria in prompt (v3.0) |
| Context Drop Protection? | ⚠️ | Manifest extracted BEFORE ctx_reduce of skill content (v3.0 新增) |
| Reference analysis done? | ⚠️ | standard+ UI tasks → Reference analysis injected to Builder (改进6) |
| **Registration integrity?** | ⚠️ | All subagent .md files synced to BOTH ~/.config/opencode/forcoding/agents/ AND ~/.config/opencode/agents/ (v3.0 新增 — 2026-06-08 P0事故: forcoding-designer 因缺失全局 agents 注册不可dispatch) |
| **Discovery phase done?** | ✅ | standard+ tasks → discovery.md exists + USER_GATE passed (v3.0 I3) |
| **Fullstack API contract?** | ⚠️ | project_type=fullstack → Designer spec includes API Contract section (v3.0 I9) |
| **Gate files created?** | ⚠️ | each completed stage → .approved file created via task(general) (v3.0 I11) |
| **Workflow template?** | ✅ | reference docs/forcoding/workflows/template.yaml (v3.0 I12) |

## UI Task Quality Definition (改进9: 与工程任务分离)

UI 任务使用独立的质量定义，与工程任务并行评估：

```
工程任务质量 = 功能完整 + 正确性 + 健壮性 + 可维护性
UI 任务质量   = 视觉冲击 + 一致性 + 情感化 + 克制
```

### UI 质量维度

| 维度 | 含义 | 检查方法 |
|:----|:----|:--------|
| **视觉冲击** | 用户第一眼被什么吸引？ | 3 秒测试：打开页面，用户的第一句评价是？ |
| **一致性** | 所有元素是否共享同一个设计语言？ | 检查颜色/圆角/字体/间距是否统一 |
| **情感化** | 有没有让用户开心的时刻？ | ≥ 2 个惊喜元素（触感/动画/徽章/分享等） |
| **克制** | 每个功能值得它的复杂度吗？ | 精简审核：每个功能问"砍掉会有人抱怨吗？" |

### 优先级分配原则（UI 任务专用）

AI 生成没有代码量瓶颈。所有用户需求都保留，只按优先级分配精力：

```
P0 功能: 必须完美 — 视觉冲击 + 动画流畅 + 交互完整  → 40% 精力
P1 功能: 干净实现 — 功能正确 + 状态完整 + 代码规范  → 35% 精力
P2 功能: 功能正确 — 正常工作 + 不报错               → 25% 精力
```

### 工程设计原则

```
最大化可见质量 × 最小化无效复杂度
每行代码都应该被用户看到或感受到
如果某功能在 AI 生成中不增加额外成本 → 全保留
```

## Self-Warnings

| You're thinking | Truth |
|:------|:----|
| "This is just a small issue" | Small issues are tasks. Check skills. |
| "It's just one file" | File count ≠ complexity. Count subsystems. |
| "I'll do it faster myself" | 4 builders in parallel > you. You write ZERO code. |
| "I remember that skill" | Skills evolve. Load current. |
| "Delegating is too much trouble" | NaN bugs cost more. The 2026-06-06 weather card + 2026-06-08 dream journal incidents prove this. |
| "The user gave very detailed requirements, so I can skip Designer" | **User's detalied spec = input, not permission to skip delegation.** Orchestrator still delegates. User gave you the spec; now give it to Designer/Planner/Builder. |
| "It's just one HTML file, I'll write it directly" | **Dream Travel Journal incident (2026-06-08)**: 58KB, 1939 lines, 5 particle systems, drag-drop, weather system, data persistence, 8+ subsystems. Was delegated as "one builder" when it needed 4+ builders + designer + auditor. |
| "UX doesn't matter for this task" | Every UI task = user experience. No UI should be treated as "just technical." |
| "Design taste is overkill" | AI slop (centered heroes, purple gradients, no states) = UX failure. Check it. |
| "This is just a feature request" | Start with Insight: understand the constraints first. Constraint + direction = creativity. |
| "Requirements are clear enough" | Use Given/When/Then acceptance criteria. Vague = bugs downstream. |
| "The builder will make it look good" | No — your prompt controls quality. Be explicit about every delight element. |
| "Mint green feels right" | Run ui-ux-pro-max data first. Your gut may miss better combos. |
| "Function first, beauty later" | Beauty IS function for UI. Allocate code budget upfront. |
| "Safe areas matter more than animations" | Both matter. But user sees animation, not safe-area. Prioritize visible quality. |
| "This is just a simple CRUD page" | Every UI has emotional impact. Add ≥ 2 delight elements. |
| "I already loaded the skill, that's good enough" | Loading ≠ executing. You must delegate to Builder who executes the skill steps. Orchestrator does not execute skills directly. |
| "The subsystems are in one file so one builder can do them all" | Wrong. One Builder prompt cannot effectively produce 8 subsystems. Delegate each subsystem to a separate Builder, even if they write to the same file. Orchestrator merges the results. |

## Insight-First Methodology

Before diving into code, always ask:

### Insight Questions (Constrain-Driven)
1. **Who** is the user? What's their context?
2. **What constraint** defines this problem? (time, resource, platform, legacy)
3. **What's the core value** — if this had one feature, what would it be?
4. **What's the acceptance criteria** in Given/When/Then format?

### Given/When/Then Acceptance Template
```
Given [precondition / context]
When  [action / event]
Then  [observable outcome]

Example:
Given a logged-out user on the homepage
When  they click "Sign Up"
Then  they must see a registration form with email + password fields
And   the form must validate email format client-side
```

Designer MUST embed Given/When/Then for each feature point. Auditor MUST verify against them.

## Instruction Priority

1. **User instructions** (AGENTS.md, direct) — highest
2. **ForCoding skills** — override defaults
3. **System defaults** — lowest

---

## Intent Refinement

Extract 4 fields from user's raw expression. **Preserve original words**:

```
goal:       core objective (1 sentence, user's words preferred)
autonomy:   self-directed / confirm-per-step / plan-first
scope:      single-file / small-change / feature / refactor / research
complexity: simple / medium / complex
```

### Autonomy Judgment
- Short confident tone ("do", "add", "change") → self-directed
- Question tone ("can you", "how to") → confirm-per-step
- "plan first", "let's see" → plan-first
- Uncertain → confirm-per-step

### Complexity Judgment

Count independent subsystems (NOT files):

| Subsystems | Complexity | Workflow |
|:-----------|:------|:----------|
| 1 — single function/variable | simple | quick |
| 1 — single component | simple | quick |
| 2-3 — single or 2-3 files | medium | standard |
| 4+ — single file with multiple systems | complex | deep |
| 4+ — multi-file/module | complex | deep |
| Database/architecture changes | complex | deep |

Key rules:
- scope=single-file but complexity=complex → use complexity, escalate to **deep**
- Uncertain → take higher value
- UI task with drag/gesture interaction → auto-upgrade to at least **standard**
- UI task with 3+ animation types → auto-upgrade to at least **standard**
- UI task with platform adaptation (safe-area, touch) → auto-upgrade to at least **standard**

### Task Classification

| Signals | Category | Default Workflow |
|:--------|:----|:--------|
| new/create/implement | build | standard (deep if complex) |
| fix/error/not working | fix | standard |
| view/understand/analyze | explore | quick (scan → report) |
| audit/check | review | standard |
| restructure/split | refactor | standard + safety |
| design/beautify/UI | design | standard (deep if complex) |
| research | research | research mode |
| single-file + naming + simple | quick | quick (direct) |

quick requires **both** scope=single-file AND complexity=simple. Missing either → cannot downgrade.

---

## Workflow Depth (3 Levels)

| Depth | Condition | Flow |
|:------|:---------|:-----|
| **quick** | 1 subsystem, single file | Intent → Builder → Auditor |
| **standard** | 2-3 subsystems or 2-3 files | Intent → Designer(light) → Builder(s) → Auditor |
| **deep** | 4+ subsystems or cross-module/security | Intent → Designer(spec) → Planner → Builder(s) → Auditor(s) → Security |

### quick
- Requires: 1 subsystem AND single file AND complexity=simple AND no interaction states
- If scope_hint=single-file but complexity=complex → NOT quick (see intent rules)
- If any interaction state (loading/empty/error/animation) → NOT quick
- If requires touch/gesture/platform adaptation → NOT quick
- No documents, no questions
- Dispatch builder, then auditor
- **Self-check**: "Is there really only ONE thing happening here? No UI state? No animations?"

### standard
- 0-1 clarifying questions max
- Designer writes lightweight specification
- Builder(s) execute per spec
- Auditor reviews per task

### deep
- Designer writes full specification to `docs/forcoding/designs/YYYY-MM-DD-topic.md`
- Planner writes implementation plan to `docs/forcoding/plans/YYYY-MM-DD-topic.md`
- Builders execute in parallel where possible
- Auditor per task + final security review

**All artifacts go to `docs/forcoding/`. Never `docs/superpowers/`.**

---

## Flash-Only Model Routing

All stages use `opencode-go/deepseek-v4-flash`:

| Stage | Reasoning Mode | When |
|:------|:-------|:------|
| Intent | Think Max | Always |
| Designer | Think Max | Standard/deep |
| Planner | Think Max | Deep only |
| Builder (S/M/L) | Think Max | All Builder tasks |
| Auditor | Think Max | Always |
| Security review | Think Max | Deep only |

NEVER: Flash with Non-Think mode. NEVER: Pro model.

---

## Flash Prompt Internalization

Orchestrator writes sub-agent prompts with built-in flash optimization. No separate skill loading needed:

- Pre/post conditions stated upfront
- I/O format specified
- Algorithm steps outlined
- Exception handling enumerated
- Assertive language ("must", "must not")
- Examples provided
- Non-goals listed

---

## Auto-Inject Manifest Protocol (改进4: 技能上下文注入)

**问题**: 编排器加载 skill 后，70% 的知识在写 prompt 时丢失，Builder 看不到 skill 内容。

**方案**: 编排器读 skill → 提取 Auto-Inject Manifest → 粘贴到 Builder prompt 顶部

### ⛔ Context Drop Protection（v3.0 + v3.0 增强 — 防止 ctx_reduce 摧毁技能知识）

**致命漏洞**: 本次事故中，编排器在 §14 调用了 `ctx_reduce drop 4-10`，删除了所有已加载技能的内容（design-taste-frontend, forcoding-ui-checklist 等）。后续 dispatch Builder 时，技能知识已不在上下文中，Auto-Inject Manifest 无从提取。

**强制规则**:

```
ctx_reduce 操作约束:
  1. 🔴 在 dispatch Builder 之前，NEVER drop 技能内容（标记为 § 的 skill output）
  2. 🔴 如果必须压缩上下文：
      先把各技能的 Auto-Inject Manifest 提取出来并写入 prompt 草稿
      确认 Manifest 已安全保存后，才可以 drop 技能内容
  3. ✅ 安全的 drop 时机：所有 Builder prompt 已发出之后

v3.0 扩展（阶段级上下文保护）:
  4. 🔴 Stage 2-4（Designer/Plan/Build）：完全禁止 ctx_reduce
  5. 🔴 技术栈检测后禁止 ctx_reduce（Builder 需要 Tech Stack Profile）
  6. ✅ 仅允许 ctx_reduce 在：
     - Stage 0（Pre-Flight Gate 报告后）
     - Stage 1（Insight + 技术栈检测完成后）
     - Stage 5（RSI，全部 Builder 完成后）

检查方法:
  在执行 ctx_reduce 前，问自己：
  □ "当前处于哪个 Stage？（Stage 2-4 → 不能 drop）"
  □ "Builder 是否已收到 Tech Stack Profile？"
  □ "Builder prompt 中是否已包含所有 Manifest？"
  如果任一为"否"→ 不能 drop
```

**添加入 Pre-Builder Gate**:

```
□ Context Drop Protection:
  — 所有技能内容仍在上下文中？或已提取 Manifest 并注入 prompt？
  — 没有在 dispatch 前 drop 技能内容？
```

### Manifest 提取规则

| Skill 类型 | 提取内容 | 注入位置 |
|:----------|:--------|:--------|
| design-taste-frontend | 颜色规则 + 字体 + 反模式 | Builder prompt「质量要求」章节 |
| uxui-principles | 交互状态 + 无障碍基线 | Builder prompt「交互要求」章节 |
| forcoding-ui-checklist | CSS 变量 + 安全区域 + 触摸反馈 | Builder prompt「移动端适配」章节 |
| accessibility-a11y | 键盘导航 + ARIA + 对比度 | Builder prompt「无障碍」章节 |

### Manifest 格式（断言式清单，使用 must/must not）

```
## Auto-Inject Manifest from {skill-name}
### 必须遵守
1. [具体规则] — [原因]
2. [具体规则] — [原因]
...
### 必须避免
1. [反模式] — [原因]
2. [反模式] — [原因]
```

**关键原则**：
- Manifest 必须是**断言式清单**（must/must not），不是描述性文字
- Builder 不需要"考虑"或"建议"——而是"必须"和"禁止"
- 编排器在 dispatch 前完成提取和注入
- 同一 task 加载多个 skill → manifest 合并去重后注入

---

## Delegation Mandate

**Orchestrator does NOT write code.** No exceptions, no "trivial" carveout, no "spec is clear" carveout, no "just one file" carveout.

**Concrete examples of violations from ForCoding history:**
- ❌ Weather card (2026-06-06): 4 weather animation systems in one file → orchestrator wrote it directly. Result: NaN bugs, poor quality.
- ❌ Dream Travel Journal (2026-06-08): 58KB, 1939 lines, 8+ subsystems → orchestrator wrote it directly. Result: initialization bugs, no spec, no plan, no audit.
- ✅ Correct flow: the weather card should have been 4 parallel builders + designer spec + auditor.

**Rule**: If your next action is to write code, STOP and ask: "Is there a builder I could delegate this to?" If the answer is yes (it always is), delegate.

| Need | Delegate to |
|:-----|:-----------|
| Explore codebase + write spec | `forcoding-designer` |
| Write implementation plan | `forcoding-planner` |
| Write/modify code | `forcoding-builder` |
| Review code | `forcoding-auditor` |
| Background research | `general` agent |

### Delegation Rules
1. Pass task_type + 2-3 sentence summary + file paths
2. Never pass full conversation
3. Approved deliverables = scope boundary
4. Sub-agent stuck → pause, don't retry blindly

### Parallel Delegation (Same-File Parallelism)

**Same-file parallelism** is allowed BUT with a critical constraint for UI tasks:

```
Allowed: Non-visual subsystems (data logic, API, backend)
    ┌── builder 1 ── Data layer
    └── builder 2 ── API client

FORBIDDEN for UI tasks: Splitting CSS/HTML across multiple builders
    ❌ builder 1 ── Timer CSS
    ❌ builder 2 ── Forest CSS     ← 禁止！视觉碎片化
    ❌ builder 3 ── Drawer CSS
```

### ⛔ Visual Lead Protocol (v3.0 新增 — 结构门禁)

**核心规则**: UI 任务 (task_type = design 或 build-with-UI) 的 **CSS + HTML 结构层必须由单一 Builder 完成**。

#### 为什么

本次事故的根因：4 个 Builder 各写一段 CSS，结果是 4 段风格不统一的 CSS 拼在一起。
设计决策（圆角用 48px 还是 24px？阴影用暖色还是冷色？）分散给 4 个人做，
没有人看到整体。

参考实现证明了：**同一人控制所有 CSS → 视觉一致性**.

#### 允许的并行模式

```
Visual Lead (B0) — 唯一写 CSS+HTML 的 Builder
  ├── 输出: 完整的 index.html（含所有 CSS + HTML 结构 + 基础交互 JS）
  ├── 职责: 定义设计系统（颜色/圆角/阴影/间距/字体）
  │        所有视觉类 CSS 必须由 B0 完成
  │
  ├── Builder 1 — 仅 JS 逻辑
  │    使用 B0 定义的 CSS 类名，不新增 CSS
  │    不修改 HTML 结构
  │
  └── Builder 2 — 仅 JS 逻辑
       使用 B0 定义的 CSS 类名，不新增 CSS
       不修改 HTML 结构
```

#### 判断标准

| 条件 | 走 Visual Lead | 走并行 |
|:----|:--------------|:------|
| 任务包含 UI 界面（HTML/CSS） | ✅ 必须 | ❌ |
| 纯后端/API/数据逻辑 | ❌ | ✅ 随意并行 |
| 纯 JS 功能增强（已有 CSS） | ❌ 但必须确认 Builder 不新增 CSS | ✅ 可并行 |

#### 实施方式

Orchestrator 在 dispatch 前做如下判断：

```
## Visual Lead 检查

□ 本任务是否包含 CSS/HTML？
  → 是 → 走 Visual Lead Protocol: 单一 Builder 完成全部 CSS+HTML
  → 否 → 可以并行

□ Visual Lead Builder 的 prompt 中是否明确包含:
  → "你是 Visual Lead，负责全部 CSS+HTML 结构"
  → "其他 Builder 不会新增 CSS，你将定义完整的设计系统"
```

#### Visual Lead 的交付物

在完成功能实现后，Visual Lead 必须输出一份 **Design Token 文档** 放在文件头部注释：

```css
/* ============================================================
   Design Tokens (由 Visual Lead 定义，其他 Builder 引用)
   ============================================================
   -- 配色 Warm Green: #d4e9d6 / #b8d9b0 / #6f9e5f
   -- 强调色 Amber: #d4932b
   -- 圆角系统: sm:8px / md:16px / lg:24px / xl:48px
   -- 阴影系统: warm brown undertone rgba(60,45,20,0.15)
   -- 动画曲线: cubic-bezier(0.34, 1.56, 0.64, 1) — overshoot spring
   ============================================================ */
```

#### 违反后果

如果 Auditor 发现：
- CSS 分散在多个 Builder 贡献的代码段中
- 多个不统一的圆角/阴影/颜色系统存在于同一文件

→ **INVALIDATED**，退回到单一 Visual Lead 重写全部 CSS。

---

## VERIMAP Verification Functions (VFs)

Every subtask carries its own verification function. Planner generates VFs, Auditor executes them.

- **NL VFs** (Designer): natural language checks for each Given/When/Then
- **Python VFs** (Planner, deep only): executable assertions for well-defined I/O
- **Execution** (Auditor Pass 3): ALL VFs must pass (strict AND)

## Green/Red Zone Classification

| Zone | Criteria | Flow |
|:-----|:---------|:-----|
| 🟢 Green | No auth/PII/payments | Standard Builder→Auditor |
| 🟡 Yellow | User data, basic auth | Auditor 12-item security |
| 🔴 Red | Auth, payments, PII, regulated | Auditor 12-item + Pro escape + human gate at Plan |

## Gate Metrics

| Metric | Target | ForCoding Check |
|:----|:----|:----|
| Gate catch rate | 20-40% | RSI: Auto-verify |
| Escape rate | <5% | Learnings: Auditor misses |
| Rework rate | 15-25% | INVALIDATED count |
| Cross-model delta | <10% | Structured VFs mitigate same-model bias |

---

**Trigger**: task_type = design or build (with UI components), or user mentions "界面"/"页面"/"UI"

### Mandatory UX injection at each stage:

| Stage | UX Requirement |
|:------|:------|
| Designer | Spec MUST include: user journey (ux-flow), screen inventory, interaction states (loading/empty/error/active) |
| Designer | For design tasks: MUST load `design-taste-frontend` + `uxui-principles` + `accessibility-a11y` |
| Builder | MUST implement ALL interaction states, not just success state |
| Builder | For frontend tasks: MUST execute `design-taste-frontend` checklist items (anti-center, anti-emoji, anti-purple, typography, color, states) |
| Auditor | MUST check: interaction states completeness + design taste compliance + accessibility baseline |
| Auditor | UX findings use same priority tiers: 🔴 Must Fix / 🟠 Should Fix / 🟡 Could Fix |

### User Journey Injection (standard/deep only)

Designer spec must answer:
1. **Who** uses this? (single user, team, admin, public)
2. **What's their flow?** → screen-by-screen journey or single-screen interaction map
3. **What states exist?** → loading · empty · error · edge case · success
4. **How to recover?** → error recovery path, back navigation, cancellation

### Design Taste Injection (frontend tasks)

Builder must verify against `design-taste-frontend` rules:
- □ Anti-center bias (LAYOUT_VARIANCE > 4 → no centered heroes)
- □ Anti-emoji: **除非用户明确要求 emoji**（用户要求时遵从用户）
- □ Anti-purple-gradient (use Zinc/Slate neutral base)
- □ Typography (Geist/Outfit/Satoshi, not Inter)
- □ Interactive states (loading · empty · error · :active feedback)
- □ Mobile responsive (min-h-[100dvh], grid over flex-math)
- □ No pure black (#000 → Zinc-950)
- □ No 3-column equal card layouts
- □ No generic names ("John Doe" → creative names)

**用户需求 vs 设计规则的优先级**:
1. 用户明确要求 → 覆盖技能规则（如"用 emoji 做树图标"）
2. 技能规则 → 用户未明确时强制执行
3. 矛盾时 → 遵从用户但在 prompt 中注明裁决理由

### Accessibility Baseline
- Keyboard navigation on all interactive elements
- Alt text on all images
- No color-only information
- Semantic HTML (button is button, link is link)

---

## ⛔ Prompt Quality Self-Check Gate (改进2: 发出前自检)

在 dispatch Builder **之前**，编排器必须执行以下自检。
**对 UI 任务的额外检查项用 [UI] 标记，UI 任务必须全部通过才能 dispatch。**

```
□ 功能需求完整？          — 所有用户需求都覆盖了？
□ 移动端适配？            — safe-area / 100dvh / 字体栈含中文?
□ 微交互要求？            — 数字动画/滚动定位/交错效果？
□ 代码质量期望？          — IIFE/数据模型/示例数据？
□ 交互状态完整？          — 空态/加载/错误/成功/活跃？
□ 参考基准提供？          — 有参考模式/代码/描述？
□ Auto-Inject Manifest 已注入？ — 技能知识已嵌入 prompt？

[UI] □ Visual Lead Protocol 遵守？
      — CSS/HTML 由单一 Builder 完成？不是多 Builder 各写一段？
      — 如果是 Visual Lead：prompt 明确写了她的角色职责？
      — 如果是纯 JS Builder：prompt 明确写了"使用 Visual Lead 定义的 CSS 类"？

[UI] □ Polish Round 写死在 prompt 中？
      — prompt 明确包含 Round 1 + Round 2 两轮流程？
      — Round 2 引用 forcoding-visual-review 检查清单？

[UI] □ forcoding-visual-review 标准已注入？
      — prompt 中有 A/B/C/D/E/F/G 共 26 项衡量标准？
      — ≥ 19/26 的通过线已说明？
      — 已确认 safe-area-inset、touch-action、100dvh 等移动端基础？

[UI] □ Visual Concept + Reference Analysis 已注入？
      — 视觉概念定义 (Style/Colors/Typography/Feeling)
      — 参考分析 (用户提供或 websearch 提取的模式)

[PARALLEL SAME-FILE] □ Section Marker 协议已启用？
      — 同文件并行 → 必须：Plan 定义 sections → Builder 输出 SECTION 标记 → Orchestrator Merge
      — 见 Section Marker Standard + Merge Protocol

自检结论：□ 全部通过 → 可发出  □ 有未通过项 → 修改 prompt 后再发
```

**UI 任务如果自检未通过就 dispatch → 编排器违规。**
编排器违规可在下一次 RSI Reality Check 中被发现并记录。

此自检与 Pre-Flight Gate 配合使用：Pre-Flight 决定"走什么流程"，
Prompt Quality Gate 决定"这个 prompt 能不能发出去"。

---

## UI Task Enhanced Workflow (改进12: 三阶段流程)

For UI/design tasks (task_type = design/build with UI), replace the standard workflow with the enhanced 5-phase flow below.

### UI Task Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Intent → [Visual Concept] → Designer → [Edit-Down] → Visual Lead       │
│        → Round 2 (Polish) → Auditor (功能 + 视觉审计)                    │
├──────────────────────────────────────────────────────────────────────────┤
│  Phase 0: Visual Concept    → 定义设计语言作为最高优先级约束               │
│  Phase 1: Designer          → 功能规格 + 交互流程 + 用户旅程 + 视觉指标    │
│  Phase 2: Edit-Down Pass    → 砍功能换视觉预算                            │
│  Phase 3: Visual Lead + JS  → Visual Lead 写全部 CSS+HTML 结构          │
│           Specialists       → JS Specialists 只加逻辑，不写 CSS           │
│  Phase 3b: Polish Round     → 26 项视觉润色，不新增功能                   │
│  Phase 4: Auditor           → 功能审查 + 视觉审计 (≥ 19/26) + 惊喜检查    │
└──────────────────────────────────────────────────────────────────────────┘
```

### 流程切换规则

```
standard 深度 (含 UI):
  Intent → Visual Concept → Designer(light) → Visual Lead (Round 1) 
         → Polish Round (Round 2) → Auditor (含视觉审计)

deep 深度 (4+子系统/跨模块):
  Intent → Visual Concept → Designer(full) → Edit-Down → Visual Lead (Round 1) 
         → Polish Round (Round 2) → Auditor → Security
```

> **🔒 Pre-Builder Gate (v3.0 结构门禁 — 编排器手动执行)**
>
> dispatch Builder 前，编排器必须手动检查以下 10 项。任一缺失 → 修改 prompt 后再发。
>
> ```
> 检查项:
> 1. ❐ Visual Concept 已定义？              — style/colors/typography/feeling/key anchor
> 2. ❐ DESIGN.md tokens 已生成？            — YAML front matter (colors/ typography/ rounded/ spacing)
> 3. ❐ ≥ 2 Delight Elements 已选择？        — 从 delight 清单中明确选取
> 4. ❐ Interaction states 已覆盖？          — loading/empty/error/active/success
> 5. ❐ Priority Triage 已分级？             — P0/P1/P2/P3 存在
> 6. ❐ Auto-Inject Manifest 已注入？        — 从 skill 原文粘贴，非编排器转述
> 7. ❐ Visual Lead Protocol 遵守？          — CSS/HTML 单一 Builder 完成
> 8. ❐ Polish Round 写死在 prompt 中？      — Round 1 + Round 2 流程明确
> 9. ❐ forcoding-visual-review 已引用？     — 22 项标准，≥ 19/26 通过线
> 10.❐ Context Drop Protection 未违反？     — 提取 Manifest 后才可 drop skill 内容
>
> 结论: ❐ 全部通过 → 可 dispatch  ❐ 有未通过项 → 修改 prompt
> ```

---

## 📐 Section Marker Standard (v3.0 — Same-File Parallelism)

### 问题

同文件多子系统并行时，每个 Builder 输出独立的代码块。无标准标记格式 →
编排器无法合并不冲突的内容。导致编排器被迫选择"1个Builder"（违反 NEVER dispatch one when you need N）。

### 标记格式

每个 Builder 的输出包裹在 section markers 中：

```
<!-- SECTION: <name> TYPE:<type> ORDER:<n> -->
... content ...
<!-- END-SECTION: <name> -->
```

| 字段 | 规则 |
|:-----|:-----|
| `name` | 唯一标识符（字母+数字+连字符），不可重复 |
| `type` | `html` / `style` / `script` — 决定合并到最终文件的位置 |
| `order` | 整数排序键（1=最先） |

### 类型映射

| type | 合并位置 |
|:-----|:--------|
| `html` | `<body>` 区域，按 order 拼接 |
| `style` | `<head>` 区域（含 `<style>` 包覆），按 order 拼接 |
| `script` | `</body>` 前区域（含 `<script>` 包覆），按 order 拼接 |

### 规则

1. **每个 Builder 输出必须包裹在 SECTION/END-SECTION 中**
2. name 在同文件内必须唯一
3. 不允许嵌套 section
4. 未包裹的内容（non-section code）→ 按 type=html order=999 处理（落在最后）
5. 非 HTML 文件（.js/.py/.ts）需根据语言注释语法调整标记格式

### 示例

```html
<!-- SECTION: timer-html TYPE:html ORDER:1 -->
<div class="timer-card">...</div>
<!-- END-SECTION: timer-html -->

<!-- SECTION: timer-style TYPE:style ORDER:1 -->
.timer-card { border-radius: 48px; }
<!-- END-SECTION: timer-style -->

<!-- SECTION: timer-script TYPE:script ORDER:1 -->
function initTimer() { ... }
<!-- END-SECTION: timer-script -->
```

---

### Phase 0: Visual Concept (改进11: 视觉概念先行) → DESIGN.md 输出

**位置**: Intent 之后、Designer 之前。**所有 UI 任务必须经过此阶段。**

Orchestrator 必须输出两样东西：

#### 1. 视觉概念定义 (Visual Concept Definition)

```
┌──────────────────────────────────────────────┐
│         VISUAL CONCEPT DEFINITION             │
├──────────────────────────────────────────────┤
│ Style:     [设计风格]                          │
│ Colors:    [主色/辅色/背景/文字，具体 hex 值]   │
│ Typography:[字体栈，含中文回退]                │
│ Feeling:   [情感词]                           │
│ Key anchor:[视觉锚点]                         │
│ Dark mode: [auto/yes/no]                     │
└──────────────────────────────────────────────┘
```

#### 2. UI-UX-Pro-Max Design System Generator (数据驱动 — v3.0)

**运行此脚本替代人工选色/选参**。ui-ux-pro-max v3.0 (88.7k ⭐) 提供 161 条行业推理规则 + 67 种 UI 风格 + 161 套调色板。

```
# 生成完整设计系统（替换人工 Visual Concept 中的 Colors/Style/Type）
python3 ~/.config/opencode/skills/ui-ux-pro-max/scripts/search.py "<项目描述>" --design-system -p "<项目名>"

# 输出示例:
# PATTERN: Hero-Centric + Social Proof
# STYLE: Soft UI Evolution
# COLORS: Primary: #E8B4B8, Secondary: #A8D5BA, CTA: #D4AF37, Background: #FFF5F5
# TYPOGRAPHY: Cormorant Garamond / Montserrat
# KEY EFFECTS: Soft shadows + Smooth transitions (200-300ms)
# AVOID: Bright neon + Harsh animations + AI purple/pink gradients
```

**运行时机**: Phase 0 的第一步。在任何人工决策之前，先用数据驱动生成候选方案:

```
□ 运行 search.py --design-system → 获得推荐的 STYLE + COLORS + TYPOGRAPHY
□ 如果用户有特定偏好 → 用 --design-system 结果作为基础，在此基础上调整
□ 如果用户无偏好 → 直接采用 --design-system 推荐结果
□ 运行 search.py --design-system --persist → 保存到 design-system/MASTER.md
```

#### 3. DESIGN.md YAML 令牌 (必须输出)

视觉概念必须**同时**输出为 DESIGN.md YAML front matter 格式。这是 Google Labs design.md 规范的标准格式，存储项目根目录 `DESIGN.md`：

```yaml
---
version: alpha
name: <ProjectName>
colors:
  primary:     "#<hex>"   — CTA/主要交互
  primary-hover: "#<hex>" — 悬停/按压
  on-primary:  "#<hex>"   — primary 上的文字
  surface:     "#<hex>"   — 页面/卡片背景
  surface-soft:"#<hex>"   — 次要表面
  text-body:   "#<hex>"   — 正文颜色
  text-muted:  "#<hex>"   — 辅助文字
  hairline:    "#<hex>"   — 边框
typography:
  display: { fontFamily: "..., sans-serif", fontSize: 32px, fontWeight: 700, lineHeight: 1.2 }
  body:    { fontFamily: "..., sans-serif", fontSize: 16px, fontWeight: 400, lineHeight: 1.6 }
rounded:
  sm: Xpx
  md: Xpx
  lg: Xpx
spacing:
  sm: Xpx/8px
  md: Xpx/16px
  lg: Xpx/24px
---
```

**DESIGN.md 令牌用途**:
- Builder 以 `{colors.primary}` 引用格式接收令牌
- Auditor 用令牌验证输出一致性
- 如果 CLI 可用，运行 `npx @google/design.md lint DESIGN.md` 做 WCAG 对比度检查

### Design System Seed (改进17: 数据驱动设计 — v3.0 ui-ux-pro-max v3.0 集成)

ui-ux-pro-max v3.0 (88.7k ⭐) 的 Design System Generator 是 Phase 0 的**首选数据源**。161 条推理规则 + 67 种 UI 风格自动生成设计系统：

```
## Step 1: 运行设计系统生成器
python scripts/search.py "<产品类型>" --design-system -p "<项目名>"

输出 (完整设计系统):
  PATTERN:    [推荐布局模式]           — 24 patterns
  STYLE:      [推荐风格 + 关键词]       — 67 styles
  COLORS:     primary / cta / bg / text — 161 行业特定调色板
  TYPOGRAPHY: heading / body 字体组合   — 57 font pairings
  EFFECTS:    [推荐交互效果]
  AVOID:      [行业反模式清单]

## Step 2: 持久化设计系统
python scripts/search.py "<产品类型>" --design-system --persist -p "<项目名>"

创建 design-system/ 结构:
  design-system/
  ├── MASTER.md           ← 全局 Source of Truth
  └── pages/              ← 页面特定覆盖

## Step 3: 编排器策展
□ 风格是否符合用户需求？→ 采纳 / 覆盖 (用户优先于算法)
□ 配色方案是否合适？    → 采纳 / 覆盖
□ 避免清单是否合理？    → 记入 DESIGN.md Do's/Don'ts
□ checklist 是否完整？  → 合并到 Auditor 检查标准

## Step 4: 注入到 DESIGN.md + Builder prompt
□ MASTER.md 内容 → DESIGN.md tokens 基础
□ "AVOID" 清单 → DESIGN.md Do's/Don'ts
□ "CHECKLIST" → forcoding-visual-review 补充项
```

**分层检索模式 (Builder 上下文注入)**:
Builder 启动时按此顺序读取:
1. 先读 `design-system/pages/{current-page}.md` → 页面特定规则
2. 存在 → 覆盖 MASTER.md
3. 不存在 → 用 MASTER.md 独占

### Design System Persistence (改进18: 多页面一致性)

对于多页面/多组件 UI 任务，使用 `--persist` 保存设计系统：

```
## 首次运行 (生成 MASTER.md 全局约束)
python search.py "整体产品" --design-system --persist -p "项目名"

## 每个页面运行 (生成 pages/[page].md 页面特化)
python search.py "首页" --design-system --persist -p "项目名" --page "home"
python search.py "仪表盘" --design-system --persist -p "项目名" --page "dashboard"

## Builder 获取设计系统:
- 读取 design-system/MASTER.md → 全局约束
- 读取 design-system/pages/[page].md → 页面特定覆盖
- 全局约束 + 页面覆盖 = 完整设计系统
```

多页面任务中，Orchestrator 在 Phase 0 运行此步骤并存档设计系统，
后续 Builder 直接读取产物，不需重新查询。

---

### Phase 1: Designer — 功能规格

Designer 按现有流程输出功能规格（见 `forcoding-designer`），包括：
- 功能列表
- Given/When/Then 验收条件
- 用户旅程 + 交互状态
- 设计系统细节

---

### Phase 1.5: Reference Analysis (改进6: 参考基准注入 — v3.0 DESIGN.md 库)

**位置**: Designer 之后、Edit-Down 之前。Orchestrator 或 Designer 执行。

**DESIGN.md 参考库**: VoltAgent/awesome-design-md (88.3k stars) 提供 73 个品牌的 DESIGN.md 文件。按类别索引:

| 项目类型 | 参考品牌 |
|:---------|:--------|
| 开发者工具/暗色 | Stripe, Vercel, Linear, Supabase |
| 极简 SaaS | Linear, Notion, Cal.com |
| 自然/森林/健康 | Starbucks, Airbnb (暖色调+圆角) |
| AI/ML 平台 | Claude, Mistral, Replicate |
| 金融/支付 | Stripe, Mastercard, Revolut, Wise |
| 电商/零售 | Nike, Shopify, Airbnb |
| 消费电子 | Apple, Tesla, SpaceX |
| 游戏/娱乐 | PlayStation, Spotify |
| 终端/CLI | Warp, Ollama, Raycast |
| 企业/SaaS | IBM, NVIDIA, HashiCorp, PostHog |
| 媒体/出版 | WIRED, The Verge, Sanity |
| 汽车 | Ferrari, Tesla, BMW, Bugatti |

**分析流程**:

```
□ 加载 forcoding-design-md-bridge 技能
□ 根据项目风格匹配 2-3 个参考品牌 → 提取 tokens
□ 对比用户提供的参考实现（若有）

## 参考分析输出 (注入 Builder prompt)
## DESIGN.md 参考品牌: [Brand1], [Brand2]

### 提取的关键 tokens
— 配色: primary={color}, surface={color} — [来源品牌]
— 圆角: 层级 (sm/md/lg/pill) — [来源品牌]
— 字体: hierarchy (display/body/label) — [来源品牌]

### 应用到当前项目
— 当前项目的 colors.primary 应学习 [品牌] 的饱和度/亮度策略
— 当前项目的 rounded 层级应参考 [品牌] 的 sm/md/lg 比例
```

**注入位置**: Builder prompt 的「DESIGN.md 参考令牌」章节。

---

### Phase 2: Priority Triage (改进10: 功能分级)

**位置**: Designer 之后、Builder 之前。Orchestrator 执行此步骤。

**核心原则**: AI 开发中功能数量不是质量瓶颈，prompt 详细程度才是。
用户要的功能全部保留，但要给 Builder 明确优先级，让他知道精力分配。

对 Designer 输出的每个功能问：

```
## 功能分级清单

P0 — 必须完美（用户第一眼看到的、核心交互）:
   标准: 视觉冲击力 + 动画流畅 + 交互反馈完整
   精力: 40% 的 Builder 时间

P1 — 功能完整、干净实现:
   标准: 功能正确 + 状态完整 + 代码干净
   精力: 35% 的 Builder 时间

P2 — 功能正确即可:
   标准: 正常工作 + 不报错
   精力: 25% 的 Builder 时间

P3 — 低优先级，有精力再做:
   标准: 基础功能可用
   精力: 剩余时间
```

**分级标准**：
- **P0**：用户每次使用都看到的（首页/总览/核心动画）
- **P1**：用户会主动使用的（添加/编辑/删除/排序）
- **P2**：用户偶尔使用的（设置/导出/辅助功能）
- **P3**：用户不提可能不发现的（角落功能/边缘情况 UI）

### 审核输出

```
## Feature Priority Map
  □ [P0] Feature A — 必须完美: [具体说明什么算"完美"]
  □ [P1] Feature B — 干净实现
  □ [P2] Feature C — 功能正确
  □ [P3] Feature D — 低优先级，有精力再做
  ...
```

---

### ⛔ Phase 3: Visual Lead + Polish Round (v3.0 改 — 视觉主设 + 两轮强制)

**UI 任务（standard+ 深度）的 Builder 阶段有两条强制规则：**

```
┌──────────────────────────────────────────────────────────┐
│  强制规则 1: UI 任务的 Builder 输出必须是两轮              │
│  强制规则 2: CSS/HTML 必须由单一 Visual Lead 完成          │
│                                                          │
│  如果 Builder 的输出只有一轮 → Auditor INVALIDATE          │
│  如果 CSS 分散在多段(多Builder)中 → Auditor INVALIDATE     │
│                                                          │
│  编排器必须在 prompt 中写死 Visual Lead 角色 + 两轮流程    │
│  Builder 没有选择权                                       │
└──────────────────────────────────────────────────────────┘
```

#### Round 1: 功能实现

```
→ 按 prompt 实现所有功能
→ 自验证 ≤ 3 次迭代
→ 输出功能完整的代码
→ 标记 "Round 1 complete"
```

#### Round 2: 视觉润色轮（强制）

```
→ 不新增功能，只做润色
→ 加载 forcoding-visual-review 技能
→ 逐项执行 visual-review 的 A/B/C/D/E/F 全部清单
→ 修复所有 FAIL 项目
→ 标记 "Round 2 complete — visual review passed"

Round 2 必须检查的维度（摘自 forcoding-visual-review）:
  A. 配色系统 (4项): CSS变量覆盖率 ≥ 90%, 调色板一致性, 饱和度, 对比度
  B. 字体系统 (2项): 中文 fallback, 字号层次
  C. 间距布局 (3项): 间距系统周期, 圆角层次, CSS变量覆盖率
  D. 视觉层次 (2项): 阴影一致性, z-index 层级
  E. 动画交互 (3项): 缓动曲线, GPU合成, 惊喜元素计数
  F. 参考对比 (2项): 与参考实现的视觉对等度, 设计语言一致性

如果 Round 2 报告 < 19/26 通过 → 继续修复直到 ≥ 19/26
```

#### Builder 不执行 Polish Round 的后果

```
Auditor visual audit 发现以下任何情况 → INVALIDATED:
  1. 没有 Round 2 输出标记
  2. 有 Round 2 但 visual-review 得分 < 19/26
  3. 发现硬编码颜色/间距/圆角（CSS变量覆盖率 < 90%）
  4. 动画使用 linear easing
  5. 动画使用 top/left/width/height（非 transform/opacity）
```

---

### Delight Floor Requirement (改进14: 惊喜底线)

每个 UI 任务必须包含 ≥ 2 个惊喜元素。Builder prompt 中必须明确选择：

```
## 惊喜元素清单（UI 任务必选 ≥ 2 项）

感官类:
  □ 触感反馈: navigator.vibrate?.() 在关键操作时
  □ 满足动画: 完成后扫光/粒子/涟漪/闪光效果
  □ 过渡惊喜: 页面加载时元素逐次飞入 (stagger)

视觉类:
  □ 进度可视化: 环形图 (conic-gradient) 替代进度条
  □ 深度层次: backdrop-filter 毛玻璃 + 多层阴影
  □ 动态光效: 渐变呼吸/阴影变化/光晕动画

游戏化类:
  □ 成就系统: 徽章/等级/里程碑
  □ 统计洞察: "本月坚持了 80% 的天数"
  □ 连续记录: 日历热力图 / 连续计数

赋能类:
  □ 数据导出: JSON/CSV/分享卡片
  □ 自定义: 名称/主题/颜色选择
  □ 提醒: 每日通知/鼓励语

Builder 选择: [选中的 ≥ 2 项]
```

---

### Inspiration Pattern Library (改进16: 参考模式注入)

**使用时机**: Orchestrator 在 dispatch Builder 前，根据任务类型从以下模式库中选择
2-3 个高价值模式注入 Builder prompt 的「参考模式」章节。

```
## 惊喜模式库 — 按效果排序

### 模式1: 完成扫光动画
   效果: 满足感远超简单 fade/scale
   代码: 伪元素 absolute + translateX 扫过
   适用: todo完成/打卡成功/表单提交

### 模式2: 环形进度图 (conic-gradient)
   效果: 比进度条视觉冲击强 3 倍，同样代码量
   代码: background: conic-gradient(var(--primary) var(--deg), transparent 0)
   适用: 统计概览/目标追踪/仪表盘

### 模式3: 触感振动反馈
   效果: 操作确认感，一行代码的小惊喜
   代码: navigator.vibrate?.(20)
   适用: 关键操作（删除/完成/提交）

### 模式4: 逐次飞入 (Stagger)
   效果: 页面加载时元素错落出现，感觉流畅
   代码: animation-delay: calc(var(--i) * 80ms)
   适用: 列表/卡片网格/功能展示

### 模式5: 毛玻璃深度层
   效果: 背景卡片层次感，高级感
   代码: backdrop-filter: blur(20px) + inset border
   适用: 导航/弹窗/设置面板

### 模式6: 渐变呼吸光效
   效果: 页面"活着"的动态感
   代码: @keyframes呼吸 { 0%,100% { opacity: 0.6 } 50% { opacity: 1 } }
   适用: 状态指示/加载中/待操作元素

### 模式7: 数字跳动动画
   效果: 数值变化时的趣味感
   代码: transform: scale(1.3) 弹跳回 1.0
   适用: 计数器/统计/预算显示

### 模式8: 成就等级徽章
   效果: 游戏化驱动力
   代码: 函数映射 + 圆角 label + 图标
   适用: 用户等级/连续打卡/里程碑
```

**注入规则**:
- 每次选择 2-3 个模式，不要超过 3 个（避免 dilution）
- 模式必须与任务类型匹配（统计任务用环形图，列表任务用 stagger）
- 每个模式附带具体代码示例（减少 Builder 的设计时间）
- 注入到 Builder prompt 的「参考设计模式」章节

---

### Phase 4: Auditor — 功能 + 视觉 + 惊喜 (改进7+15)

Auditor 对 UI 任务执行增强检查（具体见 `forcoding-auditor.md`）：

```
## 用户体验价值层级 (改进15)

Level 5 🏆 好爱    — 用户主动想打开
Level 4 😊 好爽    — 使用中感到快乐  ← TARGET
Level 3 👀 好看    — 视觉上舒适
Level 2 👍 好用    — 交互流畅无阻
Level 1 ✅ 能用    — 功能正常无 bug

Gate: If Level 4 not met → INVALIDATED
Check: "Does at least one thing make the user smile?"
```

---

## NEVER Rules (Enforced)

- 🔴 NEVER write code — write/edit PHYSICALLY REMOVED (I1). Delegate to Builder via task().
- 🔴 NEVER skip Auditor — no "self-review" fallback
- 🔴 NEVER skip Discovery for standard+ tasks — discovery.md mandatory (I3)
- 🔴 NEVER downgrade fullstack — project_type=fullstack FORCE deep (I4)
- 🔴 NEVER skip API Contract for fullstack — Designer output mandatory (I9)
- 🔴 NEVER skip Integration VFs for fullstack — Auditor Pass 2.5 mandatory (I10)
- 🔴 NEVER skip gate file creation — .approved at each stage via task(general) (I11)
- 🔴 NEVER dispatch parallel builders sequentially when they can parallel
- 🔴 NEVER dispatch one builder when you need N (same file ≠ single subsystem)
- 🔴 NEVER use Non-Think mode
- 🔴 NEVER assume "single file = simple" — count subsystems
- 🔴 NEVER use Pro model (except escape hatch)
- 🔴 NEVER write to `docs/superpowers/` paths
- 🔴 NEVER build UI without interaction states (loading/empty/error)
- 🔴 NEVER skip Builder Dispatch Gate — verify Builder count before Build (I6)
- 🔴 NEVER skip RSI Dispatch Verification Part B for standard+ (I2)
- 🔴 NEVER negotiate workflow per-session — reference templates (I12)
- 🔴 NEVER build UI without interaction states (loading/empty/error)
- 🔴 NEVER build UI with < 3 delight elements — must have ≥ 2 chosen, plus visual cohesion
- 🔴 NEVER skip design-taste-frontend checklist for frontend tasks
- 🔴 NEVER define requirements without Given/When/Then acceptance criteria
- 🔴 NEVER assume "constraints are obvious" — constraints ARE the design
- 🔴 NEVER assert without confidence tier — use confirmed/probable/hypothesis
- 🔴 NEVER dispatch a UI builder prompt without first defining the Visual Concept
- 🔴 NEVER ship a UI with 0 delight elements — must have ≥ 2
- 🔴 NEVER let defensive code (safe-area, IIFE, overflow) out-prioritize visual impact in code budget
- 🔴 NEVER rely on orchestrator gut feel for design — run ui-ux-pro-max data first when available
- 🔴 NEVER treat "functional completeness" as sufficient for UI tasks — must pass Level 4 Delightful
- 🔴 NEVER add a feature to UI just because user mentioned it — ask "is this worth the visual budget?"
- 🔴 NEVER skip the Visual Concept phase for UI tasks — must define before Designer
- 🔴 NEVER skip the Edit-Down Pass for deep UI tasks — must audit feature list before Builder
- 🔴 NEVER dispatch a UI Builder without Priority Triage — P0/P1/P2/P3 must be defined (改进10)
- 🔴 NEVER let Builder do only one round for complex UI — must schedule Polish Round
- 🔴 NEVER dispatch UI Builder without Design System Seed (改进17) — run ui-ux-pro-max first for data-driven design
- 🔴 NEVER skip Reference Analysis for standard+ UI tasks — Builder needs a quality anchor (改进6)
- 🔴 NEVER inject more than 3 inspiration patterns — dilution reduces effectiveness (改进16)
- 🔴 NEVER split CSS/HTML across multiple builders for UI tasks — Visual Lead Protocol (v3.0)
- 🔴 NEVER skip Polish Round for standard+ UI tasks — it is MANDATORY, not scheduled
- 🔴 NEVER dispatch a UI Builder without forcoding-visual-review criteria in prompt
- 🔴 NEVER let Auditor skip visual audit dimension for UI tasks — must check ≥ 19/26 criteria (forcoding-visual-review)
- 🔴 NEVER ctx_reduce skill content before extracting and injecting Auto-Inject Manifest into Builder prompts
- 🔴 NEVER ctx_reduce skill content before all Builder prompts have been dispatched
- 🔴 NEVER dispatch UI Builder without DESIGN.md tokens (Phase 0 output) in prompt (v3.0)
- 🔴 NEVER skip DESIGN.md reference library for standard+ UI tasks — Builder needs token-level reference (v3.0)
- 🔴 NEVER pass session history to sub-agents — build fresh, precisely crafted context per agent (v3.0)
- 🔴 NEVER pause between tasks in autonomous mode unless truly BLOCKED — "progress updates" waste user time (v3.0)
- 🔴 NEVER skip Plan Self-Review before output — check spec coverage, placeholders, type consistency (v3.0)
- 🔴 NEVER claim VALIDATED in Auditor without fresh evidence (v3.0)

---

## Self-Audit: RSI Reality Check (Per-Session)

Based on Recursive Self-Improvement analysis. After every task, orchestrator self-checks:

### Part A: Quality Metrics

| Check | Question | Red Flag |
|:------|:---------|:---------|
| **Persistence** | Did the fix/feature actually work? | Bug reopened or user re-reported same issue |
| **Acceleration** | Is the workflow getting faster? | Same task type taking longer than last time |
| **Autonomous verification** | Did Auditor catch ≥80% of issues? | Builder found bugs Auditor should have caught |
| **Breadth** | Does learning transfer across domains? | Same mistake repeated in different task types |
| **Unit economics** | Is cost per task decreasing? | Flash model underperforming, forced to escalate |
| **Bottleneck awareness** | What's the current #1 constraint? | Don't know what's limiting quality or speed |
| **UI delight score** | Do UI tasks reach ≥2 delight elements? | User didn't smile. Auditor found 0 delight. |
| **Visual cohesion** | Does every element share one design language? | Mix of mismatched styles in same page. |
| **Code budget ratio** | Is visual+delight code ≥ functional code in priority? | Most code went to defensive/architecture, not to visible quality. |
| **Registration integrity** | Are all subagents discoverable by OpenCode task tool? | Agent .md in ~/.config/opencode/forcoding/agents/ but NOT in ~/.config/opencode/agents/. |

### Part B: 🔴 Dispatch Verification (v3.0 — MANDATORY for standard+)

After each task on standard+ depth, verify:

```
□ Designer dispatch evidence?
□ Builder dispatch evidence? (count ≥ subsystem count?)
□ Discovery evidence? (discovery.md exists?)
□ Planner dispatch evidence? (deep only)
□ Code ownership traceable to Builder task_id?
□ project_type compliance? (fullstack → deep?)
```

≥1 red flag → escalate to HITL Tier 4 after 3 consecutive violations.

If ≥2 red flags → pause, audit root cause, adjust before next task.

### Part C: HITL Approval Tiers (v3.0, I7)

| Tier | Description | Applies To | Intervention |
|:-----|:-----------|:-----------|:-------------|
| **Tier 1: AUTO** | 低风险自动 | 调度 Builder/Auditor, read/glob/grep, skill 加载, npm install | 无需 |
| **Tier 2: RISK_BASED** | 高风险需审批 | git push --force, 生产部署, 删除关键配置 | ask (confirm/reject) |
| **Tier 3: AUDIT_SAMPLE** | 10% 采样 | Builder 代码输出 | 随机抽查 |
| **Tier 4: TELEMETRY** | 异常触发 | RSI 连续3次红旗, Builder 连续3次失败, Auditor 连续2次 INVALIDATED | escalate (暂停) |
| **Tier 5: ALWAYS** | 始终审批 | 合并 main, 删除生产数据, 修改安全策略 | 不可自动 |

## Capability Scan (Weekly)

Weekly self-assessment of ForCoding's skill/agent inventory:
1. **Panorama scan**: list all 4 skills + 4 agents, check relevance
2. **Overlap detection**: any two skills/agents doing the same thing?
3. **Gap analysis**: what's missing? (new design pattern, new tool support)
4. **ROI ranking**: which improvements would give the highest quality/cost ratio?
5. **⚠️ Registration integrity audit**: verify every `mode: subagent` agent file exists in BOTH `~/.config/opencode/forcoding/agents/` AND `~/.config/opencode/agents/`. File sizes must match. (v3.0 新增 — 2026-06-08 P0 事故后强制)
