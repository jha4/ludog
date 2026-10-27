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
  TOKEN_DIAMETER_PCT,
} from '../lib/boardCoordinates.js';
import { Star, Trophy, Crown, ArrowDown, ArrowUp, ArrowRight, ArrowLeft, Rocket } from 'lucide-react';

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
  let previewTargetCoord: { left: number; top: number; centerX: number; centerY: number } | null = null;
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
            currentTurn === 'green' && baseTokensMovable ? 'cursor-pointer ring-4 ring-emerald-300 ring-inset animate-pulse' : ''
          }`}
        >
          <div className="flex items-center justify-between text-white/95 font-black text-[11px] sm:text-xs">
            <span className="flex items-center gap-1 font-fredoka">
              <span className="w-2 h-2 rounded-full bg-emerald-300 inline-block" />
              GREEN
            </span>
            <Crown className="w-3.5 h-3.5 text-emerald-200" />
          </div>

          {/* White Box containing the 4 circular pits */}
          <div className="absolute inset-0 m-auto w-[68%] h-[68%] rounded-2xl bg-white shadow-md border-2 border-emerald-800/40 grid grid-cols-2 grid-rows-2 p-2 gap-2">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="w-full h-full rounded-full bg-emerald-100 border-2 border-emerald-500/80 flex items-center justify-center shadow-inner"
              >
                <div className="w-3 h-3 rounded-full bg-emerald-500/30" />
              </div>
            ))}
          </div>

          {currentTurn === 'green' && baseTokensMovable && (
            <div className="absolute inset-x-2 bottom-2 z-20 flex justify-center pointer-events-none">
              <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black text-[9px] shadow-lg flex items-center gap-1 animate-bounce">
                <Rocket className="w-2.5 h-2.5" /> DEPLOY
              </span>
            </div>
          )}
        </div>

        {/* Top-Right: Yellow Base (Rows 0-5, Cols 10-15) */}
        <div
          onClick={() => handleBaseClick('yellow')}
          className={`col-start-10 col-end-16 row-start-1 row-end-7 p-2 bg-gradient-to-br from-amber-500 to-amber-700 border-l-2 border-b-2 border-slate-950 relative flex flex-col justify-between shadow-lg transition-all ${
            currentTurn === 'yellow' && baseTokensMovable ? 'cursor-pointer ring-4 ring-amber-300 ring-inset animate-pulse' : ''
          }`}
        >
          <div className="flex items-center justify-between text-white/95 font-black text-[11px] sm:text-xs">
            <span className="flex items-center gap-1 font-fredoka">
              <span className="w-2 h-2 rounded-full bg-amber-200 inline-block" />
              YELLOW
            </span>
            <Crown className="w-3.5 h-3.5 text-amber-200" />
          </div>

          <div className="absolute inset-0 m-auto w-[68%] h-[68%] rounded-2xl bg-white shadow-md border-2 border-amber-800/40 grid grid-cols-2 grid-rows-2 p-2 gap-2">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="w-full h-full rounded-full bg-amber-100 border-2 border-amber-500/80 flex items-center justify-center shadow-inner"
              >
                <div className="w-3 h-3 rounded-full bg-amber-500/30" />
              </div>
            ))}
          </div>

          {currentTurn === 'yellow' && baseTokensMovable && (
            <div className="absolute inset-x-2 bottom-2 z-20 flex justify-center pointer-events-none">
              <span className="px-2 py-0.5 rounded-full bg-amber-300 text-slate-950 font-black text-[9px] shadow-lg flex items-center gap-1 animate-bounce">
                <Rocket className="w-2.5 h-2.5" /> DEPLOY
              </span>
            </div>
          )}
        </div>

        {/* Bottom-Left: Red Base (Rows 10-15, Cols 0-5) */}
        <div
          onClick={() => handleBaseClick('red')}
          className={`col-start-1 col-end-7 row-start-10 row-end-16 p-2 bg-gradient-to-br from-rose-600 to-rose-800 border-r-2 border-t-2 border-slate-950 relative flex flex-col justify-between shadow-lg transition-all ${
            currentTurn === 'red' && baseTokensMovable ? 'cursor-pointer ring-4 ring-rose-300 ring-inset animate-pulse' : ''
          }`}
        >
          <div className="flex items-center justify-between text-white/95 font-black text-[11px] sm:text-xs">
            <span className="flex items-center gap-1 font-fredoka">
              <span className="w-2 h-2 rounded-full bg-rose-300 inline-block" />
              RED
            </span>
            <Crown className="w-3.5 h-3.5 text-rose-200" />
          </div>

          <div className="absolute inset-0 m-auto w-[68%] h-[68%] rounded-2xl bg-white shadow-md border-2 border-rose-800/40 grid grid-cols-2 grid-rows-2 p-2 gap-2">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="w-full h-full rounded-full bg-rose-100 border-2 border-rose-500/80 flex items-center justify-center shadow-inner"
              >
                <div className="w-3 h-3 rounded-full bg-rose-500/30" />
              </div>
            ))}
          </div>

          {currentTurn === 'red' && baseTokensMovable && (
            <div className="absolute inset-x-2 bottom-2 z-20 flex justify-center pointer-events-none">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-400 text-slate-950 font-black text-[9px] shadow-lg flex items-center gap-1 animate-bounce">
                <Rocket className="w-2.5 h-2.5" /> DEPLOY
              </span>
            </div>
          )}
        </div>

        {/* Bottom-Right: Blue Base (Rows 10-15, Cols 10-15) */}
        <div
          onClick={() => handleBaseClick('blue')}
          className={`col-start-10 col-end-16 row-start-10 row-end-16 p-2 bg-gradient-to-br from-blue-600 to-blue-800 border-l-2 border-t-2 border-slate-950 relative flex flex-col justify-between shadow-lg transition-all ${
            currentTurn === 'blue' && baseTokensMovable ? 'cursor-pointer ring-4 ring-blue-300 ring-inset animate-pulse' : ''
          }`}
        >
          <div className="flex items-center justify-between text-white/95 font-black text-[11px] sm:text-xs">
            <span className="flex items-center gap-1 font-fredoka">
              <span className="w-2 h-2 rounded-full bg-blue-300 inline-block" />
              BLUE
            </span>
            <Crown className="w-3.5 h-3.5 text-blue-200" />
          </div>

          <div className="absolute inset-0 m-auto w-[68%] h-[68%] rounded-2xl bg-white shadow-md border-2 border-blue-800/40 grid grid-cols-2 grid-rows-2 p-2 gap-2">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="w-full h-full rounded-full bg-blue-100 border-2 border-blue-500/80 flex items-center justify-center shadow-inner"
              >
                <div className="w-3 h-3 rounded-full bg-blue-500/30" />
              </div>
            ))}
          </div>

          {currentTurn === 'blue' && baseTokensMovable && (
            <div className="absolute inset-x-2 bottom-2 z-20 flex justify-center pointer-events-none">
              <span className="px-2 py-0.5 rounded-full bg-blue-300 text-slate-950 font-black text-[9px] shadow-lg flex items-center gap-1 animate-bounce">
                <Rocket className="w-2.5 h-2.5" /> DEPLOY
              </span>
            </div>
          )}
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
        {/* Red Home Column */}
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

        {/* Blue Home Column */}
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

        {/* Yellow Home Column */}
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

        {/* Green Home Column */}
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
            width: `${TOKEN_DIAMETER_PCT}%`,
            height: `${TOKEN_DIAMETER_PCT}%`,
          }}
          className="absolute rounded-full border-3 border-amber-400 bg-amber-400/30 animate-ping pointer-events-none z-15"
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
                <motion.button
                  key={`${token.color}-${token.id}`}
                  type="button"
                  initial={false}
                  animate={{
                    left: `${coords.left}%`,
                    top: `${coords.top}%`,
                  }}
                  transition={{
                    left: { type: 'spring', stiffness: 400, damping: 28 },
                    top: { type: 'spring', stiffness: 400, damping: 28 },
                  }}
                  style={{
                    width: `${TOKEN_DIAMETER_PCT}%`,
                    height: `${TOKEN_DIAMETER_PCT}%`,
                  }}
                  onMouseEnter={() => setHoveredTokenId(token.id)}
                  onMouseLeave={() => setHoveredTokenId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isMovable && isCurrentPlayerTurn) {
                      onTokenClick(token.id);
                    }
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    if (isMovable && isCurrentPlayerTurn) {
                      onTokenClick(token.id);
                    }
                  }}
                  className={`absolute rounded-full flex items-center justify-center z-30 transition-all ${
                    isMovable && isCurrentPlayerTurn
                      ? 'pointer-events-auto cursor-pointer ring-4 ring-amber-300 ring-offset-2 ring-offset-slate-900 shadow-xl shadow-amber-400/70'
                      : 'pointer-events-none'
                  }`}
                  title={`${token.color.toUpperCase()} Token ${token.id + 1}${isMovable ? ' (Click to move)' : ''}`}
                >
                  {/* 3D Glossy Token Face */}
                  <div
                    className={`relative w-full h-full rounded-full flex items-center justify-center shadow-lg transition-transform ${
                      isMovable ? 'scale-105' : ''
                    }`}
                    style={{
                      background: `radial-gradient(circle at 35% 30%, ${colorTheme.light}, ${colorTheme.primary} 65%, ${colorTheme.dark} 100%)`,
                      border: `2px solid ${colorTheme.light}`,
                    }}
                  >
                    {/* Inner Cap with token number */}
                    <div className="w-[58%] h-[58%] rounded-full bg-white/30 border border-white/70 flex items-center justify-center shadow-inner">
                      <span className="text-[9px] sm:text-[11px] font-black text-white drop-shadow">
                        {token.id + 1}
                      </span>
                    </div>

                    {/* Movable Pulsing Ring */}
                    {isMovable && isCurrentPlayerTurn && (
                      <span
                        className="absolute -inset-1 rounded-full opacity-80 animate-ping pointer-events-none"
                        style={{ backgroundColor: colorTheme.light }}
                      />
                    )}
                  </div>
                </motion.button>
              );
            });
          })}
        </div>
      </div>
    </div>
  );
};
