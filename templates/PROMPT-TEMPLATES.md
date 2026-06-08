# ForCoding 多技能提示词模板集

> 适用所有项目 · 零修改直接使用 · 每个模板融合 ForCoding 流程 + 多种技能/工具
> 安装后位于 `~/.config/opencode/PROMPT-TEMPLATES.md`，ForCoding 智能体自动引用

---

## 目录

### 用户旅程类
1. [新用户首次体验设计](#1)
2. [典型用户旅程分析与优化](#2)
3. [用户体验痛点诊断与修复](#3)
4. [用户反馈驱动的迭代改进](#4)
5. [无障碍合规审计与修复](#5)
6. [多角色用户场景测试](#6)

### 功能开发类
7. [新功能开发全流程](#7)
8. [自动化测试全流程](#8)
9. [Bug 调试与修复](#9)
10. [API 设计与实现](#10)
11. [Agent / AI 功能开发](#11)
12. [MCP 服务开发](#12)

### 架构与质量类
13. [架构重构与技术债务清理](#13)
14. [代码审视与改进](#14)
15. [性能优化](#15)
16. [生产就绪评估](#16)
17. [安全审计](#17)

### 数据与基础设施类
18. [数据库设计与迁移](#18)
19. [CI/CD + DevOps 配置](#19)
20. [依赖管理与安全更新](#20)

### 设计类
21. [前端页面重新设计](#21)
22. [设计系统构建与维护](#22)
23. [交互原型与微交互设计](#23)

### 研究与文档类
24. [行业研究与竞品分析](#24)
25. [文档生成与同步](#25)
26. [项目规则维护](#26)
27. [多技能审视与文档修订](#27)

### 知识与复用类
28. [技能开发与复用](#28)
29. [开发环境与配置初始化](#29)
30. [全栈端到端功能交付](#30)

---

## 1. 新用户首次体验设计

```
用 ForCoding 流程审视首次用户体验。

加载技能: uxui-principles, ux-flow, design-taste-frontend, frontend-dev-guidelines, high-end-visual-design, accessibility-a11y, brainstorming

工具: websearch, /design-lab:design/review, /code-explorer, ctx_note, ctx_memory

审视维度:
□ 首次打开到核心价值交付需要几步？
□ 有新手引导/渐进式披露吗？
□ 5分钟内用户能体验核心价值吗？
□ 注册/登录有摩擦点吗？
□ 空态有清晰下一步指引吗？
□ 错误提示友好吗？
□ 键盘导航和屏幕阅读器支持吗？

ForCoding 流程:
  Scout(task_type=design) → 了解需求
  Designer(task_type=design) → Kata 5問 + Given/When/Then
  Planner(task_type=design) → 制定实施计划
  Builder(task_type=design) → 逐接触点实现
```

## 7. 新功能开发全流程

```
用 forcoding 全流程（scout→drafter→planner→builder→auditor）启动功能开发。

加载技能: brainstorming, think, code-quality-category-pointer, karpathy-coding, test-driven-development, conventional-commits, architecture-patterns, domain-driven-design

阶段1 探索: /code-explorer, ctx_search, websearch, accessibility-a11y
阶段2 架构: /code-architect, /security-review
阶段3-5 实施: Insight→Designer→Planner→Builder 流程，/code-reviewer, uxui-principles, todowrite
阶段6 质量: /security-review, /code-review, accessibility-a11y, performance-profiling
阶段7 收尾: /agents-md-revise, conventional-commits, ctx_memory
```

## 9. Bug 调试与修复

```
加载: systematic-debugging, test-driven-development

第1步: 收集信息（错误日志、复现步骤）
  ctx_search 查历史类似Bug, /code-explorer 追溯调用链
第2步: 根因分析（拆成可测试的小假设，一次一个变量）
第3步: 修复（先写失败测试→修代码→测试通过）
  /code-reviewer 审查
第4步: 验证: websearch查社区方案, accessibility-a11y防回归, uxui-principles
第5步: 预防: 评估是否需要加测试或lint规则, /agents-md-revise
```

## 21. 前端页面重新设计

```
加载: brainstorming, popular-web-designs, high-end-visual-design, uxui-principles, design-taste-frontend, ui-ux-pro-max

工具: websearch, /design-lab:design/review/synthesize, ctx_search, /frontend-design

设计原则:
1. 3秒内传达价值
2. 核心操作路径最短
3. 反馈即时、错误友好
4. 配色/字体匹配目标用户
5. 新手引导+专家效率模式

审查: uxui-principles, accessibility-a11y, web-performance-optimization, /skin
ctx_memory 保存设计决策
用 /skill-creator 固化设计模式
```

## 模板使用说明

1. 将模板内容发送给 `@forcoding` 主编排器
2. 或输入 `全自动` 让 ForCoding 自主执行
3. ForCoding 会自动：理解意图 → 加载技能 → Insight→Designer→Planner→Builder→Auditor 流程
4. 需要人介入的环节会暂停询问

---

> **30个模板完整内容请参考 `~/.config/opencode/PROMPT-TEMPLATES.md` 的完整版本。
> 以上为精选代表模板。所有模板遵循相同模式：加载技能→调用工具→ForCoding 流程。**
