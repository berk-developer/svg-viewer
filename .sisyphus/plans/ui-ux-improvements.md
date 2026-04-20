# UI/UX Improvements Plan: SVG Viewer

> **Goal**: Modernize UI/UX with contemporary patterns, accessibility (WCAG 2.1 AA), and add light/dark theme support.
> **Scope**: Visual design enhancement + accessibility improvements. No new features.
> **Est. Time**: 7 atomic commits, ~3-4 hours

---

## Summary

| Aspect | Decision |
|--------|----------|
| **Aesthetic** | Modern & Minimal — clean lines, high contrast |
| **WCAG Level** | 2.1 AA |
| **Theme** | Light + Dark with System preference (3-state toggle) |
| **Typography** | Enhance current fonts (Fraunces + Source Serif 4) |
| **CSS Architecture** | Single `globals.css` file (no split) |
| **Theme Implementation** | CSS custom properties + `.theme-light` class override |

---

## Scope Definition

### ✅ IN Scope

- Accessibility improvements (ARIA labels, keyboard navigation, skip links)
- Light theme CSS custom properties
- Theme toggle component with localStorage persistence
- FOUC (Flash of Unstyled Content) prevention
- Enhanced typography hierarchy
- Visual polish of existing components
- Keyboard pan/zoom for SVG viewport
- Fix Navigation active state flash

### ❌ OUT of Scope

- New features (keyboard shortcuts, URL import, undo/redo)
- Component extraction/refactoring
- CSS architecture changes (no CSS Modules, Tailwind)
- New npm dependencies (no `next-themes`)
- Loading skeletons
- Navigation redesign
- Animation additions
- Web Worker modifications
- Build configuration changes

---

## Guardrails (from Metis)

| Constraint | Reason |
|------------|--------|
| MUST NOT change component file boundaries | Scope creep risk |
| MUST NOT add UI component dependencies | Architecture stability |
| MUST NOT modify SVG rendering pipeline | Security sensitivity |
| MUST NOT add animations | Respect `prefers-reduced-motion` |
| MUST keep dark theme as base | Zero risk to existing users |
| MUST implement light theme as CSS override | Minimal regression risk |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Theme persistence | `localStorage` + inline `<script>` (FOUC prevention) | Static export compatible, no SSR |
| Theme default | Dark (current) | Existing users unaffected |
| Theme toggle type | `<button>` with `aria-pressed` | Simpler than `role="switch"` |
| Canvas background | Independent of app theme | Users need preview flexibility |
| Navigation fix | Replace `window.location.pathname` with `usePathname()` | 3-line fix, eliminates flash |

---

## Technical Approach

### Phase 1: Accessibility (Commits 1-3)
Isolated additive changes to existing elements with zero visual regression risk.

### Phase 2: Theme System (Commits 4-6)
Build foundation (CSS vars) → mechanism (toggle) → comprehensive verification.

### Phase 3: Verification (Commit 7)
Automated tests protecting against regressions.

---

## Files to Modify

| File | Changes |
|------|---------|
| `app/globals.css` | Light theme tokens, theme-specific styles, enhanced typography |
| `app/layout.tsx` | Skip link, FOUC script, `usePathname()` fix, theme toggle |
| `components/svg-workbench.tsx` | ARIA attributes, keyboard handlers, enhanced alt |
| `components/svg-compare.tsx` | ARIA attributes, aria-valuetext, slot labels |

---

## CSS Architecture

### Custom Property Strategy

```
Existing (Dark Base):
:root {
  --bg-primary: #0a0a0a;
  --text-primary: #e5e5e5;
  ...
}

New (Light Override):
:root.theme-light {
  --bg-primary: #ffffff;
  --text-primary: #1a1a1a;
  ...
}
```

### Theme Class Application

```html
<html class="theme-light"> <!-- Only added when light theme is active -->
```

---

## Accessibility Requirements

### WCAG 2.1 AA Checklist

| Criteria | Implementation |
|----------|----------------|
| **1.1.1** Non-text Content | Enhanced `alt` on SVG preview image |
| **1.3.1** Info and Relationships | Proper labels on all inputs |
| **1.4.3** Contrast Minimum | 4.5:1 for text (verify in both themes) |
| **2.1.1** Keyboard | Pan/zoom via keyboard in viewport |
| **2.4.1** Skip Blocks | Skip link to main content |
| **2.4.7** Focus Visible | Existing focus-visible styles ✓ |
| **4.1.2** Name, Role, Value | All toggles have aria-pressed |
| **4.1.3** Status Messages | aria-live on toasts |

### Keyboard Navigation

