import React, { useState } from 'react';
import { motion } from 'motion/react';
import { PlayerColor, COLOR_HEX, COLOR_ORDER } from '../lib/ludoEngine.js';
import { sounds } from '../lib/audioEffects.js';
import {
  Bot,
  Users,
  Globe,
  Sparkles,
  HelpCircle,
  Play,
  ArrowRight,
  ShieldAlert,
  Crown,
  Dice5,
} from 'lucide-react';

export interface BotGameConfig {
  playerName: string;
  playerColor: PlayerColor;
  botCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface PassAndPlayConfigInput {
  playerCount: number;
  players: Array<{ name: string; color: PlayerColor }>;
}

interface GameEntryScreenProps {
  onStartBotGame: (config: BotGameConfig) => void;
  onStartPassAndPlay: (config: PassAndPlayConfigInput) => void;
  onCreateOnlineRoom: (playerName: string, playerColor: PlayerColor) => void;
  onJoinOnlineRoom: (roomId: string, playerName: string) => void;
  isLoading?: boolean;
  errorMessage?: string | null;
  onOpenRules: () => void;
}

type GameMode = 'bot' | 'pass_play' | 'friends';

export const GameEntryScreen: React.FC<GameEntryScreenProps> = ({
  onStartBotGame,
  onStartPassAndPlay,
  onCreateOnlineRoom,
  onJoinOnlineRoom,
  isLoading = false,
  errorMessage = null,
  onOpenRules,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('friends');
  const [userName, setUserName] = useState<string>('Commander');
  const [userColor, setUserColor] = useState<PlayerColor>('red');
  const [botCount, setBotCount] = useState<number>(3);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // Pass & Play configuration
  const [passPlayCount, setPassPlayCount] = useState<number>(4);
  const [passPlayNames, setPassPlayNames] = useState<Record<PlayerColor, string>>({
    red: 'Player 1',
    blue: 'Player 2',
    yellow: 'Player 3',
    green: 'Player 4',
  });

  // Online Room tab
  const [onlineTab, setOnlineTab] = useState<'create' | 'join'>('create');
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const colors: PlayerColor[] = ['red', 'blue', 'yellow', 'green'];

  const handleModeSelect = (mode: GameMode) => {
    sounds.playClick();
    setSelectedMode(mode);
    setValidationError(null);
  };

  const handleStart = () => {
    sounds.playClick();
    setValidationError(null);

    const trimmedName = userName.trim();
    if (!trimmedName) {
      setValidationError('Please enter a username to continue.');
      return;
    }

    if (selectedMode === 'bot') {
      onStartBotGame({
        playerName: trimmedName,
        playerColor: userColor,
        botCount,
        difficulty,
      });
    } else if (selectedMode === 'pass_play') {
      const activeColors = COLOR_ORDER.slice(0, passPlayCount);
      const configuredPlayers = activeColors.map((c) => ({
        color: c,
        name: passPlayNames[c]?.trim() || `Player (${c.toUpperCase()})`,
      }));

      onStartPassAndPlay({
        playerCount: passPlayCount,
        players: configuredPlayers,
      });
    } else if (selectedMode === 'friends') {
      if (onlineTab === 'create') {
        onCreateOnlineRoom(trimmedName, userColor);
      } else {
        const cleanCode = roomCodeInput.trim().toUpperCase();
        if (!cleanCode) {
          setValidationError('Please enter the 8-character room code (e.g., ROOM-1234).');
          return;
        }
        onJoinOnlineRoom(cleanCode, trimmedName);
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-outfit select-none relative overflow-x-hidden">
      {/* Background Gradient & Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/15 via-rose-900/10 to-slate-950 -z-10" />
      <div className="fixed top-12 left-1/4 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-12 right-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-rose-500 to-indigo-600 p-0.5 shadow-lg shadow-rose-950/40 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="font-fredoka text-xl sm:text-2xl font-bold tracking-wide bg-gradient-to-r from-amber-200 via-rose-200 to-indigo-200 bg-clip-text text-transparent flex items-center gap-1.5">
              LUDO ROYAL
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Classic 4-Player Strategy Board Game</p>
          </div>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            onOpenRules();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700 transition shadow-sm active:scale-95"
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>Rules</span>
        </button>
      </header>

      {/* Main Form Content */}
      <main className="max-w-3xl mx-auto w-full my-auto py-4 flex flex-col gap-5">
        {/* Username input box */}
        <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800/80 p-4 sm:p-5 shadow-xl">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Your Player Profile
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={userName}
                maxLength={16}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your nickname..."
                className="w-full bg-slate-950/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm sm:text-base font-semibold text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
              />
              <span className="absolute right-3 top-3 text-[11px] text-slate-500 font-mono">
                {userName.length}/16
              </span>
            </div>

            {selectedMode !== 'pass_play' && (
              <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 font-bold px-2 uppercase">Color:</span>
                <div className="flex gap-1.5">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setUserColor(c);
                      }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        userColor === c
                          ? 'ring-2 ring-white scale-105 shadow-md shadow-slate-950'
                          : 'opacity-60 hover:opacity-100 hover:scale-95'
                      }`}
                      style={{ backgroundColor: COLOR_HEX[c].primary }}
                      title={`Select ${c.toUpperCase()}`}
                    >
                      {userColor === c && <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3 Game Mode Selector Cards */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Select Game Mode
            </label>
            <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              100% Fair Dice Engine
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Mode 1: Play with Friends */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleModeSelect('friends')}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[140px] relative overflow-hidden ${
                selectedMode === 'friends'
                  ? 'bg-gradient-to-br from-amber-950/90 via-slate-900 to-amber-950/60 border-amber-400 ring-2 ring-amber-500/40 shadow-lg shadow-amber-950/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                  <Globe className="w-5 h-5" />
                </div>
                {selectedMode === 'friends' && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-400/40">
                    Active
                  </span>
                )}
              </div>
              <div className="mt-3">
                <div className="font-fredoka text-base font-bold text-white tracking-wide">Play with Friends</div>
                <div className="text-[12px] text-slate-400 leading-snug mt-0.5">
                  Create or join real online rooms via shareable codes.
                </div>
              </div>
            </motion.button>

            {/* Mode 2: Play with Bot */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleModeSelect('bot')}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[140px] relative overflow-hidden ${
                selectedMode === 'bot'
                  ? 'bg-gradient-to-br from-indigo-950/90 via-slate-900 to-indigo-950/60 border-indigo-400 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-950/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                  <Bot className="w-5 h-5" />
                </div>
                {selectedMode === 'bot' && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/40">
                    Active
                  </span>
                )}
              </div>
              <div className="mt-3">
                <div className="font-fredoka text-base font-bold text-white tracking-wide">Play with Bot</div>
                <div className="text-[12px] text-slate-400 leading-snug mt-0.5">
                  Single player match against intelligent AI opponents.
                </div>
              </div>
            </motion.button>

            {/* Mode 3: Pass & Play */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleModeSelect('pass_play')}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between min-h-[140px] relative overflow-hidden ${
                selectedMode === 'pass_play'
                  ? 'bg-gradient-to-br from-emerald-950/90 via-slate-900 to-emerald-950/60 border-emerald-400 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-950/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                  <Users className="w-5 h-5" />
                </div>
                {selectedMode === 'pass_play' && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/40">
                    Active
                  </span>
                )}
              </div>
              <div className="mt-3">
                <div className="font-fredoka text-base font-bold text-white tracking-wide">Pass & Play</div>
                <div className="text-[12px] text-slate-400 leading-snug mt-0.5">
                  Local multiplayer on 1 device. 100% human players, 0 bots.
                </div>
              </div>
            </motion.button>
          </div>
        </div>

        {/* Dynamic Mode Settings Panel */}
        <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl">
          {selectedMode === 'bot' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white font-fredoka tracking-wide">AI Opponents Configuration</h3>
                  <p className="text-[12px] text-slate-400">Choose how many bot players and their strategy level.</p>
                </div>
                <Bot className="w-5 h-5 text-indigo-400" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Opponents Count
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setBotCount(num);
                        }}
                        className={`py-2 rounded-xl text-xs sm:text-sm font-bold border transition ${
                          botCount === num
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                            : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {num} {num === 1 ? 'Bot (1v1)' : 'Bots'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Bot Difficulty
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['easy', 'medium', 'hard'] as const).map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setDifficulty(diff);
                        }}
                        className={`py-2 rounded-xl text-xs sm:text-sm font-bold capitalize border transition ${
                          difficulty === diff
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                            : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedMode === 'pass_play' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white font-fredoka tracking-wide">Pass & Play Setup</h3>
                  <p className="text-[12px] text-slate-400">
                    Each seat is controlled by a human sharing this device. Zero bots.
                  </p>
                </div>
                <Users className="w-5 h-5 text-emerald-400" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Number of Players
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 3, 4].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setPassPlayCount(count);
                      }}
                      className={`py-2 rounded-xl text-xs sm:text-sm font-bold border transition ${
                        passPlayCount === count
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                          : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {count} Players
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Custom Player Names
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {COLOR_ORDER.slice(0, passPlayCount).map((col, idx) => (
                    <div
                      key={col}
                      className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl p-2 focus-within:border-emerald-400 transition"
                    >
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: COLOR_HEX[col].primary }}
                      >
                        {idx + 1}
                      </div>
                      <input
                        type="text"
                        maxLength={16}
                        value={passPlayNames[col]}
                        onChange={(e) =>
                          setPassPlayNames((prev) => ({
                            ...prev,
                            [col]: e.target.value,
                          }))
                        }
                        placeholder={`Player ${idx + 1}`}
                        className="bg-transparent text-xs sm:text-sm text-white font-medium focus:outline-none w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedMode === 'friends' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white font-fredoka tracking-wide">Play with Friends Online</h3>
                  <p className="text-[12px] text-slate-400">
                    Host an online lobby or join an existing game using a room code.
                  </p>
                </div>
                <Globe className="w-5 h-5 text-amber-400" />
              </div>

              {/* Sub tabs: Create vs Join */}
              <div className="flex rounded-xl bg-slate-950/80 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setOnlineTab('create');
                    setValidationError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                    onlineTab === 'create'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create New Room
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setOnlineTab('join');
                    setValidationError(null);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                    onlineTab === 'join'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Join with Code
                </button>
              </div>

              {onlineTab === 'create' ? (
                <div className="space-y-3 pt-1">
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-200">
                    You will become the room host. Once created, you will get a unique shareable room code to invite your friends. Real players only, no bots.
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Enter 8-Character Room Code
                  </label>
                  <input
                    type="text"
                    value={roomCodeInput}
                    maxLength={10}
                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. ROOM-1234"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm sm:text-base font-mono font-bold tracking-widest text-amber-400 uppercase placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}
            </div>
          )}

          {/* Validation or API error display */}
          {(validationError || errorMessage) && (
            <div className="mt-3 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{validationError || errorMessage}</span>
            </div>
          )}
        </div>

        {/* Primary Start/Join Button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          disabled={isLoading}
          onClick={handleStart}
          className={`w-full py-3.5 sm:py-4 rounded-2xl font-fredoka text-base sm:text-lg font-bold tracking-wide shadow-xl flex items-center justify-center gap-2 transition ${
            selectedMode === 'bot'
              ? 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-400 hover:to-indigo-600 text-white shadow-indigo-950/60'
              : selectedMode === 'pass_play'
              ? 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white shadow-emerald-950/60'
              : 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 shadow-amber-950/60'
          } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Connecting...</span>
            </div>
          ) : selectedMode === 'bot' ? (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>Start Match Against AI</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          ) : selectedMode === 'pass_play' ? (
            <>
              <Users className="w-5 h-5" />
              <span>Start Pass & Play ({passPlayCount} Humans)</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          ) : onlineTab === 'create' ? (
            <>
              <Crown className="w-5 h-5" />
              <span>Create Lobby & Get Code</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          ) : (
            <>
              <Dice5 className="w-5 h-5" />
              <span>Join Friend's Room</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </motion.button>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center py-2 text-[11px] text-slate-500">
        Ludo Royal Engine v2.0 • Standard 52-Cell Track with Safe Stars & Consecutive-Six Detection
      </footer>
    </div>
  );
};
