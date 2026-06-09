// src/enforcer/phase-lock.js

import { DISPATCH_RULES, STATE } from '../fsm/transitions.js';

export class PhaseLock {
  constructor(fsm) { this.fsm = fsm; }

  check(agentType, sessionId) {
    const state = this.fsm.store.load(sessionId);
    const allowedStates = DISPATCH_RULES[agentType] || [];
    const allowed = allowedStates.includes(state.currentState);
    return {
      allowed,
      current: state.currentState,
      expected: allowedStates,
      error: allowed ? null : `${agentType} requires state [${allowedStates.join('|')}], currently ${state.currentState}`,
    };
  }
}
