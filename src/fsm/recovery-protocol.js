// src/fsm/recovery-protocol.js
// FSM auto-recovery when the state machine gets stuck.
// Monitors idle duration, HITL wait time, and consecutive blocks.

import { STATE } from './transitions.js';

// Recovery time thresholds (milliseconds)
const IDLE_TIMEOUT_MS = 30_000;
const AWAITING_HITL_TIMEOUT_MS = 300_000;
const MAX_CONSECUTIVE_BLOCKED = 3;

export class FSMRecoveryProtocol {
  constructor() {
    this.blockedCount = 0;
    this.lastBlockedAt = null;
    this.recoveryHistory = [];
  }

  /**
   * Check the health of the current FSM state.
   * @param {Object} state - The current state object from the state store.
   * @returns {{
   *   healthy: boolean,
   *   trigger: string|null,
   *   recoveryAction: string,
   *   message: string,
   *   blockedCount: number,
   * }}
   */
  checkHealth(state) {
    const now = Date.now();
    const triggers = [];

    // Trigger 1a: idle >30s with pending block
    if (
      state.currentState === STATE.IDLE &&
      state.lastBlockedAction &&
      state.lastBlockedAt &&
      (now - state.lastBlockedAt) > IDLE_TIMEOUT_MS
    ) {
      triggers.push({
        type: 'idle_timeout',
        recoveryAction: 'auto_hitl',
        message: `Idle for ${(now - state.lastBlockedAt) / 1000}s with pending block. Escalating to HITL.`,
      });
    }

    // Trigger 1b: idle >30s with no classification (stale unclassified session)
    if (
      state.currentState === STATE.IDLE &&
      !state.classificationLocked &&
      !state.classification &&
      state.updatedAt &&
      (now - state.updatedAt) > IDLE_TIMEOUT_MS
    ) {
      triggers.push({
        type: 'stale_idle',
        recoveryAction: 'auto_hitl',
        message: `Idle session with no classification for ${(now - state.updatedAt) / 1000}s. Escalating to HITL with re-classification.`,
      });
    }

    // Trigger 2: awaiting_hitl >5min -> reset to idle
    if (
      state.currentState === STATE.AWAITING_HITL &&
      state.transitionAt &&
      (now - state.transitionAt) > AWAITING_HITL_TIMEOUT_MS
    ) {
      triggers.push({
        type: 'awaiting_hitl_timeout',
        recoveryAction: 'reset_idle',
        message: `Awaiting HITL for ${(now - state.transitionAt) / 1000}s. Resetting to idle.`,
      });
    }

    // Trigger 3: 3 consecutive blocked -> force build
    if (state.currentState === STATE.BUILD_RECOVERY || state.currentState === STATE.BUILD) {
      if (state.buildRetries >= MAX_CONSECUTIVE_BLOCKED) {
        triggers.push({
          type: 'consecutive_blocked',
          recoveryAction: 'force_build',
          message: `${state.buildRetries} consecutive blocked builds. Forcing build via recovery.`,
        });
      }
    }

    if (triggers.length === 0) {
      return {
        healthy: true,
        trigger: null,
        recoveryAction: 'none',
        message: 'FSM state is healthy.',
        blockedCount: state.buildRetries || 0,
      };
    }

    const primary = triggers[triggers.length - 1];

    return {
      healthy: false,
      trigger: primary.type,
      recoveryAction: primary.recoveryAction,
      message: primary.message,
      blockedCount: state.buildRetries || 0,
    };
  }

  /**
   * Get a safe default state for when recovery is needed but no state exists.
   * @returns {Object} - Default state object.
   */
  getSafeDefault() {
    return {
      currentState: STATE.IDLE,
      previousState: null,
      classification: null,
      classificationLocked: false,
      classificationConfidence: null,
      workflowOverride: null,
      auditCycles: 0,
      buildRetries: 0,
      buildTruncated: false,
      paused: false,
      pausedAt: null,
      estimatedTokens: 0,
      lastBlockedAction: null,
      scopeThreshold: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
   * Record a blocked action for tracking consecutive blocks.
   * @param {Object} state - Current state.
   * @returns {number} - Updated blocked count.
   */
  recordBlocked(state) {
    this.blockedCount = (state.buildRetries || 0) + 1;
    this.lastBlockedAt = Date.now();
    return this.blockedCount;
  }

  /**
   * Reset the blocked counter after successful recovery.
   */
  clearBlocked() {
    this.blockedCount = 0;
    this.lastBlockedAt = null;
  }

  /**
   * Get recovery history for diagnostics.
   * @returns {Array<{timestamp: number, trigger: string, action: string}>}
   */
  getRecoveryHistory() {
    return [...this.recoveryHistory];
  }
}