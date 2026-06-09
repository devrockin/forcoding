import { describe, it, expect, beforeEach } from 'vitest';
import { PreBuildGate } from '../../src/enforcer/pre-build-gate.js';
import { createMockState } from '../helpers/setup.js';

describe('PreBuildGate', () => {
  let gate;
  let mockState;

  beforeEach(() => {
    gate = new PreBuildGate();
    mockState = createMockState();
  });

  it('non-builder agent returns valid=true no errors', () => {
    const result = gate.validate('forcoding-designer', 'some prompt', mockState);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('web-ui missing ROUND declaration returns error', () => {
    const prompt = 'Build a UI component';
    const result = gate.validate('forcoding-builder', prompt, mockState);
    expect(result.valid).toBe(false);
    expect(result.errors.some(function (e) { return e.name === 'round-declaration'; })).toBe(true);
  });

  it('web-ui missing VISUAL REFERENCE or CONCEPT returns error', () => {
    const prompt = 'ROUND: 1\nBuild a UI';
    const result = gate.validate('forcoding-builder', prompt, mockState);
    expect(result.valid).toBe(false);
    expect(result.errors.some(function (e) { return e.name === 'visual-section'; })).toBe(true);
  });

  it('web-ui missing Delight element returns error', () => {
    const prompt = 'ROUND: 1\n## VISUAL REFERENCE\nSome design\n';
    const result = gate.validate('forcoding-builder', prompt, mockState);
    expect(result.valid).toBe(false);
    expect(result.errors.some(function (e) { return e.name === 'delight'; })).toBe(true);
  });

  it('web-ui missing interaction states returns error', () => {
    const prompt = 'ROUND: 1\n## VISUAL REFERENCE\nSome design\nDelight element: toast\n';
    const result = gate.validate('forcoding-builder', prompt, mockState);
    expect(result.valid).toBe(false);
    expect(result.errors.some(function (e) { return e.name === 'interaction'; })).toBe(true);
  });

  it('web-ui all checks pass returns valid=true', () => {
    const prompt = '## VISUAL CONCEPT\nNeumorphic design\nROUND: 1\nDelight element: toast\ninteraction stat: loading, empty, error';
    const result = gate.validate('forcoding-builder', prompt, mockState);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('canvas-game missing game loop pattern returns error', () => {
    const state = createMockState({ classification: { taskType: 'canvas-game' } });
    const prompt = 'ROUND: 1\nBuild a game\n';
    const result = gate.validate('forcoding-builder', prompt, state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(function (e) { return e.name === 'game-loop'; })).toBe(true);
  });

  it('canvas-game missing performance target returns error', () => {
    const state = createMockState({ classification: { taskType: 'canvas-game' } });
    const prompt = 'ROUND: 1\ngame loop using tick method';
    const result = gate.validate('forcoding-builder', prompt, state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(function (e) { return e.name === 'perf-target'; })).toBe(true);
  });

  it('canvas-game with requestAnimationFrame and 60fps returns valid=true', () => {
    const state = createMockState({ classification: { taskType: 'canvas-game' } });
    const prompt = 'ROUND: 1\nrequestAnimationFrame for game loop\nTarget 60fps performance\n';
    const result = gate.validate('forcoding-builder', prompt, state);
    expect(result.valid).toBe(true);
  });

  it('cli-tool missing exit code handling returns error', () => {
    const state = createMockState({ classification: { taskType: 'cli-tool', tags: {} } });
    const prompt = 'Build a CLI tool';
    const result = gate.validate('forcoding-builder', prompt, state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(function (e) { return e.name === 'exit-codes'; })).toBe(true);
  });

  it('cli-tool does not require UI checks', () => {
    const state = createMockState({ classification: { taskType: 'cli-tool', tags: {} } });
    const prompt = 'exit code handling is important';
    const result = gate.validate('forcoding-builder', prompt, state);
    expect(result.errors.some(function (e) { return e.name === 'visual-section'; })).toBe(false);
    expect(result.valid).toBe(true);
  });

  it('backend-api missing input validation returns error', () => {
    const state = createMockState({ classification: { taskType: 'backend-api', tags: {} } });
    const prompt = 'Build an API';
    const result = gate.validate('forcoding-builder', prompt, state);
    expect(result.valid).toBe(false);
    expect(result.errors.some(function (e) { return e.name === 'validation'; })).toBe(true);
  });

  it('backend-api also checks ROUND declaration', () => {
    const state = createMockState({ classification: { taskType: 'backend-api', tags: {} } });
    const prompt = 'Build an API with validation and schema';
    const result = gate.validate('forcoding-builder', prompt, state);
    expect(result.errors.some(function (e) { return e.name === 'round-declaration'; })).toBe(true);
  });

  it('unknown taskType falls back to web-ui checks', () => {
    const state = createMockState({ classification: { taskType: 'weird-new-type', tags: {} } });
    const prompt = 'Do something new';
    const result = gate.validate('forcoding-builder', prompt, state);
    expect(result.errors.some(function (e) { return e.name === 'round-declaration'; })).toBe(true);
  });

  it('generateRemediation generates fix suggestions from errors', () => {
    const errors = [
      { name: 'round-declaration', message: 'Missing ROUND declaration', remediation: 'Add ROUND: N to your dispatch prompt' },
      { name: 'visual-section', message: 'Missing VISUAL REFERENCES section', remediation: 'Add design-taste section' },
    ];
    const suggestions = gate.generateRemediation(errors, mockState);
    expect(suggestions).toHaveLength(2);
    expect(suggestions[0]).toContain('ROUND');
    expect(suggestions[1]).toContain('design-taste');
  });
});
