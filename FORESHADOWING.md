# Foreshadowing Feature

The foreshadowing feature allows you to plan future plot reveals and automatically add subtle hints in earlier chapters. This helps create a more cohesive and engaging narrative with satisfying payoffs.

## How It Works

### 1. Adding Foreshadowing Notes

When you're on the **Outline Editor** screen (after generating your story outline), you'll see a **Foreshadowing Manager** section above the chapter outline.

Click **"+ Add Foreshadowing"** to create a new note.

### 2. Creating a Note

For each foreshadowing note, you need to specify:

- **Reveal in Chapter**: Which chapter will contain the big reveal
- **What will be revealed**: A clear description of what will be revealed (e.g., "The witch is the hero's mother")
- **How to foreshadow**: Instructions for how to hint at this in earlier chapters (e.g., "The witch shows unexpected maternal concern for the hero's wellbeing")

### 3. Automatic Integration

When chapters are generated:

- **Earlier chapters** (before the reveal): The AI will receive instructions to subtly hint at the reveal using your foreshadowing guidance
- **Reveal chapter**: The AI will receive instructions to explicitly reveal the information
- **Later chapters**: No special instructions (the reveal has already happened)

## Example Use Case

Let's say you're writing a 5-chapter fantasy story and want to reveal in Chapter 5 that the witch is actually the hero's mother.

**Step 1**: Create a foreshadowing note:
- Reveal in Chapter: 5
- What will be revealed: "The witch is the hero's mother"
- How to foreshadow: "The witch shows unexpected maternal concern for the hero, perhaps protecting them in subtle ways or showing knowledge of their childhood"

**Step 2**: Generate your chapters

When the AI generates:
- **Chapter 1-4**: It will subtly include hints like the witch showing concern, knowing personal details, or acting protectively
- **Chapter 5**: It will explicitly reveal the relationship
- The hints in earlier chapters will make the reveal feel earned and satisfying

## Best Practices

### 1. Be Specific
Instead of: "Hint that they're related"
Use: "The witch mentions a lullaby that only the hero's mother would know"

### 2. Don't Overdo It
- One or two foreshadowing notes per story is usually enough
- Too many can make the story feel overly planned or predictable

### 3. Plan Major Reveals
Use foreshadowing for:
- Character relationships and identities
- Plot twists and betrayals
- Hidden motivations
- Secret connections between characters or events

### 4. Give Clear Instructions
The AI needs clear guidance on HOW to foreshadow. Be specific about:
- Actions the character might take
- Dialogue hints
- Symbolic elements
- Emotional reactions

## Tips for Effective Foreshadowing

1. **Subtle is better**: The hints should be noticeable on a re-read but not obvious on first read
2. **Multiple hints**: Consider creating 2-3 small hints rather than one big one
3. **Natural integration**: The foreshadowing should feel organic to the scene, not forced
4. **Emotional resonance**: The best foreshadowing connects to character emotions and motivations

## Managing Notes

- **Edit**: Click "Edit" on any note to modify it
- **Delete**: Click "Delete" to remove a note
- **View by Chapter**: Notes are organized by their reveal chapter for easy management

## When to Add Notes

The best time to add foreshadowing notes is:
1. **After generating the outline**: You can see the full story arc
2. **Before generating chapters**: The AI can incorporate hints from the start
3. **During manual generation**: You can add notes as you write and they'll affect future chapters

## Technical Details

- Foreshadowing notes are stored in your story state
- They're automatically included in the AI prompts for chapter generation
- Notes only affect chapters that haven't been generated yet
- You can add notes at any time, but they won't retroactively change already-generated chapters

## Example Scenarios

### Mystery Story
- **Reveal**: "The detective's partner is the killer"
- **Foreshadowing**: "The partner shows unusual knowledge of crime scenes and subtly steers investigations away from certain evidence"

### Romance
- **Reveal**: "The love interest is moving away permanently"
- **Foreshadowing**: "They avoid making long-term plans and seem melancholy when discussing the future"

### Fantasy Adventure
- **Reveal**: "The magical artifact is cursed and corrupting the hero"
- **Foreshadowing**: "The hero becomes increasingly irritable and makes uncharacteristic decisions when holding the artifact"

## Limitations

- Foreshadowing notes don't retroactively change already-generated chapters
- The AI interprets your instructions, so results may vary
- Very complex or contradictory foreshadowing may confuse the narrative
- Works best with clear, specific instructions

## Future Enhancements

Potential future features:
- Automatic foreshadowing suggestions based on your outline
- Foreshadowing strength levels (subtle, moderate, obvious)
- Multiple foreshadowing techniques per note
- Foreshadowing analysis of generated chapters

