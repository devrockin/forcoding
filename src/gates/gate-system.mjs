/**
 * ForCoding v3.0 — Gate System
 * File-based stage gates with cryptographic content hashing and chain of custody.
 *
 * Inspired by: Microsoft AGT Merkle audit + SAL Evidence Chain + NLAH file-backed state
 *
 * Each completed stage creates a .approved JSON file containing:
 *   - Stage metadata (timestamp, verdict)
 *   - Content hash (MD5 of the stage's output file)
 *   - Previous stage's content hash (chain link)
 *   - Composite hash (all previous hashes combined)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function md5(data) {
  return crypto.createHash('md5').update(data).digest('hex');
}

export class GateSystem {
  /**
   * @param {object} opts
   * @param {string} opts.projectDir — project root
   * @param {string} opts.date — YYYY-MM-DD
   * @param {string} opts.topic — project topic slug
   */
  constructor(opts = {}) {
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

  /** Get gate file path for a stage */
  _path(stage, index) {
    const name = index !== undefined
      ? `${this.date}-${this.topic}.${stage}-${index}.approved`
      : `${this.date}-${this.topic}.${stage}.approved`;
    return path.join(this.gatesDir, name);
  }

  /** List all gate files for this session */
  list() {
    if (!fs.existsSync(this.gatesDir)) return [];
    const prefix = `${this.date}-${this.topic}.`;
    return fs.readdirSync(this.gatesDir)
      .filter(f => f.startsWith(prefix) && f.endsWith('.approved'))
      .sort();
  }

  /**
   * Create a gate file for a completed stage.
   * @param {string} stage — discovery | designer | planner | builder
   * @param {object} opts
   * @param {string} opts.contentFile — path to the output file to hash
   * @param {string} opts.verdict — APPROVED | VALIDATED | etc.
   * @param {number} [opts.index] — builder index (for builder-N gates)
   * @returns {object} the gate record
   */
  create(stage, opts = {}) {
    this._ensureDir();

    // Compute content hash
    let contentHash = null;
    if (opts.contentFile && fs.existsSync(opts.contentFile)) {
      const content = fs.readFileSync(opts.contentFile, 'utf8');
      contentHash = md5(content);
    }

    // Get previous gate's content hash
    const prevGate = this._findPrevious(stage);
    let prevHash = null;
    if (prevGate) {
      prevHash = prevGate.content_hash;
    }

    // Compute composite hash
    const allHashes = this._collectAllHashes();
    if (contentHash) allHashes.push(contentHash);
    const compositeHash = allHashes.length > 0
      ? md5(allHashes.join(''))
      : contentHash;

    const record = {
      timestamp: new Date().toISOString(),
      stage,
      status: 'APPROVED',
      verdict: opts.verdict || 'APPROVED',
      content: {
        file: opts.contentFile || null,
        hash_alg: 'md5',
        hash: contentHash,
      },
      chain: {
        prev_stage: prevGate?.stage || null,
        prev_hash: prevHash,
        composite_hash: compositeHash,
      },
    };

    const filePath = this._path(stage, opts.index);
    fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf8');
    return record;
  }

  /**
   * Verify a gate file's integrity.
   * @param {string} stage
   * @param {number} [index]
   * @returns {{ valid: boolean, errors: string[], record: object|null }}
   */
  verify(stage, index) {
    const filePath = this._path(stage, index);
    if (!fs.existsSync(filePath)) {
      return { valid: false, errors: [`Gate file not found: ${filePath}`], record: null };
    }

    let record;
    try {
      record = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
      return { valid: false, errors: [`Invalid JSON: ${err.message}`], record: null };
    }

    const errors = [];

    // Verify content hash
    if (record.content?.file && record.content?.hash) {
      if (fs.existsSync(record.content.file)) {
        const actual = md5(fs.readFileSync(record.content.file, 'utf8'));
        if (actual !== record.content.hash) {
          errors.push(`Content hash mismatch: stored=${record.content.hash.slice(0, 8)}..., actual=${actual.slice(0, 8)}... — file may have been modified outside workflow`);
        }
      } else {
        errors.push(`Content file not found: ${record.content.file}`);
      }
    }

    // Verify chain link
    if (record.chain?.prev_hash) {
      const prevGate = this._findPrevious(stage);
      if (prevGate && prevGate.content_hash !== record.chain.prev_hash) {
        errors.push(`Chain broken: prev_hash=${record.chain.prev_hash.slice(0, 8)}... but previous gate content_hash=${prevGate.content_hash?.slice(0, 8)}...`);
      }
    }

    return { valid: errors.length === 0, errors, record };
  }

  /**
   * Verify the entire chain of custody.
   * @returns {{ valid: boolean, errors: string[], chain: object[] }}
   */
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

        // Verify content hash
        if (record.content?.file && record.content?.hash && fs.existsSync(record.content.file)) {
          const actual = md5(fs.readFileSync(record.content.file, 'utf8'));
          if (actual !== record.content.hash) {
            errors.push(`${stage}: content hash mismatch`);
          }
        }

        // Verify chain link
        if (record.chain?.prev_hash && prevContentHash && record.chain.prev_hash !== prevContentHash) {
          errors.push(`${stage}: chain broken — prev_hash doesn't match previous content_hash`);
        }

        prevContentHash = record.content?.hash;
        chain.push({ stage, hash: record.content?.hash?.slice(0, 8), prev: record.chain?.prev_hash?.slice(0, 8) });
      } catch (err) {
        errors.push(`${gateFile}: parse error — ${err.message}`);
      }
    }

    return { valid: errors.length === 0, errors, chain };
  }

  /** Find the gate file that immediately precedes this stage */
  _findPrevious(currentStage) {
    const stageOrder = ['discovery', 'designer', 'planner', 'builder'];
    const idx = stageOrder.indexOf(currentStage);
    if (idx <= 0) return null;

    // Check each previous stage
    for (let i = idx - 1; i >= 0; i--) {
      const prevPath = this._path(stageOrder[i]);
      if (fs.existsSync(prevPath)) {
        try {
          return JSON.parse(fs.readFileSync(prevPath, 'utf8'));
        } catch { /* continue */ }
      }
    }
    return null;
  }

  /** Collect content hashes from all existing gates */
  _collectAllHashes() {
    const gates = this.list();
    const hashes = [];
    for (const gateFile of gates) {
      try {
        const record = JSON.parse(fs.readFileSync(path.join(this.gatesDir, gateFile), 'utf8'));
        if (record.content?.hash) hashes.push(record.content.hash);
      } catch { /* skip */ }
    }
    return hashes;
  }

  /**
   * Find the last completed stage (for multi-session recovery).
   * @returns {string|null} stage name or null
   */
  lastCompleted() {
    const gates = this.list();
    if (gates.length === 0) return null;

    const stageOrder = ['discovery', 'designer', 'planner', 'builder'];
    for (let i = stageOrder.length - 1; i >= 0; i--) {
      const pattern = `${this.date}-${this.topic}.${stageOrder[i]}`;
      if (gates.some(g => g.startsWith(pattern))) {
        return stageOrder[i];
      }
    }
    return null;
  }
}

export default GateSystem;
