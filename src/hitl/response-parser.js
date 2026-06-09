// src/hitl/response-parser.js

export class ResponseParser {
  static parse(message) {
    const m = message.trim().toLowerCase();
    if (/^(ok|确认|yes|y|好|行|可以|没问题|go|proceed)\b/i.test(m))
      return { action: 'confirm' };
    const letter = m.match(/^([a-d])\b/i);
    if (letter) return { action: 'select-alternative', index: letter[1].toLowerCase().charCodeAt(0) - 97 };
    const typeMatch = m.match(/type:\s*(\S+)/i);
    const depthMatch = m.match(/depth:\s*(\S+)/i);
    if (typeMatch || depthMatch) {
      const adj = {};
      if (typeMatch?.[1]) adj.taskType = typeMatch[1];
      if (depthMatch?.[1]) adj.weight = depthMatch[1];
      return { action: 'adjust', adjustments: adj };
    }
    return { action: 'unknown' };
  }
  static detectSupervisor(message, state = {}) {
    const m = message.trim().toLowerCase();
    if (/^(skip|no)\s+audit/i.test(m))       return { command: 'skip_audit' };
    if (/^force\s+build/i.test(m))           return { command: 'force_build' };
    if (/^back\s+to\s+design/i.test(m))      return { command: 'back_to_design' };
    if (/^pause\b/i.test(m))                 return { command: 'pause' };
    if (/^resume\b/i.test(m) && state.paused) return { command: 'resume' };
    if (/^shortcut\b/i.test(m))              return { command: 'shortcut' };
    if (/^full\s+(process|harness|workflow)/i.test(m)) return { command: 'full' };
    return null;
  }
}
