# Semantic Rewriter — 语义改写模块设计规范

> **版本:** v1.0  
> **日期:** 2026-06-09  
> **状态:** Draft  
> **作者:** ForCoding_Arch  

---

## 1. 概述

Semantic Rewriter 是 ForCoding 意图管道的增强模块，在 IntentGateway (L0-L3) 分类之后，将用户自然语言输入改写为结构化、规范化、上下文增强的 build 指令。

### 1.1 目标

- 将用户模糊的自然语言转化为清晰的 builder 输入
- 通过项目上下文自动补充缺失的技术栈信息
- 生成多个粒度选项供用户选择确认
- 保持 ForCoding 确定性优先的设计哲学，LLM 作为可选增强

### 1.2 设计原则

- **确定性优先:** L0/L1 纯规则引擎，零外部依赖
- **渐进增强:** LLM 回调只在 L2 可选使用，失败静默降级
- **用户参与:** L3 强制用户确认，提供 3-4 个明确选项
- **可测试:** 每层可独立测试，预计 ~107 个测试用例
- **可观测:** 每次改写记录审计日志

---

## 2. 架构

### 2.1 模块结构

`
src/rewriter/
├── rewriter-pipeline.js       # 管道编排器
├── normalizer.js               # L0: 输入清洗 + 标准化
├── enricher.js                 # L1: 项目上下文注入
├── variant-generator.js        # L2: 选项生成
├── user-confirmation.js        # L3: 用户确认交互
├── llm-callback.js             # 可选 LLM 回调适配器
├── rule-engine.js              # 确定性规则引擎核心
├── params/
│   ├── extractor.js            # 参数提取器
│   └── schema.js               # 每 taskType 参数 schema
├── templates/
│   ├── web-ui.yaml
│   ├── canvas-game.yaml
│   ├── cli-tool.yaml
│   ├── backend-api.yaml
│   └── index.js                # 模板加载器
└── index.js                    # 统一导出
`

### 2.2 四层管道

`
用户输入 → L0 Normalizer → L1 Enricher → L2 VariantGen → L3 UserConfirm → Builder
                ↑               ↑               ↑
           Rule Engine     ProjectContext    模板 + LLM(可选)
`

### 2.3 数据流

`
用户输入: "帮我搞个登录页面，带验证"
    │
    ▼
IntentGateway → { taskType: 'web-ui', confidence: 'high' }
    │
    ▼
L0: "Create login page with validation"
    params: { pageType: login, features: [validation] }
    │
    ▼
L1: "Create login page using React with shadcn/ui form validation"
    injected: { framework: react, uiLibrary: shadcn/ui }
    │
    ▼
L2: [
  { id: light,     label: "基础 UI 外壳" },
  { id: standard,  label: "标准登录页", recommended: true },
  { id: complete,  label: "完整交互登录页" },
  { id: spec,      label: "详细实现规范" },
]
    │
    ▼
L3: 用户选择 "standard" → 改写结果存入 FSM state
    │
    ▼
Dispatch Builder 时注入 rewrittenPrompt
`

---

## 3. 三层改写定义

| 层级 | 做什么 | 不改什么 | 确定性 | 需 LLM |
|------|--------|----------|--------|--------|
| Light (L0) | 去噪、统一术语、提取显式参数 | 不新增内容、不推测 | 100% | ❌ |
| Moderate (L1) | 注入项目技术栈、结构上下文 | 不改原意 | ~80% | 🟡 可选 |
| Heavy (L2) | 生成完整技术规范、拆分步骤 | 需用户确认 | ~60% | ✅ 推荐 |

---

## 4. 组件详细设计

### 4.1 L0 Normalizer

`javascript
class Normalizer {
  normalize(raw, classification)
  // 返回: { text, taskType, explicitParams, rawSignalMap, confidence }
}
`

处理流程:
1. 去噪: 去除语气词（呗、啦、哈、嗯）、口语前缀（帮我、我想、能不能）
2. 统一术语: 中英映射表（页面→page, 修复→fix）
3. 标准化为祈使句开头
4. 提取显式参数（颜色、组件名、布局名）

规则引擎驱动:
- CleanupRule — 去语气词
- UnifyTerminologyRule — 术语统一（100+ 映射对）
- ExtractParamRule — 参数提取
- StandardizeVerbRule — 动词标准化

### 4.2 L1 Enricher

`javascript
class Enricher {
  enrich(normalized, projectScan, techStack)
  // 返回: { text, taskType, enrichedParams, injectedSignals, confidence }
}
`

注入维度:
- techStack.framework → 追加框架名
- techStack.uiLibrary → 追加 UI 库名
- project.filePattern → 追加命名惯例
- project.existingRoutes → 路由上下文
- project.hasTests → 测试标记

注入规则: 存在性检查 → 匹配度评分 → >0.6 置信度注入
降级: greenfield 项目跳过注入

### 4.3 L2 VariantGenerator

`javascript
class VariantGenerator {
  generate(enriched)
  async generateWithFallback(enriched, llmCallback)
  // 返回: { variants: [{ id, label, description, prompt, detail, recommended }], engine }
}
`

- 每个 taskType 预设 3-4 个模板
- 从 light→heavy 依次填充参数
- LLM 可选增强: 生成更丰富的选项描述
- LLM 失败 → 规则引擎兜底

### 4.4 L3 UserConfirmation

