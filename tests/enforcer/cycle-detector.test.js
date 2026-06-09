import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CycleDetector } from '../../src/enforcer/cycle-detector.js';
import { CycleLimitExceededError } from '../../src/fsm/errors.js';
import { createMockState } from '../helpers/setup.js';

describe('CycleDetector', () => {
  let mockStore;
  let detector;
  const sessionId = 'test-session';

  beforeEach(() => {
    mockStore = {
      load: vi.fn(function () { return createMockState({ sessionId, auditCycles: 0 }); }),
      update: vi.fn(),
    };
    detector = new CycleDetector(mockStore);
  });

  it('MAX_CYCLES is 3', () => {
    expect(CycleDetector.MAX_CYCLES).toBe(3);
  });

  it('check increments auditCycles', () => {
    detector.check(sessionId);
    expect(mockStore.update).toHaveBeenCalledWith({ sessionId, auditCycles: 1 });
  });

  it('4th check throws CycleLimitExceededError', () => {
    mockStore.load = vi.fn(function () {
      return createMockState({ sessionId, auditCycles: 3 });
    });
    expect(function () { detector.check(sessionId); }).toThrow(CycleLimitExceededError);
    expect(function () { detector.check(sessionId); }).toThrow('cycle limit');
  });

  it('first 3 checks do not throw', () => {
    let cycles = 0;
    mockStore.load = vi.fn(function () {
      return createMockState({ sessionId, auditCycles: cycles });
    });
    mockStore.update = vi.fn(function (opts) { cycles = opts.auditCycles; });
    expect(function () { detector.check(sessionId); }).not.toThrow();
    expect(function () { detector.check(sessionId); }).not.toThrow();
    expect(function () { detector.check(sessionId); }).not.toThrow();
    expect(cycles).toBe(3);
  });

  it('reset sets auditCycles to 0', () => {
    detector.reset(sessionId);
    expect(mockStore.update).toHaveBeenCalledWith({ sessionId, auditCycles: 0 });
  });

  it('after reset counting starts from 0', () => {
    let cycles = 0;
    mockStore.load = vi.fn(function () {
      return createMockState({ sessionId, auditCycles: cycles });
    });
    mockStore.update = vi.fn(function (opts) { cycles = opts.auditCycles; });
    detector.check(sessionId);
    detector.check(sessionId);
    expect(cycles).toBe(2);
    detector.reset(sessionId);
    cycles = 0;
    detector.check(sessionId);
    detector.check(sessionId);
    detector.check(sessionId);
    expect(cycles).toBe(3);
    cycles = 3;
    mockStore.load = vi.fn(function () {
      return createMockState({ sessionId, auditCycles: 3 });
    });
    expect(function () { detector.check(sessionId); }).toThrow(CycleLimitExceededError);
  });
});