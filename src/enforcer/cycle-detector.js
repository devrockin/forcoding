// src/enforcer/cycle-detector.js

import { CycleLimitExceededError } from '../fsm/errors.js';

export class CycleDetector {
  static MAX_CYCLES = 3;
  constructor(store) { this.store = store; }

  check(sessionId) {
    const state = this.store.load(sessionId);
    const cycles = (state.auditCycles || 0) + 1;
    if (cycles > CycleDetector.MAX_CYCLES) {
      throw new CycleLimitExceededError(CycleDetector.MAX_CYCLES);
    }
    this.store.update({ sessionId, auditCycles: cycles });
  }
  reset(sessionId) { this.store.update({ sessionId, auditCycles: 0 }); }
}
