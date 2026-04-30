# Saved Place Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make saved place names edit only on demand and shorten long default labels when a place is first saved.

**Architecture:** Keep persistence in the existing screens and put reusable label rules in `src/places/savedPlaceEditing.ts`. `app/places.tsx` owns row edit state and delegates validation/request shaping to the shared helper.

**Tech Stack:** Expo Router, React Native, TypeScript, local assertion-based tests.

---

### Task 1: Default Saved Place Label Helper

**Files:**
- Modify: `src/places/savedPlaceEditing.ts`
- Test: `src/places/savedPlaceEditing.test.ts`
- Modify: `app/appointments/new.tsx`

- [ ] **Step 1: Write the failing test**

Add assertions to `src/places/savedPlaceEditing.test.ts` for `defaultSavedPlaceLabel`:

```ts
assertEqual(
  defaultSavedPlaceLabel("경기도 수원시 팔달구 화서동 수성로232번길 7 래미안아파트"),
  "경기도 수원시 팔달구 화서동 수성로232번길",
  "long address default labels drop the final two address parts"
);
assertEqual(
  defaultSavedPlaceLabel("경기도 의왕시 내손동 743-1"),
  "경기도 의왕시 내손동 743-1",
  "short address default labels keep the full address"
);
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `$env:TS_NODE_COMPILER_OPTIONS='{"module":"CommonJS"}'; npx ts-node src/places/savedPlaceEditing.test.ts`

Expected: FAIL because `defaultSavedPlaceLabel` is not exported.

- [ ] **Step 3: Implement the helper**

Add `defaultSavedPlaceLabel(address: string)` that normalizes whitespace, keeps short addresses, drops the final two tokens for long addresses with at least five tokens, and clamps to `SAVED_PLACE_LABEL_MAX_LENGTH`.

- [ ] **Step 4: Use the helper when creating a saved place**

In `app/appointments/new.tsx`, import `defaultSavedPlaceLabel` from `savedPlaceEditing` and send `label: defaultSavedPlaceLabel(selectedPlace.address)` in `handleSaveSelectedPlace`.

- [ ] **Step 5: Verify green**

Run: `$env:TS_NODE_COMPILER_OPTIONS='{"module":"CommonJS"}'; npx ts-node src/places/savedPlaceEditing.test.ts`

Expected: PASS.

### Task 2: My Places Inline Edit UX

**Files:**
- Modify: `app/places.tsx`
- Test: `src/places/savedPlaceEditing.test.ts`

- [ ] **Step 1: Add source-level regression checks**

Add a small CJS screen test to verify `app/places.tsx` includes `editingPlaceId`, a `수정` action, a clear label action, and `keyboardAvoiding`.

- [ ] **Step 2: Run the new check and verify it fails**

Run: `node src/places/placesScreenEditing.test.cjs`

Expected: FAIL until the screen is updated.

- [ ] **Step 3: Implement inline edit mode**

In `app/places.tsx`, add `editingPlaceId`, render read mode with label text and `수정`, render edit mode with `TextInput`, `X`, `취소`, and `저장`, and close edit mode only after successful save.

- [ ] **Step 4: Enable keyboard avoidance**

Pass `keyboardAvoiding` and `keyboardShouldPersistTaps="handled"` to `AppScreen`.

- [ ] **Step 5: Verify screen check and typecheck**

Run: `node src/places/placesScreenEditing.test.cjs`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.
