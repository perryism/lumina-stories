# Chapter Content Editing in Manual Chapter Generator

## Overview

Users can now directly edit the generated chapter content in the **Manual Chapter Generator** screen, right after a chapter is generated. This allows for quick refinements without needing to switch to the Story Viewer.

## How It Works

### Accessing the Editor

1. Generate a chapter in the **Manual Chapter Generator** screen
2. Once the chapter is completed (green checkmark), click **"Show Content"** to expand the chapter
3. An **"Edit Content"** button will appear next to the "Show Content" toggle
4. Click **"Edit Content"** to enter edit mode

### Editing Content

1. The chapter content will be displayed in a large, editable textarea
2. Make your changes directly in the textarea
3. Click **"Save Changes"** to save your edits
4. Click **"Cancel"** to discard your changes and return to view mode

### Features

- **Large editing area**: 400px minimum height textarea for comfortable editing
- **Serif font**: Uses a serif font in the editor for a more readable writing experience
- **Auto-save to revision history**: When you save edits, the previous version is automatically saved to the chapter's revision history
- **Disabled during generation**: The edit button is disabled while a chapter is being generated to prevent conflicts

## Benefits

### Quick Edits
Make small tweaks immediately after generation without switching screens.

### Inline Workflow
Stay in the generation flow while refining content.

### Revision History
All edits are tracked in the chapter's revision history, allowing you to undo changes later in the Story Viewer.

## Technical Details

### State Management

The edited content is stored temporarily in component state during editing:

```typescript
const [editingChapterContent, setEditingChapterContent] = useState<number | null>(null);
const [editedContent, setEditedContent] = useState<{ [key: number]: string }>({});
```

When saved, it uses the `handleUpdateChapterContent` function which:
- Saves the current version to revision history
- Updates the chapter content
- Marks the change as "Manual edit" in the revision history

### Revision History Structure

```typescript
interface ChapterVersion {
  content: string;
  detailedSummary?: string;
  timestamp: number;
  feedback?: string; // Set to "Manual edit" for user edits
}
```

### Component Changes

**ManualChapterGenerator.tsx:**
- Added `onUpdateChapterContent` prop (optional)
- Added editing state management
- Added edit mode UI with textarea
- Added "Edit Content" button in view mode
- Uses `onUpdateChapterContent` when available (saves revision history), falls back to `onUpdateChapter` otherwise

**App.tsx:**
- Passed `handleUpdateChapterContent` to ManualChapterGenerator component

## Use Cases

### 1. Fix Typos or Grammar
Quickly correct any errors in the generated text.

### 2. Adjust Tone or Style
Refine the writing style to better match your vision.

### 3. Add Details
Insert additional descriptions or dialogue that the AI missed.

### 4. Remove Content
Delete sections that don't fit the narrative.

### 5. Rephrase Sentences
Improve clarity or flow of specific passages.

## Comparison with Story Viewer Editing

| Feature | Manual Generator | Story Viewer |
|---------|-----------------|--------------|
| **When to use** | Right after generation | Reviewing completed story |
| **Context** | Single chapter focus | Full story context |
| **Navigation** | Inline with generation | Dedicated reading interface |
| **Revision history** | ✅ Yes | ✅ Yes |
| **Undo support** | ✅ Yes (via Story Viewer) | ✅ Yes |

## Best Practices

### 1. Edit After Generation
Make edits right after generating a chapter while the context is fresh in your mind.

### 2. Small Changes
Use this for quick fixes and refinements. For major rewrites, consider using the "Revise This Chapter" feature instead.

### 3. Review Before Continuing
After editing, review the content to ensure it flows well before generating the next chapter.

### 4. Save Your Story
Remember to save your story after making edits to preserve your changes.

## Limitations

- Cannot edit chapters that are currently being generated
- Edit mode shows the full content in a textarea (not formatted paragraphs)
- Changes are saved immediately when you click "Save Changes" (no auto-save during editing)

## Future Enhancements

Potential future features:
- Rich text editing with formatting options
- Spell check and grammar suggestions
- Word count display during editing
- Auto-save drafts while editing
- Side-by-side comparison with original version

