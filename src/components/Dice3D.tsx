import React from 'react';
import { motion } from 'motion/react';
import { PlayerColor, COLOR_HEX } from '../lib/ludoEngine.js';

interface Dice3DProps {
  value: number | null;
  isRolling: boolean;
  canRoll: boolean;
  onRoll: () => void;
  color: PlayerColor;
  size?: 'sm' | 'md' | 'lg';
}

export const Dice3D: React.FC<Dice3DProps> = ({
  value,
  isRolling,
  canRoll,
  onRoll,
  color,
  size = 'md',
}) => {
  const colorTheme = COLOR_HEX[color] || COLOR_HEX.red;

  // Dice dimensions
  const sizeClasses = {
    sm: 'w-11 h-11 text-xs',
    md: 'w-14 h-14 sm:w-16 sm:h-16 text-sm',
    lg: 'w-20 h-20 text-base',
  }[size];

  // Dice pips coordinate layouts (3x3 grid)
  const renderPips = (num: number) => {
    // 9 potential pip positions: [row, col] from 0 to 2
    const pipPositions: Record<number, number[][]> = {
      1: [[1, 1]],
      2: [[0, 0], [2, 2]],
      3: [[0, 0], [1, 1], [2, 2]],
      4: [[0, 0], [0, 2], [2, 0], [2, 2]],
      5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
      6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
    };

    const currentPips = pipPositions[num] || pipPositions[1];

    return (
      <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-1.5 sm:p-2 pointer-events-none">
        {Array.from({ length: 9 }).map((_, i) => {
          const r = Math.floor(i / 3);
          const c = i % 3;
          const hasPip = currentPips.some(([pr, pc]) => pr === r && pc === c);

          return (
            <div key={i} className="flex items-center justify-center">
              {hasPip && (
                <div
                  className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shadow-inner"
                  style={{
                    backgroundColor: num === 6 ? '#ef4444' : '#1e293b',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* Glow pulse when ready to roll */}
      {canRoll && !isRolling && (
        <span
          className="absolute -inset-2 rounded-2xl opacity-60 animate-ping pointer-events-none"
          style={{ backgroundColor: colorTheme.primary }}
        />
      )}

      <motion.button
        type="button"
        onClick={canRoll && !isRolling ? onRoll : undefined}
        disabled={!canRoll || isRolling}
        whileHover={canRoll ? { scale: 1.08, y: -2 } : {}}
        whileTap={canRoll ? { scale: 0.92 } : {}}
        animate={
          isRolling
            ? {
                rotate: [0, 90, 180, 270, 360],
                scale: [1, 1.2, 0.9, 1.15, 1],
                y: [0, -12, 4, -8, 0],
              }
            : value !== null
            ? { scale: [0.85, 1.05, 1] }
            : {}
        }
        transition={{
          duration: isRolling ? 0.6 : 0.25,
          ease: 'easeInOut',
        }}
        className={`relative ${sizeClasses} rounded-2xl bg-gradient-to-br from-white via-slate-100 to-slate-300 border-2 sm:border-3 flex items-center justify-center shadow-xl transition-shadow select-none ${
          canRoll
            ? 'cursor-pointer hover:shadow-2xl'
            : 'cursor-default opacity-85'
        }`}
        style={{
          borderColor: colorTheme.primary,
          boxShadow: canRoll
            ? `0 10px 25px -5px ${colorTheme.primary}66, inset 0 2px 4px rgba(255,255,255,0.9)`
            : '0 4px 12px rgba(0,0,0,0.5)',
        }}
      >
        {isRolling ? (
          <div className="flex items-center justify-center font-black text-slate-800 text-lg animate-spin">
            🎲
          </div>
        ) : value !== null ? (
          renderPips(value)
        ) : (
          <div className="flex flex-col items-center justify-center">
            <span className="text-base sm:text-lg">🎲</span>
            <span className="text-[8px] font-black text-slate-800 uppercase tracking-tighter">Roll</span>
          </div>
        )}
      </motion.button>

      {/* Helper prompt below dice only for larger view */}
      {canRoll && !isRolling && size !== 'sm' && (
        <motion.span
          initial={{ opacity: 0, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-slate-900 shadow-md animate-bounce"
          style={{ backgroundColor: colorTheme.light }}
        >
          TAP TO ROLL
        </motion.span>
      )}
    </div>
  );
};
