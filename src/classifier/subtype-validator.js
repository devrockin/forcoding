// src/classifier/subtype-validator.js

export class SubtypeValidator {
  static validate(tags) {
    const errors = [];
    if (tags.domain === 'game' && ['library', 'api', 'config'].includes(tags.form))
      errors.push(`Incompatible: domain=game + form=${tags.form}`);
    if (tags.domain === 'cli' && ['spa', 'single-page'].includes(tags.form))
      errors.push(`Incompatible: domain=cli + form=${tags.form}`);
    if (tags.domain === 'frontend' && tags.framework === 'express')
      errors.push(`Mismatch: Express is backend, not frontend`);
    if (tags.domain === 'backend' && tags.framework === 'react')
      errors.push(`Mismatch: React is frontend, not backend`);
    return { valid: errors.length === 0, errors };
  }
}