| Element | Keys | Action |
|---------|------|--------|
| SVG Viewport | Arrow keys | Pan |
| SVG Viewport | `+` / `-` | Zoom in/out |
| SVG Viewport | `0` | Reset zoom |
| Theme Toggle | Enter/Space | Toggle theme |
| Tab | Tab | Next focusable |
| Shift+Tab | Shift+Tab | Previous focusable |

---

## Edge Cases

### Theming
- SVG transparency on light background → Canvas background independent ✓
- `localStorage` disabled → Fallback to system preference
- System theme change while app open → Listen to `matchMedia` change
- Print → Force light theme regardless of setting
- FOUC → Inline blocking script before first paint

### Accessibility
- Screen reader + zoom → Announce zoom level on change
- Toast urgency → Errors `aria-live="assertive"`, success `"polite"`
- Drag-and-drop state → Announce `dropActive` for screen readers
- Large file warnings → Accessible labels (not just visual)
- Compare overlay slider → `aria-valuetext="Left 70%, Right 30%"`

---

## Verification Commands

```bash
# Build must pass with zero errors
npx next build

# Type check
npx tsc --noEmit

# Lint check
npx eslint .

# Manual checklist after build
# 1. Load page, verify no flash (theme loads immediately)
# 2. Tab through all controls, verify focus ring visible
# 3. Focus viewport, use arrow keys to pan
# 4. Press +/- to zoom, press 0 to reset
# 5. Toggle theme, verify all text readable
# 6. Test with screen reader (VoiceOver/NVDA)
# 7. Test localStorage disabled (private window)
# 8. Test system theme change detection
```

---

## Commit Strategy

Atomic commits with clear scope. Each commit ships independently valuable work.

---

## Task List

### Commit 1: Skip Link and Navigation Fix

**Branch**: `feat/a11y-skip-link-navigation`

#### Task 1.1: Add Skip Link to Layout
**File**: `app/layout.tsx`
**Changes**:
- Add skip link as first focusable element: `<a href="#main" class="skipLink">Skip to main content</a>`
- Add `id="main"` to `<main>` element
- Add CSS for `.skipLink` in globals.css (off-screen until focused)

**QA**:
- Tab into page → skip link visible with focus ring
- Press Enter → focus moves to main content
- Skip link hidden when not focused

**Verification Commands**:
```bash
# Build passes
npx next build

# Manual: Tab into page, verify skip link appears
```

---

#### Task 1.2: Fix Navigation Active State Flash
**File**: `app/layout.tsx`
**Changes**:
- Replace `window.location.pathname` in `useEffect` with `usePathname()` from `next/navigation`
- Remove `useEffect` entirely, use pathname directly in `isActive` calculation
- This eliminates the hydration mismatch and flash

**QA**:
- Navigate to `/compare` → Compare link shows active immediately (no delay)
- Click back to `/` → Viewer link shows active immediately
- No hydration warnings in console

**Example**:
```tsx
// Before
const [isActive, setIsActive] = useState(false);
useEffect(() => { setIsActive(window.location.pathname === href); }, [href]);

// After
import { usePathname } from 'next/navigation';
const pathname = usePathname();
const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
```

---

#### Task 1.3: Add Landmark Roles
**File**: `app/layout.tsx`
**Changes**:
- Add `role="banner"` to `<header>`
- Add `role="navigation"` to `<nav>`
- Add `role="main"` to `<main>`

**QA**:
- Screen reader announces landmarks correctly
- Landmark navigation works (VoiceOver: VO+U for landmarks list)

---

### Commit 2: SvgWorkbench Accessibility

**Branch**: `feat/a11y-workbench`

#### Task 2.1: Add ARIA to Tool Button Groups
**File**: `components/svg-workbench.tsx`
**Changes**:
- Wrap toolbar buttons in `<div role="toolbar" aria-label="Zoom controls">`
- Wrap background buttons in `<div role="toolbar" aria-label="Background selection">`
- Add `aria-pressed={isDark}` to background toggle buttons
- Add `aria-pressed={isInfoActive}` etc. to panel tab buttons

**QA**:
- Tab to toolbar → screen reader announces "Zoom controls, toolbar"
- Background button pressed state announced
- Panel tab pressed state announced

---

#### Task 2.2: Add Keyboard Pan/Zoom to Viewport
**File**: `components/svg-workbench.tsx`
**Changes**:
- Add `tabIndex={0}` to `stageViewport` div
- Add `onKeyDown` handler:
  - Arrow keys: pan by 10% of viewport
  - `+` / `=`: zoom in
  - `-`: zoom out
  - `0`: reset to fit
