---
name: forcoding-flash-optimization
description: Use when writing prompts for DeepSeek V4 Flash or any fast-tier model. Research-backed prompt engineering techniques to close the quality gap with Pro models. Based on empirical prompt optimization studies.
---

# Flash 模型提示优化

> 基于实证研究（arXiv:2601.13118）和 DeepSeek V4 官方技术报告。

## 为什么需要这个

DeepSeek V4 Flash 在常规编码任务上（SWE-bench 79.0%）仅比 Pro（80.6%）差 1.6 分，但在复杂推理任务上差距可达 11 分（Terminal Bench）。**正确的提示可以缩小这个差距**。

## 十条优化原则

按效果排序，最有效的排前面：

### 1. 补充算法细节（+57% 通过率）

Flash 不会自己脑补算法步骤。明确告诉它怎么做。

```
❌ "写一个检查除数个数是否为偶数的函数"

✅ "写一个检查除数个数是否为偶数的函数。
    只需遍历至 sqrt(n)，对于每个整除 i：
    - 若 n/i == i，除数计数+1
    - 否则除数计数+2
    最后判断计数是否为偶数"
```

### 2. 指定输入输出格式（+44% 通过率）

数据类型、结构、边界情况全部写清楚。

```
❌ "写一个处理数据的函数"

✅ "函数签名: def process(items: list[dict]) -> dict
    items 中每个 dict 包含字段: id(int), name(str), value(float)
    返回: {total: float, count: int, names: list[str]}
    若 items 为空返回 {total: 0.0, count: 0, names: []}"
```

### 3. 写清楚前置和后置条件（+23% 通过率）

函数执行前必须满足什么？执行后保证什么？

```
✅ "前置条件: nums 为非空整数列表，已排序
    后置条件: 返回值在 [0, 1] 区间内
    若前置条件不满足抛出 ValueError"
```

### 4. 用断言性语言（+9% 通过率）

"必须"而非"应该"，"不得"而非"不建议"。

```
❌ "函数应该处理空列表"
✅ "函数必须处理空列表，返回 []"
```

### 5. 明确异常和错误处理（+12% 通过率）

每种异常场景、异常类型、错误消息全写清楚。

```
✅ "若 products_dict 中不存在 product_key，抛出 KeyError(f'Unknown product: {key}')
    若 script_file 不存在，抛出 FileNotFoundError"
```

### 6. 给输入输出示例

```
✅ "示例输入: [1, 2, 3, 2, 1]
    示例输出: [1, 2, 3]（保留首次出现顺序）"
```

### 7. 标注性能约束

```
✅ "时间复杂度 O(n log n)，空间复杂度 O(1)
    n ≤ 10^5 时必须在 100ms 内完成"
```

### 8. 使用 Think Max 模式（Flash 特有）

Flash 的 `reasoning_effort: "high"` 在中等复杂度任务上可接近 Pro 质量。增加 ~400ms 延迟，成本不变。

```
触发条件: 任务涉及 3+ 个约束需同时满足，或多步骤推理
```

### 9. 利用 1M 上下文窗口

Flash 和 Pro 共享 1M 上下文。将相关代码文件直接放入上下文比让模型靠记忆更好。

### 10. 明确说不做什么（非目标）

```
✅ "不要: 处理 Unicode 字符、支持流式输入、做输入验证"
```

## 何时用 Flash

| 适用 | 不适用 |
|:----|:-----|
| 代码编写、测试生成、文档 | 10+ 步 agent 循环 |
| bug 修复（能定位的） | 需要深度搜索根因的 |
| 代码审查（常规） | 安全审计 |
| 上下文 <200K tokens | 上下文 >200K 且需精确检索 |
| 有明确规范的实现 | 从模糊需求做架构设计 |

## 快速检查清单

在把任务发给 Flash 前：
- [ ] 前置条件写清楚了吗？
- [ ] 输入输出格式指定了吗？
- [ ] 算法步骤说明了吗？（如有）
- [ ] 异常处理规范了吗？
- [ ] 有用"必须"而非"应该"吗？
- [ ] 给了示例吗？
- [ ] 需要推理的话开启 Think Max 了吗？
