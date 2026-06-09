import { describe, it, expect, beforeEach } from 'vitest';
import { HITLRenderer } from '../../src/hitl/renderer.js';

describe('HITLRenderer', () => {
  let renderer;

  function makeClassification(overrides = {}) {
    return {
      taskType: 'web-ui',
      confidence: 'high',
      techStack: { framework: 'react' },
      weight: 'standard',
      subsystems: 2,
      workflow: ['discovery', 'build', 'rsi'],
      notes: [],
      alternatives: [],
      ...overrides,
    };
  }

  beforeEach(() => {
    renderer = new HITLRenderer();
  });

  describe('render()', () => {
    it('high confidence renders table with Task Type, Tech, Scope', () => {
      const result = renderer.render(makeClassification());
      expect(result).toContain('Task Type');
      expect(result).toContain('Tech');
      expect(result).toContain('Scope');
      expect(result).toContain('Workflow');
      expect(result).toContain('web-ui');
      expect(result).toContain('react');
      expect(result).toContain('standard');
    });

    it('low confidence renders options A/B/C', () => {
      const result = renderer.render(makeClassification({
        confidence: 'low',
        alternatives: ['cli-tool', 'script'],
      }));
      expect(result).toContain('Low Confidence');
      expect(result).toContain('Option');
      expect(result).toContain('A)');
      expect(result).toContain('B)');
      expect(result).toContain('C)');
    });

    it('medium confidence includes alternatives', () => {
      const result = renderer.render(makeClassification({
        confidence: 'medium',
        alternatives: ['backend-api'],
      }));
      expect(result).toContain('Other possible types');
      expect(result).toContain('backend-api');
    });

    it('medium confidence still contains the main table', () => {
      const result = renderer.render(makeClassification({
        confidence: 'medium',
        alternatives: ['backend-api'],
      }));
      expect(result).toContain('Task Type');
      expect(result).toContain('web-ui');
    });

    it('includes notes in output', () => {
      const result = renderer.render(makeClassification({
        notes: ['Some important note'],
      }));
      expect(result).toContain('Some important note');
    });

    it('alternatives up to C work correctly', () => {
      const result = renderer.render(makeClassification({
        confidence: 'low',
        alternatives: ['cli-tool', 'data-pipeline', 'script'],
      }));
      expect(result).toContain('A)');
      expect(result).toContain('B)');
      expect(result).toContain('C)');
      expect(result).toContain('D)');
    });
  });

  describe('icon()', () => {
    it('returns emoji for known types', () => {
      expect(renderer.icon('web-ui')).toBeTruthy();
      expect(renderer.icon('canvas-game')).toBeTruthy();
      expect(renderer.icon('cli-tool')).toBeTruthy();
      expect(renderer.icon('data-pipeline')).toBeTruthy();
      expect(renderer.icon('backend-api')).toBeTruthy();
      expect(renderer.icon('spa-app')).toBeTruthy();
      expect(renderer.icon('fullstack-app')).toBeTruthy();
      expect(renderer.icon('hotfix')).toBeTruthy();
      expect(renderer.icon('refactor')).toBeTruthy();
    });

    it('returns empty string for unknown type', () => {
      expect(renderer.icon('something-unknown')).toBe('');
    });

    it('returns icons for workflow stages', () => {
      expect(renderer.icon('discovery')).toBeTruthy();
      expect(renderer.icon('design')).toBeTruthy();
      expect(renderer.icon('plan')).toBeTruthy();
      expect(renderer.icon('build')).toBeTruthy();
      expect(renderer.icon('audit')).toBeTruthy();
      expect(renderer.icon('rsi')).toBeTruthy();
    });

    it('returns icons for weights', () => {
      expect(renderer.icon('light')).toBeTruthy();
      expect(renderer.icon('standard')).toBeTruthy();
      expect(renderer.icon('heavy')).toBeTruthy();
    });
  });
});
