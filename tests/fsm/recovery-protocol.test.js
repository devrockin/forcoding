import { describe, it, expect, beforeEach } from 'vitest';
import { FSMRecoveryProtocol } from '../../src/fsm/recovery-protocol.js';
import { STATE } from '../../src/fsm/transitions.js';

describe('FSMRecoveryProtocol', () => {
  let protocol;

  beforeEach(() => {
    protocol = new FSMRecoveryProtocol();
  });

  // ─── checkHealth: healthy state ─────────────────────────────────

  describe('checkHealth() — healthy', () => {
    it('returns healthy=true for normal state with no pending blocks', () => {
      const state = {
        currentState: STATE.BUILD,
        classification: { taskType: 'web-ui' },
        lastBlockedAction: null,
        buildRetries: 0,
      };
      const health = protocol.checkHealth(state);
      expect(health.healthy).toBe(true);
      expect(health.recoveryAction).toBe('none');
    });

    it('returns healthy=true for IDLE with no blocked action', () => {
      const state = {
        currentState: STATE.IDLE,
        classification: null,
        lastBlockedAction: null,
      };
      const health = protocol.checkHealth(state);
      expect(health.healthy).toBe(true);
    });

    it('returns blockedCount from buildRetries', () => {
      const state = {
        currentState: STATE.BUILD,
        buildRetries: 3,
      };
      const health = protocol.checkHealth(state);
      expect(health.blockedCount).toBe(3);
    });
  });

  // ─── checkHealth: idle timeout → auto_hitl ──────────────────────

  describe('checkHealth() — idle timeout', () => {
    it('returns auto_hitl when idle >30s with pending block', () => {
      const state = {
        currentState: STATE.IDLE,
        lastBlockedAction: 'create',
        lastBlockedAt: Date.now() - 35000,   // 35s ago > 30s timeout
      };
      const health = protocol.checkHealth(state);
      expect(health.healthy).toBe(false);
      expect(health.recoveryAction).toBe('auto_hitl');
    });

    it('stays healthy when idle <30s with pending block', () => {
      const state = {
        currentState: STATE.IDLE,
        lastBlockedAction: 'create',
        lastBlockedAt: Date.now() - 5000,     // 5s ago < 30s timeout
      };
      const health = protocol.checkHealth(state);
      expect(health.healthy).toBe(true);
    });
  });

  // ─── checkHealth: awaiting_hitl timeout → reset_idle ────────────

  describe('checkHealth() — awaiting_hitl timeout', () => {
    it('returns reset_idle when awaiting_hitl >5min', () => {
      const state = {
        currentState: STATE.AWAITING_HITL,
        transitionAt: Date.now() - 310000,    // 310s > 300s timeout
      };
      const health = protocol.checkHealth(state);
      expect(health.healthy).toBe(false);
      expect(health.recoveryAction).toBe('reset_idle');
    });

    it('stays healthy when awaiting_hitl <5min', () => {
      const state = {
        currentState: STATE.AWAITING_HITL,
        transitionAt: Date.now() - 10000,     // 10s ago
      };
      const health = protocol.checkHealth(state);
      expect(health.healthy).toBe(true);
    });
  });

  // ─── checkHealth: consecutive block → force_build ───────────────

  describe('checkHealth() — consecutive blocks', () => {
    it('returns force_build when buildRetries >= 3 in BUILD state', () => {
      const state = {
        currentState: STATE.BUILD,
        buildRetries: 3,
      };
      const health = protocol.checkHealth(state);
      expect(health.healthy).toBe(false);
      expect(health.recoveryAction).toBe('force_build');
    });

    it('returns force_build when buildRetries >= 3 in BUILD_RECOVERY state', () => {
      const state = {
        currentState: STATE.BUILD_RECOVERY,
        buildRetries: 4,
      };
      const health = protocol.checkHealth(state);
      expect(health.healthy).toBe(false);
      expect(health.recoveryAction).toBe('force_build');
    });

    it('returns healthy when buildRetries < 3', () => {
      const state = {
        currentState: STATE.BUILD,
        buildRetries: 2,
      };
      const health = protocol.checkHealth(state);
      expect(health.healthy).toBe(true);
    });
  });

  // ─── getSafeDefault ─────────────────────────────────────────────

  describe('getSafeDefault()', () => {
    it('returns a state object with IDLE as currentState', () => {
      const state = protocol.getSafeDefault();
      expect(state).toHaveProperty('currentState', STATE.IDLE);
      expect(state).toHaveProperty('classification');
      expect(state).toHaveProperty('buildRetries');
      expect(state).toHaveProperty('lastBlockedAction');
    });

    it('returns a fresh state with no pending blocks', () => {
      const state = protocol.getSafeDefault();
      expect(state.lastBlockedAction).toBeNull();
      expect(state.buildRetries).toBe(0);
    });
  });

  // ─── Block Tracking ─────────────────────────────────────────────

  describe('block tracking', () => {
    it('recordBlocked increments based on state buildRetries', () => {
      const state = { buildRetries: 2 };
      const count = protocol.recordBlocked(state);
      expect(count).toBe(3);
      expect(protocol.blockedCount).toBe(3);
    });

    it('clearBlocked resets blockedCount and lastBlockedAt', () => {
      protocol.blockedCount = 5;
      protocol.lastBlockedAt = Date.now();
      protocol.clearBlocked();
      expect(protocol.blockedCount).toBe(0);
      expect(protocol.lastBlockedAt).toBeNull();
    });

    it('recordBlocked tracks zero buildRetries correctly', () => {
      const count = protocol.recordBlocked({ buildRetries: 0 });
      expect(count).toBe(1);
      expect(protocol.blockedCount).toBe(1);
    });
  });

  // ─── Recovery History ───────────────────────────────────────────

  describe('getRecoveryHistory()', () => {
    it('returns an empty array initially', () => {
      expect(protocol.getRecoveryHistory()).toEqual([]);
    });

    it('returns a copy of internal history', () => {
      const history = protocol.getRecoveryHistory();
      history.push('should not affect internal');
      expect(protocol.getRecoveryHistory()).toEqual([]);
    });
  });
});
