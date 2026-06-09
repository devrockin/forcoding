// src/enforcer/tool-allowlist.js

import { STATE } from '../fsm/transitions.js';

const PHASE_TOOLS = {
  [STATE.IDLE]:           ['read','glob','grep','bash:git*','task'],
  [STATE.AWAITING_HITL]:  [],
  [STATE.PROTOTYPE]:      ['task','read'],
  [STATE.DISCOVERY]:      ['read','glob','grep','task','write','edit'],
  [STATE.DESIGN]:         ['read','glob','grep','task'],
  [STATE.PLAN]:           ['read','glob','grep','task'],
  [STATE.BUILD]:          ['task'],
  [STATE.BUILD_RECOVERY]: ['task'],
  [STATE.AUDIT]:          ['task','read','glob','grep'],
  [STATE.RSI]:            ['read','playwright*','task'],
  [STATE.DONE]:           ['read','bash:git*'],
};

export class ToolAllowlist {
  static isAllowed(tool, phase) {
    const allowed = PHASE_TOOLS[phase] || [];
    return allowed.some(p => p === '*' || (p.endsWith('*') && tool.startsWith(p.slice(0,-1))) || p === tool);
  }
}
