import { describe, it, expect } from 'vitest';
import {
  FSMError,
  IllegalTransitionError,
  GateMissingError,
  CycleLimitExceededError,
  ClassificationNotLockedError,
  StateStoreError,
} from '../../src/fsm/errors.js';

// ─── FSMError base class ────────────────────────────────────────
describe('FSMError', () => {
  it('is an Error subclass', () => {
    const err = new FSMError('base error');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(FSMError);
  });

  it('has name FSMError', () => {
    const err = new FSMError('base error');
    expect(err.name).toBe('FSMError');
  });

  it('carries the message', () => {
    const err = new FSMError('something went wrong');
    expect(err.message).toBe('something went wrong');
  });
});

// ─── IllegalTransitionError ─────────────────────────────────────
describe('IllegalTransitionError', () => {
  it('is instanceof FSMError and Error', () => {
    const err = new IllegalTransitionError('idle', 'build');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(FSMError);
    expect(err).toBeInstanceOf(IllegalTransitionError);
  });

  it('has correct name', () => {
    const err = new IllegalTransitionError('idle', 'build');
    expect(err.name).toBe('IllegalTransitionError');
  });

  it('includes from and to in message', () => {
    const err = new IllegalTransitionError('idle', 'build');
    expect(err.message).toContain('idle');
    expect(err.message).toContain('build');
    expect(err.message).toMatch(/idle.*build/);
  });

  it('has from and to properties', () => {
    const err = new IllegalTransitionError('idle', 'build');
    expect(err.from).toBe('idle');
    expect(err.to).toBe('build');
  });
});

// ─── GateMissingError ───────────────────────────────────────────
describe('GateMissingError', () => {
  it('is instanceof FSMError and Error', () => {
    const err = new GateMissingError('design');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(FSMError);
    expect(err).toBeInstanceOf(GateMissingError);
  });

  it('has correct name', () => {
    const err = new GateMissingError('design');
    expect(err.name).toBe('GateMissingError');
  });

  it('has stage property', () => {
    const err = new GateMissingError('design');
    expect(err.stage).toBe('design');
  });

  it('message mentions the stage', () => {
    const err = new GateMissingError('design');
    expect(err.message).toContain('design');
  });
});

// ─── CycleLimitExceededError ────────────────────────────────────
describe('CycleLimitExceededError', () => {
  it('is instanceof FSMError and Error', () => {
    const err = new CycleLimitExceededError(3);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(FSMError);
    expect(err).toBeInstanceOf(CycleLimitExceededError);
  });

  it('has correct name', () => {
    const err = new CycleLimitExceededError(3);
    expect(err.name).toBe('CycleLimitExceededError');
  });

  it('has cycles property', () => {
    const err = new CycleLimitExceededError(3);
    expect(err.cycles).toBe(3);
  });

  it('message includes the cycle count', () => {
    const err = new CycleLimitExceededError(3);
    expect(err.message).toContain('3');
  });
});

// ─── ClassificationNotLockedError ───────────────────────────────
describe('ClassificationNotLockedError', () => {
  it('is instanceof FSMError and Error', () => {
    const err = new ClassificationNotLockedError();
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(FSMError);
    expect(err).toBeInstanceOf(ClassificationNotLockedError);
  });

  it('has correct name', () => {
    const err = new ClassificationNotLockedError();
    expect(err.name).toBe('ClassificationNotLockedError');
  });

  it('has a default message about classification not confirmed', () => {
    const err = new ClassificationNotLockedError();
    expect(err.message).toMatch(/classification.*(not|confirmed)/i);
  });
});

// ─── StateStoreError ────────────────────────────────────────────
describe('StateStoreError', () => {
  it('is instanceof FSMError and Error', () => {
    const err = new StateStoreError('msg', '/some/path');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(FSMError);
    expect(err).toBeInstanceOf(StateStoreError);
  });

  it('has correct name', () => {
    const err = new StateStoreError('msg', '/some/path');
    expect(err.name).toBe('StateStoreError');
  });

  it('has path property', () => {
    const err = new StateStoreError('msg', '/some/path');
    expect(err.path).toBe('/some/path');
  });

  it('carries the message', () => {
    const err = new StateStoreError('storage failure', '/path/to/file');
    expect(err.message).toBe('storage failure');
  });
});
