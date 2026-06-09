// src/workflow/registry.js

import { STATE } from '../fsm/transitions.js';

export const WORKFLOW = {
  'web-ui': {
    light:    [STATE.DISCOVERY, STATE.BUILD, STATE.RSI],
    standard: [STATE.DISCOVERY, STATE.DESIGN, STATE.BUILD, STATE.AUDIT, STATE.RSI],
    heavy:    [STATE.DISCOVERY, STATE.DESIGN, STATE.PLAN, STATE.BUILD, STATE.AUDIT, STATE.RSI],
    checks:   ['typography', 'spacing', 'colors', 'accessibility', 'responsive', 'dark-mode', 'touch-targets'],
  },
  'canvas-game': {
    light:    [STATE.DISCOVERY, STATE.BUILD, STATE.RSI],
    standard: [STATE.DISCOVERY, STATE.DESIGN, STATE.BUILD, STATE.AUDIT, STATE.RSI],
    heavy:    [STATE.DISCOVERY, STATE.DESIGN, STATE.PLAN, STATE.BUILD, STATE.AUDIT, STATE.RSI],
    checks:   ['game-loop', 'performance', 'memory', 'input-handling', 'collision'],
  },
  'cli-tool': {
    light:    [STATE.DISCOVERY, STATE.BUILD, STATE.RSI],
    standard: [STATE.DISCOVERY, STATE.BUILD, STATE.AUDIT, STATE.RSI],
    heavy:    [STATE.DISCOVERY, STATE.DESIGN, STATE.BUILD, STATE.AUDIT, STATE.RSI],
    checks:   ['exit-codes', 'error-handling', 'stdin-stdout', 'arg-parsing'],
  },
  'data-pipeline': {
    light:    [STATE.DISCOVERY, STATE.BUILD, STATE.RSI],
    standard: [STATE.DISCOVERY, STATE.DESIGN, STATE.BUILD, STATE.AUDIT, STATE.RSI],
    heavy:    [STATE.DISCOVERY, STATE.DESIGN, STATE.PLAN, STATE.BUILD, STATE.AUDIT, STATE.RSI],
    checks:   ['data-validation', 'schema', 'memory', 'error-recovery'],
  },
  'backend-api': {
    light:    [STATE.DISCOVERY, STATE.BUILD, STATE.RSI],
    standard: [STATE.DISCOVERY, STATE.DESIGN, STATE.BUILD, STATE.AUDIT, STATE.RSI],
    heavy:    [STATE.DISCOVERY, STATE.DESIGN, STATE.PLAN, STATE.BUILD, STATE.AUDIT, STATE.RSI],
    checks:   ['input-validation', 'error-handling', 'security', 'rate-limiting'],
  },
  'spa-app': {
    light:    [STATE.DISCOVERY, STATE.BUILD, STATE.RSI],
    standard: [STATE.DISCOVERY, STATE.DESIGN, STATE.BUILD, STATE.AUDIT, STATE.RSI],
    heavy:    [STATE.DISCOVERY, STATE.DESIGN, STATE.PLAN, STATE.BUILD, STATE.AUDIT, STATE.RSI],
    checks:   ['typography', 'accessibility', 'responsive', 'state-management', 'bundle-size'],
  },
  'fullstack-app': {
    light:    [STATE.DISCOVERY, STATE.DESIGN, STATE.BUILD, STATE.RSI],
    standard: [STATE.DISCOVERY, STATE.DESIGN, STATE.PLAN, STATE.BUILD, STATE.AUDIT, STATE.RSI],
    heavy:    [STATE.DISCOVERY, STATE.DESIGN, STATE.PLAN, STATE.BUILD, STATE.AUDIT, STATE.RSI],
    checks:   ['frontend', 'backend', 'database', 'security', 'api-contract'],
  },
  'hotfix': {
    light:    [STATE.BUILD, STATE.RSI],
    standard: [STATE.BUILD, STATE.AUDIT, STATE.RSI],
    heavy:    [STATE.BUILD, STATE.AUDIT, STATE.RSI],
    checks:   ['syntax', 'regression'],
  },
  'refactor': {
    light:    [STATE.DISCOVERY, STATE.BUILD, STATE.RSI],
    standard: [STATE.DISCOVERY, STATE.DESIGN, STATE.BUILD, STATE.AUDIT, STATE.RSI],
    heavy:    [STATE.DISCOVERY, STATE.DESIGN, STATE.PLAN, STATE.BUILD, STATE.AUDIT, STATE.RSI],
    checks:   ['regression', 'interface-stability'],
  },
};

export class WorkflowRegistry {
  static get(taskType, weight = 'standard') {
    const entry = WORKFLOW[taskType] || WORKFLOW['web-ui'];
    return {
      stages: entry[weight] || entry.standard,
      checks: entry.checks || [],
    };
  }
  static getAllTypes() { return Object.keys(WORKFLOW); }
  static getChecks(taskType) { return (WORKFLOW[taskType] || WORKFLOW['web-ui']).checks || []; }
}
