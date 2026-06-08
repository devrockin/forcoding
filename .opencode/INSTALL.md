# 安装 ForCoding for OpenCode

## 前提

- [OpenCode](https://opencode.ai) 已安装

## 安装

### 方法一：通过 opencode.json 安装（推荐）

在 `~/.config/opencode/opencode.json` 的 `plugin` 数组中添加：

```json
{
  "plugin": ["forcoding"]
}
```

重启 OpenCode。插件通过 OpenCode 的包管理器安装，自动注册所有智能体和技能。

如果你将 ForCoding 发布到 npm，上述方式会自动安装。如果是从 Git 仓库安装：

```json
{
  "plugin": ["forcoding@git+https://github.com/YOUR_USERNAME/forcoding.git"]
}
```

验证：输入 `@forcoding` 或问 "Tell me about your forcoding skills"

### 方法二：本地开发安装

如果你正在开发 ForCoding 本身，使用本地路径：

```json
{
  "plugin": ["~/.config/opencode/forcoding"]
}
```

然后将 ForCoding 克隆到此目录：

```bash
git clone https://github.com/YOUR_USERNAME/forcoding.git ~/.config/opencode/forcoding
```

### 方法三：CLI 安装（跨平台，推荐开发环境）

```bash
# 安装（Windows / macOS / Linux）
node install.mjs

# 卸载
node install.mjs uninstall
```

也可以使用 CLI 工具：

```bash
# 安装
node bin/forcoding.mjs install

# 健康检查
node bin/forcoding.mjs health

# 运行自测
node bin/forcoding.mjs evaluate
```

### 方法四：纯文件安装（无需 git / npm）

如果你没有 Node.js 或不想使用 CLI，直接复制文件：

```bash
# 复制 ForCoding 到 OpenCode 配置目录
cp -r /path/to/forcoding ~/.config/opencode/forcoding
```

然后在 `opencode.json` 中添加：

```json
{
  "plugin": ["~/.config/opencode/forcoding"]
}
```

### 方法五：GitHub 仓库

```bash
git clone https://github.com/YOUR_USERNAME/forcoding.git
cd forcoding
node install.mjs
```

之后从 Git 更新：

```bash
git pull
node install.mjs
```

## 迁移：从旧的 PowerShell 安装

如果你之前使用 `install.ps1` 安装了 ForCoding：

```bash
# 运行跨平台卸载
node install.mjs uninstall
# 然后重新安装
node install.mjs
```

## 使用

```
@forcoding 帮我做一个登录功能
@forcoding 这个 bug 修一下
@forcoding 全自动
```

## 更新

### Git 安装

```bash
cd ~/.config/opencode/forcoding
git pull
```

重启 OpenCode。

### CLI 更新

```bash
cd /path/to/forcoding
git pull
node install.mjs    # 重新复制到配置目录
```

重启 OpenCode。

### 本地文件安装

重新复制文件覆盖，然后执行：

```bash
node install.mjs
```

### ⚠️ 重要：子智能体注册

OpenCode 的 `task` 工具从 `~/.config/opencode/agents/` 目录发现子智能体（`mode: subagent`）。ForCoding 的 agent `.md` 文件必须同时存在于**两个位置**：

| 位置 | 用途 |
|:-----|:-----|
| `~/.config/opencode/forcoding/agents/` | 插件文件（源） |
| `~/.config/opencode/agents/` | OpenCode 子智能体发现（必须） |

手动同步时务必使用完整命令：

```powershell
# 完整同步（插件目录 + 全局 agents 目录）
$src="/path/to/forcoding"
Copy-Item -Path "$src\*" -Destination "$env:USERPROFILE\.config\opencode\forcoding\" -Recurse -Force -Exclude ".git"
Copy-Item -Path "$src\agents\*.md" -Destination "$env:USERPROFILE\.config\opencode\agents\" -Force
```

## 故障排查

### 插件未加载

1. 检查日志
2. 确认 `opencode.json` 中的 plugin 路径正确
3. 确保 OpenCode 版本较新

### 智能体未发现

使用 `skill` 工具列出可用的智能体。如果 `@forcoding` 不可见，检查：
- `agents/` 目录是否存在
- 文件扩展名是否为 `.md`

### 技能未发现

使用 `skill` 工具列出已发现的技能。检查是否包含 `forcoding-*` 开头的技能。
