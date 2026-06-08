---
name: forcoding-ui-checklist
description: Mobile UI best practices checklist for HTML/CSS/JS apps. Covers CSS architecture, platform adaptation (safe-area, 100dvh, iOS scroll), touch feedback, system fonts, micro-interactions, and code quality. Automatically injected via Auto-Inject Manifest when task_type=design or task includes UI.
---

# ForCoding UI Checklist

## Auto-Inject Manifest

When this skill is loaded, the orchestrator MUST extract this manifest and inject
it **verbatim** into the Builder prompt's quality requirements section.
**DO NOT paraphrase. DO NOT summarize. Copy-paste the entire block.**

```
## Auto-Inject Manifest from forcoding-ui-checklist
### 必须遵守 (Mobile UI Mandatory)
1. 所有颜色/间距/圆角使用 CSS 自定义属性 (:root {--*})，禁止硬编码
2. 字体使用系统字体栈含中文回退: -apple-system, BlinkMacSystemFont, 'Segoe UI', PingFang SC, Microsoft YaHei, sans-serif
3. 使用 env(safe-area-inset-*) 适配刘海屏/全面屏
4. 使用 min-height: 100dvh (不是 h-screen) 防止移动端浏览器布局跳跃
5. 使用 -webkit-overflow-scrolling: touch 优化 iOS 滚动
6. viewport meta: maximum-scale=1.0, user-scalable=no 防止双击缩放
7. [WCAG 2.2 AA] 触摸目标最小 44×44 CSS px — 按钮/链接/所有可交互元素。若小于此值，周围必须有 24px 无干扰区域
8. [WCAG 2.2 AA] 正文对比度 ≥ 4.5:1，大号文字(≥18pt 或 ≥14pt粗体) ≥ 3:1
9. [WCAG 2.2 AA] 非文字元素(图标/进度环/边框)对比度 ≥ 3:1
10. prefers-reduced-motion 尊重用户减少动画偏好 — 检查并关闭非必要动画

### 交互要求
1. 所有可交互元素 :active 有触感反馈 (transform: scale(.95) 或 opacity)
2. touch-action: manipulation 移除触摸延迟
3. 长按/拖拽使用 touchstart/touchmove/touchend 事件链
4. 使用被动事件监听 ({passive:true}) 优化 touch 滚动性能
5. 拇指热区: 核心操作按钮放在屏幕底部 1/3 区域（thumb zone）
6. 拖拽手势必须有 visible fallback（不能用纯手势替代按钮）

### 质量要求
1. 使用 IIFE 或模块模式封装 JS，无全局变量
2. 数据模型最小化，不需要 order 字段时用数组索引
3. 首次使用预置示例数据，避免冷启动空态
4. 动画使用 transform/opacity 走 GPU，不动画 top/left/width/height
5. Canvas 粒子系统限制粒子数量 ≤ 100，使用 requestAnimationFrame + deltaTime
6. 动画使用 cubic-bezier 缓动（非 linear），时长 < 300ms 交互 / < 600ms 转场
7. 设计语义化设计令牌(semantic tokens): 使用 --color-primary 而非 --color-green-500
```

## Usage

This skill is NOT loaded directly by the orchestrator. Instead:
1. Orchestrator detects task_type = design or build with UI components
2. Orchestrator reads this SKILL.md
3. Orchestrator extracts the Auto-Inject Manifest block
4. Orchestrator embeds the manifest verbatim into the Builder prompt
5. Builder executes every item in the manifest

See `forcoding-core` → "Auto-Inject Manifest Protocol" for details.
