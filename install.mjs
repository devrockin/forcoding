#!/usr/bin/env node
/**
 * ForCoding — 跨平台安装入口
 *
 * 用法:
 *   node install.mjs                安装 ForCoding
 *   node install.mjs uninstall      卸载 ForCoding
 *   node install.mjs skills         检查并安装外部技能
 *   node install.mjs skills --list  列出所有技能依赖
 *   node install.mjs --help         帮助
 *
 * 跨平台: Windows / macOS / Linux
 * 零依赖，仅使用 Node.js 内置模块。
 */

import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));
const VERSION = pkg.version;

const CONFIG_DIR = path.join(os.homedir(), '.config', 'opencode');
const FORCODING_DIR = path.join(CONFIG_DIR, 'forcoding');
const OPENCODE_JSON = path.join(CONFIG_DIR, 'opencode.json');
const SKILLS_DIR = path.join(CONFIG_DIR, 'skills');

function showHelp() {
  console.log(`ForCoding v${VERSION} — 跨平台安装工具

用法:
  node install.mjs              安装 ForCoding
  node install.mjs uninstall    卸载 ForCoding
  node install.mjs skills       检查并安装外部技能
  node install.mjs skills --list 列出所有技能依赖
  node install.mjs --help       显示此帮助

子命令:
  install    复制文件到配置目录并注册插件（默认）
  uninstall  删除安装目录并取消插件注册
  skills     管理外部技能依赖
`);
}

// ─── 安装 ────────────────────────────────────────────────────────

function cmdInstall() {
  console.log(`ForCoding v${VERSION} — 安装\n`);

  // 1. 复制文件
  if (fs.existsSync(FORCODING_DIR)) {
    console.log('  ⚠️  检测到已安装，覆盖...');
    fs.rmSync(FORCODING_DIR, { recursive: true, force: true });
  }

  const entries = fs.readdirSync(__dirname, { withFileTypes: true });
  const exclude = new Set(['.git', 'node_modules']);
  for (const entry of entries) {
    if (exclude.has(entry.name)) continue;
    const src = path.join(__dirname, entry.name);
    const dest = path.join(FORCODING_DIR, entry.name);
    if (entry.isDirectory()) {
      fs.cpSync(src, dest, { recursive: true });
    } else {
      fs.cpSync(src, dest);
    }
  }
  console.log(`  ✅ 已复制到: ${FORCODING_DIR}`);

  // 2. 注册插件
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
    console.log('  ✅ 已注册到 opencode.json');
  } else {
    console.log('  ⏭️  已在 opencode.json 中');
  }

  // 3. 技能检测
  console.log('\n  ─── 外部技能检测 ───');
  const skillManifest = loadSkillManifest();
  if (skillManifest) {
    checkExternalSkills(skillManifest);
  }

  console.log(`\n✅ 安装完成！请重启 OpenCode 后使用:

  @forcoding 你的需求
  @forcoding 全自动

如果你需要使用技能管理功能:
  node install.mjs skills --list
`);
}

// ─── 卸载 ────────────────────────────────────────────────────────

function cmdUninstall() {
  console.log('ForCoding — 卸载\n');

  if (fs.existsSync(FORCODING_DIR)) {
    fs.rmSync(FORCODING_DIR, { recursive: true, force: true });
    console.log(`  ✅ 已删除: ${FORCODING_DIR}`);
  } else {
    console.log('  ⏭️  未安装');
  }

  if (fs.existsSync(OPENCODE_JSON)) {
    const config = JSON.parse(fs.readFileSync(OPENCODE_JSON, 'utf-8'));
    config.plugin = (config.plugin || []).filter(p => !p.includes('forcoding'));
    fs.writeFileSync(OPENCODE_JSON, JSON.stringify(config, null, 2), 'utf-8');
    console.log('  ✅ 已从 opencode.json 移除插件引用');
  }

  console.log('\n✅ 卸载完成');
}

// ─── 技能管理 ────────────────────────────────────────────────────

