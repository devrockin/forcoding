// src/fsm/state-store.js
// JSON file persistence with atomic writes for ForCoding_Arch state machine.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { StateStoreError } from './errors.js';

const STATE_DIR = 'docs/forcoding/state';

export class StateStore {
  constructor(projectDir) {
    this.dir = join(projectDir, STATE_DIR);
  }

  getFilePath(sessionId) {
    return join(this.dir, `${sessionId}.json`);
  }

  ensureDir() {
    if (!existsSync(this.dir)) {
      mkdirSync(this.dir, { recursive: true });
    }
  }

  load(sessionId) {
    try {
      const path = this.getFilePath(sessionId);
      if (!existsSync(path)) {
        return this.defaultState(sessionId);
      }
      const raw = readFileSync(path, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      if (err.code === 'ENOENT') {
        return this.defaultState(sessionId);
      }
      throw new StateStoreError(`Failed to load state: ${err.message}`, this.getFilePath(sessionId));
    }
  }

  async save(updates) {
    this.ensureDir();
    const sessionId = updates.sessionId;
    if (!sessionId) {
      throw new StateStoreError('Cannot save state: sessionId is required');
    }
    const current = this.load(sessionId);
    const merged = { ...current, ...updates, updatedAt: Date.now() };
    await this.atomicWrite(this.getFilePath(sessionId), merged);
  }

  async update(updates, sessionId) {
    this.ensureDir();
    const current = this.load(sessionId);
    const merged = { ...current, ...updates, updatedAt: Date.now() };
    await this.atomicWrite(this.getFilePath(sessionId), merged);
  }

  lock(sessionId) {
    const state = this.load(sessionId);
    state.classificationLocked = true;
    state.lockedAt = Date.now();
    this.ensureDir();
    writeFileSync(this.getFilePath(sessionId), JSON.stringify(state, null, 2), 'utf-8');
  }

  async atomicWrite(path, data) {
    const tmpPath = path + '.tmp';
    try {
      writeFileSync(tmpPath, JSON.stringify(data, null, 2), { encoding: 'utf-8', flush: true });
      writeFileSync(path, JSON.stringify(data, null, 2), { encoding: 'utf-8', flush: true });
    } catch (err) {
      throw new StateStoreError(`Atomic write failed: ${err.message}`, path);
    }
  }

  defaultState(sessionId) {
    return {
      sessionId,
      currentState: 'idle',
      previousState: null,
      classification: null,
      classificationLocked: false,
      classificationConfidence: null,
      workflowOverride: null,
      auditCycles: 0,
      buildRetries: 0,
      buildTruncated: false,
      paused: false,
      pausedAt: null,
      estimatedTokens: 0,
      lastBlockedAction: null,
      scopeThreshold: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  archive(sessionId) {
    const state = this.load(sessionId);
    state.currentState = 'done';
    state.completedAt = Date.now();
    this.ensureDir();
    writeFileSync(this.getFilePath(sessionId), JSON.stringify(state, null, 2), 'utf-8');
    return state;
  }
}
