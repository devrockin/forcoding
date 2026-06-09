// src/fsm/state-machine.js
// Deterministic finite state machine for ForCoding_Arch.
// Enforces phase ordering, gate file integrity, and dispatch rules.

import { join } from 'path';
import { existsSync } from 'fs';
import { TRANSITIONS, STATE, DISPATCH_RULES, AUTO_ADVANCE, PHASE_ORDER } from './transitions.js';
import {
  IllegalTransitionError,
  GateMissingError,
  CycleLimitExceededError,
  ClassificationNotLockedError,
} from './errors.js';

export class StateMachine {
  static MAX_CYCLES = 3;

  constructor(stateStore, gateSystem) {
    this.store = stateStore;
    this.gates = gateSystem;
    this.listeners = [];
  }

  validateTransition(from, to) {
    const allowed = TRANSITIONS[from];
    if (!allowed || !allowed.includes(to)) {
      throw new IllegalTransitionError(from, to);
    }
  }

  async verifyUpstreamGates(to, state) {
    const requiredGates = {
      [STATE.DESIGN]:    [STATE.DISCOVERY],
      [STATE.PLAN]:      [STATE.DESIGN],
      [STATE.BUILD]:     [STATE.PLAN, STATE.DISCOVERY],
      [STATE.AUDIT]:     [STATE.BUILD],
      [STATE.RSI]:       [STATE.AUDIT, STATE.BUILD],
    };
    const upstream = requiredGates[to];
    if (!upstream) return;

    // BUILD: any one upstream gate is sufficient (PLAN from DESIGN path, DISCOVERY from direct path)
    if (to === STATE.BUILD) {
      const anyExists = upstream.some(stage => {
        const gatePath = join(this.gates.gatesDir, `${state.sessionId}.${stage}.approved`);
        return existsSync(gatePath);
      });
      if (!anyExists) throw new GateMissingError(upstream.join(' or '));
      return;
    }

    for (const stage of upstream) {
      const gatePath = join(this.gates.gatesDir, `${state.sessionId}.${stage}.approved`);
      if (!existsSync(gatePath)) {
        throw new GateMissingError(stage);
      }
    }
  }

  async transition(from, to, sessionId) {
    this.validateTransition(from, to);
    const state = this.store.load(sessionId);
    await this.verifyUpstreamGates(to, state);
    if (to === STATE.BUILD && from === STATE.AUDIT) {
      this.checkCycle(state);
    }
    await this.createGate(to, sessionId);
    await this.store.update({
      sessionId,
      currentState: to,
      previousState: from,
      transitionAt: Date.now(),
      forcedTransition: false,
    });
    this._recordTransition(state, from, to, sessionId);
    this.listeners.forEach(fn => fn({ from, to, sessionId }));
  }

  async forceTransition(from, to, sessionId) {
    await this.createGate(to, sessionId);
    const state = this.store.load(sessionId);
    await this.store.update({
      sessionId,
      currentState: to,
      previousState: from,
      transitionAt: Date.now(),
      forcedTransition: true,
    });
    this._recordTransition(state, from, to, sessionId);
    this.listeners.forEach(fn => fn({ from, to, sessionId, forced: true }));
  }

  _recordTransition(state, from, to, sessionId) {
    const transitions = (state.transitions || []).concat([{
      from: from,
      to: to,
      at: Date.now(),
      forced: state.forcedTransition || false,
    }]);
    this.store.update({ sessionId, transitions: transitions });
  }

  recordDispatch(sessionId, data) {
    const state = this.store.load(sessionId);
    const dispatchCount = (state.dispatchCount || 0) + 1;
    const buildSessions = (state.buildSessions || []).concat([{
      id: data.taskId || ('task_' + String(dispatchCount).padStart(3, '0')),
      agentType: data.agentType || 'unknown',
      status: data.status || 'dispatched',
      at: Date.now(),
    }]);
    this.store.update({ sessionId, dispatchCount: dispatchCount, buildSessions: buildSessions });
    return dispatchCount;
  }

  async createGate(stage, sessionId) {
    if (this.gates) {
      await this.gates.create(stage, {
        verdict: 'APPROVED',
      });
    }
  }

  checkCycle(state) {
    const cycles = (state.auditCycles || 0) + 1;
    if (cycles > StateMachine.MAX_CYCLES) {
      throw new CycleLimitExceededError(StateMachine.MAX_CYCLES);
    }
    this.store.update({ sessionId: state.sessionId, auditCycles: cycles });
  }

  resetCycle(sessionId) {
    this.store.update({ sessionId, auditCycles: 0 });
  }

  canDispatch(agentType, sessionId) {
    const state = this.store.load(sessionId);
    const allowedStates = DISPATCH_RULES[agentType];
    if (!allowedStates) return false;
    return allowedStates.includes(state.currentState);
  }

  getNextStep(sessionId) {
    const state = this.store.load(sessionId);
    const phaseIndex = PHASE_ORDER.indexOf(state.currentState);
    if (phaseIndex < PHASE_ORDER.length - 1) {
      const nextState = PHASE_ORDER[phaseIndex + 1];
      const agents = Object.entries(DISPATCH_RULES)
        .filter(([_, states]) => states.includes(nextState))
        .map(([agent]) => agent);
      return { stage: nextState, agents };
    }
    return { stage: STATE.DONE, agents: [] };
  }

  async autoAdvance(from, to, sessionId) {
    const auto = AUTO_ADVANCE[from];
    if (auto === to) {
      await this.transition(from, to, sessionId);
      return true;
    }
    return false;
  }

  onTransition(fn) {
    this.listeners.push(fn);
  }
}
