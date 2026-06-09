// src/hitl/renderer.js

export class HITLRenderer {
  render(classification) {
    const c = classification;
    if (c.confidence === 'low') return this.renderLow(c);
    if (c.confidence === 'medium') return this.renderMedium(c);
    return this.renderHigh(c);
  }

  renderHigh(c) {
    return `## ForCoding Analysis

| Dimension | Detected |
|:--|:--|
| **Task Type** | ${this.icon(c.taskType)} ${c.taskType} |
| **Tech** | ${c.techStack?.framework || 'auto-detect'} |
| **Scope** | ${c.weight} · ${c.subsystems} subsystems |
| **Workflow** | ${c.workflow.map(s => this.icon(s) + ' ' + s).join(' → ')} |

${c.notes.length > 0 ? c.notes.map(n => '- ' + n).join('\n') + '\n' : ''}
Reply "ok" to confirm or describe adjustments.`;
  }

  renderMedium(c) {
    let out = this.renderHigh(c);
    if (c.alternatives?.length) {
      out += `\n\nOther possible types: ${c.alternatives.join(', ')}`;
    }
    return out;
  }

  renderLow(c) {
    return `## ForCoding Analysis ⚠️ Low Confidence

I'm not sure about this task type. Please select:

| Option | Type | Workflow |
|:--|:--|:--|
| **A)** | ${c.taskType} *(best guess)* | ${c.workflow.join(' → ')} |
${(c.alternatives || []).map((alt, i) =>
  `| **${String.fromCharCode(66+i)})** | ${alt} | ${c.workflow.join(' → ')} |`
).join('\n')}

Reply with A, B, or describe your task.`;
  }

  icon(value) {
    const icons = {
      'web-ui': '🎨', 'canvas-game': '🎮', 'cli-tool': '💻', 'data-pipeline': '📊',
      'backend-api': '🔧', 'spa-app': '📱', 'fullstack-app': '🏗️', 'hotfix': '🔧', 'refactor': '🔄',
      'discovery': '🔍', 'design': '✏️', 'plan': '📋', 'build': '🔨', 'audit': '🔎', 'rsi': '✅',
      'light': '⚡', 'standard': '📐', 'heavy': '🏗️',
    };
    return icons[value] || '';
  }
}
