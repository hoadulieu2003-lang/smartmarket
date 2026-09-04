# Smartmarket Map Presentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with verification checkpoints.

**Goal:** Recompose the interactive SVG map for fixtures A/B/C into a demo-ready, readable market plan while preserving canonical data and all existing operating flows.

**Architecture:** Add a pure `MapPresentationLayout` adapter that derives curated visual geometry from a `FloorEntity` without mutating it. Update the SVG renderer and `StallGlyph` to consume derived geometry while continuing to pass canonical entities to callbacks. Keep the existing responsive application shell, semantic tokens, and Three.js renderer available.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, SVG, Tailwind CSS 4, Vitest/Testing Library, Playwright.

## Global Constraints

- Keep the canonical Spatial Model v3.2.0, stall IDs/codes, zone IDs, state fields, filters, selection callbacks, quick actions, and Drawer behavior intact.
- Do not write presentation colors, spacing, labels, or demo-only layout values into canonical `FloorEntity`, `ZoneEntity`, or `StallEntity` data.
- Preserve SVG as the production renderer and keep the Three.js path available as a secondary renderer.
- Use existing semantic tokens from `src/app/globals.css`; do not introduce raw per-component hex values.
- Verify 375px, 768px, 1024px, and 1440px widths with no mobile page overflow.
- Honor `prefers-reduced-motion` and keep keyboard focus visible on interactive map entities and controls.
- Work only in `C:\Users\game\Documents\app\Smartmarket.worktrees\ui-refresh`; do not alter the original checkout.

---

### Task 1: Build the pure curated map-layout adapter

**Files:**
- Create: `src/spatial/presentation/mapLayout.ts`
- Create: `src/spatial/presentation/mapLayout.test.ts`
- Reference: `src/spatial/model/types.ts`, `src/spatial/fixtures/index.ts`, `src/data/megaMarketData.ts`

**Interfaces:**
- Consumes: `FloorEntity` from `src/spatial/model/types.ts`.
- Produces:
  - `MapPresentationLayout` with `coordinateSystem`, `boundary`, and geometry maps for `zones`, `stalls`, `aisles`, `gates`, `facilities`, `infrastructures`, and `incidents`.
  - `getMapPresentationLayout(floor: FloorEntity): MapPresentationLayout`.
  - `getPresentationGeometry(layout: MapPresentationLayout, entityId: string, fallback: SpatialGeometry): SpatialGeometry`.

- [ ] **Step 1: Write failing adapter tests**

  Add tests that prove:

  ```ts
  it('covers every canonical stall without mutating the fixture', () => {
    const source = structuredClone(FIXTURE_A_DONG_XUAN);
    const layout = getMapPresentationLayout(source);
    expect(Object.keys(layout.stalls)).toHaveLength(source.stalls.length);
    expect(source).toEqual(FIXTURE_A_DONG_XUAN);
  });

  it('keeps fixture-specific silhouettes while making demo anchors readable', () => {
    const a = getMapPresentationLayout(FIXTURE_A_DONG_XUAN);
    const b = getMapPresentationLayout(FIXTURE_B_L_SHAPED_MARKET);
    const c = getMapPresentationLayout(FIXTURE_C_TWO_BLOCK_BRIDGE_MARKET);
    expect(a.zones.zone_A).toBeDefined();
    expect(b.boundary.vertices.length).toBeGreaterThanOrEqual(6);
    expect(c.aisles.aisle_bridge_skywalk).toBeDefined();
    expect(a.stalls.stall_A12).toBeDefined();
  });

  it('keeps each derived stall inside its derived zone bounds', () => {
    const layout = getMapPresentationLayout(FIXTURE_A_DONG_XUAN);
    Object.entries(layout.stalls).forEach(([stallId, geometry]) => {
      const stall = FIXTURE_A_DONG_XUAN.stalls.find((item) => item.id === stallId);
      const zone = stall && FIXTURE_A_DONG_XUAN.zones.find((item) => item.id === stall.zoneId);
      const zoneGeometry = zone && layout.zones[zone.id];
      expect(geometry.type).toBe('rectangle');
      expect(zoneGeometry?.type).toBe('rectangle');
      if (geometry.type === 'rectangle' && zoneGeometry?.type === 'rectangle') {
        expect(geometry.x).toBeGreaterThanOrEqual(zoneGeometry.x);
        expect(geometry.y).toBeGreaterThanOrEqual(zoneGeometry.y);
        expect(geometry.x + geometry.width).toBeLessThanOrEqual(zoneGeometry.x + zoneGeometry.width);
        expect(geometry.y + geometry.height).toBeLessThanOrEqual(zoneGeometry.y + zoneGeometry.height);
      }
    });
  });
  ```

