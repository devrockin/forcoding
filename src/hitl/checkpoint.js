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

  injectConfirmation(classification, messages) {
    const block = this.renderer.render(classification);
    messages.push({ role: 'user', content: block });
  }

  parseResponse(message) {
    return ResponseParser.parse(message);
  }
}
