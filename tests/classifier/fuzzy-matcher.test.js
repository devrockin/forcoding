import { describe, it, expect, beforeEach } from 'vitest';
import { FuzzyMatcher } from '../../src/classifier/fuzzy-matcher.js';

describe('FuzzyMatcher', () => {
  let matcher;

  beforeEach(() => {
    matcher = new FuzzyMatcher();
  });

  // ─── Match ──────────────────────────────────────────────────────

  describe('match()', () => {
    it('"build a landing page" → top candidate is web-ui', () => {
      const result = matcher.match('build a landing page');
      expect(result.candidates.length).toBeGreaterThan(0);
      expect(result.candidates[0].intent).toBe('web-ui');
    });

    it('"create snake game" → top candidate is canvas-game', () => {
      const result = matcher.match('create snake game');
      expect(result.candidates[0].intent).toBe('canvas-game');
    });

    it('"REST API" → top candidate is backend-api', () => {
      const result = matcher.match('REST API');
      expect(result.candidates[0].intent).toBe('backend-api');
    });

    it('"CLI tool" → top candidate is cli-tool', () => {
      const result = matcher.match('CLI tool');
      expect(result.candidates[0].intent).toBe('cli-tool');
    });

    it('"build a data pipeline" → top candidate is data-pipeline', () => {
      const result = matcher.match('build a data pipeline');
      expect(result.candidates[0].intent).toBe('data-pipeline');
    });

    it('returns candidates sorted by confidence descending', () => {
      const result = matcher.match('create a landing page');
      for (let i = 1; i < result.candidates.length; i++) {
        expect(result.candidates[i - 1].confidence).toBeGreaterThanOrEqual(result.candidates[i].confidence);
      }
    });

    it('each candidate has intent and confidence fields', () => {
      const result = matcher.match('web page');
      for (const c of result.candidates) {
        expect(c).toHaveProperty('intent');
        expect(c).toHaveProperty('confidence');
        expect(typeof c.intent).toBe('string');
        expect(typeof c.confidence).toBe('number');
      }
    });

    it('results capped to 5 candidates', () => {
      const result = matcher.match('build a web page');
      expect(result.candidates.length).toBeLessThanOrEqual(5);
    });
  });

  // ─── Unrelated text ─────────────────────────────────────────────

  describe('unrelated text', () => {
    it('nonsense yields low confidence', () => {
      const result = matcher.match('xyzzynonsense');
      expect(result.confidence).toBeLessThan(0.2);
    });

    it('random characters yield low confidence', () => {
      const result = matcher.match('asdf ghjk qwerty');
      expect(result.confidence).toBeLessThan(0.2);
    });

    it('empty string returns no candidates', () => {
      const result = matcher.match('');
      expect(result.candidates).toEqual([]);
      expect(result.intent).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it('Chinese-only text returns empty or low confidence (anchors are English)', () => {
      const result = matcher.match('创建页面');
      // Chinese text won't match English anchors
      expect(result.confidence).toBeLessThan(0.3);
    });
  });

  // ─── Intent field ───────────────────────────────────────────────

  describe('intent field', () => {
    it('intent is non-null for clear matches (confidence >= 0.4)', () => {
      const result = matcher.match('build a landing page with HTML');
      expect(result.intent).toBeTruthy();
      expect(result.confidence).toBeGreaterThanOrEqual(0.4);
    });

    it('intent is null for very low confidence matches', () => {
      const result = matcher.match('xyzzynonsense');
      expect(result.intent).toBeNull();
    });
  });

  // ─── Ambiguity Gap ──────────────────────────────────────────────

  describe('ambiguityGap', () => {
    it('returns a number between 0 and 1', () => {
      const result = matcher.match('build a web page');
      expect(typeof result.ambiguityGap).toBe('number');
      expect(result.ambiguityGap).toBeGreaterThanOrEqual(0);
      expect(result.ambiguityGap).toBeLessThanOrEqual(1);
    });

    it('returns larger gap for highly specific query', () => {
      const specific = matcher.match('build a REST API with Express routes');
      const vague = matcher.match('create something');
      expect(specific.ambiguityGap).toBeGreaterThan(vague.ambiguityGap);
    });
  });

  // ─── Cross-type matching ────────────────────────────────────────

  describe('cross-type behavior', () => {
    it('hotfix query prioritizes hotfix intent', () => {
      const result = matcher.match('fix a bug in production');
      expect(result.candidates[0].intent).toBe('hotfix');
    });

    it('refactor query prioritizes refactor intent', () => {
      const result = matcher.match('refactor the codebase structure');
      expect(result.candidates[0].intent).toBe('refactor');
    });

    it('npm library query prioritizes npm-library intent', () => {
      const result = matcher.match('create an npm package');
      expect(result.candidates[0].intent).toBe('npm-library');
    });
  });
});
