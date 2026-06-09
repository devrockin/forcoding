import { describe, it, expect } from 'vitest';
import { ToolAllowlist } from '../../src/enforcer/tool-allowlist.js';
import { STATE } from '../../src/fsm/transitions.js';

describe('ToolAllowlist', () => {
  // Phase-specific tool access
  it('allows read in IDLE phase', () => {
    expect(ToolAllowlist.isAllowed('read', STATE.IDLE)).toBe(true);
  });

  it('allows write and bash in IDLE phase (orchestrator needs them)', () => {
    expect(ToolAllowlist.isAllowed('write', STATE.IDLE)).toBe(true);
    expect(ToolAllowlist.isAllowed('bash', STATE.IDLE)).toBe(true);
    expect(ToolAllowlist.isAllowed('todowrite', STATE.IDLE)).toBe(true);
    expect(ToolAllowlist.isAllowed('question', STATE.IDLE)).toBe(true);
  });

  it('allows task in BUILD phase', () => {
    expect(ToolAllowlist.isAllowed('task', STATE.BUILD)).toBe(true);
  });

  it('denies read in BUILD phase', () => {
    expect(ToolAllowlist.isAllowed('read', STATE.BUILD)).toBe(false);
  });

  it('allows bash in IDLE and DONE phase', () => {
    expect(ToolAllowlist.isAllowed('bash', STATE.IDLE)).toBe(true);
    expect(ToolAllowlist.isAllowed('bash', STATE.DONE)).toBe(true);
  });

  it('allows glob/grep in DISCOVERY phase', () => {
    expect(ToolAllowlist.isAllowed('glob', STATE.DISCOVERY)).toBe(true);
    expect(ToolAllowlist.isAllowed('grep', STATE.DISCOVERY)).toBe(true);
    expect(ToolAllowlist.isAllowed('read', STATE.DISCOVERY)).toBe(true);
  });

  it('allows write/edit in DISCOVERY phase', () => {
    expect(ToolAllowlist.isAllowed('write', STATE.DISCOVERY)).toBe(true);
    expect(ToolAllowlist.isAllowed('edit', STATE.DISCOVERY)).toBe(true);
  });

  it('allows read only in DESIGN/PLAN', () => {
    expect(ToolAllowlist.isAllowed('read', STATE.DESIGN)).toBe(true);
    expect(ToolAllowlist.isAllowed('glob', STATE.DESIGN)).toBe(true);
    expect(ToolAllowlist.isAllowed('grep', STATE.DESIGN)).toBe(true);
    expect(ToolAllowlist.isAllowed('write', STATE.DESIGN)).toBe(false);
  });

  it('allows only task in BUILD', () => {
    expect(ToolAllowlist.isAllowed('task', STATE.BUILD)).toBe(true);
    expect(ToolAllowlist.isAllowed('read', STATE.BUILD)).toBe(false);
    expect(ToolAllowlist.isAllowed('write', STATE.BUILD)).toBe(false);
    expect(ToolAllowlist.isAllowed('glob', STATE.BUILD)).toBe(false);
  });

  it('allows task in BUILD_RECOVERY', () => {
    expect(ToolAllowlist.isAllowed('task', STATE.BUILD_RECOVERY)).toBe(true);
    expect(ToolAllowlist.isAllowed('read', STATE.BUILD_RECOVERY)).toBe(false);
  });

  it('allows task/read/glob/grep in AUDIT phase', () => {
    expect(ToolAllowlist.isAllowed('task', STATE.AUDIT)).toBe(true);
    expect(ToolAllowlist.isAllowed('read', STATE.AUDIT)).toBe(true);
    expect(ToolAllowlist.isAllowed('glob', STATE.AUDIT)).toBe(true);
    expect(ToolAllowlist.isAllowed('grep', STATE.AUDIT)).toBe(true);
    expect(ToolAllowlist.isAllowed('write', STATE.AUDIT)).toBe(false);
  });

  it('allows read/playwright* in RSI phase', () => {
    expect(ToolAllowlist.isAllowed('read', STATE.RSI)).toBe(true);
    expect(ToolAllowlist.isAllowed('playwright_browser_click', STATE.RSI)).toBe(true);
    expect(ToolAllowlist.isAllowed('playwright_browser_snapshot', STATE.RSI)).toBe(true);
    expect(ToolAllowlist.isAllowed('write', STATE.RSI)).toBe(false);
  });

  it('allows bash:git* in DONE phase (git operations)', () => {
    expect(ToolAllowlist.isAllowed('bash', STATE.DONE)).toBe(true);
    expect(ToolAllowlist.isAllowed('read', STATE.DONE)).toBe(true);
    expect(ToolAllowlist.isAllowed('write', STATE.DONE)).toBe(false);
  });

  it('AWAITING_HITL allows read, bash:git*, and question (HITL dialog tools)', () => {
    expect(ToolAllowlist.isAllowed('read', STATE.AWAITING_HITL)).toBe(true);
    expect(ToolAllowlist.isAllowed('question', STATE.AWAITING_HITL)).toBe(true);
    expect(ToolAllowlist.isAllowed('write', STATE.AWAITING_HITL)).toBe(false);
    expect(ToolAllowlist.isAllowed('task', STATE.AWAITING_HITL)).toBe(false);
  });

  it('unknown phase returns empty list (denies everything)', () => {
    expect(ToolAllowlist.isAllowed('read', 'unknown_phase')).toBe(false);
    expect(ToolAllowlist.isAllowed('task', 'unknown_phase')).toBe(false);
  });

  it('PROTOTYPE allows task and read', () => {
    expect(ToolAllowlist.isAllowed('task', STATE.PROTOTYPE)).toBe(true);
    expect(ToolAllowlist.isAllowed('read', STATE.PROTOTYPE)).toBe(true);
    expect(ToolAllowlist.isAllowed('write', STATE.PROTOTYPE)).toBe(false);
  });

  it('CLASSIFYING state falls back to empty list', () => {
    expect(ToolAllowlist.isAllowed('read', STATE.CLASSIFYING)).toBe(false);
    expect(ToolAllowlist.isAllowed('task', STATE.CLASSIFYING)).toBe(false);
  });
});