- [ ] **Step 2: Run the focused test and verify the expected RED failure**

  Run: `npm test -- --run src/spatial/presentation/mapLayout.test.ts`

  Expected: FAIL because `mapLayout.ts` and `getMapPresentationLayout` do not exist yet.

- [ ] **Step 3: Implement the minimal adapter**

  Implement deterministic layout rules:

  - Fixture A (`floor_1`): five zone frames around a north–south spine, with explicit anchors for A12/B03/C11/E08 and a stable row/column reflow for each zone.
  - Fixture B (`floor_ben_thanh_L`): retain the polygon L boundary, reflow each wing into clean bands, and preserve intentional rotated stalls.
  - Fixture C (`floor_two_block_bridge`): retain west/east blocks and the bridge connector, with a margin around the connector.
  - For unknown floors or entities, return canonical geometry unchanged.
  - Never mutate `floor`, its arrays, or nested geometry objects.

- [ ] **Step 4: Run adapter tests and the spatial-model regression suite**

  Run: `npm test -- --run src/spatial/presentation/mapLayout.test.ts src/spatial/model/densityMode.test.ts src/spatial/model/validator.test.ts`

  Expected: PASS with complete stall coverage, fixture silhouette checks, containment checks, and no mutation failures.

- [ ] **Step 5: Commit the adapter**

  ```bash
  git add src/spatial/presentation/mapLayout.ts src/spatial/presentation/mapLayout.test.ts
  git commit -m "feat: add curated spatial presentation layouts"
  ```

### Task 2: Let `StallGlyph` render derived geometry while preserving canonical callbacks

**Files:**
- Modify: `src/spatial/renderer/StallGlyph.tsx`
- Modify: `src/spatial/renderer/StallGlyph.test.tsx`

**Interfaces:**
- Consumes: canonical `stall: StallEntity` plus optional `presentationGeometry?: StallEntity['geometry']`.
- Produces: the same callback contract `onSelect(stall)` and `onHover(stall, isHovered)`; only visual coordinates come from `presentationGeometry`.

- [ ] **Step 1: Write failing tests for visual/canonical separation**

  Add tests asserting that a glyph with an overridden rectangle renders the overridden `x/y/width/height`, while `onSelect` receives the original stall object and its original geometry.

- [ ] **Step 2: Run the focused glyph test and verify RED**

  Run: `npm test -- --run src/spatial/renderer/StallGlyph.test.tsx`

  Expected: FAIL because `presentationGeometry` is not accepted or rendered.

- [ ] **Step 3: Implement the smallest geometry override**

  In `StallGlyph`, compute center, bounds, rotation, base shape, hatch, selection ring, and label positions from `presentationGeometry ?? stall.geometry`. Keep visual tokens, state, labels, `aria-label`, and event callbacks based on the canonical `stall`.

- [ ] **Step 4: Run glyph and renderer tests**

  Run: `npm test -- --run src/spatial/renderer/StallGlyph.test.tsx src/spatial/renderer/SvgSpatialRenderer.test.tsx`

  Expected: PASS with existing operational-state styling unchanged.

- [ ] **Step 5: Commit the glyph boundary**

  ```bash
  git add src/spatial/renderer/StallGlyph.tsx src/spatial/renderer/StallGlyph.test.tsx
  git commit -m "feat: separate stall presentation geometry from domain data"
  ```

### Task 3: Integrate the layout adapter into the SVG renderer

**Files:**
- Modify: `src/spatial/renderer/SvgSpatialRenderer.tsx`
- Modify: `src/spatial/renderer/SvgSpatialRenderer.test.tsx`
- Reference: `src/spatial/renderer/presentationAdapter.ts`

**Interfaces:**
- Consumes: `getMapPresentationLayout(floor)` and `getPresentationGeometry(...)` from Task 1.
- Produces: the same `SvgSpatialRendererProps`, entity callback payloads, layer toggles, focus behavior, pan/zoom behavior, and accessible map controls.

- [ ] **Step 1: Add failing renderer assertions**

  Add tests that render fixture A/B/C and assert:

  - Every canonical stall test id is present once.
  - A selected stall still calls the callback with the canonical entity.
  - Derived zone geometry is used for zone labels and selected-zone camera focus.
  - Boundary/aisle/gate/facility markers remain present after geometry derivation.

