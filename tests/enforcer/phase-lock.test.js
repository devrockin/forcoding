import { describe, it, expect, vi } from 'vitest';
import { PhaseLock } from '../../src/enforcer/phase-lock.js';
import { createMockState } from '../helpers/setup.js';

describe('PhaseLock', () => {
  let mockStore;
  let fsm;
  let lock;

  function createFsm(stateOverrides) {
    const state = createMockState(stateOverrides);
    mockStore = { load: vi.fn(() => ({ ...state })) };
    return { store: mockStore };
  }

  // 1. builder in BUILD state → allowed=true
  it('builder in BUILD state is allowed', () => {
    fsm = createFsm({ currentState: 'build' });
    lock = new PhaseLock(fsm);
    const result = lock.check('forcoding-builder', 'session-1');
    expect(result.allowed).toBe(true);
    expect(result.error).toBeNull();
  });

  // 2. builder in IDLE state → allowed=false
  it('builder in IDLE state is not allowed', () => {
    fsm = createFsm({ currentState: 'idle' });
    lock = new PhaseLock(fsm);
    const result = lock.check('forcoding-builder', 'session-1');
    expect(result.allowed).toBe(false);
    expect(result.error).not.toBeNull();
  });

  // 3. designer in DESIGN state → allowed=true
  it('designer in DESIGN state is allowed', () => {
    fsm = createFsm({ currentState: 'design' });
    lock = new PhaseLock(fsm);
    const result = lock.check('forcoding-designer', 'session-1');
    expect(result.allowed).toBe(true);
  });

  // 4. designer in BUILD state → allowed=false
  it('designer in BUILD state is not allowed', () => {
    fsm = createFsm({ currentState: 'build' });
    lock = new PhaseLock(fsm);
    const result = lock.check('forcoding-designer', 'session-1');
    expect(result.allowed).toBe(false);
  });

  // 5. planner in PLAN state → allowed=true
  it('planner in PLAN state is allowed', () => {
    fsm = createFsm({ currentState: 'plan' });
    lock = new PhaseLock(fsm);
    const result = lock.check('forcoding-planner', 'session-1');
    expect(result.allowed).toBe(true);
  });

  // 6. auditor in AUDIT state → allowed=true
  it('auditor in AUDIT state is allowed', () => {
    fsm = createFsm({ currentState: 'audit' });
    lock = new PhaseLock(fsm);
    const result = lock.check('forcoding-auditor', 'session-1');
    expect(result.allowed).toBe(true);
  });

  // 7. scout in DISCOVERY state → allowed=true
  it('scout in DISCOVERY state is allowed', () => {
    fsm = createFsm({ currentState: 'discovery' });
    lock = new PhaseLock(fsm);
    const result = lock.check('forcoding-scout', 'session-1');
    expect(result.allowed).toBe(true);
  });

  // 8. drafter in DISCOVERY and DESIGN states → allowed=true
  it('drafter in DISCOVERY state is allowed', () => {
    fsm = createFsm({ currentState: 'discovery' });
    lock = new PhaseLock(fsm);
    expect(lock.check('forcoding-drafter', 'session-1').allowed).toBe(true);
  });

  it('drafter in DESIGN state is allowed', () => {
    fsm = createFsm({ currentState: 'design' });
    lock = new PhaseLock(fsm);
    expect(lock.check('forcoding-drafter', 'session-1').allowed).toBe(true);
  });

  // 9. unknown agent → allowed=true (third-party agents pass through)
  it('unknown agent type is allowed (third-party pass-through)', () => {
    fsm = createFsm({ currentState: 'build' });
    lock = new PhaseLock(fsm);
    const result = lock.check('unknown-agent', 'session-1');
    expect(result.allowed).toBe(true);
    expect(result.expected).toBeNull();
    expect(result.error).toBeNull();
  });

  // 10. builder in PROTOTYPE state → allowed=true
  it('builder in PROTOTYPE state is allowed', () => {
    fsm = createFsm({ currentState: 'prototype' });
    lock = new PhaseLock(fsm);
    const result = lock.check('forcoding-builder', 'session-1');
    expect(result.allowed).toBe(true);
  });

  // 11. builder in BUILD_RECOVERY state → allowed=true
  it('builder in BUILD_RECOVERY state is allowed', () => {
    fsm = createFsm({ currentState: 'build_recovery' });
    lock = new PhaseLock(fsm);
    const result = lock.check('forcoding-builder', 'session-1');
    expect(result.allowed).toBe(true);
  });

  // 12. Error message contains current state and expected states
  it('error message contains current state and expected states', () => {
    fsm = createFsm({ currentState: 'idle' });
    lock = new PhaseLock(fsm);
    const result = lock.check('forcoding-builder', 'session-1');
    expect(result.error).toContain('idle');
    expect(result.error).toContain('build');
    expect(result.error).toContain('forcoding-builder');
  });
});