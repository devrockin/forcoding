// src/classifier/project-scanner.js
import { readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

export class ProjectScanner {
  constructor() {}
  scan(dir) {
    if (!existsSync(dir)) return { hasFiles: false, files: [], fileCount: 0, hasTests: false, projectType: 'greenfield' };
    const files = this.walk(dir, ['node_modules', '.git', 'dist', 'build', '.next', 'docs/forcoding', 'ForCoding_Arch']);
    return {
      hasFiles: files.length > 0,
      files,
      fileCount: files.length,
      hasTests: this.detectTests(files),
      projectType: files.length > 0 ? 'existing' : 'greenfield',
      htmlFiles: files.filter(f => f.endsWith('.html') || f.endsWith('.htm')).length,
      jsFiles: files.filter(f => f.endsWith('.js') || f.endsWith('.mjs') || f.endsWith('.cjs')).length,
      tsFiles: files.filter(f => f.endsWith('.ts') || f.endsWith('.tsx')).length,
      pyFiles: files.filter(f => f.endsWith('.py')).length,
      cssFiles: files.filter(f => f.endsWith('.css') || f.endsWith('.scss')).length,
      configFiles: files.filter(f => f.endsWith('.json') || f.endsWith('.yaml') || f.endsWith('.yml') || f.endsWith('.toml')).length,
    };
  }
  walk(dir, ignore = []) {
    const results = [];
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (ignore.some(ig => fullPath.includes(ig))) continue;
        if (entry.isDirectory()) { results.push(...this.walk(fullPath, ignore)); }
        else { results.push(fullPath); }
      }
    } catch (_) { /* skip inaccessible dirs */ }
    return results;
  }
  detectTests(files) {
    return files.some(f =>
      /(test|spec|__tests__|__mocks__)/.test(f) &&
      /\.(js|mjs|ts|tsx|py|rb|go|java)$/.test(f)
    );
  }
}
