import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EmojiEvent, PlayerColor, COLOR_HEX } from '../lib/ludoEngine.js';
import { sounds } from '../lib/audioEffects.js';
import {
  EMOJI_CATEGORIES,
  QUICK_MESSAGE_CATEGORIES,
  QUICK_FAVORITE_REACTIONS,
} from '../lib/socialInteractions.js';
import {
  STICKERS,
  STICKER_CATEGORIES,
  getStickerById,
  StickerCategory,
} from '../lib/stickers.js';
import { Smile, Send, X, Sparkles, Flame, MessageSquare, Image as ImageIcon } from 'lucide-react';

interface AnimatedEmojiOverlayProps {
  events: EmojiEvent[];
  onSendEmoji: (emoji: string, text?: string, stickerId?: string) => void;
  playerColor?: PlayerColor;
  disabled?: boolean;
}

interface ActivePlayerReaction {
  id: string;
  senderName: string;
  senderColor: PlayerColor;
  emoji: string;
  text?: string;
  stickerId?: string;
  timestamp: number;
}

interface QuickEmojiBarProps {
  onSendEmoji: (emoji: string, text?: string, stickerId?: string) => void;
  disabled?: boolean;
}

type SocialTab = 'emojis' | 'stickers' | 'messages';

export const QuickEmojiBar: React.FC<QuickEmojiBarProps> = ({
  onSendEmoji,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SocialTab>('stickers');
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState<string>('basic');
  const [selectedStickerCategory, setSelectedStickerCategory] = useState<StickerCategory>('ludo');
  const [selectedMsgCategory, setSelectedMsgCategory] = useState<string>('ludo');

  const [selectedEmoji, setSelectedEmoji] = useState('🔥');
  const [selectedStickerId, setSelectedStickerId] = useState<string | undefined>('ludo_six_again');
  const [customText, setCustomText] = useState('');

  const handleQuickSend = (emoji: string, text?: string, stickerId?: string) => {
    if (disabled) return;
    if (stickerId) {
      sounds.playStickerPop();
    } else {
      sounds.playEmojiPop();
    }
    onSendEmoji(emoji, text, stickerId);
    if (isOpen) {
      setIsOpen(false);
      setCustomText('');
    }
  };

  const currentSticker = selectedStickerId ? getStickerById(selectedStickerId) : undefined;

  return (
    <div className="relative z-30 flex items-center justify-center w-full px-1">
      {/* Quick Reactions Bar - Exact existing container dimensions */}
      <div className="flex items-center justify-between w-full p-1 sm:p-1.5 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-slate-800 shadow-md">
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {QUICK_FAVORITE_REACTIONS.map((item, idx) => {
            if (item.type === 'sticker') {
              const sticker = getStickerById(item.value);
              return (
                <button
                  key={`quick-${item.value}-${idx}`}
                  onClick={() => handleQuickSend('🔥', undefined, item.value)}
                  disabled={disabled}
                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-slate-800/80 hover:bg-slate-700/80 active:scale-90 transition-all shadow-inner border border-amber-500/30 cursor-pointer disabled:opacity-40 flex-shrink-0"
                  title={`Send ${sticker?.name || item.label}`}
                >
                  <div className="transform hover:scale-110 transition-transform duration-150">
                    {sticker ? sticker.render(22) : '🎲'}
                  </div>
                </button>
              );
            }

            return (
              <button
                key={`quick-emoji-${item.value}-${idx}`}
                onClick={() => handleQuickSend(item.value)}
                disabled={disabled}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-slate-800/80 hover:bg-slate-700/80 active:scale-90 text-lg sm:text-xl transition-all shadow-inner border border-slate-700/60 cursor-pointer disabled:opacity-40 flex-shrink-0"
                title={`Send ${item.value}`}
              >
                <span className="transform hover:scale-125 transition-transform duration-150">
                  {item.value}
                </span>
              </button>
            );
          })}
        </div>

        {/* Open Extended Social Picker Button */}
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

      {/* Extended Emoji & Chat Modal - Exact existing dimensions max-w-[360px] sm:max-w-sm max-h-[85vh] */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-[360px] sm:max-w-sm rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 flex flex-col max-h-[85vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 p-3.5 sm:p-4 pb-2.5 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/30 text-amber-400 border border-amber-500/30 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm sm:text-base text-white truncate flex items-center gap-1.5">
                      <span>Social Reactions</span>
                      <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        RAGE
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate">Tease, celebrate & react</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white shrink-0 ml-1 cursor-pointer transition"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Top Navigation Tabs */}
              <div className="flex items-center p-1.5 mx-3 sm:mx-4 mt-2 bg-slate-950/80 rounded-2xl border border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab('stickers');
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'stickers'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Stickers</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab('emojis');
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'emojis'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smile className="w-3.5 h-3.5" />
                  <span>Emojis</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab('messages');
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'messages'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Shoutouts</span>
                </button>
              </div>

              {/* Scrollable Body with Category Filters */}
              <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-2.5 flex flex-col gap-2.5">
                {/* ================= TAB 1: STICKERS ================= */}
                {activeTab === 'stickers' && (
                  <div className="flex flex-col gap-2.5">
                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                      {STICKER_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setSelectedStickerCategory(cat.id);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 whitespace-nowrap transition-all border ${
                            selectedStickerCategory === cat.id
                              ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-xs'
                              : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Stickers Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      {STICKERS.filter((s) => s.category === selectedStickerCategory).map((sticker) => (
                        <button
                          key={sticker.id}
                          type="button"
                          onClick={() => {
                            setSelectedStickerId(sticker.id);
                            handleQuickSend('🔥', undefined, sticker.id);
                          }}
                          className="p-2 rounded-2xl bg-slate-850 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-400/60 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-sm hover:shadow-md cursor-pointer group"
                        >
                          <div className="transform group-hover:scale-110 transition-transform">
                            {sticker.render(44)}
                          </div>
                          <span className="text-[10px] font-black text-amber-300/90 text-center uppercase tracking-tight leading-none mt-1">
                            {sticker.caption}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ================= TAB 2: EMOJIS ================= */}
                {activeTab === 'emojis' && (
                  <div className="flex flex-col gap-2.5">
                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                      {EMOJI_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setSelectedEmojiCategory(cat.id);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 whitespace-nowrap transition-all border ${
                            selectedEmojiCategory === cat.id
                              ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-xs'
                              : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Emojis Grid */}
                    <div className="grid grid-cols-6 gap-1.5">
                      {EMOJI_CATEGORIES.find((c) => c.id === selectedEmojiCategory)?.emojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setSelectedEmoji(emoji);
                            setSelectedStickerId(undefined);
                            handleQuickSend(emoji);
                          }}
                          className={`h-11 flex items-center justify-center rounded-xl text-2xl border transition-all cursor-pointer ${
                            selectedEmoji === emoji && !selectedStickerId
                              ? 'bg-amber-500/30 border-amber-400 scale-105 shadow-md shadow-amber-500/20'
                              : 'bg-slate-800/70 border-slate-700/80 hover:bg-slate-750'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ================= TAB 3: QUICK SHOUTOUTS ================= */}
                {activeTab === 'messages' && (
                  <div className="flex flex-col gap-2.5">
                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                      {QUICK_MESSAGE_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setSelectedMsgCategory(cat.id);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 whitespace-nowrap transition-all border ${
                            selectedMsgCategory === cat.id
                              ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-xs'
                              : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Messages List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {QUICK_MESSAGE_CATEGORIES.find((c) => c.id === selectedMsgCategory)?.messages.map((msg) => (
                        <button
                          key={msg}
                          type="button"
                          onClick={() => {
                            handleQuickSend(selectedEmoji, msg, selectedStickerId);
                          }}
                          className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-slate-200 text-left transition-all hover:border-amber-400/60 truncate cursor-pointer active:scale-98 flex items-center justify-between"
                        >
                          <span className="truncate">{msg}</span>
                          <Send className="w-3 h-3 text-slate-500 opacity-60 ml-1 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Fixed Footer Custom Message & Send Input */}
              <div className="p-3 sm:p-3.5 border-t border-slate-800 bg-slate-900/95 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (customText.trim() || selectedEmoji || selectedStickerId) {
                      handleQuickSend(
                        selectedEmoji,
                        customText.trim() || undefined,
                        selectedStickerId
                      );
                    }
                  }}
                  className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-slate-700 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400/50 transition-all w-full box-border"
                >
                  <div
                    className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-slate-800/90 border border-slate-700/80 select-none overflow-hidden"
                    title={currentSticker ? currentSticker.name : selectedEmoji}
                  >
                    {currentSticker ? currentSticker.render(24) : <span className="text-xl">{selectedEmoji}</span>}
                  </div>
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Type a reaction message..."
                    maxLength={40}
                    className="flex-1 min-w-0 bg-transparent px-2.5 py-1.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={disabled}
                    className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/25 cursor-pointer flex items-center justify-center disabled:opacity-40"
                    title="Send reaction"
                  >
                    <Send className="w-4 h-4 text-slate-950" />
                  </button>
                </form>
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
  // Map of active reactions by player color to prevent overlapping and guarantee independent player anchoring
  const [activeReactions, setActiveReactions] = useState<Record<PlayerColor, ActivePlayerReaction | null>>({
    red: null,
    green: null,
    blue: null,
    yellow: null,
  });

  // Handle incoming reaction events
  useEffect(() => {
    if (events.length === 0) return;
    const latest = events[events.length - 1];
    const color = latest.senderColor;
    if (!color) return;

    const reaction: ActivePlayerReaction = {
      id: latest.id,
      senderName: latest.senderName,
      senderColor: color,
      emoji: latest.emoji,
      text: latest.text,
      stickerId: latest.stickerId,
      timestamp: Date.now(),
    };

    if (latest.stickerId) {
      sounds.playStickerPop();
    } else {
      sounds.playEmojiPop();
    }

    setActiveReactions((prev) => ({
      ...prev,
      [color]: reaction,
    }));

    // Auto cleanup after 2.8s
    const timer = setTimeout(() => {
      setActiveReactions((prev) => {
        if (prev[color]?.id === reaction.id) {
          return { ...prev, [color]: null };
        }
        return prev;
      });
    }, 2800);

    return () => clearTimeout(timer);
  }, [events]);

  // Player station anchor position coordinates (relative to viewport, anchored near 4 stations)
  const stationAnchors: Record<PlayerColor, string> = {
    red: 'top-14 left-4 sm:top-16 sm:left-10',
    green: 'top-14 right-4 sm:top-16 sm:right-10 items-end',
    blue: 'bottom-20 left-4 sm:bottom-22 sm:left-10',
    yellow: 'bottom-20 right-4 sm:bottom-22 sm:right-10 items-end',
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {(['red', 'green', 'blue', 'yellow'] as PlayerColor[]).map((color) => {
        const reaction = activeReactions[color];
        if (!reaction) return null;

        const colorTheme = COLOR_HEX[color] || COLOR_HEX.red;
        const sticker = reaction.stickerId ? getStickerById(reaction.stickerId) : undefined;
        const isRightSide = color === 'green' || color === 'yellow';

        return (
          <div
            key={reaction.id}
            className={`absolute flex flex-col ${stationAnchors[color]} transition-all duration-300 max-w-[200px] sm:max-w-[240px]`}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.3, y: 15 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.3, 1.15, 1, 0.85],
                y: [15, -4, 0, -8],
              }}
              transition={{ duration: 2.7, times: [0, 0.15, 0.85, 1], ease: 'easeOut' }}
              className={`flex flex-col ${isRightSide ? 'items-end text-right' : 'items-start text-left'}`}
            >
              {/* Sticker or Large Emoji Pop */}
              <div className="relative flex items-center justify-center p-1">
                {/* Aura Glow */}
                <div
                  className="absolute -inset-1.5 rounded-full blur-md opacity-60 animate-pulse pointer-events-none"
                  style={{ backgroundColor: colorTheme.primary }}
                />

                {sticker ? (
                  <div className="relative p-1.5 rounded-2xl bg-slate-900/90 border-2 shadow-2xl backdrop-blur-md" style={{ borderColor: colorTheme.primary }}>
                    {sticker.render(56)}
                    <span
                      className="block text-[9px] font-black uppercase text-center mt-0.5 px-1 rounded-sm text-white"
                      style={{ backgroundColor: colorTheme.primary }}
                    >
                      {sticker.caption}
                    </span>
                  </div>
                ) : (
                  <div className="relative text-4xl sm:text-5xl drop-shadow-2xl select-none filter">
                    {reaction.emoji}
                  </div>
                )}
              </div>

              {/* Speech Bubble (if text provided) */}
              {reaction.text && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`mt-1 px-3 py-1.5 rounded-2xl bg-slate-900/95 border shadow-xl backdrop-blur-md text-xs sm:text-sm font-bold text-white relative ${
                    isRightSide ? 'rounded-tr-xs' : 'rounded-tl-xs'
                  }`}
                  style={{ borderColor: colorTheme.primary }}
                >
                  <span className="block text-[9px] font-extrabold uppercase opacity-80" style={{ color: colorTheme.primary }}>
                    {reaction.senderName}
                  </span>
                  <span>{reaction.text}</span>
                </motion.div>
              )}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
};
