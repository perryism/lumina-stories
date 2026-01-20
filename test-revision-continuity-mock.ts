/**
 * Mock test to demonstrate revision continuity without calling API
 * Shows what the AI would receive and what we expect
 */

import { buildChapterPrompt } from './services/aiService';
import { Chapter, Character } from './types';

// Test Chapter 1 - ends with a direct question
const chapter1: Chapter = {
  id: 1,
  title: "The Mysterious Encounter",
  summary: "A stranger meets a peculiar cat in a dark alley",
  status: 'completed',
  content: `The rain pounded against the cobblestones as Marcus hurried through the narrow alley. He was late for his appointment, and the shortcut through the old district seemed like a good idea at the time.

That's when he saw it—a large orange tabby cat sitting perfectly still in the middle of the path, completely unbothered by the rain. Its green eyes seemed to glow in the dim light.

"Shoo," Marcus said, waving his hand. "Go on, get out of the way."

The cat didn't move. Instead, it tilted its head and regarded him with an almost human expression of curiosity.

Marcus stepped closer, and that's when something impossible happened. The cat's mouth moved, and words came out—actual words, in a voice that sounded like gravel mixed with honey.

"You can hear me," the cat said, not as a question but as a statement of fact.

Marcus stumbled backward, his heart racing. "What... how..."

The cat stood up, stretching languidly. "Most humans can't. You're different. Interesting."

Marcus's mind reeled. A talking cat. He was either losing his mind or... or what? Magic was real?

"This isn't possible," Marcus whispered.

"And yet, here we are," the cat replied, sitting back down and wrapping its tail around its paws. "You have questions. I can see them swirling in your mind like a storm."

Marcus swallowed hard. His appointment was forgotten now. Nothing mattered except understanding what was happening.

"What is your name?" the stranger asked the cat named Fart.`
};

// Test Chapter 2 - initial version
const chapter2Initial: Chapter = {
  id: 2,
  title: "The Cat's Secret",
  summary: "The cat reveals its identity and purpose",
  status: 'completed',
  content: `The cat's whiskers twitched with what might have been amusement. "My name," it said slowly, as if savoring the words, "is Fart."

Marcus blinked. Of all the mystical, ancient names he'd expected—Merlin, Shadow, Midnight—he got... Fart?

"Fart?" he repeated, unable to keep the disbelief from his voice.

"Yes, Fart," the cat confirmed, its tail swishing. "I know what you're thinking. Not very dignified for a magical being, is it? Blame the five-year-old who named me three centuries ago."

"Three... centuries?" Marcus felt his knees weaken.

The cat—Fart—nodded. "I've been around for quite some time. Long enough to recognize someone with the Gift when I see them."

"The Gift?"

"The ability to hear us. To communicate with the magical creatures that walk alongside humanity, unseen and unheard by most." Fart's green eyes seemed to pierce through Marcus. "It's rare. Very rare. And it usually manifests during times of great change or danger."

Marcus's mouth went dry. "Danger? What kind of danger?"

But Fart was already turning away, padding toward the end of the alley. "Follow me, Marcus. There's someone you need to meet. Someone who can explain far better than I can why you've suddenly developed this ability."

"Wait, how do you know my name?" Marcus called out, but the cat had already disappeared into the shadows.`
};

// Test characters
const characters: Character[] = [
  {
    id: '1',
    name: 'Marcus',
    attributes: 'A skeptical office worker in his 30s who discovers he can hear magical creatures. Logical, cautious, but curious.'
  },
  {
    id: '2',
    name: 'Fart',
    attributes: 'An ancient magical cat with a ridiculous name. Wise, sarcastic, and mysterious. Has been watching Marcus for weeks.'
  }
];

// Mock summary from Chapter 1
const mockSummary = `### **CRITICAL FOR CHAPTER 2:**
1. **RESOLVED:** Marcus has established he can hear the cat. Do not spend Chapter 2 wondering *if* he can hear it.
2. **UNRESOLVED:** Marcus does **not** know the cat's name is Fart. He has just asked the question. The cat must now answer.
3. **CURRENT ACTION:** They are standing in the rain. The conversation needs to continue.
4. **LOGICAL PROGRESSION:** The cat should explain its name and begin to address Marcus's questions.`;

const userFeedback = "Add more emotional reaction from Marcus about the ridiculous name. Show his internal thoughts about how absurd this situation is - a magical cat named Fart. Make it more humorous and show Marcus struggling between taking this seriously and laughing.";

console.log('='.repeat(80));
console.log('REVISION CONTINUITY TEST (MOCK)');
console.log('='.repeat(80));
console.log('\n📖 SCENARIO:');
console.log('User wants to revise Chapter 2 with feedback about adding more humor.');
console.log('\n');

console.log('🔍 REGENERATION PROMPT STRUCTURE:');
console.log('-'.repeat(80));

const basePrompt = buildChapterPrompt(
  'The Whispering City',
  'Urban Fantasy',
  characters,
  1,
  [chapter1, chapter2Initial],
  mockSummary,
  undefined,
  'adult',
  undefined
);

