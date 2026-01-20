# Always Summarize Chapters Feature

## Overview
This feature ensures that **every chapter always has a detailed summary**, even if one wasn't generated when the chapter was first created. When a chapter without a detailed summary is encountered, the system will automatically generate one and persist it.

## What Changed

### 1. Modified `summarizePreviousChapters()` in `services/aiService.ts`

**Before:**
- When a chapter didn't have a `detailedSummary`, the function would use the full chapter content instead
- This meant chapters without summaries would never get them

**After:**
- When a chapter doesn't have a `detailedSummary`, the function now:
  1. Automatically generates a detailed summary using `generateDetailedChapterSummary()`
  2. Stores the summary in the chapter object (`chapter.detailedSummary = detailedSummary`)
  3. Uses the newly generated summary for context
  4. Falls back to full content only if summary generation fails

**Code Changes (lines 601-621):**
```typescript
for (const chapter of chaptersWithContent) {
  if (chapter.detailedSummary) {
    // Use existing summary
    summaries.push(`=== CHAPTER ${chapter.id}: ${chapter.title} ===\n${chapter.detailedSummary}`);
  } else {
    // NEW: Generate summary if missing
    console.log(`[summarizePreviousChapters] No detailed summary found for Chapter ${chapter.id}, generating now...`);
    try {
      const detailedSummary = await generateDetailedChapterSummary(chapter);
      chapter.detailedSummary = detailedSummary;  // Store in chapter object
      summaries.push(`=== CHAPTER ${chapter.id}: ${chapter.title} ===\n${detailedSummary}`);
      console.log(`[summarizePreviousChapters] Generated and stored detailed summary for Chapter ${chapter.id}`);
    } catch (error) {
      // Fallback to full content if generation fails
      summaries.push(`=== CHAPTER ${chapter.id}: ${chapter.title} ===\n${chapter.content}`);
    }
  }
}
```

### 2. Updated Persistence Logic in `App.tsx`

Added code to persist newly generated summaries in three locations:

#### A. Manual Chapter Generation (`handleGenerateNextChapter`)
**Lines 245-252:**
```typescript
// After summarizePreviousChapters is called
completedChapters.forEach((ch) => {
  const index = updatedOutline.findIndex(c => c.id === ch.id);
  if (index !== -1 && ch.detailedSummary) {
    updatedOutline[index] = { ...updatedOutline[index], detailedSummary: ch.detailedSummary };
  }
});
setState(prev => ({ ...prev, outline: [...updatedOutline] }));
```

#### B. Chapter Regeneration (`handleRegenerateChapter`)
**Lines 485-492:**
```typescript
// After summarizePreviousChapters is called
completedChapters.forEach((ch) => {
  const index = updatedOutline.findIndex(c => c.id === ch.id);
  if (index !== -1 && ch.detailedSummary) {
    updatedOutline[index] = { ...updatedOutline[index], detailedSummary: ch.detailedSummary };
  }
});
setState(prev => ({ ...prev, outline: [...updatedOutline] }));
```

#### C. Batch Chapter Generation (Auto-write mode)
**Lines 593-602:**
```typescript
// After summarizePreviousChapters is called
completedChapters.forEach((ch) => {
  const index = updatedOutline.findIndex(c => c.id === ch.id);
  if (index !== -1 && ch.detailedSummary) {
    updatedOutline[index] = { ...updatedOutline[index], detailedSummary: ch.detailedSummary };
  }
});
setState(prev => ({ ...prev, outline: [...updatedOutline] }));
```

## How It Works

### Flow Diagram
```
User generates Chapter 3
    ↓
System needs context from Chapters 1 & 2
    ↓
summarizePreviousChapters([Chapter1, Chapter2]) is called
    ↓
For each chapter:
    - Has detailedSummary? → Use it
    - No detailedSummary? → Generate one NOW
        ↓
        generateDetailedChapterSummary(chapter)
        ↓
        Store in chapter.detailedSummary
    ↓
Return combined summary
    ↓
App.tsx updates state with new summaries
    ↓
Auto-save persists to YAML file
    ↓
Chapter 3 is generated with full context
```

## Benefits

1. **Backward Compatibility**: Old stories without detailed summaries will automatically get them when you continue writing
2. **No Manual Intervention**: Summaries are generated automatically when needed
3. **Persistent**: Once generated, summaries are saved to YAML files
4. **Better Context**: Future chapters always have comprehensive summaries of previous chapters
5. **Fail-Safe**: If summary generation fails, falls back to using full content

## Example Scenario

**Before this change:**
- User has Chapters 1-3 written (no detailed summaries)
- User generates Chapter 4
- System uses full content of Chapters 1-3 (potentially too much context)

**After this change:**
- User has Chapters 1-3 written (no detailed summaries)
- User generates Chapter 4
- System detects missing summaries
- System generates detailed summaries for Chapters 1-3
- System saves summaries to YAML
- System uses summaries for Chapter 4 generation
- Future chapters (5, 6, etc.) will use the saved summaries

## Testing

To verify this feature works:

1. Load an old story without detailed summaries
2. Generate a new chapter
3. Check console logs for: `"No detailed summary found for Chapter X, generating now..."`
4. Check console logs for: `"Generated and stored detailed summary for Chapter X"`
5. Save the story and check the YAML file - it should now have `detailedSummary` fields
6. Generate another chapter - it should use the saved summaries (no regeneration needed)

## Files Modified

1. **services/aiService.ts** (lines 584-621)
   - Modified `summarizePreviousChapters()` to generate missing summaries

2. **App.tsx** (3 locations)
   - Lines 245-252: Manual chapter generation
   - Lines 485-492: Chapter regeneration
   - Lines 593-602: Batch generation
   - Added persistence logic after `summarizePreviousChapters()` calls

