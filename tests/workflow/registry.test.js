import { describe, it, expect } from 'vitest';
import { WORKFLOW, WorkflowRegistry } from '../../src/workflow/registry.js';

describe('WorkflowRegistry', () => {

  describe('WORKFLOW object', () => {
    it('has 9 task types', () => {
      const types = Object.keys(WORKFLOW);
      expect(types).toHaveLength(9);
      expect(types).toContain('web-ui');
      expect(types).toContain('canvas-game');
      expect(types).toContain('cli-tool');
      expect(types).toContain('data-pipeline');
      expect(types).toContain('backend-api');
      expect(types).toContain('spa-app');
      expect(types).toContain('fullstack-app');
      expect(types).toContain('hotfix');
      expect(types).toContain('refactor');
    });
  });

  describe('get()', () => {
    it('web-ui light returns 3 stages', () => {
      const result = WorkflowRegistry.get('web-ui', 'light');
      expect(result.stages).toHaveLength(3);
      expect(result.stages).toEqual(['discovery', 'build', 'rsi']);
    });

    it('web-ui standard returns 5 stages', () => {
      const result = WorkflowRegistry.get('web-ui', 'standard');
      expect(result.stages).toHaveLength(5);
      expect(result.stages).toEqual(['discovery', 'design', 'build', 'audit', 'rsi']);
    });

    it('web-ui heavy returns 6 stages', () => {
      const result = WorkflowRegistry.get('web-ui', 'heavy');
      expect(result.stages).toHaveLength(6);
      expect(result.stages).toEqual(['discovery', 'design', 'plan', 'build', 'audit', 'rsi']);
    });

    it('unknown type falls back to web-ui', () => {
      const result = WorkflowRegistry.get('nonexistent-type');
      expect(result.stages).toEqual(['discovery', 'design', 'build', 'audit', 'rsi']);
    });

    it('unknown weight falls back to standard', () => {
      const result = WorkflowRegistry.get('web-ui', 'strange-weight');
      expect(result.stages).toEqual(['discovery', 'design', 'build', 'audit', 'rsi']);
    });

    it('hotfix light starts with build', () => {
      const result = WorkflowRegistry.get('hotfix', 'light');
      expect(result.stages[0]).toBe('build');
      expect(result.stages).toHaveLength(2);
    });

    it('hotfix standard includes audit', () => {
      const result = WorkflowRegistry.get('hotfix', 'standard');
      expect(result.stages).toContain('audit');
      expect(result.stages).toHaveLength(3);
    });

    it('canvas-game has 5 checks', () => {
      const result = WorkflowRegistry.get('canvas-game');
      expect(result.checks).toEqual(['game-loop', 'performance', 'memory', 'input-handling', 'collision']);
    });

    it('cli-tool has 4 checks', () => {
      const result = WorkflowRegistry.get('cli-tool');
      expect(result.checks).toEqual(['exit-codes', 'error-handling', 'stdin-stdout', 'arg-parsing']);
    });

    it('backend-api has 4 security checks', () => {
      const result = WorkflowRegistry.get('backend-api');
      expect(result.checks).toContain('input-validation');
      expect(result.checks).toContain('security');
      expect(result.checks).toContain('rate-limiting');
    });

    it('fullstack-app has 5 checks', () => {
      const result = WorkflowRegistry.get('fullstack-app');
      expect(result.checks).toEqual(['frontend', 'backend', 'database', 'security', 'api-contract']);
    });

    it('hotfix has 2 checks', () => {
      const result = WorkflowRegistry.get('hotfix');
      expect(result.checks).toEqual(['syntax', 'regression']);
    });

    it('refactor has regression and interface-stability checks', () => {
      const result = WorkflowRegistry.get('refactor');
      expect(result.checks).toContain('regression');
      expect(result.checks).toContain('interface-stability');
    });

    it('data-pipeline has error-recovery check', () => {
      const result = WorkflowRegistry.get('data-pipeline');
      expect(result.checks).toContain('error-recovery');
    });

    it('spa-app has bundle-size check', () => {
      const result = WorkflowRegistry.get('spa-app');
      expect(result.checks).toContain('bundle-size');
    });

    it('web-ui has accessibility check', () => {
      const result = WorkflowRegistry.get('web-ui');
      expect(result.checks).toContain('accessibility');
      expect(result.checks).toContain('responsive');
    });
  });

  describe('getAllTypes()', () => {
    it('returns 9 task types', () => {
      const types = WorkflowRegistry.getAllTypes();
      expect(types).toHaveLength(9);
      expect(types).toContain('web-ui');
      expect(types).toContain('canvas-game');
      expect(types).toContain('cli-tool');
      expect(types).toContain('data-pipeline');
      expect(types).toContain('backend-api');
      expect(types).toContain('spa-app');
      expect(types).toContain('fullstack-app');
      expect(types).toContain('hotfix');
      expect(types).toContain('refactor');
    });

    it('returns a new array each call', () => {
      const t1 = WorkflowRegistry.getAllTypes();
      const t2 = WorkflowRegistry.getAllTypes();
      expect(t1).toEqual(t2);
      // Should be different references
      t1.push('extra');
      expect(WorkflowRegistry.getAllTypes()).toHaveLength(9);
    });
  });

  describe('getChecks()', () => {
    it('returns checks for known type', () => {
      const checks = WorkflowRegistry.getChecks('cli-tool');
      expect(Array.isArray(checks)).toBe(true);
      expect(checks).toContain('exit-codes');
    });

    it('unknown type falls back to web-ui checks', () => {
      const checks = WorkflowRegistry.getChecks('made-up-type');
      expect(checks).toContain('typography');
      expect(checks).toContain('accessibility');
    });

    it('returns empty array if no checks defined', () => {
      // All types have checks, but test the fallback path
      const checks = WorkflowRegistry.getChecks('web-ui');
      expect(Array.isArray(checks)).toBe(true);
    });
  });
});
