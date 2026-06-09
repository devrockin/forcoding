// src/enforcer/phase-lock.js

import { DISPATCH_RULES, STATE } from '../fsm/transitions.js';

export class PhaseLock {
  constructor(fsm) { this.fsm = fsm; }

  check(agentType, sessionId) {
    const state = this.fsm.store.load(sessionId);
    const allowedStates = DISPATCH_RULES[agentType];
    // Agents not in DISPATCH_RULES (e.g. 'general', 'explore') are third-party — allow
    if (!allowedStates) {
      return { allowed: true, current: state.currentState, expected: null, error: null };
    }
    const allowed = allowedStates.includes(state.currentState);
    return {
      allowed,
      current: state.currentState,
      expected: allowedStates,
      error: allowed ? null : `${agentType} requires state [${allowedStates.join('|')}], currently ${state.currentState}`,
    };
  }
}
