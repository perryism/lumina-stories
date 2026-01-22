# Editable Acceptance Criteria During Revision

## Overview
This feature allows users to edit the acceptance criteria when revising/regenerating a chapter. Previously, users could only provide feedback text during revision, but the acceptance criteria remained fixed. Now, users can update the acceptance criteria along with their revision feedback.

## Changes Made

### 1. StoryViewer Component (`components/StoryViewer.tsx`)
**Updated the revision form to include an editable acceptance criteria field:**

- Added `acceptanceCriteria` state to track the acceptance criteria input
- Updated `onRegenerateChapter` prop signature to accept optional `acceptanceCriteria` parameter
- Added a textarea field for editing acceptance criteria in the revision form
- The field is pre-populated with the current chapter's acceptance criteria when the form opens
- Shows a hint displaying the current acceptance criteria below the textarea
- Clears the acceptance criteria state when the form is closed or submitted

**Key UI Changes:**
- New "Acceptance Criteria (Optional)" textarea in the revision form
- Displays current criteria as a hint: "Current: [first 100 chars]..." or "No acceptance criteria currently set."
- Field is initialized with existing criteria when "Regenerate This Chapter" button is clicked

### 2. ManualChapterGenerator Component (`components/ManualChapterGenerator.tsx`)
**Updated the revision form to include an editable acceptance criteria field:**

- Added `revisionAcceptanceCriteria` state to track acceptance criteria per chapter
- Updated `onRegenerateChapter` prop signature to accept optional `acceptanceCriteria` parameter
- Added a textarea field for editing acceptance criteria in the revision form
- The field is pre-populated with the current chapter's acceptance criteria when the form opens
- Shows a hint displaying the current acceptance criteria below the textarea
- Clears the acceptance criteria state when the form is closed or submitted

**Key UI Changes:**
- New "Acceptance Criteria (Optional)" textarea in the revision form
- Displays current criteria as a hint: "Current: [first 80 chars]..." or "No acceptance criteria currently set."
- Field is initialized with existing criteria when "Revise This Chapter" button is clicked

### 3. App Component (`App.tsx`)
**Updated the regeneration handler to accept and apply acceptance criteria:**

- Updated `handleRegenerateChapter` signature to accept optional `acceptanceCriteria` parameter
- When acceptance criteria is provided, it updates the chapter's `acceptanceCriteria` field before regeneration
- If no acceptance criteria is provided (undefined), the existing criteria is preserved
- Added logging to track when acceptance criteria is updated during regeneration

**Logic:**
```typescript
acceptanceCriteria: acceptanceCriteria !== undefined 
  ? acceptanceCriteria 
  : updatedOutline[chapterIndex].acceptanceCriteria
```

This ensures:
- If user provides new criteria (even empty string), it's used
- If user doesn't provide criteria (undefined), existing criteria is kept
- Automatic retries from validation don't change the criteria

## How It Works

### User Flow in StoryViewer (Read Mode):
1. User clicks "Regenerate This Chapter" button
2. Form opens with:
   - Feedback textarea (required)
   - Acceptance Criteria textarea (optional, pre-filled with current criteria)
3. User can:
   - Modify the acceptance criteria
   - Clear the acceptance criteria (empty string)
   - Leave it unchanged
4. User submits the form
5. Chapter is regenerated with:
   - User's feedback
   - Updated acceptance criteria (or existing if not changed)

### User Flow in ManualChapterGenerator (Edit Mode):
1. User clicks "Revise This Chapter" button on a completed chapter
2. Form opens with:
   - Revision Instructions textarea (required)
   - Acceptance Criteria textarea (optional, pre-filled with current criteria)
3. User can:
   - Modify the acceptance criteria
   - Clear the acceptance criteria (empty string)
   - Leave it unchanged
4. User submits the form
5. Chapter is regenerated with:
   - User's revision instructions
   - Updated acceptance criteria (or existing if not changed)

## Benefits

✅ **Flexible Revision**: Users can adjust acceptance criteria based on what they learned from the first generation
✅ **Iterative Refinement**: Allows users to refine criteria as the story evolves
✅ **Clear Visibility**: Shows current criteria so users know what to modify
✅ **Optional Field**: Users can ignore it if they just want to provide feedback
✅ **Preserves Existing**: If not edited, existing criteria is maintained
✅ **Works Everywhere**: Available in both StoryViewer (read mode) and ManualChapterGenerator (edit mode)

## Files Modified

1. **components/StoryViewer.tsx**
   - Updated `StoryViewerProps` interface
   - Added `acceptanceCriteria` state
   - Updated `handleSubmitFeedback` to pass acceptance criteria
   - Updated `handleChapterChange` to clear acceptance criteria
   - Added acceptance criteria textarea to revision form
   - Initialize acceptance criteria when form opens

2. **components/ManualChapterGenerator.tsx**
   - Updated `ManualChapterGeneratorProps` interface
   - Added `revisionAcceptanceCriteria` state
   - Updated regenerate button click handler to pass acceptance criteria
   - Updated cancel button to clear acceptance criteria
   - Added acceptance criteria textarea to revision form
   - Initialize acceptance criteria when form opens

3. **App.tsx**
   - Updated `handleRegenerateChapter` signature
   - Added logic to update acceptance criteria when provided
   - Added logging for acceptance criteria updates

## Testing

To test the feature:

1. **In StoryViewer (Read Mode):**
   - Generate a story with multiple chapters
   - Go to StoryViewer (read mode)
   - Click "Regenerate This Chapter"
   - Verify the acceptance criteria field shows current criteria
   - Modify the acceptance criteria
   - Submit and verify the chapter is regenerated with new criteria

2. **In ManualChapterGenerator (Edit Mode):**
   - Generate a story with multiple chapters
   - Stay in manual generation mode
   - Click "Revise This Chapter" on a completed chapter
   - Verify the acceptance criteria field shows current criteria
   - Modify the acceptance criteria
   - Submit and verify the chapter is regenerated with new criteria

3. **Edge Cases:**
   - Test with no existing acceptance criteria
   - Test clearing acceptance criteria (empty string)
   - Test leaving acceptance criteria unchanged
   - Test canceling the form (should not change anything)

