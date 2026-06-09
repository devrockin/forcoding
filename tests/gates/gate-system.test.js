import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GateSystem } from '../../src/gates/gate-system.mjs';
import { createTempDir, cleanupTempDir } from '../helpers/setup.js';
import fs from 'fs';
import path from 'path';

describe('GateSystem', function() {
  let tempDir;
  let gates;
  var date = '2026-06-09';
  var topic = 'test-feature';

  beforeEach(function() {
    tempDir = createTempDir();
    gates = new GateSystem({ projectDir: tempDir, date: date, topic: topic });
  });

  afterEach(function() {
    cleanupTempDir(tempDir);
  });

  it('constructor sets projectDir, date, topic, gatesDir', function() {
    expect(gates.projectDir).toBe(tempDir);
    expect(gates.date).toBe(date);
    expect(gates.topic).toBe(topic);
    expect(gates.gatesDir).toBe(path.join(tempDir, 'docs', 'forcoding', 'gates'));
  });

  it('_ensureDir auto-creates gatesDir', function() {
    expect(fs.existsSync(gates.gatesDir)).toBe(true);
  });

  it('_path discovery returns correct filename', function() {
    var p = gates._path('discovery');
    var basename = path.basename(p);
    var expected = date + '-' + topic + '.discovery.approved';
    expect(basename).toBe(expected);
    expect(path.dirname(p)).toBe(gates.gatesDir);
  });

  it('_path builder 2 returns builder-N filename', function() {
    var p = gates._path('builder', 2);
    var basename = path.basename(p);
    var expected = date + '-' + topic + '.builder-2.approved';
    expect(basename).toBe(expected);
  });

  it('create discovery creates gate file with all fields', function() {
    var contentFile = path.join(tempDir, 'disc-output.md');
    fs.writeFileSync(contentFile, '# Discovery output', 'utf8');
    var record = gates.create('discovery', { contentFile: contentFile, verdict: 'APPROVED' });
    expect(record.timestamp).toBeDefined();
    expect(record.stage).toBe('discovery');
    expect(record.status).toBe('APPROVED');
    expect(record.verdict).toBe('APPROVED');
    expect(record.content).toBeDefined();
    expect(record.content.file).toBe(contentFile);
    expect(record.content.hash_alg).toBe('md5');
    expect(record.content.hash).toBeDefined();
    expect(record.chain).toBeDefined();
    expect(record.chain.prev_stage).toBeNull();
    expect(record.chain.prev_hash).toBeNull();
    expect(record.chain.composite_hash).toBeDefined();
    expect(fs.existsSync(gates._path('discovery'))).toBe(true);
    var saved = JSON.parse(fs.readFileSync(gates._path('discovery'), 'utf8'));
    expect(saved.stage).toBe('discovery');
  });

  it('content hash is MD5 hex string 32 chars', function() {
    var contentFile = path.join(tempDir, 'output.md');
    fs.writeFileSync(contentFile, 'Hello world', 'utf8');
    var record = gates.create('discovery', { contentFile: contentFile });
    expect(record.content.hash).toMatch(/^[0-9a-f]{32}$/);
  });

  it('create when contentFile not exist sets hash null', function() {
    var record = gates.create('discovery', { contentFile: '/nonexistent/file.md' });
    expect(record.content.hash).toBeNull();
  });

  it('create correctly links prev_hash from previous stage', function() {
    var f1 = path.join(tempDir, 'd.md');
    fs.writeFileSync(f1, 'discovery content', 'utf8');
    var r1 = gates.create('discovery', { contentFile: f1 });
    expect(r1.chain.prev_stage).toBeNull();
    var f2 = path.join(tempDir, 'des.md');
    fs.writeFileSync(f2, 'designer content', 'utf8');
    var r2 = gates.create('designer', { contentFile: f2 });
    expect(r2.chain.prev_stage).toBe('discovery');
    expect(r2.chain.prev_hash).toBe(r1.content.hash);
  });

  it('create computes composite hash from all hashes', function() {
    var f1 = path.join(tempDir, 'd.md');
    fs.writeFileSync(f1, 'content a', 'utf8');
    gates.create('discovery', { contentFile: f1 });
    var f2 = path.join(tempDir, 'des.md');
    fs.writeFileSync(f2, 'content b', 'utf8');
    var r2 = gates.create('designer', { contentFile: f2 });
    expect(r2.chain.composite_hash).toMatch(/^[0-9a-f]{32}$/);
  });

  it('verify discovery on valid gate returns valid true', function() {
    var cf = path.join(tempDir, 'content.md');
    fs.writeFileSync(cf, 'verify me', 'utf8');
    gates.create('discovery', { contentFile: cf, verdict: 'APPROVED' });
    var result = gates.verify('discovery');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.record).not.toBeNull();
  });

  it('verify nonexistent returns valid false', function() {
    var result = gates.verify('nonexistent');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.record).toBeNull();
  });

  it('verify detects content hash mismatch after modification', function() {
    var cf = path.join(tempDir, 'content.md');
    fs.writeFileSync(cf, 'original content', 'utf8');
    gates.create('discovery', { contentFile: cf });
    fs.writeFileSync(cf, 'modified content after gate creation', 'utf8');
    var result = gates.verify('discovery');
    expect(result.valid).toBe(false);
    expect(result.errors.some(function(e) { return e.indexOf('Content hash mismatch') >= 0; })).toBe(true);
  });

  it('verify on corrupted JSON returns valid false', function() {
    var fp = gates._path('discovery');
    fs.writeFileSync(fp, '{invalid json', 'utf8');
    var result = gates.verify('discovery');
    expect(result.valid).toBe(false);
    expect(result.errors.some(function(e) { return e.indexOf('Invalid JSON') >= 0; })).toBe(true);
  });

  it('verifyChain on complete chain returns valid true', function() {
    var c1 = path.join(tempDir, 'a.md');
    fs.writeFileSync(c1, 'disc', 'utf8');
    gates.create('discovery', { contentFile: c1 });
    var c2 = path.join(tempDir, 'b.md');
    fs.writeFileSync(c2, 'design', 'utf8');
    gates.create('designer', { contentFile: c2 });
    var result = gates.verifyChain();
    expect(result.valid).toBe(true);
    expect(result.chain.length).toBeGreaterThanOrEqual(2);
  });

  it('verifyChain detects broken chain', function() {
    var c1 = path.join(tempDir, 'a.md');
    fs.writeFileSync(c1, 'disc', 'utf8');
    gates.create('discovery', { contentFile: c1 });
    var fp = gates._path('designer');
    var badRecord = {
      timestamp: new Date().toISOString(),
      stage: 'designer',
      status: 'APPROVED',
      content: { file: null, hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
      chain: { prev_stage: 'discovery', prev_hash: 'brokenhash' },
    };
    fs.writeFileSync(fp, JSON.stringify(badRecord), 'utf8');
    var result = gates.verifyChain();
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('list returns files filtered by date and topic', function() {
    var cf = path.join(tempDir, 'a.md');
    fs.writeFileSync(cf, 'x', 'utf8');
    gates.create('discovery', { contentFile: cf });
    var files = gates.list();
    expect(files.length).toBe(1);
    expect(files[0]).toContain(date + '-' + topic + '.discovery');
  });

  it('lastCompleted returns last completed stage', function() {
    var c1 = path.join(tempDir, 'a.md');
    fs.writeFileSync(c1, 'disc', 'utf8');
    gates.create('discovery', { contentFile: c1 });
    var c2 = path.join(tempDir, 'b.md');
    fs.writeFileSync(c2, 'design', 'utf8');
    gates.create('designer', { contentFile: c2 });
    expect(gates.lastCompleted()).toBe('designer');
  });

  it('lastCompleted with no gates returns null', function() {
    expect(gates.lastCompleted()).toBeNull();
  });

  it('findPrevious builder finds designer gate', function() {
    var c1 = path.join(tempDir, 'a.md');
    fs.writeFileSync(c1, 'discovery', 'utf8');
    gates.create('discovery', { contentFile: c1 });
    var c2 = path.join(tempDir, 'b.md');
    fs.writeFileSync(c2, 'designer', 'utf8');
    gates.create('designer', { contentFile: c2 });
    var prev = gates._findPrevious('builder');
    expect(prev).not.toBeNull();
    expect(prev.stage).toBe('designer');
  });

  it('findPrevious discovery returns null for first stage', function() {
    var prev = gates._findPrevious('discovery');
    expect(prev).toBeNull();
  });

  it('collectAllHashes collects all existing content hashes', function() {
    var c1 = path.join(tempDir, 'a.md');
    fs.writeFileSync(c1, 'hash content 1', 'utf8');
    var r1 = gates.create('discovery', { contentFile: c1 });
    var c2 = path.join(tempDir, 'b.md');
    fs.writeFileSync(c2, 'hash content 2', 'utf8');
    var r2 = gates.create('designer', { contentFile: c2 });
    var hashes = gates._collectAllHashes();
    expect(hashes).toContain(r1.content.hash);
    expect(hashes).toContain(r2.content.hash);
  });
});