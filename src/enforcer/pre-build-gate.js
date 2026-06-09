// src/enforcer/pre-build-gate.js

import { WorkflowRegistry } from '../workflow/registry.js';

export class PreBuildGate {
  constructor(workflow) { this.workflow = workflow || WorkflowRegistry; }

  validate(agentType, prompt, state) {
    const classification = state.classification || { taskType: 'web-ui' };
    const errors = [];
    if (agentType !== 'forcoding-builder') return { valid: true, errors: [] };

    const base = [
      { name: 'round-declaration', check: (p) => /ROUND\s*[:=]/i.test(p), msg: 'Missing ROUND declaration' },
    ];

    const perType = {
      'web-ui': [
        ...base,
        { name: 'visual-section', check: (p) => /##\s*VISUAL\s+(REFERENCE|CONCEPT)/i.test(p) || /design-taste/i.test(p), msg: 'Missing VISUAL REFERENCES section' },
        { name: 'delight', check: (p) => /Delight|delight element/i.test(p), msg: 'Requires >= 2 Delight Elements' },
        { name: 'interaction', check: (p) => /interaction stat|loading.*error/i.test(p), msg: 'Requires interaction states' },
      ],
      'canvas-game': [
        ...base,
        { name: 'game-loop', check: (p) => /requestAnimationFrame|game loop|tick/i.test(p), msg: 'Missing game loop pattern' },
        { name: 'perf-target', check: (p) => /60fps|performance|frame/i.test(p), msg: 'Missing performance target' },
      ],
      'cli-tool': [
        { name: 'exit-codes', check: (p) => /exit code|error handling/i.test(p), msg: 'Missing exit code handling' },
      ],
      'backend-api': [
        ...base,
        { name: 'validation', check: (p) => /validat|schema|input/i.test(p), msg: 'Missing input validation' },
      ],
    };

    const checks = perType[classification.taskType] || perType['web-ui'];
    for (const c of checks) {
      if (!c.check(prompt)) errors.push({ name: c.name, message: c.msg, remediation: `Add "${c.name}" to your dispatch prompt` });
    }
    return { valid: errors.length === 0, errors };
  }

  generateRemediation(errors, state) {
    return errors.map(e => e.remediation || `Fix ${e.name}: ${e.message}`);
  }
}