- [ ] **Step 2: Run the renderer test and verify RED**

  Run: `npm test -- --run src/spatial/renderer/SvgSpatialRenderer.test.tsx`

  Expected: FAIL on the new derived-geometry assertions before integration.

- [ ] **Step 3: Wire derived geometry into rendering**

  Compute `const layout = getMapPresentationLayout(floor)` once per render. Replace visual reads of `floor.boundary`, `zone.geometry`, `aisle.geometry`, `gate.geometry`, `facility.geometry`, `infra.geometry`, and incident coordinates with `getPresentationGeometry` lookups. Pass `presentationGeometry={layout.stalls[stall.id]}` to `StallGlyph`. Keep `handleClick` and `handleHover` wired to canonical entities.

  Update selected-zone auto-centering to use the derived zone rectangle/polygon bounds. Keep the SVG `viewBox` derived from the layout coordinate system so the reflow fills the canvas without clipping.

- [ ] **Step 4: Run focused renderer and full unit tests**

  Run: `npm test -- --run src/spatial/renderer/SvgSpatialRenderer.test.tsx src/components/MapToolbar.responsive.test.tsx src/components/StallDetailDrawer.test.tsx`

  Then run: `npm test -- --run`

  Expected: all focused tests and the full unit suite pass.

- [ ] **Step 5: Commit renderer integration**

  ```bash
  git add src/spatial/renderer/SvgSpatialRenderer.tsx src/spatial/renderer/SvgSpatialRenderer.test.tsx
  git commit -m "feat: render curated layouts across market fixtures"
  ```

### Task 4: Responsive visual polish and verification

**Files:**
- Modify: `src/app/globals.css` only if a missing map semantic token or responsive helper is required.
- Modify: `src/app/page.tsx` only if the map container needs the derived canvas class or responsive height contract.
- Create/modify: `e2e/smartmarket-map-presentation.spec.ts`
- Update: `.superpowers/sdd/2026-09-03-smartmarket-calm-spatial-operations/progress.md`

**Interfaces:**
- Consumes: the completed SVG renderer and existing application-shell contracts.
- Produces: a responsive demo surface verified at phone, tablet, and desktop widths without changing business workflows.

- [ ] **Step 1: Add failing browser assertions**

  Add Playwright coverage for 390px, 768px, and 1280px that checks the map stays visible, the page has no horizontal overflow, the map toolbar remains operable, and clicking a visible stall opens the existing Drawer.

- [ ] **Step 2: Run the new E2E test and verify RED**

  Run: `$env:PLAYWRIGHT_BASE_URL='http://localhost:3010'; npm run test:e2e -- e2e/smartmarket-map-presentation.spec.ts`

  Expected: FAIL only on the new visual/presentation selectors before final responsive adjustments.

- [ ] **Step 3: Apply minimal responsive styling**

  Use existing semantic tokens and the established shell rules. Keep map controls at least 44px, preserve visible focus rings, avoid page-level horizontal overflow, and apply `prefers-reduced-motion` to any new map transitions. Do not add a bitmap background.

- [ ] **Step 4: Run all verification commands**

  ```powershell
  npm test -- --run
  npx tsc --noEmit
  npm run build
  $env:PLAYWRIGHT_BASE_URL='http://localhost:3010'; npm run test:e2e
  ```

  Also run focused ESLint on changed map files. Record any unrelated pre-existing full-lint debt separately; do not claim full lint clean unless it is clean.

- [ ] **Step 5: Perform visual browser review**

  Inspect fixture A, B, and C at desktop and mobile widths in the existing `http://localhost:3010/` browser tab. Confirm no overlap, readable zone/stall hierarchy, usable pan/zoom, correct Drawer opening, and correct highlighted operational examples.

- [ ] **Step 6: Update progress and commit**

  Record test/build/E2E evidence and known limitations in `progress.md`, then commit:

  ```bash
  git add src/app/globals.css src/app/page.tsx e2e/smartmarket-map-presentation.spec.ts .superpowers/sdd/2026-09-03-smartmarket-calm-spatial-operations/progress.md
  git commit -m "test: verify responsive curated market map"
  ```

## Handoff

After Task 4 passes, use `requesting-code-review`, `design-review`, and `verification-before-completion` before offering merge options. Keep the original checkout untouched and leave the isolated worktree available for the user's inspection.
