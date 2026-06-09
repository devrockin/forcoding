// src/classifier/fuzzy-matcher.js
// L2 Fuzzy Matcher using TF-IDF + n-gram tokenization.
// Pure JavaScript, zero dependencies.
// Supports Chinese bigram tokenization and English word tokenization.

// 10 intent anchors × 10 example queries each
const INTENT_ANCHORS = {
  'web-ui': [
    'create a landing page',
    'build a dashboard UI',
    'make a login form',
    'design a card component',
    'style a button with hover',
    'create HTML table',
    'build navigation menu',
    'design a modal dialog',
    'create a pricing page',
    'build a contact form',
  ],
  'canvas-game': [
    'build a canvas game',
    'create snake game',
    'make a pong clone',
    'build a platformer',
    'create a shooting game',
    'design a puzzle game',
    'build a breakout clone',
    'make a flappy bird',
    'create a racing game',
    'build a tetris clone',
  ],
  'cli-tool': [
    'build a CLI tool',
    'create command line app',
    'make a terminal utility',
    'build a script to process files',
    'create a git helper',
    'make a markdown generator',
    'build a file watcher',
    'create a CLI calculator',
    'build a todo app for terminal',
    'make a json formatter',
  ],
  'backend-api': [
    'build a REST API',
    'create express endpoints',
    'make a backend server',
    'build API routes',
    'create a microservice',
    'make an authentication API',
    'build a CRUD backend',
    'create a GraphQL server',
    'make a webhook handler',
    'build a database API',
  ],
  'data-pipeline': [
    'build a data pipeline',
    'create ETL process',
    'transform CSV data',
    'process JSON files',
    'build a data exporter',
    'create a data importer',
    'make a data migration',
    'build a log analyzer',
    'create a batch processor',
    'build a data aggregator',
  ],
  'spa-app': [
    'build a React SPA',
    'create a Vue app',
    'make a single page app',
    'build a dashboard with routes',
    'create a stateful app',
    'build a React dashboard',
    'make a Vue component tree',
    'build a Redux store',
    'create an Angular app',
    'build a client-side app',
  ],
  'fullstack-app': [
    'build a fullstack app',
    'create a Next.js project',
    'make a fullstack application',
    'build an app with database',
    'create a full stack website',
    'build a MERN app',
    'make a fullstack CRUD',
    'build a SaaS application',
    'create a web app with auth',
    'build a fullstack dashboard',
  ],
  'hotfix': [
    'fix a bug in production',
    'patch a critical error',
    'resolve a crash bug',
    'fix the login issue',
    'patch a security flaw',
    'fix a rendering bug',
    'resolve a data loss bug',
    'fix the broken endpoint',
    'patch the null pointer',
    'fix a race condition',
  ],
  'refactor': [
    'refactor this component',
    'clean up the code',
    'improve code structure',
    'extract a utility function',
    'rename variables for clarity',
    'split a large function',
    'optimize the render loop',
    'simplify conditional logic',
    'reduce code duplication',
    'migrate to TypeScript',
  ],
  'npm-library': [
    'build an npm package',
    'create a reusable library',
    'make a JavaScript module',
    'build a utility library',
    'create a React hook package',
    'make an SDK wrapper',
    'build a plugin system',
    'create a CLI npm package',
    'build a data validation lib',
    'create a formatting library',
  ],
};

/**
 * Check if a character is Chinese/CJK.
 * @param {string} ch - Single character.
 * @returns {boolean}
 */
function isCJK(ch) {
  const code = ch.charCodeAt(0);
  return (
    (code >= 0x4E00 && code <= 0x9FFF) ||     // CJK Unified Ideographs
    (code >= 0x3400 && code <= 0x4DBF) ||     // CJK Unified Ideographs Extension A
    (code >= 0x2E80 && code <= 0x2EFF) ||     // CJK Radicals Supplement
    (code >= 0x3000 && code <= 0x303F)        // CJK Symbols and Punctuation
  );
}

/**
 * Tokenize text into tokens: bigrams for CJK, word tokens for non-CJK.
 * @param {string} text - Input text.
 * @returns {string[]} - Array of tokens.
 */
function tokenize(text) {
  const tokens = [];
  const lower = text.toLowerCase().trim();
  if (!lower) return tokens;

  // Split into CJK and non-CJK segments
  let currentSegment = '';
  let currentIsCJK = null;

  for (const ch of lower) {
    const isCJKChar = isCJK(ch);
    if (currentIsCJK === null) {
      currentIsCJK = isCJKChar;
    }
    if (isCJKChar !== currentIsCJK) {
      processSegment(tokens, currentSegment, currentIsCJK);
      currentSegment = '';
      currentIsCJK = isCJKChar;
    }
    currentSegment += ch;
  }

  if (currentSegment) {
    processSegment(tokens, currentSegment, currentIsCJK);
  }

  return tokens;
}

