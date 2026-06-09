// src/enforcer/post-build-validator.js

export class PostBuildValidator {
  async check(output, classification = {}) {
    const checks = [];
    checks.push(this.validateSyntax(output));
    checks.push(this.validateCompleteness(output, classification));
    return { passed: checks.every(c => c.passed), checks, canAutoAdvance: checks.every(c => c.severity !== 'critical') };
  }

  validateSyntax(output) {
    const issues = [];
    const openBraces = (output.match(/\{/g) || []).length;
    const closeBraces = (output.match(/\}/g) || []).length;
    if (Math.abs(openBraces - closeBraces) > 3) issues.push(`Unbalanced braces: ${openBraces} open vs ${closeBraces} close`);
    const openParens = (output.match(/\(/g) || []).length;
    const closeParens = (output.match(/\)/g) || []).length;
    if (Math.abs(openParens - closeParens) > 3) issues.push(`Unbalanced parentheses: ${openParens} open vs ${closeParens} close`);
    return { passed: issues.length === 0, severity: issues.length > 0 ? 'critical' : 'none', details: issues };
  }

  validateCompleteness(output, classification) {
    const missing = [];
    const tags = classification.tags || {};
    if (['frontend', 'fullstack'].includes(tags.domain)) {
      if (output.includes('<html') && !output.includes('</html>')) missing.push('Unclosed <html>');
      if (output.includes('<body') && !output.includes('</body>')) missing.push('Unclosed <body>');
    }
    if (tags.domain === 'game' && !/<canvas/i.test(output)) missing.push('Missing <canvas> element');
    if (output.length < 100) missing.push('Output too short — possibly truncated');
    return { passed: missing.length === 0, severity: missing.length > 0 ? 'critical' : 'none', details: missing };
  }
}
