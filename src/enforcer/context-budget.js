// src/enforcer/context-budget.js

export class ContextBudgetManager {
  constructor(modelLimit = 48000) {
    this.limit = modelLimit;
    this.warningThreshold = 0.50;   // 50% - onset approaching
    this.rotationThreshold = 0.75;  // 75% - quality degradation begins
    this.emergencyThreshold = 0.85; // 85% - prevent dispatch
  }

  track(toolInput, sessionId, store) {
    const state = store.load(sessionId);
    state.estimatedTokens = (state.estimatedTokens || 0) + this.estimateTokens(toolInput);
    store.update({ sessionId, estimatedTokens: state.estimatedTokens });

    if (state.estimatedTokens > this.limit * this.emergencyThreshold) {
      return { level: 'emergency', usage: state.estimatedTokens, percent: (state.estimatedTokens/this.limit*100).toFixed(1),
        cue: `[ForCoding] Context EMERGENCY — above 85%. Prevent dispatch.` };
    }
    if (state.estimatedTokens > this.limit * this.rotationThreshold) {
      return { level: 'rotation', usage: state.estimatedTokens, percent: (state.estimatedTokens/this.limit*100).toFixed(1),
        cue: `[ForCoding] Context at ${(state.estimatedTokens/this.limit*100).toFixed(0)}%. Rotation recommended.` };
    }
    if (state.estimatedTokens > this.limit * this.warningThreshold) {
      return { level: 'warning', usage: state.estimatedTokens, percent: (state.estimatedTokens/this.limit*100).toFixed(1), cue: null };
    }
    return { level: 'ok', usage: state.estimatedTokens, percent: (state.estimatedTokens/this.limit*100).toFixed(1) };
  }

  estimateTokens(input) {
    const text = typeof input === 'string' ? input : JSON.stringify(input);
    return Math.ceil(text.length / 4);
  }

  reset(sessionId, store) { store.update({ sessionId, estimatedTokens: 0 }); }
}
