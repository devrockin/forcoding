import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function md5(data) {
  return crypto.createHash('md5').update(data).digest('hex');
}

const STAGE_ORDER = ['discovery', 'designer', 'planner', 'builder'];

export class GateSystem {
  constructor(opts) {
    opts = opts || {};
    this.projectDir = opts.projectDir || process.cwd();
    this.date = opts.date || new Date().toISOString().slice(0, 10);
    this.topic = opts.topic || 'untitled';
    this.gatesDir = path.join(this.projectDir, 'docs', 'forcoding', 'gates');
    this._ensureDir();
  }

  _ensureDir() {
    if (!fs.existsSync(this.gatesDir)) {
      fs.mkdirSync(this.gatesDir, { recursive: true });
    }
  }

  _path(stage, index) {
    const name = index !== undefined
      ? this.date + '-' + this.topic + '.' + stage + '-' + index + '.approved'
      : this.date + '-' + this.topic + '.' + stage + '.approved';
    return path.join(this.gatesDir, name);
  }

  list() {
    if (!fs.existsSync(this.gatesDir)) return [];
    const prefix = this.date + '-' + this.topic + '.';
    const files = fs.readdirSync(this.gatesDir)
      .filter(function(f) { return f.startsWith(prefix) && f.endsWith('.approved'); });

    // Sort by stage order, then by index
    files.sort(function(a, b) {
      var aStage = a.replace(prefix, '').replace(/\.approved$/, '').replace(/-?\d+$/, '');
      var bStage = b.replace(prefix, '').replace(/\.approved$/, '').replace(/-?\d+$/, '');
      var aIdx = STAGE_ORDER.indexOf(aStage);
      var bIdx = STAGE_ORDER.indexOf(bStage);
      if (aIdx !== bIdx) return aIdx - bIdx;
      return a.localeCompare(b);
    });
    return files;
  }

  create(stage, opts) {
    opts = opts || {};
    this._ensureDir();

    let contentHash = null;
    if (opts.contentFile && fs.existsSync(opts.contentFile)) {
      const content = fs.readFileSync(opts.contentFile, 'utf8');
      contentHash = md5(content);
    }

    const prevGate = this._findPrevious(stage);
    let prevHash = null;
    if (prevGate && prevGate.content && prevGate.content.hash) {
      prevHash = prevGate.content.hash;
    }

    const allHashes = this._collectAllHashes();
    if (contentHash) allHashes.push(contentHash);
    const compositeHash = allHashes.length > 0
      ? md5(allHashes.join(''))
      : contentHash;

    const record = {
      timestamp: new Date().toISOString(),
      stage: stage,
      status: 'APPROVED',
      verdict: opts.verdict || 'APPROVED',
      content: {
        file: opts.contentFile || null,
        hash_alg: 'md5',
        hash: contentHash,
      },
      chain: {
        prev_stage: (prevGate && prevGate.stage) || null,
        prev_hash: prevHash,
        composite_hash: compositeHash,
      },
    };

    const filePath = this._path(stage, opts.index);
    fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf8');
    return record;
  }

  verify(stage, index) {
    const filePath = this._path(stage, index);
    if (!fs.existsSync(filePath)) {
      return { valid: false, errors: ['Gate file not found: ' + filePath], record: null };
    }

    let record;
    try {
      record = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
      return { valid: false, errors: ['Invalid JSON: ' + err.message], record: null };
    }

    const errors = [];

    // Verify content hash
    if (record.content && record.content.file && record.content.hash) {
      if (fs.existsSync(record.content.file)) {
        const actual = md5(fs.readFileSync(record.content.file, 'utf8'));
        if (actual !== record.content.hash) {
          errors.push('Content hash mismatch: stored=' + record.content.hash.slice(0, 8) + '..., actual=' + actual.slice(0, 8) + '... — file may have been modified outside workflow');
        }
      } else {
        errors.push('Content file not found: ' + record.content.file);
      }
    }

    // Verify chain link
    if (record.chain && record.chain.prev_hash) {
      const prevGate = this._findPrevious(stage);
      if (prevGate && prevGate.content && prevGate.content.hash && prevGate.content.hash !== record.chain.prev_hash) {
        errors.push('Chain broken: prev_hash=' + record.chain.prev_hash.slice(0, 8) + '... but previous gate content_hash=' + prevGate.content.hash.slice(0, 8) + '...');
      }
    }

    return { valid: errors.length === 0, errors: errors, record: record };
  }

  verifyChain() {
    const gates = this.list();
    const errors = [];
    const chain = [];
    let prevContentHash = null;

    for (const gateFile of gates) {
      const filePath = path.join(this.gatesDir, gateFile);
      try {
        const record = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const stage = record.stage;

        if (record.content && record.content.file && record.content.hash && fs.existsSync(record.content.file)) {
          const actual = md5(fs.readFileSync(record.content.file, 'utf8'));
          if (actual !== record.content.hash) {
            errors.push(stage + ': content hash mismatch');
          }
        }

        if (record.chain && record.chain.prev_hash && prevContentHash && record.chain.prev_hash !== prevContentHash) {
          errors.push(stage + ': chain broken — prev_hash does not match previous content_hash');
        }

        prevContentHash = (record.content && record.content.hash) || null;
        chain.push({ stage: stage, hash: (record.content && record.content.hash) ? record.content.hash.slice(0, 8) : null, prev: (record.chain && record.chain.prev_hash) ? record.chain.prev_hash.slice(0, 8) : null });
      } catch (err) {
        errors.push(gateFile + ': parse error — ' + err.message);
      }
    }

    return { valid: errors.length === 0, errors: errors, chain: chain };
  }

  _findPrevious(currentStage) {
    const idx = STAGE_ORDER.indexOf(currentStage);
    if (idx <= 0) return null;

    for (let i = idx - 1; i >= 0; i--) {
      const prevPath = this._path(STAGE_ORDER[i]);
      if (fs.existsSync(prevPath)) {
        try {
          return JSON.parse(fs.readFileSync(prevPath, 'utf8'));
        } catch { /* continue */ }
      }
    }
    return null;
  }

  _collectAllHashes() {
    const gates = this.list();
    const hashes = [];
    for (const gateFile of gates) {
      try {
        const record = JSON.parse(fs.readFileSync(path.join(this.gatesDir, gateFile), 'utf8'));
        if (record.content && record.content.hash) hashes.push(record.content.hash);
      } catch { /* skip */ }
    }
    return hashes;
  }

  lastCompleted() {
    const gates = this.list();
    if (gates.length === 0) return null;

    for (let i = STAGE_ORDER.length - 1; i >= 0; i--) {
      const pattern = this.date + '-' + this.topic + '.' + STAGE_ORDER[i];
      if (gates.some(function(g) { return g.startsWith(pattern); })) {
        return STAGE_ORDER[i];
      }
    }
    return null;
  }
}

export default GateSystem;