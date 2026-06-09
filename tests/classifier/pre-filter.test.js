import { describe, it, expect, beforeEach } from 'vitest';
import { PreFilter } from '../../src/classifier/pre-filter.js';

describe('PreFilter', () => {
  let filter;

  beforeEach(() => {
    filter = new PreFilter();
  });

  // ─── Coding Queries ─────────────────────────────────────────────

  describe('coding queries', () => {
    it('创建页面 — detects BUILD_VERBS signal', () => {
      const result = filter.classify('帮我创建一个登录页面');
      expect(result.isCoding).toBe(true);
      expect(result.matchedSignals.coding.some(s => s.includes('创建'))).toBe(true);
    });

    it('Build API with Express — multiple coding signals detected', () => {
      const result = filter.classify('Build a REST API with Express');
      expect(result.codingScore).toBeGreaterThan(0);
      expect(result.matchedSignals.coding.some(s => s.includes('build'))).toBe(true);
    });

    it('npm install express — detects TECH_STACK signal', () => {
      const result = filter.classify('npm install express');
      expect(result.isCoding).toBe(true);
      expect(result.matchedSignals.coding.some(s => s.includes('npm'))).toBe(true);
    });

    // NOTE: Chinese '修复' not in ACTIONS signals group (has 调试/优化/重构/测试).
    // Use existing ACTIONS keyword '调试' to test.
    it('调试bug — detects ACTIONS signal', () => {
      const result = filter.classify('调试登录页面的bug');
      expect(result.isCoding).toBe(true);
      expect(result.codingScore).toBeGreaterThan(0);
      expect(result.matchedSignals.coding.some(s => s.includes('调试'))).toBe(true);
    });

    // NOTE: Chinese '写' not in BUILD_VERBS (has 创建/构建/实现/生成/开发/编写).
    // Use existing BUILD_VERBS keyword '构建' to test.
    it('构建游戏 — detects BUILD_VERBS signal', () => {
      const result = filter.classify('构建一个贪吃蛇游戏');
      expect(result.isCoding).toBe(true);
      expect(result.matchedSignals.coding.some(s => s.includes('构建'))).toBe(true);
    });

    it('create React component — detects TECH_STACK signal', () => {
      const result = filter.classify('create a React component for data table');
      expect(result.isCoding).toBe(true);
      expect(result.codingScore).toBeGreaterThan(0);
    });

    it('refactor module — detects ACTIONS signal', () => {
      const result = filter.classify('refactor the payment module');
      expect(result.isCoding).toBe(true);
      expect(result.matchedSignals.coding.some(s => s.includes('refactor'))).toBe(true);
    });

    it('combined coding signals trigger proceed_coding action', () => {
      const result = filter.classify('Build a React component with API integration');
      // build (1) + react (1) + api (1) + component (1) = 4 coding, 0 non-coding
      // diff=4 > 2 → proceed_coding
      expect(result.action).toBe('proceed_coding');
      expect(result.isCoding).toBe(true);
    });
  });

  // ─── Non-Coding Queries ─────────────────────────────────────────

  describe('non-coding queries', () => {
    it('版本是什么 — detects META_VERSION signal', () => {
      const result = filter.classify('你现在使用的forcoding版本是什么');
      expect(result.matchedSignals.nonCoding.some(s => s.includes('版本'))).toBe(true);
      expect(result.nonCodingScore).toBeGreaterThan(0);
    });

    it('what version — detects META_VERSION signal', () => {
      const result = filter.classify('what version of ForCoding are you using?');
      expect(result.matchedSignals.nonCoding.some(s => s.includes('version'))).toBe(true);
    });

    it('你好 — detects CASUAL signal', () => {
      const result = filter.classify('你好');
      expect(result.matchedSignals.nonCoding.some(s => s.includes('你好'))).toBe(true);
    });

    it('谢谢 — detects CASUAL signal', () => {
      const result = filter.classify('谢谢');
      expect(result.matchedSignals.nonCoding.some(s => s.includes('谢谢'))).toBe(true);
    });

    it('how to use — detects HOW_TO signal', () => {
      const result = filter.classify('how to use this tool?');
      expect(result.matchedSignals.nonCoding.some(s => s.includes('how'))).toBe(true);
    });

    it('解释 — detects EXPLAIN signal', () => {
      const result = filter.classify('解释一下这个功能');
      expect(result.matchedSignals.nonCoding.some(s => s.includes('解释'))).toBe(true);
    });

    it('what is — detects HOW_TO signal', () => {
      const result = filter.classify('what is ForCoding');
      expect(result.matchedSignals.nonCoding.some(s => s.includes('what is'))).toBe(true);
    });

    it('combined non-coding signals trigger skip_non_coding action', () => {
      const result = filter.classify('what version is this? what is the changelog? explain the release');
      // version (1) + changelog (1) + what is (1) + explain (1) = 4 non-coding, 0 coding
      // -diff = 4 > 2 → skip_non_coding
      expect(result.action).toBe('skip_non_coding');
      expect(result.isCoding).toBe(false);
    });
  });

  // ─── Score comparison ───────────────────────────────────────────

  describe('score comparison', () => {
    it('coding queries have higher or equal codingScore', () => {
      const queries = [
        '创建登录页面并添加表单验证',
        'Build a game with canvas',
        'fix the production bug',
        '写一个CLI工具处理JSON',
        'npm install react lodash',
      ];
      for (const q of queries) {
        const result = filter.classify(q);
        expect(result.codingScore).toBeGreaterThanOrEqual(result.nonCodingScore);
      }
    });

    it('scores are non-negative', () => {
      ['创建页面', '版本是什么', '你好', 'Build API'].forEach(q => {
        const r = filter.classify(q);
        expect(r.codingScore).toBeGreaterThanOrEqual(0);
        expect(r.nonCodingScore).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // ─── Result Structure ───────────────────────────────────────────

  describe('result structure', () => {
    it('returns all required fields', () => {
      const result = filter.classify('Build a web page');
      expect(result).toHaveProperty('isCoding');
      expect(result).toHaveProperty('codingScore');
      expect(result).toHaveProperty('nonCodingScore');
      expect(result).toHaveProperty('action');
      expect(result).toHaveProperty('matchedSignals');
    });

    it('matchedSignals has coding and nonCoding arrays', () => {
      const result = filter.classify('Build a web page');
      expect(Array.isArray(result.matchedSignals.coding)).toBe(true);
      expect(Array.isArray(result.matchedSignals.nonCoding)).toBe(true);
    });

    it('action is one of the known values', () => {
      const r1 = filter.classify('Build a React component with API');
      expect(['proceed_coding', 'skip_non_coding', 'ambiguous']).toContain(r1.action);
    });
  });
});
