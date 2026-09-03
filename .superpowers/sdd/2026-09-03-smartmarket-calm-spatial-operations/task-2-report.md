# Task 2 Report — Responsive Sidebar, Header, and page container

## Scope

- Workspace: `C:\Users\game\Documents\app\Smartmarket.worktrees\ui-refresh`
- Files changed:
  - `src/components/ApplicationShell.test.tsx`
  - `src/components/Header.tsx`
  - `src/components/Sidebar.tsx`
  - `src/app/page.tsx`
- Files intentionally not touched: Priority Area, Map Toolbar, Drawer, fee/profile components, canonical spatial model, fixtures, routes, state machine, mock data.

## Implementation Notes

- Added focused Application Shell tests for mobile menu accessibility, sidebar label/badge preservation, and header search/notification discoverability.
- Added optional Header mobile-menu props with accessible name, `aria-controls`, `aria-expanded`, and a focusable trigger.
- Added optional Sidebar mobile props for off-canvas behavior, scrim click close, explicit close button, Escape close, and accessible navigation names that preserve label + badge separation.
- Added page-owned mobile sidebar state/ref, focus restoration to the menu trigger after close, a skip link, stable `main#main-content`, `100dvh` shell height, and root horizontal overflow containment.
- Preserved existing callbacks: `onSelectView`, `onScrollToFees`, `onFilterComplaints`, `onSearchChange`, `onOpenActivityModal`.

## TDD Evidence

### RED

Command:

```powershell
npm test -- src/components/ApplicationShell.test.tsx --run
```

Output summary:

```text
Test Files  1 failed (1)
Tests  2 failed | 1 passed (3)
Failure 1: Unable to find role="button" name /mở menu điều hướng/i
Failure 2: Unable to find role="button" name /Sạp hàng không gian 38/i because the old accessible name was "Sạp hàng không gian38"
Exit code: 1
```

### GREEN

Command:

```powershell
npm test -- src/components/ApplicationShell.test.tsx --run
```

Output summary:

```text
Test Files  1 passed (1)
Tests  3 passed (3)
Duration  4.03s
Exit code: 0
```

## Verification

Focused lint command:

```powershell
npx eslint src/components/Sidebar.tsx src/components/Header.tsx src/components/ApplicationShell.test.tsx
```

Output summary:

```text
No output
Exit code: 0
```

Full Vitest command:

```powershell
npm test -- --run
```

Output summary:

```text
Test Files  8 passed (8)
Tests  47 passed (47)
Duration  4.17s
Exit code: 0
```

TypeScript check command:

```powershell
npx tsc --noEmit
```

Output summary:

```text
No output
Exit code: 0
```

Diff check command:

```powershell
git diff --check -- src/components/Sidebar.tsx src/components/Header.tsx src/app/page.tsx src/components/ApplicationShell.test.tsx
```

Output summary:

```text
Exit code: 0
Warnings only: Git reports LF will be replaced by CRLF the next time it touches the four task files.
No whitespace errors.
```

Additional diagnostic:

```powershell
npx eslint src/app/page.tsx
```

Output summary:

```text
Exit code: 1
Existing page-level lint debt remains: unused imports, no-explicit-any, and React Compiler preserve-manual-memoization diagnostics around existing map data memoization.
The focused lint command required by Task 2 passes.
```

## Commit

- Commit SHA: generated after this report is staged; final SHA is returned in the task response because a Git commit cannot contain a literal self SHA without changing that SHA.

## Concerns

- The worktree still contains many unrelated untracked project files that predate this task. I staged only the four task files and this report.
- `src/app/page.tsx` has broader pre-existing lint debt outside Task 2's focused lint command. I did not refactor it because the task explicitly limited scope to responsive shell behavior and preserving map/data logic.

## Review Fix — 2026-09-03

### Findings addressed

- P1: Closed mobile sidebar controls were still in the DOM and accessibility tree. Fixed by rendering a desktop sidebar separately from the mobile off-canvas panel and rendering the mobile scrim/panel only while open.
- P2: Header mobile menu button could say `Đóng menu điều hướng` while the page handler only opened the menu. Fixed by adding a truthful toggle prop and wiring the page to toggle open/closed.
- P2: Urgent notification ping used unconditional `animate-ping`. Fixed by changing the animated marker to `motion-safe:animate-ping`.

### Covering RED

Command:

```powershell
npm test -- src/components/ApplicationShell.test.tsx --run
```

Output summary:

```text
Test Files  1 failed (1)
Tests  3 failed | 2 passed (5)
Failure 1: expected urgent ping marker with data-urgent-ping="motion" to exist.
Failure 2: closed Sidebar still exposed multiple role="button" controls named /Đóng menu điều hướng/i.
Failure 3: expanded Header menu trigger did not call onToggleMobileMenu.
Exit code: 1
```

### Covering GREEN

Command:

```powershell
npm test -- src/components/ApplicationShell.test.tsx --run
```

Output summary:

```text
Test Files  1 passed (1)
Tests  5 passed (5)
Duration  1.72s
Exit code: 0
```

### Re-run verification

Full Vitest:

```powershell
npm test -- --run
```

```text
Test Files  8 passed (8)
Tests  49 passed (49)
Duration  4.06s
Exit code: 0
```

Focused ESLint:

```powershell
npx eslint src/components/Sidebar.tsx src/components/Header.tsx src/components/ApplicationShell.test.tsx
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
Warnings only: Git reports LF will be replaced by CRLF the next time it touches the four changed source/test files.
No whitespace errors.
```

### Review fix commit

- Review fix commit SHA: generated after this report update is staged; final SHA is returned in the task response.
