# Revision Instructions Fix

## Issue

When users provided "Revision Instructions" and clicked "Regenerate This Chapter" in the StoryViewer, the AI was not following the user's specific feedback. Instead, it would often:
- Ignore or downplay the user's instructions
- Focus too much on maintaining continuity at the expense of addressing feedback
- Make minimal changes that didn't address the user's requests
- Get overwhelmed by the long, complex prompt structure

## Root Cause

The regeneration prompt structure was burying the user's feedback within a very long, detailed prompt. The flow was:

1. **Base prompt** (very long, ~500+ lines with all story context, continuity requirements, etc.)
2. "This is a regeneration"
3. Previous chapter content (could be 1000+ words)
4. User feedback (often just 1-2 sentences)
5. Generic checklist

The AI models were:
- **Losing focus** on the specific user feedback due to prompt length
- **Prioritizing** the extensive base prompt instructions over user feedback
- **Getting confused** by having both the original chapter AND all the detailed generation instructions

## Solution

Completely restructured the regeneration prompt to:

### 1. **Put User Feedback First** 
The user's revision instructions are now at the very top of the prompt with clear visual markers:

```
📝 USER'S REVISION INSTRUCTIONS (PRIMARY FOCUS):
[User's feedback here]

⚠️ YOUR TASK: Rewrite this chapter to address the user's feedback above...
```

### 2. **Simplified Prompt Structure**
Instead of including the entire `buildChapterPrompt` output, we now provide:
- User feedback (PRIMARY FOCUS)
- Previous chapter content
- Essential story context (previous chapters summary)
- Basic chapter requirements (title, summary, characters)
- Simple checklist with user feedback as #1 priority

### 3. **Updated System Prompt**
Changed the system prompt to explicitly prioritize user feedback:

**Before:**
```
You are a professional fiction writer... maintaining perfect continuity... 
CRITICAL: Never repeat events...
```

**After:**
```
YOUR PRIMARY GOAL: Follow the user's revision instructions precisely. 
The user knows what they want - your job is to implement their vision...

SECONDARY GOALS:
- Maintain continuity...
- Keep character consistency...
```

### 4. **Visual Hierarchy**
Used emojis and clear sections to help the AI parse the prompt:
- 🔄 for revision request
- 📝 for user instructions (PRIMARY)
- 📖 for previous version
- 📚 for story context
- 📋 for requirements
- ✅ for checklist
- 🚫 for don'ts

## Changes Made

**File Modified:** `services/aiService.ts`

**Function:** `regenerateChapterContent` (lines 979-1120)

### Key Changes:

1. **Removed** the call to `buildChapterPrompt` which was creating an overly complex base prompt
2. **Created** a new focused regeneration prompt structure
3. **Prioritized** user feedback at the top of the prompt
4. **Simplified** the context to only essential information
5. **Updated** system prompt to emphasize following user instructions
6. **Added** visual markers to help AI parse the prompt structure

## Testing

To test the fix:

1. Generate a multi-chapter story
2. Go to StoryViewer (read mode)
3. Navigate to any chapter
4. Click "Regenerate This Chapter"
5. Provide specific feedback like:
   - "Add more dialogue between the characters"
   - "Make the action scene more intense and detailed"
   - "Include more internal thoughts from the protagonist"
   - "Add humor to this scene"
6. Click "Regenerate"
7. Verify the regenerated chapter:
   - ✅ Directly addresses your specific feedback
   - ✅ Makes substantial changes based on your instructions
   - ✅ Still maintains continuity with previous chapters
   - ✅ Keeps the core plot points

## Example

**User Feedback:**
"Add more dialogue between Marcus and the cat. Show their banter and make it more humorous."

**Expected Result:**
The regenerated chapter should have significantly more dialogue, with back-and-forth conversation between Marcus and the cat, including humorous exchanges.

**Before Fix:**
The AI might make minimal changes, add one or two lines of dialogue, and focus more on maintaining the exact same structure.

**After Fix:**
The AI will prioritize adding substantial dialogue and humor as requested, while still keeping the story coherent.

## Technical Details

### Prompt Length Comparison

**Before:**
- Base prompt: ~2000-3000 tokens
- Previous chapter: ~1000-1500 tokens
- User feedback: ~50-100 tokens
- Total: ~3500-5000 tokens
- **User feedback was <2% of the prompt**

**After:**
- User feedback section: ~50-100 tokens (at the top)
- Previous chapter: ~1000-1500 tokens
- Story context: ~500-1000 tokens
- Requirements: ~200-300 tokens
- Total: ~2000-3000 tokens
- **User feedback is now the first thing the AI sees**

### Foreshadowing Support

The fix maintains support for foreshadowing notes by including them in the requirements section when present.

## Benefits

1. **Better User Control**: Users get what they ask for
2. **Clearer Instructions**: AI understands what to prioritize
3. **Shorter Prompts**: More efficient token usage
4. **Better Results**: More substantial revisions that address feedback
5. **Maintained Quality**: Still preserves story continuity and quality

## Future Enhancements

Potential improvements:
- Allow users to specify revision "strength" (minor tweaks vs major rewrite)
- Show a diff view of changes made
- Allow multiple rounds of feedback without full regeneration
- Add revision templates (e.g., "Add more dialogue", "Increase tension")

