import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { sounds } from '../lib/audioEffects.js';
import { BookOpen, X, Star, Shield, Trophy, Dice6, Zap, Sparkles } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 p-5 sm:p-6 shadow-2xl text-slate-100 flex flex-col gap-4 my-auto max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">How to Play Ludo</h2>
                <p className="text-xs text-slate-400">Classic rules & winning tactics</p>
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

          {/* Rules List */}
          <div className="flex flex-col gap-3 text-xs sm:text-sm text-slate-300">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-800">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 flex-shrink-0">
                <Dice6 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white block">1. Deploy on a 6</span>
                A token can only leave your corner base and enter the track when you roll a <strong className="text-amber-400">6</strong>.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-800">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 flex-shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white block">2. Bonus Rolls</span>
                Rolling a <strong className="text-amber-400">6</strong>, capturing an opponent piece, or getting a token into Home awards you an immediate bonus roll!
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-800">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white block">3. Safe Star Squares</span>
                There are <strong className="text-amber-400">8 Star Safe Zones</strong> on the board. Tokens resting on star tiles can never be captured by opponents!
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-800">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white block">4. Capturing Opponents</span>
                Landing directly on an opponent piece on any non-safe track cell captures it, sending it back to base and granting you a bonus turn.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-800">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 flex-shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white block">5. Exact Roll for Home</span>
                Tokens enter your color home column and must land on the central finish triangle with an exact dice roll count. The first player to bring all 4 tokens home wins!
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center transition-all cursor-pointer"
          >
            Got It, Let's Play!
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
