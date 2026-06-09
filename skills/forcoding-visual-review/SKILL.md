> ⚠️ **REFERENCE ONLY** — ForCoding_Arch v4.0
> This skill is NO LONGER loaded into LLM context. All governance logic
> has been migrated to deterministic Node.js modules in `src/`.
> This file exists for human maintainers only.

---
name: forcoding-visual-review
description: Measurable aesthetic audit for UI tasks. 14 MEASURABLE criteria (not subjective). Each has PASS/FAIL test. Used by Builder (Polish Round) and Auditor (visual pass).
---

# ForCoding Visual Review Skill

## Purpose

Provide **measurable, enforceable** aesthetic criteria for UI tasks.
Each criterion has a clear PASS/FAIL test — not "looks good" but specific checks.

**Who uses this:**
- **Builder** — during Polish Round (Round 2) to self-check visual quality
- **Auditor** — during visual audit pass to verify against measurable standards

## Research Basis

This skill is based on analysis of 2026 industry standards:
- **WCAG 2.2 AA**: Contrast 4.5:1, touch targets 24×24px minimum, non-text contrast 3:1
- **Material Design 3**: Dynamic color, semantic token layers, tonal surface elevation
- **Apple HIG 2026**: Three explicit depth layers (base/raised/overlay), 44×44pt minimum touch
- **NVIDIA Elements / Canonical / USWDS**: Semantic token systems with intent→implementation→platform layers
- **Muzli / Baymard 2026**: Thumb-zone navigation, bottom-sheet secondary containers, compound gestures
- **Industry consensus**: Motion tokens (named durations/easings/springs), dark mode as first-class design, prefers-reduced-motion respect

## Pass Threshold

Total: 26 criteria across A-H sections.
- **PASS**: ≥ 19/26 (73%+)
- **PARTIAL**: 14-18/26 — Builder fixes specific FAIL items
- **FAIL**: < 14/26 — INVALIDATED, must redo Polish Round

---

## A. Color System Verification（配色系统 — 5 项）

### A1. CSS Variable Color Coverage
**Test**: Search all CSS for color values. Measure ratio of `var(--*)` usage vs hex/rgb/hsl hardcodes.
**Pass**: ≥ 90% of colors use CSS variables. Hardcodes allowed only in `:root` definitions.

```
PASS example:   color: var(--color-text);
                background: var(--bg-primary);
FAIL example:   color: #333;
                background: #f0f7e6;

Exception:  transparent, currentColor, and single-use gradient stops
```

### A2. Color Palette Consistency
**Test**: Count total distinct hex/rgb colors used. Compare against Visual Concept palette.
**Pass**: ≤ N+3 distinct colors where N = palette size in Visual Concept. No orphan colors.

```
Example: Visual Concept defines 6 colors (#f0f7e6, #4caf50, #2e7d32, #8d6e63, #f48fb1, #3e2723)
Pass: total distinct colors ≤ 9 (6 + 3)
Fail: 15+ distinct colors, multiple shades of green, random blues/purples
```

### A3. Saturation and Temperature Check
**Test**: Check all accent colors for saturation. Check overall warm/cool tone consistency.
**Pass**: No accent color exceeds 85% saturation. All elements lean warm OR cool, not mixed.

```
Pass: warm amber #d4932b (saturation ~70%) with warm cream bg
Fail: cool blue #2196F3 (saturation ~90%) mixed with warm beige bg
```

### A4. Text Contrast Ratio (WCAG 2.2 AA)
**Test**: Measure contrast ratio between text colors and their backgrounds.
**Pass**: Body text ≥ 4.5:1. Large text (≥18px bold or ≥24px) ≥ 3:1. Computed ratio not rounded.

```
Quick check: text color on white bg:
  #3e2723 on white → ~8:1 ✅
  #999 on white → ~2.5:1 ❌
  #666 on white → ~5:1 ✅

#777 on white → 4.47:1 → FAIL (must ≥ 4.5:1 exactly, no rounding)
```

### A5. Non-Text Contrast (WCAG 2.2 AA)
**Test**: Check icon/button borders/progress rings/input borders for 3:1 contrast vs adjacent background.
**Pass**: All functional UI elements (not decorative) have ≥ 3:1 contrast against adjacent colors.