- Add `role="application"` and `aria-label="SVG preview viewport"` to viewport
- Add focus ring on viewport when focused

**QA**:
- Tab to viewport → focus ring visible
- Press Arrow Up → pan up
- Press + → zoom in
- Press 0 → reset to fit
- Arrow keys still work, no conflict with page scroll

---

#### Task 2.3: Add Live Region to Toast
**File**: `components/svg-workbench.tsx`
**Changes**:
- Wrap toast in `<div aria-live="polite" aria-atomic="true">`
- Use `aria-live="assertive"` for error toasts (danger tone)

**QA**:
- Load invalid SVG → error toast announced immediately by screen reader
- Copy success → toast announced politely (doesn't interrupt)
- Toast auto-dismiss → screen reader announces if still reading

---

#### Task 2.4: Enhance SVG Preview Alt Text
**File**: `components/svg-workbench.tsx`
**Changes**:
- Update `<img alt={currentInput.name}>` to include dimensions:
  ```tsx
  alt={`Preview of ${currentInput.name}, ${svgWidth}×${svgHeight} pixels`}
  ```
- Handle case where dimensions not yet loaded (pending state)

**QA**:
- Screen reader announces: "Preview of example.svg, 100×100 pixels"
- No dimensions loaded yet → "Preview of example.svg, loading..."

---

### Commit 3: SvgCompare Accessibility

**Branch**: `feat/a11y-compare`

#### Task 3.1: Add ARIA to Grid/Overlay Tabs
**File**: `components/svg-compare.tsx`
**Changes**:
- Wrap tabs in `<div role="tablist" aria-label="Comparison view">`
- Each tab button: `role="tab"`, `aria-selected={isActive}`, `aria-controls="panel-id"`
- Tab panels: `role="tabpanel"`, `aria-labelledby="tab-id"`

**QA**:
- Tab to tablist → screen reader announces "Comparison view, tab list"
- Arrow keys navigate between tabs (implement keyboard nav)
- Space/Enter selects tab

---

#### Task 3.2: Add aria-valuetext to Overlay Slider
**File**: `components/svg-compare.tsx`
**Changes**:
- On range slider, add `aria-valuetext={`Left ${value}%, Right ${100-value}%`}``
- Add `aria-label="Comparison reveal slider"`

**QA**:
- Screen reader announces: "Comparison reveal slider, Left 70 percent, Right 30 percent"
- Slider position annnounced on value change

---

#### Task 3.3: Add Screen Reader Labels to Slots
**File**: `components/svg-compare.tsx`
**Changes**:
- Add `aria-label={`Slot ${index + 1}: ${hasFile ? filename : 'empty'}`}` to each compare slot card
- Add visually hidden status text for slot state

**QA**:
- Tab to slot → screen reader announces "Slot 1: example.svg"
- Empty slot → "Slot 2: empty"
- Screen reader can distinguish slots by number

---

## Commit 4: Light Theme CSS Tokens

**Branch**: `feat/theme-css-tokens`

#### Task 4.1: Define Light Theme Color Palette
**File**: `app/globals.css`
**Changes**:
- Add `:root.theme-light` block after `:root` block
- Override all color custom properties for light theme
- Verify contrast ratios (4.5:1 for text, 3:1 for UI) using WebAIM Contrast Checker

**Token Mappings**:
```css
:root.theme-light {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-tertiary: #e5e5e5;
  --bg-elevated: #ffffff;
  --text-primary: #1a1a1a;
  --text-secondary: #525252;
  --text-muted: #737373;
  --border-subtle: #e5e5e5;
  --border-default: #d4d4d4;
  --border-strong: #a3a3a3;
  /* Accent, success, warning, danger stay the same */
}
```

**QA**:
- Apply `.theme-light` to `<html>` manually in DevTools
- All text readable (contrast passes AA)
- All UI elements visible (borders, backgrounds)
- Hover/focus states visible

**Verification Commands**:
```bash
# Build passes
npx next build

# Manual: Add class="theme-light" to <html> in DevTools
# Verify: All text readable, no invisible elements
```

---

#### Task 4.2: Update Hardcoded Colors to Custom Properties
**File**: `app/globals.css`
**Changes**:
- Search for any hardcoded hex colors outside custom properties
- Replace with `var(--token-name)` references
- Focus on: shadows, borders, text colors embedded in selectors

**QA**:
- Toggle `.theme-light` → all colors change
- No visual artifacts (elements that don't switch theme)

---

#### Task 4.3: Add Theme-Specific Styles
**File**: `app/globals.css`
**Changes**:
- Add `@media (prefers-color-scheme: light)` fallback for initial load
- Add subtle shadow tokens for light theme elevation
- Ensure scrollbar colors work in both themes

**QA**:
- System preference light → light theme on first load (before localStorage)
- Scrollbar visible in both themes
- Shadows visible in light theme

---

### Commit 5: Theme Toggle and FOUC Prevention

**Branch**: `feat/theme-toggle`

#### Task 5.1: Add FOUC Prevention Script
**File**: `app/layout.tsx`
**Changes**:
- Add inline `<script>` in `<head>` (before any CSS loads):
  ```tsx
  <head>
    <script dangerouslySetInnerHTML={{ __html: `
      (function() {
        try {
          var theme = localStorage.getItem('svg-viewer-theme');
          var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (theme === 'light' || (!theme && !systemDark)) {
            document.documentElement.classList.add('theme-light');
          }
        } catch (e) {}
      })();
    ` }} />
  </head>
  ```

**QA**:
- Set light theme, reload → no flash (light immediately)
- Set dark theme, reload → no flash (dark immediately)
- Set system theme, change OS pref, reload → matches OS
- `localStorage` disabled → fallback to system preference

---

#### Task 5.2: Create Theme Toggle Component
**File**: `app/layout.tsx` (or new `components/theme-toggle.tsx`)
**Changes**:
- Create 3-state toggle: Light / Dark / System
- `<button>` with `aria-pressed`, `aria-label="Theme: {current}"`
- State stored in `localStorage` key `"svg-viewer-theme"`
- Listen to `matchMedia` changes for System mode

**Code Structure**:
```tsx
'use client';
import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');
  
  useEffect(() => {
    // Read from localStorage, apply class
  }, [theme]);
  
  // Listen to matchMedia for system mode
  
  return (
    <button
      aria-pressed={theme !== 'system'}
      aria-label={`Theme: ${theme}`}
      onClick={cycleTheme}
    >
      {/* Icon based on theme */}
    </button>
  );
}
```

**QA**:
- Click toggle → cycles: light → dark → system
- Light: UI becomes light, `localStorage` = 'light'
- Dark: UI becomes dark, `localStorage` = 'dark'
- System: follows OS preference, `localStorage` = 'system' or null
- `aria-pressed` true for light/dark, false for system

---

#### Task 5.3: Listen to System Theme Changes
**File**: `components/theme-toggle.tsx`
**Changes**:
- Add `matchMedia` listener in `useEffect` for system mode
- Update UI when OS theme changes while in system mode
- Clean up listener on unmount

**QA**:
- Set system mode, change OS theme → app follows immediately
- Light mode set, change OS theme → app stays light

---

### Commit 6: Component Style Adaptation

**Branch**: `feat/theme-adaptation`

#### Task 6.1: Verify All States in Both Themes
**File**: `app/globals.css`, `components/*.tsx`
**Changes**:
- Test all interactive states: `:hover`, `:focus-visible`, `:active`, `:disabled`
- Ensure focus rings visible in both themes
- Ensure disabled states readable
- Add theme-specific hover colors if needed

**QA**:
- Hover over all buttons in light theme → visible feedback
- Focus on all interactive elements → focus ring visible
- Disabled buttons → clearly disabled in both themes

---

#### Task 6.2: Add Selection and Placeholder Colors
**File**: `app/globals.css`
**Changes**:
- Add `::selection` styles for both themes
- Add `::placeholder` styles for both themes
- Ensure scrollbar track/thumb colors for both themes

**QA**:
- Select text in light theme → visible selection color
- Placeholder text readable in both themes
- Scrollbar visible in both themes

---

#### Task 6.3: Typography Hierarchy Enhancement
**File**: `app/globals.css`
**Changes**:
- Add type scale custom properties: `--text-xs` through `--text-2xl`
- Add line-height scale: `--leading-tight`, `--leading-normal`, `--leading-relaxed`
- Add font-weight variants: `--font-normal`, `--font-medium`, `--font-semibold`
- Apply to existing heading/paragraph elements

**Token Structure**:
```css
:root {
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;   /* 20px */
  --text-2xl: 1.5rem;   /* 24px */
  
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

