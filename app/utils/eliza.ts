/**
 * ELIZA - A Computer Therapist
 * A simple implementation of the classic Rogerian psychotherapist chatbot.
 */

interface ElizaRule {
  keywords: string[];
  responses: string[];
}

const ELIZA_RULES: ElizaRule[] = [
  {
    keywords: ['hello', 'hi', 'greetings'],
    responses: [
      "How do you do. Please state your problem.",
      "Hi. What seems to be your problem?",
      "Hello! How are you feeling today?"
    ]
  },
  {
    keywords: ['i am', 'im'],
    responses: [
      "Did you come to me because you are {0}?",
      "How long have you been {0}?",
      "How do you feel about being {0}?"
    ]
  },
  {
    keywords: ['i feel'],
    responses: [
      "Tell me more about such feelings.",
      "Do you often feel {0}?",
      "When do you usually feel {0}?",
      "What else does feeling {0} remind you of?"
    ]
  },
  {
    keywords: ['mother', 'father', 'family', 'parent', 'brother', 'sister'],
    responses: [
      "Tell me more about your family.",
      "How do you feel about your {0}?",
      "Did your {0} have a large influence on you?",
      "Whom else in your family does this remind you of?"
    ]
  },
  {
    keywords: ['sad', 'depressed', 'unhappy'],
    responses: [
      "I am sorry to hear that you are {0}.",
      "Do you think coming here will help you not to be {0}?",
      "Can you explain what made you {0}?"
    ]
  },
  {
    keywords: ['happy', 'elated', 'glad'],
    responses: [
      "How have I helped you to be {0}?",
      "Has your treatment made you {0}?",
      "What makes you {0} just now?"
    ]
  },
  {
    keywords: ['can you'],
    responses: [
      "You believe I can {0}, don't you?",
      "You want me to be able to {0}?",
      "Perhaps you would like to be able to {0} yourself."
    ]
  },
  {
    keywords: ['can i'],
    responses: [
      "Whether or not you can {0} depends on you more than on me.",
      "Do you want to be able to {0}?",
      "Perhaps you don't want to {0}."
    ]
  },
  {
    keywords: ['why dont you'],
    responses: [
      "Do you believe I don't {0}?",
      "Perhaps I will {0} in good time.",
      "Should you {0} yourself?"
    ]
  },
  {
    keywords: ['why cant i'],
    responses: [
      "Do you think you should be able to {0}?",
      "Do you believe this will help you to {0}?",
      "Have you any idea why you can't {0}?"
    ]
  },
  {
    keywords: ['everyone', 'everybody', 'nobody', 'noone'],
    responses: [
      "Really, {0}?",
      "Surely not {0}.",
      "Can you think of anyone in particular?",
      "Who, for example?",
      "Are you thinking of a very special person?"
    ]
  },
  {
    keywords: ['always'],
    responses: [
      "Can you think of a specific example?",
      "When?",
      "What incident are you thinking of?",
      "Really, always?"
    ]
  },
  {
    keywords: ['computer', 'machine'],
    responses: [
      "Do computers worry you?",
      "Why do you mention computers?",
      "What do you think machines have to do with your problem?",
      "Don't you think computers can help people?",
      "What is it about machines that fascinates you?"
    ]
  },
  {
    keywords: ['name'],
    responses: [
      "I am not interested in names.",
      "I've told you before, I don't care about names - please continue."
    ]
  },
  {
    keywords: ['sorry'],
    responses: [
      "Please don't apologize.",
      "Apologies are not necessary.",
      "What feelings do you have when you apologize?",
      "I've told you that apologies are not required."
    ]
  },
  {
    keywords: ['dream'],
    responses: [
      "What does that dream suggest to you?",
      "Do you dream often?",
      "What persons appear in your dreams?",
      "Do you believe that dreams have something to do with your problems?"
    ]
  }
];

const DEFAULT_RESPONSES = [
  "I see. Please go on.",
  "What does that suggest to you?",
  "How does that make you feel?",
  "Can you elaborate on that?",
  "That is interesting. Tell me more.",
  "I'm not sure I understand you fully.",
  "Does that trouble you?"
];

const REFLECTIONS: Record<string, string> = {
  "am": "are",
  "was": "were",
  "i": "you",
  "i'd": "you would",
  "i've": "you have",
  "i'll": "you will",
  "my": "your",
  "are": "am",
  "you've": "I have",
  "you'll": "I will",
  "your": "my",
  "yours": "mine",
  "you": "me",
  "me": "you"
};

function reflect(text: string): string {
  const words = text.toLowerCase().split(/\s+/);
  const reflectedWords = words.map(word => REFLECTIONS[word] || word);
  return reflectedWords.join(' ');
}

export function getElizaResponse(input: string): string {
  const cleanInput = input.toLowerCase().trim();

  if (!cleanInput) {
    return "Please say something.";
  }

  for (const rule of ELIZA_RULES) {
    for (const keyword of rule.keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(cleanInput)) {
        const responseTemplate = rule.responses[Math.floor(Math.random() * rule.responses.length)];
        
        // Some keywords should capture what follows, others shouldn't
        const captureRest = ['i am', 'im', 'i feel', 'can you', 'can i', 'why dont you', 'why cant i', 'always', 'everyone', 'everybody', 'nobody', 'noone', 'dream'].includes(keyword);
        
        if (captureRest) {
          const restRegex = new RegExp(`\\b${keyword}\\b\\s*(.*)`, 'i');
          const match = cleanInput.match(restRegex);
          const rest = match && match[1] ? match[1].trim() : '';
          if (rest) {
            return responseTemplate.replace('{0}', reflect(rest));
          }
        }
        
        return responseTemplate.replace('{0}', keyword);
      }
    }
  }

  // Fallback to default responses
  return DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)];
}
