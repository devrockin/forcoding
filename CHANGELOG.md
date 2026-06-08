# Changelog

## v3.0.0 (2026-06-08) — Plugin Architecture: Deterministic Policy Engine

### Breaking Changes

- **Architecture rewrite**: Governance rules moved from prompt-embedded NEVER rules (47KB, 66+ rules) to deterministic YAML policy engine (5 files, 31 rules). Plugin enforces rules at infrastructure layer — NEVER rules are no longer "polite requests" to LLMs.
- **Orchestrator agent**: Reduced from 1130 lines (47KB) to 80 lines (3KB). All governance logic extracted to `policies/base/*.yaml`.
- **write/edit PHYSICALLY DENIED**: Orchestrator's write and edit tools blocked at plugin layer (I1). Structural enforcement, not prompt-based. Inspired by Microsoft AGT's "Actions the kernel denies are STRUCTURALLY IMPOSSIBLE."

### Added

- **Policy Engine** (`src/engine/policy-engine.mjs`): Deterministic YAML policy evaluator with PolicyDocument/PolicyRule/PolicyCondition/PolicyEvaluator/PolicyDecision classes. Supports `deny_overrides` conflict resolution, 6 operators (eq/neq/in/contains/matches/gt/lt), priority-based rule ordering.
- **Audit Trail** (`src/audit/audit-trail.mjs`): JSONL audit log with cryptographic hash chaining. Each entry linked to previous via MD5. Includes integrity verification and markdown export.
- **Gate System** (`src/gates/gate-system.mjs`): File-based stage gates (.approved JSON) with MD5 content hashes, previous stage chain links, and composite hash for full custody chain.
- **5 Policy Files** (`policies/base/`):
  - `never-rules.yaml`: I1 (write/edit/bash denial), I4 (fullstack→deep), I2/I6 (dispatch verification), I3 (discovery), I5 (auditor)
  - `stage-gates.yaml`: Stage transition gates with hash verification (discovery→designer→planner→builder)
  - `dispatch-rules.yaml`: Builder count ≥ subsystem count, Visual Lead Protocol for UI
  - `depth-rules.yaml`: Depth classification (quick/standard/deep) + fullstack FORCE deep + auto-upgrade rules
  - `quality-gates.yaml`: GWT coverage, UI Visual Concept + Delight + Interaction States, Polish Round, API Contract, Auditor Pass 0
- **Pre-Builder Gate**: Pattern-matched UI validation blocks Builder dispatch if Visual Concept, ≥2 Delight Elements, or Interaction States missing.
- **Plugin Hook: tool.execute.before**: I1 write/edit structural denial + Pre-Builder Gate + edit reliability (3-level matching).
- **Plugin Hook: tool.execute.after**: Post-edit verification.
- **Plugin Hook: experimental.chat.messages.transform**: Bootstrap injection (carried forward, enhanced with v3.0 architecture summary).

### Changed

- **package.json**: v3.0.0, added `files` field for npm publishing, enhanced keywords, proper repository URL.
- **README.md**: Updated for v3.0 plugin architecture with OpenCode installation methods.
- **Orchestrator agent** (`agents/forcoding.md`): Simplified from 1130 lines to 80 lines. References plugin for enforcement. Pre-Flight Gate retained as checkpoint, not sole enforcement.
- **forcoding-core SKILL.md**: Updated description to v3.0 with policy-engine reference.

### Inspired By

- Microsoft Agent Governance Toolkit (AGT) — Policy Engine design, pre-execution interception, deny_overrides strategy
- NLAH (arXiv:2603.25723) — File-backed state, verifier separation
- SAL (arXiv:2604.22136) — Evidence Chain, content hash verification
- FORGE (arXiv:2602.16708) — Deterministic correctness guarantee via reference monitor pattern
- SARC (arXiv:2605.07728) — Constraints as first-class architectural objects

### Migration from v2.9

- All 13 improvements (I1-I13) from v2.7-v2.9 are now structurally enforced by the Policy Engine rather than prompt-based.
- Agent files are backward compatible (same skill loading, same task dispatch model).
- Gate files (I11) and hash chains (I13) are now managed by the Gate System module.
- HITL tiers (I7) remain documented in agent prompts; `permission.ask` hook planned for v3.1.

---

### Added

