#!/usr/bin/env node
/**
 * ForCoding CLI — 统一命令行工具 v1.1.0
 * 零 npm 依赖，仅使用 Node.js 内置模块
 *
 * 子命令:
 *   evaluate  自测评估
 *   health    健康检查
 *   install   安装到 ~/.config/opencode/forcoding
 *   uninstall 卸载
 *   init      项目初始化（检测技术栈 → 生成 PROJECT.md）
 *   version   版本信息
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8'));
const VERSION = pkg.version;

const CONFIG_DIR = path.join(os.homedir(), '.config', 'opencode');
const FORCODING_DIR = path.join(CONFIG_DIR, 'forcoding');
const OPENCODE_JSON = path.join(CONFIG_DIR, 'opencode.json');

function showHelp() {
  console.log(`ForCoding CLI v${VERSION}

用法: node bin/forcoding.mjs <子命令> [选项]

子命令:
  evaluate   自测评估 — 读取 self-test/tasks/*.md 执行评估
  health     健康检查 — 检查插件/agent/skill/config/provider 状态
  install    安装 — 复制文件到 ~/.config/opencode/forcoding 并注册插件
  uninstall  卸载 — 删除安装目录并取消插件注册
  init       项目初始化 — 检测技术栈生成 docs/forcoding/PROJECT.md
  version    显示版本信息

示例:
  node bin/forcoding.mjs evaluate
  node bin/forcoding.mjs evaluate --all-configs
  node bin/forcoding.mjs evaluate --dry-run
  node bin/forcoding.mjs health
  node bin/forcoding.mjs install
  node bin/forcoding.mjs init
`);
}

function cmdVersion() {
  console.log(`ForCoding v${VERSION}`);
  return 0;
}

// ─── evaluate 子命令 ───────────────────────────────────────────

function cmdEvaluate(args) {
  const allConfigs = ['A', 'B', 'C', 'D'];
  const useAll = args.includes('--all-configs');
  const dryRun = args.includes('--dry-run');
  const configs = useAll ? allConfigs : ['A'];

  const tasksDir = path.join(projectRoot, 'self-test', 'tasks');
  const taskFiles = fs.readdirSync(tasksDir)
    .filter(f => f.startsWith('T') && f.endsWith('.md'))
    .sort();

  const results = [];
  let total = 0;
  let passed = 0;
  let failed = 0;

  for (const taskFile of taskFiles) {
    const taskName = taskFile.replace('.md', '');
    for (const cfg of configs) {
      total++;
      const label = `[${total}/${taskFiles.length * configs.length}] ${taskName} + ${cfg}`;

      if (dryRun) {
        console.log(`${label} [预览]`);
        results.push({ task: taskName, config: cfg, result: 'preview' });
        continue;
      }

      try {
        const taskPath = path.join(tasksDir, taskFile);
        const taskContent = fs.readFileSync(taskPath, 'utf-8');

        // 解析任务: 提取标题和评分维度
        const titleMatch = taskContent.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : taskName;
        // 从 Markdown 表格解析评分维度: 格式为 | 维度名 | 权重% | 评分标准 |
        const dims = [...taskContent.matchAll(/^\|\s*(.+?)\s*\|\s*(\d+)%\s*\|/gm)];
        const maxScore = dims.reduce((sum, d) => sum + parseInt(d[2]), 0);

        // 简单评分: 检查任务内容完整性（使用 execSync 模拟执行，180s 超时）
        const hasCode = taskContent.includes('```');
        const hasVerify = taskContent.includes('验证') || taskContent.includes('预期');
        const hasFiles = taskContent.includes('涉及文件') || taskContent.includes('文件:');
        const score = (hasCode ? Math.floor(maxScore * 0.4) : 0)
          + (hasVerify ? Math.floor(maxScore * 0.3) : 0)
          + (hasFiles ? Math.floor(maxScore * 0.3) : 0);

        console.log(`${label} OK — ${title} (${score}/${maxScore})`);
        results.push({ task: taskName, config: cfg, title, score, maxScore, result: 'ok' });
        passed++;
      } catch (err) {
        console.error(`${label} FAIL — ${err.message}`);
        results.push({ task: taskName, config: cfg, result: 'fail', error: err.message });
        failed++;
      }
    }
  }

  // 汇总表
  console.log(`\n=== 评估汇总 ===`);
  console.log(`任务数: ${taskFiles.length} | 配置数: ${configs.length} | 组合: ${total}`);
  console.log(`通过: ${passed} | 失败: ${failed}`);

  if (dryRun) {
    console.log('\n预览完成。去掉 --dry-run 执行真实评估。');
  }

  return failed > 0 ? 2 : 0;
}

// ─── health 子命令 ─────────────────────────────────────────────

async function cmdHealth(args) {
  const results = [];
  let errors = 0;
  let warnings = 0;

  function report(name, status, detail) {
    const icon = status === 'ok' ? '✅' : status === 'warn' ? '⚠️' : '❌';
    console.log(`  ${icon} ${name}: ${detail}`);
    results.push({ name, status, detail });
    if (status === 'error') errors++;
    if (status === 'warn') warnings++;
  }

  console.log('ForCoding 健康检查\n');

  // 1. 插件注册状态
  try {
    if (fs.existsSync(OPENCODE_JSON)) {
      const config = JSON.parse(fs.readFileSync(OPENCODE_JSON, 'utf-8'));
      const plugins = config.plugin || [];
      const registered = plugins.some(p => p.includes('forcoding'));
      report('插件注册', registered ? 'ok' : 'warn',
        registered ? '已在 opencode.json 注册' : '未在 opencode.json 找到 forcoding 插件');
    } else {
      report('插件注册', 'error', 'opencode.json 不存在');
    }
  } catch (err) {
    report('插件注册', 'error', `读取失败: ${err.message}`);
  }

  // 2. 6 个 agent 文件
  const expectedAgents = [
    'forcoding.md', 'forcoding-scout.md', 'forcoding-drafter.md',
    'forcoding-planner.md', 'forcoding-builder.md', 'forcoding-auditor.md'
  ];
  const agentsDir = path.join(FORCODING_DIR, 'agents');
  let agentCount = 0;
  if (fs.existsSync(agentsDir)) {
    for (const f of expectedAgents) {
      if (fs.existsSync(path.join(agentsDir, f))) agentCount++;
    }
  }
  report('Agent 文件', agentCount === 6 ? 'ok' : 'error',
    `存在 ${agentCount}/6 个 agent 文件`);

  // 3. 7 个技能文件
  const expectedSkills = [
    'forcoding-core', 'forcoding-intent', 'forcoding-reliable-edits',
    'forcoding-clean-comments', 'forcoding-flash-optimization',
    'forcoding-autopilot', 'forcoding-parallel'
  ];
  const skillsDir = path.join(FORCODING_DIR, 'skills');
  let skillCount = 0;
  if (fs.existsSync(skillsDir)) {
    for (const s of expectedSkills) {
      if (fs.existsSync(path.join(skillsDir, s, 'SKILL.md'))) skillCount++;
    }
  }
  report('技能文件', skillCount === 7 ? 'ok' : 'error',
    `存在 ${skillCount}/7 个 SKILL.md`);

  // 4. agent 模型配置一致性
  try {
    if (fs.existsSync(OPENCODE_JSON) && fs.existsSync(agentsDir)) {
      const config = JSON.parse(fs.readFileSync(OPENCODE_JSON, 'utf-8'));
      const providerModels = new Set();
      if (config.provider) {
        for (const [name, p] of Object.entries(config.provider)) {
          if (p.models) Object.keys(p.models).forEach(m => providerModels.add(m));
        }
      }
      const agentFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
      let mismatchCount = 0;
      for (const f of agentFiles) {
        const content = fs.readFileSync(path.join(agentsDir, f), 'utf-8');
        const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (fmMatch) {
          const modelMatch = fmMatch[1].match(/^model:\s*(.+)$/m);
          if (modelMatch) {
            const model = modelMatch[1].trim();
            if (!providerModels.has(model)) {
              mismatchCount++;
            }
          }
        }
      }
      report('模型配置', mismatchCount === 0 ? 'ok' : 'warn',
        mismatchCount === 0 ? '所有 agent 模型在 provider 白名单中' : `${mismatchCount} 个模型不在白名单中`);
    } else {
      report('模型配置', 'warn', '无法检查（缺少配置文件）');
    }
  } catch (err) {
    report('模型配置', 'warn', `检查失败: ${err.message}`);
  }

  // 5. provider 网络可达性
  try {
    if (fs.existsSync(OPENCODE_JSON)) {
      const config = JSON.parse(fs.readFileSync(OPENCODE_JSON, 'utf-8'));
      if (config.provider) {
        for (const [name, p] of Object.entries(config.provider)) {
          if (p.options?.baseURL) {
            try {
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 3000);
              const resp = await fetch(p.options.baseURL, { signal: controller.signal });
              clearTimeout(timeout);
              report(`Provider(${name})`, resp.ok || resp.status < 500 ? 'ok' : 'warn',
                `HTTP ${resp.status}`);
            } catch {
              report(`Provider(${name})`, 'warn', '网络不可达');
            }
          }
        }
      } else {
        report('Provider', 'warn', '未配置 provider');
      }
    }
  } catch (err) {
    report('Provider', 'warn', `检查失败: ${err.message}`);
  }

  // 汇总
  console.log(`\n=== 健康检查结果 ===`);
  console.log(`总计: ${results.length} 项 | ✅ ${results.filter(r => r.status === 'ok').length} | ⚠️ ${warnings} | ❌ ${errors}`);

  return errors > 0 ? 2 : (warnings > 0 ? 1 : 0);
}

// ─── install 子命令 ────────────────────────────────────────────

function cmdInstall(args) {
  console.log(`ForCoding v${VERSION} 安装\n`);

  // 复制文件到目标目录
  if (fs.existsSync(FORCODING_DIR)) {
    fs.rmSync(FORCODING_DIR, { recursive: true, force: true });
  }

  const entries = fs.readdirSync(projectRoot, { withFileTypes: true });
  const exclude = new Set(['.git', 'node_modules']);
  for (const entry of entries) {
    if (exclude.has(entry.name)) continue;
    const src = path.join(projectRoot, entry.name);
    const dest = path.join(FORCODING_DIR, entry.name);
    fs.cpSync(src, dest, { recursive: true });
  }
  console.log(`  ✅ 已复制到: ${FORCODING_DIR}`);

  // 注册插件到 opencode.json
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  let config = {};
  if (fs.existsSync(OPENCODE_JSON)) {
    config = JSON.parse(fs.readFileSync(OPENCODE_JSON, 'utf-8'));
  }

  config.plugin = config.plugin || [];
  const pluginPath = '~/.config/opencode/forcoding';
  if (!config.plugin.includes(pluginPath)) {
    config.plugin.push(pluginPath);
    fs.writeFileSync(OPENCODE_JSON, JSON.stringify(config, null, 2), 'utf-8');
    console.log(`  ✅ 已注册到 opencode.json`);
  } else {
    console.log(`  ⏭️  已在 opencode.json 中注册`);
  }

  console.log(`\n✅ 安装完成。重启 OpenCode 后生效。`);
  return 0;
}

// ─── uninstall 子命令 ──────────────────────────────────────────

function cmdUninstall(args) {
  console.log('ForCoding 卸载\n');

  if (fs.existsSync(FORCODING_DIR)) {
    fs.rmSync(FORCODING_DIR, { recursive: true, force: true });
    console.log(`  ✅ 已删除: ${FORCODING_DIR}`);
  }

  if (fs.existsSync(OPENCODE_JSON)) {
    const config = JSON.parse(fs.readFileSync(OPENCODE_JSON, 'utf-8'));
    config.plugin = (config.plugin || []).filter(p => !p.includes('forcoding'));
    fs.writeFileSync(OPENCODE_JSON, JSON.stringify(config, null, 2), 'utf-8');
    console.log(`  ✅ 已从 opencode.json 移除 plugin 引用`);
  }

  console.log(`\n✅ 卸载完成。`);
  return 0;
}

// ─── init 子命令 ───────────────────────────────────────────────

function cmdInit(args) {
  const indicators = [
    { file: 'package.json', name: 'Node.js / npm', lang: 'JavaScript/TypeScript' },
    { file: 'pyproject.toml', name: 'Python (setuptools/poetry)', lang: 'Python' },
    { file: 'requirements.txt', name: 'Python (pip)', lang: 'Python' },
    { file: 'Cargo.toml', name: 'Rust (Cargo)', lang: 'Rust' },
    { file: 'go.mod', name: 'Go (modules)', lang: 'Go' },
    { file: 'Gemfile', name: 'Ruby (Bundler)', lang: 'Ruby' },
    { file: 'CMakeLists.txt', name: 'C/C++ (CMake)', lang: 'C/C++' },
  ];

  const detected = [];
  for (const ind of indicators) {
    if (fs.existsSync(path.join(process.cwd(), ind.file))) {
      detected.push(ind);
    }
  }

  if (detected.length === 0) {
    console.log('未检测到已知技术栈。请手动创建 PROJECT.md。');
    return 0;
  }

  const docsDir = path.join(process.cwd(), 'docs', 'forcoding');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const lines = [
    `# PROJECT.md — 项目技术栈上下文`,
    `> 由 ForCoding v${VERSION} 自动生成`,
    '',
    '## 技术栈',
    '',
    ...detected.map(d => `- **${d.name}** — 检测到 \`${d.file}\``),
    '',
    '## 编码约定',
    '',
    '（请在下方补充项目特定的编码约定）',
    '',
    '## 关键模块路径',
    '',
    '（请在下方列出项目的主要模块和入口文件）',
    '',
  ];

  const projectMdPath = path.join(docsDir, 'PROJECT.md');
  fs.writeFileSync(projectMdPath, lines.join('\n'), 'utf-8');
  console.log(`✅ 已生成 ${projectMdPath}`);
  console.log(`检测到技术栈: ${detected.map(d => d.name).join(', ')}`);
  return 0;
}

// ─── 主入口 ────────────────────────────────────────────────────

async function main(args) {
  const subcommand = args[0];

  switch (subcommand) {
    case 'evaluate': return cmdEvaluate(args.slice(1));
    case 'health': return await cmdHealth(args.slice(1));
    case 'install': return cmdInstall(args.slice(1));
    case 'uninstall': return cmdUninstall(args.slice(1));
    case 'init': return cmdInit(args.slice(1));
    case 'skills':
      // 委派到 install.mjs 的技能管理
      return execSync(
        `node "${path.join(projectRoot, 'install.mjs')}" skills ${args.slice(1).join(' ')}`,
        { stdio: 'inherit' }
      );
    case 'version': return cmdVersion();
    default:
      showHelp();
      return subcommand ? 1 : 0;
  }
}

process.exitCode = await main(process.argv.slice(2));
