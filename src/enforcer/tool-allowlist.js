// src/enforcer/tool-allowlist.js
// Per-phase tool restrictions — enforced by plugin tool.execute.before hook.

import { STATE } from '../fsm/transitions.js';

// Tools the orchestrator (LLM) needs for coordination in all phases
const MGMT_TOOLS = ['todowrite', 'question', 'task', 'skill', 'skill_search', 'triage'];
const CTX_TOOLS = ['ctx_note', 'ctx_memory', 'ctx_search', 'ctx_expand'];
const RESEARCH_TOOLS = ['webfetch', 'websearch'];

const PHASE_TOOLS = {
  [STATE.IDLE]:           ['read', 'glob', 'grep', 'bash', 'write', 'edit', ...MGMT_TOOLS, ...CTX_TOOLS],
  [STATE.AWAITING_HITL]:  ['read', 'question'],
  [STATE.PROTOTYPE]:      ['task', 'read', ...MGMT_TOOLS, ...CTX_TOOLS],
  [STATE.DISCOVERY]:      ['read', 'glob', 'grep', 'task', 'bash', 'write', 'edit', ...MGMT_TOOLS, ...CTX_TOOLS, ...RESEARCH_TOOLS],
  [STATE.DESIGN]:         ['read', 'glob', 'grep', 'task', ...MGMT_TOOLS, ...CTX_TOOLS],
  [STATE.PLAN]:           ['read', 'glob', 'grep', 'task', ...MGMT_TOOLS, ...CTX_TOOLS],
  [STATE.BUILD]:          ['task'],
  [STATE.BUILD_RECOVERY]: ['task'],
  [STATE.AUDIT]:          ['task', 'read', 'glob', 'grep'],
  [STATE.RSI]:            ['read', 'playwright*', 'task', ...CTX_TOOLS],
  [STATE.DONE]:           ['read', 'bash'],
};

export class ToolAllowlist {
  static forPhase(phase) {
    return PHASE_TOOLS[phase] || [];
  }

  static isAllowed(tool, phase) {
    const allowed = PHASE_TOOLS[phase] || [];
    return allowed.some(function(p) {
      if (p === '*') return true;
      if (p.endsWith('*')) return tool.startsWith(p.slice(0, -1));
      return p === tool;
    });
  }
}
