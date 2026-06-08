# ForCoding 需求清单

> 运行 ForCoding 所需的全部依赖：平台、模型Provider、插件、技能、工具。

---

## 1. 平台要求

| 项 | 最低版本 | 说明 |
|:--|:--------|:----|
| [OpenCode Desktop](https://opencode.ai) | ≥ 1.0 | 智能体运行平台 |
| [Node.js](https://nodejs.org/) | ≥ 18 | CLI 工具、安装脚本、自测框架 |
| 操作系统 | Windows / macOS / Linux | 全平台支持 |

---

## 2. 模型 Provider

| Provider | 模型 | 用途 | 配置方式 |
|:--------|:----|:----|:--------|
| **opencode-go** (内置) | `deepseek-v4-flash` | 全部 7 个智能体的默认模型（Flash-Only） | `opencode-go` provider 自动可用 |
| **bifrost** (自定义) | `deepseek/deepseek-v4-pro` | Pro 逃逸舱（3 Builder 失败或 2 Auditor INVALIDATED） | 自定义 relay 配置 |
| **ollama** (可选) | 本地模型 | Non-Think 兜底、测试 | 标准 ollama 配置 |

> **opencode-go**: OpenCode Desktop 付费套餐内置，模型 ID 为 `opencode-go/deepseek-v4-flash` 和 `opencode-go/deepseek-v4-pro`。
> **bifrost**: 自定义 OpenAI 兼容 relay，地址 `http://host.docker.internal:8080/v1`，仅供 Pro 模型回退。

---

## 3. OpenCode 插件

这些插件必须在 `~/.config/opencode/opencode.json` 的 `plugin` 数组中注册：

### 3.1 必需插件

| 插件 | plugin 值 | 提供 |
|:----|:---------|:----|
| **forcoding**（自身） | `"~/.config/opencode/forcoding"` | 7 个子智能体 + 9 个技能 + 编辑验证 hooks |
| **opencode-power-pack** | `"github:waybarrios/opencode-power-pack"` | 安全审查、性能分析、架构分析等技能 + 斜杠命令 |
| **opencode-skills-collection** | `"opencode-skills-collection"` | 设计系统、无障碍、UX 等技能 |

### 3.2 功能插件

| 插件 | plugin 值 | 用途 |
|:----|:---------|:----|
| **opencode-deepseek-thinking-fix** | `"opencode-deepseek-thinking-fix"` | DeepSeek V4 thinking 跨轮次缓存修复 |
| **opencode-working-memory** | `"opencode-working-memory"` | 跨 Session 工作记忆 |
| **@cortexkit/opencode-magic-context** | `"@cortexkit/opencode-magic-context"` | 上下文压缩与管理 |
| **@slkiser/opencode-quota** | `"@slkiser/opencode-quota"` | Token 用量和配额查询（`/quota`） |
| **opencode-fixes-huihui** | `"opencode-fixes-huihui"` | 历史兼容性修复 |
| **opencode-triage** | `"opencode-triage"` | 技能路由发现 |
| **opencode-skill-evolution** | `"opencode-skill-evolution"` | 技能进化管理 |
| **opencode-skill-search** | `"opencode-skill-search"` | 技能搜索 |
| **opencode-lazy** | `"opencode-lazy"` | 插件管理（`/plugin install`） |
| **opencode-design-lab** | `"opencode-design-lab"` | 多模型设计提案（`/design-lab:*`） |
| **opencode-reskin** | `"opencode-reskin"` | 主题换肤（`/skin`） |

### 3.4 完整配置示例

```json
{
  "plugin": [
    "github:waybarrios/opencode-power-pack",
    "opencode-deepseek-thinking-fix",
    "opencode-working-memory",
    "opencode-skills-collection",
    "opencode-triage",
    "opencode-skill-evolution",
    "opencode-skill-search",
    "@cortexkit/opencode-magic-context",
    "opencode-fixes-huihui",
    "@slkiser/opencode-quota",
    "~/.config/opencode/forcoding"
  ]
}
```

---

## 4. 内置技能（已捆绑）

ForCoding 自带 9 个技能，位于 `skills/` 目录：

| 技能 | 文件 | 用途 |
|:----|:----|:----|
| **forcoding-core** | `skills/forcoding-core/SKILL.md` | 核心编排流程 — 设计思维双钻 |
| **forcoding-intent** | `skills/forcoding-intent/SKILL.md` | 意图提炼方法论 |
| **forcoding-edit-quality** | `skills/forcoding-edit-quality/SKILL.md` | 编辑纪律 + 注释质量（合并） |
| **forcoding-flash-engine** | `skills/forcoding-flash-engine/SKILL.md` | Flash 优化引擎 — Think Max |
| **forcoding-reliable-edits** | `skills/forcoding-reliable-edits/SKILL.md` | 可靠编辑纪律 |
| **forcoding-clean-comments** | `skills/forcoding-clean-comments/SKILL.md` | 注释质量检测 |
| **forcoding-flash-optimization** | `skills/forcoding-flash-optimization/SKILL.md` | Flash 模型提示优化 |
| **forcoding-autopilot** | `skills/forcoding-autopilot/SKILL.md` | 自主执行模式 |
| **forcoding-parallel** | `skills/forcoding-parallel/SKILL.md` | 并行执行策略 |

这些由 `.opencode/plugins/forcoding.js` 自动注册到 OpenCode 的 skill paths 中。

---

## 5. 外部技能（需安装）

ForCoding 的 agent 按 `task_type` 动态加载以下外部技能：

### 5.1 OpenCode 内置（无需安装）

| 技能 | 使用方 |
|:----|:------|
| `brainstorming` | 编排器、Scout |
| `clean-code` | 已废弃，改用 `code-quality-category-pointer` |
| `systematic-debugging` | Scout、Drafter、Planner、Builder、Auditor |
| `test-driven-development` | Drafter、Planner、Builder、Auditor |
| `refactoring-safely` | Scout、Drafter、Planner、Builder、Auditor |
| `conventional-commits` | Builder |
| `think` | 编排器 |
| `design` | Planner、Builder、Auditor |

### 5.2 opencode-power-pack

| 技能 | 使用方 |
|:----|:------|
| `security-audit` | Drafter、Planner、Builder、Auditor |
| `api-security-best-practices` | Drafter、Planner、Builder、Auditor |
| `performance-profiling` | Drafter、Planner、Builder、Auditor |
| `web-performance-optimization` | Drafter、Planner、Builder、Auditor |
| `architecture-patterns` | Scout、Drafter、Planner、Builder、Auditor |
| `senior-architect` | Drafter、Planner |
| `api-patterns` | Drafter、Auditor |

### 5.3 opencode-skills-collection

| 技能 | 使用方 |
|:----|:------|
| `uxui-principles` | Scout、Drafter、Planner、Builder、Auditor |
| `design-taste-frontend` | Scout、Drafter |
| `popular-web-designs` | Scout、Drafter |
| `high-end-visual-design` | Drafter |
| `frontend-dev-guidelines` | Drafter、Builder |
| `accessibility-a11y` | Scout、Drafter、Planner、Builder、Auditor |
| `research-analysis-engine` | Scout |
| `domain-driven-design` | Scout、Drafter |
| `microservices-patterns` | Drafter |
| `api-design-principles` | Drafter、Builder、Auditor |

---

## 6. 斜杠命令

ForCoding 的任务模板（`templates/PROMPT-TEMPLATES.md`）引用以下斜杠命令：

| 命令 | 来源插件 | 用途 |
|:----|:--------|:----|
| `/plugin` | opencode-lazy | 插件管理 |
| `/design-lab:design` | opencode-design-lab | 多模型设计提案 |
| `/design-lab:review` | opencode-design-lab | 设计评审 |
| `/design-lab:synthesize` | opencode-design-lab | 设计综合 |
| `/skin` | opencode-reskin | 主题换肤 |
| `/frontend-design` | opencode-power-pack | 前端 UI 生成 |
| `/code-review` | opencode-power-pack | 多角度代码审查 |
| `/code-architect` | opencode-power-pack | 架构蓝图 |
| `/code-explorer` | opencode-power-pack | 代码库追溯 |
| `/code-reviewer` | opencode-power-pack | 小变更审查 |
| `/security-review` | opencode-power-pack | 安全审计 |
| `/feature-dev` | opencode-power-pack | 7 阶段功能开发 |
| `/skill-creator` | opencode-power-pack | 技能创建 |
| `/agents-md-improver` | opencode-power-pack | AGENTS.md 审计改进 |
| `/agents-md-revise` | opencode-power-pack | 捕获 session 学习 |
| `/quota` | opencode-quota | Token 用量查询 |

---

## 7. OpenCode 内置工具

ForCoding 的 agent 权限中声明的工具（所有 agent 共用）：

| 工具 | 用途 |
|:----|:----|
| `read` | 读文件 |
| `write` | 写文件 |
| `edit` | 编辑文件 |
| `glob` | 文件搜索 |
| `grep` | 内容搜索 |
| `lsp` | 语言服务器协议 |
| `bash` | 命令执行 |
| `webfetch` | 网页获取 |
| `websearch` | 网络搜索 |
| `todowrite` | 任务追踪 |
| `question` | 用户询问 |
| `skill` | 技能加载 |

ForCoding 编排器额外使用 Magic Context 工具：

| 工具 | 用途 |
|:----|:----|
| `ctx_memory` | 跨 Session 记忆持久化 |
| `ctx_search` | 记忆搜索 |
| `ctx_note` | Session 笔记 |
| `ctx_reduce` | 上下文压缩 |
| `ctx_expand` | 上下文展开 |

---

## 8. Agent 模型分配（Flash-Only）

| Agent | Provider | Model | Thinking | 用途 |
|:------|:--------|:------|:---------|:----|
| forcoding (编排器) | opencode-go | deepseek-v4-flash | Max | 意图提炼 + 设计思维工作流 |
| forcoding-designer | opencode-go | deepseek-v4-flash | Max | Kata 5問 + Given/When/Then + 置信度 |
| forcoding-scout | opencode-go | deepseek-v4-flash | Max | 代码扫描、需求澄清 |
| forcoding-drafter | opencode-go | deepseek-v4-flash | Max | 设计规范 + Flash 优化嵌入 |
| forcoding-planner | opencode-go | deepseek-v4-flash | Max | SPOQ DAG + VERIMAP Python VFs |
| forcoding-builder | opencode-go | deepseek-v4-flash | Max | 代码实施 + Self-Refine |
| forcoding-auditor | opencode-go | deepseek-v4-flash | Max | 4-Pass 审查 + Gate Metrics |

---

## 9. 快速安装命令

```bash
# 1. 安装 ForCoding
node install.mjs

# 2. 检查缺失技能
node install.mjs skills

# 3. 查看完整技能清单
node install.mjs skills --list

# 4. 健康检查
node bin/forcoding.mjs health

# 5. 查看版本
node bin/forcoding.mjs version
```
