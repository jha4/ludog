import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  GameState,
  PlayerColor,
  Token,
  COLOR_HEX,
  COLOR_ORDER,
  SAFE_TRACK_POSITIONS,
  getTrackPosition,
} from '../lib/ludoEngine.js';
import {
  TRACK_GRID_COORDS,
  HOME_COLUMN_GRID_COORDS,
  getTokenBoardPercent,
} from '../lib/boardCoordinates.js';
import { Star, Trophy, Crown, ArrowDown, ArrowUp, ArrowRight, ArrowLeft } from 'lucide-react';

interface LudoBoardProps {
  gameState: GameState;
  onTokenClick: (tokenId: number) => void;
  isCurrentPlayerTurn: boolean;
  animatedTokenOverride?: { color: PlayerColor; tokenId: number; stepCount: number } | null;
}

export const LudoBoard: React.FC<LudoBoardProps> = ({
  gameState,
  onTokenClick,
  isCurrentPlayerTurn,
  animatedTokenOverride,
}) => {
  const { tokens, currentTurn, movableTokenIds, diceValue, hasRolled } = gameState;
  const [hoveredTokenId, setHoveredTokenId] = useState<number | null>(null);

  // Group tokens to detect multiple tokens on the same cell for stacking offsets
  const cellTokenGroups: Record<string, Array<{ token: Token; isMovable: boolean }>> = {};

  COLOR_ORDER.forEach((c) => {
    const colorTokens = tokens[c] || [];
    colorTokens.forEach((t) => {
      const isMovable = c === currentTurn && movableTokenIds.includes(t.id);
      // If animated override applies to this token, use its animated step
      const step = (animatedTokenOverride && animatedTokenOverride.color === c && animatedTokenOverride.tokenId === t.id)
        ? animatedTokenOverride.stepCount
        : t.stepCount;

      let key = `${c}-base-${t.id}`;
      if (step >= 56) {
        key = `${c}-home`;
      } else if (step > 50) {
        key = `${c}-col-${step}`;
      } else if (step >= 0) {
        const trackPos = getTrackPosition(c, step);
        key = `track-${trackPos}`;
      }

      if (!cellTokenGroups[key]) {
        cellTokenGroups[key] = [];
      }
      cellTokenGroups[key].push({ token: { ...t, stepCount: step }, isMovable });
    });
  });

  // Calculate destination preview for hovered or single movable token
  const previewTokenId = hoveredTokenId !== null ? hoveredTokenId : (movableTokenIds.length === 1 ? movableTokenIds[0] : null);
  let previewTargetCoord: { left: number; top: number } | null = null;
  if (previewTokenId !== null && diceValue !== null && isCurrentPlayerTurn) {
    const pToken = tokens[currentTurn].find((t) => t.id === previewTokenId);
    if (pToken) {
      const targetStep = pToken.state === 'base' ? 0 : pToken.stepCount + diceValue;
      if (targetStep <= 56) {
        previewTargetCoord = getTokenBoardPercent(currentTurn, pToken.id, targetStep, 0, 1);
      }
    }
  }

  // Check if player has tokens in base and rolled a 6
  const baseTokensMovable = isCurrentPlayerTurn && hasRolled && diceValue === 6 && movableTokenIds.some((id) => {
    const t = tokens[currentTurn].find((tok) => tok.id === id);
    return t && t.state === 'base';
  });

  const handleBaseClick = (color: PlayerColor) => {
    if (color !== currentTurn || !isCurrentPlayerTurn || !baseTokensMovable) return;
    // Find first movable base token
    const baseToken = tokens[currentTurn].find((t) => t.state === 'base' && movableTokenIds.includes(t.id));
    if (baseToken) {
      onTokenClick(baseToken.id);
    }
  };

  const safeTrackSet = SAFE_TRACK_POSITIONS;

  return (
    <div className="relative w-full aspect-square max-w-[340px] xs:max-w-[360px] sm:max-w-[410px] mx-auto select-none p-1 sm:p-2 bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl shadow-2xl border-2 sm:border-3 border-slate-700/80">
      {/* Board Base Surface (15x15 CSS Grid) */}
      <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-inner grid grid-cols-15 grid-rows-15">

        {/* ================= 4 BASE QUADRANTS ================= */}
        {/* Top-Left: Green Base (Rows 0-5, Cols 0-5) */}
        <div
          onClick={() => handleBaseClick('green')}
          className={`col-start-1 col-end-7 row-start-1 row-end-7 p-2 bg-gradient-to-br from-emerald-600 to-emerald-800 border-r-2 border-b-2 border-slate-950 relative flex flex-col justify-between shadow-lg transition-all ${
            currentTurn === 'green' && baseTokensMovable ? 'cursor-pointer ring-4 ring-emerald-300 animate-pulse' : ''
          }`}
        >
          <div className="flex items-center justify-between text-white/95 font-black text-[11px] sm:text-xs">
            <span className="flex items-center gap-1 font-fredoka">
              <span className="w-2 h-2 rounded-full bg-emerald-300 inline-block" />
              GREEN
            </span>
            <Crown className="w-3.5 h-3.5 text-emerald-200" />
          </div>

          {/* Inner 4-token Base Pit (Centered in 4x4) */}
          <div className="absolute inset-0 m-auto w-[66.6%] h-[66.6%] rounded-2xl bg-white/95 p-1.5 shadow-inner border border-emerald-900/30">
            <div className="relative w-full h-full">
              {[
                { top: '25%', left: '25%' },
                { top: '25%', left: '75%' },
                { top: '75%', left: '25%' },
                { top: '75%', left: '75%' },
              ].map((pos, idx) => (
                <div
                  key={idx}
                  style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}
                  className="absolute w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-600/20 border-2 border-emerald-600 flex items-center justify-center shadow-inner"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600/40" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top-Right: Yellow Base (Rows 0-5, Cols 10-15) */}
        <div
          onClick={() => handleBaseClick('yellow')}
          className={`col-start-10 col-end-16 row-start-1 row-end-7 p-2 bg-gradient-to-br from-amber-500 to-amber-700 border-l-2 border-b-2 border-slate-950 relative flex flex-col justify-between shadow-lg transition-all ${
            currentTurn === 'yellow' && baseTokensMovable ? 'cursor-pointer ring-4 ring-amber-300 animate-pulse' : ''
          }`}
        >
          <div className="flex items-center justify-between text-white/95 font-black text-[11px] sm:text-xs">
            <span className="flex items-center gap-1 font-fredoka">
              <span className="w-2 h-2 rounded-full bg-amber-200 inline-block" />
              YELLOW
            </span>
            <Crown className="w-3.5 h-3.5 text-amber-200" />
          </div>

          <div className="absolute inset-0 m-auto w-[66.6%] h-[66.6%] rounded-2xl bg-white/95 p-1.5 shadow-inner border border-amber-900/30">
            <div className="relative w-full h-full">
              {[
                { top: '25%', left: '25%' },
                { top: '25%', left: '75%' },
                { top: '75%', left: '25%' },
                { top: '75%', left: '75%' },
              ].map((pos, idx) => (
                <div
                  key={idx}
                  style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}
                  className="absolute w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center shadow-inner"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom-Left: Red Base (Rows 10-15, Cols 0-5) */}
        <div
          onClick={() => handleBaseClick('red')}
          className={`col-start-1 col-end-7 row-start-10 row-end-16 p-2 bg-gradient-to-br from-rose-600 to-rose-800 border-r-2 border-t-2 border-slate-950 relative flex flex-col justify-between shadow-lg transition-all ${
            currentTurn === 'red' && baseTokensMovable ? 'cursor-pointer ring-4 ring-rose-300 animate-pulse' : ''
          }`}
        >
          <div className="flex items-center justify-between text-white/95 font-black text-[11px] sm:text-xs">
            <span className="flex items-center gap-1 font-fredoka">
              <span className="w-2 h-2 rounded-full bg-rose-300 inline-block" />
              RED
            </span>
            <Crown className="w-3.5 h-3.5 text-rose-200" />
          </div>

          <div className="absolute inset-0 m-auto w-[66.6%] h-[66.6%] rounded-2xl bg-white/95 p-1.5 shadow-inner border border-rose-900/30">
            <div className="relative w-full h-full">
              {[
                { top: '25%', left: '25%' },
                { top: '25%', left: '75%' },
                { top: '75%', left: '25%' },
                { top: '75%', left: '75%' },
              ].map((pos, idx) => (
                <div
                  key={idx}
                  style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}
                  className="absolute w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-rose-600/20 border-2 border-rose-600 flex items-center justify-center shadow-inner"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-600/40" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom-Right: Blue Base (Rows 10-15, Cols 10-15) */}
        <div
          onClick={() => handleBaseClick('blue')}
          className={`col-start-10 col-end-16 row-start-10 row-end-16 p-2 bg-gradient-to-br from-blue-600 to-blue-800 border-l-2 border-t-2 border-slate-950 relative flex flex-col justify-between shadow-lg transition-all ${
            currentTurn === 'blue' && baseTokensMovable ? 'cursor-pointer ring-4 ring-blue-300 animate-pulse' : ''
          }`}
        >
          <div className="flex items-center justify-between text-white/95 font-black text-[11px] sm:text-xs">
            <span className="flex items-center gap-1 font-fredoka">
              <span className="w-2 h-2 rounded-full bg-blue-300 inline-block" />
              BLUE
            </span>
            <Crown className="w-3.5 h-3.5 text-blue-200" />
          </div>

          <div className="absolute inset-0 m-auto w-[66.6%] h-[66.6%] rounded-2xl bg-white/95 p-1.5 shadow-inner border border-blue-900/30">
            <div className="relative w-full h-full">
              {[
                { top: '25%', left: '25%' },
                { top: '25%', left: '75%' },
                { top: '75%', left: '25%' },
                { top: '75%', left: '75%' },
              ].map((pos, idx) => (
                <div
                  key={idx}
                  style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%)' }}
                  className="absolute w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-600/20 border-2 border-blue-600 flex items-center justify-center shadow-inner"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600/40" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= 52 COMMON TRACK CELLS ================= */}
        {TRACK_GRID_COORDS.map((coord, idx) => {
          const isSafe = safeTrackSet.has(idx);
          const isRedStart = idx === 0;
          const isBlueStart = idx === 13;
          const isYellowStart = idx === 26;
          const isGreenStart = idx === 39;

          let cellBg = 'bg-slate-800/95';
          let borderHighlight = 'border-slate-950/70';

          if (isRedStart) {
            cellBg = 'bg-rose-600 text-white';
            borderHighlight = 'border-rose-950';
          } else if (isBlueStart) {
            cellBg = 'bg-blue-600 text-white';
            borderHighlight = 'border-blue-950';
          } else if (isYellowStart) {
            cellBg = 'bg-amber-500 text-white';
            borderHighlight = 'border-amber-950';
          } else if (isGreenStart) {
            cellBg = 'bg-emerald-600 text-white';
            borderHighlight = 'border-emerald-950';
          }

          return (
            <div
              key={`track-${idx}`}
              style={{
                gridRowStart: coord.row + 1,
                gridColumnStart: coord.col + 1,
              }}
              className={`relative border ${borderHighlight} ${cellBg} flex items-center justify-center transition-colors shadow-sm`}
            >
              {/* Star on safe spots */}
              {isSafe && (
                <Star
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                    isRedStart || isBlueStart || isYellowStart || isGreenStart
                      ? 'text-white fill-white'
                      : 'text-amber-400 fill-amber-400 drop-shadow'
                  }`}
                />
              )}
            </div>
          );
        })}

        {/* ================= 4 HOME LANES ================= */}
        {/* Red Home Column (row 7, cols 1-5) */}
        {HOME_COLUMN_GRID_COORDS.red.map((coord, idx) => (
          <div
            key={`red-home-col-${idx}`}
            style={{
              gridRowStart: coord.row + 1,
              gridColumnStart: coord.col + 1,
            }}
            className="border border-rose-950/80 bg-gradient-to-r from-rose-500 to-rose-600 flex items-center justify-center shadow-inner"
          >
            {idx === 4 ? (
              <ArrowRight className="w-3.5 h-3.5 text-white/90" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-rose-200/60" />
            )}
          </div>
        ))}

        {/* Blue Home Column (col 7, rows 9-13) */}
        {HOME_COLUMN_GRID_COORDS.blue.map((coord, idx) => (
          <div
            key={`blue-home-col-${idx}`}
            style={{
              gridRowStart: coord.row + 1,
              gridColumnStart: coord.col + 1,
            }}
            className="border border-blue-950/80 bg-gradient-to-t from-blue-500 to-blue-600 flex items-center justify-center shadow-inner"
          >
            {idx === 4 ? (
              <ArrowUp className="w-3.5 h-3.5 text-white/90" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-blue-200/60" />
            )}
          </div>
        ))}

        {/* Yellow Home Column (row 7, cols 9-13) */}
        {HOME_COLUMN_GRID_COORDS.yellow.map((coord, idx) => (
          <div
            key={`yellow-home-col-${idx}`}
            style={{
              gridRowStart: coord.row + 1,
              gridColumnStart: coord.col + 1,
            }}
            className="border border-amber-950/80 bg-gradient-to-l from-amber-400 to-amber-500 flex items-center justify-center shadow-inner"
          >
            {idx === 4 ? (
              <ArrowLeft className="w-3.5 h-3.5 text-white/90" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-amber-100/60" />
            )}
          </div>
        ))}

        {/* Green Home Column (col 7, rows 1-5) */}
        {HOME_COLUMN_GRID_COORDS.green.map((coord, idx) => (
          <div
            key={`green-home-col-${idx}`}
            style={{
              gridRowStart: coord.row + 1,
              gridColumnStart: coord.col + 1,
            }}
            className="border border-emerald-950/80 bg-gradient-to-b from-emerald-500 to-emerald-600 flex items-center justify-center shadow-inner"
          >
            {idx === 4 ? (
              <ArrowDown className="w-3.5 h-3.5 text-white/90" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-emerald-200/60" />
            )}
          </div>
        ))}

        {/* ================= CENTER 3X3 HOME FINISH ================= */}
        <div className="col-start-7 col-end-10 row-start-7 row-end-10 relative overflow-hidden bg-slate-950 border-2 border-slate-900 shadow-2xl">
          <div
            className="absolute inset-0 bg-emerald-600"
            style={{ clipPath: 'polygon(0 0, 100% 0, 50% 50%)' }}
          />
          <div
            className="absolute inset-0 bg-amber-500"
            style={{ clipPath: 'polygon(100% 0, 100% 100%, 50% 50%)' }}
          />
          <div
            className="absolute inset-0 bg-blue-600"
            style={{ clipPath: 'polygon(0 100%, 100% 100%, 50% 50%)' }}
          />
          <div
            className="absolute inset-0 bg-rose-600"
            style={{ clipPath: 'polygon(0 0, 0 100%, 50% 50%)' }}
          />

          <div className="absolute inset-0 m-auto w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-slate-950/90 border-2 border-amber-400 flex items-center justify-center shadow-lg z-10">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400 animate-pulse" />
          </div>
        </div>

      </div>

      {/* ================= DESTINATION TARGET PREVIEW ================= */}
      {previewTargetCoord && (
        <div
          style={{
            left: `${previewTargetCoord.left}%`,
            top: `${previewTargetCoord.top}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className="absolute w-[6.8%] aspect-square rounded-full border-3 border-amber-400 bg-amber-400/30 animate-ping pointer-events-none z-15"
        />
      )}

      {/* ================= DYNAMIC 3D TOKENS LAYER ================= */}
      <div className="absolute inset-0 pointer-events-none p-1 sm:p-2">
        <div className="relative w-full h-full">
          {Object.entries(cellTokenGroups).flatMap(([groupKey, groupTokens]) => {
            const stackTotal = groupTokens.length;

            return groupTokens.map(({ token, isMovable }, stackIndex) => {
              const coords = getTokenBoardPercent(
                token.color,
                token.id,
                token.stepCount,
                stackIndex,
                stackTotal
              );
              const colorTheme = COLOR_HEX[token.color] || COLOR_HEX.red;

              return (
                <motion.div
                  key={`${token.color}-${token.id}`}
                  initial={false}
                  animate={{
                    left: `${coords.left}%`,
                    top: `${coords.top}%`,
                    scale: isMovable ? [1, 1.15, 1] : 1,
                    y: isMovable ? [0, -7, 0] : 0,
                  }}
                  transition={{
                    left: { type: 'spring', stiffness: 350, damping: 26 },
                    top: { type: 'spring', stiffness: 350, damping: 26 },
                    scale: { repeat: isMovable ? Infinity : 0, duration: 1.1, ease: 'easeInOut' },
                    y: { repeat: isMovable ? Infinity : 0, duration: 1.1, ease: 'easeInOut' },
                  }}
                  style={{
                    transform: 'translate(-50%, -50%)',
                  }}
                  onMouseEnter={() => setHoveredTokenId(token.id)}
                  onMouseLeave={() => setHoveredTokenId(null)}
                  onClick={() => {
                    if (isMovable && isCurrentPlayerTurn) {
                      onTokenClick(token.id);
                    }
                  }}
                  className={`absolute w-[6.4%] aspect-square flex items-center justify-center z-25 ${
                    isMovable && isCurrentPlayerTurn ? 'pointer-events-auto cursor-pointer' : ''
                  }`}
                >
                  {/* Expanded Tap Hitbox for mobile fingers (42px hitbox) */}
                  <div className="absolute -inset-2.5 sm:-inset-3 z-30 pointer-events-auto" />

                  {/* 3D Glossy Styled Token */}
                  <div
                    className={`relative w-full h-full rounded-full flex items-center justify-center shadow-xl transition-all ${
                      isMovable
                        ? 'ring-4 ring-amber-300 ring-offset-1 ring-offset-slate-900 shadow-amber-400/60 scale-105'
                        : 'shadow-black/80'
                    }`}
                    style={{
                      background: `radial-gradient(circle at 35% 30%, ${colorTheme.light}, ${colorTheme.primary} 60%, ${colorTheme.dark} 100%)`,
                      border: `1.5px solid ${colorTheme.light}`,
                    }}
                  >
                    {/* Inner Cap with number */}
                    <div className="w-[55%] h-[55%] rounded-full bg-white/25 border border-white/60 flex items-center justify-center shadow-inner">
                      <span className="text-[8px] sm:text-[10px] font-black text-white drop-shadow">
                        {token.id + 1}
                      </span>
                    </div>

                    {/* Movable Pulsing Halo */}
                    {isMovable && (
                      <span
                        className="absolute -inset-1.5 rounded-full opacity-75 animate-ping pointer-events-none"
                        style={{ backgroundColor: colorTheme.light }}
                      />
                    )}
                  </div>
                </motion.div>
              );
            });
          })}
        </div>
      </div>
    </div>
  );
};
