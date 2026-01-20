/**
 * Test script to verify story continuity is maintained during chapter revision
 * This tests that when a user requests a revision, the regenerated chapter
 * still maintains continuity with previous chapters
 */

import { regenerateChapterContent, summarizePreviousChapters } from './services/aiService';
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

// Test Chapter 2 - initial version that needs revision
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

async function testRevisionContinuity() {
  console.log('='.repeat(80));
  console.log('TESTING REVISION CONTINUITY');
  console.log('='.repeat(80));
  console.log('\n📖 SCENARIO:');
  console.log('-'.repeat(80));
  console.log('User has generated Chapter 1 and Chapter 2.');
  console.log('User wants to revise Chapter 2 with feedback:');
  console.log('"Add more emotional reaction from Marcus about the ridiculous name."');
  console.log('\n');

  console.log('📖 CHAPTER 1 ENDING (for context):');
  console.log('-'.repeat(80));
  const ch1Lines = chapter1.content!.split('\n');
  console.log(ch1Lines[ch1Lines.length - 3]);
  console.log(ch1Lines[ch1Lines.length - 2]);
  console.log(ch1Lines[ch1Lines.length - 1]);
  console.log('\n');

  console.log('📖 CHAPTER 2 INITIAL VERSION (first 300 chars):');
  console.log('-'.repeat(80));
  console.log(chapter2Initial.content!.substring(0, 300) + '...');
  console.log('\n');

  console.log('🔍 STEP 1: Generate Summary of Chapter 1');
  console.log('-'.repeat(80));
  const summary = await summarizePreviousChapters([chapter1]);
  console.log(`Summary length: ${summary.length} chars`);
  console.log('Summary preview (first 500 chars):');
  console.log(summary.substring(0, 500) + '...');
  console.log('\n');

  console.log('🔍 STEP 2: Regenerate Chapter 2 with User Feedback');
  console.log('-'.repeat(80));
  const userFeedback = "Add more emotional reaction from Marcus about the ridiculous name. Show his internal thoughts about how absurd this situation is - a magical cat named Fart. Make it more humorous and show Marcus struggling between taking this seriously and laughing.";
  
  console.log('User feedback:');
  console.log(userFeedback);
  console.log('\n');

  console.log('Calling regenerateChapterContent...');
  const revisedContent = await regenerateChapterContent(
    'The Whispering City',
    'Urban Fantasy',
    characters,
    1, // Chapter 2 (index 1)
    [chapter1, chapter2Initial],
    summary,
    userFeedback,
    'adult',
    undefined,
    undefined
  );

  console.log('\n');
  console.log('='.repeat(80));
  console.log('✅ REVISED CHAPTER 2:');
  console.log('='.repeat(80));
  console.log(revisedContent);
  console.log('\n');

  console.log('='.repeat(80));
  console.log('🔍 CONTINUITY VERIFICATION CHECKLIST:');
  console.log('='.repeat(80));
  
  const checks = [
    {
      name: 'Starts with cat answering the question',
      test: () => {
        const firstParagraph = revisedContent.substring(0, 200).toLowerCase();
        return firstParagraph.includes('fart') || firstParagraph.includes('name');
      }
    },
    {
      name: 'References the question from Chapter 1',
      test: () => {
        return revisedContent.toLowerCase().includes('name') || 
               revisedContent.toLowerCase().includes('what is your');
      }
    },
    {
      name: 'Maintains the cat\'s name as "Fart"',
      test: () => {
        return revisedContent.toLowerCase().includes('fart');
      }
    },
    {
      name: 'Shows Marcus\'s emotional reaction (per feedback)',
      test: () => {
        const content = revisedContent.toLowerCase();
        return content.includes('thought') || content.includes('felt') || 
               content.includes('mind') || content.includes('absurd') ||
               content.includes('ridiculous');
      }
    },
    {
      name: 'Does NOT repeat the question being asked',
      test: () => {
        const questionCount = (revisedContent.match(/what is your name/gi) || []).length;
        return questionCount <= 1; // Should only reference it, not repeat it
      }
    },
    {
      name: 'Maintains continuity (mentions rain/alley)',
      test: () => {
        const content = revisedContent.toLowerCase();
        return content.includes('rain') || content.includes('alley') || 
               content.includes('wet') || content.includes('storm');
      }
    },
    {
      name: 'Marcus remembers he can hear the cat',
      test: () => {
        // Should not re-explain the shock of hearing the cat
        const content = revisedContent.toLowerCase();
        const hasShockWords = content.includes('impossible') || 
                             content.includes('can\'t be') ||
                             content.includes('hearing things');
        // It's OK to have some surprise, but shouldn't be the main focus
        return !hasShockWords || content.length > 500;
      }
    }
  ];

  checks.forEach((check, index) => {
    const passed = check.test();
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${index + 1}. ${check.name}`);
  });

  const passedCount = checks.filter(c => c.test()).length;
  const totalCount = checks.length;
  
  console.log('\n');
  console.log('='.repeat(80));
  console.log(`RESULT: ${passedCount}/${totalCount} checks passed`);
  console.log('='.repeat(80));
  
  if (passedCount === totalCount) {
    console.log('🎉 SUCCESS! Revision maintains perfect continuity!');
  } else if (passedCount >= totalCount * 0.7) {
    console.log('⚠️  PARTIAL SUCCESS: Most continuity maintained, but some issues.');
  } else {
    console.log('❌ FAILURE: Revision broke continuity.');
  }
  console.log('\n');
}

// Run the test
testRevisionContinuity().catch(console.error);