```
Pass:   border: 2px solid #767676 on white → ~4.5:1 ✅
Fail:   border: 1px solid #ccc on white → ~1.6:1 ❌
Fail:   icon: #999 on white → ~2.5:1 ❌
```

---

## B. Typography System Verification（字体系统 — 2 项）

### B1. Chinese Font Fallback
**Test**: Check every `font-family` declaration includes Chinese font names.
**Pass**: ALL font-family declarations contain at least one of: `PingFang SC`, `Microsoft YaHei`, `Hiragino Sans GB`, `Noto Sans SC`.

```
Pass: font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
Fail: font-family: 'Inter', sans-serif;
```

### B2. Font Size Hierarchy
**Test**: Count distinct font-size values used. Verify they form a clear hierarchy.
**Pass**: ≤ 5 distinct font sizes. Ratio between levels is clearly discernible (not 14px/15px/16px).

```
Pass pattern: 12px(label) / 14px(body) / 16px(emphasis) / 22px(heading) / 32px(display)
Fail pattern: 13px / 14px / 15px / 16px / 17px (no clear hierarchy)
```

---

## C. Spacing & Layout Verification（间距布局 — 3 项）

### C1. Spacing System Consistency
**Test**: Check all margin/padding values. Count distinct values.
**Pass**: ≥ 80% of spacing values come from a 4px/8px/12px/16px/24px/32px/48px system.
         No random values like 7px, 11px, 18px, 23px.

```
Pass: padding: 16px; margin: 24px; gap: 12px;
Fail: padding: 7px; margin: 11px; gap: 18px;
```

### C2. Border Radius Hierarchy
**Test**: Count distinct border-radius values. Check if they form clear size categories.
**Pass**: ≤ 3 distinct radius values (small/medium/large or sm/md/lg). Values are multiples of 4.

```
Pass: --radius-sm: 8px; --radius-md: 16px; --radius-lg: 24px;
Pass: --radius-sm: 4px; --radius-md: 12px; --radius-lg: 24px;
Fail: border-radius: 7px; border-radius: 13px; border-radius: 18px;
```

### C3. CSS Variable Coverage for Layout
**Test**: Check margin/padding/border-radius/gap usage. Measure var(--space-*) ratio.
**Pass**: ≥ 70% of spacing/radius values use CSS variables.

---

## D. Visual Depth Verification（视觉层次 — 2 项）

### D1. Shadow System Consistency
**Test**: Check all box-shadow values. Count distinct shadows. Check color tone.
**Pass**: All shadows use the same undertone (all warm OR all cool). ≤ 3 distinct shadow levels.

```
Pass (warm shadows): 0 4px 10px rgba(60,45,20,0.15)  — brown undertone
                     0 20px 35px rgba(60,45,20,0.15)
Fail (mixed tones):  0 4px 10px rgba(0,0,0,0.1)     — neutral
                     0 20px 35px rgba(60,45,20,0.15) — warm
```

### D2. Elevation Levels
**Test**: Count distinct z-index values. Verify they make semantic sense.
**Pass**: ≤ 4 z-index levels: base(0) → card(1) → overlay(10) → modal(100). No arbitrary values.

```
Pass: z-index: 1 (cards), 10 (canvas overlay), 100 (drawer), 200 (toast)
Fail: z-index: 2, 5, 9, 15, 50, 99, 101, 150 (arbitrary spread)
```

---

## E. Animation & Micro-interaction（动画交互 — 3 项）

### E1. Transition Easing Check
**Test**: Check all transition and animation timing functions.
**Pass**: No `linear` easing on visual transitions. Use `ease`, `cubic-bezier`, or spring.

```
Pass: transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
Pass: animation: growUp 0.45s cubic-bezier(0.2, 0.9, 0.4, 1.1);
Fail: transition: all 0.3s linear;
```

### E2. GPU-Composited Animations
**Test**: Check which CSS properties are animated.
**Pass**: ALL animations use only `transform` and `opacity`. No animation of `top/left/width/height/margin/padding`.

```
Pass: transform: scale(1.3); opacity: 0.5;
Fail: top: 50px; left: 100px; width: 200px; (causes layout reflow)
```

