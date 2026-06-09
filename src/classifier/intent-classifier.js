// src/classifier/intent-classifier.js

import { ProjectScanner } from './project-scanner.js';
import { TechDetector } from './tech-detector.js';
import { DensityAnalyzer } from './density-analyzer.js';
import { SubtypeValidator } from './subtype-validator.js';

const PRESETS = {
  'web-ui':        { domain: 'frontend', form: 'single-page', framework: 'vanilla', lifecycle: 'greenfield' },
  'spa-app':       { domain: 'frontend', form: 'spa',        framework: 'react',   lifecycle: 'feature' },
  'fullstack-app': { domain: 'fullstack', form: 'app',       framework: 'nextjs',  lifecycle: 'greenfield' },
  'backend-api':   { domain: 'backend',  form: 'api',        framework: 'express', lifecycle: 'greenfield' },
  'canvas-game':   { domain: 'game',     form: 'app',        framework: 'vanilla', lifecycle: 'greenfield' },
  'cli-tool':      { domain: 'cli',      form: 'script',     framework: 'vanilla', lifecycle: 'greenfield' },
  'data-pipeline': { domain: 'data',     form: 'script',     framework: 'vanilla', lifecycle: 'greenfield' },
  'npm-library':   { domain: 'backend',  form: 'library',    framework: 'vanilla', lifecycle: 'greenfield' },
  'hotfix':        { domain: 'frontend', form: 'single-page', framework: 'vanilla', lifecycle: 'hotfix' },
  'refactor':      { domain: 'frontend', form: 'spa',        framework: 'react',   lifecycle: 'refactor' },
};

export class IntentClassifier {
  constructor() {
    this.scanner = new ProjectScanner();
    this.tech = new TechDetector();
    this.density = new DensityAnalyzer();
  }

  async classify(prompt, projectDir) {
    const project = this.scanner.scan(projectDir);
    const techStack = this.tech.detect(projectDir);
    const scores = this.scoreTypes(prompt, project);
    const primary = scores[0];
    const alternatives = scores.filter(t => t.type !== primary.type && t.score > primary.score * 0.6).map(t => t.type);
    const densityResult = this.density.analyze(prompt, project);
    const weight = this.resolveWeight(project, densityResult);
    const confidence = this.calculateConfidence(primary, scores);
    const tags = this.resolveTags(primary.type, techStack, project);
    const validation = SubtypeValidator.validate(tags);

    return {
      taskType: primary.type,
      alternatives,
      confidence,
      tags,
      techStack,
      weight,
      subsystems: densityResult.subsystemCount,
      density: densityResult.ratio,
      workflow: this.route(primary.type, weight),
      notes: this.generateNotes(densityResult, validation, confidence),
      validated: validation.valid,
    };
  }

  scoreTypes(prompt, project) {
    return [
      { type: 'web-ui',        score: this.scoreWebUI(prompt, project) },
      { type: 'canvas-game',   score: this.scoreGame(prompt) },
      { type: 'cli-tool',      score: this.scoreCLI(prompt) },
      { type: 'data-pipeline', score: this.scoreData(prompt, project) },
      { type: 'spa-app',       score: this.scoreSPA(prompt, project) },
      { type: 'fullstack-app', score: this.scoreFullstack(prompt, project) },
      { type: 'backend-api',   score: this.scoreBackend(prompt, project) },
      { type: 'npm-library',   score: this.scoreLibrary(prompt, project) },
      { type: 'hotfix',        score: this.scoreHotfix(prompt, project) },
      { type: 'refactor',      score: this.scoreRefactor(prompt) },
    ].filter(r => r.score > 0).sort((a, b) => b.score - a.score);
  }

  scoreWebUI(prompt, project) {
    let score = 0;
    if (/UI|界面|页面|组件|样式|按钮|表单|卡片|HTML|CSS|web page/i.test(prompt)) score += 0.4;
    if (/浏览器|网页|website|landing|page/i.test(prompt)) score += 0.3;
    if (project.htmlFiles > 0) score += 0.3;
    return Math.min(score, 1.0);
  }

  scoreGame(prompt) {
    let score = 0;
    if (/游戏|game|键盘|碰撞|帧|fps|canvas|精灵|sprite/i.test(prompt)) score += 0.4;
    if (/坦克|飞机|赛车|打砖块|贪吃蛇|马里奥|消消乐|puzzle/i.test(prompt)) score += 0.3;
    if (/触摸|touch|手柄|controller/i.test(prompt)) score += 0.2;
    return Math.min(score, 1.0);
  }

  scoreCLI(prompt) {
    let score = 0;
    if (/CLI|command|terminal|stdout|exit|arg|flag/i.test(prompt)) score += 0.5;
    if (/script|tool|utility|工具|脚本/i.test(prompt)) score += 0.3;
    return Math.min(score, 1.0);
  }

  scoreData(prompt, project) {
    let score = 0;
    if (/ETL|pipeline|csv|json.*export|数据处理|data.*process/i.test(prompt)) score += 0.4;
    if (/transform|migrate|import.*data|export.*data/i.test(prompt)) score += 0.3;
    if (project.pyFiles > 0) score += 0.2;
    return Math.min(score, 1.0);
  }

