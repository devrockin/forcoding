> ⚠️ **REFERENCE ONLY** — ForCoding_Arch v4.0
> This skill is NO LONGER loaded into LLM context. All governance logic
> has been migrated to deterministic Node.js modules in `src/`.
> This file exists for human maintainers only.

---
name: forcoding-parallel
description: Use when the plan contains independent tasks that can execute simultaneously without file or data conflicts.
---

# 并行执行

## 能并行的情况
- 任务改**不同文件**
- 任务**没有数据依赖**（A的输出不被B消费）
- 加独立组件（同时加A组件和B组件）
- 多个研究搜索
- 审查+实施（审一个文件同时写另一个）

## 不能并行的情况
- 改**同一文件**
- B导入或调用A创建的东西
- 数据库迁移
- 改同一服务的配置
- B需要A的输出结果

## 执行模式

```
并行组A:
├─ Builder → 任务1 (Button.tsx)
├─ Builder → 任务2 (Input.tsx)
└─ Builder → 任务3 (Card.tsx)
    ↓ 等三个都完成
顺序:
└─ Builder → 任务4 (index.ts)
```

## 冲突预防

并行前检查：
1. 文件隔离 — glob确认没有共享文件
2. 导入隔离 — grep确认没有互相导入
3. 类型隔离 — 没有改共享类型定义

任何一项不过就拆成顺序。

## 结果收集

全部并行任务完成后：
1. 收集所有输出
2. 检查有没有意外的文件冲突
3. 有集成测试就跑
4. 汇总状态报告
