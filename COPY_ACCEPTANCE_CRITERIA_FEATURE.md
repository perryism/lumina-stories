# Copy Acceptance Criteria to Following Chapters Feature

## Overview
This feature adds a checkbox that allows users to copy acceptance criteria from one chapter to all following chapters in the story. This is useful when users want to apply the same quality standards or requirements across multiple chapters.

## Changes Made

### ManualChapterGenerator Component (`components/ManualChapterGenerator.tsx`)

**Added a checkbox below the acceptance criteria textarea:**

- The checkbox only appears when:
  - The chapter is not the last chapter (there are following chapters to copy to)
  - The chapter has acceptance criteria text entered
  - The acceptance criteria is not empty/whitespace only

- When the checkbox is checked:
  - The current chapter's acceptance criteria is copied to all following chapters
  - The copy operation happens immediately via the `onUpdateChapter` callback
  - The number of chapters that will be affected is shown in the label

**Key UI Features:**
- Checkbox appears below the acceptance criteria textarea with a subtle border separator
- Label shows: "Copy these acceptance criteria to all following chapters (X chapter[s])"
- The checkbox is disabled when generation is in progress
- Hover effect on the label for better UX
- Checkbox is unchecked by default (one-time action)

## Implementation Details

### Location in Code
The checkbox is added in the "Acceptance Criteria for pending/next chapters" section (lines 275-307):

```tsx
{/* Checkbox to copy acceptance criteria to following chapters */}
{index < chapters.length - 1 && chapter.acceptanceCriteria && chapter.acceptanceCriteria.trim() && (
  <div className="mt-3 pt-3 border-t border-slate-200">
    <label className="flex items-start gap-2 cursor-pointer group">
      <input
        type="checkbox"
        className="mt-0.5 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer"
        disabled={isGenerating}
        onChange={(e) => {
          if (e.target.checked && chapter.acceptanceCriteria) {
            // Copy acceptance criteria to all following chapters
            updatedChapters.forEach((ch, i) => {
              if (i > index) {
                onUpdateChapter(i, 'acceptanceCriteria', chapter.acceptanceCriteria || '');
              }
            });
          }
        }}
      />
      <span className="text-xs text-slate-600 group-hover:text-slate-800 select-none">
        Copy these acceptance criteria to all following chapters ({chapters.length - index - 1} chapter{chapters.length - index - 1 !== 1 ? 's' : ''})
      </span>
    </label>
  </div>
)}
```

### Behavior
1. **Visibility**: The checkbox only shows when there are following chapters and acceptance criteria is entered
2. **Action**: Checking the checkbox immediately copies the criteria to all following chapters
3. **Scope**: Only affects chapters that come after the current chapter (index + 1 to end)
4. **State**: The checkbox doesn't maintain checked state - it's a one-time action trigger
5. **Disabled State**: The checkbox is disabled during chapter generation to prevent conflicts

## User Flow

### In Manual Chapter Generation Mode:
1. User enters acceptance criteria for a chapter (e.g., Chapter 1)
2. A checkbox appears below the textarea: "Copy these acceptance criteria to all following chapters (X chapters)"
3. User checks the checkbox
4. The acceptance criteria is immediately copied to all chapters after the current one
5. User can verify by expanding other chapters to see the copied criteria
6. User can still edit individual chapter criteria after copying

## Benefits

✅ **Time Saving**: Users don't need to manually copy-paste criteria to each chapter
✅ **Consistency**: Ensures the same standards are applied across multiple chapters
✅ **Flexibility**: Users can still customize individual chapters after copying
✅ **Clear Feedback**: Shows exactly how many chapters will be affected
✅ **Non-Intrusive**: Only appears when relevant (has criteria and has following chapters)
✅ **Safe**: Disabled during generation to prevent conflicts

## Use Cases

1. **Consistent Tone**: Apply "Maintain suspenseful tone" to all chapters
2. **Character Development**: Apply "Show character growth" to multiple chapters
3. **Plot Requirements**: Apply "Include foreshadowing" to several chapters
4. **Quality Standards**: Apply "Include dialogue and action balance" to all chapters
5. **Theme Consistency**: Apply "Explore themes of friendship and loyalty" across the story

## Files Modified

1. **components/ManualChapterGenerator.tsx**
   - Added conditional checkbox rendering (lines 275-307)
   - Checkbox appears below acceptance criteria textarea
   - Implements copy logic using `onUpdateChapter` callback
   - Shows dynamic count of affected chapters
   - Includes proper styling and hover effects

## Testing

To test the feature:

1. **Start a new story** or load an existing one
2. **Go to Manual Chapter Generation mode** (One by One)
3. **Enter acceptance criteria** for the first chapter
4. **Verify the checkbox appears** below the textarea
5. **Check the checkbox** and verify it copies to following chapters
6. **Expand other chapters** to confirm the criteria was copied
7. **Edit individual chapters** to verify they can still be customized
8. **Test with last chapter** - checkbox should not appear
9. **Test with empty criteria** - checkbox should not appear

## Technical Notes

- The checkbox uses the existing `onUpdateChapter` callback, so no new props or state management needed
- The implementation is efficient - it only updates chapters that need to be updated
- The feature integrates seamlessly with the existing UI design
- No changes to the data model or API were required
- The feature works with the existing validation and generation flow

## Future Enhancements

Possible future improvements:
- Add an "undo" button to revert the copy operation
- Allow selective copying (choose which chapters to copy to)
- Add a "copy from another chapter" dropdown
- Show a toast notification when criteria is copied
- Add keyboard shortcut for quick copying

