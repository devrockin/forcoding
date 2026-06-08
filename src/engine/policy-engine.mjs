/**
 * ForCoding v3.0 — Deterministic Policy Engine
 * Inspired by Microsoft AGT PolicyEvaluator + NLAH runtime semantics
 *
 * Evaluates YAML policies against execution context.
 * Returns structured allow/deny decisions with audit metadata.
 * ALL policy decisions are deterministic — no LLM in the loop.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POLICIES_DIR = path.resolve(__dirname, '../../policies');

// ─── Policy Engine Core ───────────────────────────────────────────

/**
 * PolicyDocument: a YAML/JSON policy file with rules and defaults.
 * Mirrors Microsoft AGT's PolicyDocument schema.
 */
export class PolicyDocument {
  /** @param {object} doc */
  constructor(doc) {
    this.name = doc.name || 'unnamed';
    this.version = doc.version || '1.0';
    this.description = doc.description || '';
    this.rules = (doc.rules || []).map(r => new PolicyRule(r));
    this.defaultAction = doc.default_action || doc.defaults?.action || 'deny';
    this.inherit = doc.inherit !== false;
    this.scope = doc.scope || null;
  }
}

export class PolicyRule {
  /** @param {object} rule */
  constructor(rule) {
    this.name = rule.name;
    this.condition = new PolicyCondition(rule.condition || rule);
    this.action = rule.action || 'deny';
    this.priority = rule.priority || 0;
    this.message = rule.message || rule.description || '';
    this.override = rule.override || false;
  }
}

export class PolicyCondition {
  /** @param {object} cond */
  constructor(cond) {
    this.field = cond.field;
    this.operator = cond.operator || cond.op || 'eq';
    this.value = cond.value;
  }

  /** @param {object} context — execution context dict */
  matches(context) {
    const actual = this._resolve(this.field, context);
    switch (this.operator) {
      case 'eq': return actual === this.value;
      case 'neq': return actual !== this.value;
      case 'in': return Array.isArray(this.value) && this.value.includes(actual);
      case 'not_in': return Array.isArray(this.value) && !this.value.includes(actual);
      case 'contains': return typeof actual === 'string' && actual.includes(this.value);
      case 'matches': return typeof actual === 'string' && new RegExp(this.value).test(actual);
      case 'gt': return Number(actual) > Number(this.value);
      case 'gte': return Number(actual) >= Number(this.value);
      case 'lt': return Number(actual) < Number(this.value);
      case 'lte': return Number(actual) <= Number(this.value);
      case 'exists': return actual !== undefined && actual !== null;
      case 'not_exists': return actual === undefined || actual === null;
      default: return false;
    }
  }

  _resolve(fieldPath, context) {
    return fieldPath.split('.').reduce((obj, key) => obj?.[key], context);
  }
}

// ─── Policy Evaluator ─────────────────────────────────────────────

