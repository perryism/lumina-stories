# Library Feature Documentation

## Overview
The Library feature allows you to save your story progress and return to it later. Stories are automatically saved as you work, and you can manually save at any time using the "Save Progress" button.

## Features

### Auto-Save
- Stories are automatically saved 2 seconds after any change
- Saves include all story data: title, genre, characters, outline, chapters, and foreshadowing notes
- Auto-save only activates once you have a title and outline

### Manual Save
You can manually save your story at any time by clicking the "Save Progress" button available in:
- **Outline Editor**: Top right corner, next to "One by One" and "Write All" buttons
- **Automatic Chapter Generation**: Bottom center, below the chapter progress list
- **Manual Chapter Generator**: In the right sidebar action panel, always visible
- **Story Viewer**: In the sidebar, above the "Export to Text" button

### Library Browser
Access your saved stories by clicking "Library" in the top navigation menu.

#### Library Features:
- **View all saved stories** with progress indicators
- **Sort stories** by:
  - Most Recent (default)
  - Title (A-Z)
  - Progress (completion percentage)
- **Filter stories** by:
  - All Stories
  - In Progress (1-99% complete)
  - Completed (100% complete)
- **Load a story** to continue working on it
- **Export stories** as JSON files for backup
- **Import stories** from JSON files
- **Delete stories** you no longer need

### Story Information
Each saved story displays:
- Title
- Genre and reading level
- Number of completed chapters vs. total chapters
- Progress bar showing completion percentage
- Last modified timestamp

## How to Use

### Saving Your Story
1. Start creating a story as usual
2. The story will auto-save after you generate the outline
3. You can also click "Save Progress" at any time to manually save
4. A confirmation message will appear when manually saving

### Loading a Story
1. Click "Library" in the top navigation
2. Browse your saved stories
3. Click "Load Story" on the story you want to continue
4. The story will load at the exact state you left it

### Exporting a Story
1. Open the Library
2. Find the story you want to export
3. Click the "📤 Export" button
4. A JSON file will be downloaded to your computer
5. Keep this file as a backup or to share with others

### Importing a Story
1. Open the Library
2. Click "📥 Import Story" at the top
3. Select a previously exported JSON file
4. The story will be added to your library

### Deleting a Story
1. Open the Library
2. Find the story you want to delete
3. Click the "🗑️ Delete" button
4. Confirm the deletion (this cannot be undone)

## Storage

### Local Storage
- Stories are saved in your browser's localStorage
- Data persists even after closing the browser
- Each story is stored with a unique ID
- Storage is limited by your browser (typically 5-10MB)

### Data Included in Each Save
- Story title, genre, and reading level
- All characters with their attributes
- Complete chapter outline with summaries
- Generated chapter content
- Chapter status (pending, generating, completed)
- Foreshadowing notes
- System prompts and custom settings
- Timestamps (created and last modified)

## Tips

1. **Regular Backups**: Export important stories regularly as JSON files
2. **Storage Limits**: If you have many stories, consider exporting and deleting old ones
3. **Browser Data**: Clearing browser data will delete all saved stories
4. **Multiple Devices**: Use export/import to transfer stories between devices
5. **Work in Progress**: You can safely close the browser and return later - your progress is saved

## Technical Details

### File Structure
Exported stories are JSON files containing:
```json
{
  "id": "unique-story-id",
  "state": {
    "title": "Story Title",
    "genre": "Fantasy",
    "numChapters": 5,
    "readingLevel": "young-adult",
    "characters": [...],
    "outline": [...],
    "foreshadowingNotes": [...],
    "currentStep": "outline"
  },
  "savedAt": 1234567890,
  "lastModified": 1234567890,
  "progress": 60
}
```

### Storage Location
- Browser localStorage key: `lumina-stories-library`
- All stories stored in a single array
- Each story has a unique ID for identification

## Troubleshooting

**Story not saving?**
- Check if you have a title and outline
- Ensure browser localStorage is enabled
- Check browser console for errors

**Can't load a story?**
- Verify the story exists in the library
- Try refreshing the page
- Check if browser data was cleared

**Import failed?**
- Ensure the file is a valid JSON export
- Check that the file wasn't corrupted
- Verify it's a Lumina Stories export file

**Storage full?**
- Export and delete old stories
- Clear browser cache (will delete all stories)
- Use export/import to manage storage

