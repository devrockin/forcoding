# ForCoding v3.0

**Policy-Enforced Agent Orchestrator Plugin for OpenCode** — Design Thinking Double Diamond workflow with deterministic governance engine.

> v3.0: Plugin-architecture rewrite. Policy Engine (YAML→deterministic evaluation) + Audit Trail (cryptographic hash chain) + Gate System (MD5 content hashes + chain of custody). Inspired by Microsoft AGT, NLAH, SAL, and FORGE. Rules enforced at infrastructure layer — NOT in prompts.

## OpenCode Plugin Installation

ForCoding v3.0 is an **OpenCode plugin** — install once, works across all projects.

### Method 1: Local path (development)

Add to `~/.config/opencode/opencode.json`:

```json
{
  "plugin": ["~/.config/opencode/forcoding"]
}
```

### Method 2: npm registry (when published)

```json
{
  "plugin": ["forcoding"]
}
```

Restart OpenCode. Verify with `@forcoding hello`.

### Method 3: CLI install

```bash
node install.mjs
```

## Architecture

```
ForCoding v3.0 Plugin
├── Policy Engine (src/engine/)     ← Deterministic YAML policy evaluation
├── Audit Trail (src/audit/)        ← JSONL + cryptographic hash chain
├── Gate System (src/gates/)        ← .approved files + MD5 chain of custody
├── Policies (policies/base/)       ← 5 YAML files, 31 governance rules
├── Agents (agents/)                ← 7 sub-agents (orchestrator + designer + ...)
└── Skills (skills/)                ← 9 workflow skills
```

