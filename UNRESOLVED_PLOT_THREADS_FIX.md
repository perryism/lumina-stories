# Unresolved Plot Threads and Story Continuity Enhancement

## Issue
The summary of previous chapters wasn't explicitly capturing unresolved events, cliffhangers, and pending plot threads. This meant the next chapter might not naturally continue from where the previous chapter left off, leading to:
- Dropped plot threads
- Unaddressed cliffhangers
- Story feeling disjointed or episodic rather than continuous
- Character goals and motivations not being developed across chapters

## Solution
Enhanced both the `summarizePreviousChapters` function and the `buildChapterPrompt` function to explicitly capture and continue unresolved plot elements.

## Changes Made

### 1. Enhanced Summary Generation Prompt
**File:** `services/aiService.ts` - `summarizePreviousChapters` function (lines 457-481)

**Added explicit focus on:**
- **UNRESOLVED PLOT THREADS**: Questions raised but not answered, conflicts started but not resolved, goals set but not achieved
- **CLIFFHANGERS AND OPEN ENDINGS**: How the last chapter ended, what's left hanging, what needs to happen next
- **CHARACTER GOALS AND MOTIVATIONS**: What each character wants, what they're trying to accomplish, what obstacles they face
- **PENDING DECISIONS OR ACTIONS**: Choices that need to be made, actions that were planned but not yet taken

**Added critical instructions:**
```
CRITICAL: The next chapter needs to CONTINUE the story from where it left off. Your summary must make it clear:
1. What has been RESOLVED (so it's not repeated)
2. What is UNRESOLVED (so it can be developed further)
3. What the characters are CURRENTLY doing or planning to do
4. What NEEDS TO HAPPEN NEXT for the story to progress logically
```

### 2. Enhanced System Prompt for Summaries
**File:** `services/aiService.ts` (line 492)

Changed from:
> "Your summaries must capture ALL important plot points..."

To:
> "CRITICALLY, you must clearly distinguish between what has been RESOLVED and what remains UNRESOLVED. The next chapter writer needs to know what plot threads to continue, what questions to answer, and what conflicts to develop."

### 3. Enhanced Chapter Generation Continuity Requirements
**File:** `services/aiService.ts` - `buildChapterPrompt` function (lines 345-355)

**Added new requirements:**
- CONTINUE developing any unresolved plot threads, conflicts, or questions from previous chapters
- Address cliffhangers and open endings from the previous chapter
- Progress character goals and motivations that were established but not yet achieved
- The story should flow naturally from the previous chapter's ending - pick up where it left off

## How It Works Now

### When Summarizing Previous Chapters:
1. AI analyzes each chapter's content (up to 2000 characters per chapter)
2. AI explicitly identifies:
   - ✅ What has been **RESOLVED** (completed events, answered questions)
   - ✅ What is **UNRESOLVED** (ongoing conflicts, unanswered questions, pending goals)
   - ✅ How the last chapter **ENDED** (cliffhangers, open situations)
   - ✅ What **NEEDS TO HAPPEN NEXT** (logical story progression)
3. Summary clearly distinguishes between resolved and unresolved elements

### When Generating the Next Chapter:
1. AI receives the enhanced summary with unresolved plot threads
2. AI is explicitly instructed to:
   - Continue developing unresolved plot threads
   - Address cliffhangers from the previous chapter
   - Progress character goals that were established
   - Pick up where the previous chapter left off
3. AI generates content that naturally continues the story

## Example

### Before (Old Summary):
> "Chapter 1: Sarah discovered a mysterious book in the library. She met an old librarian who seemed to know something about it. The chapter ended with Sarah taking the book home."

### After (Enhanced Summary):
> "Chapter 1: Sarah discovered a mysterious book in the library with strange symbols on the cover. She met an old librarian named Mr. Chen who seemed to recognize the book and looked alarmed, but he was interrupted before he could explain.
> 
> **RESOLVED**: Sarah found the book, met Mr. Chen
> **UNRESOLVED**: What the symbols mean, why Mr. Chen was alarmed, what he was about to tell Sarah
> **CLIFFHANGER**: Sarah took the book home, planning to examine it tonight
> **NEEDS TO HAPPEN NEXT**: Sarah examines the book, discovers something about the symbols, possibly encounters consequences of taking the book"

## Benefits

✅ **Natural Story Flow**: Chapters flow naturally from one to the next
✅ **Plot Thread Continuity**: Unresolved conflicts and questions are continued
✅ **Cliffhanger Resolution**: Cliffhangers are addressed in the next chapter
✅ **Character Goal Development**: Character motivations progress across chapters
✅ **Logical Progression**: Story progresses logically from where it left off
✅ **No Dropped Threads**: Important plot elements aren't forgotten

## Files Modified

- `services/aiService.ts`:
  - Lines 457-481: Enhanced `summarizePreviousChapters` prompt with unresolved plot thread focus
  - Line 492: Enhanced system prompt for summary generation
  - Lines 345-355: Enhanced `buildChapterPrompt` continuity requirements

