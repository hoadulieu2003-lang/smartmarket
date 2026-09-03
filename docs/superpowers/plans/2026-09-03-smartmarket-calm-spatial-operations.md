# Smartmarket Calm Spatial Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved Calm Spatial Operations visual system in the isolated Smartmarket worktree with responsive desktop/mobile Application Shell while preserving all operational data, state, callbacks, and spatial model behavior.

**Architecture:** Keep the existing component boundaries and state flow. Add semantic CSS tokens and responsive presentation rules, then update Shell and operational components without changing canonical spatial data or action callback contracts. Use native buttons/inputs and CSS media queries for responsive behavior; use Playwright for viewport evidence and Vitest/Testing Library for component semantics.

**Tech Stack:** Next.js 16.3.4 App Router, React 19.2.8, TypeScript, Tailwind CSS v4, CSS variables, Lucide React, Vitest, Testing Library, Playwright.

## Global Constraints

- All production changes stay in `C:\Users\game\Documents\app\Smartmarket.worktrees\ui-refresh`; do not modify `C:\Users\game\Documents\app\Smartmarket`.
- Preserve Canonical Spatial Model v3.2.0, geometry, fixtures, issue priority, mock data, routes, state machine, filters, action callbacks, and operational copy meaning.
- Smart Market Green `#076C31` is only for brand, navigation, and selected focus; use rose/amber/info semantic tokens for operational states.
- Use Lucide/SVG icons; do not use emoji as structural icons in Shell, map toolbar, or legend.
- Use mobile-first responsive behavior with 4/8px spacing rhythm, body text >=16px on mobile, interactive targets >=44x44px, visible `:focus-visible`, keyboard support, and reduced-motion support.
- No page-level horizontal overflow; intentional horizontal scrolling must be scoped to labeled filter/fixture regions.
- Write tests before production changes and watch each new behavior test fail for the expected missing behavior.

---

### Task 1: Token foundation and document metadata

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Create: `src/app/globals.test.ts` (or the closest existing component test location if CSS-only assertions are not viable)

**Interfaces:**
- Produces semantic CSS variables consumed by all later Shell/component tasks.
- Keeps existing `--smart-market-green` compatibility while adding token aliases.

- [ ] **Step 1: Write the failing test** asserting the rendered root metadata title is `Smartmarket — Trung tâm điều hành chợ` and that the root layout exposes a Vietnamese document language.
- [ ] **Step 2: Run `npm test -- src/app/globals.test.ts --run` and confirm it fails because the metadata/title contract is still Create Next App/default.
- [ ] **Step 3: Add semantic primitive and component token variables to `globals.css`, a global `:focus-visible` rule, reduced-motion override, `min-height: 100dvh` base behavior, and update `layout.tsx` metadata/lang without changing page data.
- [ ] **Step 4: Run the focused test and then `npm test -- --run`; confirm the focused test and all existing tests pass.
- [ ] **Step 5: Run `git diff --check` and record the changed files in the task report.

### Task 2: Responsive Sidebar, Header, and page container

