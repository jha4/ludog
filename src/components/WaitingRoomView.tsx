import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GameState, COLOR_HEX } from '../lib/ludoEngine.js';
import { sounds } from '../lib/audioEffects.js';
import { Copy, Check, Users, Play, LogOut, Sparkles, Clock } from 'lucide-react';

interface WaitingRoomViewProps {
  gameState: GameState;
  isHost: boolean;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const WaitingRoomView: React.FC<WaitingRoomViewProps> = ({
  gameState,
  isHost,
  onStartGame,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(gameState.id).catch(() => {});
      setCopied(true);
      sounds.playClick();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const playerCount = gameState.players.length;
  const canStart = playerCount >= 2;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-outfit select-none">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950/80 to-slate-950" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl flex flex-col gap-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-400 flex items-center justify-center text-slate-950 shadow-md">
              <Users className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <h2 className="font-fredoka font-black text-xl text-white">Online Match Lobby</h2>
              <span className="text-xs text-blue-400 font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 animate-spin" /> Waiting for players to join...
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onLeaveRoom();
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Leave</span>
          </button>
        </div>

        {/* Shareable Room Code Card */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-2 text-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Share this room code with friends
          </span>
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl font-mono font-black tracking-widest text-amber-400">
              {gameState.id}
            </span>
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs flex items-center gap-1 cursor-pointer transition-all"
              title="Copy Room Code"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <span className="text-[11px] text-slate-500">
            Tell your friends to select "With Friends" → "Join Room" and paste this code.
          </span>
        </div>

        {/* Player Roster */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Connected Players ({playerCount}/4)
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {canStart ? 'Ready to launch!' : 'Need at least 2 players'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {gameState.players.map((p, idx) => {
              const theme = COLOR_HEX[p.color];
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-sm"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl border-2"
                    style={{ backgroundColor: theme.dark, borderColor: theme.primary }}
                  >
                    {p.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white truncate">{p.name}</span>
                      {idx === 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                          Host
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: theme.light }}>
                      {p.color}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Empty Slots */}
            {Array.from({ length: 4 - playerCount }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/30 border border-dashed border-slate-800 text-slate-600"
              >
                <div className="w-10 h-10 rounded-xl border border-dashed border-slate-800 flex items-center justify-center text-sm font-bold">
                  {playerCount + i + 1}
                </div>
                <div className="text-xs font-medium">Waiting for player...</div>
              </div>
            ))}
          </div>
        </div>

        {/* Host Controls */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
          {isHost ? (
            <button
              onClick={() => {
                sounds.playClick();
                onStartGame();
              }}
              disabled={!canStart}
              className={`w-full py-3.5 px-5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl cursor-pointer ${
                canStart
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/25 active:scale-[0.98]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{canStart ? 'Start Game Now' : 'Waiting for at least 1 more friend...'}</span>
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-slate-950/80 text-center text-xs text-slate-400">
              Waiting for the room host to start the match...
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