### E3. Delight Element Count
**Test**: Search for delight element implementations. Count unique elements.
**Pass**: ≥ 2 delight elements from the Delight Floor list (see forcoding-core).

```
Checklist:
□ 触感反馈: navigator.vibrate?.()
□ 粒子/涟漪/扫光效果
□ 逐次飞入 (stagger)
□ 环形进度图 (conic-gradient)
□ 毛玻璃 (backdrop-filter)
□ 渐变呼吸动画
□ 数字跳动效果
□ 成就/徽章系统
□ 统计洞察文案
```

---

## F. Reference Comparison（参考对比 — 2 项）

### F1. Visual Parity with Reference (if reference exists)
**Test**: Compare key visual attributes against reference implementation.
**Pass**: ≥ 3 of 5 key visual dimensions match reference quality.

```
Comparison dimensions:
1. 配色: Is color palette similar quality/warmth?
2. 圆角: Is radius approach similar? (bold rounded vs subtle)
3. 阴影: Shadow warmth and depth similar?
4. 卡片质感: Card backgrounds, borders similar quality?
5. 细节: Reference has details I don't? (e.g., inner glow, border highlight)
```

### F2. Design Language Consistency
**Test**: Verify all UI elements share the same design language.
**Pass**: No element looks like it belongs to a different app/style.

```
Check: timer card vs forest card vs drawer — do they look like the same designer?
       Or does one look flat, another glossy, another 3D?
```

---

## G. 2026 Industry Standards（2026 行业标准 — 6 项）

### G1. Motion Tokens (Named Easing/Duration)
**Test**: Check if transitions use named durations and easings (not raw values).
**Pass**: ≥ 80% of transitions use CSS variables for duration/easing. At minimum: fast/slow/normal.

```
Pass: transition: transform var(--easing-spring) var(--duration-fast);
Pass: --duration-fast: 200ms; --duration-normal: 300ms; --duration-slow: 500ms;
Pass: --easing-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
Fail: transition: all 0.3s ease; (no token reference)
```

### G2. Semantic Token Layer Architecture
**Test**: Check if CSS variables follow semantic naming (intent-based) vs atomic naming (value-based).
**Pass**: Variables describe intent (--color-primary) not value (--color-green-500).

```
Pass: --color-primary, --color-text-body, --color-surface-card, --spacing-section
Fail: --green-500, --blue-200, --size-16, --padding-24
```

### G3. prefers-reduced-motion Support
**Test**: Check if `prefers-reduced-motion` media query is used to disable or simplify animations.
**Pass**: All non-essential animations reduce/disable when the user requests reduced motion.

```
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### G4. Dark Mode Readiness
**Test**: Check if design token structure supports future dark mode (separate surface/color tokens).
**Pass**: Color tokens are semantic (not hardcoded to light values). Light/dark switching is feasible by changing token values only.

```
Pass: --color-surface: #fff → can change to #1a1a1a for dark mode
Pass: --color-text: #3e2723 → can change to #e8e0d4 for dark mode
Fail: border: 1px solid #ddd (hardcode, not token)
Fail: background: #f0f7e6 (hardcode, not token)
```

### G5. Touch Target Size (WCAG 2.2 AA)
**Test**: Check the smallest interactive element size.
**Pass**: All touch targets ≥ 24×24 CSS pixels without overlapping adjacent targets (or 44×44 CSS pixels for comfortable use).

```
Pass: button min-height: 44px; padding creates large hit area
Fail: button padding: 2px 4px; — clickable area too small
Fail: icon button without padding extension
```

### G6. Animation Duration Compliance
**Test**: Check longest animation/transition duration.
**Pass**: Interactive transitions ≤ 300ms. Screen transitions ≤ 600ms. Loading animations exempt.

```
Pass: transition: 0.2s (button press), 0.3s (drawer slide), 0.5s (page transition)
Fail: transition: 1s (user waits too long)
Fail: splash animation delaying main content
```

## Usage: Polish Round (Builder)

During Polish Round (Round 2), run this checklist:

```
## Visual Polish Checklist (forcoding-visual-review)

