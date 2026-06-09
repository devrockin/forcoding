import { describe, it, expect } from 'vitest';
import {
  STATE,
  TRANSITIONS,
  DISPATCH_RULES,
  AUTO_ADVANCE,
  PHASE_ORDER,
} from '../../src/fsm/transitions.js';

// ─── STATE constants ────────────────────────────────────────────
describe('STATE', () => {
  it('has all 13 state constants', () => {
    const keys = Object.keys(STATE);
    expect(keys.length).toBe(13);
  });

  it('maps IDLE to idle', () => {
    expect(STATE.IDLE).toBe('idle');
  });
  it('maps CLASSIFYING to classifying', () => {
    expect(STATE.CLASSIFYING).toBe('classifying');
  });
  it('maps AWAITING_HITL to awaiting_hitl', () => {
    expect(STATE.AWAITING_HITL).toBe('awaiting_hitl');
  });
  it('maps PROTOTYPE to prototype', () => {
    expect(STATE.PROTOTYPE).toBe('prototype');
  });
  it('maps DISCOVERY to discovery', () => {
    expect(STATE.DISCOVERY).toBe('discovery');
  });
  it('maps DESIGN to design', () => {
    expect(STATE.DESIGN).toBe('design');
  });
  it('maps PLAN to plan', () => {
    expect(STATE.PLAN).toBe('plan');
  });
  it('maps BUILD to build', () => {
    expect(STATE.BUILD).toBe('build');
  });
  it('maps BUILD_RECOVERY to build_recovery', () => {
    expect(STATE.BUILD_RECOVERY).toBe('build_recovery');
  });
  it('maps AUDIT to audit', () => {
    expect(STATE.AUDIT).toBe('audit');
  });
  it('maps RSI to rsi', () => {
    expect(STATE.RSI).toBe('rsi');
  });
  it('maps DONE to done', () => {
    expect(STATE.DONE).toBe('done');
  });
  it('maps ABORTED to aborted', () => {
    expect(STATE.ABORTED).toBe('aborted');
  });
});

// ─── TRANSITIONS table ──────────────────────────────────────────
describe('TRANSITIONS', () => {
  it('IDLE allows only CLASSIFYING', () => {
    expect(TRANSITIONS[STATE.IDLE]).toEqual([STATE.CLASSIFYING]);
  });

  it('CLASSIFYING allows only AWAITING_HITL', () => {
    expect(TRANSITIONS[STATE.CLASSIFYING]).toEqual([STATE.AWAITING_HITL]);
  });

  it('AWAITING_HITL allows PROTOTYPE, DISCOVERY, ABORTED', () => {
    expect(TRANSITIONS[STATE.AWAITING_HITL]).toEqual([
      STATE.PROTOTYPE, STATE.DISCOVERY, STATE.ABORTED,
    ]);
  });

  it('PROTOTYPE allows PROTOTYPE, DISCOVERY, ABORTED', () => {
    expect(TRANSITIONS[STATE.PROTOTYPE]).toEqual([
      STATE.PROTOTYPE, STATE.DISCOVERY, STATE.ABORTED,
    ]);
  });

  it('DISCOVERY allows DESIGN, BUILD, PROTOTYPE', () => {
    expect(TRANSITIONS[STATE.DISCOVERY]).toEqual([
      STATE.DESIGN, STATE.BUILD, STATE.PROTOTYPE,
    ]);
  });

  it('DESIGN allows PLAN, BUILD', () => {
    expect(TRANSITIONS[STATE.DESIGN]).toEqual([STATE.PLAN, STATE.BUILD]);
  });

  it('PLAN allows only BUILD', () => {
    expect(TRANSITIONS[STATE.PLAN]).toEqual([STATE.BUILD]);
  });

  it('BUILD allows BUILD_RECOVERY, AUDIT', () => {
    expect(TRANSITIONS[STATE.BUILD]).toEqual([STATE.BUILD_RECOVERY, STATE.AUDIT]);
  });

  it('BUILD_RECOVERY allows BUILD, AUDIT', () => {
    expect(TRANSITIONS[STATE.BUILD_RECOVERY]).toEqual([STATE.BUILD, STATE.AUDIT]);
  });

  it('AUDIT allows BUILD, RSI', () => {
    expect(TRANSITIONS[STATE.AUDIT]).toEqual([STATE.BUILD, STATE.RSI]);
  });

  it('RSI allows DONE, BUILD', () => {
    expect(TRANSITIONS[STATE.RSI]).toEqual([STATE.DONE, STATE.BUILD]);
  });

  it('DONE allows only IDLE', () => {
    expect(TRANSITIONS[STATE.DONE]).toEqual([STATE.IDLE]);
  });

  it('ABORTED allows only IDLE', () => {
    expect(TRANSITIONS[STATE.ABORTED]).toEqual([STATE.IDLE]);
  });
});

