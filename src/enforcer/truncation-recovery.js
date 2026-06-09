// src/enforcer/truncation-recovery.js

export class TruncationRecovery {
  static MAX_RETRIES = 2;

  constructor(store) { this.store = store; }

  async detect(output, classification = {}) {
    const signals = [];
    const tags = classification.tags || {};
    if ((tags.domain === 'frontend' || tags.form === 'single-page') && output.includes('<html') && !output.includes('</html>'))
      signals.push({ type: 'unclosed-html', severity: 'critical' });
    const openBraces = (output.match(/\{/g) || []).length;
    const closeBraces = (output.match(/\}/g) || []).length;
    if (openBraces - closeBraces > 3)
      signals.push({ type: 'unbalanced-braces', severity: 'critical', detail: `${openBraces} vs ${closeBraces}` });
    if (output.length < 200 && tags.form !== 'config')
      signals.push({ type: 'too-short', severity: 'warning', detail: `${output.length} chars` });
    return { truncated: signals.length > 0, signals };
  }

  async handle(truncResult, partialOutput, classification) {
    const state = this.store?.load?.(classification.sessionId) || {};
    const retryCount = (state.buildRetries || 0) + 1;
    if (retryCount > TruncationRecovery.MAX_RETRIES) {
      return { action: 'halt', retryCount, reason: `Truncation exceeded ${TruncationRecovery.MAX_RETRIES} retries. Manual intervention needed.` };
    }
    return {
      action: 'retry',
      retryCount,
      context: `## TRUNCATION RECOVERY (Attempt ${retryCount}/${TruncationRecovery.MAX_RETRIES})\n\n` +
        `Previous output was truncated. Continue from where it was cut off:\n\`\`\`\n${partialOutput.slice(-500)}\n\`\`\``,
    };
  }

  estimateMinLines(tags = {}) {
    if (tags.domain === 'game') return 100;
    if (tags.form === 'single-page') return 50;
    if (tags.form === 'api') return 30;
    return 20;
  }
}
