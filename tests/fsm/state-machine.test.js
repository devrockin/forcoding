import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { StateMachine } from '../../src/fsm/state-machine.js';
import { StateStore } from '../../src/fsm/state-store.js';
import { STATE } from '../../src/fsm/transitions.js';
import {
  IllegalTransitionError,
  GateMissingError,
  CycleLimitExceededError,
} from '../../src/fsm/errors.js';
import { createTempDir, cleanupTempDir } from '../helpers/setup.js';

function createMockGateSystem(gatesDir) {
  return {
    gatesDir,
    create: vi.fn().mockResolvedValue({ verdict: 'APPROVED' }),
  };
}

function createGateFile(gatesDir, sessionId, stage) {
  const fp = join(gatesDir, sessionId + '.' + stage + '.approved');
  writeFileSync(fp, JSON.stringify({ verdict: 'APPROVED' }), 'utf8');
}

function readStateFile(store, sessionId) {
  const fp = store.getFilePath(sessionId);
  if (!existsSync(fp)) return null;
  return JSON.parse(readFileSync(fp, 'utf8'));
}

describe('StateMachine', () => {
  let tempDir;
  let gatesDir;
  let store;
  let gates;
  let sm;

  beforeEach(() => {
    tempDir = createTempDir();
    gatesDir = join(tempDir, 'docs', 'forcoding', 'gates');
    mkdirSync(gatesDir, { recursive: true });
    store = new StateStore(tempDir);
    gates = createMockGateSystem(gatesDir);

    // Work around: store.update(updates) is called without sessionId param
    // by transition/forceTransition. Patch update to fallback to updates.sessionId.
    const origUpdate = store.update.bind(store);
    vi.spyOn(store, 'update').mockImplementation(async (updates, sessionId) => {
      const sid = sessionId || updates.sessionId;
      return origUpdate(updates, sid);
    });

    sm = new StateMachine(store, gates);
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  // ─── Constructor ────────────────────────────────────────────────
  describe('constructor', () => {
    it('sets store, gates, and empty listeners', () => {
      expect(sm.store).toBe(store);
      expect(sm.gates).toBe(gates);
      expect(sm.listeners).toEqual([]);
    });
  });

  // ─── validateTransition ─────────────────────────────────────────
  describe('validateTransition', () => {
    it('allows valid transition from IDLE to CLASSIFYING', () => {
      expect(() => sm.validateTransition(STATE.IDLE, STATE.CLASSIFYING)).not.toThrow();
    });

    it('rejects invalid transition from IDLE to BUILD', () => {
      expect(() => sm.validateTransition(STATE.IDLE, STATE.BUILD)).toThrow(IllegalTransitionError);
    });

    it('rejects invalid transition from PLAN to DESIGN', () => {
      expect(() => sm.validateTransition(STATE.PLAN, STATE.DESIGN)).toThrow(IllegalTransitionError);
    });

    it('IllegalTransitionError contains from and to', () => {
      try {
        sm.validateTransition(STATE.IDLE, STATE.BUILD);
      } catch (err) {
        expect(err.from).toBe(STATE.IDLE);
        expect(err.to).toBe(STATE.BUILD);
      }
    });
  });

  // ─── transition ─────────────────────────────────────────────────
  describe('transition', () => {
    it('succeeds for a valid IDLE to CLASSIFYING transition', async () => {
      await sm.transition(STATE.IDLE, STATE.CLASSIFYING, 'basic-test');
      const state = readStateFile(store, 'basic-test');
      expect(state).not.toBeNull();
      expect(state.currentState).toBe(STATE.CLASSIFYING);
      expect(state.previousState).toBe(STATE.IDLE);
    });

    it('updates previousState and transitionAt', async () => {
      await sm.transition(STATE.IDLE, STATE.CLASSIFYING, 'ts-test');
      const state = readStateFile(store, 'ts-test');
      expect(state.previousState).toBe(STATE.IDLE);
      expect(state.transitionAt).toBeDefined();
      expect(typeof state.transitionAt).toBe('number');
    });

    it('calls gates.create for the target stage', async () => {
      await sm.transition(STATE.IDLE, STATE.CLASSIFYING, 'gate-call-test');
      expect(gates.create).toHaveBeenCalledWith(STATE.CLASSIFYING, { verdict: 'APPROVED' });
    });

    it('throws IllegalTransitionError for invalid transition', async () => {
      await expect(
        sm.transition(STATE.IDLE, STATE.BUILD, 'invalid-test')
      ).rejects.toThrow(IllegalTransitionError);
    });

    it('throws GateMissingError when upstream gate is missing', async () => {
      await expect(
        sm.transition(STATE.DISCOVERY, STATE.DESIGN, 'no-gate-test')
      ).rejects.toThrow(GateMissingError);
    });

    it('succeeds when upstream gate exists', async () => {
      createGateFile(gatesDir, 'gate-ok-test', STATE.DISCOVERY);
      await sm.transition(STATE.DISCOVERY, STATE.DESIGN, 'gate-ok-test');
      const state = readStateFile(store, 'gate-ok-test');
      expect(state.currentState).toBe(STATE.DESIGN);
    });

    it('fires onTransition listeners', async () => {
      const listener = vi.fn();
      sm.onTransition(listener);
      await sm.transition(STATE.IDLE, STATE.CLASSIFYING, 'listener-test');
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({
        from: STATE.IDLE,
        to: STATE.CLASSIFYING,
        sessionId: 'listener-test',
      });
    });
  });

  // ─── Cycle limit ────────────────────────────────────────────────
  describe('cycle limit', () => {
    it('throws CycleLimitExceededError on 4th BUILD<->AUDIT cycle', async () => {
      const sessionId = 'cycle-limit-test';
      await store.save({
        sessionId,
        currentState: STATE.AUDIT,
        previousState: STATE.BUILD,
        auditCycles: 3,
      });
      createGateFile(gatesDir, sessionId, STATE.DISCOVERY);
      await expect(
        sm.transition(STATE.AUDIT, STATE.BUILD, sessionId)
      ).rejects.toThrow(CycleLimitExceededError);
    });

    it('allows transition within cycle limit', async () => {
      const sessionId = 'cycle-ok-test';
      await store.save({
        sessionId,
        currentState: STATE.AUDIT,
        previousState: STATE.BUILD,
        auditCycles: 1,
      });
      createGateFile(gatesDir, sessionId, STATE.DISCOVERY);
      await sm.transition(STATE.AUDIT, STATE.BUILD, sessionId);
      const state = readStateFile(store, sessionId);
      expect(state.currentState).toBe(STATE.BUILD);
      expect(state.auditCycles).toBe(2);
    });
  });

  // ─── forceTransition ────────────────────────────────────────────
  describe('forceTransition', () => {
    it('skips validation for invalid transition', async () => {
      const sessionId = 'force-test';
      await sm.forceTransition(STATE.IDLE, STATE.BUILD, sessionId);
      const state = readStateFile(store, sessionId);
      expect(state.currentState).toBe(STATE.BUILD);
    });

    it('marks state as forcedTransition', async () => {
      const sessionId = 'force-flag-test';
      await sm.forceTransition(STATE.IDLE, STATE.CLASSIFYING, sessionId);
      const state = readStateFile(store, sessionId);
      expect(state.forcedTransition).toBe(true);
    });

    it('creates gate for the target state', async () => {
      const sessionId = 'force-gate-test';
      await sm.forceTransition(STATE.IDLE, STATE.DESIGN, sessionId);
      expect(gates.create).toHaveBeenCalledWith(STATE.DESIGN, { verdict: 'APPROVED' });
    });

    it('fires listeners with forced flag', async () => {
      const listener = vi.fn();
      sm.onTransition(listener);
      const sessionId = 'force-listener-test';
      await sm.forceTransition(STATE.IDLE, STATE.CLASSIFYING, sessionId);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ forced: true, from: STATE.IDLE, to: STATE.CLASSIFYING })
      );
    });
  });

  // ─── canDispatch ────────────────────────────────────────────────
  describe('canDispatch', () => {
    it('forcoding-builder can dispatch when in BUILD state', async () => {
      const sessionId = 'dispatch-builder';
      await store.save({ sessionId, currentState: STATE.BUILD });
      expect(sm.canDispatch('forcoding-builder', sessionId)).toBe(true);
    });

    it('forcoding-auditor can dispatch when in AUDIT state', async () => {
      const sessionId = 'dispatch-auditor';
      await store.save({ sessionId, currentState: STATE.AUDIT });
      expect(sm.canDispatch('forcoding-auditor', sessionId)).toBe(true);
    });

    it('forcoding-builder cannot dispatch when in IDLE state', async () => {
      const sessionId = 'dispatch-no';
      await store.save({ sessionId, currentState: STATE.IDLE });
      expect(sm.canDispatch('forcoding-builder', sessionId)).toBe(false);
    });

    it('returns false for unknown agents', () => {
      const sessionId = 'dispatch-unknown';
      store.load(sessionId);
      expect(sm.canDispatch('unknown-agent', sessionId)).toBe(false);
    });
  });

  // ─── getNextStep ────────────────────────────────────────────────
  describe('getNextStep', () => {
    it('returns next stage from IDLE', async () => {
      const sessionId = 'next-idle';
      await store.save({ sessionId, currentState: STATE.IDLE });
      const next = sm.getNextStep(sessionId);
      expect(next.stage).toBe(STATE.CLASSIFYING);
      expect(next.agents).toEqual([]);
    });

    it('returns DESIGN and matching agents from DISCOVERY', async () => {
      const sessionId = 'next-discovery';
      await store.save({ sessionId, currentState: STATE.DISCOVERY });
      const next = sm.getNextStep(sessionId);
      expect(next.stage).toBe(STATE.DESIGN);
      expect(next.agents).toContain('forcoding-designer');
      expect(next.agents).toContain('forcoding-scout');
      expect(next.agents).toContain('forcoding-drafter');
    });

    it('returns DONE with empty agents when at last phase', async () => {
      const sessionId = 'next-done';
      await store.save({ sessionId, currentState: STATE.RSI });
      const next = sm.getNextStep(sessionId);
      expect(next.stage).toBe(STATE.DONE);
      expect(next.agents).toEqual([]);
    });
  });

  // ─── autoAdvance ────────────────────────────────────────────────
  describe('autoAdvance', () => {
    it('auto-advances BUILD to AUDIT', async () => {
      const sessionId = 'auto-build';
      await store.save({ sessionId, currentState: STATE.BUILD });
      createGateFile(gatesDir, sessionId, STATE.BUILD);
      const result = await sm.autoAdvance(STATE.BUILD, STATE.AUDIT, sessionId);
      expect(result).toBe(true);
      const state = readStateFile(store, sessionId);
      expect(state.currentState).toBe(STATE.AUDIT);
    });

    it('returns false for non-matching transition', async () => {
      const sessionId = 'auto-no-match';
      await store.save({ sessionId, currentState: STATE.BUILD });
      const result = await sm.autoAdvance(STATE.BUILD, STATE.BUILD_RECOVERY, sessionId);
      expect(result).toBe(false);
      const state = readStateFile(store, sessionId);
      expect(state.currentState).toBe(STATE.BUILD);
    });

    it('validates gate when auto-advancing BUILD to AUDIT', async () => {
      const sessionId = 'auto-build-to-audit';
      await store.save({ sessionId, currentState: STATE.BUILD });
      createGateFile(gatesDir, sessionId, STATE.DISCOVERY);
      createGateFile(gatesDir, sessionId, STATE.BUILD);
      const result = await sm.autoAdvance(STATE.BUILD, STATE.AUDIT, sessionId);
      expect(result).toBe(true);
    });
  });

  // ─── onTransition ───────────────────────────────────────────────
  describe('onTransition', () => {
    it('registers a listener that fires on transition', async () => {
      const listener = vi.fn();
      sm.onTransition(listener);
      expect(sm.listeners).toContain(listener);
    });

    it('supports multiple listeners', async () => {
      const l1 = vi.fn();
      const l2 = vi.fn();
      sm.onTransition(l1);
      sm.onTransition(l2);
      await sm.transition(STATE.IDLE, STATE.CLASSIFYING, 'multi-listener');
      expect(l1).toHaveBeenCalledTimes(1);
      expect(l2).toHaveBeenCalledTimes(1);
    });
  });

  // ─── resetCycle ─────────────────────────────────────────────────
  describe('resetCycle', () => {
    it('resets auditCycles to 0', async () => {
      const sessionId = 'reset-test';
      await store.save({ sessionId, currentState: STATE.AUDIT, auditCycles: 3 });
      await sm.resetCycle(sessionId);
      const state = readStateFile(store, sessionId);
      expect(state.auditCycles).toBe(0);
    });
  });
});
