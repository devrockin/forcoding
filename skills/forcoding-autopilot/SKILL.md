---
name: forcoding-autopilot
description: Use when autonomy level is set to 自主完成. Autonomous continuation with error retry, progress tracking, and graceful stop conditions. Does NOT hardcode any trigger words — follows the autonomy flag from intent refinement.
---

# 自主执行模式

当 intent 提炼的 `autonomy` = "自主完成" 时激活。

## 继续条件
- 当前任务成功完成
- 非致命警告
- 计划有明确修复方案的错误
- 并行组里兄弟任务还在跑

## 暂停条件（需要用户输入）
- 模糊需求阻塞前进
- 架构层面重大取舍
- 权限问题
- 同一任务连续失败3次
- 安全敏感操作

## 结束条件
- 计划全部完成
- 用户打断
- 破坏性操作未提前批准

## 错误处理

```
第1次: 直接重试
第2次: 分析原因，换方式
第3次: 换完全不同思路
第4次: 报告主编排器 → 暂停
```

可重试: "oldString not found"、测试超时、lint/类型错误
不可重试: 权限拒绝、网络故障(连续3次)、缺依赖、架构矛盾

## 进度汇报

自主模式下只在以下情况汇报：
- 遇到错误重试了
- 单任务超过30秒
- 每5个任务做里程碑总结

## 反发呆

60秒没动且任务未完成 → 检查下一个任务 → 继续或报告阻塞。
