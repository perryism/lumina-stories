# Foreshadowing Feature Implementation Summary

## Overview
This document summarizes the implementation of the foreshadowing feature for Lumina Stories, which allows authors to plan future plot reveals and automatically add subtle hints in earlier chapters.

## Files Modified

### 1. `types.ts`
**Changes:**
- Added `ForeshadowingNote` interface with fields:
  - `id`: Unique identifier
  - `targetChapterId`: Chapter where the reveal happens
  - `revealDescription`: What will be revealed
  - `foreshadowingHint`: How to hint at this in earlier chapters
  - `createdAt`: Timestamp for ordering
- Added `foreshadowingNotes` optional field to `Chapter` interface
- Added `foreshadowingNotes` optional field to `StoryState` interface

### 2. `services/aiService.ts`
**Changes:**
- Imported `ForeshadowingNote` type
- Updated `buildChapterPrompt` function:
  - Added `foreshadowingNotes` optional parameter
  - Added logic to filter notes for current chapter
  - Generates instructions for notes to foreshadow (target chapter is later)
  - Generates instructions for notes to reveal (target chapter is current)
  - Appends foreshadowing instructions to the prompt
- Updated `generateChapterContent` function:
  - Added `foreshadowingNotes` optional parameter
  - Passes notes to `buildChapterPrompt`
- Updated `regenerateChapterContent` function:
  - Added `foreshadowingNotes` optional parameter
  - Passes notes to `buildChapterPrompt`

### 3. `App.tsx`
**Changes:**
- Imported `ForeshadowingManager` component and `ForeshadowingNote` type
- Added `foreshadowingNotes: []` to initial state
- Added three handler functions:
  - `handleAddForeshadowingNote`: Creates new note with unique ID
  - `handleDeleteForeshadowingNote`: Removes note by ID
  - `handleUpdateForeshadowingNote`: Updates existing note
- Updated all chapter generation calls to pass `state.foreshadowingNotes`:
  - `handleGenerateNextChapter`
  - `handleRegenerateChapter`
  - Automatic generation loop
- Updated `updatePromptForNextChapter` to include foreshadowing notes
- Added `ForeshadowingManager` component to outline editor view

## Files Created

### 4. `components/ForeshadowingManager.tsx`
**New Component:**
A comprehensive UI component for managing foreshadowing notes with:
- Form for adding/editing notes
- Chapter selection dropdown
- Input fields for reveal description and foreshadowing hints
- Display of notes organized by target chapter
- Edit and delete functionality
- Helpful explanatory text and examples

### 5. `FORESHADOWING.md`
**Documentation:**
Complete user guide covering:
- How the feature works
- Step-by-step usage instructions
- Example use cases
- Best practices
- Tips for effective foreshadowing
- Technical details
- Limitations

### 6. `FORESHADOWING_IMPLEMENTATION.md`
**Technical Documentation:**
This file - implementation summary for developers

## How It Works

### Data Flow
1. User creates foreshadowing note in `ForeshadowingManager`
2. Note is stored in `state.foreshadowingNotes` array
3. When generating a chapter, notes are passed to `generateChapterContent`
4. `buildChapterPrompt` filters notes relevant to current chapter:
   - Notes with `targetChapterId > currentChapter` → add foreshadowing hints
   - Notes with `targetChapterId === currentChapter` → add reveal instructions
5. AI receives enhanced prompt with foreshadowing instructions
6. Generated chapter includes appropriate hints or reveals

### Example Prompt Enhancement
For a note revealing "The witch is the hero's mother" in Chapter 5:

**Chapter 2 prompt includes:**
```
Foreshadowing (subtle hints for future reveals):
- Subtly hint at: "The witch is the hero's mother" (will be revealed in Chapter 5)
  Suggestion: The witch shows unexpected maternal concern for the hero's wellbeing
```

**Chapter 5 prompt includes:**
```
Reveals (important plot points to reveal in this chapter):
- REVEAL: The witch is the hero's mother
```

## Key Design Decisions

### 1. Global vs Chapter-Specific Notes
- **Decision**: Store notes globally in `StoryState`
- **Rationale**: Foreshadowing affects multiple chapters, not just one
- **Alternative considered**: Store in each chapter, but would require duplication

### 2. Filtering Logic
- **Decision**: Filter notes in `buildChapterPrompt` based on target chapter
- **Rationale**: Keeps filtering logic centralized and consistent
- **Implementation**: 
  - `targetChapterId > chapterIndex + 1` → foreshadow
  - `targetChapterId === chapterIndex + 1` → reveal

### 3. UI Placement
- **Decision**: Show `ForeshadowingManager` on outline editor screen
- **Rationale**: 
  - Users can see full story arc before adding notes
  - Notes should be added before chapter generation
  - Natural workflow: outline → plan foreshadowing → generate

### 4. Note Structure
- **Decision**: Separate fields for reveal and foreshadowing hint
- **Rationale**: 
  - Clear separation of what vs how
  - Easier for AI to understand instructions
  - Better UX for users to think through both aspects

## Testing Recommendations

### Manual Testing
1. Create a story with 5 chapters
2. Add foreshadowing note for Chapter 5
3. Generate chapters and verify:
   - Chapters 1-4 include subtle hints
   - Chapter 5 includes the reveal
   - Hints are natural and not forced

### Edge Cases to Test
- Multiple foreshadowing notes for same chapter
- Foreshadowing note for Chapter 1 (should only reveal, no foreshadowing)
- Adding notes after some chapters are generated
- Editing/deleting notes
- Very long reveal descriptions or hints

## Future Enhancements

### Potential Improvements
1. **Foreshadowing Strength**: Add intensity levels (subtle, moderate, obvious)
2. **Multiple Techniques**: Allow multiple foreshadowing approaches per note
3. **AI Suggestions**: Analyze outline and suggest foreshadowing opportunities
4. **Verification**: Check if generated chapters actually include the hints
5. **Templates**: Pre-built foreshadowing patterns for common plot devices
6. **Cross-Chapter Links**: Show which chapters are affected by each note
7. **Undo/Redo**: Allow reverting foreshadowing changes
8. **Export/Import**: Save foreshadowing notes separately for reuse

### Known Limitations
1. Notes don't retroactively affect already-generated chapters
2. AI interpretation may vary - hints might be too subtle or too obvious
3. No validation that hints were actually included in generated text
4. Complex or contradictory notes may confuse the narrative

## Backward Compatibility
- Feature is fully backward compatible
- Existing stories without foreshadowing notes work unchanged
- `foreshadowingNotes` is optional in all interfaces
- Default to empty array if not present

## Performance Considerations
- Minimal performance impact
- Filtering happens once per chapter generation
- Notes stored in memory (part of React state)
- No additional API calls required

