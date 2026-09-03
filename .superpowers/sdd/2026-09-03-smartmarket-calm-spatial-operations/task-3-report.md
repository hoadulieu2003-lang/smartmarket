# Task 3 Report - Responsive Priority Area and Operational Sections

## Scope

- Workspace: `C:\Users\game\Documents\app\Smartmarket.worktrees\ui-refresh`
- Files changed:
  - `src/components/UrgentActionCards.tsx`
  - `src/components/InlineOverviewBar.tsx`
  - `src/components/MarketFeeCollectionSection.tsx`
  - `src/components/PendingProfilesView.tsx`
  - `src/components/OperationalResponsive.test.tsx`
- Files intentionally not touched: Sidebar, Header, page shell, MapToolbar, Drawer, canonical spatial model, fixtures, mock data, routes, and page-level state logic.

## Implementation Notes

- Added focused operational responsive tests before production edits.
- Priority Area now keeps the four operational levels, uses a responsive one/two/twelve-column matrix, and exposes lower-priority sections as disclosure controls with `aria-expanded`.
- Urgent marker animation now uses `motion-safe:animate-ping`.
- Quick filters preserve the five ids (`all`, `complaint`, `expiring`, `maintenance`, `empty`), expose `aria-pressed`, and sit inside an internal horizontal scroll region.
- Fee collection stats now use one/two/four-column responsive grids, semantic progress bars, tokenized brand color, and 44px-class action targets.
- Pending profiles now has a reachable search field, `all`/`overdue`/`pending` filter controls, wrapping header/actions, and mobile-safe card actions.
- Existing data, callbacks, and business flow were preserved.

## TDD Evidence

### RED

Command:

```powershell
npm test -- src/components/OperationalResponsive.test.tsx --run
```

Output summary:

```text
Test Files  1 failed (1)
Tests  3 failed | 1 passed (4)
Failure 1: unable to find disclosure button for "Mức 2".
Failure 2: unable to find data-testid="operational-filter-scroll".
Failure 3: unable to find data-testid="operational-filter-scroll".
Exit code: 1
```

### GREEN

Command:

```powershell
npm test -- src/components/OperationalResponsive.test.tsx --run
```

Output summary:

```text
Test Files  1 passed (1)
Tests  3 passed (3)
Duration  1.95s
Exit code: 0
```

## Verification

Focused ESLint:

```powershell
npx eslint src/components/UrgentActionCards.tsx src/components/InlineOverviewBar.tsx src/components/MarketFeeCollectionSection.tsx src/components/PendingProfilesView.tsx src/components/OperationalResponsive.test.tsx
```

```text
No output
Exit code: 0
```

Full Vitest:

```powershell
npm test -- --run
```

```text
Test Files  1 failed | 8 passed (9)
Tests  3 failed | 52 passed (55)
Exit code: 1
Failures are in src/components/StallDetailDrawer.test.tsx, which is outside Task 3 scope and belongs to the planned Drawer/Task 5 work:
- dialog role/name not present
- Escape close not wired
- drawer still exposes a structural issue-status emoji
```

TypeScript:

```powershell
npx tsc --noEmit
```

```text
Exit code: 1
src/components/StallDetailDrawer.test.tsx(58,20): error TS2339: Property 'toHaveAttribute' does not exist on type 'Assertion<HTMLElement>'.
This diagnostic is outside Task 3 scope and in the Drawer test file.
```

Diff check:

```powershell
git diff --check
```

```text
No output
Exit code: 0
```

## Commit

- Commit SHA: generated after this report is staged; final SHA is returned in the task response.

## Concerns

- The worktree uses an orphan branch copied from an uncommitted source tree, so adding Task 3 components records those files as new tracked files in this branch. I staged only Task 3 files and this report.
- Earlier full-suite and TypeScript checks were temporarily blocked by Drawer tests outside Task 3. After the review-fix rerun, full Vitest and TypeScript both pass.

## Review Fix - 2026-09-03

### Findings addressed

- Area-alert rows no longer render interactive no-op buttons when `onSelectAreaAlert` is not provided. When the callback exists, each alert remains a named button and calls the callback with the selected location.
- The Level-1 complaint card is now keyboard-operable with `role="button"`, `tabIndex={0}`, Enter/Space handling, and focus-visible styling. Nested stall-code buttons still stop propagation and keep their stall-code callback.
- Pending profile header and filter counts now use `URGENT_ACTIONS.pendingProfiles.totalPending` and `URGENT_ACTIONS.pendingProfiles.overdue` as the summary source of truth, while the rich local card list is labelled as the visible sample set.
- The uncollected fee card label now reads `Tổng chưa thu (14 sạp)` so the same amount is not implied to be overdue debt.

### Covering RED

Command:

```powershell
npm test -- src/components/OperationalResponsive.test.tsx --run
```

Output summary:

```text
Test Files  1 failed (1)
Tests  4 failed | 5 passed (9)
Failure 1: unable to find role="button" for Level-1 complaint card.
Failure 2: area-alert row still rendered as a button when callback was absent.
Failure 3: profile summary count used 4 local cards instead of the operational total 7.
Failure 4: unable to find "Tổng chưa thu (14 sạp)" fee label.
Exit code: 1
```

### Covering GREEN

Command:

```powershell
npm test -- src/components/OperationalResponsive.test.tsx --run
```

Output summary:

```text
Test Files  1 passed (1)
Tests  9 passed (9)
Duration  2.77s
Exit code: 0
```

### Re-run verification

Full Vitest:

```powershell
npm test -- --run
```

```text
Test Files  9 passed (9)
Tests  61 passed (61)
Duration  5.22s
Exit code: 0
```

Focused ESLint:

```powershell
npx eslint src/components/UrgentActionCards.tsx src/components/InlineOverviewBar.tsx src/components/MarketFeeCollectionSection.tsx src/components/PendingProfilesView.tsx src/components/OperationalResponsive.test.tsx
```

```text
No output
Exit code: 0
```

TypeScript:

```powershell
npx tsc --noEmit
```

```text
No output
Exit code: 0
```

Diff check:

```powershell
git diff --check
```

```text
Exit code: 0
Warnings only: Git reports LF will be replaced by CRLF the next time it touches Task 3 files.
No whitespace errors.
```
