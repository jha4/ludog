import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlayerColor, BotDifficulty, COLOR_HEX, COLOR_ORDER } from '../lib/ludoEngine.js';
import { sounds } from '../lib/audioEffects.js';
import { Bot, Users, Globe, Play, X, Shield, Sparkles } from 'lucide-react';

interface GameSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (config: {
    mode: 'single_player' | 'pass_and_play' | 'online_room';
    playerName: string;
    playerColor: PlayerColor;
    botCount: number;
    botDifficulty: BotDifficulty;
    roomId?: string;
  }) => void;
}

const AVATARS = ['😎', '🦁', '🐯', '🦅', '🐬', '🤠', '🤖', '👑', '⚡', '🔥'];

export const GameSetupModal: React.FC<GameSetupModalProps> = ({
  isOpen,
  onClose,
  onStartGame,
}) => {
  const [mode, setMode] = useState<'single_player' | 'pass_and_play' | 'online_room'>('single_player');
  const [playerName, setPlayerName] = useState('Player 1');
  const [playerColor, setPlayerColor] = useState<PlayerColor>('red');
  const [botCount, setBotCount] = useState<number>(3);
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');
  const [roomCode, setRoomCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    onStartGame({
      mode,
      playerName: playerName.trim() || 'Player 1',
      playerColor,
      botCount,
      botDifficulty,
      roomId: mode === 'online_room' && roomCode.trim() ? roomCode.trim().toUpperCase() : undefined,
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 p-5 sm:p-6 shadow-2xl text-slate-100 flex flex-col gap-5 my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Ludo Game Setup</h2>
                <p className="text-xs text-slate-400">Choose game mode, color and players</p>
              </div>
            </div>
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Mode Select Tabs */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Game Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setMode('single_player');
                  }}
                  className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 border text-center transition-all cursor-pointer ${
                    mode === 'single_player'
                      ? 'bg-amber-500/20 border-amber-400 text-white shadow-md shadow-amber-500/20 font-bold'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Bot className="w-5 h-5 text-amber-400" />
                  <span className="text-xs">Vs Bots</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setMode('pass_and_play');
                  }}
                  className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 border text-center transition-all cursor-pointer ${
                    mode === 'pass_and_play'
                      ? 'bg-amber-500/20 border-amber-400 text-white shadow-md shadow-amber-500/20 font-bold'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-5 h-5 text-amber-400" />
                  <span className="text-xs">Pass & Play</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setMode('online_room');
                  }}
                  className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 border text-center transition-all cursor-pointer ${
                    mode === 'online_room'
                      ? 'bg-amber-500/20 border-amber-400 text-white shadow-md shadow-amber-500/20 font-bold'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Globe className="w-5 h-5 text-amber-400" />
                  <span className="text-xs">Online Room</span>
                </button>
              </div>
            </div>

            {/* Player Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Your Nickname
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={16}
                required
                className="w-full rounded-xl bg-slate-800/90 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Color Preference */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Choose Color
              </label>
              <div className="grid grid-cols-4 gap-2">
                {COLOR_ORDER.map((c) => {
                  const theme = COLOR_HEX[c];
                  const isSelected = playerColor === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setPlayerColor(c);
                      }}
                      className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 border font-bold text-xs uppercase transition-all cursor-pointer ${
                        isSelected
                          ? 'border-white text-white shadow-lg scale-102 ring-2 ring-white/50'
                          : 'border-transparent text-slate-300 opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: theme.primary }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-white shadow-sm inline-block" />
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bots count (Only for Vs Bots or Online Room) */}
            {mode !== 'pass_and_play' && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Number of Bots
                  </label>
                  <span className="text-xs font-semibold text-amber-400">
                    {botCount} {botCount === 1 ? 'Bot (2 Players)' : `${botCount} Bots (4 Players)`}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setBotCount(count);
                      }}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        botCount === count
                          ? 'bg-slate-750 border-amber-400 text-amber-400'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {count === 1 ? '1 Bot (1v1)' : count === 2 ? '2 Bots (3P)' : '3 Bots (4P)'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bot Difficulty */}
            {mode === 'single_player' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Bot Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as BotDifficulty[]).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setBotDifficulty(diff);
                      }}
                      className={`py-2 rounded-xl text-xs font-bold capitalize border transition-all cursor-pointer ${
                        botDifficulty === diff
                          ? 'bg-slate-750 border-amber-400 text-amber-400 shadow-sm'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {diff === 'easy' ? '🌱 Easy' : diff === 'medium' ? '⚡ Normal' : '🔥 Hard'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Online Room Code (Optional for Online Room mode) */}
            {mode === 'online_room' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Join with Room Code (Optional)
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ROOM-1234 (Leave blank to create new)"
                  maxLength={12}
                  className="w-full rounded-xl bg-slate-800/90 border border-slate-700 px-3.5 py-2.5 text-sm text-white uppercase placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            )}

            {/* Launch Button */}
            <button
              type="submit"
              className="mt-2 w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              Start Game Now
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