const regenerationPrompt = `${basePrompt}

IMPORTANT: This is a REGENERATION of the chapter based on user feedback.

Previous version of the chapter:
${chapter2Initial.content}

User Feedback:
${userFeedback}

Please rewrite the chapter taking the user's feedback into account. Make sure to:
1. Address all points mentioned in the feedback
2. MAINTAIN FULL CONTINUITY with previous chapters
3. Characters should remember what they learned in previous chapters
4. Keep the core plot points from the chapter summary
5. Maintain consistency with the story's tone, style, and established facts
6. Improve upon the previous version based on the specific feedback provided`;

console.log('Full prompt length:', regenerationPrompt.length, 'chars');
console.log('\n');

console.log('='.repeat(80));
console.log('✅ WHAT THE REGENERATION PROMPT INCLUDES:');
console.log('='.repeat(80));
console.log('1. ✅ Full continuity requirements from buildChapterPrompt');
console.log('2. ✅ Previous chapters summary (what Marcus knows vs doesn\'t know)');
console.log('3. ✅ The original Chapter 2 content (for reference)');
console.log('4. ✅ User feedback (add more humor and internal thoughts)');
console.log('5. ✅ Explicit instruction to maintain continuity');
console.log('6. ✅ Instruction to keep core plot points');
console.log('\n');

console.log('='.repeat(80));
console.log('📝 EXPECTED REVISED CHAPTER 2 BEHAVIOR:');
console.log('='.repeat(80));
console.log('The revised chapter should:');
console.log('✅ Still start with the cat answering "Fart"');
console.log('✅ Add MORE internal thoughts from Marcus about the absurdity');
console.log('✅ Show Marcus struggling between laughing and taking it seriously');
console.log('✅ Keep the same plot points (3 centuries old, the Gift, danger, etc.)');
console.log('✅ Still reference the rain and alley setting');
console.log('✅ NOT repeat the question being asked');
console.log('✅ NOT re-explain that Marcus can hear the cat');
console.log('\n');

console.log('='.repeat(80));
console.log('🎯 EXAMPLE OF GOOD REVISION:');
console.log('='.repeat(80));
console.log(`
The cat's whiskers twitched with what might have been amusement. "My name," 
it said slowly, as if savoring the words, "is Fart."

Marcus blinked. Then blinked again. 

Fart. 

Of all the mystical, ancient names he'd expected—Merlin, Shadow, Azrael, 
something with gravitas—he got... Fart. A magical, talking cat. Named Fart.

He felt a hysterical laugh bubbling up in his chest. This was insane. He was 
standing in a rainstorm, soaking wet, having missed whatever appointment he'd 
been rushing to, talking to a CAT. A cat that could speak. A cat that had just 
introduced itself as FART.

"I'm sorry," Marcus said, his voice strangled as he fought to keep a straight 
face. "Did you just say... Fart?"

"Yes, Fart," the cat confirmed with the kind of dignity that made the whole 
situation even more absurd. Its tail swished with what Marcus could only 
interpret as mild annoyance. "I know what you're thinking. Not very dignified 
for a magical being, is it?"

Marcus pressed his lips together, trying desperately not to laugh. This was 
serious. Magic was real. His entire worldview was crumbling. But... Fart?

"Blame the five-year-old who named me three centuries ago," the cat continued.

Three centuries. Right. Because of course this cat named Fart was also 
immortal. Why not? At this point, Marcus wouldn't be surprised if it started 
juggling fireballs.
`);
console.log('\n');

console.log('='.repeat(80));
console.log('❌ EXAMPLE OF BAD REVISION (BREAKS CONTINUITY):');
console.log('='.repeat(80));
console.log(`
Marcus stood in the alley, wondering if he was going crazy. Had that cat 
just spoken to him? No, that was impossible. Cats couldn't talk.

"Hello?" he called out tentatively. "Are you... can you really talk?"

The cat looked at him with glowing green eyes. "Yes, I can talk. My name 
is Fart."

Marcus gasped. A talking cat! This was incredible! He'd never heard of 
such a thing before...
`);
console.log('\n^ This is BAD because:');
console.log('  ❌ Repeats the shock of hearing the cat (already happened in Ch 1)');
console.log('  ❌ Marcus acts like he doesn\'t know the cat can talk');
console.log('  ❌ Doesn\'t continue from where Chapter 1 ended');
console.log('  ❌ Doesn\'t add the requested humor/internal thoughts');
console.log('\n');

console.log('='.repeat(80));
console.log('🎉 CONCLUSION:');
console.log('='.repeat(80));
console.log('The regeneration system maintains continuity by:');
console.log('1. Using the same buildChapterPrompt with full continuity requirements');
console.log('2. Including the previous chapters summary');
console.log('3. Showing the AI the original version for reference');
console.log('4. Explicitly instructing to maintain continuity while addressing feedback');
console.log('5. Using the same strong system prompt about continuity');
console.log('\n');

