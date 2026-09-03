# Task 1 report — Token foundation and document metadata

## Changed files

- `src/app/globals.test.ts`: focused render test for the required metadata title and `lang="vi"`.
- `src/app/globals.css`: semantic visual tokens, focus-visible ring, reduced-motion override, and `100dvh` root/body baseline.
- `src/app/layout.tsx`: Vietnamese title/description and document language.

No Shell components, canonical data, routes, geometry, fixtures, or state logic were changed.

## TDD evidence

RED command:

```text
npm test -- src/app/globals.test.ts --run
```

Result before production edits: 1 test failed. Expected assertion received `Create Next App` instead of `Smartmarket — Trung tâm điều hành chợ` (and the current layout used `lang="en"`). The test mocks `next/font/google` only to isolate the layout under Vitest.

GREEN focused command:

```text
npm test -- src/app/globals.test.ts --run
```

Result: 1 test file passed, 1 test passed.

Full test command:

```text
npm test -- --run
```

Result: 7 test files passed, 44 tests passed.

## Quality checks

`npm run lint` was run. It reports 68 existing errors and 68 warnings across the pre-existing application code (136 problems total), including React Compiler/memoization, explicit `any`, hook ordering, and state-in-effect findings. None are in the three changed source files.

`git diff --check` passed with exit code 0.

## Remaining concerns

- Repository-wide lint remains failing due to unrelated pre-existing findings; this task intentionally does not modify Shell/components or broader application behavior.
- The metadata test renders the Next root layout in jsdom and emits no warnings after the focused production change.

## Commit

Commit SHA: 2b7bb1e18d3fc55048d877c948949bc8302c01a4 (implementation commit; this report is recorded in the follow-up report commit)