`javascript
class UserConfirmation {
  renderConfirmation(variants)    // 渲染确认消息
  parseChoice(userResponse)       // 解析用户选择
  // 返回: { selectedId, customInput }
}
`

- 合并分类确认 + 改写选择为单条消息
- 支持数字选择 (1-4)、文本匹配 ("标准")、自定义输入
- 无效输入 → 重新提示

### 4.5 RewriterPipeline

`javascript
class RewriterPipeline {
  constructor({ projectDir, llmCallback })

  async process(rawInput, classification, projectDir, options)
  // 返回: { needsConfirmation, normalizedText, enrichedText, variants, confirmMessage, pipelineInfo }
}
`

### 4.6 LLMCallback

`javascript
class LLMCallback {
  constructor({ callback, timeout, optional })

  async generateVariants(input, context)
  // 返回: VariantResult | null（失败降级）

  validateLLMOutput(raw)
}
`

接口签名: sync (prompt: string, context: object) => string
超时: 默认 10s
降级: 超时/格式错误/无配置 → 规则引擎生成标准模板

---

## 5. Plugin 集成

### 5.1 chat.message hook

IntentGateway 之后、FSM 推进前，在 AWAITING_HITL state 中判断改写状态:

`javascript
// 改写确认子模式
const needsRewriteConfirm = state.currentState === STATE.AWAITING_HITL
  && state.pendingRewrite
  && !state.rewriteConfirmed;

if (needsRewriteConfirm) {
  const choice = UserConfirmation.parseChoice(output.message);
  if (choice.selectedId) {
    const selected = state.pendingRewrite.variants.find(v => v.id === choice.selectedId);
    await store.save({
      sessionId,
      rewrittenPrompt: selected.prompt,
      rewriteConfirmed: true,
      pendingRewrite: null,
    });
    await fsm.transition(STATE.AWAITING_HITL, next, sessionId);
    return;
  }
}
`

### 5.2 tool.execute.before hook

Builder dispatch 前注入改写后的 prompt:

`javascript
if (agentType === 'forcoding-builder' && state.rewrittenPrompt) {
  output.args.prompt = state.rewrittenPrompt + '\n\n---\n\n' + (output.args.prompt || '');
}
`

### 5.3 FSM 交互设计

- 不新增 FSM state
- 复用 AWAITING_HITL 实现两轮交互（分类确认 + 改写选择）
- 合并为一条消息减少交互摩擦

---

## 6. 配置系统

文件: policies/base/rewriter-config.yaml

`yaml
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
`

配置优先级:
1. 用户会话指令 (supervisor 命令)
2. 配置 YAML
3. 分类结果置信度
4. 项目类型

---

## 7. 测试策略

### 文件结构

`
tests/rewriter/
├── normalizer.test.js              # ~15 用例
├── enricher.test.js                # ~10 用例
├── variant-generator.test.js       # ~20 用例
├── variant-generator.llm.test.js   # ~6 用例
├── user-confirmation.test.js       # ~8 用例
├── rewriter-pipeline.test.js       # ~8 用例
├── rule-engine.test.js             # ~10 用例
├── params/
│   ├── extractor.test.js           # ~10 用例
│   └── schema.test.js              # ~10 用例
├── templates/
│   └── template-loader.test.js     # ~5 用例
└── integration/
    ├── rewrite-flow.test.js        # ~5 用例
    └── plugin-integration.test.js  # ~5 用例
`

总计: ~107 测试用例

## 8. 审计日志

每次改写记录到 docs/forcoding/audit/:

`json
{
  "event": "rewrite_result",
  "timestamp": "...",
  "sessionId": "...",
  "rawInput": "帮我搞个登录页面",
  "classification": { "taskType": "web-ui", "confidence": "high" },
  "rewriteLayers": ["L0", "L1", "L2", "L3"],
  "selectedVariant": "standard",
  "engine": "template",
  "pipelineInfo": { "layers": ["L0","L1","L2","L3"], "engine": "template" }
}
`

---

## 9. 边界情况处理

| 场景 | 处理方式 |
|------|---------|
| 空输入 / 过短 (<3字符) | 跳过 Rewriter，透传原始输入 |
| Greenfield 项目 (无上下文) | L1 自动跳过，不影响后续流程 |
| LLM 回调超时 | 静默降级到规则引擎模板 |
| LLM 输出格式错误 | 抛弃 LLM 结果，使用规则引擎 |
| 用户输入无法分类 (L3 clarify) | Rewriter 不启动，先走澄清流程 |
| 用户连续否定 | 3 次无效选择后跳过 Rewriter |
| Supervisor 命令 (shortcut) | 跳过 Rewriter 流程 |

---

## 10. 实现顺序

### Phase 1: 基础设施
- rule-engine.js + 核心规则
- params/schema.js + params/extractor.js
- templates/ 目录结构 + 索引

### Phase 2: L0-L2 核心管道
- normalizer.js
- enricher.js
- variant-generator.js + 模板 YAML 文件

### Phase 3: L3 + LLM 适配
- user-confirmation.js
- llm-callback.js
- rewriter-pipeline.js (编排器)

### Phase 4: Plugin 集成
- chat.message hook 改造
- tool.execute.before 注入
- rewriter-config.yaml

### Phase 5: 测试
- 全部 ~107 用例
- 集成测试 + 回归验证