- **Stage 1.5: Tech Stack Detection** (orchestrator): 7 步检测流程（前端/状态管理/后端/基础设施/测试/AI·ML/架构模式）。输出 Tech Stack Profile 注入所有子智能体。
- **Builder Tech Stack Adaptive Skills**: 16 项检测信号 → 技能映射表。
- **Planner Tech Stack Adaptive Skills**: 12 项检测信号 → 技能映射表（含 Planning Impact 列）。
- **Designer Tech Stack Adaptive Skills**: 10 项检测信号 → 技能映射表（含 Design Impact 列）。
- **Auditor Tech Stack Adaptive Skills**: 8 项检测信号 → 技能映射表（含 Audit Focus 列）。
- **Drafter Tech Stack Adaptive Skills**: 6 项检测信号 → 技能映射表（含 Spec Impact 列）。
- **Stage Routing Gate**: 编导器根据深度（quick/standard/deep）跳过不必要的阶段。禁止线性执行全部 6 阶段。
- **forcoding-scout**: 添加到权限块 + 编导器提示中，作为可选预探索步骤。

### Fixed

- **Auditor checklist 缺失 3 项**: Mobile (+"no hover-only on mobile")、Design System (+"animation curve consistent")、Delight (+"visual+functional not decorative")。与 Designer 的 23 项完全对齐。
- **16 处 `clean-code` 引用**: 全局 agents 目录下 8 个文件修复为 `code-quality-category-pointer`。同步修复全局 PROMPT-TEMPLATES.md 3 处。
- **全局 agents 目录过期 (🔥 P0)**: `~/.config/opencode/agents/` 中 6 个 forcoding 子智能体文件全部为旧版本（最大差距 16KB→3.2KB）。`forcoding-designer.md` 完全缺失。OpenCode 的 task 工具只能从该目录发现子智能体，导致 Designer 无法被 dispatch。

### Changed

- **同步流程修正**: 全局同步命令 `Copy-Item` 现已扩展，不仅同步 `~/.config/opencode/forcoding/`，也同步 `~/.config/opencode/agents/` 下的 forcoding agent 文件。
- **forcoding-core RSI Reality Check 新增 "Registration Integrity"**: 验证所有子智能体 agent .md 文件是否同时存在于插件目录和全局 agents 目录。
- **forcoding-core Self-Check Table 新增 "Registration integrity"**: 门禁级 check，用于每次同步后的自检。
- **forcoding-core Capability Scan 新增第 5 项**: Registration integrity audit。
- **forcoding.md Post-Sync Validation**: 新增 PowerShell 验证脚本 + 3 条规则。注册完整性是一级门禁，同 Pre-Flight Gate 级别。

### 事故永久记录

2026-06-08 P0 事故: `~/.config/opencode/agents/` 目录中 6 个 forcoding agent .md 全部为旧版本（最大差距 16KB→3.2KB），forcoding-designer.md 完全缺失。根因是验证模型只检查插件目录 `forcoding/` 的文件一致性，从未验证全局 agents 目录 `agents/` 的注册完整性。修复措施：全局同步命令增加 agents 步骤 + RSI Reality Check 增加 Registration Integrity 项 + Self-Check Table 增加 Registration integrity 门禁。
- **Stage 编号歧义**: 新增 Stage Routing Gate 明确 quick 跳 Stage 2-3、standard 跳 Stage 3。

### Changed

