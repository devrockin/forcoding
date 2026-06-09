// src/observability/memory.js
// Cross-session project memory using append-only JSONL storage.
// Records tech stacks, decisions, patterns, constraints, and learnings.
// Survives session restarts and context compaction.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const MEMORY_DIR = 'docs/forcoding/memory';
const MEMORY_FILE = 'project-memory.jsonl';

export class ProjectMemory {
  constructor(projectDir) {
    this.dir = join(projectDir, MEMORY_DIR);
    this.path = join(this.dir, MEMORY_FILE);
    this._ensureDir();
  }

  _ensureDir() {
    if (!existsSync(this.dir)) {
      mkdirSync(this.dir, { recursive: true });
    }
  }

  add(entry) {
    this._ensureDir();
    const existing = this.list();
    const maxId = existing.reduce(function(max, e) { return Math.max(max, e.id || 0); }, 0);
    const record = {
      id: maxId + 1,
      category: entry.category || 'GENERAL',
      content: entry.content || '',
      timestamp: new Date().toISOString(),
      sessionId: entry.sessionId || 'unknown',
      source: entry.source || 'manual',
    };
    writeFileSync(this.path, JSON.stringify(record) + '\n', { flag: 'a', encoding: 'utf-8', flush: true });
    return record;
  }

  list(limit) {
    limit = limit || 50;
    if (!existsSync(this.path)) return [];
    try {
      const raw = readFileSync(this.path, 'utf-8');
      const lines = raw.trim().split('\n').filter(function(l) { return l.length > 0; });
      const entries = lines.map(function(l) { try { return JSON.parse(l); } catch(e) { return null; } }).filter(Boolean);
      return entries.slice(-limit).reverse();
    } catch (_) {
      return [];
    }
  }

  search(query, limit) {
    limit = limit || 10;
    const all = this.list(100);
    const q = query.toLowerCase();
    const results = all.filter(function(e) {
      return (e.content || '').toLowerCase().includes(q) ||
             (e.category || '').toLowerCase().includes(q);
    });
    return results.slice(0, limit);
  }

  getByCategory(category, limit) {
    limit = limit || 20;
    const all = this.list(100);
    return all.filter(function(e) { return (e.category || '') === category; }).slice(0, limit);
  }

  getDecisions() { return this.getByCategory('DECISION'); }
  getTechStacks() { return this.getByCategory('TECH_STACK'); }
  getPatterns()   { return this.getByCategory('PATTERN'); }
  getConstraints(){ return this.getByCategory('CONSTRAINT'); }

  delete(id) {
    const all = this.list(1000);
    const filtered = all.filter(function(e) { return e.id !== id; });
    const content = filtered.reverse().map(function(e) { return JSON.stringify(e); }).join('\n') + '\n';
    writeFileSync(this.path, content, { encoding: 'utf-8', flush: true });
  }

  injectContext(limit) {
    limit = limit || 5;
    const recent = this.list(limit);
    if (recent.length === 0) return '';
    return recent.map(function(e) {
      return '[' + e.category + '] ' + e.content;
    }).join('\n');
  }
}

export default ProjectMemory;
