import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EmojiEvent, PlayerColor, COLOR_HEX } from '../lib/ludoEngine.js';
import { sounds } from '../lib/audioEffects.js';
import { Smile, Send, X, Sparkles } from 'lucide-react';

interface AnimatedEmojiOverlayProps {
  events: EmojiEvent[];
  onSendEmoji: (emoji: string, text?: string) => void;
  playerColor?: PlayerColor;
  disabled?: boolean;
}

interface FloatingEmojiInstance {
  id: string;
  emoji: string;
  text?: string;
  senderName: string;
  senderColor: PlayerColor;
  startX: number; // percentage 0-100
  startY: number; // percentage 0-100
  createdAt: number;
}

// Predefined quick reactions
export const QUICK_EMOJIS = ['😂', '🔥', '👑', '🥳', '💀', '🎲', '🎯', '⚡', '😭', '👏'];

export const QUICK_MESSAGES = [
  'Good luck! 🍀',
  'Nice move! 🎯',
  'Ouch! 💥',
  'Almost home! 🏁',
  'Hurry up! ⏰',
  'Well played! 👏',
];

interface QuickEmojiBarProps {
  onSendEmoji: (emoji: string, text?: string) => void;
  disabled?: boolean;
}

export const QuickEmojiBar: React.FC<QuickEmojiBarProps> = ({
  onSendEmoji,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customText, setCustomText] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😂');

  const handleSend = (emoji: string, text?: string) => {
    if (disabled) return;
    sounds.playClick();
    onSendEmoji(emoji, text);
    if (isOpen) {
      setIsOpen(false);
      setCustomText('');
    }
  };

  return (
    <div className="relative z-30 flex items-center justify-center w-full px-1">
      {/* Quick Reactions Bar */}
      <div className="flex items-center justify-between w-full p-1 sm:p-1.5 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-slate-800 shadow-md">
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {QUICK_EMOJIS.slice(0, 6).map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSend(emoji)}
              disabled={disabled}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-slate-850 hover:bg-slate-750 active:scale-90 text-lg sm:text-xl transition-all shadow-inner border border-slate-700/60 cursor-pointer disabled:opacity-40 flex-shrink-0"
              title={`Send ${emoji}`}
            >
              <span className="transform hover:scale-125 transition-transform duration-150">
                {emoji}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            setIsOpen(true);
          }}
          className="ml-1.5 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-amber-400 border border-amber-500/40 transition-all cursor-pointer shadow-sm flex-shrink-0"
          title="Open Chat & Reactions"
        >
          <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Extended Emoji & Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-[360px] sm:max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-4 sm:p-5 shadow-2xl text-slate-100 flex flex-col gap-3.5 sm:gap-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm sm:text-base text-white truncate">Reactions & Chat</h3>
                    <p className="text-[11px] sm:text-xs text-slate-400 truncate">Send animated emojis to all players</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white shrink-0 ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Emoji Grid */}
              <div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Animated Emojis
                </span>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`h-10 sm:h-12 flex items-center justify-center rounded-2xl text-xl sm:text-2xl border transition-all cursor-pointer ${
                        selectedEmoji === emoji
                          ? 'bg-amber-500/30 border-amber-400 scale-105 shadow-md shadow-amber-500/20'
                          : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Chat Shoutouts */}
              <div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Quick Shoutouts
                </span>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  {QUICK_MESSAGES.map((msg) => (
                    <button
                      key={msg}
                      onClick={() => handleSend(selectedEmoji, msg)}
                      className="px-2.5 sm:px-3 py-2 text-xs font-medium rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700 text-slate-200 text-left transition-all hover:border-slate-500 truncate"
                    >
                      {msg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Message Input */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800 w-full">
                <div className="text-xl sm:text-2xl p-1.5 sm:p-2 rounded-xl bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center">
                  {selectedEmoji}
                </div>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Type a reaction..."
                  maxLength={40}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (customText.trim() || selectedEmoji)) {
                      handleSend(selectedEmoji, customText.trim() || undefined);
                    }
                  }}
                  className="flex-1 min-w-0 rounded-xl bg-slate-800/90 border border-slate-700 px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  onClick={() => handleSend(selectedEmoji, customText.trim() || undefined)}
                  className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/30 cursor-pointer shrink-0 flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AnimatedEmojiOverlay: React.FC<AnimatedEmojiOverlayProps> = ({
  events,
}) => {
  const [activeFloating, setActiveFloating] = useState<FloatingEmojiInstance[]>([]);

  // Handle new incoming emoji events
  useEffect(() => {
    if (events.length === 0) return;
    const latest = events[events.length - 1];

    // Determine origin coordinates based on sender color
    let startX = 50;
    let startY = 50;
    if (latest.senderColor === 'red') {
      startX = 20;
      startY = 80;
    } else if (latest.senderColor === 'blue') {
      startX = 80;
      startY = 80;
    } else if (latest.senderColor === 'yellow') {
      startX = 80;
      startY = 20;
    } else if (latest.senderColor === 'green') {
      startX = 20;
      startY = 20;
    }

    // Add random slight jitter to avoid exact overlap
    startX += (Math.random() - 0.5) * 12;
    startY += (Math.random() - 0.5) * 8;

    const instance: FloatingEmojiInstance = {
      id: latest.id,
      emoji: latest.emoji,
      text: latest.text,
      senderName: latest.senderName,
      senderColor: latest.senderColor,
      startX,
      startY,
      createdAt: Date.now(),
    };

    sounds.playEmojiPop();

    setActiveFloating((prev) => [...prev.slice(-8), instance]);

    const timer = setTimeout(() => {
      setActiveFloating((prev) => prev.filter((item) => item.id !== instance.id));
    }, 2800);

    return () => clearTimeout(timer);
  }, [events]);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      <AnimatePresence>
        {activeFloating.map((item) => {
          const colorTheme = COLOR_HEX[item.senderColor] || COLOR_HEX.red;
          return (
            <motion.div
              key={item.id}
              initial={{
                opacity: 0,
                scale: 0.2,
                x: `${item.startX}vw`,
                y: `${item.startY}vh`,
              }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.3, 1.4, 1.2, 0.8],
                x: [`${item.startX}vw`, `${item.startX + (Math.random() - 0.5) * 16}vw`],
                y: [`${item.startY}vh`, `${item.startY - 22}vh`],
                rotate: [0, -12, 12, -6, 0],
              }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 2.6, ease: 'easeOut' }}
              className="absolute flex flex-col items-center"
            >
              {/* Glow ring */}
              <div className="relative flex items-center justify-center">
                <div
                  className="absolute -inset-2 rounded-full blur-md opacity-70 animate-pulse"
                  style={{ backgroundColor: colorTheme.primary }}
                />
                <div className="relative text-5xl md:text-6xl drop-shadow-xl select-none filter">
                  {item.emoji}
                </div>
              </div>

              {/* Sender badge and optional text */}
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 flex flex-col items-center"
              >
                <span
                  className="px-2 py-0.5 text-xs font-bold rounded-full shadow-lg text-white border border-white/20"
                  style={{ backgroundColor: colorTheme.primary }}
                >
                  {item.senderName}
                </span>
                {item.text && (
                  <div className="mt-1 max-w-[200px] rounded-xl bg-slate-900/90 px-3 py-1.5 text-center text-xs font-semibold text-white shadow-xl backdrop-blur-md border border-slate-700/80">
                    "{item.text}"
                  </div>
                )}
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
