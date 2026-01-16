# Save Progress Button Locations

This document shows where the "Save Progress" button appears throughout the Lumina Stories application.

## 📍 Button Locations

### 1. **Outline Editor** (Story Map)
**When:** After generating the story outline, before writing chapters
**Location:** Top right corner, next to "One by One" and "Write All" buttons
**Color:** Green button
**Purpose:** Save your story outline and foreshadowing notes before starting chapter generation

```
┌─────────────────────────────────────────────────────┐
│ Story Map                                           │
│ Fine-tune the narrative beats...                    │
│                                                     │
│                    [Save Progress] [One by One] [Write All] │
└─────────────────────────────────────────────────────┘
```

---

### 2. **Automatic Chapter Generation Page**
**When:** During automatic "Write All" chapter generation
**Location:** Bottom center, below the chapter progress list
**Color:** Green button
**Purpose:** Save your progress while chapters are being generated automatically

```
┌─────────────────────────────────────────────────────┐
│ Your story is being written...                      │
│ ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 40%  │
│                                                     │
│ ✓ Chapter 1: The Beginning                         │
│ ✓ Chapter 2: The Journey                           │
│ ⟳ Chapter 3: The Challenge (Writing...)            │
│ ○ Chapter 4: The Resolution                        │
│ ○ Chapter 5: The End                                │
│                                                     │
│              [Save Progress]                        │
└─────────────────────────────────────────────────────┘
```

---

### 3. **Manual Chapter Generator** (One by One Mode)
**When:** Generating chapters one at a time
**Location:** Right sidebar action panel, always visible below the progress bar
**Color:** Green button
**Purpose:** Save your progress at any time while working on chapters

```
┌─────────────────────────────────────────────────────┐
│ Chapter List                │  Action Panel         │
│                             │  ┌─────────────────┐  │
│ ✓ Chapter 1                 │  │ Progress        │  │
│ ✓ Chapter 2                 │  │ ████░░░░░░ 2/5  │  │
│ → Chapter 3 (Next)          │  │                 │  │
│ ○ Chapter 4                 │  │ [Save Progress] │  │
│ ○ Chapter 5                 │  │                 │  │
│                             │  │ Ready to gen... │  │
│                             │  │ [Generate]      │  │
│                             │  └─────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

### 4. **Story Viewer** (Reader Mode)
**When:** Viewing the completed or in-progress story
**Location:** Left sidebar, above the "Export to Text" button
**Color:** Indigo button
**Purpose:** Save your story after viewing or making regenerations

```
┌─────────────────────────────────────────────────────┐
│ Sidebar          │  Story Content                   │
│ ┌──────────────┐ │                                  │
│ │ Contents     │ │  Chapter 1: The Beginning        │
│ │              │ │                                  │
│ │ 1 Chapter 1  │ │  Once upon a time...             │
│ │ 2 Chapter 2  │ │                                  │
│ │ 3 Chapter 3  │ │                                  │
│ │              │ │                                  │
│ │ [Save Prog.] │ │                                  │
│ │ [Export]     │ │                                  │
│ └──────────────┘ │                                  │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 When to Use Each Button

### Outline Editor
- ✅ After editing chapter titles and summaries
- ✅ After adding/editing foreshadowing notes
- ✅ Before starting chapter generation

### Automatic Generation Page
- ✅ While chapters are being generated (to save partial progress)
- ✅ If you need to close the browser during generation
- ✅ After some chapters complete but before all finish

### Manual Chapter Generator
- ✅ After generating each chapter
- ✅ After editing chapter content
- ✅ Before closing the browser
- ✅ At any point during the writing process

### Story Viewer
- ✅ After regenerating a chapter
- ✅ After reviewing the complete story
- ✅ Before exporting to text

---

## 💡 Tips

1. **Auto-Save is Active**: The app auto-saves 2 seconds after any change, so manual saving is optional
2. **Visual Feedback**: Manual save shows a confirmation alert
3. **No Duplicate Saves**: Saving the same story updates the existing entry
4. **Progress Tracking**: Each save updates the completion percentage
5. **Safe to Close**: You can safely close the browser after saving - your progress is preserved

---

## 🔄 Auto-Save Behavior

The app automatically saves in the background:
- ⏱️ **Trigger**: 2 seconds after any change
- 📝 **What's Saved**: Title, genre, characters, outline, chapters, foreshadowing notes
- 🚫 **When Disabled**: Only activates after you have a title and outline
- 🔕 **Silent**: No alerts or notifications for auto-save

---

## 📚 Accessing Saved Stories

Click **"Library"** in the top navigation menu to:
- View all saved stories
- Load a story to continue working
- Export stories as JSON backups
- Import previously exported stories
- Delete old stories

