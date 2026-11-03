import React from 'react';

export type StickerCategory = 'troll' | 'rage' | 'victory' | 'funny' | 'ludo';

export interface StickerItem {
  id: string;
  name: string;
  category: StickerCategory;
  caption: string;
  render: (size?: number) => React.ReactNode;
}

export const STICKER_CATEGORIES: { id: StickerCategory; label: string; icon: string }[] = [
  { id: 'ludo', label: 'Ludo', icon: '🎲' },
  { id: 'rage', label: 'Rage', icon: '🔥' },
  { id: 'troll', label: 'Tease', icon: '😜' },
  { id: 'victory', label: 'Win', icon: '👑' },
  { id: 'funny', label: 'Funny', icon: '🍿' },
];

export const STICKERS: StickerItem[] = [
  // ================= 1. LUDO-SPECIFIC STICKERS =================
  {
    id: 'ludo_six_again',
    name: 'Six Again!',
    category: 'ludo',
    caption: 'SIX AGAIN!',
    render: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 40C8 30 16 16 26 10C24 16 28 20 32 20C38 12 50 14 52 24C56 34 46 54 32 54C18 54 14 46 12 40Z" fill="url(#fire_g1)" />
        <rect x="18" y="22" width="28" height="28" rx="6" fill="#0F172A" stroke="#F59E0B" strokeWidth="2.5" />
        <circle cx="25" cy="29" r="2.5" fill="#FBBF24" />
        <circle cx="39" cy="29" r="2.5" fill="#FBBF24" />
        <circle cx="25" cy="36" r="2.5" fill="#FBBF24" />
        <circle cx="39" cy="36" r="2.5" fill="#FBBF24" />
        <circle cx="25" cy="43" r="2.5" fill="#FBBF24" />
        <circle cx="39" cy="43" r="2.5" fill="#FBBF24" />
        <defs>
          <linearGradient id="fire_g1" x1="32" y1="10" x2="32" y2="54" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F59E0B" />
            <stop offset="0.5" stopColor="#EF4444" />
            <stop offset="1" stopColor="#991B1B" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    id: 'ludo_token_captured',
    name: 'Captured!',
    category: 'ludo',
    caption: 'SEND HIM HOME!',
    render: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="26" fill="#EF4444" fillOpacity="0.15" stroke="#EF4444" strokeWidth="2" strokeDasharray="4 3" />
        <line x1="32" y1="6" x2="32" y2="58" stroke="#EF4444" strokeWidth="2" />
        <line x1="6" y1="32" x2="58" y2="32" stroke="#EF4444" strokeWidth="2" />
        <circle cx="32" cy="32" r="14" fill="#EF4444" stroke="#7F1D1D" strokeWidth="2" />
        <path d="M26 26L38 38M38 26L26 38" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'ludo_safe_zone',
    name: 'Safe Zone!',
    category: 'ludo',
    caption: 'CANNOT TOUCH!',
    render: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 8L50 16V32C50 44 42 52 32 56C22 52 14 44 14 32V16L32 8Z" fill="#10B981" stroke="#064E3B" strokeWidth="2.5" />
        <polygon points="32,20 35,27 42,28 37,33 39,40 32,36 25,40 27,33 22,28 29,27" fill="#FDE047" stroke="#854D0E" strokeWidth="1" />
      </svg>
    ),
  },
  {
    id: 'ludo_no_six',
    name: 'No Six For You',
    category: 'ludo',
    caption: 'LOCKED OUT!',
    render: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="14" y="14" width="36" height="36" rx="8" fill="#1E293B" stroke="#64748B" strokeWidth="2.5" />
        <circle cx="32" cy="32" r="4.5" fill="#EF4444" />
        <rect x="22" y="32" width="20" height="18" rx="3" fill="#DC2626" stroke="#450A0A" strokeWidth="2" />
        <path d="M26 32V25C26 21.7 28.7 19 32 19C35.3 19 38 21.7 38 25V32" stroke="#DC2626" strokeWidth="3" fill="none" />
      </svg>
    ),
  },
  {
    id: 'ludo_almost_home',
    name: 'Almost Home',
    category: 'ludo',
    caption: 'SO CLOSE!',
    render: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="24" fill="#3B82F6" stroke="#1E3A8A" strokeWidth="2.5" />
        <path d="M20 42L32 20L44 42H20Z" fill="#FDE047" stroke="#A16207" strokeWidth="2" />
        <circle cx="32" cy="35" r="3.5" fill="#1E3A8A" />
      </svg>
    ),
  },
  {
    id: 'ludo_sending_home',
    name: 'Bye Bye Token',
    category: 'ludo',
    caption: 'BACK TO BASE!',
    render: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="38" r="12" fill="#F97316" stroke="#7C2D12" strokeWidth="2" />
        <path d="M34 26L48 14M48 14H38M48 14V24" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 42L42 18" stroke="#EF4444" strokeWidth="3" strokeDasharray="2 3" />
      </svg>
    ),
  },

  // ================= 2. RAGE & FRUSTRATION =================
  {
    id: 'rage_table_flip',
    name: 'Table Flip',
    category: 'rage',
    caption: '(╯°□°)╯︵ ┻━┻',
    render: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="22" cy="24" r="10" fill="#EF4444" stroke="#7F1D1D" strokeWidth="2" />
        <path d="M18 22L26 26" stroke="#7F1D1D" strokeWidth="2" strokeLinecap="round" />
        <circle cx="20" cy="22" r="1.5" fill="white" />
        <circle cx="25" cy="22" r="1.5" fill="white" />
        <path d="M19 28C21 26 24 26 26 28" stroke="#7F1D1D" strokeWidth="2" strokeLinecap="round" />
        {/* Flying table */}
        <path d="M32 16L50 24L44 28L26 20L32 16Z" fill="#F59E0B" stroke="#78350F" strokeWidth="2" />
        <line x1="34" y1="20" x2="30" y2="34" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="46" y1="26" x2="42" y2="40" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
        {/* Speed lines */}
        <path d="M48 10L56 16" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
        <path d="M52 28L58 32" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'rage_exploding_head',
    name: 'Exploding Rage',
    category: 'rage',
    caption: 'MIND EXPLODED!',
    render: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 26C10 18 20 8 32 6C44 8 54 18 50 26C54 32 46 36 32 36C18 36 10 32 14 26Z" fill="#F97316" />
        <circle cx="32" cy="40" r="16" fill="#DC2626" stroke="#7F1D1D" strokeWidth="2" />
        <circle cx="26" cy="38" r="2" fill="white" />
        <circle cx="38" cy="38" r="2" fill="white" />
        <path d="M26 46C28 44 36 44 38 46" stroke="#450A0A" strokeWidth="2.5" strokeLinecap="round" />
        {/* Fire sparks */}
        <circle cx="20" cy="10" r="2.5" fill="#FBBF24" />
        <circle cx="44" cy="8" r="3" fill="#FBBF24" />
        <circle cx="32" cy="4" r="2" fill="#EF4444" />
      </svg>
    ),
  },
  {
    id: 'rage_fire_mode',
    name: 'Full Rage Mode',
    category: 'rage',
    caption: 'BURNING UP!',
    render: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 6C36 18 52 24 50 42C48 54 38 58 32 58C26 58 16 54 14 42C12 24 28 18 32 6Z" fill="#EF4444" stroke="#991B1B" strokeWidth="2" />
        <path d="M32 22C34 28 42 32 40 44C38 50 34 52 32 52C30 52 26 50 24 44C22 32 30 28 32 22Z" fill="#FBBF24" />
        <circle cx="28" cy="40" r="2" fill="#7F1D1D" />
        <circle cx="36" cy="40" r="2" fill="#7F1D1D" />
      </svg>
    ),
  },
  {
    id: 'rage_unbelievable',
    name: 'Unbelievable!',
    category: 'rage',
    caption: 'HOW?!?',
    render: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="34" r="20" fill="#EA580C" stroke="#7C2D12" strokeWidth="2.5" />
        <ellipse cx="25" cy="30" rx="3.5" ry="5" fill="white" />
        <ellipse cx="39" cy="30" rx="3.5" ry="5" fill="white" />
        <circle cx="25" cy="30" r="1.5" fill="#431407" />
        <circle cx="39" cy="30" r="1.5" fill="#431407" />
        <ellipse cx="32" cy="42" rx="6" ry="7" fill="#431407" />
        {/* Hands on head */}
        <path d="M12 24C16 16 22 16 24 20" stroke="#7C2D12" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M52 24C48 16 42 16 40 20" stroke="#7C2D12" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    ),
  },

  // ================= 3. TROLL & TEASE =================
  {
    id: 'troll_cry_harder',
    name: 'Cry Harder',
    category: 'troll',
    caption: 'CRY HARDER! 🍼',
    render: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="22" fill="#FBBF24" stroke="#B45309" strokeWidth="2.5" />
        {/* Smug squint eyes */}
        <path d="M22 28C24 26 28 26 30 28" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
        <path d="M34 28C36 26 40 26 42 28" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
        {/* Smug grin */}
        <path d="M24 38C28 44 38 44 42 38" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
        {/* Baby bottle */}
        <rect x="42" y="34" width="8" height="14" rx="2" fill="#60A5FA" stroke="#1E40AF" strokeWidth="1.5" />
        <rect x="44" y="30" width="4" height="4" rx="1" fill="#F87171" />
      </svg>
    ),
  },
  {
    id: 'troll_nice_try',
    name: 'Nice Try',
    category: 'troll',
    caption: 'NICE TRY! 😉',
    render: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="22" fill="#FBBF24" stroke="#B45309" strokeWidth="2.5" />
        {/* Winking left eye */}
        <path d="M22 30L28 30" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
        {/* Open right eye */}
        <circle cx="38" cy="30" r="3" fill="#78350F" />
        {/* Cheeky smirk */}
        <path d="M26 40C32 44 40 40 42 36" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
        {/* Wagging finger */}
        <path d="M44 26L48 18C48.5 16.5 50.5 16.5 51 18L51 28" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'troll_pointing_laugh',
    name: 'Pointing & Laughing',
    category: 'troll',
    caption: 'HAHAHAHA!',
    render: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="20" fill="#FBBF24" stroke="#B45309" strokeWidth="2.5" />
        {/* XD eyes */}
        <path d="M20 26L26 30L20 34" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M38 26L32 30L38 34" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M22 38C26 44 34 44 38 38Z" fill="#78350F" />
        {/* Pointing hand */}
        <path d="M42 38L56 34M56 34L50 30M56 34L50 38" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'troll_sarcastic_clap',
    name: 'Slow Clap',
    category: 'troll',
    caption: 'SLOW CLAP 👏',
    render: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="28" r="18" fill="#FBBF24" stroke="#B45309" strokeWidth="2.5" />
        <line x1="24" y1="26" x2="28" y2="26" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="36" y1="26" x2="40" y2="26" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="27" y1="34" x2="37" y2="34" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
        {/* Clapping hands below */}
        <path d="M22 52L30 44L36 50" stroke="#D97706" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M42 52L34 44L28 50" stroke="#D97706" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },

  // ================= 4. VICTORY & CELEBRATION =================
  {
    id: 'victory_king',
    name: 'King of Ludo',
    category: 'victory',
    caption: 'KING OF LUDO 👑',
    render: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="36" r="18" fill="#FBBF24" stroke="#B45309" strokeWidth="2.5" />
        {/* Sunglasses */}
        <rect x="22" y="32" width="9" height="7" rx="2" fill="#0F172A" />
        <rect x="33" y="32" width="9" height="7" rx="2" fill="#0F172A" />
        <line x1="30" y1="35" x2="34" y2="35" stroke="#0F172A" strokeWidth="2" />
        <path d="M27 45C30 48 34 48 37 45" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
        {/* Royal Crown */}
        <path d="M20 22L25 12L32 18L39 12L44 22H20Z" fill="#F59E0B" stroke="#78350F" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="25" cy="12" r="1.5" fill="#EF4444" />
        <circle cx="32" cy="18" r="1.5" fill="#3B82F6" />
        <circle cx="39" cy="12" r="1.5" fill="#10B981" />
      </svg>
    ),
  },
  {
    id: 'victory_too_easy',
    name: 'Too Easy',
    category: 'victory',
    caption: 'TOO EASY! 🥱',
    render: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="22" fill="#FBBF24" stroke="#B45309" strokeWidth="2.5" />
        <ellipse cx="24" cy="28" rx="2.5" ry="1.5" fill="#78350F" />
        <ellipse cx="40" cy="28" rx="2.5" ry="1.5" fill="#78350F" />
        {/* Yawn mouth */}
        <ellipse cx="32" cy="38" rx="5" ry="7" fill="#78350F" />
        {/* Zzz floating */}
        <path d="M46 16H52L46 22H52" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'victory_trophy',
    name: 'Champion Trophy',
    category: 'victory',
    caption: 'DOMINATED! 🏆',
    render: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 14H42V30C42 36 38 40 32 40C26 40 22 36 22 30V14Z" fill="#F59E0B" stroke="#92400E" strokeWidth="2.5" />
        <path d="M22 18H14C14 26 20 28 22 28" stroke="#92400E" strokeWidth="2.5" />
        <path d="M42 18H50C50 26 44 28 42 28" stroke="#92400E" strokeWidth="2.5" />
        <rect x="28" y="40" width="8" height="8" fill="#F59E0B" stroke="#92400E" strokeWidth="2" />
        <rect x="20" y="48" width="24" height="6" rx="2" fill="#B45309" stroke="#78350F" strokeWidth="2" />
        <polygon points="32,22 34,26 38,26 35,29 36,33 32,31 28,33 29,29 26,26 30,26" fill="#FEF08A" />
      </svg>
    ),
  },

  // ================= 5. FUNNY & SARCASTIC =================
  {
    id: 'funny_popcorn',
    name: 'Eating Popcorn',
    category: 'funny',
    caption: 'HERE FOR DRAMA 🍿',
    render: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="24" r="16" fill="#FBBF24" stroke="#B45309" strokeWidth="2" />
        <circle cx="27" cy="22" r="2.5" fill="#78350F" />
        <circle cx="37" cy="22" r="2.5" fill="#78350F" />
        <ellipse cx="32" cy="29" rx="3.5" ry="2" fill="#78350F" />
        {/* Popcorn bucket */}
        <path d="M22 36L26 56H38L42 36H22Z" fill="#EF4444" stroke="#991B1B" strokeWidth="2" />
        <line x1="28" y1="36" x2="30" y2="56" stroke="white" strokeWidth="2" />
        <line x1="36" y1="36" x2="34" y2="56" stroke="white" strokeWidth="2" />
        <circle cx="26" cy="34" r="3" fill="#FEF08A" />
        <circle cx="32" cy="33" r="3.5" fill="#FEF08A" />
        <circle cx="38" cy="34" r="3" fill="#FEF08A" />
      </svg>
    ),
  },
  {
    id: 'funny_sleeping',
    name: 'Hurry Up',
    category: 'funny',
    caption: 'WAKE ME UP! 😴',
    render: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="34" r="20" fill="#FBBF24" stroke="#B45309" strokeWidth="2.5" />
        <path d="M20 32C22 34 26 34 28 32" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M34 32C36 34 40 34 42 32" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="31" cy="42" rx="4" ry="5" fill="#78350F" />
        {/* Snot bubble */}
        <circle cx="37" cy="40" r="4.5" fill="#60A5FA" fillOpacity="0.7" stroke="#3B82F6" strokeWidth="1" />
        <path d="M44 14H50L44 20H50" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'funny_sweating',
    name: 'Nervous Sweat',
    category: 'funny',
    caption: 'SWEATING BULLETS! 😰',
    render: (size = 48) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="34" r="20" fill="#FBBF24" stroke="#B45309" strokeWidth="2.5" />
        <circle cx="23" cy="30" r="3" fill="#78350F" />
        <circle cx="37" cy="30" r="3" fill="#78350F" />
        {/* Wobbly nervous mouth */}
        <path d="M22 42C26 38 34 46 38 42" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />
        {/* Giant blue sweat drop */}
        <path d="M48 24C48 24 44 29 44 32C44 34.2 45.8 36 48 36C50.2 36 52 34.2 52 32C52 29 48 24 48 24Z" fill="#38BDF8" stroke="#0284C7" strokeWidth="1.5" />
      </svg>
    ),
  },
];

export function getStickerById(id: string): StickerItem | undefined {
  return STICKERS.find((s) => s.id === id);
}