function loadSkillManifest() {
  const manifestPath = path.join(__dirname, 'skills.json');
  if (!fs.existsSync(manifestPath)) {
    console.log('  ⚠️  未找到 skills.json');
    return null;
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
}

function findInstalledSkills() {
  const installed = new Set();

  // 扫描 OpenCode 标准技能路径
  const skillPaths = [
    SKILLS_DIR,
    path.join(CONFIG_DIR, 'forcoding', 'skills'),
  ];

  // 从 opencode.json 读取自定义 skill paths
  if (fs.existsSync(OPENCODE_JSON)) {
    try {
      const config = JSON.parse(fs.readFileSync(OPENCODE_JSON, 'utf-8'));
      if (config.skills?.paths) {
        for (const p of config.skills.paths) {
          const resolved = p.replace(/^~/, os.homedir());
          if (fs.existsSync(resolved)) skillPaths.push(resolved);
        }
      }
    } catch {}
  }

  // 扫描插件目录中的技能
  const pluginDir = path.join(CONFIG_DIR, 'node_modules');
  if (fs.existsSync(pluginDir)) {
    for (const pkg of fs.readdirSync(pluginDir)) {
      const skillDir = path.join(pluginDir, pkg, 'skills');
      if (fs.existsSync(skillDir)) skillPaths.push(skillDir);
    }
  }

  // 遍历所有路径收集已安装技能
  for (const sp of skillPaths) {
    if (!fs.existsSync(sp)) continue;
    for (const entry of fs.readdirSync(sp)) {
      const skillPath = path.join(sp, entry);
      if (fs.statSync(skillPath).isDirectory() && fs.existsSync(path.join(skillPath, 'SKILL.md'))) {
        installed.add(entry);
      }
    }
  }

  return installed;
}

function checkExternalSkills(manifest) {
  const installed = findInstalledSkills();
  const allExternal = new Set();
  for (const group of Object.values(manifest.external)) {
    group.forEach(s => allExternal.add(s));
  }

  const missing = [];
  const found = [];

  for (const skill of [...allExternal].sort()) {
    if (installed.has(skill)) {
      found.push(skill);
    } else {
      missing.push(skill);
    }
  }

  console.log(`  已安装: ${found.length}/${allExternal.size}`);
  if (missing.length > 0) {
    console.log(`  缺失 ${missing.length} 个外部技能:`);
    for (const s of missing) {
      for (const [, groupInfo] of Object.entries(manifest.install_groups || {})) {
        if (groupInfo.skills?.includes(s)) {
          if (groupInfo.install) {
            console.log(`    ❌ ${s} → 安装 "${groupInfo.install}" (${groupInfo.label})`);
          } else {
            console.log(`    ⏭️  ${s} (${groupInfo.label})`);
          }
          break;
        }
      }
    }
    // 去重汇总安装建议
    const neededPlugins = new Map();
    for (const [, groupInfo] of Object.entries(manifest.install_groups || {})) {
      const hasMissing = groupInfo.skills?.some(s => missing.includes(s));
      if (hasMissing && groupInfo.install) {
        // 检查插件是否已注册到 opencode.json
        let alreadyInstalled = false;
        if (fs.existsSync(OPENCODE_JSON)) {
          try {
            const config = JSON.parse(fs.readFileSync(OPENCODE_JSON, 'utf-8'));
            const plugins = config.plugin || [];
            alreadyInstalled = plugins.some(p => p.includes(groupInfo.install));
          } catch {}
        }
        if (!alreadyInstalled) {
          neededPlugins.set(groupInfo.install, groupInfo.label);
        }
      }
    }

    if (neededPlugins.size > 0) {
      console.log('\n  需要安装的插件:');
      for (const [install, label] of neededPlugins) {
        console.log(`    \`"plugin": ["${install}"]\`  ← ${label}`);
      }
      console.log('\n  添加到 opencode.json 的 plugin 数组后重启 OpenCode。');
      console.log('  重启后再次运行: node install.mjs skills');
    } else {
      console.log('\n  ✅ 缺失技能对应的插件已注册，重启 OpenCode 即可生效。');
    }
  } else {
    console.log('  ✅ 所有外部技能已就绪');
  }
}

function cmdSkills(args) {
  console.log(`ForCoding v${VERSION} — 技能管理\n`);

  const manifest = loadSkillManifest();
  if (!manifest) {
    console.error('  ❌ skills.json 未找到');
    return 1;
  }

  if (args.includes('--list')) {
    console.log('  ─── 内置技能 (7) ───');
    for (const s of manifest.forcoding_builtin) {
      console.log(`    ✅ ${s} (已捆绑)`);
    }
    console.log();

    for (const [, groupInfo] of Object.entries(manifest.install_groups || {})) {
      const status = groupInfo.install ? '⬜' : '✅';
      console.log(`  ─── ${groupInfo.label} (${groupInfo.skills.length}) ───`);
      if (groupInfo.install) console.log(`      插件: "${groupInfo.install}"`);
      for (const s of groupInfo.skills) {
        const mark = groupInfo.install ? '⬜' : '✅';
        console.log(`    ${mark} ${s}`);
      }
      console.log();
    }

    console.log('  安装方式:');
    console.log('    将插件名添加到 opencode.json 的 plugin 数组，重启 OpenCode。');
    console.log('    或运行: node install.mjs skills');
    return 0;
  }

  // Default: check
  checkExternalSkills(manifest);
  return 0;
}

// ─── 主入口 ────────────────────────────────────────────────────

function main() {
  const arg = process.argv[2];

  if (!arg || arg === '--help' || arg === '-h') {
    showHelp();
    return 0;
  }

  if (arg === 'uninstall') {
    return cmdUninstall();
  }

  if (arg === 'skills') {
    return cmdSkills(process.argv.slice(3));
  }

  if (arg === 'install' || arg.startsWith('--')) {
    return cmdInstall();
  }

  console.error(`未知参数: ${arg}\n`);
  showHelp();
  return 1;
}

process.exitCode = main();