**QA**:
- Typography consistent across components
- Headings properly sized
- Body text readable line height

---

### Commit 7: Verification Tests

**Branch**: `feat/theme-a11y-tests`

#### Task 7.1: Add Contrast Ratio Verification
**File**: `tests/contrast.test.ts` (new file)
**Changes**:
- Create test that computes contrast ratios for all color pairs
- Use WCAG contrast formula
- Assert all pairs meet AA (4.5:1 text, 3:1 UI)

**Code Structure**:
```typescript
import { getContrastRatio } from './contrast-utils';

const darkTheme = { bg: '#0a0a0a', text: '#e5e5e5', ... };
const lightTheme = { bg: '#ffffff', text: '#1a1a1a', ... };

describe('WCAG AA Contrast', () => {
  it('dark theme text on bg meets 4.5:1', () => {
    expect(getContrastRatio(darkTheme.text, darkTheme.bg)).toBeGreaterThanOrEqual(4.5);
  });
  // ... more pairs
});
```

**Verification Commands**:
```bash
npm test
```

---

#### Task 7.2: Add Keyboard Navigation Test
**File**: `tests/keyboard.test.ts` (new file, or use Playwright)
**Changes**:
- Test Tab navigation sequence
- Test keyboard pan/zoom in viewport
- Test theme toggle with keyboard