- **forcoding.md**: Stage 1.5 技术栈检测节 + ctx_reduce 禁令节 + Stage Routing Gate + Merge Protocol + Parallel Dispatch 更新 + Designer/Planner dispatch 行注入 Tech Stack Profile + scout 权限 + Post-Sync Validation
- **forcoding-builder.md**: 新增 Tech Stack Adaptive Skills 节（16 项）+ Section Output Rule
- **forcoding-planner.md**: 新增 Tech Stack Adaptive Skills 节（12 项）+ Same-File Parallel Planning
- **forcoding-designer.md**: 新增 Tech Stack Adaptive Skills 节（10 项） + 版本 2.6.2→2.6.3
- **forcoding-auditor.md**: 新增 Tech Stack Adaptive Skills 节（8 项） + checklist 补齐 3 项
- **forcoding-drafter.md**: 新增 Tech Stack Adaptive Skills 节（6 项）
- **forcoding-core SKILL.md**: Context Drop Protection 增强（阶段级约束）
- **skills.json**: 版本 2.6.2 → 2.6.3
- **~/.config/opencode/agents/**: 8 个 agent 文件 clean-code → code-quality-category-pointer
- **~/.config/opencode/PROMPT-TEMPLATES.md**: 3 处 clean-code 修复
- **Section Marker Standard** (forcoding-core): 全新信标格式 `<!-- SECTION: name TYPE:type ORDER:n -->`，支持同文件并行时 Builder 输出隔离
- **Merge Protocol** (forcoding.md): 6 步合并流程（收集→分组→排序→验证→组装→输出），含 MERGE FAILED 回退机制
- **Parallel Dispatch Decision** (forcoding.md): 新增 PARALLEL SAME-FILE 分支（`Q2=N` 但子系统独立时启用）
- **Builder Section Output Rule** (forcoding-builder.md): Same-File Parallel 模式下强制使用 SECTION 标记包装
- **Same-File Parallel Planning** (forcoding-planner.md): Plan 可定义同文件并行组 + section name/TYPE/ORDER
- **Same-File Parallel 规则** (forcoding-gate): Step 3 新增条件判断 + Step 4 新增回退机制
- **Prompt Quality Gate** (forcoding-core): 新增 `[PARALLEL SAME-FILE]` 检查项

### 全链路技能矩阵（v2.6.3 最终版）

| Agent | task_type 技能 | tech_stack 技能 | checklist 项 |
|:------|:-------------|:--------------|:------------|
| Designer | 5 task types × N skills | 10 项检测 | 5 区 23 项 |
| Drafter | 7 task types × N skills | 6 项检测 | — |
| Planner | 7 task types × N skills | 12 项检测 | 26 项视觉标准 |
| Builder | 9 task types × N skills | 16 项检测 | 26 项 visual-review |
| Auditor | 8 task types × N skills | 8 项检测 | 5 区 23 项 + 26 项 visual-review |

### Fixed

- **Planner design 技能缺口** (P0): 从 3 技能（design/uxui-principles/accessibility-a11y）扩展到 9 技能，对齐 Designer 和 Builder 的设计能力。新增：brainstorming/design-taste-frontend/popular-web-designs/ux-flow/forcoding-ui-checklist/ui-ux-pro-max。确保 Planner 在分解任务时了解视觉约束、移动端适配、设计系统令牌。
- **Auditor Pre-Delivery Checklist 过时** (P0): 从 9 项旧清单升级到 5 区 23 项清单（Visual 9 + Mobile 4 + DesignSystem 5 + Delight 2 + Polish 3）。Auditor 现在完整验证 Designer v2.6.1 定义的所有检查区。
- **视觉审计数字不一致** (P1): 3 处 "22 项" 改为 "26 项"（Builder/Planner/Auditor）。部分通过区间从 `12-15/22` 改为 `12-18/26`。
- **Builder Polish 阈值不一致** (P1): "X < 16" 改为 "X < 19"，与 Auditor 的 `≥ 19/26` Pass 阈值对齐。防止 Builder 自认为修到 16 分即可但被 Auditor INVALIDATED。

### Changed

- **版本号统一升至 2.6.2**: 7 个文件（skills.json / forcoding.md / designer / drafter / forcoding-core / forcoding-gate / AGENTS.md）
- **CHANGELOG**: 新增 v2.6.2 条目

### 全链路技能对比

| 阶段 | 修复前 | 修复后 | 对齐 |
|:-----|:------|:------|:---:|
| Designer | 9 skills | 9 skills | ✅ |
| Planner | 3 skills | 9 skills | ✅ |
| Builder | 10 skills | 10 skills | ✅ |
| Auditor | 5 skills | 5 skills | — |
| Auditor checklist | 9 项 | 23 项 (5区) | ✅ |

### Incident

**专注森林流程事故 (2026-06-08)**: 8 子系统的 UI 任务被当作"一个 HTML 文件"处理，编排器完全绕过 Pre-Flight Gate、Designer、Planner、Auditor，自己写了 36.6KB 代码。14 项质量差距（配色/视觉效果/交互细节）vs 参考实现。

**根因**:
- Pre-Flight Gate 被跳过（不数子系统、不定深度、不承诺委派）
- Auto-Inject Manifest 技能知识在 dispatch 前被 ctx_reduce 删除（Context Drop Protection 违反）
- Designer/Planner/Auditor 三道品质防线全部缺失
- 编排器写了代码 — 核心规则违反

这与 2026-06-06 天气卡片 NaN bug 事故同根同源。

### Added

- **forcoding-gate** (新技能): 强制 Pre-Flight Gate。在 build/create/design/UI 任务时自动触发。4 步自检（数子系统→定深度→选流程→承诺委派）。如果 Builder count > 0，禁止编辑/写入工具。输出 Gate Report。包含辩解防护表（Rationalization Shield）。≤30 秒执行。
- **AGENTS.md 强制路由规则**: build/design/UI/持久化/多交互/特效 任务必须走 @forcoding 工作流。激活步骤 4 步。违规警示含两次事故记录。
- **三层反违规防护**: L1 系统层 (forcoding-gate 技能) → L2 Agent 层 (AGENTS.md 路由规则) → L3 行为层 (Pre-Flight Gate 嵌入 agent)。

### Changed

- **forcoding-core SKILL.md**: Self-Check 表新增 forcoding-gate 条目。Skill Priority 列表新增 forcoding-gate 为第一 Process skill。
- **forcoding.md agent**: 版本号 v2.6 → v2.6.1。描述增加 gate enforced + delegate-only 语义。
- **skills.json**: 版本 2.6.0 → 2.6.1。forcoding_builtin 列表新增 forcoding-gate。

### Fixed

- **Context Drop Protection 漏洞**: 明确规则 — 提取 Manifest 前禁止 ctx_reduce 技能内容。AGENTS.md 新增对应条目。
- **Rationalization Trap 闭合**: forcoding-gate 包含完整的辩解→真相对照表，覆盖本次事故中出现的所有借口。

### Added
- **forcoding-design-md-bridge** (新技能): ForCoding ↔ DESIGN.md 双向桥梁。支持 Google Labs design.md 规范的 YAML front matter 生成、{path.to.token} 引用语法、VoltAgent/awesome-design-md 73 品牌参考库索引、Builder prompt 令牌注入协议、CLI 工具集成。
- **DESIGN.md 生成流程**: Phase 0 Visual Concept 同时输出 DESIGN.md YAML 令牌（colors/typography/rounded/spacing/components）。
- **Reference Analysis 升级**: 使用 awesome-design-md 73 品牌按类别索引匹配项目风格。
- **DESIGN.md Token Compliance (Auditor Pass 5)**: 令牌使用率检查(颜色≥95%/圆角≥90%/间距≥80%)、引用完整性验证。
- **ui-ux-pro-max v2.5 深度集成**: Design System Generator 作为 Phase 0 首选数据源、--persist 分层检索、Pre-Delivery Checklist (9项) 注入 Designer+Auditor。
- **Plan Self-Review** (Planner): 输出前 5 项自审(spec coverage/placeholders/type consistency/task granularity/Visual Lead)。
- **Verification Gate** (Auditor): 无新运行证据不能 VALIDATED。禁止"should pass"/"probably works"。
- **Anti-Rationalization Tables** (Builder+Auditor): Superpowers-inspired 借口 vs 真实情况对照 + Red Flags 清单。
- **Subagent Context Isolation**: NEVER pass session history to sub-agents。精而准构建每 agent 的上下文。
- **Continuous Execution**: 自主模式不暂停、不发送进度更新、仅在 true BLOCKED 暂停。

### Changed
- **Visual Concept 输出格式**: 从自由文本改为 DESIGN.md YAML front matter + Markdown prose。
- **Phase 0 → Designer 流向**: ui-ux-pro-max search.py → style/color/type → Visual Concept → DESIGN.md。
- **Designer 输出**: 增加 DESIGN.md 格式规范 + Pre-Delivery Checklist。
- **Auditor 审查维度**: 新增 Pass 5 DESIGN.md Token Compliance + Pre-Delivery Checklist 验证。
- **visual-review 标准**: 从 16 项(PASS ≥11/16) → 22 项(PASS ≥16/22) → 26 项(PASS ≥19/26), 新增 G段(2026标准6项) + H段(Token Fidelity 4项)。
- **Pre-Builder Gate**: 从 9 项扩展为 10 项(增加 DESIGN.md tokens)。
- **NEVER rules**: 新增 6 条(Subagent Context Isolation / Continuous Execution / Plan Self-Review / Verification Gate / DESIGN.md tokens / DESIGN.md library)。
- **工作流深度**: standard 深度强制包含 Polish Round + 视觉审计。流程图更新为 Visual Lead + JS Specialists。

### Fixed
- **Prompt Quality Gate 引用不一致**: "16 项/11/16" → "26 项/19/26"。
- **Pre-Builder Gate 覆盖不全**: 从 4 项扩展为 10 项。
- **Designer 未更新 2026 标准**: 增加 WCAG 2.2/motion tokens/dark mode/触摸目标。
- **Planner 不知道 Visual Lead Protocol**: 增加 VISUAL LEAD/JS ONLY/POLISH 任务标记。
- **Anti-Emoji 规则与用户需求冲突**: 增加优先级规则(用户需求 > 技能规则)。
- **ctx_reduce 漏洞**: 提取 Manifest 后才可 drop 技能内容(Context Drop Protection)。

## v2.5.2 (2026-06-08) — Priority Triage over Edit-Down

### Changed
- **改进10重写**: Edit-Down Pass（砍功能换预算）→ **Priority Triage**（功能分级）。AI 开发没有代码量瓶颈，所有用户需求全部保留。改为 P0/P1/P2/P3 分级告诉 Builder 精力分配，不是砍功能。
- **改进13重写**: Code Budget（代码预算百分比）→ **Priority Triage 精力分配**（P0 40%/P1 35%/P2 25%）。不再设硬性代码比例，而是精力优先级。
- **Pre-Builder Gate 更新**: 去掉 Code Budget 检查，改为 Priority Triage 检查。
- **NEVER 规则更新**: 去掉"必须有 code budget"，改为"必须有 Priority Triage"。
- **所有文件同步**: forcoding-core/forcoding.md/designer/builder 四个文件的"砍功能"语义全部替换为"功能分级"。

### Rationale
AI 生成中功能数量不是质量瓶颈，prompt 详细程度才是。
编排器的核心职责 = 提供尽量详细可执行的指示，不是砍掉用户要的功能。

## v2.5.1 (2026-06-08) — Quality Improvement Batch Integration

### Added

- **Pre-Flight Gate** (`forcoding.md`) — Mandatory 4-step self-check before ANY action: Count Subsystems → Determine Workflow Depth → Select Flow → Commit to Not Write Code. Cannot be skipped.
- **Delegation Report template** (`forcoding.md`) — Orchestrator must output a structured report before dispatching Builders, with explicit subsystem count, workflow depth, and delegation targets.
- **Same-File Parallelism** (`forcoding-core`) — Documented mechanism for dispatching multiple Builders to the same file when subsystems are independent.
- **Incident Report** (`docs/forcoding/learnings/2026-06-08-orchestrator-code-violation.md`) — Permanent warning for the 58KB dream travel journal violation.
- **UI Task Quality Definition** (改进9) — Separate quality model for UI tasks: visual impact + consistency + emotional + restraint. Code budget: visual+delight ≥ 45%.
- **Edit-Down Pass** (改进10) — Feature audit step before Builder: "砍掉会有人抱怨吗？" checklist. Deliberate omissions list. Code budget allocation.
- **Visual Concept Phase** (改进11) — Mandatory phase between Intent and Designer. Visual Concept Definition becomes the NORTH STAR for all downstream decisions.
- **5-Phase UI Workflow** (改进12) — Restructured: Visual Concept → Designer → Edit-Down → Builder+Polish → Auditor.
- **Code Budget Visualization** (改进13) — Budget allocation section in Builder prompt: structure ≤15%, logic ≤30%, visual ≥30%, delight ≥15%, defense ≤10%.
- **Delight Floor Enhancement** (改进14) — Expanded delight element list (sensory/visual/gamification/empowerment). Builder must explicitly select ≥2 items.
- **Auto-Inject Manifest Protocol** (改进4) — Orchestrator reads skill → extracts manifest → embeds verbatim in Builder prompt. Must be imperative (must/must not).
- **Prompt Quality Self-Check Gate** (改进2) — 7-item pre-dispatch checklist in `forcoding-core`. Orchestrator verifies before every Builder dispatch.
- **Auditor Pass 4 Expansion** (改进7) — UI quality sub-checklist: CSS vars, safe-area, fonts, micro-interactions, IIFE, scroll-into-view, sample data.
- **User Value Level Gate** (改进15) — Level 1-5 hierarchy. Target: Level 4 Delightful. Less than Level 4 → INVALIDATED.
- **`forcoding-ui-checklist` skill** (改进1) — New skill with mobile UI best practices. Manifest auto-injected for design/build tasks.
- **Self-Check Table upgraded** (改进8) — Added 5 new rows: prompt quality gate, polish round, auto-inject, code budget, delight selection.
- **NEVER rules expanded** (改进5-6) — Added 5 new prohibitions: skip Visual Concept, skip Edit-Down, no code budget, no Polish Round, skip Pre-Flight Gate.

### Fixed

- **Rationalization traps expanded** — Added 6 new traps covering: "user gave complete spec" → delegate anyway, "loaded skill = executed" → loading ≠ executing, "single file = one builder" → subsystems are independent even in same file.
- **Quick workflow tightened** — Added 3 more conditions: no interaction states, no touch/gesture, no platform adaptation.
- **Delegation mandate hardened** — Added concrete violation examples from history (weather card, dream travel journal) as explicit warnings.
- **Cross-file consistency verified** — 6 files checked for 11 keywords. All gaps identified and closed.
- **Reference Analysis phase** (改进6) — Designer spec includes 3-minute reference scan: user-provided refs, websearch, project memory, ui-ux-pro-max.
- **Inspiration Pattern Library** (改进16) — 8 proven high-impact patterns (sweep glow, conic-gauge, haptic, stagger, glass depth, breathing glow, number bounce, achievement badge). Builder injects 2-3 selected patterns.
- **Design System Seed** (改进17) — Enhanced Phase 0 with full ui-ux-pro-max integration: search → curate → output Visual Concept. 3-step protocol.
- **Design System Persistence** (改进18) — Multi-page persistence via --persist: MASTER.md (global) + pages/[page].md (overrides). Orchestrator archives then Builders consume.

## v2.5.0 (2026-06-07) — Design Thinking + Flash-Only Architecture

### Major: Design Thinking Double Diamond Workflow

v2.x completes the transition from task-execution to design-thinking. ForCoding now follows the full Double Diamond model: Insight (Empathize) → Define+Explore (Designer) → Plan (Planner) → Build (Builder) → Verify (Auditor) → RSI Check.

### Added

- **`forcoding-designer` agent** — New sub-agent replacing `forcoding-scout`+`forcoding-drafter` in the Define+Explore stage. Applies Kata 5問 + Given/When/Then + confidence tiers (confirmed/probable/hypothesis) + Green/Red zone classification. Generates NL VFs + Structured I/O contracts.
- **`forcoding-edit-quality` skill** — Unified edit discipline + comment quality. Merges `forcoding-reliable-edits` + `forcoding-clean-comments` into one loadable unit.
- **`forcoding-flash-engine` skill** — Flash model optimization engine. Documents Think Max as the only reasoning mode (Flash Max = 16/20, Flash Think = 9/20 in real-world 20-task test). 10 optimization principles with effect sizes.
- **SPOQ Wave-Based DAG Dispatch** (Planner) — Complex tasks get wave-parallel scheduling with explicit dependency graphs.
- **VERIMAP Python VFs** (Planner) — Deterministic Python verification functions generated per subtask for well-defined I/O.
- **VERIMAP NL VFs** (Designer) — Natural language verification functions embedded in Given/When/Then acceptance criteria.
- **4-Pass Auditor** (Compiled AI-inspired): Pass 1 Security → Pass 2 Syntax → Pass 3 Execution (VFs) → Pass 4 Accuracy (UX+Quality)
- **Gate Metrics** — Catch rate, escape rate, rework rate tracked per session → `docs/forcoding/metrics.json`
- **RSI Reality Check** — 6-item self-audit after every task (Persistence, Acceleration, Auto-verify, Breadth, Economics, Bottleneck)
- **Insight-First Methodology** — Constraint-driven discovery: "constraint + direction = creativity"
- **Interactive Questioning Protocol** — Structured Q&A when uncertain, with "全自动" mode skipping
- **4 Human Gates** — Intent → Spec → Plan → Push, with skip rules per autonomy mode
- **Pro Escape Hatch** — All-Flash default; Pro only on 3 Builder failures or 2 Auditor INVALIDATEDs
- **Longitudinal Quality Tracking** — Per-session metrics with monthly review targets

### Fixed

- **Flash-only architecture enforced** — All stages use `opencode-go/deepseek-v4-flash` Think Max. Non-Think forbidden. Think High deprecated. Pro only via escape hatch.
- **Designer replaces Scout+Drafter** — Design Thinking Define+Explore phase handled by single agent with structured spec format
- **Skill execution mandatory** — All sub-agents must execute checklist items, not just load skills
- **UX injection at every stage** — Designer writes user journey + interaction states, Builder implements all states, Auditor verifies completeness
- **Design taste enforcement** — 20+ rule checklist from design-taste-frontend verified by Builder + Auditor

### Changed

- **Workflow renamed**: Standard 4-stage → 3-level depth (quick / standard / deep) with Design Thinking phases
- **Agent count**: 6 → 7 (added `forcoding-designer`, kept `forcoding-scout` and `forcoding-drafter` as legacy)
- **Skill count**: 7 → 9 (added `forcoding-edit-quality`, `forcoding-flash-engine`)
- **Skills.json**: v2.5.0, restructured with install groups
- **All agents updated**: New skill matching tables, mandatory skill execution, confidence declarations
- **forcoding-core expanded**: 79→348 lines with Design Thinking, UX injection, VERIMAP, RSI, capability scan
- **forcoding-intent expanded**: 69→98 lines with subsystem-based complexity classifier
- **Plugin bootstrap**: Updated sub-agent list to include designer
- **Templates**: Updated with Design Thinking flow references

### Files Changed (21 files)

| File | Changes |
|:----|:--------|
| `agents/forcoding.md` | Full rewrite: Design Thinking, HARD-GATE, 6 stages, RSI, NEVER rules, Interactive Questioning |
| `agents/forcoding-designer.md` | New: Kata 5問, Given/When/Then, confidence tiers, zone classification |
| `agents/forcoding-builder.md` | Skill execution mandatory, pre-task context injection, doc sync required |
| `agents/forcoding-auditor.md` | 4-Pass review, VF execution, gate metrics, PR template |
| `agents/forcoding-planner.md` | SPOQ DAG wave dispatch, VERIMAP Python VFs, skill execution mandatory |
| `agents/forcoding-drafter.md` | Flash optimization embedding table, skill execution mandatory |
| `agents/forcoding-scout.md` | Updated skill matching, parallel exploration marker |
| `skills/forcoding-core/SKILL.md` | 79→348 lines: Design Thinking, VERIMAP, RSI, UX injection, capability scan |
| `skills/forcoding-intent/SKILL.md` | 69→98 lines: subsystem-based complexity, "single file ≠ trivial" hardening |
| `skills/forcoding-edit-quality/SKILL.md` | New: unified edit discipline + comment quality |
| `skills/forcoding-flash-engine/SKILL.md` | New: Flash Max only, 10 optimization principles |
| `skills.json` | v2.5.0 restructured with install groups |
| `package.json` | v2.5.0 |
| `CHANGELOG.md` | v1.2.0, v2.0.0, v2.5.0 entries |
| `README.md` | v2.5 feature updates, designer agent |
| `REQUIREMENTS.md` | Updated agent/skill counts, designer entry |
| `.opencode/plugins/forcoding.js` | Bootstrap updated with designer |
| `templates/AGENTS.md` | Added designer reference |
| `templates/PROMPT-TEMPLATES.md` | Updated with Design Thinking flow |

---

## v1.2.0 (2026-06-07) — Enforcement Infrastructure

### Major: From Passive Rules to Active Gates

v1.1 had rules. v1.2 adds enforcement. After the weather-cards-v2 accident (orchestrator wrote all code instead of delegating to 4 parallel builders), we audited every file for "rules exist but constraints are weak" patterns. 12 fixes applied.

**Core problem**: Passive rules ("should", "when you find yourself writing code") don't stop rationalization. Active gates ("before writing, answer these questions") do.

### Added

- **`<HARD-GATE>` implementation gate** (`forcoding.md` Stage 4) — Mandatory decision tree before ANY code writing
- **Two-stage review** (`forcoding-auditor.md`) — Spec Compliance + Code Quality
- **Quality gates** (`forcoding.md` Stages 1→2, 2→3, 3→4) — Each stage transition requires explicit verification
- **Parallel dispatch decision tree** (`forcoding.md` Stage 4) — Visual decision tree replaces passive text rule
- **"Never" rules summary** (`forcoding.md` end) — 10 absolute prohibitions
- **Skill checklist enforcement** (`forcoding-drafter.md`, `forcoding-planner.md`) — Mandatory skill execution sections
- **Phase 5 audit consequences** (`forcoding.md`) — Violations accumulate in session.json
- **Upward feedback loop** (`forcoding.md`) — Sub-agents can signal structural defects upstream
- **Session persistence recovery** (`forcoding.md`) — Unfinished sessions auto-detected on startup

### Fixed

- **Auditor escape hatch eliminated** — "Self-review if timeout" removed
- **Pre-review escape hatch fixed** (`forcoding-planner.md`) — Timeout no longer skips pre-review
- **Doc sync mandatory** (`forcoding-builder.md`) — Builder must output doc sync status after every commit
- **Builder context injection verified** (`forcoding.md`) — Orchestrator checks pre-task context injection
- **Complexity classifier hardened** — "Single file = trivial" rationalization explicitly blocked

### Changed

- **All files converted to English** — 9 files, all Chinese text translated
- **Self-check table expanded** — Added HARD-GATE and sub-agent count rows
- **Orchestrator prompt restructured** — Delegation mandate strengthened to "MUST" / "NEVER"

### Superpowers Integration

Cross-audited against `superpowers` agent system. Adopted: `<HARD-GATE>` XML tag, two-stage review, decision tree visuals, "Never" rule list.

### Files Changed

| File | Changes |
|:----|:--------|
| `agents/forcoding.md` | Full rewrite: HARD-GATE, quality gates, parallel tree, Never rules, session recovery |
| `agents/forcoding-builder.md` | Eliminate self-review escape, mandatory doc sync |
| `agents/forcoding-auditor.md` | Two-stage review structure |
| `agents/forcoding-drafter.md` | Skill checklist enforcement section |
| `agents/forcoding-planner.md` | Fix pre-review escape, skill checklist section |
| `agents/forcoding-scout.md` | English conversion |
| `skills/forcoding-core/SKILL.md` | HARD-GATE in self-check table |
| `skills/forcoding-intent/SKILL.md` | English conversion |

---

## v1.1.1 (2026-06-07)

### Fixed
- Agent variant global consistency alignment: drafter→high, builder→high, spec-writer→high
- Auditor routing table: fixed from L2 Think High → L3 Pro Think Max (two tables)
- README agent config examples added variant column
- REQUIREMENTS agent allocation table added superpowers-implementer/spec-writer rows
- Cost distribution updated: ~75% L2, ~25% L3, saving 85% vs all-Pro

## v1.1.0 (2026-06-07)

### Added
- Thinking intensity variants (off / high / max), Desktop UI dropdown + Ctrl+T
- Model routing optimization: Planner and Auditor use Pro Think Max, rest use Flash
- Provider switching: dual opencode-go and bifrost providers
- Route table documentation: complete stage routing in agent definitions
- Global consistency sync: opencode.json, agent .md, spec docs three-way alignment

### Improved
- Edit discipline validation: three-level matching (exact → normalized → fuzzy) + post-edit verification
- Session persistence recovery: auto-detect and prompt resume on interruption
- Learning extraction: auto-record learnings after each Builder task
- Upward feedback loop: sub-agents signal architecture contradictions upstream

### CLI
- `bin/forcoding.mjs` unified CLI: evaluate / health / install / uninstall / init

## v1.0.0 (2026-06-04)

### Initial Release
- 6 sub-agents (forcoding/scout/drafter/planner/builder/auditor)
- 7 skills (core/intent/reliable-edits/clean-comments/flash-optimization/autopilot/parallel)
- Two-stage intent refinement (Flash extract → classification mapping)
- Four-stage workflow (Scout → Drafter → Planner → Builder)
- Autonomous mode (gogogo)
- Three-tier reasoning model routing (L1/L2/L3)
- Self-test framework (5 tasks × 4 configs)
- .opencode/plugins/forcoding.js plugin entry
- templates/AGENTS.md + PROMPT-TEMPLATES.md
