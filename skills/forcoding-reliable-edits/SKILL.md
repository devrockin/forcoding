> ⚠️ **REFERENCE ONLY** — ForCoding_Arch v4.0
> This skill is NO LONGER loaded into LLM context. All governance logic
> has been migrated to deterministic Node.js modules in `src/`.
> This file exists for human maintainers only.

---
name: forcoding-reliable-edits
description: Use when editing files — ensures every edit is validated against current file content. Read before edit, copy exactly, verify after. Prevents stale-line errors.
---

# 可靠编辑纪律

> 受 Hashline 启发的编辑原则：每次编辑都要验证文件当前状态。

## 核心原则

**每次编辑前必须和文件当前内容对账，不能凭记忆。**

## 纪律

### 编辑前
1. **read 目标区域** — 马上要改的文件，先读了再说
2. **逐字复制** — oldString 从 read 输出里直接复制，别重打
3. **确认唯一** — oldString 在文件里不能出现多次。如果出现多次，多包几行上下文

### 编辑时
4. **精确匹配空白** — tab就是tab，空格就是空格
5. **一次一个逻辑变更** — 多次改=多次edit调用，中间插read

### 编辑后
6. **read 验证** — 改了马上看结果
7. **跑测试** — 有测试就跑，没测试做手动检查

## 常见失败和修复

| 失败 | 原因 | 修法 |
|:----|:----|:----|
| "oldString not found" | 文件在上次read后变了 | 重新read再试 |
| "multiple matches" | oldString太短 | 多包上下文 |
| 改错了行 | 空白不匹配 | 从read输出逐字复制 |
| 过期引用 | 凭之前会话的记忆 | 永远在改前重新read |

## 红线

- "我记得这文件" → **停，重新read**
- "改得应该对" → **停，跑验证**
- "一次改5个" → **停，一个个来**
- "diff很明显" → **停，read确认结果**

## 配合LSP

- `lsp(documentSymbol)` — 确认结构没变
- `lsp(findReferences)` — 看看改的函数在哪被调用
- `lsp(goToDefinition)` — 改签名前确认类型
