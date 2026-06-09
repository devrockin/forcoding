// src/classifier/tech-detector.js
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export class TechDetector {
  detect(dir) {
    const tech = { framework: 'vanilla', runtime: 'node', packageManager: 'npm', language: 'javascript', hasTypeScript: false };
    if (existsSync(join(dir, 'package.json'))) {
      try {
        const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf-8'));
        const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
        if (deps.react) tech.framework = 'react';
        else if (deps.vue) tech.framework = 'vue';
        else if (deps.next) tech.framework = 'nextjs';
        else if (deps.express) tech.framework = 'express';
        else if (deps.fastapi) tech.framework = 'fastapi';
        if (deps.typescript) tech.hasTypeScript = true;
        if (deps.electron) tech.runtime = 'electron';
      } catch (_) {}
    }
    if (existsSync(join(dir, 'tsconfig.json')) || existsSync(join(dir, 'tsconfig.base.json'))) tech.hasTypeScript = true;
    if (existsSync(join(dir, 'requirements.txt')) || existsSync(join(dir, 'pyproject.toml'))) { tech.framework = 'fastapi'; tech.language = 'python'; tech.runtime = 'python'; }
    if (existsSync(join(dir, 'Cargo.toml'))) { tech.language = 'rust'; tech.runtime = 'rust'; }
    if (existsSync(join(dir, 'go.mod'))) { tech.language = 'go'; tech.runtime = 'go'; }
    return tech;
  }
}
