import { describe, it, expect, beforeEach } from 'vitest';
import { PostBuildValidator } from '../../src/enforcer/post-build-validator.js';

describe('PostBuildValidator', function() {
  var validator;

  beforeEach(function() {
    validator = new PostBuildValidator();
  });

  it('check returns passed checks canAutoAdvance', async function() {
    var result = await validator.check('valid code that has enough length xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
    expect(result).toHaveProperty('passed');
    expect(result).toHaveProperty('checks');
    expect(Array.isArray(result.checks)).toBe(true);
    expect(result).toHaveProperty('canAutoAdvance');
    expect(result.checks.length).toBeGreaterThanOrEqual(3);
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

  // ─── Domain-specific checks ───

  it('game domain: passes complete game code', function() {
    var code = '<canvas id="game"></canvas>\n<script>\nconst canvas = document.getElementById("game");\nconst ctx = canvas.getContext("2d");\nfunction update() {}\nfunction render() {}\nfunction gameLoop() { requestAnimationFrame(gameLoop); update(); render(); }\nwindow.addEventListener("keydown", function(e) {});\ngameLoop();\n</script>\n' + 'x'.repeat(100);
    var result = validator.validateDomainSpecific(code, { tags: { domain: 'game' } });
    expect(result.passed).toBe(true);
  });

  it('game domain: warns on missing rAF', function() {
    var result = validator.validateDomainSpecific('const canvas = document.getElementById("g"); const ctx = canvas.getContext("2d"); ctx.fillRect(0,0,10,10);', { tags: { domain: 'game' } });
    expect(result.passed).toBe(false);
    expect(result.details.some(function(d) { return d.indexOf('requestAnimationFrame') >= 0; })).toBe(true);
  });

  it('game domain: warns on missing keydown handler', function() {
    var code = '<canvas id="g"></canvas><script>const c=document.getElementById("g");const ctx=c.getContext("2d");function loop(){requestAnimationFrame(loop);}loop();</script>';
    var result = validator.validateDomainSpecific(code, { tags: { domain: 'game' } });
    expect(result.passed).toBe(false);
    expect(result.details.some(function(d) { return d.indexOf('input handler') >= 0; })).toBe(true);
  });

  it('game domain: warns on missing getContext', function() {
    var result = validator.validateDomainSpecific('const canvas={};function loop(){requestAnimationFrame(loop);}loop();window.addEventListener("keydown",function(){});', { tags: { domain: 'game' } });
    expect(result.passed).toBe(false);
    expect(result.details.some(function(d) { return d.indexOf('getContext') >= 0; })).toBe(true);
  });

  it('frontend domain: warns on missing viewport', function() {
    var result = validator.validateDomainSpecific('<html><head><title>Test</title></head><body></body></html>', { tags: { domain: 'frontend' } });
    expect(result.passed).toBe(false);
    expect(result.details.some(function(d) { return d.indexOf('viewport') >= 0; })).toBe(true);
  });

  it('backend domain: warns on missing route handler', function() {
    var result = validator.validateDomainSpecific('const express = require("express"); const app = express();', { tags: { domain: 'backend' } });
    expect(result.passed).toBe(false);
    expect(result.details.some(function(d) { return d.indexOf('route handler') >= 0; })).toBe(true);
  });

  it('backend domain: passes complete API code', function() {
    var result = validator.validateDomainSpecific('const app = require("express")(); app.get("/api", function(req, res) { res.status(200).json({ok:true}); });', { tags: { domain: 'backend' } });
    expect(result.passed).toBe(true);
  });

  it('cli domain: warns on missing exit code', function() {
    var result = validator.validateDomainSpecific('#!/usr/bin/env node\nconsole.log("hello");', { tags: { domain: 'cli' } });
    expect(result.passed).toBe(false);
    expect(result.details.some(function(d) { return d.indexOf('exit code') >= 0; })).toBe(true);
  });

  it('cli domain: passes complete CLI code', function() {
    var result = validator.validateDomainSpecific('#!/usr/bin/env node\nif (process.argv.includes("--help")) { console.log("Usage: ..."); process.exit(0); }\nconsole.log("done");\nprocess.exit(0);', { tags: { domain: 'cli' } });
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

  it('domain-specific checks have warning severity (not critical)', function() {
    var result = validator.validateDomainSpecific('const app = require("express")();', { tags: { domain: 'backend' } });
    expect(result.severity).toBe('warning');
  });
});