**Verification Commands**:
```bash
npx playwright test
```

---

#### Task 7.3: Add Theme Persistence Test
**File**: `tests/theme.test.ts`
**Changes**:
- Test: set theme → reload page → verify class on `<html>`
- Test: localStorage disabled → fallback to system
- Test: system theme change → app follows

---

## Final Verification Wave

**IMPORTANT**: This section requires explicit user "okay" before marking work complete.

### Manual Verification Checklist

After all commits, manually verify:

- [x] **Build passes**: `npx next build` completes with zero errors ✅
- [x] **Type check passes**: `npx tsc --noEmit` ✅
- [ ] **No FOUC**: Set light theme, reload, no flash from dark to light (requires manual testing)
- [ ] **Keyboard nav**: Tab through all controls, focus ring visible everywhere (requires manual testing)
- [ ] **Pan/zoom**: Focus viewport, Arrow keys pan, +/- zoom, 0 resets (requires manual testing)
- [ ] **Theme toggle**: Click cycles through light → dark → system (requires manual testing)
- [ ] **System theme**: Set system, change OS theme, app follows (requires manual testing)
- [ ] **Accessibility**: Run Axe DevTools, zero critical violations (requires manual testing)
- [ ] **Contrast**: All text readable in both themes (requires manual testing)
- [ ] **Screen reader**: Load SVG, verify alt text, navigate to panel (requires manual testing)
- [ ] **Print**: Consider print styles (optional enhancement)

### QA Scenarios

1. **Theme Persistence**
   - Set light theme → close tab → reopen → still light
   - Set dark theme → close tab → reopen → still dark
   - Set system → change OS theme → app follows

2. **Keyboard Only Workflow**
   - Tab to skip link → Enter → focus in main
   - Tab to upload → Enter → file dialog opens
   - Tab to viewport → Arrow keys pan → +/- zoom
   - Tab to theme → Enter → toggles

3. **Screen Reader Workflow**
   - Load page → VO announces "SVG Viewer, main landmark"
   - Tab → "Skip to main content, link"
   - Tab → "Upload SVG file, button"
   - Load file → "Preview of example.svg, 100×100 pixels"
   - Tab to panel → "Info panel, tool bar"

---

## Plan Summary

| Category | Tasks | Files |
|----------|-------|-------|
| Accessibility (Skip Link) | 3 | `layout.tsx`, `globals.css` |
| Accessibility (Workbench) | 4 | `svg-workbench.tsx`, `globals.css` |
| Accessibility (Compare) | 3 | `svg-compare.tsx` |
| Theme (CSS Tokens) | 3 | `globals.css` |
| Theme (Toggle) | 3 | `layout.tsx` or new component |
| Theme (Adaptation) | 3 | `globals.css`, `*.tsx` |
| Verification | 3 | New test files |

**Total**: 22 tasks across 7 commits

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| FOUC on static export | Inline `<script>` in `<head>` before paint |
| Contrast fails in one theme | Pre-verify all color pairs before committing |
| Keyboard conflicts with touch handlers | Add handlers, don't modify existing ones |
| Scope creep into component refactor | Explicit guardrails, code review checkpoints |
| `localStorage` disabled | Fallback to system preference |

---

## Next Steps

1. User reviews plan
2. User chooses Normal or High Accuracy (Momus) mode
3. Run `/start-work` to begin execution
4. Sisyphus executes each commitment sequence
5. User provides final "okay" after verification wave

---

> **Plan saved to**: `.sisyphus/plans/ui-ux-improvements.md`
> **Draft saved to**: `.sisyphus/drafts/ui-ux-improvements.md`
> 
> Run `/start-work` when ready to begin execution.