  scoreSPA(prompt, project) {
    let score = 0;
    if (/react|vue|angular|spa|router/i.test(prompt)) score += 0.4;
    if (project.jsFiles > 5) score += 0.3;
    if (/state|zustand|redux|provider/i.test(prompt)) score += 0.2;
    return Math.min(score, 1.0);
  }

  scoreFullstack(prompt, project) {
    let score = 0;
    if (/fullstack|nextjs|全栈|server.*client|ssr|api route/i.test(prompt)) score += 0.5;
    if (project.jsFiles > 3 && (project.pyFiles > 0 || project.configFiles > 3)) score += 0.3;
    return Math.min(score, 1.0);
  }

  scoreBackend(prompt, project) {
    let score = 0;
    if (/API|endpoint|route|server|后端|express|fastapi|middleware/i.test(prompt)) score += 0.4;
    if (project.pyFiles > 0 || project.jsFiles > 3) score += 0.2;
    return Math.min(score, 1.0);
  }

  scoreLibrary(prompt, project) {
    let score = 0;
    if (/library|package|npm|sdk|module|reusable/i.test(prompt)) score += 0.4;
    if (/export|import.*from|index\.js/i.test(prompt)) score += 0.3;
    if (project.jsFiles > 2) score += 0.2;
    return Math.min(score, 1.0);
  }

  scoreHotfix(prompt, project) {
    let score = 0;
    if (/fix|bug|修复|补|patch|hotfix/i.test(prompt)) score += 0.5;
    if (/:(?:\d+)/.test(prompt)) score += 0.3;
    if (project.hasFiles) score += 0.2;
    return Math.min(score, 1.0);
  }

  scoreRefactor(prompt) {
    let score = 0;
    if (/refactor|重构|clean|improve|optimize/i.test(prompt)) score += 0.5;
    if (/rename|extract|split|move.*file/i.test(prompt)) score += 0.3;
    return Math.min(score, 1.0);
  }

  resolveWeight(project, density) {
    if (project.fileCount <= 1 && density.subsystemCount <= 2) return 'light';
    if (density.ratio > 2) return 'standard';
    if (density.subsystemCount >= 4) return 'heavy';
    return 'standard';
  }

  calculateConfidence(primary, scores) {
    if (!primary || scores.length < 2) return 'high';
    const gap = primary.score - (scores[1]?.score || 0);
    if (gap > 0.3) return 'high';
    if (gap > 0.15) return 'medium';
    return 'low';
  }

  resolveTags(presetName, techStack, project) {
    const preset = PRESETS[presetName];
    if (preset) return { ...preset, framework: techStack.framework || preset.framework };
    return {
      domain: project.hasFiles ? 'frontend' : 'frontend',
      form: project.fileCount > 5 ? 'spa' : 'single-page',
      framework: techStack.framework || 'vanilla',
      lifecycle: project.fileCount > 0 ? 'feature' : 'greenfield',
    };
  }

  route(taskType, weight) {
    const routes = {
      'web-ui':       { light: ['discovery','build','rsi'], standard: ['discovery','design','build','audit','rsi'], heavy: ['discovery','design','plan','build','audit','rsi'] },
      'canvas-game':   { light: ['discovery','build','rsi'], standard: ['discovery','design','build','audit','rsi'], heavy: ['discovery','design','plan','build','audit','rsi'] },
      'cli-tool':      { light: ['discovery','build','rsi'], standard: ['discovery','build','audit','rsi'], heavy: ['discovery','design','build','audit','rsi'] },
      'data-pipeline': { light: ['discovery','build','rsi'], standard: ['discovery','design','build','audit','rsi'], heavy: ['discovery','design','plan','build','audit','rsi'] },
      'backend-api':   { light: ['discovery','build','rsi'], standard: ['discovery','design','build','audit','rsi'], heavy: ['discovery','design','plan','build','audit','rsi'] },
      'spa-app':       { light: ['discovery','build','rsi'], standard: ['discovery','design','build','audit','rsi'], heavy: ['discovery','design','plan','build','audit','rsi'] },
      'fullstack-app': { light: ['discovery','design','build','rsi'], standard: ['discovery','design','plan','build','audit','rsi'], heavy: ['discovery','design','plan','build','audit','rsi','rsi'] },
      'hotfix':        { light: ['build','rsi'], standard: ['build','audit','rsi'], heavy: ['build','audit','rsi'] },
      'refactor':      { light: ['discovery','build','rsi'], standard: ['discovery','design','build','audit','rsi'], heavy: ['discovery','design','plan','build','audit','rsi'] },
    };
    const preset = routes[taskType] || routes['web-ui'];
    return preset[weight] || preset.standard;
  }

  generateNotes(density, validation, confidence) {
    const notes = [];
    if (density.isHighDensity) notes.push(`High-density single-file (${density.subsystemCount} functions in ${density.fileCount} file). Downgraded from heavy.`);
    if (!validation.valid) notes.push(...validation.errors.map(e => `Tag validation: ${e}`));
    if (confidence === 'low') notes.push('Low confidence — consider user confirmation of task type.');
    return notes;
  }
}
