# Refresh And Live Detail Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add user-triggered pull-to-refresh on data screens without REST polling.

**Architecture:** `AppScreen` owns the native `RefreshControl` plumbing so individual screens only pass `refreshing` and `onRefresh`. Data screens keep their initial load paths, and later updates are user-triggered by pull-to-refresh. Real-time sync is intentionally deferred to a later WebSocket pass.

**Tech Stack:** Expo Router, React Native `RefreshControl`, TypeScript, existing lightweight Node/ts-node test style.

---

### Task 1: Refresh Contract

**Files:**
- Test: `src/components/appScreenRefresh.test.cjs`
- Modify: `src/components/AppScreen.tsx`

- [ ] **Step 1: Write the failing test**

```js
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..", "..");
const appScreenPath = path.join(root, "src", "components", "AppScreen.tsx");
const source = fs.readFileSync(appScreenPath, "utf8");

assert.match(source, /RefreshControl/, "AppScreen imports and uses React Native RefreshControl");
assert.match(source, /refreshing\?: boolean/, "AppScreen accepts a refreshing prop");
assert.match(source, /onRefresh\?: \(\) => void/, "AppScreen accepts an onRefresh prop");
assert.match(source, /refreshControl=\{[\s\S]*<RefreshControl/, "AppScreen wires RefreshControl into ScrollView");
assert.match(source, /onRefresh \?/, "AppScreen only creates RefreshControl when a refresh callback exists");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node src/components/appScreenRefresh.test.cjs`

Expected: fail because `RefreshControl`, `refreshing`, and `onRefresh` are not implemented.

- [ ] **Step 3: Implement minimal AppScreen refresh support**

Add `RefreshControl` to the React Native import, add `refreshing?: boolean` and `onRefresh?: () => void` props, destructure them, and pass a `refreshControl` to the `ScrollView` only when `onRefresh` is provided.

- [ ] **Step 4: Run test to verify it passes**

Run: `node src/components/appScreenRefresh.test.cjs`

Expected: pass.

### Task 2: Screen Refresh Wiring

**Files:**
- Test: `src/appointments/screenRefreshWiring.test.cjs`
- Modify: `app/index.tsx`
- Modify: `app/invites/index.tsx`
- Modify: `app/appointments/calendar.tsx`
- Modify: `app/appointments/next.tsx`
- Modify: `app/appointments/[id].tsx`

- [ ] **Step 1: Write the failing test**

```js
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..", "..");
const files = [
  "app/index.tsx",
  "app/invites/index.tsx",
  "app/appointments/calendar.tsx",
  "app/appointments/next.tsx",
  "app/appointments/[id].tsx"
];

for (const file of files) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  assert.match(source, /refreshing=\{/, `${file} passes refreshing to AppScreen`);
  assert.match(source, /onRefresh=\{/, `${file} passes onRefresh to AppScreen`);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node src/appointments/screenRefreshWiring.test.cjs`

Expected: fail because screens do not pass refresh props yet.

- [ ] **Step 3: Wire each data screen**

Refactor each screen's existing load logic into `useCallback` functions and pass `refreshing` plus `onRefresh` to `AppScreen`. Keep initial loading behavior for first load and avoid wiping existing data during manual refresh.

- [ ] **Step 4: Run test to verify it passes**

Run: `node src/appointments/screenRefreshWiring.test.cjs`

Expected: pass.

### Task 3: Detail Manual Refresh Only

**Files:**
- Test: `src/appointments/liveAppointmentManualRefreshOnly.test.cjs`
- Modify: `app/appointments/[id].tsx`

- [ ] **Step 1: Write the failing test**

```js
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..", "..");
const detailPath = path.join(root, "app", "appointments", "[id].tsx");
const source = fs.readFileSync(detailPath, "utf8");

assert.doesNotMatch(source, /DETAIL_REFRESH_INTERVAL_MS/, "detail screen does not keep a polling interval constant");
assert.doesNotMatch(source, /setInterval\(\(\) => \{[\s\S]*loadAppointment\(\{ silent: true \}\)/, "detail screen does not poll appointment data");
assert.doesNotMatch(source, /clearInterval\(timer\)/, "detail screen has no polling cleanup left behind");
assert.match(source, /refreshing=\{refreshing\}/, "detail screen keeps pull-to-refresh state wired");
assert.match(source, /onRefresh=\{refreshAppointment\}/, "detail screen keeps manual refresh wired");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node src/appointments/liveAppointmentManualRefreshOnly.test.cjs`

Expected: fail while any detail polling code remains.

- [ ] **Step 3: Remove bounded polling**

Remove `useFocusEffect`, `DETAIL_REFRESH_INTERVAL_MS`, and the interval cleanup block from the appointment detail screen. Keep the manual `refreshAppointment` callback wired to `AppScreen`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node src/appointments/liveAppointmentManualRefreshOnly.test.cjs`

Expected: pass.

### Task 4: Verification

**Files:**
- Existing source and tests above.

- [ ] **Step 1: Run targeted tests**

Run:
```powershell
node src/components/appScreenRefresh.test.cjs
node src/appointments/screenRefreshWiring.test.cjs
node src/appointments/liveAppointmentManualRefreshOnly.test.cjs
```

Expected: all exit 0.

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`

Expected: exit 0 or report pre-existing unrelated issues clearly.
