// .opencode/plugins/forcoding.js
// ForCoding_Arch — Deterministic Harness Plugin for OpenCode

import { StateMachine } from '../../src/fsm/state-machine.js';
import { StateStore } from '../../src/fsm/state-store.js';
import { STATE } from '../../src/fsm/transitions.js';
import { IntentClassifier } from '../../src/classifier/intent-classifier.js';
import { ScopeScorer } from '../../src/classifier/scope-scorer.js';
import { WorkflowRegistry } from '../../src/workflow/registry.js';
import { HITLCheckpoint } from '../../src/hitl/checkpoint.js';
import { ResponseParser } from '../../src/hitl/response-parser.js';
import { PreBuildGate } from '../../src/enforcer/pre-build-gate.js';
import { PhaseLock } from '../../src/enforcer/phase-lock.js';
import { ToolAllowlist } from '../../src/enforcer/tool-allowlist.js';
import { ContextBudgetManager } from '../../src/enforcer/context-budget.js';
import { PostBuildValidator } from '../../src/enforcer/post-build-validator.js';
import { TruncationRecovery } from '../../src/enforcer/truncation-recovery.js';
import { CycleDetector } from '../../src/enforcer/cycle-detector.js';
import { GateSystem } from '../../src/gates/gate-system.mjs';
import { AuditTrail } from '../../src/audit/audit-trail.mjs';
import { mkdirSync } from 'fs';
import { join } from 'path';

const GATE_DIR = 'docs/forcoding/gates';
const STATE_DIR = 'docs/forcoding/state';
const AUDIT_DIR = 'docs/forcoding/audit';

function ensureDirs(dir) {
  [STATE_DIR, GATE_DIR, AUDIT_DIR].forEach(d => mkdirSync(join(dir, d), { recursive: true }));
}

