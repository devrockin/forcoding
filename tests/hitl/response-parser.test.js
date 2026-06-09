import { describe, it, expect } from 'vitest';
import { ResponseParser } from '../../src/hitl/response-parser.js';

describe('ResponseParser', () => {
  describe('parse()', () => {
    it('"ok" returns confirm', () => {
      expect(ResponseParser.parse('ok')).toEqual({ action: 'confirm' });
    });

    it('"yes" returns confirm', () => {
      expect(ResponseParser.parse('yes')).toEqual({ action: 'confirm' });
    });

    it('"y" returns confirm', () => {
      expect(ResponseParser.parse('y')).toEqual({ action: 'confirm' });
    });

    it('"go" returns confirm', () => {
      expect(ResponseParser.parse('go')).toEqual({ action: 'confirm' });
    });

    it('"proceed" returns confirm', () => {
      expect(ResponseParser.parse('proceed')).toEqual({ action: 'confirm' });
    });

    it('"a" returns select-alternative with index 0', () => {
      const result = ResponseParser.parse('a');
      expect(result.action).toBe('select-alternative');
      expect(result.index).toBe(0);
    });

    it('"b" returns select-alternative with index 1', () => {
      const result = ResponseParser.parse('b');
      expect(result.action).toBe('select-alternative');
      expect(result.index).toBe(1);
    });

    it('"d" returns select-alternative with index 3', () => {
      const result = ResponseParser.parse('d');
      expect(result.action).toBe('select-alternative');
      expect(result.index).toBe(3);
    });

    it('"type: web-ui" returns adjust with correct taskType', () => {
      const result = ResponseParser.parse('type: web-ui');
      expect(result.action).toBe('adjust');
      expect(result.adjustments.taskType).toBe('web-ui');
    });

    it('"type:  canvas-game" handles extra spaces', () => {
      const result = ResponseParser.parse('type:  canvas-game');
      expect(result.action).toBe('adjust');
      expect(result.adjustments.taskType).toBe('canvas-game');
    });

    it('"depth: standard" returns adjust with weight', () => {
      const result = ResponseParser.parse('depth: standard');
      expect(result.action).toBe('adjust');
      expect(result.adjustments.weight).toBe('standard');
    });

    it('"type: cli-tool depth: heavy" sets both', () => {
      const result = ResponseParser.parse('type: cli-tool depth: heavy');
      expect(result.action).toBe('adjust');
      expect(result.adjustments.taskType).toBe('cli-tool');
      expect(result.adjustments.weight).toBe('heavy');
    });

    it('"junk" returns unknown', () => {
      expect(ResponseParser.parse('junk')).toEqual({ action: 'unknown' });
    });

    it('empty string returns unknown', () => {
      expect(ResponseParser.parse('')).toEqual({ action: 'unknown' });
    });

    it('whitespace-only string returns unknown', () => {
      expect(ResponseParser.parse('   ')).toEqual({ action: 'unknown' });
    });

    it('uppercase "A" still selects alternative', () => {
      const result = ResponseParser.parse('A');
      expect(result.action).toBe('select-alternative');
      expect(result.index).toBe(0);
    });
  });

  describe('detectSupervisor()', () => {
    it('"skip audit" returns skip_audit', () => {
      expect(ResponseParser.detectSupervisor('skip audit')).toEqual({ command: 'skip_audit' });
    });

    it('"no audit" returns skip_audit', () => {
      expect(ResponseParser.detectSupervisor('no audit')).toEqual({ command: 'skip_audit' });
    });

    it('"force build" returns force_build', () => {
      expect(ResponseParser.detectSupervisor('force build')).toEqual({ command: 'force_build' });
    });

    it('"back to design" returns back_to_design', () => {
      expect(ResponseParser.detectSupervisor('back to design')).toEqual({ command: 'back_to_design' });
    });

    it('"pause" returns pause', () => {
      expect(ResponseParser.detectSupervisor('pause')).toEqual({ command: 'pause' });
    });

    it('"resume" when paused returns resume', () => {
      expect(ResponseParser.detectSupervisor('resume', { paused: true })).toEqual({ command: 'resume' });
    });

    it('"resume" when not paused returns null', () => {
      expect(ResponseParser.detectSupervisor('resume', { paused: false })).toBeNull();
    });

    it('"resume" with no state returns null', () => {
      expect(ResponseParser.detectSupervisor('resume')).toBeNull();
    });

    it('"shortcut" returns shortcut', () => {
      expect(ResponseParser.detectSupervisor('shortcut')).toEqual({ command: 'shortcut' });
    });

    it('"full process" returns full', () => {
      expect(ResponseParser.detectSupervisor('full process')).toEqual({ command: 'full' });
    });

    it('"full harness" returns full', () => {
      expect(ResponseParser.detectSupervisor('full harness')).toEqual({ command: 'full' });
    });

    it('"full workflow" returns full', () => {
      expect(ResponseParser.detectSupervisor('full workflow')).toEqual({ command: 'full' });
    });

    it('normal text returns null', () => {
      expect(ResponseParser.detectSupervisor('build a web page')).toBeNull();
    });

    it('empty string returns null', () => {
      expect(ResponseParser.detectSupervisor('')).toBeNull();
    });

    it('case insensitive', () => {
      expect(ResponseParser.detectSupervisor('SKIP AUDIT')).toEqual({ command: 'skip_audit' });
      expect(ResponseParser.detectSupervisor('Force Build')).toEqual({ command: 'force_build' });
    });
  });
});
