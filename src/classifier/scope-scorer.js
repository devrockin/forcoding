// src/classifier/scope-scorer.js

export class ScopeScorer {
  static score(prompt, projectScan = {}) {
    let score = 0;
    const p = prompt.toLowerCase();
    if (p.match(/\b(one|single|this)\s+file\b/i)) score += 0;
    if (p.match(/\b(a few|some|several)\s+files?\b/i)) score += 2;
    if (p.match(/\b(multiple|many|all|across)\s+files?\b/i)) score += 4;
    if (p.match(/\b(fix|change|update|modify|adjust)\s+(one|a|the|this)\b/i)) score += 0;
    if (p.match(/\b(add|create|build|make|implement|refactor)\b/i)) score += 3;
    if (p.match(/\b(line|typo|spelling|color|font|margin|padding|width|height)\b/i)) score += 0;
    if (p.match(/\b(function|component|module|endpoint|route|handler)\b/i)) score += 2;
    if (projectScan.hasTests) score += 1;
    if (p.match(/\b(just|simply|merely|only|quick)\b/i)) score -= 1;
    return Math.max(0, score);
  }
  static classify(score) {
    if (score <= 1) return 'trivial';
    if (score <= 3) return 'minor';
    if (score <= 6) return 'moderate';
    return 'major';
  }
  static shouldSkipHarness(score) { return this.classify(score) === 'trivial'; }
  static getWorkflow(score) {
    const c = this.classify(score);
    if (c === 'trivial')  return ['build', 'rsi'];
    if (c === 'minor')    return ['build', 'audit', 'rsi'];
    if (c === 'moderate') return ['discovery', 'build', 'audit', 'rsi'];
    return ['discovery', 'design', 'plan', 'build', 'audit', 'rsi'];
  }
}