export const ForCodingPlugin = async ({ client, directory }) => {
  ensureDirs(directory);
  const store = new StateStore(directory);
  const audit = new AuditTrail(join(directory, AUDIT_DIR));
  const gates = new GateSystem(join(directory, GATE_DIR));
  const fsm = new StateMachine(store, gates);
  const classifier = new IntentClassifier();
  const phaseLock = new PhaseLock(fsm);
  const workflow = WorkflowRegistry;
  const preBuildGate = new PreBuildGate(workflow);
  const truncation = new TruncationRecovery();
  const validator = new PostBuildValidator();
  const cycleDetector = new CycleDetector(store);
  const contextBudget = new ContextBudgetManager();
  const hitl = new HITLCheckpoint();

  return {
    'chat.message': async (input, output) => {
      const sessionId = input.sessionID || 'default';
      const state = store.load(sessionId);
      if (state.paused) return;

      // Supervisor override
      const override = ResponseParser.detectSupervisor(output.message, state);
      if (override) {
        switch (override.command) {
          case 'skip_audit': await fsm.forceTransition(state.currentState, STATE.RSI, sessionId); break;
          case 'force_build': await fsm.forceTransition(state.currentState, STATE.BUILD, sessionId); break;
          case 'back_to_design': await fsm.forceTransition(state.currentState, STATE.DESIGN, sessionId); break;
          case 'pause': await store.save({ sessionId, paused: true, pausedAt: state.currentState }); break;
          case 'resume': await store.save({ sessionId, paused: false }); break;
          case 'shortcut': await store.save({ sessionId, workflowOverride: 'trivial' }); break;
          case 'full': await store.save({ sessionId, workflowOverride: 'major' }); break;
        }
        await audit.record(sessionId, { event: 'supervisor_override', command: override.command, from: state.currentState });
        return;
      }

      // Awaiting HITL response
      if (state.currentState === STATE.AWAITING_HITL) {
        const response = hitl.parseResponse(output.message);
        if (response.action === 'confirm') {
          const scope = ScopeScorer.score(state.originalPrompt, state.projectScan || {});
          const next = ScopeScorer.shouldSkipHarness(scope) ? STATE.BUILD : STATE.DISCOVERY;
          await fsm.transition(STATE.AWAITING_HITL, next, sessionId);
          store.lock(sessionId);
          await audit.record(sessionId, { event: 'classification_confirmed', classification: state.classification, scope });
          return;
        }
      }

      // New task → classify
      if (!state.classificationLocked && state.currentState === STATE.IDLE) {
        const msg = output.message;
        if (!msg || msg.trim().length < 3) return;
        const classification = await classifier.classify(msg, directory);
        await store.save({ sessionId, classification, originalPrompt: msg, currentState: STATE.CLASSIFYING });
        await fsm.transition(STATE.IDLE, STATE.CLASSIFYING, sessionId);
        await fsm.transition(STATE.CLASSIFYING, STATE.AWAITING_HITL, sessionId);
        hitl.injectConfirmation(classification, output.messages || []);
        await audit.record(sessionId, { event: 'classification_proposed', classification });
        return;
      }
    },

    'tool.execute.before': async (input, output) => {
      const { tool } = input;
      if (tool !== 'task') return;
      const sessionId = input.sessionID || 'default';
      const state = store.load(sessionId);
      const agentType = output.args?.subagent_type;
      if (!agentType) return;

      // Tool allowlist check
      if (!ToolAllowlist.isAllowed('task', state.currentState)) {
        throw new Error(`[ForCoding] Task dispatch not allowed in state "${state.currentState}"`);
      }

      // Phase lock
      const lockResult = phaseLock.check(agentType, sessionId);
      if (!lockResult.allowed) {
        const next = fsm.getNextStep(sessionId);
        await store.save({ sessionId, lastBlockedAction: { agentType, errors: [lockResult.error], at: Date.now() } });
        throw new Error(`[ForCoding] BLOCKED: ${agentType} in ${lockResult.current}. Next: ${next.stage}`);
      }

      // Pre-Build Gate
      if (agentType === 'forcoding-builder') {
        const isPrototype = state.currentState === STATE.PROTOTYPE;
        const result = isPrototype ? { valid: true } : preBuildGate.validate(agentType, output.args?.prompt || '', state);
        if (!result.valid) {
          const errors = result.errors.map(e => `  - ${e.message}`).join('\n');
          const fixes = preBuildGate.generateRemediation(result.errors, state).map(r => `  → ${r}`).join('\n');
          await store.save({ sessionId, lastBlockedAction: { agentType, errors: result.errors, at: Date.now() } });
          throw new Error(`[ForCoding] Pre-Build Gate FAILED:\n${errors}\nFix:\n${fixes}`);
        }
      }

      // Truncation recovery context
      if (state.buildTruncated && agentType === 'forcoding-builder') {
        output.args.prompt = `## TRUNCATION RECOVERY\nContinue from where cut off:\n\`\`\`\n${(state.partialOutput || '').slice(-500)}\n\`\`\`\n\n` + (output.args.prompt || '');
      }

      // Context budget
      const budget = contextBudget.track(output.args?.prompt || '', sessionId, store);
      if (budget.level === 'emergency') {
        throw new Error(`[ForCoding] Context at ${budget.percent}%. Compact session before dispatching.`);
      }
    },

    'tool.execute.after': async (input, output) => {
      const { tool } = input;
      if (tool !== 'task') return;
      const sessionId = input.sessionID || 'default';
      const state = store.load(sessionId);
      const agentType = input.args?.subagent_type;

      if (agentType === 'forcoding-builder') {
        const resultText = typeof output === 'string' ? output : (output?.output || '');

        // Prototype: stay in loop
        if (state.currentState === STATE.PROTOTYPE) {
          output.title = '[PROTOTYPE] Review and iterate or say "ready".';
          return;
        }

        // Post-build validation
        const valResult = await validator.check(resultText, state.classification || {});
        if (!valResult.canAutoAdvance) {
          await audit.record(sessionId, { event: 'post_build_failed', validation: valResult });
          return;
        }

        // Truncation detection
        const truncResult = await truncation.detect(resultText, state.classification || {});
        if (truncResult.truncated) {
          const recovery = await truncation.handle(truncResult, resultText, { ...state.classification, sessionId });
          if (recovery.action === 'retry') {
            await store.update({ sessionId, buildRetries: recovery.retryCount, buildTruncated: true, partialOutput: resultText, truncationSignals: truncResult.signals });
            await fsm.transition(STATE.BUILD, STATE.BUILD_RECOVERY, sessionId);
            await audit.record(sessionId, { event: 'truncation_retry', retryCount: recovery.retryCount });
            return;
          }
          await audit.record(sessionId, { event: 'truncation_exhausted', retries: recovery.retryCount });
        }

        // Clean completion → auto-advance
        await store.update({ sessionId, buildRetries: 0, buildTruncated: false });
        await fsm.autoAdvance(STATE.BUILD, STATE.AUDIT, sessionId);
        await audit.record(sessionId, { event: 'build_complete', state: 'audit' });
      }

      if (agentType === 'forcoding-auditor') {
        await fsm.autoAdvance(STATE.AUDIT, STATE.RSI, sessionId);
        await audit.record(sessionId, { event: 'audit_complete', state: 'rsi' });
      }
    },
  };
};
