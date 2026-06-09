> ⚠️ **REFERENCE ONLY** — ForCoding_Arch v4.0
> This skill is NO LONGER loaded into LLM context. All governance logic
> has been migrated to deterministic Node.js modules in `src/`.
> This file exists for human maintainers only.

---
name: forcoding-design-md-bridge
description: Bridges ForCoding ↔ DESIGN.md ecosystem. Generates DESIGN.md from Visual Concepts. Provides reference library index (73 brands from VoltAgent/awesome-design-md). Injects structured design tokens into Builder prompts. Uses {path.to.token} reference syntax for cross-referencing. Integrates with @google/design.md CLI for lint/diff/export.
---

# ForCoding ←→ DESIGN.md Bridge

## Overview

DESIGN.md is a **universal design language** for AI coding agents — a format specification by Google Labs (15.4k stars) that combines machine-readable YAML design tokens with human-readable Markdown design rationale.

```
┌──────────────────────────────────────────────────────────────┐
│         ForCoding ⟷ DESIGN.md 生态系统集成                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  🔄 双向桥梁:                                                  │
│                                                              │
│  [项目 DESIGN.md]  ──→  ForCoding Designer 读取设计语言         │
│  [Visual Concept]  ──→  生成 DESIGN.md 文件                    │
│  [73 品牌库]        ──→  Reference Analysis 参考注入            │
│  [design.md CLI]   ──→  Auditor lint/diff/export 验证          │
│  [Builder prompt]  ──→  {path.to.token} 结构化注入             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## When This Skill is Used

- Orchestrator enters Phase 0 (Visual Concept) for UI tasks
- Designer generates spec — outputs DESIGN.md format
- Reference Analysis phase — queries awesome-design-md library
- Builder dispatch — injects DESIGN.md tokens as structured input
- Auditor review — validates output against DESIGN.md specification
- Any task where `DESIGN.md` magic string is detected in project root

---

## Part 1: DESIGN.md Format Reference

### File Structure

```
---
version: alpha
name: <Project Name>
colors:
  primary: "#1A1C1E"
  secondary: "#6C7278"
  tertiary: "#B8422E"
  neutral: "#F7F5F2"
  surface: "#FFFFFF"
  on-primary: "#FFFFFF"
  text-body: "#0d253d"
  text-muted: "#64748d"
  hairline: "#e3e8ee"
typography:
  display-lg:
    fontFamily: "Public Sans, sans-serif"
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.02em
  body-md:
    fontFamily: "Public Sans, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  label-caps:
    fontFamily: "Space Grotesk, monospace"
    fontSize: 12px
    fontWeight: 500
    letterSpacing: 0.1em
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  pill: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
    padding: 8px 16px
  card-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-body}"
    rounded: "{rounded.lg}"
    padding: 24px
---

## Overview
[Brand personality, emotional response, target audience]

## Colors
[Color palette rationale — primary/secondary/tertiary/neutral]

## Typography
[Font families, hierarchy table, sizing principles]

## Layout
[Grid system, spacing scale, whitespace philosophy]

## Elevation & Depth
[Shadow levels, tonal surfaces, depth hierarchy]

## Shapes
[Border radius scale, photography geometry]

## Components
[Buttons, cards, inputs, navigation with states and token references]