**Files:**
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/components/Header.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/components/ApplicationShell.test.tsx`

**Interfaces:**
- Preserve `SidebarProps`, `HeaderProps`, all navigation ids, and callbacks (`onSelectView`, `onScrollToFees`, `onFilterComplaints`, `onSearchChange`, `onOpenActivityModal`).
- Produces mobile off-canvas state semantics (`aria-expanded`, labelled menu/close control) and desktop collapsed rail presentation.

- [ ] **Step 1: Write failing component tests** for (a) the mobile menu control having an accessible name and `aria-expanded=false` initially, (b) Sidebar navigation buttons preserving existing labels/badges, and (c) Header search and notification retaining accessible names.
- [ ] **Step 2: Run `npm test -- src/components/ApplicationShell.test.tsx --run`; confirm failure because the mobile shell semantics are absent.
- [ ] **Step 3: Implement the smallest responsive shell change: add page-level mobile menu state in `page.tsx`, off-canvas/scrim markup in Sidebar, responsive header controls, skip link, and token-based classes. Keep desktop layout and callbacks intact.
- [ ] **Step 4: Run the focused test and `npm test -- --run`; confirm pass.
- [ ] **Step 5: Run `npm run lint`; fix only lint issues caused by this task and record evidence.

### Task 3: Priority Area, quick filters, fee and pending-profile responsiveness

**Files:**
- Modify: `src/components/UrgentActionCards.tsx`
- Modify: `src/components/InlineOverviewBar.tsx`
- Modify: `src/components/MarketFeeCollectionSection.tsx`
- Modify: `src/components/PendingProfilesView.tsx`
- Create: `src/components/OperationalResponsive.test.tsx`

**Interfaces:**
- Preserve `UrgentActionsData`, filter ids (`all`, `complaint`, `expiring`, `maintenance`, `empty`), and all callbacks.
- Produces responsive priority/accordion semantics without changing displayed counts or operational copy.

- [ ] **Step 1: Write failing tests** asserting priority panels expose `aria-expanded` on mobile disclosure controls, quick filter buttons expose `aria-pressed`, and all five filter ids remain available.
- [ ] **Step 2: Run `npm test -- src/components/OperationalResponsive.test.tsx --run`; confirm failure because the new semantics are absent.
- [ ] **Step 3: Implement mobile stack/accordion presentation, desktop 4-column/tablet 2-column layout, scoped filter-chip overflow, responsive fee grid and one-column pending profiles, using semantic tokens and >=44px targets.
- [ ] **Step 4: Run the focused test and `npm test -- --run`; confirm pass.
- [ ] **Step 5: Run `git diff --check` and `npm run lint`; record output.

### Task 4: Map Toolbar, legend, and fixture controls

**Files:**
- Modify: `src/components/MapToolbar.tsx`
- Modify: `src/app/page.tsx` (only fixture/legend presentation markup if required)
- Create: `src/components/MapToolbar.responsive.test.tsx`

**Interfaces:**
- Preserve map callbacks, floor/zone/layer/duty/zoom/density props, and selected-stall behavior.
- Produces a maximum two-row desktop toolbar, compact mobile disclosure, and icon-only controls with accessible names.

- [ ] **Step 1: Write failing tests** asserting layer controls have no emoji text, icon-only buttons have accessible names, and existing floor/zone/duty control labels remain discoverable.
- [ ] **Step 2: Run `npm test -- src/components/MapToolbar.responsive.test.tsx --run`; confirm failure on emoji/icon semantics.
- [ ] **Step 3: Replace structural emoji with Lucide icons, add responsive grouping/overflow boundaries and focus states, without altering map state callbacks or spatial renderer input.
- [ ] **Step 4: Run the focused test and `npm test -- --run`; confirm pass.
- [ ] **Step 5: Run `npm run lint` and `git diff --check`; record evidence.

### Task 5: Drawer presentation, integration verification, and visual evidence

**Files:**
- Modify: `src/components/StallDetailDrawer.tsx`
- Modify: `src/components/StallDetailDrawer.test.tsx`
- Modify: `e2e/stall-visual-language.spec.ts`
- Create: `e2e/smartmarket-responsive.spec.ts`

**Interfaces:**
- Preserve six decision sections, dynamic primary actions, all action callbacks, and stall visual selection behavior.
- Produces desktop right inspector and mobile bottom-sheet presentation with close/escape/focus semantics.

- [ ] **Step 1: Extend failing drawer tests** for mobile-ready classes/attributes, `aria-modal`, accessible close control, and preserved six-section/action behavior.
- [ ] **Step 2: Run `npm test -- src/components/StallDetailDrawer.test.tsx --run`; confirm the new assertions fail before implementation.
- [ ] **Step 3: Implement responsive drawer classes, bottom-sheet geometry, scrim, heading/close labelling, reduced-motion transitions, and focus-safe semantics. Update stale E2E selectors only where they describe the current Smartmarket UI, not to remove coverage.
- [ ] **Step 4: Add `e2e/smartmarket-responsive.spec.ts` covering 390x844, 768x900, and 1280x720: no page overflow, mobile off-canvas/sidebar, priority readability, map controls, drawer mode, and desktop hierarchy.
- [ ] **Step 5: Run focused drawer tests, `npm test -- --run`, `npm run lint`, `npm run build`, and `npm run test:e2e`; keep complete output and screenshots for the report.

### Task 6: Whole-branch review and delivery handoff

**Files:**
- Review: all files changed by Tasks 1–5
- Update: `docs/superpowers/specs/2026-09-03-smartmarket-calm-spatial-operations-design.md` only if an evidence-backed deviation exists

- [ ] **Step 1: Run `git diff --check`, `npm test -- --run`, `npm run lint`, `npm run build`, and `npm run test:e2e` fresh from the worktree.
- [ ] **Step 2: Inspect `git diff --stat`, `git diff --name-only`, and the old workspace status to confirm changes are isolated.
- [ ] **Step 3: Compare acceptance criteria AC-01 through AC-09 against test output and screenshots; record any deviation instead of claiming completion by build status alone.
- [ ] **Step 4: Request whole-branch code review before handoff; resolve Critical/Important findings in the worktree and rerun covering tests.

