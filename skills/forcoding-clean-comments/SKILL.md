> ⚠️ **REFERENCE ONLY** — ForCoding_Arch v4.0
> This skill is NO LONGER loaded into LLM context. All governance logic
> has been migrated to deterministic Node.js modules in `src/`.
> This file exists for human maintainers only.

---
name: forcoding-clean-comments
description: Use when writing or reviewing code comments — prevents AI cliché patterns, enforces meaningful comment standards.
---

# 干净注释

## 禁用词

这些词**永远不要**出现在注释里（引用字符串除外）：

| 废话 | 为什么不行 | 怎么改 |
|:----|:---------|:-----|
| "obviously" | 居高临下，假设读者都知道 | 删掉或解释"为什么" |
| "simply" | 无视复杂性 | 直接描述动作 |
| "clearly" | 同obviously | 删掉或解释 |
| "moreover" | 学术废话 | 直接说下一点 |
| "furthermore" | 同moreover | 继续说 |
| "it is worth noting that" | 废话 | "Note:"或直接说 |
| "in order to" | 啰嗦 | "to" |
| "due to the fact that" | 啰嗦 | "because" |
| "utilize" | 装腔作势 | "use" |
| "leverage"（意思是"用"） | 流行语 | "use" |
| "robust"（无具体说明） | 空洞 | 说清楚怎么robust |
| "scalable"（无具体说明） | 空洞 | 描述扩展策略 |

## 好注释的标准

好注释回答：
- **为什么** — 为什么做这个决策？（代码没表达的背景）
- **什么** — 这正则/算法干嘛的？（不明显的逻辑）
- **注意** — 什么边界条件或限制？（警告未来的编辑者）

不过关的注释应该删掉：
- ❌ `// 初始化变量`（代码已是`let x = 0`）
- ❌ `// 循环数组`（代码已是`for`）
- ❌ `// 返回结果`（代码已是`return`）
- ✅ `// 按时间戳DESC排序；须处理旧数据中的null`
- ✅ `// O(n log n) — 基准测试<10k项可接受`

## 提交前自检

1. 扫一遍有没有禁用词
2. 每个注释：它说了代码没说的事吗？
3. 删掉只复述代码的注释
4. 确认没emoji（除非你明确要）
