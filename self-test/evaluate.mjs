#!/usr/bin/env node
/**
 * ForCoding 自我验证 — 评估脚本（跨平台）
 *
 * 生成测试任务 × 模型配置的会话组合，用于验证模型路由策略。
 *
 * 用法:
 *   node self-test/evaluate.mjs              生成全部会话文件
 *   node self-test/evaluate.mjs --dry-run    预览
 *   node self-test/evaluate.mjs --tasks T01,T03  指定任务
 *   node self-test/evaluate.mjs --configs A,C    指定配置
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const ALL_CONFIGS = {
  A: { file: 'baseline-flash-high.json', label: '默认(Flash High+全优化)' },
  B: { file: 'test-flash-max.json',      label: 'Flash Max' },
  C: { file: 'test-pro-max.json',        label: 'Pro Max(上界)' },
  D: { file: 'test-flash-noprinciples.json', label: 'Flash High(无优化)' },
};

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { tasks: null, configs: null, dryRun: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') opts.dryRun = true;
    else if (args[i] === '--tasks' && args[i + 1]) opts.tasks = args[++i].split(',').map(s => s.trim().toUpperCase());
    else if (args[i] === '--configs' && args[i + 1]) opts.configs = args[++i].split(',').map(s => s.trim().toUpperCase());
  }
  return opts;
}

function timestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function main() {
  const opts = parseArgs();

  // 解析任务
  const tasksDir = path.join(__dirname, 'tasks');
  let allTasks = fs.readdirSync(tasksDir)
    .filter(f => f.startsWith('T') && f.endsWith('.md'))
    .sort();

  const selTasks = opts.tasks
    ? allTasks.filter(f => opts.tasks.some(t => f.toUpperCase().startsWith(t)))
    : allTasks;

  // 解析配置
  const selConfigs = opts.configs || Object.keys(ALL_CONFIGS);

  // 计算组合
  const total = selTasks.length * selConfigs.length;
  let index = 0;

  // 会话目录
  const ts = timestamp();
  const sessionDir = path.join(__dirname, 'sessions', ts);
  if (!opts.dryRun) fs.mkdirSync(sessionDir, { recursive: true });

  const indexLines = [
    `# 测试会话索引 — ${ts}`,
    '',
    '## 结果汇总',
    '',
    '| # | 任务 | 配置 | 结果 | Token(入/出) | 耗时 | 编辑纪律 | 注释 | 评分 |',
    '|:-:|:----|:---:|:----|:----------|:----|:-------|:---|:---:|',
  ];

  console.log(`\n=== ForCoding 自我验证 ===`);
  console.log(`任务: ${selTasks.length} | 配置: ${selConfigs.length} | 组合: ${total}\n`);

  for (const taskFile of selTasks) {
    const taskPath = path.join(tasksDir, taskFile);
    const taskContent = fs.readFileSync(taskPath, 'utf-8');
    const taskName = taskFile.replace('.md', '');

    for (const cfgKey of selConfigs) {
      index++;
      const cfg = ALL_CONFIGS[cfgKey];
      if (!cfg) {
        console.error(`  未知配置: ${cfgKey}`);
        continue;
      }

      const cfgPath = path.join(__dirname, 'configs', cfg.file);
      const cfgContent = fs.readFileSync(cfgPath, 'utf-8');
      let configObj;
      try { configObj = JSON.parse(cfgContent); } catch { configObj = { name: cfgKey }; }

      const label = `[${index}/${total}] ${taskName} + ${cfgKey}`;

      if (opts.dryRun) {
        console.log(`  ${label} [预览]`);
      } else {
        const sessionContent = [
          `# ForCoding 自我验证任务`,
          ``,
          `> 任务: ${taskName} | 配置: ${cfgKey} (${configObj.name || cfg.label})`,
          `> 模型: ${configObj.model || '?'} | 推理: ${configObj.reasoning_effort || 'high'}`,
          `> 组合: ${index}/${total}`,
          ``,
          `## 模型配置`,
          '```json',
          cfgContent,
          '```',
          ``,
          `## 任务定义`,
          taskContent,
          ``,
          `---`,
          ``,
          `## 执行要求`,
          `1. 在 \`forcoding.md\` 中临时修改 \`model\` 为 \`${configObj.model || ''}\``,
          `2. 严格按照任务定义执行`,
          `3. 完成后把结果填入 \`INDEX.md\` 的汇总表`,
          ``,
        ].join('\n');

        const sessionFile = path.join(sessionDir, `${taskName}-${cfgKey}.md`);
        fs.writeFileSync(sessionFile, sessionContent, 'utf-8');
        console.log(`  ${label} OK — ${cfg.label}`);
      }

      indexLines.push(`| ${index} | ${taskName} | ${cfgKey} | ? | ?/? | ? | ? | ? | ? |`);
    }
  }

  if (opts.dryRun) {
    console.log(`\n预览完成。去掉 --dry-run 生成会话文件。\n`);
    return 0;
  }

  indexLines.push(
    '',
    '## 操作步骤',
    '',
    '步骤1: 打开一个新的 OpenCode 会话',
    '步骤2: 修改 agents/forcoding.md 的 model 为当前配置的模型',
    '步骤3: 输入 @forcoding 并按会话文件执行任务',
    '步骤4: 完成后把结果填入上方汇总表',
    '步骤5: 重复下一个配置',
    '',
  );

  fs.writeFileSync(path.join(sessionDir, 'INDEX.md'), indexLines.join('\n'), 'utf-8');

  console.log(`\n=== 完成 ===`);
  console.log(`会话文件: ${sessionDir}`);
  console.log(`索引: ${sessionDir}/INDEX.md\n`);
  return 0;
}

process.exitCode = main();
