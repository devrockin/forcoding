import { describe, it, expect, beforeEach } from 'vitest';
import { HITLCheckpoint } from '../../src/hitl/checkpoint.js';

describe('HITLCheckpoint', () => {
  let checkpoint;

  beforeEach(() => {
    checkpoint = new HITLCheckpoint();
  });

  describe('shouldTrigger()', () => {
    it('returns false when classificationLocked is true', () => {
      const state = { classificationLocked: true, currentState: 'awaiting_hitl' };
      expect(checkpoint.shouldTrigger(state)).toBe(false);
    });

    it('returns true when awaiting_hitl and not locked', () => {
      const state = { classificationLocked: false, currentState: 'awaiting_hitl' };
      expect(checkpoint.shouldTrigger(state)).toBe(true);
    });

    it('returns false when not in awaiting_hitl state', () => {
      const state = { classificationLocked: false, currentState: 'discovery' };
      expect(checkpoint.shouldTrigger(state)).toBe(false);
    });

    it('returns false when both locked and wrong state', () => {
      const state = { classificationLocked: true, currentState: 'build' };
      expect(checkpoint.shouldTrigger(state)).toBe(false);
    });
  });

  describe('injectConfirmation()', () => {
    it('returns a rendered block from classification', () => {
      const classification = {
        taskType: 'web-ui',
        confidence: 'high',
        techStack: { framework: 'react' },
        weight: 'standard',
        subsystems: 2,
        workflow: ['discovery', 'build', 'rsi'],
        notes: [],
        alternatives: [],
      };
      const block = checkpoint.injectConfirmation(classification);
      expect(typeof block).toBe('string');
      expect(block).toContain('ForCoding Analysis');
      expect(block).toContain('web-ui');
      expect(block).toContain('react');
    });

    it('returns different content for low confidence', () => {
      const classification = {
        taskType: 'cli-tool',
        confidence: 'low',
        techStack: { framework: 'vanilla' },
        weight: 'light',
        subsystems: 1,
        workflow: ['discovery', 'build', 'rsi'],
        notes: [],
        alternatives: ['script', 'tool'],
      };
      const block = checkpoint.injectConfirmation(classification);
      expect(block).toContain('Low Confidence');
      expect(block).toContain('Option');
    });

    it('includes notes when present', () => {
      const classification = {
        taskType: 'web-ui',
        confidence: 'high',
        techStack: { framework: 'vanilla' },
        weight: 'standard',
        subsystems: 3,
        workflow: ['discovery', 'build', 'rsi'],
        notes: ['Some important note'],
        alternatives: [],
      };
      const block = checkpoint.injectConfirmation(classification);
      expect(block).toContain('Some important note');
    });
  });

  describe('parseResponse()', () => {
    it('delegates to ResponseParser for confirm', () => {
      const result = checkpoint.parseResponse('ok');
      expect(result).toEqual({ action: 'confirm' });
    });

    it('delegates to ResponseParser for select-alternative', () => {
      const result = checkpoint.parseResponse('a');
      expect(result).toEqual({ action: 'select-alternative', index: 0 });
    });

    it('delegates to ResponseParser for adjustments', () => {
      const result = checkpoint.parseResponse('type: web-ui');
      expect(result).toEqual({ action: 'adjust', adjustments: { taskType: 'web-ui' } });
    });

    it('delegates to ResponseParser for unknown', () => {
      const result = checkpoint.parseResponse('junk input');
      expect(result).toEqual({ action: 'unknown' });
    });
  });
});
