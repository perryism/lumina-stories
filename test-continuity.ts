/**
 * Test script to verify story continuity
 * This simulates what happens when Chapter 1 ends with a question
 * and Chapter 2 should answer it
 */

import { summarizePreviousChapters, buildChapterPrompt } from './services/aiService';
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

async function testContinuity() {
  console.log('='.repeat(80));
  console.log('TESTING STORY CONTINUITY');
  console.log('='.repeat(80));
  console.log('\n📖 CHAPTER 1 ENDING:');
  console.log('-'.repeat(80));
  const lastLines = chapter1.content!.split('\n').slice(-5).join('\n');
  console.log(lastLines);
  console.log('\n');

  console.log('🔍 STEP 1: Generate Summary of Chapter 1');
  console.log('-'.repeat(80));
  const summary = await summarizePreviousChapters([chapter1]);
  console.log('Summary generated:');
  console.log(summary);
  console.log('\n');

  console.log('🔍 STEP 2: Build Prompt for Chapter 2');
  console.log('-'.repeat(80));
  const prompt = buildChapterPrompt(
    'The Whispering City',
    'Urban Fantasy',
    characters,
    1, // Chapter 2 (index 1)
    [chapter1, chapter2],
    summary,
    undefined,
    'adult',
    undefined
  );
  console.log('Prompt for Chapter 2:');
  console.log(prompt);
  console.log('\n');

  console.log('='.repeat(80));
  console.log('✅ WHAT TO LOOK FOR IN THE PROMPT:');
  console.log('='.repeat(80));
  console.log('1. Does the summary mention the question "What is your name?"');
  console.log('2. Does the summary identify this as an UNRESOLVED element?');
  console.log('3. Does the summary mention the cat is named Fart?');
  console.log('4. Does the prompt tell the AI to address cliffhangers?');
  console.log('5. Does the prompt emphasize continuing from where Chapter 1 ended?');
  console.log('\n');

  console.log('='.repeat(80));
  console.log('📝 EXPECTED CHAPTER 2 BEHAVIOR:');
  console.log('='.repeat(80));
  console.log('Chapter 2 should:');
  console.log('✅ Start with the cat answering the question');
  console.log('✅ Have the cat reveal its name is "Fart"');
  console.log('✅ Continue the conversation between Marcus and Fart');
  console.log('✅ NOT start with a new scene or time jump');
  console.log('✅ NOT repeat the question being asked');
  console.log('\n');
}

// Run the test
testContinuity().catch(console.error);

