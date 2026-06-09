import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectMemory } from '../../src/observability/memory.js';
import { rmSync, existsSync } from 'fs';
import { join } from 'path';

var testDir = join(process.cwd(), 'docs', 'forcoding', 'memory');
var testFile = join(testDir, 'project-memory.jsonl');

function cleanup() {
  try { rmSync(testDir, { recursive: true, force: true }); } catch (_) {}
}

describe('ProjectMemory', function() {
  beforeEach(cleanup);
  afterEach(cleanup);

  it('add and list memories', function() {
    var m = new ProjectMemory(process.cwd());
    m.add({ category: 'TECH_STACK', content: 'React 18 + Vite', sessionId: 'test', source: 'detector' });
    m.add({ category: 'DECISION', content: 'Use zustand for state', sessionId: 'test' });
    var all = m.list();
    expect(all.length).toBe(2);
  });

  it('search finds by content', function() {
    var m = new ProjectMemory(process.cwd());
    m.add({ category: 'TECH_STACK', content: 'React 18 with TypeScript', sessionId: 'test' });
    m.add({ category: 'PATTERN', content: 'Feature-based folder structure', sessionId: 'test' });
    var results = m.search('react');
    expect(results.length).toBe(1);
    expect(results[0].category).toBe('TECH_STACK');
  });

  it('getByCategory filters correctly', function() {
    var m = new ProjectMemory(process.cwd());
    m.add({ category: 'DECISION', content: 'Choose vitest', sessionId: 'a' });
    m.add({ category: 'TECH_STACK', content: 'Tailwind CSS', sessionId: 'a' });
    m.add({ category: 'DECISION', content: 'Use ESM', sessionId: 'b' });
    var decisions = m.getByCategory('DECISION');
    expect(decisions.length).toBe(2);
    var tech = m.getByCategory('TECH_STACK');
    expect(tech.length).toBe(1);
  });

  it('delete removes by id', function() {
    var m = new ProjectMemory(process.cwd());
    var added = m.add({ category: 'GENERAL', content: 'temp', sessionId: 'test' });
    expect(m.list().length).toBe(1);
    m.delete(added.id);
    expect(m.list().length).toBe(0);
  });

  it('injectContext returns formatted string', function() {
    var m = new ProjectMemory(process.cwd());
    m.add({ category: 'CONSTRAINT', content: 'Must use pnpm', sessionId: 'test' });
    m.add({ category: 'TECH_STACK', content: 'React 18', sessionId: 'test' });
    var ctx = m.injectContext(2);
    expect(ctx).toContain('[CONSTRAINT]');
    expect(ctx).toContain('[TECH_STACK]');
    expect(ctx).toContain('pnpm');
    expect(ctx).toContain('React');
  });

  it('empty memory returns empty list', function() {
    var m = new ProjectMemory(process.cwd());
    expect(m.list().length).toBe(0);
    expect(m.injectContext()).toBe('');
  });

  it('auto-incrementing ids', function() {
    var m = new ProjectMemory(process.cwd());
    var a = m.add({ category: 'TEST', content: 'first' });
    var b = m.add({ category: 'TEST', content: 'second' });
    expect(b.id).toBe(a.id + 1);
  });
});
