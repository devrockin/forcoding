/**
 * ForCoding v3.0 — OpenCode Plugin Entry Point
 *
 * Aligned with OpenCode Plugin SDK v1.1.11+ Hooks interface.
 * Docs: https://open-code.ai/en/docs/plugins
 * Source: https://github.com/sst/opencode/blob/main/packages/plugin/src/index.ts
 *
 * Key fixes from v3.0 initial:
 *   - tool.execute.before: uses `input.tool` + `output.args` + `throw Error()`
 *   - tool.execute.after: uses correct (input, output) signature
 *   - event hook: captures all events including permission.asked (perm.ask hook is broken per #9229)
 *   - permission.ask hook: documented but NOT triggered by OpenCode's PermissionNext
 *
 * Architecture inspired by Microsoft AGT (Agent Governance Toolkit):
 *   Policy Engine (YAML→deterministic) → Tool Interception → Audit Trail → Gate System
 * "prompt is not a control surface" — rules enforced at infrastructure layer.
 */

import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const POLICIES_DIR = path.join(PROJECT_ROOT, 'policies');
const ENGINE_PATH = path.join(PROJECT_ROOT, 'src', 'engine', 'policy-engine.mjs');
const AUDIT_PATH = path.join(PROJECT_ROOT, 'src', 'audit', 'audit-trail.mjs');
const GATES_PATH = path.join(PROJECT_ROOT, 'src', 'gates', 'gate-system.mjs');

// ─── Bootstrap ────────────────────────────────────────────────────

const extractAndStripFrontmatter = (content) => {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, content };
  const frontmatterStr = match[1], body = match[2], frontmatter = {};
  for (const line of frontmatterStr.split('\n')) {
    const idx = line.indexOf(':');
    if (idx > 0) frontmatter[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
  }
  return { frontmatter, content: body };
};

let _bootstrapCache;
const getBootstrap = () => {
  if (_bootstrapCache !== undefined) return _bootstrapCache;
  const sp = path.join(PROJECT_ROOT, 'skills', 'forcoding-core', 'SKILL.md');
  if (!fs.existsSync(sp)) { _bootstrapCache = null; return null; }
  const { content } = extractAndStripFrontmatter(fs.readFileSync(sp, 'utf8'));
  _bootstrapCache = `<EXTREMELY_IMPORTANT>
You are powered by ForCoding v3.0. Governance is enforced by the Policy Engine — rules are deterministic, not prompt-based.

${content}

**ForCoding v3.0 Sub-agents:**
- @forcoding — orchestrator (Design Thinking + Policy Engine enforced)
- @forcoding-designer — spec with Kata5問 + Given/When/Then + API Contract
- @forcoding-scout — codebase exploration
- @forcoding-drafter — lightweight spec
- @forcoding-planner — plan with SPOQ DAG + VERIMAP VFs
- @forcoding-builder — execution with TDD + Self-Refine + Polish Round
- @forcoding-auditor — 5-Pass review (Pass 0→1→2→2.5→3→4)

**Governance (v3.0):** Policy Engine (YAML) + Audit Trail (hash chain) + Gate System (MD5 chain)
</EXTREMELY_IMPORTANT>`;
  return _bootstrapCache;
};

// ─── Lazy-loaded modules ──────────────────────────────────────────

let _engineMod, _auditMod;
const getEngine = async () => { if (!_engineMod) _engineMod = await import(`file://${ENGINE_PATH}`); return _engineMod; };
const getAudit = async () => { if (!_auditMod) _auditMod = await import(`file://${AUDIT_PATH}`); return _auditMod; };

// ─── Policy evaluation helper ─────────────────────────────────────

const evalAction = async (projectDir, tool, args) => {
  try {
    const { quickEval } = await getEngine();
    const ctx = { action: { type: tool }, tool, args };
    if (projectDir) ctx.directory = projectDir;
    const decision = quickEval(ctx);
    // Audit only on deny (avoid spamming on every tool call)
    if (!decision.allowed) {
      try {
        const { AuditTrail } = await getAudit();
        const audit = new AuditTrail({ sessionId: `fc3-${Date.now().toString(36)}`, projectDir: projectDir || process.cwd() });
        audit.record({ action: `tool:${tool}`, policy: 'never-rules', decision, context: { args: JSON.stringify(args).slice(0, 200) } });
      } catch {}
    }
    return decision;
  } catch (err) {
    console.warn(`[ForCoding PolicyEngine] Eval error: ${err.message}`);
    return { allowed: true, rule: 'engine-error', reason: err.message };
  }
};

