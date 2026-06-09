# ForCoding_Arch Design Supplement — Missing Module Specs

> This supplement completes the DESIGN.md specification.  
> See `GAPS.md` for the full gap audit.

---

## 1. StateStore — File Path Pattern

```
docs/forcoding/state/{sessionId}.json

Example: docs/forcoding/state/ses_abc123def.json
```

**Atomic Write Pattern:**

```javascript
async save(data) {
  const filePath = path.join(this.baseDir, `${data.sessionId}.json`);
  const tmpPath = filePath + '.tmp';
  await fs.mkdir(this.baseDir, { recursive: true });
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmpPath, filePath);  // Atomic
  this._cache = { ...data };
}
```

**Multi-Session Isolation:**
Each OpenCode session gets a unique `sessionId`. Two concurrent sessions on the same project produce separate state files (`ses_001.json`, `ses_002.json`) — zero conflict risk.

---

## 2. HealthCheck

```javascript
// src/observability/health-check.js

class HealthCheck {
  static async run(pluginHooks) {
    const requiredHooks = [
      'chat.message',
      'tool.execute.before',
      'tool.execute.after',
      'experimental.chat.messages.transform',
    ];
    const results = requiredHooks.map(hook => ({
      hook,
      present: typeof pluginHooks[hook] === 'function',
      status: typeof pluginHooks[hook] === 'function' ? 'OK' : 'MISSING',
    }));
    return {
      allPassed: results.every(r => r.present),
      results,
      timestamp: Date.now(),
    };
  }
}
```

---

## 3. Metrics

```javascript
// src/observability/metrics.js

class Metrics {
  constructor(stateStore) { this.store = stateStore; }

  track(event) {
    const state = this.store.get();
    const m = state._metrics || {};
    switch (event) {
      case 'dispatch':    m.dispatchCount    = (m.dispatchCount    || 0) + 1; break;
      case 'blocked':     m.blockedCount     = (m.blockedCount     || 0) + 1; break;
      case 'truncation':  m.truncationCount  = (m.truncationCount  || 0) + 1; break;
      case 'cycle':       m.cycleCount       = (m.cycleCount       || 0) + 1; break;
      case 'hitl':        m.hitlCount        = (m.hitlCount        || 0) + 1; break;
    }
    this.store.update({ _metrics: m });
  }

  getComplianceRate() {
    const m = this.store.get()._metrics || {};
    const total = (m.dispatchCount || 0) + (m.blockedCount || 0);
    return total === 0 ? 100 : (m.dispatchCount / total * 100).toFixed(1);
  }

  getSessionSummary() {
    const m = this.store.get()._metrics || {};
    return {
      dispatches:   m.dispatchCount   || 0,
      blocked:      m.blockedCount    || 0,
      truncations:  m.truncationCount || 0,
      cycles:       m.cycleCount      || 0,
      hitls:        m.hitlCount       || 0,
      compliance:   this.getComplianceRate() + '%',
    };
  }
}
```

---

## 4. NPM Dependencies

No changes from ForCoding ForCoding v3.0:

```json
{
  "dependencies": {
    "yaml": "^2.7.0"
  }
}
```

All new modules are native Node.js (no external deps).

---

## 5. Diagrams

See `diagrams/` directory:
- `fsm-states.mermaid` — State machine transition diagram
- `plugin-hooks-flow.mermaid` — Plugin hook execution sequence
- `classifier-flow.mermaid` — Classifier decision flow
