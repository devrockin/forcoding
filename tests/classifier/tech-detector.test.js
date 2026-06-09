import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TechDetector } from '../../src/classifier/tech-detector.js';
import { createTempDir, cleanupTempDir } from '../helpers/setup.js';
import fs from 'fs';
import path from 'path';

describe('TechDetector', () => {
  let tempDir;
  let detector;

  function setupFile(name, content) {
    const fp = path.join(tempDir, name);
    fs.mkdirSync(path.dirname(fp), { recursive: true });
    fs.writeFileSync(fp, content, 'utf-8');
  }

  beforeEach(() => {
    tempDir = createTempDir();
    detector = new TechDetector();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  it('empty dir returns vanilla, node, javascript', () => {
    const result = detector.detect(tempDir);
    expect(result.framework).toBe('vanilla');
    expect(result.runtime).toBe('node');
    expect(result.packageManager).toBe('npm');
    expect(result.language).toBe('javascript');
    expect(result.hasTypeScript).toBe(false);
  });

  it('package.json with react returns framework=react', () => {
    setupFile('package.json', JSON.stringify({
      dependencies: { react: '^18.0.0' }
    }));
    const result = detector.detect(tempDir);
    expect(result.framework).toBe('react');
  });

  it('package.json with vue returns framework=vue', () => {
    setupFile('package.json', JSON.stringify({
      dependencies: { vue: '^3.0.0' }
    }));
    const result = detector.detect(tempDir);
    expect(result.framework).toBe('vue');
  });

  it('package.json with next returns framework=nextjs', () => {
    setupFile('package.json', JSON.stringify({
      dependencies: { next: '^13.0.0' }
    }));
    const result = detector.detect(tempDir);
    expect(result.framework).toBe('nextjs');
  });

  it('package.json with express returns framework=express', () => {
    setupFile('package.json', JSON.stringify({
      dependencies: { express: '^4.0.0' }
    }));
    const result = detector.detect(tempDir);
    expect(result.framework).toBe('express');
  });

  it('devDependencies with express also detects framework', () => {
    setupFile('package.json', JSON.stringify({
      devDependencies: { express: '^4.0.0' }
    }));
    const result = detector.detect(tempDir);
    expect(result.framework).toBe('express');
  });

  it('tsconfig.json sets hasTypeScript=true', () => {
    setupFile('tsconfig.json', '{}');
    const result = detector.detect(tempDir);
    expect(result.hasTypeScript).toBe(true);
  });

  it('tsconfig.base.json sets hasTypeScript=true', () => {
    setupFile('tsconfig.base.json', '{}');
    const result = detector.detect(tempDir);
    expect(result.hasTypeScript).toBe(true);
  });

  it('requirements.txt sets language=python and runtime=python', () => {
    setupFile('requirements.txt', 'requests==2.28.0');
    const result = detector.detect(tempDir);
    expect(result.language).toBe('python');
    expect(result.runtime).toBe('python');
    expect(result.framework).toBe('fastapi');
  });

  it('pyproject.toml sets language=python', () => {
    setupFile('pyproject.toml', '[project]\nname = "test"');
    const result = detector.detect(tempDir);
    expect(result.language).toBe('python');
    expect(result.runtime).toBe('python');
  });

  it('Cargo.toml sets language=rust', () => {
    setupFile('Cargo.toml', '[package]\nname = "test"');
    const result = detector.detect(tempDir);
    expect(result.language).toBe('rust');
    expect(result.runtime).toBe('rust');
  });

  it('go.mod sets language=go', () => {
    setupFile('go.mod', 'module example.com/test');
    const result = detector.detect(tempDir);
    expect(result.language).toBe('go');
    expect(result.runtime).toBe('go');
  });

  it('package.json with typescript dependency sets hasTypeScript', () => {
    setupFile('package.json', JSON.stringify({
      devDependencies: { typescript: '^5.0.0' }
    }));
    const result = detector.detect(tempDir);
    expect(result.hasTypeScript).toBe(true);
  });

  it('package.json with electron sets runtime=electron', () => {
    setupFile('package.json', JSON.stringify({
      dependencies: { electron: '^25.0.0' }
    }));
    const result = detector.detect(tempDir);
    expect(result.runtime).toBe('electron');
  });

  it('prioritizes react over vue in dependencies', () => {
    setupFile('package.json', JSON.stringify({
      dependencies: { react: '^18.0.0', vue: '^3.0.0' }
    }));
    const result = detector.detect(tempDir);
    expect(result.framework).toBe('react');
  });

  it('handles malformed package.json gracefully', () => {
    setupFile('package.json', 'not valid json{{{');
    const result = detector.detect(tempDir);
    // Should not throw, falls back to defaults
    expect(result.framework).toBe('vanilla');
  });

  it('python project overrides framework even with package.json', () => {
    setupFile('package.json', JSON.stringify({
      dependencies: { react: '^18.0.0' }
    }));
    setupFile('requirements.txt', 'flask');
    const result = detector.detect(tempDir);
    // Last write wins — requirements.txt sets framework=fastapi, language=python
    expect(result.language).toBe('python');
    expect(result.framework).toBe('fastapi');
  });
});
