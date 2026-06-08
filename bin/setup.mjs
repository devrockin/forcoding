#!/usr/bin/env node
/**
 * ForCoding 跨平台安装工具
 *
 * 用法:
 *   node bin/setup.mjs            安装 ForCoding 到 ~/.config/opencode/forcoding
 *   node bin/setup.mjs uninstall  卸载
 *
 * 等同于:
 *   node bin/forcoding.mjs install
 *   node bin/forcoding.mjs uninstall
 */

import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.resolve(__dirname, 'forcoding.mjs');
const args = process.argv.slice(2);
const subcommand = args[0] === 'uninstall' ? 'uninstall' : 'install';

try {
  execSync(`node "${cliPath}" ${subcommand}`, { stdio: 'inherit' });
} catch (err) {
  process.exit(err.status || 1);
}
