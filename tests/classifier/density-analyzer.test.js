import { describe, it, expect, beforeEach } from 'vitest';
import { DensityAnalyzer } from '../../src/classifier/density-analyzer.js';

describe('DensityAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new DensityAnalyzer();
  });

  describe('analyze()', () => {
    it('returns subsystemCount, fileCount, ratio', () => {
      const result = analyzer.analyze('make a thing', { fileCount: 2 });
      expect(result).toHaveProperty('subsystemCount');
      expect(result).toHaveProperty('fileCount');
      expect(result).toHaveProperty('ratio');
      expect(result).toHaveProperty('isHighDensity');
      expect(typeof result.subsystemCount).toBe('number');
      expect(typeof result.fileCount).toBe('number');
      expect(typeof result.ratio).toBe('number');
    });

    it('ratio calculation works with neutral prompt', () => {
      const result = analyzer.analyze('foo bar baz qux', { fileCount: 2 });
      expect(result.ratio).toBe(1.0);
    });

    it('minimum fileCount is 1', () => {
      const result = analyzer.analyze('foo', { fileCount: 0 });
      expect(result.fileCount).toBe(1);
    });

    it('isHighDensity when ratio > 2', () => {
      const result = analyzer.analyze('game canvas keyboard collision', { fileCount: 1 });
      expect(result.ratio).toBeGreaterThan(2);
      expect(result.isHighDensity).toBe(true);
    });

    it('isHighDensity false when ratio <= 2', () => {
      const result = analyzer.analyze('foo bar', { fileCount: 5 });
      expect(result.isHighDensity).toBe(false);
    });

    it('includes note when high density', () => {
      const result = analyzer.analyze('game', { fileCount: 1 });
      expect(result.note).toBeTruthy();
      expect(result.note).toContain('High-density');
    });

    it('note is null when not high density', () => {
      const result = analyzer.analyze('foo', { fileCount: 10 });
      expect(result.note).toBeNull();
    });
  });

  describe('estimate()', () => {
    it('base estimate is 2', () => {
      const count = analyzer.estimate('something generic');
      expect(count).toBe(2);
    });

    it('game keywords increase estimate', () => {
      const count = analyzer.estimate('game canvas keyboard collision');
      expect(count).toBeGreaterThanOrEqual(6);
    });

    it('timer keywords increase estimate', () => {
      const count = analyzer.estimate('timer pomodoro');
      expect(count).toBeGreaterThanOrEqual(4);
    });

    it('auth keywords return count=5', () => {
      expect(analyzer.estimate('auth login register 登录')).toBe(5);
      expect(analyzer.estimate('dashboard仪表盘')).toBe(5);
    });

    it('API keywords return count=3', () => {
      expect(analyzer.estimate('api endpoint route handler')).toBe(3);
    });

    it('CRUD keywords return count=4', () => {
      expect(analyzer.estimate('crud create read update delete')).toBe(4);
    });

    it('database keyword adds 1', () => {
      expect(analyzer.estimate('database')).toBe(3);
    });

    it('UI keyword adds 1', () => {
      expect(analyzer.estimate('ui design')).toBe(3);
    });

    it('test keyword adds 1', () => {
      expect(analyzer.estimate('add some tests 测试')).toBe(3);
    });

    it('multiple bonuses stack', () => {
      expect(analyzer.estimate('database and ui design and tests')).toBeGreaterThanOrEqual(5);
    });

    it('max estimate is 12', () => {
      const count = analyzer.estimate('game keyboard collision with database ui style design 测试');
      expect(count).toBeLessThanOrEqual(12);
    });

    it('game overrides timer', () => {
      const count = analyzer.estimate('game timer');
      expect(count).toBeGreaterThanOrEqual(6);
    });
  });
});
