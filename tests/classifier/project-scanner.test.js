import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectScanner } from '../../src/classifier/project-scanner.js';
import { createTempDir, cleanupTempDir } from '../helpers/setup.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('ProjectScanner', () => {
  let tempDir;
  let scanner;

  beforeEach(() => {
    // Use a dir without "test" in path to avoid false detectTests matches
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fcng-'));
    scanner = new ProjectScanner();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('scan empty dir returns hasFiles=false', () => {
    const result = scanner.scan(path.join(tempDir, 'empty'));
    expect(result.hasFiles).toBe(false);
    expect(result.fileCount).toBe(0);
    expect(result.projectType).toBe('greenfield');
  });

  it('scan non-existent dir returns hasFiles=false', () => {
    const result = scanner.scan(path.join(tempDir, 'nonexistent'));
    expect(result.hasFiles).toBe(false);
    expect(result.fileCount).toBe(0);
  });

  it('scan with files returns hasFiles=true and fileCount', () => {
    fs.writeFileSync(path.join(tempDir, 'index.html'), '<html></html>', 'utf-8');
    fs.writeFileSync(path.join(tempDir, 'app.js'), 'console.log("hi");', 'utf-8');
    fs.writeFileSync(path.join(tempDir, 'style.css'), 'body {}', 'utf-8');

    const result = scanner.scan(tempDir);
    expect(result.hasFiles).toBe(true);
    expect(result.fileCount).toBe(3);
  });

  it('detects HTML files', () => {
    fs.writeFileSync(path.join(tempDir, 'index.html'), '', 'utf-8');
    fs.writeFileSync(path.join(tempDir, 'page.htm'), '', 'utf-8');

    const result = scanner.scan(tempDir);
    expect(result.htmlFiles).toBe(2);
  });

  it('detects JS files', () => {
    fs.writeFileSync(path.join(tempDir, 'app.js'), '', 'utf-8');
    fs.writeFileSync(path.join(tempDir, 'module.mjs'), '', 'utf-8');
    fs.writeFileSync(path.join(tempDir, 'lib.cjs'), '', 'utf-8');

    const result = scanner.scan(tempDir);
    expect(result.jsFiles).toBe(3);
  });

  it('detects CSS files', () => {
    fs.writeFileSync(path.join(tempDir, 'style.css'), '', 'utf-8');
    fs.writeFileSync(path.join(tempDir, 'custom.scss'), '', 'utf-8');

    const result = scanner.scan(tempDir);
    expect(result.cssFiles).toBe(2);
  });

  it('detects config files', () => {
    fs.writeFileSync(path.join(tempDir, 'package.json'), '{}', 'utf-8');
    fs.writeFileSync(path.join(tempDir, 'config.yaml'), '', 'utf-8');
    fs.writeFileSync(path.join(tempDir, 'docker-compose.yml'), '', 'utf-8');
    fs.writeFileSync(path.join(tempDir, 'rust.toml'), '', 'utf-8');

    const result = scanner.scan(tempDir);
    expect(result.configFiles).toBe(4);
  });

  it('detects test files', () => {
    fs.mkdirSync(path.join(tempDir, '__tests__'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, '__tests__', 'app.test.js'), '', 'utf-8');

    const result = scanner.scan(tempDir);
    expect(result.hasTests).toBe(true);
  });

  it('detects spec test files', () => {
    fs.writeFileSync(path.join(tempDir, 'foo.spec.js'), '', 'utf-8');

    const result = scanner.scan(tempDir);
    expect(result.hasTests).toBe(true);
  });

  it('walk skips node_modules directory', () => {
    fs.mkdirSync(path.join(tempDir, 'node_modules'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'node_modules', 'react.js'), '', 'utf-8');
    fs.writeFileSync(path.join(tempDir, 'app.js'), '', 'utf-8');

    const result = scanner.scan(tempDir);
    expect(result.fileCount).toBe(1);
    expect(result.jsFiles).toBe(1);
  });

  it('walk skips .git directory', () => {
    fs.mkdirSync(path.join(tempDir, '.git'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, '.git', 'HEAD'), '', 'utf-8');
    fs.writeFileSync(path.join(tempDir, 'index.html'), '', 'utf-8');

    const result = scanner.scan(tempDir);
    expect(result.fileCount).toBe(1);
  });

  it('walk skips dist directory', () => {
    fs.mkdirSync(path.join(tempDir, 'dist'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'dist', 'bundle.js'), '', 'utf-8');
    fs.writeFileSync(path.join(tempDir, 'readme.md'), '', 'utf-8');

    const result = scanner.scan(tempDir);
    expect(result.fileCount).toBe(1);
  });

  it('walk skips build directory', () => {
    fs.mkdirSync(path.join(tempDir, 'build'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'build', 'output.js'), '', 'utf-8');
    fs.writeFileSync(path.join(tempDir, 'index.html'), '', 'utf-8');

    const result = scanner.scan(tempDir);
    expect(result.fileCount).toBe(1);
  });

  it('handles nested directory structure', () => {
    fs.mkdirSync(path.join(tempDir, 'components'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, 'utils'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'index.html'), '', 'utf-8');
    fs.writeFileSync(path.join(tempDir, 'components', 'App.js'), '', 'utf-8');
    fs.writeFileSync(path.join(tempDir, 'utils', 'helper.js'), '', 'utf-8');

    const result = scanner.scan(tempDir);
    expect(result.hasFiles).toBe(true);
    expect(result.fileCount).toBe(3);
    expect(result.jsFiles).toBe(2);
    expect(result.htmlFiles).toBe(1);
  });

  it('detects Python test files', () => {
    fs.writeFileSync(path.join(tempDir, 'test_app.py'), '', 'utf-8');

    const result = scanner.scan(tempDir);
    expect(result.hasTests).toBe(true);
  });

  it('non-test-named files do not trigger hasTests', () => {
    fs.writeFileSync(path.join(tempDir, 'index.js'), '', 'utf-8');
    fs.writeFileSync(path.join(tempDir, 'style.css'), '', 'utf-8');

    const result = scanner.scan(tempDir);
    expect(result.hasTests).toBe(false);
  });
});
