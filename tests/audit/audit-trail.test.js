import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuditTrail } from '../../src/audit/audit-trail.mjs';
import { createTempDir, cleanupTempDir } from '../helpers/setup.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

class MockDecision {
  constructor(allowed, rule) { this.allowed = allowed; this.rule = rule; }
  toJSON() { return { allowed: this.allowed, rule: this.rule }; }
}

function md5(data) { return crypto.createHash('md5').update(data).digest('hex'); }

describe('AuditTrail', function() {
  let tempDir;
  let audit;
  var sessionId = 'test-session-001';

  beforeEach(function() {
    tempDir = createTempDir();
    audit = new AuditTrail({ sessionId: sessionId, projectDir: tempDir });
  });

  afterEach(function() {
    cleanupTempDir(tempDir);
  });

  it('constructor sets sessionId projectDir auditDir auditFile', function() {
    expect(audit.sessionId).toBe(sessionId);
    expect(audit.projectDir).toBe(tempDir);
    expect(audit.auditDir).toBe(path.join(tempDir, 'docs', 'forcoding', 'audit'));
    expect(audit.auditFile).toBe(path.join(tempDir, 'docs', 'forcoding', 'audit', sessionId + '.jsonl'));
  });

  it('ensureDir creates auditDir', function() {
    audit._ensureDir();
    expect(fs.existsSync(audit.auditDir)).toBe(true);
  });

  it('record returns entry with seq 1', function() {
    var entry = audit.record({ action: 'test' });
    expect(entry.seq).toBe(1);
  });

  it('record contains timestamp session action fields', function() {
    var entry = audit.record({ action: 'write(index.html)', agent: 'builder', policy: 'allowlist' });
    expect(entry.timestamp).toBeDefined();
    expect(entry.session).toBe(sessionId);
    expect(entry.action).toBe('write(index.html)');
    expect(entry.agent).toBe('builder');
    expect(entry.policy).toBe('allowlist');
  });

  it('record computes entry hash as MD5 hex 32 chars', function() {
    var entry = audit.record({ action: 'test' });
    expect(entry.entry_hash).toMatch(/^[0-9a-f]{32}$/);
  });

  it('multiple records seq increments and prev hash links', function() {
    var r1 = audit.record({ action: 'first' });
    expect(r1.seq).toBe(1);
    expect(r1.prev_hash).toBeNull();
    var r2 = audit.record({ action: 'second' });
    expect(r2.seq).toBe(2);
    expect(r2.prev_hash).toBe(r1.entry_hash);
    var r3 = audit.record({ action: 'third' });
    expect(r3.seq).toBe(3);
    expect(r3.prev_hash).toBe(r2.entry_hash);
  });

  it('second record prev hash equals first record entry hash', function() {
    var r1 = audit.record({ action: 'first' });
    var r2 = audit.record({ action: 'second' });
    expect(r2.prev_hash).toBe(r1.entry_hash);
    expect(r2.prev_hash).toMatch(/^[0-9a-f]{32}$/);
  });

  it('verify on valid entries returns valid true', function() {
    audit.record({ action: 'step-1' });
    audit.record({ action: 'step-2' });
    audit.record({ action: 'step-3' });
    var result = audit.verify();
    expect(result.valid).toBe(true);
    expect(result.entries).toBe(3);
  });

  it('verify detects hash mismatch in corrupted JSONL', function() {
    audit.record({ action: 'good-entry' });
    var content = fs.readFileSync(audit.auditFile, 'utf8');
    var record = JSON.parse(content.trim());
    record.entry_hash = '00000000000000000000000000000000';
    fs.writeFileSync(audit.auditFile, JSON.stringify(record) + '\n', 'utf8');
    var result = audit.verify();
    expect(result.valid).toBe(false);
    expect(result.errors.some(function(e) { return e.indexOf('hash mismatch') >= 0; })).toBe(true);
  });

  it('verify detects broken chain', function() {
    audit.record({ action: 'first' });
    var r2 = {
      seq: 2,
      timestamp: new Date().toISOString(),
      session: sessionId,
      action: 'second',
      agent: 'hacker',
      policy: 'unknown',
      decision: {},
      context: {},
      prev_hash: 'brokenprevhashthathasnosha',
    };
    r2.entry_hash = md5(JSON.stringify(r2));
    fs.appendFileSync(audit.auditFile, JSON.stringify(r2) + '\n', 'utf8');
    var result = audit.verify();
    expect(result.valid).toBe(false);
    expect(result.errors.some(function(e) { return e.indexOf('chain broken') >= 0; })).toBe(true);
  });

  it('verify on empty file returns valid true entries 0', function() {
    var result = audit.verify();
    expect(result.valid).toBe(true);
    expect(result.entries).toBe(0);
  });

  it('exportMarkdown returns table format', function() {
    audit.record({ action: 'build', policy: 'lock', decision: new MockDecision(true, 'builder-ok') });
    var md = audit.exportMarkdown();
    expect(md).toContain('# Audit Trail');
    expect(md).toContain('| # | Time | Action | Policy | Decision | Rule |');
    expect(md).toContain('build');
  });

  it('exportMarkdown on empty returns No entries', function() {
    var md = audit.exportMarkdown();
    expect(md).toContain('No entries.');
  });

  it('chainHash getter returns current chain hash', function() {
    expect(audit.chainHash).toBeNull();
    audit.record({ action: 'first' });
    expect(audit.chainHash).toMatch(/^[0-9a-f]{32}$/);
    audit.record({ action: 'second' });
    expect(audit.chainHash).toMatch(/^[0-9a-f]{32}$/);
  });

  it('entryCount getter increments with each record', function() {
    expect(audit.entryCount).toBe(0);
    audit.record({ action: 'a' });
    expect(audit.entryCount).toBe(1);
    audit.record({ action: 'b' });
    expect(audit.entryCount).toBe(2);
    audit.record({ action: 'c' });
    expect(audit.entryCount).toBe(3);
  });

  it('decision toJSON is properly serialized', function() {
    var decision = new MockDecision(true, 'policy-rule-1');
    var entry = audit.record({ action: 'check', policy: 'test', decision: decision });
    expect(entry.decision).toEqual({ allowed: true, rule: 'policy-rule-1' });
  });
});