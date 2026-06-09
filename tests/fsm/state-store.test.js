import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { StateStore } from '../../src/fsm/state-store.js';
import { StateStoreError } from '../../src/fsm/errors.js';
import { createTempDir, cleanupTempDir } from '../helpers/setup.js';

describe('StateStore', () => {
  let tempDir;
  let store;

  beforeEach(() => {
    tempDir = createTempDir();
    store = new StateStore(tempDir);
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  // ─── Constructor ────────────────────────────────────────────────
  describe('constructor', () => {
    it('sets dir to projectDir/docs/forcoding/state', () => {
      expect(store.dir).toBe(join(tempDir, 'docs', 'forcoding', 'state'));
    });
  });

  // ─── getFilePath ────────────────────────────────────────────────
  describe('getFilePath', () => {
    it('returns path with sessionId.json', () => {
      const fp = store.getFilePath('abc123');
      expect(fp).toBe(join(store.dir, 'abc123.json'));
    });
  });

  // ─── load ───────────────────────────────────────────────────────
  describe('load', () => {
    it('returns defaultState for new sessions', () => {
      const state = store.load('new-session');
      expect(state.sessionId).toBe('new-session');
      expect(state.currentState).toBe('idle');
    });

    it('default state has all required fields', () => {
      const state = store.load('req-fields');
      expect(state).toHaveProperty('sessionId');
      expect(state).toHaveProperty('currentState');
      expect(state).toHaveProperty('previousState');
      expect(state).toHaveProperty('classification');
      expect(state).toHaveProperty('classificationLocked');
      expect(state).toHaveProperty('classificationConfidence');
      expect(state).toHaveProperty('auditCycles');
      expect(state).toHaveProperty('buildRetries');
      expect(state).toHaveProperty('buildTruncated');
      expect(state).toHaveProperty('paused');
      expect(state).toHaveProperty('estimatedTokens');
      expect(state).toHaveProperty('scopeThreshold');
      expect(state).toHaveProperty('createdAt');
      expect(state).toHaveProperty('updatedAt');
    });

    it('default state has correct initial values', () => {
      const state = store.load('init-vals');
      expect(state.currentState).toBe('idle');
      expect(state.previousState).toBeNull();
      expect(state.classification).toBeNull();
      expect(state.classificationLocked).toBe(false);
      expect(state.auditCycles).toBe(0);
      expect(state.buildRetries).toBe(0);
      expect(state.buildTruncated).toBe(false);
      expect(state.paused).toBe(false);
      expect(state.estimatedTokens).toBe(0);
      expect(state.scopeThreshold).toBe(1);
    });

    it('returns persisted state when file exists', () => {
      const fp = store.getFilePath('existing');
      store.ensureDir();
      writeFileSync(fp, JSON.stringify({ sessionId: 'existing', currentState: 'build' }), 'utf8');
      const state = store.load('existing');
      expect(state.sessionId).toBe('existing');
      expect(state.currentState).toBe('build');
    });

    it('throws StateStoreError on invalid JSON', () => {
      const fp = store.getFilePath('corrupt');
      store.ensureDir();
      writeFileSync(fp, '{invalid json}', 'utf8');
      expect(() => store.load('corrupt')).toThrow(StateStoreError);
    });
  });

  // ─── save ───────────────────────────────────────────────────────
  describe('save', () => {
    it('persists state to filesystem', async () => {
      await store.save({ sessionId: 'persist-test', currentState: 'classifying' });
      const fp = store.getFilePath('persist-test');
      expect(existsSync(fp)).toBe(true);
      const content = JSON.parse(readFileSync(fp, 'utf8'));
      expect(content.sessionId).toBe('persist-test');
      expect(content.currentState).toBe('classifying');
    });

    it('merges with existing data', async () => {
      await store.save({ sessionId: 'merge-test', currentState: 'idle', buildRetries: 0 });
      await store.save({ sessionId: 'merge-test', buildRetries: 2 });
      const fp = store.getFilePath('merge-test');
      const content = JSON.parse(readFileSync(fp, 'utf8'));
      expect(content.sessionId).toBe('merge-test');
      expect(content.currentState).toBe('idle');
      expect(content.buildRetries).toBe(2);
    });

    it('throws StateStoreError when sessionId is missing', async () => {
      await expect(store.save({})).rejects.toThrow(StateStoreError);
    });

    it('uses atomic write (no .tmp file left behind)', async () => {
      await store.save({ sessionId: 'atomic-test', currentState: 'build' });
      const tmpPath = store.getFilePath('atomic-test') + '.tmp';
      expect(existsSync(tmpPath)).toBe(false);
    });
  });

  // ─── update ─────────────────────────────────────────────────────
  describe('update', () => {
    it('persists updates for a sessionId', async () => {
      await store.save({ sessionId: 'update-test', currentState: 'idle' });
      await store.update({ currentState: 'classifying' }, 'update-test');
      const state = store.load('update-test');
      expect(state.currentState).toBe('classifying');
    });

    it('preserves existing fields not in update', async () => {
      await store.save({ sessionId: 'preserve-test', currentState: 'idle', auditCycles: 3 });
      await store.update({ currentState: 'build' }, 'preserve-test');
      const state = store.load('preserve-test');
      expect(state.currentState).toBe('build');
      expect(state.auditCycles).toBe(3);
    });
  });

  // ─── lock ───────────────────────────────────────────────────────
  describe('lock', () => {
    it('sets classificationLocked to true', () => {
      store.lock('lock-test');
      const state = store.load('lock-test');
      expect(state.classificationLocked).toBe(true);
    });

    it('sets lockedAt timestamp', () => {
      store.lock('lock-ts-test');
      const state = store.load('lock-ts-test');
      expect(state.lockedAt).toBeDefined();
      expect(typeof state.lockedAt).toBe('number');
    });
  });

  // ─── archive ────────────────────────────────────────────────────
  describe('archive', () => {
    it('sets currentState to done', () => {
      store.archive('archive-test');
      const state = store.load('archive-test');
      expect(state.currentState).toBe('done');
    });

    it('sets completedAt timestamp', () => {
      store.archive('archive-ts-test');
      const state = store.load('archive-ts-test');
      expect(state.completedAt).toBeDefined();
      expect(typeof state.completedAt).toBe('number');
    });

    it('returns the updated state', () => {
      const result = store.archive('archive-return');
      expect(result.currentState).toBe('done');
    });
  });

  // ─── atomicWrite ────────────────────────────────────────────────
  describe('atomicWrite', () => {
    it('writes to file and cleans up .tmp file', async () => {
      const fp = store.getFilePath('atomic-test-2');
      store.ensureDir();
      const data = { sessionId: 'atomic-test-2', value: 42 };
      await store.atomicWrite(fp, data);
      expect(existsSync(fp)).toBe(true);
      expect(existsSync(fp + '.tmp')).toBe(false);
      const content = JSON.parse(readFileSync(fp, 'utf8'));
      expect(content.value).toBe(42);
    });

    it('throws StateStoreError on failure', async () => {
      const badPath = join(tempDir, 'nonexistent_dir_deep', 'state.json');
      await expect(
        store.atomicWrite(badPath, { sessionId: 'fail' })
      ).rejects.toThrow(StateStoreError);
    });
  });

  // ─── ensureDir ──────────────────────────────────────────────────
  describe('ensureDir', () => {
    it('creates the state directory if missing', () => {
      const dir = store.dir;
      expect(existsSync(dir)).toBe(false);
      store.ensureDir();
      expect(existsSync(dir)).toBe(true);
    });
  });
});