export class PolicyEvaluator {
  /**
   * @param {object} opts
   * @param {PolicyDocument[]} opts.policies
   * @param {'deny_overrides'|'allow_overrides'|'priority_first'} opts.strategy
   */
  constructor(opts = {}) {
    this.policies = opts.policies || [];
    this.strategy = opts.strategy || 'deny_overrides';
    // Flatten all rules with source tracking
    this._rules = [];
    for (const p of this.policies) {
      for (const r of p.rules) {
        this._rules.push({ rule: r, source: p.name, priority: r.priority });
      }
    }
    this._rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Evaluate execution context against all policies.
   * @param {object} context — { action, agent, file, tool, stage, depth, project_type, ... }
   * @returns {PolicyDecision}
   */
  evaluate(context = {}) {
    const matchingRules = [];

    for (const { rule, source } of this._rules) {
      if (rule.condition.matches(context)) {
        matchingRules.push({ rule, source });
      }
    }

    if (matchingRules.length === 0) {
      const defaultAction = this.policies[0]?.defaultAction || 'deny';
      return new PolicyDecision(
        defaultAction === 'allow',
        defaultAction,
        'default',
        `No matching rule — default: ${defaultAction}`,
        matchingRules
      );
    }

    return this._resolve(matchingRules);
  }

  _resolve(matchingRules) {
    switch (this.strategy) {
      case 'deny_overrides': {
        const denies = matchingRules.filter(r => r.rule.action === 'deny' || r.rule.action === 'block');
        if (denies.length > 0) {
          const d = denies[0];
          return new PolicyDecision(false, 'deny', d.rule.name, d.rule.message, matchingRules);
        }
        const first = matchingRules[0];
        return new PolicyDecision(true, first.rule.action, first.rule.name, first.rule.message, matchingRules);
      }
      case 'allow_overrides': {
        const allows = matchingRules.filter(r => r.rule.action === 'allow');
        if (allows.length > 0) {
          return new PolicyDecision(true, 'allow', allows[0].rule.name, allows[0].rule.message, matchingRules);
        }
        return new PolicyDecision(false, 'deny', matchingRules[0].rule.name, matchingRules[0].rule.message, matchingRules);
      }
      case 'priority_first': {
        const first = matchingRules[0];
        const allowed = first.rule.action === 'allow';
        return new PolicyDecision(allowed, first.rule.action, first.rule.name, first.rule.message, matchingRules);
      }
      default:
        return new PolicyDecision(false, 'deny', 'unknown', 'Unknown strategy', matchingRules);
    }
  }
}

export class PolicyDecision {
  /** @param {boolean} allowed @param {string} action @param {string} rule @param {string} reason @param {Array} matched */
  constructor(allowed, action, rule, reason, matched = []) {
    this.allowed = allowed;
    this.action = action;
    this.rule = rule;
    this.reason = reason;
    this.matchedRules = matched.map(m => ({ name: m.rule.name, action: m.rule.action, source: m.source }));
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      allowed: this.allowed,
      action: this.action,
      rule: this.rule,
      reason: this.reason,
      matched: this.matchedRules,
      timestamp: this.timestamp,
    };
  }
}

// ─── Policy Loader ────────────────────────────────────────────────

/**
 * Load all YAML policies from a directory (recursive).
 * Respects `inherit: false` to stop walking up the tree.
 * @param {string} dir
 * @returns {PolicyDocument[]}
 */
export function loadPolicies(dir) {
  const policies = [];
  if (!fs.existsSync(dir)) return policies;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      policies.push(...loadPolicies(path.join(dir, entry.name)));
    } else if (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) {
      try {
        const content = fs.readFileSync(path.join(dir, entry.name), 'utf8');
        const doc = yaml.parse(content);
        if (doc && doc.rules) {
          policies.push(new PolicyDocument(doc));
        }
      } catch (err) {
        console.warn(`[ForCoding PolicyEngine] Failed to load policy: ${entry.name} — ${err.message}`);
      }
    }
  }

  // Sort: base policies first, then project-specific (base has lower priority in override)
  return policies;
}

/**
 * Create a PolicyEvaluator from the policies directory.
 * Layer: base/ → projects/{name}/ (project policies can tighten, not loosen)
 */
export function createEngine(projectName) {
  const basePolicies = loadPolicies(path.join(POLICIES_DIR, 'base'));
  let projectPolicies = [];
  if (projectName) {
    const projectDir = path.join(POLICIES_DIR, 'projects', projectName);
    projectPolicies = loadPolicies(projectDir);
  }

  // Project policies override base (loaded last = higher priority in deny_overrides)
  const allPolicies = [...basePolicies, ...projectPolicies];
  return new PolicyEvaluator({ policies: allPolicies, strategy: 'deny_overrides' });
}

// ─── Quick Eval Helper ────────────────────────────────────────────

/**
 * One-shot evaluation: load policies, evaluate context, return decision.
 */
export function quickEval(context, projectName) {
  const engine = createEngine(projectName);
  return engine.evaluate(context);
}

export default { PolicyDocument, PolicyRule, PolicyCondition, PolicyEvaluator, PolicyDecision, loadPolicies, createEngine, quickEval };