// ─── DISPATCH_RULES ─────────────────────────────────────────────
describe('DISPATCH_RULES', () => {
  it('has 6 agent-to-state mappings', () => {
    const keys = Object.keys(DISPATCH_RULES);
    expect(keys.length).toBe(6);
  });

  it('forcoding-designer maps to DESIGN', () => {
    expect(DISPATCH_RULES['forcoding-designer']).toEqual([STATE.DESIGN]);
  });

  it('forcoding-planner maps to PLAN', () => {
    expect(DISPATCH_RULES['forcoding-planner']).toEqual([STATE.PLAN]);
  });

  it('forcoding-builder maps to BUILD, BUILD_RECOVERY, PROTOTYPE', () => {
    expect(DISPATCH_RULES['forcoding-builder']).toEqual([
      STATE.BUILD, STATE.BUILD_RECOVERY, STATE.PROTOTYPE,
    ]);
  });

  it('forcoding-auditor maps to AUDIT', () => {
    expect(DISPATCH_RULES['forcoding-auditor']).toEqual([STATE.AUDIT]);
  });

  it('forcoding-scout maps to DISCOVERY, DESIGN, PLAN', () => {
    expect(DISPATCH_RULES['forcoding-scout']).toEqual([
      STATE.DISCOVERY, STATE.DESIGN, STATE.PLAN,
    ]);
  });

  it('forcoding-drafter maps to DISCOVERY, DESIGN', () => {
    expect(DISPATCH_RULES['forcoding-drafter']).toEqual([
      STATE.DISCOVERY, STATE.DESIGN,
    ]);
  });
});

// ─── AUTO_ADVANCE ───────────────────────────────────────────────
describe('AUTO_ADVANCE', () => {
  it('has 4 auto transitions', () => {
    const keys = Object.keys(AUTO_ADVANCE);
    expect(keys.length).toBe(4);
  });

  it('BUILD auto-advances to AUDIT', () => {
    expect(AUTO_ADVANCE[STATE.BUILD]).toBe(STATE.AUDIT);
  });

  it('BUILD_RECOVERY auto-advances to AUDIT', () => {
    expect(AUTO_ADVANCE[STATE.BUILD_RECOVERY]).toBe(STATE.AUDIT);
  });

  it('AUDIT auto-advances to RSI', () => {
    expect(AUTO_ADVANCE[STATE.AUDIT]).toBe(STATE.RSI);
  });

  it('DESIGN auto-advances to BUILD', () => {
    expect(AUTO_ADVANCE[STATE.DESIGN]).toBe(STATE.BUILD);
  });
});

// ─── PHASE_ORDER ────────────────────────────────────────────────
describe('PHASE_ORDER', () => {
  it('has 10 phases in order', () => {
    expect(PHASE_ORDER.length).toBe(10);
  });

  it('starts with IDLE', () => {
    expect(PHASE_ORDER[0]).toBe(STATE.IDLE);
  });

  it('ends with DONE', () => {
    expect(PHASE_ORDER[PHASE_ORDER.length - 1]).toBe(STATE.DONE);
  });

  it('contains all expected phases in correct order', () => {
    expect(PHASE_ORDER).toEqual([
      STATE.IDLE,
      STATE.CLASSIFYING,
      STATE.AWAITING_HITL,
      STATE.DISCOVERY,
      STATE.DESIGN,
      STATE.PLAN,
      STATE.BUILD,
      STATE.AUDIT,
      STATE.RSI,
      STATE.DONE,
    ]);
  });
});
