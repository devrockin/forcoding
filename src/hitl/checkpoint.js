// src/hitl/checkpoint.js

import { HITLRenderer } from './renderer.js';
import { ResponseParser } from './response-parser.js';

export class HITLCheckpoint {
  constructor() {
    this.renderer = new HITLRenderer();
  }

  shouldTrigger(state) {
    if (state.classificationLocked) return false;
    return state.currentState === 'awaiting_hitl';
  }

  injectConfirmation(classification) {
    const block = this.renderer.render(classification);
    return block;  // Return block — caller handles safe injection (no push into live array)
  }

  parseResponse(message) {
    return ResponseParser.parse(message);
  }
}
