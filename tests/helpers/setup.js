import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const tempDirs = [];

export function createTempDir() {
  const dir = join(tmpdir(), `forcoding-test-${Date.now()}-${Math.random().toString(36).slice(2,8)}`);
  mkdirSync(dir, { recursive: true });
  tempDirs.push(dir);
  return dir;
}

export function cleanupTempDir(dir) {
  if (dir && existsSync(dir)) {
    try { rmSync(dir, { recursive: true, force: true }); } catch (_) {}
  }
}

export function cleanupAllTempDirs() {
  for (const dir of tempDirs) cleanupTempDir(dir);
  tempDirs.length = 0;
}

export function createMockState(overrides = {}) {
  return {
    sessionId: 'test-session',
    currentState: 'idle',
    previousState: null,
    classification: null,
    classificationLocked: false,
    auditCycles: 0,
    buildRetries: 0,
    buildTruncated: false,
    paused: false,
    estimatedTokens: 0,
    scopeThreshold: 1,
    ...overrides,
  };
}

export function createMockClassification(overrides = {}) {
  return {
    taskType: 'web-ui',
    confidence: 'high',
    weight: 'standard',
    tags: { domain: 'frontend', form: 'single-page', framework: 'vanilla', lifecycle: 'greenfield' },
    techStack: { framework: 'vanilla', runtime: 'node' },
    subsystems: 2,
    workflow: ['discovery', 'build', 'rsi'],
    ...overrides,
  };
}
