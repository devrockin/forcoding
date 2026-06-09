import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContextBudgetManager } from '../../src/enforcer/context-budget.js';
import { createMockState } from '../helpers/setup.js';

describe('ContextBudgetManager', function() {
  let manager;
  let mockStore;
  let sessionId;

  beforeEach(function() {
    manager = new ContextBudgetManager(48000);
    sessionId = 'test-session';
    mockStore = {
      load: vi.fn(function() { return createMockState({ sessionId: sessionId }); }),
      update: vi.fn(),
    };
  });

  it('default modelLimit is 48000', function() {
    expect(manager.limit).toBe(48000);
  });

  it('thresholds are set correctly', function() {
    expect(manager.warningThreshold).toBe(0.50);
    expect(manager.rotationThreshold).toBe(0.75);
    expect(manager.emergencyThreshold).toBe(0.85);
  });

  it('track with short input returns level ok', function() {
    var result = manager.track('short input', sessionId, mockStore);
    expect(result.level).toBe('ok');
    expect(result.usage).toBeGreaterThan(0);
    expect(result.percent).toBeDefined();
  });

  it('track accumulates token count across calls', function() {
    var cumulative = 0;
    mockStore.load = vi.fn(function() { return createMockState({ sessionId: sessionId, estimatedTokens: cumulative }); });
    mockStore.update = vi.fn(function(opts) { cumulative = opts.estimatedTokens; });
    var r1 = manager.track('hello world', sessionId, mockStore);
    var r2 = manager.track('another message here', sessionId, mockStore);
    var r3 = manager.track('third input for testing tokens', sessionId, mockStore);
    expect(r3.usage).toBeGreaterThan(r2.usage);
    expect(r2.usage).toBeGreaterThan(r1.usage);
  });

  it('returns level warning when crossing 50pct', function() {
    mockStore.load = vi.fn(function() { return createMockState({ sessionId: sessionId, estimatedTokens: 24000 }); });
    var result = manager.track('a', sessionId, mockStore);
    expect(result.level).toBe('warning');
  });

  it('returns level rotation when crossing 75pct', function() {
    mockStore.load = vi.fn(function() { return createMockState({ sessionId: sessionId, estimatedTokens: 36000 }); });
    var result = manager.track('a', sessionId, mockStore);
    expect(result.level).toBe('rotation');
    expect(result.cue).toContain('Rotation');
  });

  it('returns level emergency when crossing 85pct', function() {
    mockStore.load = vi.fn(function() { return createMockState({ sessionId: sessionId, estimatedTokens: 41000 }); });
    var result = manager.track('x', sessionId, mockStore);
    expect(result.level).toBe('emergency');
    expect(result.cue).toContain('EMERGENCY');
  });

  it('emergency level includes cue with ForCoding', function() {
    mockStore.load = vi.fn(function() { return createMockState({ sessionId: sessionId, estimatedTokens: 42000 }); });
    var result = manager.track('test', sessionId, mockStore);
    expect(result.level).toBe('emergency');
    expect(result.cue).toContain('[ForCoding]');
    expect(result.percent).toBeDefined();
  });

  it('estimateTokens returns Math ceil length over 4', function() {
    expect(manager.estimateTokens('abcd')).toBe(1);
    expect(manager.estimateTokens('abcdefgh')).toBe(2);
    expect(manager.estimateTokens('a')).toBe(1);
  });

  it('estimateTokens handles objects by stringifying', function() {
    var obj = { key: 'value' };
    var jsonLen = JSON.stringify(obj).length;
    expect(manager.estimateTokens(obj)).toBe(Math.ceil(jsonLen / 4));
  });

  it('reset sets estimatedTokens to 0', function() {
    manager.reset(sessionId, mockStore);
    expect(mockStore.update).toHaveBeenCalledWith({ sessionId: sessionId, estimatedTokens: 0 });
  });

  it('handles multiple consecutive track calls', function() {
    var cumulative = 0;
    mockStore.load = vi.fn(function() { return createMockState({ sessionId: sessionId, estimatedTokens: cumulative }); });
    mockStore.update = vi.fn(function(opts) { cumulative = opts.estimatedTokens; });
    for (var i = 0; i < 5; i++) {
      var result = manager.track('test', sessionId, mockStore);
      expect(result.level).toBe('ok');
    }
    expect(cumulative).toBeGreaterThan(0);
  });
});