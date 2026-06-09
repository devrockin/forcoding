import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IntentClassifier } from '../../src/classifier/intent-classifier.js';
import { ProjectScanner } from '../../src/classifier/project-scanner.js';
import { TechDetector } from '../../src/classifier/tech-detector.js';
import { createTempDir, cleanupTempDir } from '../helpers/setup.js';

describe('IntentClassifier', () => {
  let classifier;
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
    vi.spyOn(ProjectScanner.prototype, 'scan').mockReturnValue({
      hasFiles: false, files: [], fileCount: 0, hasTests: false,
      projectType: 'greenfield', htmlFiles: 0, jsFiles: 0,
      tsFiles: 0, pyFiles: 0, cssFiles: 0, configFiles: 0,
    });
    vi.spyOn(TechDetector.prototype, 'detect').mockReturnValue({
      framework: 'vanilla', runtime: 'node', packageManager: 'npm',
      language: 'javascript', hasTypeScript: false,
    });
    classifier = new IntentClassifier();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanupTempDir(tempDir);
  });

  describe('classify()', () => {
    it('web-ui for HTML/CSS web page prompts', async () => {
      const result = await classifier.classify('Build a web page with HTML and CSS', tempDir);
      expect(result.taskType).toBe('web-ui');
      expect(result.tags.domain).toBe('frontend');
      expect(result.tags.form).toBe('single-page');
    });

    it('canvas-game for canvas game with keyboard prompts', async () => {
      const result = await classifier.classify('Create a canvas game with keyboard input', tempDir);
      expect(result.taskType).toBe('canvas-game');
      expect(result.tags.domain).toBe('game');
      expect(result.tags.lifecycle).toBe('greenfield');
    });

    it('cli-tool for CLI tool with exit code prompts', async () => {
      const result = await classifier.classify('Write a CLI tool for file processing with exit codes', tempDir);
      expect(result.taskType).toBe('cli-tool');
      expect(result.tags.domain).toBe('cli');
      expect(result.tags.form).toBe('script');
    });

    it('data-pipeline for data ETL pipeline prompts', async () => {
      const result = await classifier.classify('Create a data pipeline ETL', tempDir);
      expect(result.taskType).toBe('data-pipeline');
      expect(result.tags.domain).toBe('data');
    });

    it('hotfix for bug fix prompts', async () => {
      const result = await classifier.classify('Fix a bug in login', tempDir);
      expect(result.taskType).toBe('hotfix');
      expect(result.tags.lifecycle).toBe('hotfix');
    });

    it('refactor for refactoring prompts', async () => {
      const result = await classifier.classify('Refactor the auth module', tempDir);
      expect(result.taskType).toBe('refactor');
      expect(result.tags.lifecycle).toBe('refactor');
    });

    it('backend-api for backend endpoint prompts', async () => {
      const result = await classifier.classify('Create a REST API with Express middleware and route handlers', tempDir);
      expect(result.taskType).toBe('backend-api');
      expect(result.tags.domain).toBe('backend');
    });

    it('npm-library for npm library prompts', async () => {
      const result = await classifier.classify('Create an npm library', tempDir);
      expect(result.taskType).toBe('npm-library');
      expect(result.tags.form).toBe('library');
    });

    it('spa-app for React SPA with router prompts', async () => {
      const result = await classifier.classify('React SPA with router', tempDir);
      expect(result.taskType).toBe('spa-app');
      expect(result.tags.domain).toBe('frontend');
      expect(result.tags.form).toBe('spa');
    });

    it('fullstack-app for Next.js fullstack prompts', async () => {
      const result = await classifier.classify('Fullstack Next.js app', tempDir);
      expect(result.taskType).toBe('fullstack-app');
      expect(result.tags.domain).toBe('fullstack');
    });
  });

  describe('classify() result structure', () => {
    it('returns tags with domain, form, framework, lifecycle', async () => {
      const result = await classifier.classify('Build a web page', tempDir);
      expect(result.tags).toHaveProperty('domain');
      expect(result.tags).toHaveProperty('form');
      expect(result.tags).toHaveProperty('framework');
      expect(result.tags).toHaveProperty('lifecycle');
    });

    it('returns a confidence string', async () => {
      const result = await classifier.classify('Build a web page', tempDir);
      expect(['high', 'medium', 'low']).toContain(result.confidence);
    });

    it('returns weight (light/standard/heavy)', async () => {
      const result = await classifier.classify('Build a web page', tempDir);
      expect(['light', 'standard', 'heavy']).toContain(result.weight);
    });

    it('returns a workflow array', async () => {
      const result = await classifier.classify('Build a web page', tempDir);
      expect(Array.isArray(result.workflow)).toBe(true);
      expect(result.workflow.length).toBeGreaterThan(0);
    });

    it('returns notes array', async () => {
      const result = await classifier.classify('Build a web page', tempDir);
      expect(Array.isArray(result.notes)).toBe(true);
    });

    it('returns validated boolean', async () => {
      const result = await classifier.classify('Build a web page', tempDir);
      expect(typeof result.validated).toBe('boolean');
    });

    it('returns techStack object', async () => {
      const result = await classifier.classify('Build a web page', tempDir);
      expect(result.techStack).toBeDefined();
      expect(result.techStack).toHaveProperty('framework');
    });

    it('returns alternatives array', async () => {
      const result = await classifier.classify('Build a web page', tempDir);
      expect(Array.isArray(result.alternatives)).toBe(true);
    });
  });

  describe('scoreTypes()', () => {
    it('returns empty array when no prompt matches', async () => {
      classifier = new IntentClassifier();
      const scores = classifier.scoreTypes('xyzzynonsense', { hasFiles: false, fileCount: 0, htmlFiles: 0, jsFiles: 0, pyFiles: 0, cssFiles: 0, configFiles: 0 });
      expect(Array.isArray(scores)).toBe(true);
      expect(scores.length).toBe(0);
    });

    it('returns sorted results with highest first', async () => {
      const scores = classifier.scoreTypes('Build a web page with HTML CSS', { hasFiles: false, fileCount: 0, htmlFiles: 0, jsFiles: 0, pyFiles: 0, cssFiles: 0, configFiles: 0 });
      expect(scores.length).toBeGreaterThan(0);
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i - 1].score).toBeGreaterThanOrEqual(scores[i].score);
      }
    });
  });

  describe('resolveWeight()', () => {
    it('light when fileCount <= 1 and subsystemCount <= 2', () => {
      const weight = classifier.resolveWeight({ fileCount: 1 }, { subsystemCount: 2, ratio: 1 });
      expect(weight).toBe('light');
    });

    it('standard when density ratio > 2', () => {
      const weight = classifier.resolveWeight({ fileCount: 2 }, { subsystemCount: 6, ratio: 3 });
      expect(weight).toBe('standard');
    });

    it('heavy when subsystemCount >= 4', () => {
      const weight = classifier.resolveWeight({ fileCount: 5 }, { subsystemCount: 4, ratio: 0.8 });
      expect(weight).toBe('heavy');
    });

    it('defaults to standard', () => {
      const weight = classifier.resolveWeight({ fileCount: 3 }, { subsystemCount: 2, ratio: 0.67 });
      expect(weight).toBe('standard');
    });
  });

  describe('calculateConfidence()', () => {
    it('high when primary has large gap', () => {
      const scores = [{ score: 0.8 }, { score: 0.3 }];
      expect(classifier.calculateConfidence(scores[0], scores)).toBe('high');
    });

    it('medium when gap is moderate', () => {
      const scores = [{ score: 0.6 }, { score: 0.4 }];
      expect(classifier.calculateConfidence(scores[0], scores)).toBe('medium');
    });

    it('low when gap is small', () => {
      const scores = [{ score: 0.5 }, { score: 0.45 }];
      expect(classifier.calculateConfidence(scores[0], scores)).toBe('low');
    });

    it('high when fewer than 2 scores', () => {
      const scores = [{ score: 0.5 }];
      expect(classifier.calculateConfidence(scores[0], scores)).toBe('high');
    });

    it('handles undefined secondary score', () => {
      expect(classifier.calculateConfidence({ score: 0.5 }, [{ score: 0.5 }])).toBe('high');
      expect(classifier.calculateConfidence(undefined, [])).toBe('high');
    });
  });

  describe('route()', () => {
    it('web-ui light has 3 stages', () => {
      const workflow = classifier.route('web-ui', 'light');
      expect(workflow).toEqual(['discovery', 'build', 'rsi']);
    });

    it('web-ui standard has 5 stages', () => {
      const workflow = classifier.route('web-ui', 'standard');
      expect(workflow).toEqual(['discovery', 'design', 'build', 'audit', 'rsi']);
    });

    it('web-ui heavy has 6 stages', () => {
      const workflow = classifier.route('web-ui', 'heavy');
      expect(workflow).toEqual(['discovery', 'design', 'plan', 'build', 'audit', 'rsi']);
    });

    it('unknown type falls back to web-ui', () => {
      const workflow = classifier.route('unknown-type', 'standard');
      expect(workflow).toEqual(['discovery', 'design', 'build', 'audit', 'rsi']);
    });

    it('unknown weight falls back to standard', () => {
      const workflow = classifier.route('web-ui', 'unknown');
      expect(workflow).toEqual(['discovery', 'design', 'build', 'audit', 'rsi']);
    });

    it('hotfix starts with build', () => {
      const workflow = classifier.route('hotfix', 'light');
      expect(workflow[0]).toBe('build');
    });
  });

  describe('generateNotes()', () => {
    it('adds high-density note when isHighDensity', () => {
      const density = { isHighDensity: true, subsystemCount: 8, fileCount: 1 };
      const validation = { valid: true, errors: [] };
      const notes = classifier.generateNotes(density, validation, 'high');
      expect(notes.length).toBeGreaterThan(0);
      expect(notes[0]).toContain('High-density');
    });

    it('adds validation errors when invalid', () => {
      const density = { isHighDensity: false, subsystemCount: 0, fileCount: 1 };
      const validation = { valid: false, errors: ['Incompatible domain'] };
      const notes = classifier.generateNotes(density, validation, 'high');
      expect(notes).toContain('Tag validation: Incompatible domain');
    });

    it('adds low confidence note', () => {
      const density = { isHighDensity: false, subsystemCount: 0, fileCount: 1 };
      const validation = { valid: true, errors: [] };
      const notes = classifier.generateNotes(density, validation, 'low');
      expect(notes.length).toBeGreaterThan(0);
      expect(notes[0]).toContain('Low confidence');
    });

    it('returns empty notes for clean high confidence', () => {
      const density = { isHighDensity: false, subsystemCount: 0, fileCount: 1 };
      const validation = { valid: true, errors: [] };
      const notes = classifier.generateNotes(density, validation, 'high');
      expect(notes).toEqual([]);
    });
  });
});
