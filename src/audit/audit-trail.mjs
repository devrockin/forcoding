/**
 * ForCoding v3.0 — Audit Trail
 * Tamper-evident JSONL audit log with cryptographic hash chaining.
 * Inspired by Microsoft AGT Merkle audit + SAL Evidence Chain + FORGE trace.
 *
 * Every policy decision is recorded with:
 *   - What action was proposed
 *   - Which policy was evaluated
 *   - What the decision was (allow/deny/require_approval)
 *   - Why (which rule matched)
 *   - Cryptographic chain to previous entries
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @param {string} data
 * @returns {string} MD5 hex digest
 */
function md5(data) {
  return crypto.createHash('md5').update(data).digest('hex');
}

export class AuditTrail {
  /**
   * @param {object} opts
   * @param {string} opts.sessionId — unique session identifier
   * @param {string} opts.projectDir — project root directory
   */
  constructor(opts = {}) {
    this.sessionId = opts.sessionId || `session-${Date.now()}`;
    this.projectDir = opts.projectDir || process.cwd();
    this.auditDir = path.join(this.projectDir, 'docs', 'forcoding', 'audit');
    this.auditFile = path.join(this.auditDir, `${this.sessionId}.jsonl`);
    this._chainHash = null; // previous entry's hash
    this._entryCount = 0;
  }

  /** Ensure audit directory exists */
  _ensureDir() {
    if (!fs.existsSync(this.auditDir)) {
      fs.mkdirSync(this.auditDir, { recursive: true });
    }
  }

  /**
   * Record a governance decision.
   * @param {object} entry
   * @param {string} entry.action — what was attempted (e.g., "task(builder)", "write(index.html)")
   * @param {string} entry.agent — which agent initiated
   * @param {string} entry.policy — which policy was evaluated
   * @param {PolicyDecision} entry.decision — the evaluation result
   * @param {object} [entry.context] — additional context
   */
  record(entry) {
    this._ensureDir();
    this._entryCount++;

    const record = {
      seq: this._entryCount,
      timestamp: new Date().toISOString(),
      session: this.sessionId,
      action: entry.action,
      agent: entry.agent || 'orchestrator',
      policy: entry.policy || 'unknown',
      decision: entry.decision?.toJSON?.() || entry.decision || {},
      context: entry.context || {},
      prev_hash: this._chainHash,
    };

    // Compute hash of this entry (includes prev_hash → chain)
    const entryJson = JSON.stringify(record);
    record.entry_hash = md5(entryJson);
    this._chainHash = record.entry_hash;

    // Append to audit file
    fs.appendFileSync(this.auditFile, entryJson + '\n', 'utf8');

    return record;
  }

  /**
   * Verify the integrity of the entire audit trail.
   * @returns {{ valid: boolean, errors: string[], entries: number }}
   */
  verify() {
    if (!fs.existsSync(this.auditFile)) {
      return { valid: true, errors: [], entries: 0 };
    }

    const lines = fs.readFileSync(this.auditFile, 'utf8').trim().split('\n').filter(Boolean);
    const errors = [];
    let prevHash = null;

    for (let i = 0; i < lines.length; i++) {
      try {
        const record = JSON.parse(lines[i]);

        // Verify chain link
        if (record.prev_hash !== prevHash) {
          errors.push(`Entry ${i + 1}: chain broken — expected prev_hash=${prevHash}, got ${record.prev_hash}`);
        }

        // Verify self-hash (recompute without entry_hash field)
        const { entry_hash, ...rest } = record;
        const computed = md5(JSON.stringify({ ...rest, prev_hash: record.prev_hash }));
        if (entry_hash !== computed) {
          errors.push(`Entry ${i + 1}: hash mismatch — stored=${entry_hash}, computed=${computed}`);
        }

        prevHash = record.entry_hash;
      } catch (err) {
        errors.push(`Entry ${i + 1}: parse error — ${err.message}`);
      }
    }

    return { valid: errors.length === 0, errors, entries: lines.length };
  }

  /**
   * Export audit trail as human-readable markdown.
   */
  exportMarkdown() {
    if (!fs.existsSync(this.auditFile)) return '# Audit Trail\n\nNo entries.';

    const lines = fs.readFileSync(this.auditFile, 'utf8').trim().split('\n').filter(Boolean);
    let md = `# Audit Trail — ${this.sessionId}\n\n`;
    md += `| # | Time | Action | Policy | Decision | Rule |\n`;
    md += `|---|------|--------|--------|----------|------|\n`;

    for (const line of lines) {
      try {
        const r = JSON.parse(line);
        const time = r.timestamp?.slice(11, 19) || '—';
        const decision = r.decision?.allowed ? '✅ ALLOW' : '❌ DENY';
        md += `| ${r.seq} | ${time} | ${r.action} | ${r.policy} | ${decision} | ${r.decision?.rule || '—'} |\n`;
      } catch { /* skip malformed */ }
    }

    return md;
  }

  /** Get the current chain hash (for external verification) */
  get chainHash() { return this._chainHash; }
  get entryCount() { return this._entryCount; }
}

export default AuditTrail;
