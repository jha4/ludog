export interface EmojiCategory {
  id: string;
  label: string;
  icon: string;
  emojis: string[];
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'basic',
    label: 'Basic',
    icon: '😊',
    emojis: ['😂', '😭', '😊', '😡', '😱', '😮', '🤔', '🤦', '❤️', '👍', '👏', '🙄'],
  },
  {
    id: 'competitive',
    label: 'Battle',
    icon: '🥊',
    emojis: ['😏', '😈', '🤨', '😎', '✌️', '🥊', '🤯', '😬', '😤', '😳'],
  },
  {
    id: 'funny',
    label: 'Funny',
    icon: '🤣',
    emojis: ['🤣', '💀', '👻', '🤡', '🔥', '💥', '🙈', '😜', '🫠', '💩'],
  },
  {
    id: 'celebrate',
    label: 'Celebrate',
    icon: '🏆',
    emojis: ['🥳', '🏆', '👑', '🎆', '🎉', '💪', '⭐', '🥇', '🎯', '🎲'],
  },
];

// Curated 6 primary quick-access reactions for the bottom quick bar
export const QUICK_FAVORITE_REACTIONS = [
  { type: 'emoji' as const, value: '😂', label: 'Laugh' },
  { type: 'emoji' as const, value: '🔥', label: 'Fire' },
  { type: 'emoji' as const, value: '💀', label: 'Dead' },
  { type: 'sticker' as const, value: 'ludo_six_again', label: 'Six!' },
  { type: 'sticker' as const, value: 'rage_table_flip', label: 'Rage' },
  { type: 'emoji' as const, value: '👑', label: 'Crown' },
];

export interface QuickMessageCategory {
  id: string;
  label: string;
  icon: string;
  messages: string[];
}

export const QUICK_MESSAGE_CATEGORIES: QuickMessageCategory[] = [
  {
    id: 'ludo',
    label: 'Ludo',
    icon: '🎲',
    messages: [
      'Six again! 🎲',
      'Where is my six?! 😩',
      "You're going home! 🎯",
      'Got you! 🚀',
      'Stay in your safe zone! 🛡️',
      'One more move! 🏁',
      'Almost there! 💫',
      "Don't run away! 🏃",
      'I am waiting for you! 😈',
    ],
  },
  {
    id: 'rage',
    label: 'Rage',
    icon: '🤬',
    messages: [
      'Seriously?! 😤',
      'Unbelievable! 🤯',
      'What was that? 🎲',
      "I'm done! 💀",
      'Why me?! 😭',
      'This game is personal! 🤬',
      'Not again! 🤦',
      'You got lucky! 🍀',
      'Total Rage! 🌋',
    ],
  },
  {
    id: 'teasing',
    label: 'Teasing',
    icon: '😜',
    messages: [
      'Nice try! 😉',
      'Too slow! 🐢',
      'Not today! 🛡️',
      'Better luck next time! 👋',
      'I saw that! 👁️',
      'Oops! 🤭',
      'Are you serious? 🤨',
      'You wish! 😜',
      'Is that your best move? 😏',
      'Cry harder! 🍼',
    ],
  },
  {
    id: 'competitive',
    label: 'Battle',
    icon: '⚔️',
    messages: [
      'Bring it on! 🔥',
      "I'm coming! ⚡",
      'Watch your back! 👀',
      'No mercy! ⚔️',
      'My turn! 👑',
      "Can't catch me! 💨",
      'Challenge accepted! 🥊',
      'This is my game! 🏆',
    ],
  },
  {
    id: 'friendly',
    label: 'Friendly',
    icon: '🤝',
    messages: [
      'Good luck! 🍀',
      'Well played! 👏',
      'Nice move! 🎯',
      'Good game! 🤝',
      'Almost! 😅',
      'Your turn! ⏳',
      "Let's go! 🚀",
      'Thanks! 😊',
    ],
  },
  {
    id: 'celebrate',
    label: 'Celebrate',
    icon: '🏆',
    messages: [
      "Let's go! 🎉",
      'Easy win! 😎',
      "I'm unstoppable! 🚀",
      'Victory! 🏆',
      "That's how it's done! ✨",
      'Champion! 👑',
      'What a move! 💥',
    ],
  },
];