## Do's and Don'ts
[Design guardrails, anti-patterns]
```

### Token Types

| Type | Format | Example |
|:-----|:-------|:--------|
| Color | Any CSS color | `"#533afd"`, `"oklch(62% 0.18 250)"` |
| Dimension | number + unit | `48px`, `-0.02em`, `16px` |
| Token Ref | `{path.to.token}` | `{colors.primary}`, `{typography.body-md}` |
| Typography | obj with fontFamily/fontSize/ fontWeight/lineHeight/ letterSpacing | `{ fontFamily: "...", fontSize: 16px }` |

### Consumer Behavior

| Scenario | Behavior |
|:---------|:---------|
| Unknown section heading | Preserve; do not error |
| Unknown color token | Accept if value valid |
| Unknown component property | Accept with warning |
| Duplicate section heading | Error; reject |

---

## Part 2: ForCoding Visual Concept → DESIGN.md Generation

### Conversion Rules

ForCoding Visual Concept fields map to DESIGN.md sections:

```
Visual Concept            →  DESIGN.md
─────────────────────────────────────────────
Style + Feeling          →  ## Overview (brand personality, mood, density)
Colors (主色/辅色/背景)    →  ## Colors (+ YAML colors: tokens)
Typography (字体栈)       →  ## Typography (+ YAML typography: tokens)
Key Anchor               →  reflected in prose descriptions
Dark Mode                →  colors.surface-variant, colors.on-surface
Layout description       →  ## Layout + YAML spacing: tokens
Shadow system            →  ## Elevation & Depth
Border radius            →  ## Shapes + YAML rounded: tokens
Component styles         →  ## Components + YAML components: tokens
Constraints/rules        →  ## Do's and Don'ts
```

### Generation Template

When Designer produces DESIGN.md from Visual Concept, the YAML front matter MUST include at minimum:

```yaml
---
version: alpha
name: <ProjectName>
colors:
  primary:
  on-primary:
  surface:
  text-body:
typography:
  body-md: { fontFamily: ..., fontSize: ..., fontWeight: ..., lineHeight: ... }
  heading-lg: { fontFamily: ..., fontSize: ..., fontWeight: ..., lineHeight: ... }
rounded:
  sm: 4px
  md: 8px
  lg: 14px
spacing:
  sm: 8px
  md: 16px
  lg: 24px
---
```

---

## Part 3: Reference Library Index

### VoltAgent/awesome-design-md — 73 Brand DESIGN.md Files

Organized by category. Use during Reference Analysis phase for similar-style projects.

#### When to reference which brand

| 项目风格 | 参考品牌 | 关键特征 |
|:---------|:--------|:--------|
| 开发者工具/暗色 | Stripe, Vercel, Linear | 深蓝/黑色, Geist/Sohne, 代码感 |
| 极简 SaaS | Linear, Notion, Cal.com | 紫色点缀, 温暖的极简, 品牌字体 |
| AI/ML 平台 | Claude, Mistral, Replicate | 柔和色调, editorial 排版 |
| 金融/支付 | Stripe, Mastercard, Revolut | 信任感深蓝, 精密排版, 表格数字 |
| 电商/零售 | Nike, Shopify, Airbnb | 大图+留白, 极简 UI, 品牌红/橙 |
| 设计工具 | Figma, Framer, Webflow | 多彩, 创意, 玩味的专业 |
| 终端/CLI | Warp, Ollama, Raycast | 暗色, 等宽字体, 极简 chrome |
| 消费电子 | Apple, Tesla, SpaceX | 极致留白, SF Pro, 大图全屏 |
| 媒体/出版 | WIRED, The Verge, Sanity | 白纸黑字, 大标题, serif |
| 企业/技术 | IBM, NVIDIA, HashiCorp | 结构化蓝, Carbon 设计系统 |
| 游戏/娱乐 | PlayStation, Twitch | 高对比度, 动态感, 霓虹色 |
| 自然/健康 | Starbucks, Airbnb | 暖调大地色, 圆角, 手绘感 |

#### Reference Injection Template

```
## Reference Analysis — DESIGN.md

已分析的参考品牌: [Brand1], [Brand2]
关键模式提取:
  1. 配色: [primary/accent/surface] — [ref brand] 的做法
  2. 排版: [font stack/hierarchy] — [ref brand] 的做法
  3. 组件: [button shape/card style] — [ref brand] 的做法
  4. 间距: [scale system] — [ref brand] 的做法

建议的 ForCoding Visual Concept 调色板:
  colors:
    primary: [extracted]
    surface: [extracted]
    text-body: [extracted]
```

---

## Part 4: Builder Prompt Injection Protocol

### How to inject DESIGN.md into Builder prompt

When dispatching Builder for a DESIGN.md-backed project, the prompt MUST include:

```
## 设计系统 (DESIGN.md)

### 颜色令牌
$color-primary:    {colors.primary}     — CTA/主要交互
$color-surface:    {colors.surface}     — 卡片/页面背景
$color-text:       {colors.text-body}   — 正文颜色
$color-muted:      {colors.text-muted}  — 辅助文字
$color-hairline:   {colors.hairline}    — 边框/分割线

