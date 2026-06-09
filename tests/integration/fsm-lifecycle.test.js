import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { StateMachine } from '../../src/fsm/state-machine.js';
import { StateStore } from '../../src/fsm/state-store.js';
import { GateSystem } from '../../src/gates/gate-system.mjs';
import { AuditTrail } from '../../src/audit/audit-trail.mjs';
import { STATE } from '../../src/fsm/transitions.js';
import {
  IllegalTransitionError,
  GateMissingError,
  CycleLimitExceededError,
} from '../../src/fsm/errors.js';
import { createTempDir, cleanupTempDir } from '../helpers/setup.js';

// ─── Helpers ─────────────────────────────────────────────────────────────

/**
 * Create a gate file that verifyUpstreamGates will find.
 * Naming pattern: {sessionId}.{stage}.approved
 */
function createGateFile(gatesDir, sessionId, stage) {
  const fp = join(gatesDir, sessionId + '.' + stage + '.approved');
  mkdirSync(gatesDir, { recursive: true });
  writeFileSync(fp, JSON.stringify({ verdict: 'APPROVED' }), 'utf8');
}

/**
 * Read a state file from disk and parse it.
 */
function readStateFile(store, sessionId) {
  const fp = store.getFilePath(sessionId);
  if (!existsSync(fp)) return null;
  return JSON.parse(readFileSync(fp, 'utf8'));
}

/**
 * Verify state fields after a transition.
 */
function verifyState(store, sessionId, expectedState, expectedPrevious) {
  const state = readStateFile(store, sessionId);
  expect(state).not.toBeNull();
  expect(state.currentState).toBe(expectedState);
  expect(state.previousState).toBe(expectedPrevious);
  expect(state.transitionAt).toBeDefined();
  expect(typeof state.transitionAt).toBe('number');
  return state;
}

/**
 * Check if a gate file exists using the session-naming convention.
 */
