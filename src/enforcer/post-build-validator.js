// src/enforcer/post-build-validator.js
// Validates builder output with per-type domain-specific checks.

export class PostBuildValidator {
  async check(output, classification = {}) {
    const checks = [];
    checks.push(this.validateSyntax(output));
    checks.push(this.validateCompleteness(output, classification));
    checks.push(this.validateDomainSpecific(output, classification));
    return {
      passed: checks.every(function(c) { return c.passed; }),
      checks: checks,
      canAutoAdvance: checks.every(function(c) { return c.severity !== 'critical'; }),
    };
  }

  validateSyntax(output) {
    const issues = [];
    const openBraces = (output.match(/\{/g) || []).length;
    const closeBraces = (output.match(/\}/g) || []).length;
    if (Math.abs(openBraces - closeBraces) > 3) {
      issues.push('Unbalanced braces: ' + openBraces + ' open vs ' + closeBraces + ' close');
    }
    const openParens = (output.match(/\(/g) || []).length;
    const closeParens = (output.match(/\)/g) || []).length;
    if (Math.abs(openParens - closeParens) > 3) {
      issues.push('Unbalanced parentheses: ' + openParens + ' open vs ' + closeParens + ' close');
    }
    return {
      name: 'syntax',
      passed: issues.length === 0,
      severity: issues.length > 0 ? 'critical' : 'none',
      details: issues,
    };
  }

  validateCompleteness(output, classification) {
    const missing = [];
    const tags = classification.tags || {};
    const domain = tags.domain || classification.taskType || '';

    if (['frontend', 'fullstack'].includes(domain)) {
      if (output.includes('<html') && !output.includes('</html>')) missing.push('Unclosed <html>');
      if (output.includes('<body') && !output.includes('</body>')) missing.push('Unclosed <body>');
    }
    if (domain === 'game' && !/<canvas/i.test(output)) {
      missing.push('Missing <canvas> element');
    }
    if (output.length < 100) {
      missing.push('Output too short — possibly truncated');
    }
    return {
      name: 'completeness',
      passed: missing.length === 0,
      severity: missing.length > 0 ? 'critical' : 'none',
      details: missing,
    };
  }

  validateDomainSpecific(output, classification) {
    const tags = classification.tags || {};
    const domain = tags.domain || classification.taskType || '';
    const issues = [];

    switch (domain) {
      case 'game':
        issues.push(...this._checkGame(output));
        break;
      case 'frontend':
        issues.push(...this._checkFrontend(output));
        break;
      case 'backend':
        issues.push(...this._checkBackend(output));
        break;
      case 'cli':
        issues.push(...this._checkCLI(output));
        break;
    }

    return {
      name: 'domain-' + domain,
      passed: issues.length === 0,
      severity: issues.length > 0 ? 'warning' : 'none',
      details: issues,
    };
  }

  _checkGame(output) {
    const issues = [];
    if (!/requestAnimationFrame/i.test(output)) {
      issues.push('Game: missing requestAnimationFrame game loop');
    }
    if (!/addEventListener\s*\(\s*["']\s*keydown|onkeydown/i.test(output)) {
      issues.push('Game: missing input handler (keydown/keyboard)');
    }
    if (!/getContext\s*\(\s*["']\s*2d["']|getContext\s*\(\s*["']\s*webgl/i.test(output)) {
      issues.push('Game: missing canvas.getContext() call');
    }
    if (!/update|render|draw|tick/i.test(output)) {
      issues.push('Game: missing update/render/draw loop method');
    }
    return issues;
  }

  _checkFrontend(output) {
    const issues = [];
    if (output.includes('<html') && !/viewport/i.test(output)) {
      issues.push('Frontend: missing viewport meta tag for responsive');
    }
    if (/style\s*=\s*["']/i.test(output) && !/var\(--/i.test(output)) {
      issues.push('Frontend: inline styles without CSS variables');
    }
    return issues;
  }

  _checkBackend(output) {
    const issues = [];
    if (!/app\.(get|post|put|delete|patch)\s*\(/i.test(output) && !/router\.(get|post|put|delete)/i.test(output)) {
      issues.push('Backend: missing route handler definition');
    }
    if (!/status\s*\(|statusCode|res\.status/i.test(output)) {
      issues.push('Backend: missing HTTP status code handling');
    }
    return issues;
  }

  _checkCLI(output) {
    const issues = [];
    if (!/process\.exit\s*\(|exit\s*\(/i.test(output) && !/exit code/i.test(output)) {
      issues.push('CLI: missing exit code handling');
    }
    if (!/--help|-h\b|\.help|usage/i.test(output)) {
      issues.push('CLI: missing help/usage output');
    }
    return issues;
  }
}