### 排版令牌
$font-display:     {typography.display-lg}    — 大标题
$font-heading:     {typography.heading-lg}    — 小标题
$font-body:        {typography.body-md}       — 正文 (默认)
$font-label:       {typography.label-caps}    — 标签/元数据

### 圆角令牌
$radius-sm:        {rounded.sm}    — 小元素
$radius-md:        {rounded.md}    — 卡片/容器
$radius-pill:      {rounded.pill}  — 按钮

### 间距令牌
$space-sm:         {spacing.sm}    — 紧凑间距
$space-md:         {spacing.md}    — 默认间距
$space-lg:         {spacing.lg}    — 段落间距

### 组件令牌
button-primary:    bg={colors.primary}  text={colors.on-primary}  rounded={rounded.pill}
card-default:      bg={colors.surface}  text={colors.text-body}  rounded={rounded.lg}

### 必须遵守
1. 所有颜色必须使用上面的颜色令牌，禁止使用未定义的颜色
2. 圆角使用上面的圆角层级，禁止任意值
3. 间距遵循 4/8/16/24/32/64 周期
4. 排版使用上面的排版令牌层级
```

### Implementation rule for Builder

```
Builder MUST:
1. 定义 CSS 变量时，变量名必须对应 DESIGN.md 令牌名
   :root {
     --color-primary: {colors.primary};
     --color-surface: {colors.surface};
     --radius-md: {rounded.md};
     --space-md: {spacing.md};
   }
2. 在代码注释中标注令牌名
   /* button-primary: bg={colors.primary} rounded={rounded.pill} */
3. 不定义 DESIGN.md 中未出现的颜色/圆角/间距

Auditor will verify:
□ 所有颜色值来自 DESIGN.md 令牌
□ 所有圆角值来自 DESIGN.md 圆角层级
□ 所有间距值来自 DESIGN.md 间距周期
□ CSS 变量命名对应 DESIGN.md 令牌名
```

---

## Part 5: CLI Tools Integration

### @google/design.md CLI (when available)

```
npx @google/design.md lint DESIGN.md    # 验证 ST RUCTURE + WCAG 对比度
npx @google/design.md diff A.md B.md   # 比较两个版本的令牌变化
npx @google/design.md export DESIGN.md # 导出到 Tailwind/CSS/DTCG
npx @google/design.md spec             # 输出格式规范
```

### Lint Rules (9 rules)

| Rule | Severity | What it checks |
|:-----|:---------|:---------------|
| `broken-ref` | error | `{colors.primary}` 引用无定义 |
| `missing-primary` | warning | 有颜色但无 primary |
| `contrast-ratio` | warning | 组件 bg/text 对低于 4.5:1 |
| `orphaned-tokens` | warning | 定义了颜色但从未被组件引用 |
| `token-summary` | info | 每个 section 有多少令牌 |
| `missing-sections` | info | 有原子令牌但缺少对应 prose |
| `missing-typography` | warning | 有颜色但无排版 |
| `section-order` | warning | section 顺序不符合规范 |
| `unknown-key` | warning | 顶层 key 看起来像 typo |

### Auditor DESIGN.md Compliance Check

```
□ broken-ref: 所有 {colors.xxx} 引用可解析？
□ missing-primary: colors.primary 已定义？
□ contrast-ratio: 所有组件 bg/text 对 ≥ 4.5:1？
□ orphaned-tokens: 所有颜色令牌至少被一个组件引用？
□ section-order: section 顺序正确 (Overview→Colors→...→Do's/Don'ts)？

