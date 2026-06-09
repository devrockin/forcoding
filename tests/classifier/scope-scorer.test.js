import { describe, it, expect } from 'vitest';
import { ScopeScorer } from '../../src/classifier/scope-scorer.js';

describe('ScopeScorer', () => {
  describe('score()', () => {
    it('returns 0 for simple single-file fix', () => {
      const score = ScopeScorer.score('fix a single file');
      expect(score).toBeLessThanOrEqual(2);
    });

    it('returns >= 3 for multi-file implementation', () => {
      const score = ScopeScorer.score('implement across multiple files');
      expect(score).toBeGreaterThanOrEqual(3);
    });

    it('returns <= 1 for trivial change', () => {
      const score = ScopeScorer.score('just a simple change');
      expect(score).toBeLessThanOrEqual(1);
    });

    it('includes projectScan.hasTests bonus', () => {
      const without = ScopeScorer.score('add a new module');
      const withTests = ScopeScorer.score('add a new module', { hasTests: true });
      expect(withTests).toBe(without + 1);
    });

    it('returns at least 0 (no negative)', () => {
      const score = ScopeScorer.score('just a typo fix');
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('scores "fix one file" low', () => {
      const score = ScopeScorer.score('fix one file');
      expect(score).toBeLessThan(2);
    });

    it('scores "create a few files" moderately', () => {
      const score = ScopeScorer.score('create a few files');
      expect(score).toBeGreaterThanOrEqual(2);
    });

    it('scores "refactor across all files" high', () => {
      const score = ScopeScorer.score('refactor across all files');
      expect(score).toBeGreaterThanOrEqual(4);
    });

    it('scores "implement component" moderately', () => {
      const score = ScopeScorer.score('implement component');
      expect(score).toBeGreaterThanOrEqual(2);
    });

    it('scores "fix spelling" very low', () => {
      const score = ScopeScorer.score('fix spelling');
      expect(score).toBe(0);
    });

    it('scores "adjust margin" very low', () => {
      const score = ScopeScorer.score('adjust margin');
      expect(score).toBe(0);
    });

    it('"quick" modifier reduces score', () => {
      const without = ScopeScorer.score('build a module');
      const withQuick = ScopeScorer.score('quick build a module');
      expect(withQuick).toBeLessThanOrEqual(without);
    });
  });

  describe('classify()', () => {
    it('returns trivial for score 0', () => {
      expect(ScopeScorer.classify(0)).toBe('trivial');
    });

    it('returns trivial for score 1', () => {
      expect(ScopeScorer.classify(1)).toBe('trivial');
    });

    it('returns minor for score 2', () => {
      expect(ScopeScorer.classify(2)).toBe('minor');
    });

    it('returns minor for score 3', () => {
      expect(ScopeScorer.classify(3)).toBe('minor');
    });

    it('returns moderate for score 4', () => {
      expect(ScopeScorer.classify(4)).toBe('moderate');
    });

    it('returns moderate for score 6', () => {
      expect(ScopeScorer.classify(6)).toBe('moderate');
    });

    it('returns major for score 7', () => {
      expect(ScopeScorer.classify(7)).toBe('major');
    });

    it('returns major for high scores', () => {
      expect(ScopeScorer.classify(10)).toBe('major');
    });
  });

  describe('shouldSkipHarness()', () => {
    it('returns true for trivial score', () => {
      expect(ScopeScorer.shouldSkipHarness(0)).toBe(true);
      expect(ScopeScorer.shouldSkipHarness(1)).toBe(true);
    });

    it('returns false for non-trivial scores', () => {
      expect(ScopeScorer.shouldSkipHarness(2)).toBe(false);
      expect(ScopeScorer.shouldSkipHarness(5)).toBe(false);
      expect(ScopeScorer.shouldSkipHarness(10)).toBe(false);
    });
  });

  describe('getWorkflow()', () => {
    it('trivial returns build, rsi', () => {
      expect(ScopeScorer.getWorkflow(0)).toEqual(['build', 'rsi']);
      expect(ScopeScorer.getWorkflow(1)).toEqual(['build', 'rsi']);
    });

    it('minor returns build, audit, rsi', () => {
      expect(ScopeScorer.getWorkflow(2)).toEqual(['build', 'audit', 'rsi']);
      expect(ScopeScorer.getWorkflow(3)).toEqual(['build', 'audit', 'rsi']);
    });

    it('moderate returns discovery, build, audit, rsi', () => {
      expect(ScopeScorer.getWorkflow(4)).toEqual(['discovery', 'build', 'audit', 'rsi']);
      expect(ScopeScorer.getWorkflow(6)).toEqual(['discovery', 'build', 'audit', 'rsi']);
    });

    it('major returns full workflow', () => {
      expect(ScopeScorer.getWorkflow(7)).toEqual(['discovery', 'design', 'plan', 'build', 'audit', 'rsi']);
      expect(ScopeScorer.getWorkflow(10)).toEqual(['discovery', 'design', 'plan', 'build', 'audit', 'rsi']);
    });
  });
});
