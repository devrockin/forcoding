import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function md5(data) {
  return crypto.createHash('md5').update(data).digest('hex');
}

export class AuditTrail {
  constructor(opts = {}) {
    this.sessionId = opts.sessionId || ('session-' + Date.now());
    this.projectDir = opts.projectDir || process.cwd();
    this.auditDir = path.join(this.projectDir, 'docs', 'forcoding', 'audit');
    this.auditFile = path.join(this.auditDir, this.sessionId + '.jsonl');
    this._chainHash = null;
    this._entryCount = 0;
  }

  _ensureDir() {
    if (!fs.existsSync(this.auditDir)) {
      fs.mkdirSync(this.auditDir, { recursive: true });
    }
  }

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
      decision: (entry.decision && entry.decision.toJSON ? entry.decision.toJSON() : (entry.decision || {})),
      context: entry.context || {},
      prev_hash: this._chainHash,
    };

    const entryJson = JSON.stringify(record);
    record.entry_hash = md5(entryJson);
    this._chainHash = record.entry_hash;

    // Write the record WITH entry_hash so verify() can compare
    fs.appendFileSync(this.auditFile, JSON.stringify(record) + '\n', 'utf8');

    return record;
  }

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
          errors.push('Entry ' + (i + 1) + ': chain broken — expected prev_hash=' + prevHash + ', got ' + record.prev_hash);
        }

        // Verify self-hash (recompute without entry_hash field)
        const rest = {};
        for (const key of Object.keys(record)) {
          if (key !== 'entry_hash') {
            rest[key] = record[key];
          }
        }
        const computed = md5(JSON.stringify(rest));
        if (record.entry_hash !== computed) {
          errors.push('Entry ' + (i + 1) + ': hash mismatch — stored=' + record.entry_hash + ', computed=' + computed);
        }

        prevHash = record.entry_hash;
      } catch (err) {
        errors.push('Entry ' + (i + 1) + ': parse error — ' + err.message);
      }
    }

    return { valid: errors.length === 0, errors: errors, entries: lines.length };
  }

  exportMarkdown() {
    if (!fs.existsSync(this.auditFile)) return '# Audit Trail\n\nNo entries.';

    const lines = fs.readFileSync(this.auditFile, 'utf8').trim().split('\n').filter(Boolean);
    var md = '# Audit Trail — ' + this.sessionId + '\n\n';
    md += '| # | Time | Action | Policy | Decision | Rule |\n';
    md += '|---|------|--------|--------|----------|------|\n';

    for (const line of lines) {
      try {
        const r = JSON.parse(line);
        const time = (r.timestamp && r.timestamp.slice(11, 19)) || '—';
        const decision = r.decision && r.decision.allowed ? '✅ ALLOW' : '❌ DENY';
        md += '| ' + r.seq + ' | ' + time + ' | ' + r.action + ' | ' + r.policy + ' | ' + decision + ' | ' + (r.decision && r.decision.rule ? r.decision.rule : '—') + ' |\n';
      } catch { /* skip malformed */ }
    }

    return md;
  }

  get chainHash() { return this._chainHash; }
  get entryCount() { return this._entryCount; }
}

export default AuditTrail;