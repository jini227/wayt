# Saved Place Editing Design

## Goal

Improve the `내 장소` screen so saved place names are readable by default, editable only on request, and not hidden immediately by the keyboard. Also make newly saved long addresses receive a shorter default label.

## Chosen Approach

Use inline row editing. Each row shows the saved place label, a small `수정` action, the raw address, and the usage status. Pressing `수정` switches only that row into edit mode with a text input, a clear `X` button, `취소`, and `저장`.

This keeps the context visible, avoids opening the keyboard during normal row taps, and matches the user's preferred layout.

## Behavior

- Read mode:
  - Show star, label, small `수정` button, address, and usage status.
  - Do not render a focusable label input.
- Edit mode:
  - Show a label input for the active row only.
  - Show an `X` icon button inside the edit controls that clears the whole draft.
  - Disable save when the draft is blank, unchanged, or the row is already saving.
  - Close edit mode after a successful save.
  - Leave favorite toggling available outside the input.
- Keyboard:
  - Enable keyboard avoidance for the screen's scroll area.
  - Since inputs only appear after pressing `수정`, normal scrolling and row taps no longer summon the keyboard.
- New saved place labels:
  - Normalize address whitespace.
  - For short addresses, keep the full address.
  - For long addresses with enough space-separated parts, remove the final two parts for the initial label.
  - Keep labels inside the backend label limit.

## Files

- `app/places.tsx`: row editing UI and screen keyboard behavior.
- `app/appointments/new.tsx`: use the shorter default label when saving the selected place.
- `src/places/savedPlaceEditing.ts`: shared helper for default labels and existing edit request helpers.
- `src/places/savedPlaceEditing.test.ts`: regression tests for default label shortening and save rules.

## Testing

Run the saved place editing checks directly and run TypeScript checking:

- `$env:TS_NODE_COMPILER_OPTIONS='{"module":"CommonJS"}'; npx ts-node src/places/savedPlaceEditing.test.ts`
- `node src/places/placesScreenEditing.test.cjs`
- `npm run typecheck`
