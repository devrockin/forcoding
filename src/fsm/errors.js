// src/fsm/errors.js
// Custom error types for the state machine system.

export class FSMError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FSMError';
  }
}

export class IllegalTransitionError extends FSMError {
  constructor(from, to) {
    super(`Illegal state transition: ${from} → ${to}`);
    this.name = 'IllegalTransitionError';
    this.from = from;
    this.to = to;
  }
}

export class GateMissingError extends FSMError {
  constructor(stage) {
    super(`Required gate file not found for stage: ${stage}`);
    this.name = 'GateMissingError';
    this.stage = stage;
  }
}

export class CycleLimitExceededError extends FSMError {
  constructor(cycles) {
    super(`Build→Audit cycle limit (${cycles}) exceeded. Escalating to HITL.`);
    this.name = 'CycleLimitExceededError';
    this.cycles = cycles;
  }
}

export class ClassificationNotLockedError extends FSMError {
  constructor() {
    super('Cannot proceed: classification has not been confirmed by user.');
    this.name = 'ClassificationNotLockedError';
  }
}

export class StateStoreError extends FSMError {
  constructor(message, path) {
    super(message);
    this.name = 'StateStoreError';
    this.path = path;
  }
}
