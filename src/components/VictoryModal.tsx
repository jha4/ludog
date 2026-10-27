import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { GameState, COLOR_HEX, PlayerColor } from '../lib/ludoEngine.js';
import { sounds } from '../lib/audioEffects.js';
import { Trophy, Crown, RotateCcw, Users, Share2, Sparkles } from 'lucide-react';

interface VictoryModalProps {
  gameState: GameState;
  onRestart: () => void;
  onNewGameSetup: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  gameState,
  onRestart,
  onNewGameSetup,
}) => {
  const { winner, rankings, players, status } = gameState;
  const isFinished = status === 'finished' || (rankings.length > 0 && rankings.length >= players.length - 1);

  useEffect(() => {
    if (isFinished) {
      sounds.playVictory();

      // Launch multi-stage festive confetti
      const end = Date.now() + 2.5 * 1000;
      const colors = ['#ef4444', '#10b981', '#eab308', '#3b82f6', '#f59e0b'];

      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [isFinished]);

  if (!isFinished || !winner) return null;

  const winnerPlayer = players.find((p) => p.color === winner);
  const winnerTheme = COLOR_HEX[winner] || COLOR_HEX.red;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-sm rounded-3xl bg-slate-900 border-2 border-amber-500/50 p-6 shadow-2xl text-slate-100 flex flex-col items-center text-center relative overflow-hidden"
        >
          {/* Top golden ray background effect */}
          <div
            className="absolute -top-24 -inset-x-0 h-48 rounded-full blur-3xl opacity-30"
            style={{ backgroundColor: winnerTheme.primary }}
          />

          {/* Trophy Header */}
          <div className="relative mb-3 flex items-center justify-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-xl shadow-amber-500/30 flex items-center justify-center">
              <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center">
                <Trophy className="w-10 h-10 text-amber-400 fill-amber-400 animate-pulse" />
              </div>
            </div>
            <Crown className="w-8 h-8 text-amber-400 fill-amber-400 absolute -top-4 -right-2 animate-bounce" />
          </div>

          <span className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Ludo Champion!
          </span>
          <h2 className="text-2xl font-black text-white mt-1">
            {winnerPlayer?.name} Won!
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {winnerPlayer?.type === 'bot'
              ? 'The AI Bot claimed the royal crown this round!'
              : 'Flawless strategy! All tokens reached home safely.'}
          </p>

          {/* Podium / Final Standings */}
          <div className="w-full mt-5 mb-5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left">
              Final Standings
            </span>
            <div className="flex flex-col gap-1.5">
              {rankings.map((color, idx) => {
                const player = players.find((p) => p.color === color);
                const theme = COLOR_HEX[color];
                const medal = idx === 0 ? '🥇 1st' : idx === 1 ? '🥈 2nd' : idx === 2 ? '🥉 3rd' : '4th';

                return (
                  <div
                    key={color}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{medal}</span>
                      <span
                        className="w-3 h-3 rounded-full border border-white/40"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <span className="text-xs font-bold text-white truncate max-w-[120px]">
                        {player?.name || color}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400">
                      4/4 Home
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-2.5">
            <button
              onClick={() => {
                sounds.playClick();
                onRestart();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Play Again (Rematch)
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                onNewGameSetup();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer border border-slate-700"
            >
              <Users className="w-4 h-4" />
              New Game Setup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
