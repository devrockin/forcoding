# AGENTS.md — 项目规则模板

> 将此文件放到项目根目录。ForCoding 智能体自动读取。
> 根据你的项目修改以下内容。

## 语言
- 使用中文交流
- 代码和注释可用中文或英文

## 技术偏好
- 优先使用项目现有框架和库
- 遵循已有代码风格和命名约定

## 安全
- 不记录或提交密钥、Token
- 敏感配置用环境变量引用

## 代码风格
- 遵循项目现有规范
- 创建新组件先参考已有实现
- 不加不必要的注释

## Git
- 不未经确认提交
- 不推送/拉取/合并除非明确要求

## ForCoding 配置
- 全局配置: `~/.config/opencode/opencode.json`
- 项目配置: `.opencode/`
- 智能体: `@forcoding` 主编排器
- 子智能体: `@forcoding-designer` `@forcoding-scout` `@forcoding-drafter` `@forcoding-planner` `@forcoding-builder` `@forcoding-auditor`
- 全局模板: `~/.config/opencode/PROMPT-TEMPLATES.md`（30个场景模板）
- 使用: `@forcoding` 启动，输入 `全自动` 自主模式，输入意图描述智能路由
