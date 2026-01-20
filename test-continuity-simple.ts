/**
 * Simple test to show what prompts would be generated
 * WITHOUT actually calling the AI API
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

// Test Chapter 2 outline
const chapter2: Chapter = {
  id: 2,
  title: "The Cat's Secret",
  summary: "The cat reveals its identity and purpose",
  status: 'pending'
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

// Mock summary that would be generated
const mockSummary = `**Chapter 1: The Mysterious Encounter**

MAJOR EVENTS:
- Marcus, a skeptical office worker, took a shortcut through an old district alley during a rainstorm
- He encountered an orange tabby cat that remained still in the rain
- The cat spoke to Marcus in actual words, revealing that Marcus has the rare ability to hear magical creatures
- Marcus was shocked and disbelieving, but the cat confirmed that magic is real
- The cat stated that Marcus is "different" from most humans who cannot hear magical beings

CHARACTER DEVELOPMENTS:
- Marcus: Initially dismissive, then shocked and confused when confronted with the impossible. His logical worldview is being challenged.
- The Cat (named Fart): Calm, knowing, and somewhat mysterious. Speaks with authority and seems to have been observing Marcus.

UNRESOLVED PLOT THREADS:
- Marcus asked the cat "What is your name?" but the question was NOT answered yet
- The cat's true identity and purpose remain unknown
- Why Marcus can hear magical creatures is unexplained
- What the cat wants from Marcus is unclear
- Marcus's appointment was forgotten - what was it for?

CLIFFHANGER:
The chapter ends with Marcus asking the cat its name. The cat has not yet responded. This direct question MUST be answered at the beginning of Chapter 2.

CURRENT STATE:
- Location: Dark alley in the old district, raining
- Marcus: Standing in the rain, shocked, waiting for the cat's answer
- The Cat: Sitting calmly, having just been asked its name
- Time: Evening/night

WHAT NEEDS TO HAPPEN NEXT:
The cat must answer Marcus's question about its name (which is "Fart" according to the character description). The conversation should continue from this exact moment.`;

console.log('='.repeat(80));
console.log('STORY CONTINUITY TEST');
console.log('='.repeat(80));
console.log('\n📖 CHAPTER 1 ENDING (Last 3 lines):');
console.log('-'.repeat(80));
const lines = chapter1.content!.split('\n');
console.log(lines[lines.length - 3]);
console.log(lines[lines.length - 2]);
console.log(lines[lines.length - 1]);
console.log('\n');

console.log('📝 MOCK SUMMARY (What AI would generate):');
console.log('-'.repeat(80));
console.log(mockSummary);
console.log('\n');

console.log('🎯 CHAPTER 2 GENERATION PROMPT:');
console.log('-'.repeat(80));
const prompt = buildChapterPrompt(
  'The Whispering City',
  'Urban Fantasy',
  characters,
  1, // Chapter 2 (index 1)
  [chapter1, chapter2],
  mockSummary,
  undefined,
  'adult',
  undefined
);
console.log(prompt);
console.log('\n');

console.log('='.repeat(80));
console.log('✅ VERIFICATION CHECKLIST:');
console.log('='.repeat(80));
console.log('Look for these in the prompt above:');
console.log('[ ] Summary mentions the unanswered question "What is your name?"');
console.log('[ ] Summary identifies this as UNRESOLVED');
console.log('[ ] Summary mentions the cat is named Fart');
console.log('[ ] Prompt tells AI to "Address cliffhangers and open endings"');
console.log('[ ] Prompt tells AI to "Continue from where previous chapter ended"');
console.log('[ ] Prompt emphasizes "pick up where it left off"');
console.log('\n');

