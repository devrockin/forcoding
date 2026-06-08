---
name: forcoding-edit-quality
description: Load before any file modification — enforces read-before-edit discipline, LSP-assisted navigation, and meaningful comment standards. Covers both edit reliability and comment quality.
---

# 编辑质量与注释规范

## 编辑纪律

**核心原则**: 每次编辑前必须和文件当前内容对账，不凭记忆。

### 编辑前
1. **read 目标区域** — 马上要改的文件，先读
2. **逐字复制** — oldString 从 read 输出直接复制，不重打
3. **确认唯一** — oldString 在文件里只能出现一次。多次出现就多包上下文

### 编辑时
4. **精确匹配空白** — tab 就是 tab，空格就是空格
5. **一次一个逻辑变更** — 多次改 = 多次 edit，中间插 read

### 编辑后
6. **read 验证** — 改完马上看结果
7. **跑测试** — 有测试就跑，没有就手动检查

### LSP 辅助
- `lsp(documentSymbol)` — 确认结构没变
- `lsp(findReferences)` — 查看函数调用方
- `lsp(goToDefinition)` — 改签名前确认类型定义

## 注释规范

### 禁止词
不得出现在注释中：`obviously`、`simply`、`clearly`、`just`、`easily`

### 有效注释
- 解释代码 **为什么** 这么做（不是做了什么）
- 标注不直观的逻辑、workaround、性能权衡
- 说明关键常量的来源或推导

### 无效注释（必须删除）
- 重述代码（`// loop through items` 在 `for (auto& item : items)` 前面）
- 填充性注释（`// initialize variables`、`// main function`）
- 日期标注（`// 2026-06-07 by xxx`，用 git blame 替代）

### 注释密度
- 平均不超 1 条注释 / 10 行可执行代码
- 无注释的方法不是问题，代码自解释

## 常见失败

| 失败 | 原因 | 修复 |
|:----|:----|:----|
| "oldString not found" | 文件在上次读后变了 | 重新 read |
| "multiple matches" | oldString 太短 | 多包上下文 |
| 改错行 | 空白不匹配 | 从 read 输出逐字复制 |
| 过期引用 | 凭记忆 | 改前必读 |
