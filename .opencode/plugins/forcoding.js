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
import { IntentGateway } from '../../src/classifier/intent-gateway.js';
import { FSMRecoveryProtocol } from '../../src/fsm/recovery-protocol.js';
import { ProjectMemory } from '../../src/observability/memory.js';

const MEMORY_DIR = 'docs/forcoding/memory';

const GATE_DIR = 'docs/forcoding/gates';
const STATE_DIR = 'docs/forcoding/state';
const AUDIT_DIR = 'docs/forcoding/audit';

function ensureDirs(dir) {
  [STATE_DIR, GATE_DIR, AUDIT_DIR].forEach(d => mkdirSync(join(dir, d), { recursive: true }));
}

function parseAuditorVerdict(output) {
  const o = typeof output === 'string' ? output : (output?.output || '');
  if (/VERDICT:\s*VALIDATED/i.test(o)) return 'VALIDATED';
  if (/VERDICT:\s*PARTIAL/i.test(o)) return 'PARTIAL';
  if (/VERDICT:\s*INVALIDATED/i.test(o)) return 'INVALIDATED';
  if (/all\s*checks\s*pass|no\s*critical\s*issues/i.test(o)) return 'PASS';
  if (/needs\s*fix|requires\s*change/i.test(o)) return 'NEEDS_FIX';
  return 'UNKNOWN';
}

