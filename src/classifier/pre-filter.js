// src/classifier/pre-filter.js
// L0 Pre-filter: multi-factor scoring to classify prompts as coding or non-coding.
// Uses keyword signal groups with sub-group organization for extensibility.

const CODING_SIGNALS = {
  BUILD_VERBS: [
    'create', 'build', 'make', 'write', 'implement', 'generate', 'develop',
    'construct', 'produce', '编写', '创建', '构建', '实现', '生成', '开发',
    '写一个', '做一个', '写',
  ],
  CODE_NOUNS: [
    'function', 'class', 'module', 'component', 'file', 'script', 'app',
    'program', 'library', 'package', '函数', '类', '模块', '组件', '文件',
  ],
  TECH_STACK: [
    'react', 'vue', 'angular', 'node', 'python', 'html', 'css', 'js',
    'typescript', 'sql', 'api', 'json', 'npm', 'git', 'docker',
  ],
  ACTIONS: [
    'refactor', 'optimize', 'debug', 'test', 'deploy', 'migrate',
    '重构', '优化', '调试', '测试', '部署', '迁移',
    '修复', '修',
  ],
  CODE_PATTERNS: [
    'import', 'export', 'require', 'async', 'await', 'promise',
    'callback', 'lambda', 'arrow', 'class', 'extends',
  ],
};

const NON_CODING_SIGNALS = {
  META_VERSION: [
    '版本',           // CRITICAL: fix deadlock bug
    'version',        // CRITICAL: fix deadlock bug
    'release', 'changelog', 'update log',
  ],
  HOW_TO: [
    'how to', 'how do i', 'how can i', 'what is', 'what are',
    'tutorial', 'guide', 'explain', 'difference between',
    '怎么', '如何', '什么是', '有什么区别',
  ],
  CASUAL: [
    'hello', 'hi', 'thanks', 'good', 'great', 'nice',
    '你好', '谢谢', '好的',
  ],
  EXPLAIN: [
    'explain', 'describe', 'tell me about', 'define',
    '解释', '描述', '说明',
  ],
  AMBIGUOUS: [
    'maybe', 'possibly', 'could be', 'not sure',
    '可能', '也许', '不确定',
  ],
};

export class PreFilter {
  /**
   * Classify a prompt as coding or non-coding using multi-factor signal scoring.
   * @param {string} text - The user prompt to classify.
   * @returns {{ isCoding: boolean, codingScore: number, nonCodingScore: number, action: string, matchedSignals: { coding: string[], nonCoding: string[] } }}
   */
  classify(text) {
    const matchedSignals = { coding: [], nonCoding: [] };
    let codingScore = 0;
    let nonCodingScore = 0;

    // Score coding signals
    for (const [group, keywords] of Object.entries(CODING_SIGNALS)) {
      for (const keyword of keywords) {
        const re = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        if (re.test(text)) {
          codingScore += 1;
          matchedSignals.coding.push(`${group}:${keyword}`);
        }
      }
    }

    // Score non-coding signals
    for (const [group, keywords] of Object.entries(NON_CODING_SIGNALS)) {
      for (const keyword of keywords) {
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(escaped, 'i');
        if (re.test(text)) {
          nonCodingScore += 1;
          matchedSignals.nonCoding.push(`${group}:${keyword}`);
        }
      }
    }

    // Decision logic
    const diff = codingScore - nonCodingScore;
    let isCoding;
    let action;

    if (diff >= 2) {
      isCoding = true;
      action = 'proceed_coding';
    } else if (-diff > 2) {
      isCoding = false;
      action = 'skip_non_coding';
    } else {
      // Ambiguous — safe-default to coding
      isCoding = true;
      action = 'ambiguous';
    }

    return {
      isCoding,
      codingScore,
      nonCodingScore,
      action,
      matchedSignals,
    };
  }
}