Pass: 无 errors, ≤ 2 warnings
Fail: 有 errors 或 > 2 warnings → INVALIDATED
```

---

## Part 6: DESIGN.md ↔ ForCoding Skills Mapping

| DESIGN.md Section | ForCoding Skill/Phase | Integration Point |
|:-----------------|:---------------------|:------------------|
| Overview | Visual Concept + ui-ux-pro-max | Style + Feeling → `--design-system` STYLE 输出 |
| Colors | ui-ux-pro-max → Visual Concept | `--design-system` COLORS 输出 → colors: tokens |
| Typography | ui-ux-pro-max → Visual Concept | `--design-system` TYPOGRAPHY 输出 → typo: tokens |
| Layout | Designer | spacing: tokens |
| Elevation | Designer + visual-review D | 阴影系统 |
| Shapes | Designer + visual-review C2 | rounded: tokens |
| Components | Designer → Builder | components: tokens |
| Do's/Don'ts | ui-ux-pro-max AVOID + Designer rules | Anti-pattern 融合 |
| Responsive | forcoding-ui-checklist | 断点/触摸/safe-area |

### ui-ux-pro-max → DESIGN.md Token Conversion

ui-ux-pro-max `--design-system` 输出格式可以映射到 DESIGN.md YAML:

```
ui-ux-pro-max output        →  DESIGN.md front matter
─────────────────────────────────────────────────────
COLORS:                     →  colors:
  Primary:    #E8B4B8       →    primary: "#E8B4B8"
  Secondary:  #A8D5BA       →    secondary: "#A8D5BA"
  CTA:        #D4AF37       →    tertiary: "#D4AF37"
  Background: #FFF5F5       →    surface: "#FFF5F5"
  Text:       #2D3436       →    text-body: "#2D3436"

TYPOGRAPHY:                 →  typography:
  Cormorant Garamond        →    display: { fontFamily: "Cormorant Garamond, serif" }
  Montserrat                →    body: { fontFamily: "Montserrat, sans-serif" }

EFFECTS:                    →  prose in ## Elevation & Depth
  Soft shadows + 300ms      →    "Shadows with warm undertone, transitions 200-300ms"

AVOID:                      →  ## Do's and Don'ts
  AI purple gradients       →    "Don't use AI purple/pink gradients"
```

---

## Part 7: Quick Reference — Common DESIGN.md Patterns

### Minimal DESIGN.md (通用项目模板)

```
---
version: alpha
name: <项目名>
colors:
  primary: "#2d6a4f"
  primary-hover: "#1b4332"
  on-primary: "#ffffff"
  surface: "#ffffff"
  surface-soft: "#f8faf7"
  text-body: "#1a2e1f"
  text-muted: "#5c7a62"
  hairline: "#d4e0d0"
typography:
  display: { fontFamily: "system-ui, sans-serif", fontSize: 32px, fontWeight: 700, lineHeight: 1.2 }
  body: { fontFamily: "system-ui, sans-serif", fontSize: 16px, fontWeight: 400, lineHeight: 1.6 }
rounded:
  sm: 6px
  md: 12px
  lg: 20px
spacing:
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
---
```

### Natural/Forest Theme (专注森林类项目)

```
colors:
  primary: "#5a8f4a"        # 森林绿 — CTA/进度条
  primary-dark: "#3d6b30"   # 深绿 — 按压态
  surface: "#f7faf5"        # 柔和草绿底
  surface-card: "#ffffff"   # 白色卡片
  text-body: "#2d3e2b"      # 深墨绿正文
  text-muted: "#6e7a65"     # 灰绿辅助
  accent: "#d4932b"         # 琥珀色点缀 — 数字/高亮
  hairline: "#d4e0cc"       # 浅绿边框
```

### Dark Dashboard Theme (开发者工具/终端类)

```
colors:
  primary: "#7c3aed"        # 紫 — CTA
  surface: "#0f0f13"        # 深灰黑底
  surface-elevated: "#1a1a20" # 浮起表面
  text-body: "#e4e4ec"      # 亮灰正文
  text-muted: "#6b6b7b"     # 暗灰辅助
  hairline: "#2a2a35"       # 暗边框
  accent: "#22d3ee"         # 青霓虹点缀
```

---

## Implementation Checklist

When ForCoding encounters a DESIGN.md-backed project:

```
□ Phase 0: Visual Concept → 生成最小 DESIGN.md YAML front matter
□ Phase 1: Designer → 完善 DESIGN.md (所有 section + 组件令牌)
□ Pre-Builder Gate: 检查 DESIGN.md tokens 已注入 prompt
□ Phase 3: Builder → 使用 {path.to.token} 引用实现组件
□ Phase 4: Auditor → DESIGN.md lint check + token compliance audit
□ Post-build: 如果 CLI 可用 → npx @google/design.md lint DESIGN.md
```
