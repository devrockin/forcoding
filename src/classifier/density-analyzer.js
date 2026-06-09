// src/classifier/density-analyzer.js

export class DensityAnalyzer {
  analyze(prompt, projectScan) {
    const estimatedSubsystems = this.estimate(prompt);
    const fileCount = Math.max(projectScan.fileCount, 1);
    const ratio = estimatedSubsystems / fileCount;
    return {
      subsystemCount: estimatedSubsystems,
      fileCount,
      ratio: Math.round(ratio * 10) / 10,
      isHighDensity: ratio > 2,
      note: ratio > 2
        ? `High-density single-file (${estimatedSubsystems} functions in ${fileCount} file). Recommend downgrade from heavy.`
        : null,
    };
  }
  estimate(prompt) {
    const p = prompt.toLowerCase();
    let count = 2;
    if (p.match(/game|游戏|canvas|keyboard|collision/i)) count = 6;
    else if (p.match(/timer|timer|计时|pomodoro|番茄/i)) count = 4;
    else if (p.match(/auth|login|register|登录|注册|dashboard|仪表盘/i)) count = 5;
    else if (p.match(/api|endpoint|route|handler/i)) count = 3;
    else if (p.match(/crud|create.*read.*update/i)) count = 4;
    if (p.match(/database|db|storage|数据库/i)) count += 1;
    if (p.match(/ui|界面|页面|样式|style|design/i)) count += 1;
    if (p.match(/test|测试/i)) count += 1;
    return Math.min(count, 12);
  }
}
