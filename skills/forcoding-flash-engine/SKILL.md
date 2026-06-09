> ⚠️ **REFERENCE ONLY** — ForCoding_Arch v4.0
> This skill is NO LONGER loaded into LLM context. All governance logic
> has been migrated to deterministic Node.js modules in `src/`.
> This file exists for human maintainers only.

---
name: forcoding-flash-engine
description: Flash model optimization engine with Think Max as the only reasoning mode. Provides 10 optimization principles, autonomous mode rules, and cost-awareness. Loaded by all sub-agents before execution.
---

# Flash 模型提示引擎

## All Flash, All Think Max

**唯一推理模式: Think Max。** Non-Think绝对禁止。Think High已弃用。

| 证据 | Flash Max | Flash (Think) | Pro Max |
|:----|:---------|:-------------|:--------|
| 20任务编码实测 | **16/20** | 9/20 | 16/20 |
| SWE Verified | 79.0% | 78.6% | 80.6% |
| LiveCodeBench | 91.6% | 88.4% | 93.5% |
| 成本 ($/Mtok) | $0.14 | $0.14 | $1.74 |

Flash Max 和 Pro Max 在编码任务上打平 (16/20 = 16/20)，成本仅1/12。Flash Think (9/20) 差距过大，不可接受。

## Flash 提示优化原则（按效果排序）

编排器写 prompt 时必须内化。子智能体执行前必须逐条检查：

### 1. 补充算法步骤（+57%）
直接告诉 Flash 怎么做，不要让它自己推导步骤。

### 2. 指定 I/O 格式（+44%）
函数签名、参数类型、返回类型、空值行为全部写清楚。

### 3. 明确前置/后置条件（+23%）
函数执行前必须满足什么？执行后保证什么？

### 4. 指定异常处理（+12%）
每个错误场景、异常类型、错误信息。

### 5. 使用断言性语言（+9%）
"必须"而非"应该"，"不得"而非"不建议"。

### 6. 提供示例
至少 2 个 input → output 示例。

### 7. 标明性能约束
时间/空间复杂度要求。

### 8. 利用 1M 上下文窗口
Flash 和 Pro 共享 1M 上下文。将相关代码文件直接放入上下文。

### 9. 明确非目标
列出不需要处理的情况。

### 10. 检查清单

在把任务发给 Flash 前：
- [ ] 前置条件写清楚了吗？
- [ ] 输入输出格式指定了吗？
- [ ] 算法步骤说明了吗？（如有）
- [ ] 异常处理规范了吗？
- [ ] 有用"必须"而非"应该"吗？
- [ ] 给了示例吗？
- [ ] Think Max 确认了吗？

## 自主模式

由编排器的 `autonomy` 字段驱动：

| autonomy | 行为 |
|:---------|:----|
| self-directed | 不等确认直接推进，非致命错误自动重试 3 次 |
| plan-first | 多花时间澄清和规划，确认后再动手 |
| confirm-per-step | 阶段切换需确认 |

### 自动重试
- auto 模式下失败：自动分析根因 → 重试（最多3次）
- 3次后仍失败 → 跳过，记录到 learnings
- 阻塞性问题 → 暂停通知编排器
