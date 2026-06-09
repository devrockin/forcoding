import { describe, it, expect } from 'vitest';
import { SubtypeValidator } from '../../src/classifier/subtype-validator.js';

describe('SubtypeValidator', () => {

  describe('validate()', () => {
    it('game+app is valid', () => {
      const result = SubtypeValidator.validate({ domain: 'game', form: 'app', framework: 'vanilla' });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('game+library is invalid', () => {
      const result = SubtypeValidator.validate({ domain: 'game', form: 'library' });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('game');
      expect(result.errors[0]).toContain('library');
    });

    it('game+api is invalid', () => {
      const result = SubtypeValidator.validate({ domain: 'game', form: 'api' });
      expect(result.valid).toBe(false);
    });

    it('game+config is invalid', () => {
      const result = SubtypeValidator.validate({ domain: 'game', form: 'config' });
      expect(result.valid).toBe(false);
    });

    it('cli+spa is invalid', () => {
      const result = SubtypeValidator.validate({ domain: 'cli', form: 'spa' });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('cli');
      expect(result.errors[0]).toContain('spa');
    });

    it('cli+single-page is invalid', () => {
      const result = SubtypeValidator.validate({ domain: 'cli', form: 'single-page' });
      expect(result.valid).toBe(false);
    });

    it('cli+script is valid', () => {
      const result = SubtypeValidator.validate({ domain: 'cli', form: 'script' });
      expect(result.valid).toBe(true);
    });

    it('frontend+express is invalid', () => {
      const result = SubtypeValidator.validate({ domain: 'frontend', framework: 'express' });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Express');
      expect(result.errors[0]).toContain('backend');
    });

    it('frontend+react is valid', () => {
      const result = SubtypeValidator.validate({ domain: 'frontend', framework: 'react' });
      expect(result.valid).toBe(true);
    });

    it('backend+react is invalid', () => {
      const result = SubtypeValidator.validate({ domain: 'backend', framework: 'react' });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('React');
      expect(result.errors[0]).toContain('frontend');
    });

    it('backend+fastapi is valid', () => {
      const result = SubtypeValidator.validate({ domain: 'backend', framework: 'fastapi' });
      expect(result.valid).toBe(true);
    });

    it('backend+express is valid', () => {
      const result = SubtypeValidator.validate({ domain: 'backend', framework: 'express' });
      expect(result.valid).toBe(true);
    });

    it('fullstack+any framework is valid', () => {
      const result = SubtypeValidator.validate({ domain: 'fullstack', framework: 'react', form: 'app' });
      expect(result.valid).toBe(true);
    });

    it('data+script is valid', () => {
      const result = SubtypeValidator.validate({ domain: 'data', form: 'script', framework: 'vanilla' });
      expect(result.valid).toBe(true);
    });

    it('multiple errors are collected', () => {
      const result = SubtypeValidator.validate({ domain: 'game', form: 'library', framework: 'react' });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
    });
  });
});
