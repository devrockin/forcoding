# ForCoding 自我验证项目

## 目的

验证 ForCoding 的模型路由和优化策略：
1. Flash Think High vs Flash Think Max vs Pro Max 的质量差距（真实数据）
2. 9 原则嵌入 + 上下文增强是否有实际价值
3. 各种配置的成本效益对比

## 目录

```
self-test/
├── README.md                  # 这个文件
├── configs/                   # 4个模型配置
│   ├── baseline-flash-high.json   # A: ForCoding 推荐
│   ├── test-flash-max.json        # B: Flash Max
│   ├── test-pro-max.json          # C: Pro Max
│   └── test-flash-noprinciples.json # D: 无优化
├── tasks/                     # 5个测试任务
│   ├── T01-refactor-skill.md
│   ├── T02-fix-builder-bug.md
│   ├── T03-add-flash-feature.md
│   ├── T04-security-audit.md
│   └── T05-document-update.md
├── evaluate.ps1               # 会话生成脚本
└── results/                   # 结果存档
```

## 快速运行

### 1. 预览
```powershell
.\evaluate.ps1 -DryRun
```

### 2. 生成会话文件
```powershell
.\evaluate.ps1
```
生成 `sessions/YYYY-MM-DD-HHmm/` 目录，包含：
- `INDEX.md` — 会话索引和结果汇总表
- `T01-A.md` ~ `T05-D.md` — 每个任务×配置的会话提示词

### 3. 执行测试

在 OpenCode 中以新会话执行每个会话文件：

```
@forcoding 按照 sessions/YYYY-MM-DD-HHmm/T01-A.md 执行
```

**重要**：每个会话开始前，临时修改 `forcoding.md` 中的 `model` 为对应配置的模型。

完成后在 `INDEX.md` 中填写结果。

### 4. 填写结果

在 `INDEX.md` 的汇总表中填写每行：

| # | 任务 | 配置 | 结果 | Token(入/出) | 耗时 | 编辑纪律 | 注释 | 评分 |
|:-:|:----|:---:|:----|:----------|:----|:-------|:---|:---:|
| 1 | T01 | A | 成功 | 2.1K/0.8K | 2m30s | 2/✅ | 无 | 4 |

### 5. 生成报告

手动汇总 `INDEX.md` 中的数据，或使用报告模板。

## 测试矩阵

| 配置 | 模型 | 推理 | 验证什么 |
|:---:|:----|:---:|:-------|
| A | Flash | High | ForCoding 当前推荐的基线 |
| B | Flash | Max | Max 推理是否能提升质量 |
| C | Pro | Max | 质量上界（Flash 追赶目标） |
| D | Flash | High(无优化) | 优化是否真的有效 |

## 评估维度

| 维度 | 权重 | 说明 |
|:----|:---:|:----|
| 正确性 | 40% | 功能是否按需求实现 |
| 编辑纪律 | 25% | read→edit→verify 是否遵守 |
| 代码风格 | 20% | 与现有代码一致性 |
| 注释质量 | 15% | 无 AI slop 词 |

评分: 0=完全失败, 5=完美