// ─── Plugin Export ─────────────────────────────────────────────────

export const ForCodingPlugin = async ({ client, directory }) => {
  console.log('[ForCoding v3.0] Initializing — Policy Engine + Event Hook + Tool Interception');

  const skillsDir = path.resolve(PROJECT_ROOT, 'skills');

  return {
    // ── Config ────────────────────────────────────────────────────
    config: async (config) => {
      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      if (!config.skills.paths.includes(skillsDir)) {
        config.skills.paths.push(skillsDir);
      }
    },

    // ── Event Hook: comprehensive audit + permission capture ─────
    // Handles ALL system events including permission.asked
    // (permission.ask hook is broken per OpenCode issue #9229)
    event: async ({ event }) => {
      // Log permission requests for HITL audit trail (I7)
      if (event.type === 'permission.asked') {
        const p = event.properties || {};
        console.log(`[ForCoding] Permission asked: tool=${p.tool}, action=${p.action || 'unknown'}`);
      }
      // Log tool execution events
      if (event.type === 'tool.execute.before') {
        const p = event.properties || {};
        if (p.tool === 'write' || p.tool === 'edit') {
          console.warn(`[ForCoding] ⚠️ ${p.tool} tool invoked — should be blocked by agent permission + tool hook`);
        }
      }
    },

    // ── tool.execute.before: PRE-EXECUTION INTERCEPTION ──────────
    // Official API: input = { tool, sessionID, callID }, output = { args }
    // Block by THROWING an Error (return value is ignored)
    // Docs: https://open-code.ai/en/docs/plugins
    'tool.execute.before': async (input, output) => {
      const { tool } = input;
      const args = output.args || {};

      // ═══════════════════════════════════════════════════════════
      // I1: STRUCTURALLY DENY write/edit for orchestrator
      // Combined with agent YAML `write: deny, edit: deny` for defense-in-depth
      // ═══════════════════════════════════════════════════════════

      if (tool === 'write') {
        const decision = await evalAction(directory, 'write', args);
        if (!decision.allowed) {
          throw new Error(
            `[ForCoding PolicyEngine] WRITE BLOCKED — ${decision.reason}\n` +
            `Rule: ${decision.rule}\n` +
            `Action: Use task(subagent_type="forcoding-builder") to delegate code creation.`
          );
        }
      }

      if (tool === 'edit') {
        const decision = await evalAction(directory, 'edit', args);
        if (!decision.allowed) {
          throw new Error(
            `[ForCoding PolicyEngine] EDIT BLOCKED — ${decision.reason}\n` +
            `Rule: ${decision.rule}\n` +
            `Action: Use task(subagent_type="forcoding-builder") to delegate code modification.`
          );
        }

        // ── Edit reliability check (3-level matching) ────────────
        // Only runs if edit was allowed by policy engine
        const { filePath, oldString } = args;
        if (!filePath || oldString === undefined) return;

        const resolvedPath = path.resolve(filePath);
        for (let retries = 0; retries <= 3; retries++) {
          try {
            if (!fs.existsSync(resolvedPath)) return;
            const content = fs.readFileSync(resolvedPath, 'utf-8');
            if (content.includes(oldString)) return;
            const norm = (s) => s.replace(/\s+/g, ' ').trim();
            if (norm(content).includes(norm(oldString)) && norm(oldString).length > 0) return;

            const oldLines = oldString.split('\n').map(l => l.trim()).filter(Boolean);
            const contentLines = content.split('\n');
            let matches = 0;
            for (const ol of oldLines) {
              for (const cl of contentLines) {
                if (cl.includes(ol) || norm(cl).includes(norm(ol))) { matches++; break; }
              }
            }
            if (oldLines.length > 0 && matches / oldLines.length > 0.8) return;
          } catch { return; }
        }
        throw new Error(`[ForCoding] Edit reliability check: oldString not found in ${resolvedPath} after 3 retries`);
      }

      // ═══════════════════════════════════════════════════════════
      // I1: Dangerous bash blocked
      // ═══════════════════════════════════════════════════════════

      if (tool === 'bash') {
        const decision = await evalAction(directory, 'bash', args);
        if (!decision.allowed) {
          throw new Error(
            `[ForCoding PolicyEngine] BASH BLOCKED — ${decision.reason}\n` +
            `Allowed bash commands: git status/diff/log/add/commit, npm install/test, npx, node --check`
          );
        }
      }

      // ═══════════════════════════════════════════════════════════
      // PRE-BUILDER GATE: UI task validation
      // ═══════════════════════════════════════════════════════════

      if (tool === 'task' && args?.subagent_type === 'forcoding-builder') {
        const prompt = args?.prompt || '';
        const cleanPrompt = prompt.replace(/forcoding-\w+|D:\\coding\\forcoding\\[\w\\]+\.md/g, ');
        const isUI = /\b(ui|ux|page|component|button|card|modal|heading|hero|dashboard|landing|animation|icon|navigation|header|footer|dropdown|sidebar)\b/i.test(cleanPrompt);
        if (isUI) {
          const missing = [];
          if (!prompt.includes('Visual Concept')) missing.push('Visual Concept (style/colors/feeling)');
          if (!/Delight|delight element|shine|ripple|haptic|badge|ring|export|spring|staggered|conic-gradient|backdrop-filter|vibrate/i.test(prompt)) {
            missing.push('>= 2 Delight Elements');
          }
          if (!/interaction stat|loading.*empty.*error|empty.*error.*loading|all states|state:|loading state|empty state|error state/i.test(prompt)) {
            missing.push('Interaction states (loading/empty/error/active)');
          }
          if (missing.length > 0) {
            throw new Error(
              `[ForCoding Pre-Builder Gate] UI Builder dispatch BLOCKED — missing: ${missing.join(', ')}.\n` +
              `Define these before dispatching Builder.`
            );
          }
        }
      }
    },

    // ── tool.execute.after: POST-EXECUTION VERIFICATION ──────────
    // Official API: input = { tool, sessionID, callID, args }, output = { title, output, metadata }
    'tool.execute.after': async (input, output) => {
      if (input.tool !== 'edit') return;

      const args = input.args || {};
      const { filePath, newString } = args;
      if (!filePath || !newString) return;

      try {
        const resolvedPath = path.resolve(filePath);
        if (!fs.existsSync(resolvedPath)) { console.warn(`[ForCoding] Post-edit: file missing ${resolvedPath}`); return; }
        if (output && output.output && output.output.includes && output.output.includes('error')) {
          console.warn(`[ForCoding] Post-edit: tool returned error`);
          return;
        }
        const content = fs.readFileSync(resolvedPath, 'utf-8');
        const normContent = content.replace(/\s+/g, ' ').trim();
        const normNew = newString.replace(/\s+/g, ' ').trim();
        if (!normContent.includes(normNew) && normNew.length > 0) {
          console.warn(`[ForCoding] Post-edit verification: target content not found in ${resolvedPath}`);
        }
      } catch (err) {
        console.warn(`[ForCoding] Post-edit error: ${err.message}`);
      }
    },

    // ── experimental.chat.messages.transform: Bootstrap injection ─
    'experimental.chat.messages.transform': async (_input, output) => {
      const bootstrap = getBootstrap();
      if (!bootstrap || !output.messages?.length) return;
      const firstUser = output.messages.find(m => m.info?.role === 'user');
      if (!firstUser?.parts?.length) return;
      if (firstUser.parts.some(p => p.type === 'text' && p.text?.includes?.('EXTREMELY_IMPORTANT'))) return;
      const ref = firstUser.parts[0];
      firstUser.parts.unshift({ ...ref, type: 'text', text: bootstrap });
    },
  };
};
