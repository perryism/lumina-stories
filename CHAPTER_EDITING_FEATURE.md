# Chapter Content Editing Feature

## Overview

Users can now directly edit the generated chapter content in the Story Viewer. This allows for manual refinements, corrections, or creative adjustments without needing to regenerate the entire chapter.

## How It Works

### Accessing the Editor

1. Navigate to the **Story Viewer** (click "View Story" from the chapter generation screen)
2. Select the chapter you want to edit from the sidebar
3. Click the **"Edit Chapter Content"** button below the chapter text
4. The chapter will switch to edit mode with a large text area

### Editing Content

- The text area displays the full chapter content
- Each paragraph should be on a new line (separated by line breaks)
- Make any changes you want to the text
- The "Save Changes" button will be disabled if no changes have been made

### Saving Changes

1. Click **"Save Changes"** to apply your edits
2. The chapter will return to read mode with your updated content
3. Your changes are automatically saved to the story state
4. The original version is preserved in the revision history

### Canceling Edits

- Click **"Cancel"** to discard your changes and return to read mode
- If you switch to another chapter while editing, your changes will be automatically saved

## Features

### Revision History

- Every time you edit a chapter, the previous version is saved to the revision history
- You can undo edits using the "Undo Last Revision" button
- The revision history tracks:
  - Previous content
  - Previous detailed summary
  - Timestamp of the edit
  - Feedback/reason for the change (marked as "Manual edit")

### Auto-Save on Chapter Switch

- If you're editing a chapter and switch to another chapter, your changes are automatically saved
- This prevents accidental loss of edits

### Edit Mode Indicators

- A blue information banner appears at the top of the editor
- The banner explains how to use the editor
- The "Save Changes" button is only enabled when changes have been made

## Use Cases

### 1. Quick Fixes
Fix typos, grammar issues, or awkward phrasing without regenerating the entire chapter.

**Example:**
- Original: "The hero walked to the castle and he saw the dragon."
- Edited: "The hero approached the castle and spotted the dragon in the distance."

### 2. Adding Details
Enhance descriptions or add missing details that the AI didn't include.

**Example:**
Add sensory details like sounds, smells, or textures to make scenes more vivid.

### 3. Adjusting Dialogue
Refine character dialogue to better match their voice or personality.

**Example:**
Make a character's speech more formal, casual, or add dialect-specific phrases.

### 4. Pacing Adjustments
Expand or condense sections to improve story pacing.

**Example:**
- Expand an action scene that feels rushed
- Condense exposition that feels too long

### 5. Continuity Fixes
Correct inconsistencies with previous chapters or character details.

**Example:**
Fix a character's eye color if it was mentioned differently in an earlier chapter.

### 6. Creative Refinements
Add your own creative touches, metaphors, or stylistic elements.

**Example:**
Add a recurring motif or symbol that ties chapters together.

## Technical Details

### State Management

The edited content is stored in the chapter's `content` field in the story state:

```typescript
interface Chapter {
  id: number;
  title: string;
  summary: string;
  content?: string; // Updated when user edits
  revisionHistory?: ChapterVersion[]; // Previous versions stored here
  // ... other fields
}
```

### Revision History Structure

```typescript
interface ChapterVersion {
  content: string;
  detailedSummary?: string;
  timestamp: number;
  feedback?: string; // Set to "Manual edit" for user edits
}
```

### Component Flow

1. **StoryViewer.tsx**: Displays the chapter and provides the edit interface
2. **App.tsx**: Handles the `handleUpdateChapterContent` function
3. **State Update**: Updates the chapter content and adds to revision history
4. **Auto-Save**: Changes persist through the existing save mechanism

## Limitations

- Editing does not regenerate the detailed summary automatically
- The AI won't be aware of manual edits when generating future chapters (unless you regenerate the detailed summary)
- Very large chapters may be harder to edit in a single text area

## Best Practices

### 1. Edit After Generation
Generate the chapter first, then make targeted edits rather than writing from scratch.

### 2. Preserve Paragraph Structure
Keep each paragraph on its own line for proper formatting in read mode.

### 3. Save Frequently
While there's auto-save on chapter switch, it's good practice to save after major edits.

### 4. Use Revision History
Don't be afraid to experiment - you can always undo changes.

### 5. Combine with Regeneration
For major changes, use the "Regenerate" feature with feedback. For minor tweaks, use the editor.

## Future Enhancements

Potential improvements for this feature:

- **Rich Text Editor**: Add formatting options (bold, italic, etc.)
- **Word Count**: Display word count while editing
- **Spell Check**: Integrate spell checking
- **Auto-Summary**: Regenerate detailed summary after manual edits
- **Track Changes**: Show what was changed from the original
- **Multiple Undo Levels**: Navigate through multiple revisions
- **Compare Versions**: Side-by-side comparison of versions
- **Export Edits**: Export just the changes made

## Troubleshooting

**Changes not saving?**
- Make sure you clicked "Save Changes" before switching chapters
- Check that the "Save Changes" button was enabled (not grayed out)
- Verify your browser's localStorage is enabled

**Lost my edits?**
- Check the revision history using "Undo Last Revision"
- The previous version should be available

**Can't edit a chapter?**
- Make sure the chapter has been generated (status: 'completed')
- Ensure you're in the Story Viewer, not the chapter generation screen
- Check that the chapter has content

**Edit button not showing?**
- The edit button only appears when `onUpdateChapterContent` is provided
- Make sure you're viewing a completed chapter with content

