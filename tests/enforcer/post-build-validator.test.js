import { describe, it, expect, beforeEach } from 'vitest';
import { PostBuildValidator } from '../../src/enforcer/post-build-validator.js';

describe('PostBuildValidator', function() {
  let validator;

  beforeEach(function() {
    validator = new PostBuildValidator();
  });

  it('check returns passed checks canAutoAdvance', async function() {
    var result = await validator.check('valid code that has enough length xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
    expect(result).toHaveProperty('passed');
    expect(result).toHaveProperty('checks');
    expect(Array.isArray(result.checks)).toBe(true);
    expect(result).toHaveProperty('canAutoAdvance');
  });

  it('validateSyntax balanced braces returns passed true', function() {
    var result = validator.validateSyntax('{hello}');
    expect(result.passed).toBe(true);
  });

  it('validateSyntax detects 4+ unbalanced braces', function() {
    var result = validator.validateSyntax('{{{{hello');
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('critical');
    expect(result.details.some(function(d) { return d.indexOf('Unbalanced braces') >= 0; })).toBe(true);
  });

  it('validateSyntax detects 4+ unbalanced parentheses', function() {
    var result = validator.validateSyntax('((((hello');
    expect(result.passed).toBe(false);
    expect(result.details.some(function(d) { return d.indexOf('Unbalanced parentheses') >= 0; })).toBe(true);
  });

  it('validateSyntax detects both imbalances with 4+ mismatches', function() {
    var result = validator.validateSyntax('{{{{((((hello');
    expect(result.passed).toBe(false);
    expect(result.details.some(function(d) { return d.indexOf('braces') >= 0; })).toBe(true);
    expect(result.details.some(function(d) { return d.indexOf('parentheses') >= 0; })).toBe(true);
  });

  it('validateCompleteness complete HTML with frontend passes', function() {
    var html = '<html><head></head><body></body></html>' + 'x'.repeat(100);
    var result = validator.validateCompleteness(html, { tags: { domain: 'frontend' } });
    expect(result.passed).toBe(true);
  });

  it('validateCompleteness unclosed html returns error', function() {
    var result = validator.validateCompleteness('<html><body>', { tags: { domain: 'frontend' } });
    expect(result.passed).toBe(false);
    expect(result.details.some(function(d) { return d.indexOf('Unclosed') >= 0; })).toBe(true);
  });

  it('validateCompleteness short output returns error', function() {
    var result = validator.validateCompleteness('short', { tags: {} });
    expect(result.passed).toBe(false);
    expect(result.details.some(function(d) { return d.indexOf('too short') >= 0; })).toBe(true);
  });

  it('validateCompleteness game domain checks for canvas', function() {
    var result = validator.validateCompleteness('some game code without canvas element', { tags: { domain: 'game' } });
    expect(result.passed).toBe(false);
    expect(result.details.some(function(d) { return d.indexOf('<canvas>') >= 0; })).toBe(true);
  });

  it('validateCompleteness with complete code passes', function() {
    var longCode = 'x'.repeat(150);
    var result = validator.validateCompleteness(longCode, { tags: { domain: 'frontend' } });
    expect(result.passed).toBe(true);
  });

  it('canAutoAdvance is true when no critical errors', async function() {
    var result = await validator.check('x'.repeat(150), { tags: { domain: 'config' } });
    expect(result.canAutoAdvance).toBe(true);
  });

  it('canAutoAdvance is false with critical errors', async function() {
    var result = await validator.check('short', { tags: { domain: 'frontend' } });
    expect(result.canAutoAdvance).toBe(false);
  });
});