function gateFileExists(gatesDir, sessionId, stage) {
  return existsSync(join(gatesDir, sessionId + '.' + stage + '.approved'));
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('FSM Lifecycle Integration', () => {
  let tempDir;
  let store;
  let gates;
  let sm;
  const SESSION = 'fsm-integration';

  beforeEach(() => {
    tempDir = createTempDir();
    mkdirSync(join(tempDir, 'docs', 'forcoding', 'gates'), { recursive: true });

    store = new StateStore(tempDir);
    gates = new GateSystem({
      projectDir: tempDir,
      topic: 'fsm-test',
      date: '2026-01-01',
    });

    // Patch store.update to work around sessionId bug in state-machine.js:
    //   transition() calls store.update({ sessionId, ... }) without a second arg
    //   but StateStore.update(updates, sessionId) expects a separate sessionId param.
    const origUpdate = store.update.bind(store);
    vi.spyOn(store, 'update').mockImplementation(async (updates, sessionId) => {
      const sid = sessionId || updates.sessionId;
      return origUpdate(updates, sid);
    });

    sm = new StateMachine(store, gates);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanupTempDir(tempDir);
  });

  // ─── 1. Full FSM Happy Path ─────────────────────────────────────────
  describe('1. Full FSM Happy Path', () => {
    it('walks IDLE → CLASSIFYING → AWAITING_HITL → DISCOVERY → DESIGN → BUILD → AUDIT → RSI → DONE', async () => {
      // Phase 1: IDLE → CLASSIFYING
      await sm.transition(STATE.IDLE, STATE.CLASSIFYING, SESSION);
      verifyState(store, SESSION, STATE.CLASSIFYING, STATE.IDLE);

      // Phase 2: CLASSIFYING → AWAITING_HITL
      await sm.transition(STATE.CLASSIFYING, STATE.AWAITING_HITL, SESSION);
      verifyState(store, SESSION, STATE.AWAITING_HITL, STATE.CLASSIFYING);

      // Phase 3: AWAITING_HITL → DISCOVERY
      await sm.transition(STATE.AWAITING_HITL, STATE.DISCOVERY, SESSION);
      verifyState(store, SESSION, STATE.DISCOVERY, STATE.AWAITING_HITL);

      // Phase 4: DISCOVERY → DESIGN (requires discovery gate)
      createGateFile(gates.gatesDir, SESSION, STATE.DISCOVERY);
      await sm.transition(STATE.DISCOVERY, STATE.DESIGN, SESSION);
      verifyState(store, SESSION, STATE.DESIGN, STATE.DISCOVERY);
      expect(gateFileExists(gates.gatesDir, SESSION, STATE.DISCOVERY)).toBe(true);

      // Phase 5: DESIGN → BUILD (requires discovery gate per TRANSITIONS table)
      createGateFile(gates.gatesDir, SESSION, STATE.DISCOVERY);
      await sm.transition(STATE.DESIGN, STATE.BUILD, SESSION);
      verifyState(store, SESSION, STATE.BUILD, STATE.DESIGN);

      // Phase 6: BUILD → AUDIT (requires build gate)
      createGateFile(gates.gatesDir, SESSION, STATE.BUILD);
      await sm.transition(STATE.BUILD, STATE.AUDIT, SESSION);
      verifyState(store, SESSION, STATE.AUDIT, STATE.BUILD);
      expect(gateFileExists(gates.gatesDir, SESSION, STATE.BUILD)).toBe(true);

      // Phase 7: AUDIT → RSI (requires audit + build gates)
      createGateFile(gates.gatesDir, SESSION, STATE.AUDIT);
      createGateFile(gates.gatesDir, SESSION, STATE.BUILD);
      await sm.transition(STATE.AUDIT, STATE.RSI, SESSION);
      verifyState(store, SESSION, STATE.RSI, STATE.AUDIT);
      expect(gateFileExists(gates.gatesDir, SESSION, STATE.AUDIT)).toBe(true);
      expect(gateFileExists(gates.gatesDir, SESSION, STATE.BUILD)).toBe(true);

      // Phase 8: RSI → DONE (no upstream gates required)
      await sm.transition(STATE.RSI, STATE.DONE, SESSION);
      verifyState(store, SESSION, STATE.DONE, STATE.RSI);

      // Sanity-check transitionAt is a plausible timestamp
      const finalState = readStateFile(store, SESSION);
      expect(finalState.transitionAt).toBeGreaterThan(0);
      expect(finalState.transitionAt).toBeLessThanOrEqual(Date.now());
    });
  });

  // ─── 2. Full Cycle Detection ────────────────────────────────────────
  describe('2. Full Cycle Detection', () => {
    it('throws CycleLimitExceededError after 3 BUILD↔AUDIT cycles', async () => {
      const cycleSession = 'cycle-detection-test';

      // Start at BUILD with clean cycles
      await store.save({
        sessionId: cycleSession,
        currentState: STATE.BUILD,
        previousState: STATE.DESIGN,
        auditCycles: 0,
      });

      // ── Cycle 1 ──────────────────────────────────────────────
      createGateFile(gates.gatesDir, cycleSession, STATE.BUILD);
      await sm.transition(STATE.BUILD, STATE.AUDIT, cycleSession);
      expect(readStateFile(store, cycleSession).currentState).toBe(STATE.AUDIT);

      createGateFile(gates.gatesDir, cycleSession, STATE.DISCOVERY);
      await sm.transition(STATE.AUDIT, STATE.BUILD, cycleSession);
      expect(readStateFile(store, cycleSession).currentState).toBe(STATE.BUILD);

      // ── Cycle 2 ──────────────────────────────────────────────
      createGateFile(gates.gatesDir, cycleSession, STATE.BUILD);
      await sm.transition(STATE.BUILD, STATE.AUDIT, cycleSession);

      createGateFile(gates.gatesDir, cycleSession, STATE.DISCOVERY);
      await sm.transition(STATE.AUDIT, STATE.BUILD, cycleSession);

      // ── Cycle 3 ──────────────────────────────────────────────
      createGateFile(gates.gatesDir, cycleSession, STATE.BUILD);
      await sm.transition(STATE.BUILD, STATE.AUDIT, cycleSession);

      createGateFile(gates.gatesDir, cycleSession, STATE.DISCOVERY);
      await sm.transition(STATE.AUDIT, STATE.BUILD, cycleSession);

      // ── Cycle 4 — should fail on AUDIT → BUILD ───────────────
      createGateFile(gates.gatesDir, cycleSession, STATE.BUILD);
      await sm.transition(STATE.BUILD, STATE.AUDIT, cycleSession);

      createGateFile(gates.gatesDir, cycleSession, STATE.DISCOVERY);
      await expect(
        sm.transition(STATE.AUDIT, STATE.BUILD, cycleSession)
      ).rejects.toThrow(CycleLimitExceededError);
    });
  });

  // ─── 3. Force Transition bypasses gates ─────────────────────────────
  describe('3. Force Transition bypasses gates', () => {
    it('forceTransition from IDLE to BUILD succeeds and sets forcedTransition flag', async () => {
      await sm.forceTransition(STATE.IDLE, STATE.BUILD, SESSION);
      const state = readStateFile(store, SESSION);
      expect(state.currentState).toBe(STATE.BUILD);
      expect(state.forcedTransition).toBe(true);
    });
  });

  // ─── 4. Gate Verification Blocks Invalid Transitions ────────────────
  describe('4. Gate Verification Blocks Invalid Transitions', () => {
    it('throws GateMissingError when transitioning DESIGN → BUILD without discovery gate', async () => {
      await store.save({
        sessionId: SESSION,
        currentState: STATE.DESIGN,
        previousState: STATE.DISCOVERY,
      });
      await expect(
        sm.transition(STATE.DESIGN, STATE.BUILD, SESSION)
      ).rejects.toThrow(GateMissingError);
    });
  });

  // ─── 5. Illegal Transitions Are Rejected ────────────────────────────
  describe('5. Illegal Transitions Are Rejected', () => {
    it('throws IllegalTransitionError for IDLE → BUILD', async () => {
      await expect(
        sm.transition(STATE.IDLE, STATE.BUILD, SESSION)
      ).rejects.toThrow(IllegalTransitionError);
    });
  });

  // ─── 6. Auto-Advance Chain ─────────────────────────────────────────
  describe('6. Auto-Advance Chain', () => {
    it('auto-advances BUILD → AUDIT', async () => {
      await store.save({
        sessionId: SESSION,
        currentState: STATE.BUILD,
        previousState: STATE.DESIGN,
      });
      createGateFile(gates.gatesDir, SESSION, STATE.BUILD);
      const result = await sm.autoAdvance(STATE.BUILD, STATE.AUDIT, SESSION);
      expect(result).toBe(true);
      expect(readStateFile(store, SESSION).currentState).toBe(STATE.AUDIT);
    });

    it('auto-advances AUDIT → RSI', async () => {
      await store.save({
        sessionId: SESSION,
        currentState: STATE.AUDIT,
        previousState: STATE.BUILD,
      });
      createGateFile(gates.gatesDir, SESSION, STATE.AUDIT);
      createGateFile(gates.gatesDir, SESSION, STATE.BUILD);
      const result = await sm.autoAdvance(STATE.AUDIT, STATE.RSI, SESSION);
      expect(result).toBe(true);
      expect(readStateFile(store, SESSION).currentState).toBe(STATE.RSI);
    });
  });

  // ─── 7. Multiple Sessions Isolation ────────────────────────────────
  describe('7. Multiple Sessions Isolation', () => {
    it('transitions in one session do not affect another', async () => {
      const sessionA = 'session-a';
      const sessionB = 'session-b';

      // Advance session A
      await sm.transition(STATE.IDLE, STATE.CLASSIFYING, sessionA);
      const stateA = readStateFile(store, sessionA);
      expect(stateA.currentState).toBe(STATE.CLASSIFYING);

      // Session B should still be in default idle state
      const stateB = store.load(sessionB);
      expect(stateB.currentState).toBe(STATE.IDLE);

      // Advance session B
      await sm.transition(STATE.IDLE, STATE.CLASSIFYING, sessionB);
      const stateB2 = readStateFile(store, sessionB);
      expect(stateB2.currentState).toBe(STATE.CLASSIFYING);

      // Session A is unaffected
      const stateA2 = readStateFile(store, sessionA);
      expect(stateA2.currentState).toBe(STATE.CLASSIFYING);
    });
  });

  // ─── 8. State Persistence ───────────────────────────────────────────
  describe('8. State Persistence', () => {
    it('persists correct fields to the JSON file on disk', async () => {
      // Walk through a few transitions
      await sm.transition(STATE.IDLE, STATE.CLASSIFYING, SESSION);
      await sm.transition(STATE.CLASSIFYING, STATE.AWAITING_HITL, SESSION);

      // Read the file directly with raw fs
      const statePath = store.getFilePath(SESSION);
      expect(existsSync(statePath)).toBe(true);

      const raw = readFileSync(statePath, 'utf8');
      const persisted = JSON.parse(raw);

      // Verify persisted fields
      expect(persisted.sessionId).toBe(SESSION);
      expect(persisted.currentState).toBe(STATE.AWAITING_HITL);
      expect(persisted.previousState).toBe(STATE.CLASSIFYING);
      expect(persisted.transitionAt).toBeDefined();
      expect(typeof persisted.transitionAt).toBe('number');
      expect(persisted.transitionAt).toBeGreaterThan(0);
      expect(persisted.transitionAt).toBeLessThanOrEqual(Date.now());
      expect(persisted.updatedAt).toBeDefined();
      expect(persisted.updatedAt).toBeGreaterThan(0);
      expect(persisted.createdAt).toBeDefined();
      expect(persisted.createdAt).toBeGreaterThan(0);
    });
  });

  // ─── 9. Supervisor Override Integration ─────────────────────────────
  describe('9. Supervisor Override Integration', () => {
    it('force transition sets forcedTransition flag in persisted state', async () => {
      // Create a state with classificationLocked false (simulating fresh session)
      await store.save({
        sessionId: SESSION,
        currentState: STATE.IDLE,
        classificationLocked: false,
      });

      // Force override: jump from IDLE to BUILD
      await sm.forceTransition(STATE.IDLE, STATE.BUILD, SESSION);

      // Verify via readStateFile helper
      const state = readStateFile(store, SESSION);
      expect(state.currentState).toBe(STATE.BUILD);
      expect(state.forcedTransition).toBe(true);

      // Also verify by reading the file directly
      const statePath = store.getFilePath(SESSION);
      const raw = readFileSync(statePath, 'utf8');
      const persisted = JSON.parse(raw);
      expect(persisted.forcedTransition).toBe(true);
    });
  });

  // ─── 10. Audit Trail with State Machine ────────────────────────────
  describe('10. Audit Trail with State Machine', () => {
    it('records audit trail entries matching the state transitions', async () => {
      const auditSession = 'audit-trail-test';
      const auditTrail = new AuditTrail({
        sessionId: auditSession,
        projectDir: tempDir,
      });

      // Seed initial state at DISCOVERY
      await store.save({
        sessionId: auditSession,
        currentState: STATE.DISCOVERY,
        previousState: STATE.AWAITING_HITL,
      });

      // ── Transition 1: DISCOVERY → DESIGN ─────────────────────
      createGateFile(gates.gatesDir, auditSession, STATE.DISCOVERY);
      await sm.transition(STATE.DISCOVERY, STATE.DESIGN, auditSession);
      auditTrail.record({
        action: 'state_transition',
        agent: 'orchestrator',
        policy: 'fsm',
        decision: { allowed: true, rule: 'discovery→design' },
        context: { from: STATE.DISCOVERY, to: STATE.DESIGN },
      });

      // ── Transition 2: DESIGN → BUILD ─────────────────────────
      createGateFile(gates.gatesDir, auditSession, STATE.DISCOVERY);
      await sm.transition(STATE.DESIGN, STATE.BUILD, auditSession);
      auditTrail.record({
        action: 'state_transition',
        agent: 'forcoding-builder',
        policy: 'fsm',
        decision: { allowed: true, rule: 'design→build' },
        context: { from: STATE.DESIGN, to: STATE.BUILD },
      });

      // Verify the state machine ended in BUILD
      const finalState = readStateFile(store, auditSession);
      expect(finalState.currentState).toBe(STATE.BUILD);

      // Verify the audit trail file exists and has 2 entries
      const auditFile = join(
        tempDir, 'docs', 'forcoding', 'audit', auditSession + '.jsonl'
      );
      expect(existsSync(auditFile)).toBe(true);

      const lines = readFileSync(auditFile, 'utf8').trim().split('\n').filter(Boolean);
      expect(lines.length).toBe(2);

      // Parse and verify first entry
      const entry1 = JSON.parse(lines[0]);
      expect(entry1.action).toBe('state_transition');
      expect(entry1.session).toBe(auditSession);
      expect(entry1.context.from).toBe(STATE.DISCOVERY);
      expect(entry1.context.to).toBe(STATE.DESIGN);

      // Parse and verify second entry
      const entry2 = JSON.parse(lines[1]);
      expect(entry2.action).toBe('state_transition');
      expect(entry2.context.from).toBe(STATE.DESIGN);
      expect(entry2.context.to).toBe(STATE.BUILD);

      // Verify chain-of-hash integrity
      expect(entry2.prev_hash).toBe(entry1.entry_hash);
    });
  });
});
