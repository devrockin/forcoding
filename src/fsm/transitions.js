// src/fsm/transitions.js
// State definitions and transition table for ForCoding_Arch.

export const STATE = {
  IDLE:            'idle',
  CLASSIFYING:     'classifying',
  AWAITING_HITL:   'awaiting_hitl',
  PROTOTYPE:       'prototype',
  DISCOVERY:       'discovery',
  DESIGN:          'design',
  PLAN:            'plan',
  BUILD:           'build',
  BUILD_RECOVERY:  'build_recovery',
  AUDIT:           'audit',
  RSI:             'rsi',
  DONE:            'done',
  ABORTED:         'aborted',
};

export const TRANSITIONS = {
  [STATE.IDLE]:            [STATE.CLASSIFYING],
  [STATE.CLASSIFYING]:     [STATE.AWAITING_HITL],
  [STATE.AWAITING_HITL]:   [STATE.PROTOTYPE, STATE.DISCOVERY, STATE.ABORTED],
  [STATE.PROTOTYPE]:       [STATE.PROTOTYPE, STATE.DISCOVERY, STATE.ABORTED],
  [STATE.DISCOVERY]:       [STATE.DESIGN, STATE.BUILD, STATE.PROTOTYPE],
  [STATE.DESIGN]:          [STATE.PLAN, STATE.BUILD],
  [STATE.PLAN]:            [STATE.BUILD],
  [STATE.BUILD]:           [STATE.BUILD_RECOVERY, STATE.AUDIT],
  [STATE.BUILD_RECOVERY]:  [STATE.BUILD, STATE.AUDIT],
  [STATE.AUDIT]:           [STATE.BUILD, STATE.RSI],
  [STATE.RSI]:             [STATE.DONE, STATE.BUILD],
  [STATE.DONE]:            [STATE.IDLE],
  [STATE.ABORTED]:         [STATE.IDLE],
};

export const DISPATCH_RULES = {
  'forcoding-designer': [STATE.DESIGN],
  'forcoding-planner':  [STATE.PLAN],
  'forcoding-builder':  [STATE.BUILD, STATE.BUILD_RECOVERY, STATE.PROTOTYPE],
  'forcoding-auditor':  [STATE.AUDIT],
  'forcoding-scout':    [STATE.DISCOVERY, STATE.DESIGN, STATE.PLAN],
  'forcoding-drafter':  [STATE.DISCOVERY, STATE.DESIGN],
};

export const AUTO_ADVANCE = {
  [STATE.BUILD]:          STATE.AUDIT,
  [STATE.BUILD_RECOVERY]: STATE.AUDIT,
  [STATE.AUDIT]:          STATE.RSI,
  [STATE.DESIGN]:         STATE.BUILD,
};

export const PHASE_ORDER = [
  STATE.IDLE, STATE.CLASSIFYING, STATE.AWAITING_HITL,
  STATE.DISCOVERY, STATE.DESIGN, STATE.PLAN,
  STATE.BUILD, STATE.AUDIT, STATE.RSI, STATE.DONE,
];