### A. Color System (5)
□ A1: CSS variable color coverage ≥ 90%?
□ A2: Distinct colors ≤ N+3 of palette?
□ A3: Saturation < 85%, warm/cool consistent?
□ A4: Text contrast meets WCAG AA (≥4.5:1 body, ≥3:1 large)?
□ A5: Non-text contrast meets WCAG AA (≥3:1)?

### B. Typography (2)
□ B1: Chinese font fallback present?
□ B2: Font size hierarchy (≤ 5 distinct values)?

### C. Spacing (3)
□ C1: Spacing system from 4/8/12/16/24/32/48?
□ C2: Border radius hierarchy (≤ 3 values)?
□ C3: Layout CSS variable usage ≥ 70%?

### D. Depth (2)
□ D1: Shadow system consistent undertone?
□ D2: z-index levels ≤ 4?

### E. Animation (3)
□ E1: No linear easing on visual transitions?
□ E2: Only transform/opacity animated?
□ E3: ≥ 2 delight elements?

### F. Reference (2)
□ F1: Visual parity with reference in ≥ 3 dimensions?
□ F2: Single design language across all elements?

### G. 2026 Standards (6)
□ G1: Motion tokens used (named duration/easing)?
□ G2: Semantic token naming (intent > value)?
□ G3: prefers-reduced-motion handled?
□ G4: Dark mode feasible via token swap?
□ G5: Touch targets ≥ 24×24px?
□ G6: Animation duration ≤ 300ms/600ms?

### H. DESIGN.md Token Fidelity (NEW — v3.0 新增)
□ H1: All colors match DESIGN.md palette? (≥ 95%)
□ H2: All border-radius match rounded: tokens? (≥ 90%)
□ H3: All spacing match spacing: tokens? (≥ 80%)
□ H4: Typography hierarchy matches DESIGN.md typo tokens?
```

---

## Usage: Visual Audit (Auditor)

Auditor loads this skill and verifies every item. Report:

```
### Visual Audit (forcoding-visual-review)

A. Color System: [X/5 passed]
  □ A1 CSS Variable Coverage: [PASS/FAIL] — [evidence]
  □ A2 Palette Consistency: [PASS/FAIL] — [evidence]
  □ A3 Saturation/Temperature: [PASS/FAIL] — [evidence]
  □ A4 Text Contrast (WCAG AA): [PASS/FAIL] — [measured ratio]
  □ A5 Non-Text Contrast (WCAG AA): [PASS/FAIL] — [evidence]

B. Typography: [X/2 passed]
  □ B1 Chinese Font Fallback: [PASS/FAIL]
  □ B2 Font Size Hierarchy: [PASS/FAIL]

C. Spacing & Layout: [X/3 passed]
  □ C1 Spacing System: [PASS/FAIL]
  □ C2 Radius Hierarchy: [PASS/FAIL]
  □ C3 CSS Variable Layout Coverage: [PASS/FAIL]

D. Visual Depth: [X/2 passed]
  □ D1 Shadow System: [PASS/FAIL]
  □ D2 Elevation Levels: [PASS/FAIL]

E. Animation: [X/3 passed]
  □ E1 Easing Curves: [PASS/FAIL]
  □ E2 GPU-Composited: [PASS/FAIL]
  □ E3 Delight Count: [PASS/FAIL]

F. Reference: [X/2 passed]
  □ F1 Visual Parity: [PASS/FAIL]
  □ F2 Design Language: [PASS/FAIL]

G. 2026 Standards: [X/6 passed]
  □ G1 Motion Tokens: [PASS/FAIL]
  □ G2 Semantic Tokens: [PASS/FAIL]
  □ G3 Reduced Motion: [PASS/FAIL]
  □ G4 Dark Mode Ready: [PASS/FAIL]
  □ G5 Touch Target Size: [PASS/FAIL]
  □ G6 Animation Duration: [PASS/FAIL]

H. DESIGN.md Token Fidelity: [X/4 passed]
  □ H1 Color Palette Match: [PASS/FAIL]
  □ H2 Border Radius Match: [PASS/FAIL]
  □ H3 Spacing Match: [PASS/FAIL]
  □ H4 Typography Match: [PASS/FAIL]

Visual Audit Verdict: □ PASS (≥ 19/26)  □ PARTIAL (14-18/26 — fix FAIL items)  □ FAIL (< 14/26 — INVALIDATED)
```
