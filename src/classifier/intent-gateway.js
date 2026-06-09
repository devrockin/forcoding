// src/classifier/intent-gateway.js
// Intent Gateway orchestrator chaining L0 → L1 → L2 → L3.
// Routes user prompts through layered classification with confidence thresholds.

import { PreFilter } from './pre-filter.js';
import { IntentClassifier } from './intent-classifier.js';
import { FuzzyMatcher } from './fuzzy-matcher.js';

export class IntentGateway {
  constructor() {
    this.preFilter = new PreFilter();
    this.fuzzyMatcher = new FuzzyMatcher();
  }

  /**
   * Run the full classification pipeline: L0 → L1 → L2 → L3.
   * @param {string} prompt - The user prompt to classify.
   * @param {string} projectDir - Absolute path to the project directory.
   * @returns {Promise<{
   *   action: 'skip_fsm'|'proceed'|'clarify',
   *   taskType: string|null,
   *   confidence: string|null,
   *   layer: 'L0'|'L1'|'L2'|'L3',
   *   classification: Object|null,
   *   reason: string,
   *   candidates: Array<{intent: string, confidence: number}>|null
   * }>}
   */
  async classify(prompt, projectDir) {
    // — L0: Pre-filter —
    const l0Result = this.preFilter.classify(prompt);

    if (l0Result.action === 'skip_non_coding') {
      return {
        action: 'skip_fsm',
        taskType: null,
        confidence: null,
        layer: 'L0',
        classification: l0Result,
        reason: `L0 pre-filter rejected as non-coding (coding=${l0Result.codingScore}, non-coding=${l0Result.nonCodingScore})`,
        candidates: null,
      };
    }

    // — L1: Intent Classifier (deep analysis) —
    const classifier = new IntentClassifier();
    let l1Result;
    try {
      l1Result = await classifier.classify(prompt, projectDir);
    } catch (err) {
      return this._fallbackToL2(prompt, err);
    }

    // L1 high confidence -> proceed directly
    if (l1Result.confidence === 'high') {
      return {
        action: 'proceed',
        taskType: l1Result.taskType,
        confidence: 'high',
        layer: 'L1',
        classification: l1Result,
        reason: `L1 classified with high confidence as "${l1Result.taskType}"`,
        candidates: (l1Result.alternatives || []).map(t => ({ intent: t, confidence: 0.5 })),
      };
    }

    // — L2: Fuzzy Matcher (signal corroboration) —
    const l2Result = this.fuzzyMatcher.match(prompt);

    if (l2Result.intent && l2Result.confidence >= 0.65 && l2Result.ambiguityGap >= 0.2) {
      return {
        action: 'proceed',
        taskType: l2Result.intent,
        confidence: 'high',
        layer: 'L2',
        classification: { fuzzyMatch: l2Result, l1Fallback: l1Result },
        reason: `L2 fuzzy match confirmed "${l2Result.intent}" with high confidence (${(l2Result.confidence * 100).toFixed(1)}%)`,
        candidates: l2Result.candidates,
      };
    }

    if (l2Result.intent && l2Result.confidence >= 0.4) {
      return {
        action: l1Result.confidence === 'low' ? 'clarify' : 'proceed',
        taskType: l2Result.intent,
        confidence: 'medium',
        layer: 'L2',
        classification: { fuzzyMatch: l2Result, l1Classification: l1Result },
        reason: `L2 matched "${l2Result.intent}" at ${(l2Result.confidence * 100).toFixed(1)}% confidence (gap: ${(l2Result.ambiguityGap * 100).toFixed(1)})`,
        candidates: l2Result.candidates,
      };
    }

    // — L3: Clarification needed —
    const candidates = (l2Result.candidates && l2Result.candidates.length > 0)
      ? l2Result.candidates
      : (l1Result.alternatives || []).map(t => ({ intent: t, confidence: 0.3 }));

    return {
      action: 'clarify',
      taskType: l1Result.taskType || l2Result.intent,
      confidence: 'low',
      layer: 'L3',
      classification: { l0: l0Result, l1: l1Result, l2: l2Result },
      reason: `Insufficient confidence across all layers. L1: "${l1Result.taskType}" (${l1Result.confidence}), L2: "${l2Result.intent}" (${(l2Result.confidence * 100).toFixed(1)}%)`,
      candidates,
    };
  }

  /**
   * Fallback handler when L1 classification throws an error.
   * Attempts L2 as the primary path.
   * @param {string} prompt
   * @param {Error} err
   * @returns {Object}
   * @private
   */
  _fallbackToL2(prompt, err) {
    const l2Result = this.fuzzyMatcher.match(prompt);

    if (l2Result.intent && l2Result.confidence >= 0.65) {
      return {
        action: 'proceed',
        taskType: l2Result.intent,
        confidence: 'high',
        layer: 'L2',
        classification: { fuzzyMatch: l2Result, l1Error: err.message },
        reason: `L1 failed (${err.message}), L2 fallback succeeded with "${l2Result.intent}"`,
        candidates: l2Result.candidates,
      };
    }

    if (l2Result.intent && l2Result.confidence >= 0.4) {
      return {
        action: 'proceed',
        taskType: l2Result.intent,
        confidence: 'medium',
        layer: 'L2',
        classification: { fuzzyMatch: l2Result, l1Error: err.message },
        reason: `L1 failed (${err.message}), L2 fallback matched "${l2Result.intent}"`,
        candidates: l2Result.candidates,
      };
    }

    return {
      action: 'clarify',
      taskType: null,
      confidence: null,
      layer: 'L3',
      classification: { fuzzyMatch: l2Result, l1Error: err.message },
      reason: `L1 failed (${err.message}) and L2 found no sufficient match`,
      candidates: l2Result.candidates,
    };
  }
}