- [OpenCode Desktop](https://opencode.ai) 已安装
- 一个可用的 DeepSeek V4 模型提供商（opencode-go、bifrost 等）

### 安装

#### 方法一：插件安装（推荐）

在 `~/.config/opencode/opencode.json` 的 `plugin` 数组中添加：

```json
{
  "plugin": ["forcoding"]
}
```

重启 OpenCode，ForCoding 自动安装。

#### 方法二：本地路径

```json
{
  "plugin": ["~/.config/opencode/forcoding"]
}
```

然后将 ForCoding 克隆或复制到该目录：

```bash
git clone https://github.com/YOUR_USERNAME/forcoding.git ~/.config/opencode/forcoding
```

#### 方法三：CLI 安装（跨平台，推荐）

```bash
# 在 ForCoding 项目目录执行
node install.mjs          # 安装
node install.mjs uninstall  # 卸载
```

也支持 CLI 子命令：

```bash
node bin/forcoding.mjs install    # 安装
node bin/forcoding.mjs health     # 健康检查
node bin/forcoding.mjs evaluate   # 运行自测
```

### 技能安装

ForCoding 引用了 25+ 个外部技能。运行安装后执行以下命令检查和安装：

```bash
node install.mjs skills          # 检查缺失的外部技能
node install.mjs skills --list   # 列出所有技能依赖
```

缺失技能通过 OpenCode 插件安装：

| 来源 | 提供技能 | 安装方式 |
|:----|:--------|:--------|
| **opencode-power-pack** | security-audit, performance-profiling, architecture-patterns, senior-architect 等 | `"plugin": ["github:waybarrios/opencode-power-pack"]` |
| **opencode-skills-collection** | uxui-principles, design-taste-frontend, domain-driven-design, microservices-patterns, api-design-principles 等 | `"plugin": ["opencode-skills-collection"]` |
| **OpenCode 内置** | brainstorming, code-quality, TDD, refactoring-safely, systematic-debugging 等 | 无需安装 |

### 使用

```
@forcoding 帮我写一个用户登录功能
@forcoding 这个 bug 修一下
@forcoding 全自动
@forcoding 先规划，然后实现一个 REST API
```

---

## 架构

```
你说的话
  ↓
[Insight] — 意图提炼: goal/autonomy/scope/complexity + 约束驱动洞察
  ↓
[Define+Explore] — Designer: Kata 5問 + Given/When/Then + 置信度评级
  ↓
[Plan] — Planner: SPOQ DAG Wave + VERIMAP Python VFs
  ↓
[Build] — Builder(s): 并行调度 + Self-Refine ≤3 次
  ↓
[Verify] — Auditor: 4-Pass (Security→Syntax→Execution→Accuracy)
  ↓
[RSI Check] — 6 项自我审计
```

### 设计思维双钻工作流

```
Insight (Empathize) → Define+Explore → Plan → Build (Prototype→Produce) → Verify (Test) → RSI
```

| Phase | ForCoding Stage | Design Thinking | Agent |
|:------|:---------------|:----------------|:------|
| Insight | Intent Refinement | Empathize | orchestrator |
| Define+Explore | Designer spec | Define + Ideate | `@forcoding-designer` |
| Plan | Planner | Plan | `@forcoding-planner` |
| Build | Builder | Prototype → Produce | `@forcoding-builder` |
| Verify | Auditor | Test | `@forcoding-auditor` |
| RSI | Reality Check | Self-audit | orchestrator |

### 7 个子智能体

| 智能体 | 角色 | 模型 | Variant |
|:------|:----|:----|:--------|
| `@forcoding` | 主编排器 — 设计思维工作流+路由 | Flash | **Max** |
| `@forcoding-designer` | 设计规范 — Kata 5問 + Given/When/Then + 置信度 | Flash | **Max** |
| `@forcoding-scout` | 需求澄清 — 扫代码→问问题→给方案 | Flash | Max |
| `@forcoding-drafter` | 设计规范 — Flash 优化嵌入 | Flash | Max |
| `@forcoding-planner` | 实施计划 — SPOQ DAG + VERIMAP VFs | Flash | **Max** |
| `@forcoding-builder` | 代码实施 — 编辑纪律 + Self-Refine | Flash | **Max** |
| `@forcoding-auditor` | 代码审查 — 4-Pass 审查 | Flash | **Max** |

### 9 个技能

| 技能 | 用途 |
|:----|:----|
| `forcoding-core` | 核心编排流程 — 设计思维双钻 |
| `forcoding-intent` | 意图提炼 — 子系统复杂度判定 |
| `forcoding-edit-quality` | 编辑纪律 + 注释质量 |
| `forcoding-flash-engine` | Flash 优化引擎 — Think Max 唯一模式 |
| `forcoding-reliable-edits` | 可靠编辑纪律 |
| `forcoding-clean-comments` | 注释质量 — AI slop 检测 |
| `forcoding-flash-optimization` | Flash 模型提示优化（10 条原则） |
| `forcoding-autopilot` | 自主执行模式 |
| `forcoding-parallel` | 并行任务执行 |

---

## Flash-Only 模型路由

v2.5 采用 Flash-Only 架构。所有阶段使用 `opencode-go/deepseek-v4-flash` Think Max：

| 证据 | Flash Max | Pro Max |
|:----|:---------|:--------|
| 20 任务编码实测 | **16/20** | 16/20 |
| SWE Verified | 79.0% | 80.6% |
| LiveCodeBench | 91.6% | 93.5% |
| 成本 ($/Mtok) | **$0.14** | $1.74 |

**Pro 逃逸舱**: Builder 失败 3 次或 Auditor INVALIDATED 2 次才启用。

| 阶段 | 推理模式 |
|:------|:-------|
| Intent | Think Max |
| Designer | Think Max |
| Planner | Think Max |
| Builder | Think Max |
| Auditor | Think Max |
| Security review | Think Max |

---

## 工作流深度（3 级）

| 深度 | 条件 | 流程 |
|:------|:----|:-----|
| **quick** | 1 子系统，单文件 | Intent → Builder → Auditor |
| **standard** | 2-3 子系统 | Intent → Designer → Builder(s) → Auditor |
| **deep** | 4+ 子系统/安全 | Intent → Designer → Planner → Builder(s) → Auditor(s) → Security |

---

## 核心创新

### VERIMAP VFs
每个子任务携带验证函数：
- **NL VFs** (Designer): Given/When/Then 自然语言验证
- **Python VFs** (Planner): 确定性可执行断言
- **执行**: Auditor Pass 3，全部必须通过

### SPOQ DAG Wave
复杂任务构建 DAG 并按波次并行调度：
```
DAG: Root → [A,B] → C → [D,E] → F
Wave 0: Root    → 1 builder
Wave 1: A,B     → 2 builders (PARALLEL)
Wave 2: C       → 1 builder
Wave 3: D,E     → 2 builders (PARALLEL)
```

### Green/Red Zone
| Zone | Criteria | Flow |
|:-----|:---------|:-----|
| 🟢 Green | No auth/PII/payments | Standard |
| 🟡 Yellow | User data, basic auth | Auditor 12-item |
| 🔴 Red | Auth, payments, PII | Auditor + human gate |

### Gate Metrics
| Metric | Target |
|:----|:----|
| Gate catch rate | 20-40% |
| Escape rate | <5% |
| Rework rate | 15-25% |

---

## 自主模式

| autonomy | 行为 |
|:---------|:----|
| **自主完成** | 不等确认，只有真正阻塞才暂停 |
| **先规划** | 多花时间澄清和规划，确认后再动手 |
| **每步确认** | 标准流程，阶段切换需要确认 |

---

## 自测框架

`self-test/` 目录包含完整的评估系统：

- **5 个测试任务**：重构、修 bug、加功能、安全审计、文档更新
- **4 种模型配置**：基线 Flash High / Flash Max / Pro Max / 无优化对照
- **评估维度**：正确性(40%) + 编辑纪律(25%) + 代码风格(20%) + 注释质量(15%)

```bash
node bin/forcoding.mjs evaluate        # 运行评估
node bin/forcoding.mjs evaluate --all-configs  # 全部 4 种配置
node bin/forcoding.mjs evaluate --dry-run      # 预览
node bin/forcoding.mjs health          # 健康检查
```

---

## 配置参考

### Agent 模型分配

```json
{
  "agent": {
    "forcoding":          { "model": "opencode-go/deepseek-v4-flash",     "variant": "max" },
    "forcoding-designer": { "model": "opencode-go/deepseek-v4-flash",     "variant": "max" },
    "forcoding-scout":    { "model": "opencode-go/deepseek-v4-flash",     "variant": "max" },
    "forcoding-drafter":  { "model": "opencode-go/deepseek-v4-flash",     "variant": "max" },
    "forcoding-planner":  { "model": "opencode-go/deepseek-v4-flash",     "variant": "max" },
    "forcoding-builder":  { "model": "opencode-go/deepseek-v4-flash",     "variant": "max" },
    "forcoding-auditor":  { "model": "opencode-go/deepseek-v4-flash",     "variant": "max" }
  }
}
```

---

## 技术栈

- **运行时**：Node.js (ESM)
- **平台**：OpenCode Desktop (plugin + agent + skill)
- **模型**：DeepSeek V4 Flash (默认) / Pro (逃逸舱)
- **许可证**：MIT

---

## 项目结构

```
forcoding/
├── .opencode/plugins/forcoding.js   # 插件入口 (hooks: config, edit验证, bootstrap)
├── agents/                          # 7 个子智能体定义
│   ├── forcoding.md                 #   主编排器
│   ├── forcoding-designer.md        #   设计规范 (Kata 5問)
│   ├── forcoding-scout.md           #   需求澄清
│   ├── forcoding-drafter.md         #   设计规范 (Flash 优化)
│   ├── forcoding-planner.md         #   实施计划 (SPOQ DAG)
│   ├── forcoding-builder.md         #   代码实施
│   └── forcoding-auditor.md         #   代码审查 (4-Pass)
├── skills/                          # 9 个技能
│   ├── forcoding-core/              #   核心流程
│   ├── forcoding-intent/            #   意图提炼
│   ├── forcoding-edit-quality/      #   编辑+注释质量
│   ├── forcoding-flash-engine/      #   Flash 优化引擎
│   ├── forcoding-reliable-edits/    #   编辑纪律
│   ├── forcoding-clean-comments/    #   注释质量
│   ├── forcoding-flash-optimization/ #  Flash 优化
│   ├── forcoding-autopilot/         #   自主模式
│   └── forcoding-parallel/          #   并行执行
├── bin/forcoding.mjs               # CLI 工具
├── bin/setup.mjs                   # 安装快捷入口
├── install.mjs                     # 跨平台安装脚本
├── self-test/                       # 自测框架
├── templates/                       # 项目模板
├── docs/                            # 文档
└── package.json
```

---

## 许可证

[MIT](./LICENSE)