export const ForCodingPlugin = async ({ client, directory }) => {
  ensureDirs(directory);
  const store = new StateStore(directory);
  const audit = new AuditTrail(join(directory, AUDIT_DIR));
  const gates = new GateSystem({ projectDir: directory });
  const fsm = new StateMachine(store, gates);
  const classifier = new IntentClassifier();
  const phaseLock = new PhaseLock(fsm);
  const workflow = WorkflowRegistry;
  const preBuildGate = new PreBuildGate(workflow);
  const truncation = new TruncationRecovery(store);
  const validator = new PostBuildValidator();
  const cycleDetector = new CycleDetector(store);
  const contextBudget = new ContextBudgetManager();
  const hitl = new HITLCheckpoint();
  const intentGateway = new IntentGateway();
  const recoveryProtocol = new FSMRecoveryProtocol();
  const memory = new ProjectMemory(directory);

  return {
    'chat.message': async (input, output) => {
      try {
        // Guard 1: Only process user messages
        const role = input.role || (input.info && input.info.role) || '';
        if (role !== 'user') return;

        const sessionId = input.sessionID || 'default';
        const state = store.load(sessionId);
        if (!state || state.paused) return;

        // Cross-session memory: inject remembered context
        try {
          const ctx = memory.injectContext(5);
          if (ctx && !state.classificationLocked) {
            output.memories = ctx;
          }
        } catch (_) {}

        // FSM Recovery: auto-recover from stuck states
        try {
          const health = recoveryProtocol.checkHealth(state);
          if (health && !health.healthy) {
            await audit.record(sessionId, { event: 'fsm_recovery', action: health.recoveryAction });
            if (health.recoveryAction === 'force_build') {
              await fsm.forceTransition(state.currentState, STATE.BUILD, sessionId);
              return;
            }
            if (health.recoveryAction === 'auto_hitl') {
              // Classify the current message and inject HITL confirmation
              const msg = output.message || state.originalPrompt || '';
              if (msg.trim().length >= 3 && !state.classification) {
                try {
                  const reclass = await classifier.classify(msg, directory);
                  await store.save({ sessionId, classification: reclass, originalPrompt: msg, currentState: STATE.CLASSIFYING });
                  await fsm.forceTransition(STATE.CLASSIFYING, STATE.AWAITING_HITL, sessionId);
                } catch (_) {
                  await fsm.forceTransition(state.currentState, STATE.AWAITING_HITL, sessionId);
                }
              } else {
                await fsm.forceTransition(state.currentState, STATE.AWAITING_HITL, sessionId);
              }
              // Inject HITL block
              const current = store.load(sessionId);
              const hitlBlock = hitl.renderer.render(current.classification || { taskType: 'unknown', weight: 'unknown' });
              if (hitlBlock) {
                output.messages = [...(output.messages || []), { role: 'user', content: hitlBlock }];
              }
              return;
            }
            if (health.recoveryAction === 'reset_idle') {
              await store.save({ sessionId, currentState: STATE.IDLE, classificationLocked: false });
            }
          }
        } catch (_) {}

        // ── Routing reminder: inject once per session ──
        if (!state.routingReminded && state.currentState === STATE.IDLE) {
          await store.update({ sessionId, routingReminded: true });
          output.messages = [...(output.messages || []), {
            role: 'user',
            content: '[ForCoding_Arch] Route ALL tasks through FSM. NEVER load brainstorming/writing-plans/subagent-driven-development. Design→forcoding-designer, Plan→forcoding-planner, Write→forcoding-builder. Output to docs/forcoding/ only. NEVER docs/superpowers/.',
          }];
        }

        // Supervisor override (runs regardless of coding query check)
        const override = ResponseParser.detectSupervisor(output.message, state);
        if (override) {
          switch (override.command) {
            case 'skip_audit': await fsm.forceTransition(state.currentState, STATE.RSI, sessionId); break;
            case 'force_build': await fsm.forceTransition(state.currentState, STATE.BUILD, sessionId); break;
            case 'force_plan': await fsm.forceTransition(state.currentState, STATE.PLAN, sessionId); break;
            case 'force_design': await fsm.forceTransition(state.currentState, STATE.DESIGN, sessionId); break;
            case 'back_to_design': await fsm.forceTransition(state.currentState, STATE.DESIGN, sessionId); break;
            case 'pause': await store.save({ sessionId, paused: true, pausedAt: state.currentState }); break;
            case 'resume': await store.save({ sessionId, paused: false }); break;
            case 'shortcut': await store.save({ sessionId, workflowOverride: 'trivial' }); break;
            case 'full': await store.save({ sessionId, workflowOverride: 'major' }); break;
            case 'maintenance':
              await store.save({
                sessionId,
                workflowOverride: 'maintenance',
                currentState: STATE.BUILD,
                classificationLocked: true,
                maintenanceMode: true,
              });
              break;
          }
          await audit.record(sessionId, { event: 'supervisor_override', command: override.command, from: state.currentState });
          return;
        }

        // L0-L3: Intent Gateway — classifies coding vs non-coding
        if (output.message && output.message.trim().length >= 3) {
          try {
            const gatewayResult = await intentGateway.classify(output.message, directory);
            if (gatewayResult.action === 'skip_fsm') return;
          } catch (_) {}
        }

        // Awaiting HITL response
        if (state.currentState === STATE.AWAITING_HITL) {
          const response = hitl.parseResponse(output.message);
          if (response.action === 'confirm') {
            const scope = ScopeScorer.score(state.originalPrompt, state.projectScan || {});
            const next = ScopeScorer.shouldSkipHarness(scope) ? STATE.BUILD : STATE.DISCOVERY;
            await fsm.transition(STATE.AWAITING_HITL, next, sessionId);
            store.lock(sessionId);
            // ... cross-session memory ...
            try {
              memory.add({
                category: 'DECISION',
                content: 'Task: ' + (state.classification?.taskType || 'unknown') + ', weight: ' + (state.classification?.weight || 'standard') + ', subsystems: ' + (state.classification?.subsystems || 0),
                sessionId: sessionId,
                source: 'classifier',
              });
            } catch (_) {}
            await audit.record(sessionId, { event: 'classification_confirmed', classification: state.classification, scope });

            // Inject next-step guidance
            const nextStep = fsm.getNextStep(sessionId);
            output.messages = [...(output.messages || []), {
              role: 'user',
              content: '[ForCoding] State: ' + nextStep.stage + '. Next: dispatch ' + (nextStep.agents[0] || 'builder') + '. Prompt: ' + (state.originalPrompt || state.classification?.taskType || 'implement'),
            }];

            return;
          }
          if (response.action === 'abort') {
            await fsm.transition(STATE.AWAITING_HITL, STATE.ABORTED, sessionId);
            await store.save({ sessionId, classificationLocked: true, workflowOverride: 'abort' });
            await audit.record(sessionId, { event: 'classification_aborted' });
            return;
          }
          if (response.action === 'adjust') {
            const updatedClassification = { ...state.classification, ...response.adjustments };
            await store.save({ sessionId, classification: updatedClassification });
            const newBlock = hitl.injectConfirmation(updatedClassification);
            if (newBlock) {
              output.messages = [...(output.messages || []), { role: 'user', content: newBlock }];
            }
            await audit.record(sessionId, { event: 'classification_adjusted', adjustments: response.adjustments });
            return;
          }
          if (response.action === 'select-alternative') {
            const alternatives = state.classification?.alternatives || [];
            if (response.index >= 0 && response.index < alternatives.length) {
              const chosen = alternatives[response.index];
              const updatedClassification = { ...state.classification, taskType: chosen.taskType, weight: chosen.weight };
              await store.save({ sessionId, classification: updatedClassification });
              const newBlock = hitl.injectConfirmation(updatedClassification);
              if (newBlock) {
                output.messages = [...(output.messages || []), { role: 'user', content: newBlock }];
              }
              await audit.record(sessionId, { event: 'classification_alternative_selected', chosen });
              return;
            }
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

          const hitlBlock = hitl.injectConfirmation(classification);
          if (hitlBlock) {
            output.messages = [...(output.messages || []), { role: 'user', content: hitlBlock }];
          }

          await audit.record(sessionId, { event: 'classification_proposed', classification });
          return;
        }
      } catch (err) {
        const sid = (input && input.sessionID) || 'default';
        console.error('[ForCoding] chat.message error:', err.message, err.stack ? err.stack.slice(0, 200) : '');
        try { await audit.record(sid, { event: 'hook_error', error: err.message }); } catch (_) {}
      }
    },

    'tool.execute.before': async (input, output) => {
      const { tool } = input;
      const sessionId = input.sessionID || 'default';
      const state = store.load(sessionId);

      // ── Maintenance mode / trivial: bypass all enforcement ──
      if (state.maintenanceMode || state.workflowOverride === 'trivial') return;

      // ── UNIVERSAL: Block writes to non-ForCoding paths (docs/superpowers/) ──
      const FORBIDDEN_PATHS = [/docs\/superpowers\//i, /superskills\//i];
      const checkPath = (input.args?.filePath || input.args?.path || input.args?.command || '').toString();
      if (FORBIDDEN_PATHS.some(p => p.test(checkPath))) {
        throw new Error(
          '[ForCoding] FORBIDDEN PATH: docs/superpowers/ is not for ForCoding output. ' +
          'Use docs/forcoding/ instead. Dispatch forcoding-designer or forcoding-planner via task().'
        );
      }

      // ── UNIVERSAL: Block Superpowers skill loading ──
      const FORBIDDEN_SKILLS = ['brainstorming', 'writing-plans', 'writing-skills', 'frontend-design',
        'subagent-driven-development', 'executing-plans', 'using-superpowers'];
      if (tool === 'skill' && input.args?.name) {
        const skillName = input.args.name.toLowerCase();
        if (FORBIDDEN_SKILLS.some(s => skillName.includes(s))) {
          throw new Error(
            '[ForCoding] Superpowers skill "' + input.args.name + '" is FORBIDDEN in ForCoding sessions. ' +
            'Use ForCoding sub-agents: forcoding-scout, forcoding-designer, forcoding-planner, forcoding-builder, forcoding-auditor.'
          );
        }
      }

      // ── UNIVERSAL: All tools checked against ToolAllowlist per phase ──
      if (!ToolAllowlist.isAllowed(tool, state.currentState)) {
        const allowed = ToolAllowlist.forPhase(state.currentState);
        throw new Error(
          '[ForCoding] Tool "' + tool + '" not allowed in state "' + state.currentState + '". ' +
          'Allowed: [' + allowed.join(', ') + ']'
        );
      }

      // ── UNIVERSAL: Block bash write operations in DESIGN/PLAN ──
      if (tool === 'bash' && (state.currentState === STATE.DESIGN || state.currentState === STATE.PLAN)) {
        const cmd = input.args?.command || '';
        const writePatterns = [/Set-Content/i, /Out-File/i, /Add-Content/i, /WriteAllText/i, /writeFileSync/i, />>/, /'>\s/];
        const hasWrite = writePatterns.some(p => p.test(cmd));
        if (hasWrite) {
          throw new Error(
            '[ForCoding] Writing files directly is FORBIDDEN in ' + state.currentState + ' state. ' +
            'Dispatch forcoding-designer or forcoding-planner via task() instead.'
          );
        }
      }

      // ── TASK-SPECIFIC: Sub-agent dispatch checks ──
      if (tool === 'task') {
        const agentType = output.args?.subagent_type;
        if (!agentType) return;

        // Phase lock
        const lockResult = phaseLock.check(agentType, sessionId);
        if (!lockResult.allowed) {
          const next = fsm.getNextStep(sessionId);
          await store.save({ sessionId, lastBlockedAction: { agentType, errors: [lockResult.error], at: Date.now() }, lastBlockedAt: Date.now() });
          throw new Error('[ForCoding] BLOCKED: ' + agentType + ' in ' + lockResult.current + '. Next: ' + next.stage);
        }

        // Record dispatch for session tracking
        fsm.recordDispatch(sessionId, { agentType: agentType, status: 'dispatched' });

        // Pre-Build Gate
        if (agentType === 'forcoding-builder') {
          const isPrototype = state.currentState === STATE.PROTOTYPE;
          const result = isPrototype ? { valid: true } : preBuildGate.validate(agentType, output.args?.prompt || '', state);
          if (!result.valid) {
            const errors = result.errors.map(function(e) { return '  - ' + e.message; }).join('\n');
            const fixes = preBuildGate.generateRemediation(result.errors, state).map(function(r) { return '  → ' + r; }).join('\n');
            await store.save({ sessionId, lastBlockedAction: { agentType, errors: result.errors, at: Date.now() } });
            throw new Error('[ForCoding] Pre-Build Gate FAILED:\n' + errors + '\nFix:\n' + fixes);
          }
        }

        // Truncation recovery context
        if (state.buildTruncated && agentType === 'forcoding-builder') {
          output.args.prompt = '## TRUNCATION RECOVERY\nContinue from where cut off:\n`\n' + (state.partialOutput || '').slice(-500) + '\n`\n\n' + (output.args.prompt || '');
        }

        // Context budget
        const budget = contextBudget.track(output.args?.prompt || '', sessionId, store);
        if (budget.level === 'emergency') {
          throw new Error('[ForCoding] Context at ' + budget.percent + '%. Compact session before dispatching.');
        }
      }
    },

    'tool.execute.after': async (input, output) => {
      const { tool } = input;

      // Only task tools need post-processing
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
        output.title = '[ForCoding] BUILD complete → AUDIT. Next: dispatch forcoding-auditor.';

        // Cross-session memory: record build pattern
        try {
          const techResult = state.classification?.techStack || {};
          const techDesc = Object.entries(techResult).filter(function(entry) { return entry[1]; }).map(function(entry) { return entry[0] + '=' + entry[1]; }).join(', ');
          if (techDesc) {
            memory.add({ category: 'TECH_STACK', content: techDesc, sessionId: sessionId, source: 'builder' });
          }
        } catch (_) {}

        await audit.record(sessionId, { event: 'build_complete', state: 'audit' });
      }

        if (agentType === 'forcoding-auditor') {
          const verdict = parseAuditorVerdict(output);
          if (verdict === 'VALIDATED' || verdict === 'PASS') {
            await fsm.autoAdvance(STATE.AUDIT, STATE.RSI, sessionId);
            await audit.record(sessionId, { event: 'audit_complete', verdict, state: 'rsi' });
            output.title = '[ForCoding] AUDIT passed → RSI. Review the gate chain.';
          } else if (verdict === 'PARTIAL' || verdict === 'NEEDS_FIX') {
            cycleDetector.check(sessionId);
            await fsm.transition(STATE.AUDIT, STATE.BUILD, sessionId);
            await audit.record(sessionId, { event: 'audit_needs_fix', verdict, state: 'build' });
            output.title = '[ForCoding] AUDIT needs fixes → back to BUILD. Dispatch forcoding-builder.';
          } else {
            await store.update({ sessionId, auditFailed: true, auditOutput: typeof output === 'string' ? output : '' });
            await audit.record(sessionId, { event: 'audit_failed', verdict, reason: 'unparseable' });
            output.title = '[ForCoding] AUDIT unparseable — check the auditor output.';
          }
        }

        if (agentType === 'forcoding-scout') {
          await fsm.transition(STATE.DISCOVERY, STATE.DESIGN, sessionId);
          await audit.record(sessionId, { event: 'scout_complete', state: 'design' });
          output.title = '[ForCoding] DISCOVERY complete → DESIGN. Next: dispatch forcoding-designer.';
        }
        if (agentType === 'forcoding-designer') {
          await fsm.transition(STATE.DESIGN, STATE.PLAN, sessionId);
          await audit.record(sessionId, { event: 'design_complete', state: 'plan' });
          output.title = '[ForCoding] DESIGN complete → PLAN. Next: dispatch forcoding-planner.';
        }
        if (agentType === 'forcoding-planner') {
          await fsm.transition(STATE.PLAN, STATE.BUILD, sessionId);
          await audit.record(sessionId, { event: 'plan_complete', state: 'build' });
          output.title = '[ForCoding] PLAN complete → BUILD. Next: dispatch forcoding-builder.';
        }
    },
  };
};
