# Chapter Revision Undo Feature

## Overview
This feature allows users to undo chapter revisions and restore previous versions of a chapter. When a user regenerates a chapter with feedback, the original version is saved to a revision history, allowing them to revert if they don't like the new version.

## How It Works

### 1. Revision History Storage
When a chapter is regenerated:
- The current chapter content and detailed summary are saved to a `revisionHistory` array
- Each revision includes:
  - `content`: The full chapter text
  - `detailedSummary`: The detailed summary (if available)
  - `timestamp`: When the revision was created
  - `feedback`: The user feedback that led to this revision

### 2. User Interface
In the StoryViewer component:
- After regenerating a chapter, an "Undo Last Revision" button appears
- The button shows how many previous versions are available
- Clicking the button restores the most recent previous version
- Users can undo multiple times to go back through the revision history

### 3. Data Persistence
- Revision history is automatically saved to YAML files
- When loading a story, all revision history is restored
- The feature is backward compatible - stories without revision history work normally

## Implementation Details

### Data Structure (types.ts)
```typescript
export interface ChapterVersion {
  content: string;
  detailedSummary?: string;
  timestamp: number;
  feedback?: string;
}

export interface Chapter {
  // ... existing fields
  revisionHistory?: ChapterVersion[];
}
```

### Key Functions

#### App.tsx
- `handleRegenerateChapter`: Saves current version before regenerating
- `handleUndoRevision`: Restores the most recent previous version

#### StoryViewer.tsx
- Displays the undo button when revision history exists
- Shows the count of available versions

#### libraryService.ts
- `storyToYAML`: Exports revision history to YAML format
- `parseYAMLStory`: Imports revision history from YAML files

## Usage Example

1. User generates a chapter
2. User clicks "Regenerate This Chapter" and provides feedback
3. Original chapter is saved to revision history
4. New chapter is generated based on feedback
5. If user doesn't like the new version, they click "Undo Last Revision"
6. Original chapter is restored
7. User can undo again if they had made multiple revisions

## Benefits

- **Safety**: Users can experiment with revisions without fear of losing good content
- **Flexibility**: Multiple undo levels allow exploring different directions
- **Transparency**: Users can see how many versions are available
- **Persistence**: Revision history is saved with the story

## Technical Notes

- Revision history is stored in chronological order (oldest to newest)
- Undo removes the most recent version from history and restores it as current
- There's no limit on the number of revisions stored
- Each revision includes the feedback that prompted it, providing context
- The feature integrates seamlessly with the existing auto-save functionality