/**
 * Process a homogeneous segment (all CJK or all non-CJK).
 * @param {string[]} tokens - Accumulator.
 * @param {string} segment - Text segment.
 * @param {boolean|null} isCJK - Whether this segment is CJK.
 */
function processSegment(tokens, segment, isCJK) {
  if (isCJK) {
    if (segment.length === 1) {
      tokens.push(segment);
    } else {
      for (let i = 0; i < segment.length - 1; i++) {
        tokens.push(segment.substring(i, i + 2));
      }
    }
  } else {
    const words = segment.split(/[^a-z0-9]+/).filter(Boolean);
    for (const word of words) {
      tokens.push(word);
    }
  }
}

/**
 * Build a vocabulary from all documents across all intents.
 * @param {Object.<string, string[]>} intents - Map of intent to queries.
 * @returns {{ vocab: string[], df: Object.<string, number>, numDocs: number, intentDocs: Object.<string, string[][]> }}
 */
function buildCorpus(intents) {
  const vocabSet = new Set();
  const df = {};
  const intentDocs = {};
  let numDocs = 0;

  for (const [intent, queries] of Object.entries(intents)) {
    intentDocs[intent] = [];
    for (const query of queries) {
      const tokens = tokenize(query);
      intentDocs[intent].push(tokens);
      numDocs++;
      const uniqueTokens = new Set(tokens);
      for (const token of uniqueTokens) {
        vocabSet.add(token);
        df[token] = (df[token] || 0) + 1;
      }
    }
  }

  return { vocab: [...vocabSet], df, numDocs, intentDocs };
}

const CORPUS = buildCorpus(INTENT_ANCHORS);

/**
 * Compute TF-IDF vector for a set of tokens against the corpus.
 */
function computeTFIDF(tokens, df, numDocs) {
  const vector = {};
  const termFreq = {};
  for (const token of tokens) {
    termFreq[token] = (termFreq[token] || 0) + 1;
  }
  const totalTerms = tokens.length || 1;
  for (const [token, count] of Object.entries(termFreq)) {
    const tf = count / totalTerms;
    const idf = Math.log((numDocs + 1) / ((df[token] || 0) + 1)) + 1;
    vector[token] = tf * idf;
  }
  return vector;
}

/**
 * Compute cosine similarity between two vectors.
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;
  const allKeys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  for (const key of allKeys) {
    const a = vecA[key] || 0;
    const b = vecB[key] || 0;
    dotProduct += a * b;
    magA += a * a;
    magB += b * b;
  }
  const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
  if (magnitude === 0) return 0;
  return dotProduct / magnitude;
}

/**
 * Compute the centroid vector for an intent from its document vectors.
 */
function computeIntentVector(docTokens, df, numDocs) {
  const vectors = docTokens.map(tokens => computeTFIDF(tokens, df, numDocs));
  const centroid = {};
  if (vectors.length === 0) return centroid;
  for (const vec of vectors) {
    for (const [token, weight] of Object.entries(vec)) {
      centroid[token] = (centroid[token] || 0) + weight / vectors.length;
    }
  }
  return centroid;
}

const INTENT_VECTORS = {};
for (const [intent, docs] of Object.entries(CORPUS.intentDocs)) {
  INTENT_VECTORS[intent] = computeIntentVector(docs, CORPUS.df, CORPUS.numDocs);
}

export class FuzzyMatcher {
  /**
   * Match a text query against known intent anchors using TF-IDF + cosine similarity.
   * @param {string} text - The user prompt to match.
   * @returns {{ intent: string|null, confidence: number, candidates: Array<{intent: string, confidence: number}>, ambiguityGap: number }}
   */
  match(text) {
    const queryTokens = tokenize(text);
    const queryVec = computeTFIDF(queryTokens, CORPUS.df, CORPUS.numDocs);
    const candidates = [];

    for (const [intent, intentVec] of Object.entries(INTENT_VECTORS)) {
      const confidence = cosineSimilarity(queryVec, intentVec);
      if (confidence > 0) {
        candidates.push({ intent, confidence });
      }
    }

    candidates.sort((a, b) => b.confidence - a.confidence);

    if (candidates.length === 0) {
      return { intent: null, confidence: 0, candidates: [], ambiguityGap: 0 };
    }

    const best = candidates[0];
    const second = candidates[1];
    const ambiguityGap = second ? best.confidence - second.confidence : best.confidence;

    let resultIntent = null;
    if (best.confidence >= 0.4) {
      resultIntent = best.intent;
    }

    return {
      intent: resultIntent,
      confidence: best.confidence,
      candidates: candidates.slice(0, 5),
      ambiguityGap,
    };
  }
}