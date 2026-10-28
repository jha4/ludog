import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import {
  generateTokenPath,
  calculateHopPosition,
  isReducedMotionPreferred,
  DEFAULT_ANIMATION_CONFIG,
  FAST_ANIMATION_CONFIG,
} from '../lib/tokenAnimation.js';
import { sounds } from '../lib/audioEffects.js';
import { Star, Trophy, Crown, ArrowDown, ArrowUp, ArrowRight, ArrowLeft, Sparkles, Rocket } from 'lucide-react';

interface LudoBoardProps {
  gameState: GameState;
  onTokenClick: (tokenId: number) => void;
  isCurrentPlayerTurn: boolean;
  isFastBot?: boolean;
  onAnimationStateChange?: (isAnimating: boolean) => void;
}

interface VisualToken {
  color: PlayerColor;
  tokenId: number;
  stepCount: number;
  left: number;
  top: number;
  arcOffsetPx: number;
  scale: number;
  isAnimating: boolean;
}

/**
 * Static 15x15 Ludo Board Grid
 * Memoized to NEVER re-render when tokens hop or dice rolls!
 */
interface StaticLudoGridProps {
  activeColors: PlayerColor[];
  currentTurn: PlayerColor;
  baseTokensMovable: boolean;
  onBaseClick: (color: PlayerColor) => void;
}

const StaticLudoGrid = React.memo<StaticLudoGridProps>(({
  activeColors,
  currentTurn,
  baseTokensMovable,
  onBaseClick,
}) => {
  const isGreenActive = activeColors.includes('green');
  const isYellowActive = activeColors.includes('yellow');
  const isRedActive = activeColors.includes('red');
  const isBlueActive = activeColors.includes('blue');

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-inner grid grid-cols-15 grid-rows-15">
      {/* ================= 4 BASE QUADRANTS ================= */}
      {/* Top-Left: Green Base (Rows 0-5, Cols 0-5) */}
      <div
        onClick={() => onBaseClick('green')}
        className={`col-start-1 col-end-7 row-start-1 row-end-7 p-2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 border-r-2 border-b-2 border-slate-950 relative flex flex-col justify-between shadow-lg transition-all ${
          !isGreenActive ? 'opacity-30 grayscale-[60%]' : ''
        } ${
          isGreenActive && currentTurn === 'green' && baseTokensMovable ? 'cursor-pointer ring-4 ring-emerald-300 ring-inset animate-pulse' : ''
        }`}
      >
        <div className="flex items-center justify-between text-white/95 font-black text-[11px] sm:text-xs">
          <span className="flex items-center gap-1.5 font-fredoka">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 shadow-xs inline-block" />
            GREEN {!isGreenActive && <span className="text-[9px] font-normal opacity-70">(Empty)</span>}
          </span>
          {isGreenActive && <Crown className="w-3.5 h-3.5 text-emerald-200" />}
        </div>

        {/* Inset white tray containing the 4 circular pits */}
        <div className="absolute inset-0 m-auto w-[68%] h-[68%] rounded-2xl bg-slate-100 shadow-lg border-2 border-emerald-900/40 grid grid-cols-2 grid-rows-2 p-2 gap-2">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="w-full h-full rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 border-2 border-emerald-600/70 flex items-center justify-center shadow-inner relative"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-600/30 border border-emerald-600/40 shadow-xs" />
            </div>
          ))}
        </div>

        {isGreenActive && currentTurn === 'green' && baseTokensMovable && (
          <div className="absolute inset-x-2 bottom-2 z-20 flex justify-center pointer-events-none">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black text-[9px] shadow-lg flex items-center gap-1 animate-bounce">
              <Rocket className="w-2.5 h-2.5" /> DEPLOY
            </span>
          </div>
        )}
      </div>

      {/* Top-Right: Yellow Base (Rows 0-5, Cols 10-15) */}
      <div
        onClick={() => onBaseClick('yellow')}
        className={`col-start-10 col-end-16 row-start-1 row-end-7 p-2 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 border-l-2 border-b-2 border-slate-950 relative flex flex-col justify-between shadow-lg transition-all ${
          !isYellowActive ? 'opacity-30 grayscale-[60%]' : ''
        } ${
          isYellowActive && currentTurn === 'yellow' && baseTokensMovable ? 'cursor-pointer ring-4 ring-amber-300 ring-inset animate-pulse' : ''
        }`}
      >
        <div className="flex items-center justify-between text-white/95 font-black text-[11px] sm:text-xs">
          <span className="flex items-center gap-1.5 font-fredoka">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-200 shadow-xs inline-block" />
            YELLOW {!isYellowActive && <span className="text-[9px] font-normal opacity-70">(Empty)</span>}
          </span>
          {isYellowActive && <Crown className="w-3.5 h-3.5 text-amber-200" />}
        </div>

        <div className="absolute inset-0 m-auto w-[68%] h-[68%] rounded-2xl bg-slate-100 shadow-lg border-2 border-amber-900/40 grid grid-cols-2 grid-rows-2 p-2 gap-2">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="w-full h-full rounded-full bg-gradient-to-br from-amber-100 to-amber-200 border-2 border-amber-600/70 flex items-center justify-center shadow-inner relative"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-amber-600/30 border border-amber-600/40 shadow-xs" />
            </div>
          ))}
        </div>

        {isYellowActive && currentTurn === 'yellow' && baseTokensMovable && (
          <div className="absolute inset-x-2 bottom-2 z-20 flex justify-center pointer-events-none">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-300 text-slate-950 font-black text-[9px] shadow-lg flex items-center gap-1 animate-bounce">
              <Rocket className="w-2.5 h-2.5" /> DEPLOY
            </span>
          </div>
        )}
      </div>

      {/* Bottom-Left: Red Base (Rows 10-15, Cols 0-5) */}
      <div
        onClick={() => onBaseClick('red')}
        className={`col-start-1 col-end-7 row-start-10 row-end-16 p-2 bg-gradient-to-br from-rose-600 via-rose-700 to-rose-900 border-r-2 border-t-2 border-slate-950 relative flex flex-col justify-between shadow-lg transition-all ${
          !isRedActive ? 'opacity-30 grayscale-[60%]' : ''
        } ${
          isRedActive && currentTurn === 'red' && baseTokensMovable ? 'cursor-pointer ring-4 ring-rose-300 ring-inset animate-pulse' : ''
        }`}
      >
        <div className="flex items-center justify-between text-white/95 font-black text-[11px] sm:text-xs">
          <span className="flex items-center gap-1.5 font-fredoka">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-300 shadow-xs inline-block" />
            RED {!isRedActive && <span className="text-[9px] font-normal opacity-70">(Empty)</span>}
          </span>
          {isRedActive && <Crown className="w-3.5 h-3.5 text-rose-200" />}
        </div>

        <div className="absolute inset-0 m-auto w-[68%] h-[68%] rounded-2xl bg-slate-100 shadow-lg border-2 border-rose-900/40 grid grid-cols-2 grid-rows-2 p-2 gap-2">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="w-full h-full rounded-full bg-gradient-to-br from-rose-100 to-rose-200 border-2 border-rose-600/70 flex items-center justify-center shadow-inner relative"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-rose-600/30 border border-rose-600/40 shadow-xs" />
            </div>
          ))}
        </div>

        {isRedActive && currentTurn === 'red' && baseTokensMovable && (
          <div className="absolute inset-x-2 bottom-2 z-20 flex justify-center pointer-events-none">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-400 text-slate-950 font-black text-[9px] shadow-lg flex items-center gap-1 animate-bounce">
              <Rocket className="w-2.5 h-2.5" /> DEPLOY
            </span>
          </div>
        )}
      </div>

      {/* Bottom-Right: Blue Base (Rows 10-15, Cols 10-15) */}
      <div
        onClick={() => onBaseClick('blue')}
        className={`col-start-10 col-end-16 row-start-10 row-end-16 p-2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 border-l-2 border-t-2 border-slate-950 relative flex flex-col justify-between shadow-lg transition-all ${
          !isBlueActive ? 'opacity-30 grayscale-[60%]' : ''
        } ${
          isBlueActive && currentTurn === 'blue' && baseTokensMovable ? 'cursor-pointer ring-4 ring-blue-300 ring-inset animate-pulse' : ''
        }`}
      >
        <div className="flex items-center justify-between text-white/95 font-black text-[11px] sm:text-xs">
          <span className="flex items-center gap-1.5 font-fredoka">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-300 shadow-xs inline-block" />
            BLUE {!isBlueActive && <span className="text-[9px] font-normal opacity-70">(Empty)</span>}
          </span>
          {isBlueActive && <Crown className="w-3.5 h-3.5 text-blue-200" />}
        </div>

        <div className="absolute inset-0 m-auto w-[68%] h-[68%] rounded-2xl bg-slate-100 shadow-lg border-2 border-blue-900/40 grid grid-cols-2 grid-rows-2 p-2 gap-2">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="w-full h-full rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-600/70 flex items-center justify-center shadow-inner relative"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-blue-600/30 border border-blue-600/40 shadow-xs" />
            </div>
          ))}
        </div>

        {isBlueActive && currentTurn === 'blue' && baseTokensMovable && (
          <div className="absolute inset-x-2 bottom-2 z-20 flex justify-center pointer-events-none">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-300 text-slate-950 font-black text-[9px] shadow-lg flex items-center gap-1 animate-bounce">
              <Rocket className="w-2.5 h-2.5" /> DEPLOY
            </span>
          </div>
        )}
      </div>

      {/* ================= 52 COMMON TRACK CELLS ================= */}
      {TRACK_GRID_COORDS.map((coord, idx) => {
        const isSafe = SAFE_TRACK_POSITIONS.has(idx);
        const isRedStart = idx === 0;
        const isBlueStart = idx === 13;
        const isYellowStart = idx === 26;
        const isGreenStart = idx === 39;

        let cellBg = 'bg-slate-800/90';
        let borderHighlight = 'border-slate-950/70';

        if (isRedStart) {
          cellBg = 'bg-gradient-to-br from-rose-500 to-rose-600 text-white';
          borderHighlight = 'border-rose-950';
        } else if (isBlueStart) {
          cellBg = 'bg-gradient-to-br from-blue-500 to-blue-600 text-white';
          borderHighlight = 'border-blue-950';
        } else if (isYellowStart) {
          cellBg = 'bg-gradient-to-br from-amber-400 to-amber-500 text-white';
          borderHighlight = 'border-amber-950';
        } else if (isGreenStart) {
          cellBg = 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white';
          borderHighlight = 'border-emerald-950';
        }

        return (
          <div
            key={`track-${idx}`}
            style={{
              gridRowStart: coord.row + 1,
              gridColumnStart: coord.col + 1,
            }}
            className={`relative border ${borderHighlight} ${cellBg} flex items-center justify-center transition-colors shadow-xs`}
          >
            {isSafe && (
              <Star
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 drop-shadow ${
                  isRedStart || isBlueStart || isYellowStart || isGreenStart
                    ? 'text-white fill-white'
                    : 'text-amber-400 fill-amber-400'
                }`}
              />
            )}
          </div>
        );
      })}

      {/* ================= 4 HOME RUNWAYS ================= */}
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
            <ArrowRight className="w-3.5 h-3.5 text-white/95" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-rose-200/70" />
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
            <ArrowUp className="w-3.5 h-3.5 text-white/95" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-blue-200/70" />
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
            <ArrowLeft className="w-3.5 h-3.5 text-white/95" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-amber-100/70" />
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
            <ArrowDown className="w-3.5 h-3.5 text-white/95" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-emerald-200/70" />
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

        {/* Center Golden Medallion */}
        <div className="absolute inset-0 m-auto w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-950/95 border-2 border-amber-400 flex items-center justify-center shadow-xl z-10">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400 animate-pulse drop-shadow" />
        </div>
      </div>
    </div>
  );
});

StaticLudoGrid.displayName = 'StaticLudoGrid';

export const LudoBoard: React.FC<LudoBoardProps> = ({
  gameState,
  onTokenClick,
  isCurrentPlayerTurn,
  isFastBot = false,
  onAnimationStateChange,
}) => {
  const { tokens, currentTurn, movableTokenIds, diceValue, hasRolled } = gameState;
  const [hoveredTokenId, setHoveredTokenId] = useState<number | null>(null);

  // Animation configuration based on bot speed
  const animConfig = isFastBot ? FAST_ANIMATION_CONFIG : DEFAULT_ANIMATION_CONFIG;

  // Active participating colors
  const activeColors = useMemo(
    () => gameState.players.map((p) => p.color),
    [gameState.players]
  );

  // Visual token positions (separate from authoritative logical state!)
  const [visualTokens, setVisualTokens] = useState<Record<string, VisualToken>>(() => {
    const initial: Record<string, VisualToken> = {};
    COLOR_ORDER.forEach((c) => {
      const colorTokens = tokens[c] || [];
      colorTokens.forEach((t) => {
        const coord = getTokenBoardPercent(c, t.id, t.stepCount, 0, 1);
        initial[`${c}-${t.id}`] = {
          color: c,
          tokenId: t.id,
          stepCount: t.stepCount,
          left: coord.left,
          top: coord.top,
          arcOffsetPx: 0,
          scale: 1,
          isAnimating: false,
        };
      });
    });
    return initial;
  });

  // Track active animation queues and timer IDs
  const activeTimersRef = useRef<NodeJS.Timeout[]>([]);
  const isCurrentlyAnimatingRef = useRef(false);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      activeTimersRef.current.forEach(clearTimeout);
      activeTimersRef.current = [];
    };
  }, []);

  // Sync / Animate Tokens when gameState updates (works for local AND online multiplayer!)
  useEffect(() => {
    const isReducedMotion = isReducedMotionPreferred();

    // Check each participating color's tokens
    activeColors.forEach((color) => {
      const serverTokens = tokens[color] || [];

      serverTokens.forEach((token) => {
        const key = `${color}-${token.id}`;
        const currentVisual = visualTokens[key];
        if (!currentVisual) return;

        const startStep = currentVisual.stepCount;
        const targetStep = token.stepCount;

        // If logical step changed, run sequential path animation!
        if (targetStep !== startStep) {
          const path = generateTokenPath(startStep, targetStep);

          // If reduced motion is preferred or path is single direct teleport, snap immediately
          if (isReducedMotion || path.length <= 1) {
            const finalCoord = getTokenBoardPercent(color, token.id, targetStep, 0, 1);
            setVisualTokens((prev) => ({
              ...prev,
              [key]: {
                ...prev[key],
                stepCount: targetStep,
                left: finalCoord.left,
                top: finalCoord.top,
                arcOffsetPx: 0,
                scale: 1,
                isAnimating: false,
              },
            }));
            return;
          }

          // Mark animation active
          if (!isCurrentlyAnimatingRef.current) {
            isCurrentlyAnimatingRef.current = true;
            onAnimationStateChange?.(true);
          }

          // Step-by-step path hop traversal
          const isSpawning = startStep === -1 && targetStep === 0;
          const isCaptureKickback = targetStep === -1;
          const hopDuration = isSpawning
            ? animConfig.spawnDurationMs
            : isCaptureKickback
            ? animConfig.captureDurationMs
            : animConfig.stepDurationMs;

          // Sound triggers
          if (isSpawning) {
            sounds.playSpawn();
          } else if (isCaptureKickback) {
            sounds.playCapture();
          }

          // Schedule step hops sequentially
          path.slice(1).forEach((stepNum, idx) => {
            const timer = setTimeout(() => {
              const targetCoord = getTokenBoardPercent(color, token.id, stepNum, 0, 1);

              // Play marimba step sound for forward track progress
              if (!isSpawning && !isCaptureKickback) {
                sounds.playStep(stepNum);
              }

              // Hop peak effect
              setVisualTokens((prev) => ({
                ...prev,
                [key]: {
                  ...prev[key],
                  stepCount: stepNum,
                  left: targetCoord.left,
                  top: targetCoord.top,
                  arcOffsetPx: -7,
                  scale: 1.15,
                  isAnimating: true,
                },
              }));

              // Land effect after brief peak
              const landTimer = setTimeout(() => {
                setVisualTokens((prev) => ({
                  ...prev,
                  [key]: {
                    ...prev[key],
                    arcOffsetPx: 0,
                    scale: 1.0,
                    isAnimating: idx < path.length - 2,
                  },
                }));

                // If final step reached:
                if (idx === path.length - 2) {
                  isCurrentlyAnimatingRef.current = false;
                  onAnimationStateChange?.(false);

                  // Landing special events
                  if (stepNum === 56) {
                    sounds.playHome();
                  } else if (stepNum >= 0 && stepNum <= 50) {
                    const trackPos = getTrackPosition(color, stepNum);
                    if (trackPos !== null && SAFE_TRACK_POSITIONS.has(trackPos)) {
                      sounds.playSafeZone();
                    }
                  }
                }
              }, hopDuration * 0.45);

              activeTimersRef.current.push(landTimer);
            }, idx * hopDuration);

            activeTimersRef.current.push(timer);
          });
        }
      });
    });
  }, [tokens, activeColors, animConfig, onAnimationStateChange]);

  // Destination preview calculation when hovering a movable token
  const previewTokenId =
    hoveredTokenId !== null
      ? hoveredTokenId
      : movableTokenIds.length === 1
      ? movableTokenIds[0]
      : null;

  let previewTargetCoord: { left: number; top: number } | null = null;
  if (previewTokenId !== null && diceValue !== null && isCurrentPlayerTurn) {
    const pToken = tokens[currentTurn]?.find((t) => t.id === previewTokenId);
    if (pToken) {
      const targetStep = pToken.state === 'base' ? 0 : pToken.stepCount + diceValue;
      if (targetStep <= 56) {
        previewTargetCoord = getTokenBoardPercent(currentTurn, pToken.id, targetStep, 0, 1);
      }
    }
  }

  // Base clickable check
  const baseTokensMovable =
    isCurrentPlayerTurn &&
    hasRolled &&
    diceValue === 6 &&
    movableTokenIds.some((id) => {
      const t = tokens[currentTurn]?.find((tok) => tok.id === id);
      return t && t.state === 'base';
    });

  const handleBaseClick = useCallback(
    (color: PlayerColor) => {
      if (color !== currentTurn || !isCurrentPlayerTurn || !baseTokensMovable) return;
      const baseToken = tokens[currentTurn]?.find(
        (t) => t.state === 'base' && movableTokenIds.includes(t.id)
      );
      if (baseToken) {
        onTokenClick(baseToken.id);
      }
    },
    [baseTokensMovable, currentTurn, isCurrentPlayerTurn, movableTokenIds, onTokenClick, tokens]
  );

  // Group tokens for stacking offsets
  const cellTokenGroups = useMemo(() => {
    const groups: Record<string, Array<{ token: Token; isMovable: boolean }>> = {};

    COLOR_ORDER.forEach((c) => {
      if (!activeColors.includes(c)) return;
      const colorTokens = tokens[c] || [];

      colorTokens.forEach((t) => {
        const isMovable = c === currentTurn && movableTokenIds.includes(t.id);
        const visual = visualTokens[`${c}-${t.id}`];
        const step = visual ? visual.stepCount : t.stepCount;

        let key = `${c}-base-${t.id}`;
        if (step >= 56) {
          key = `${c}-home`;
        } else if (step > 50) {
          key = `${c}-col-${step}`;
        } else if (step >= 0) {
          const trackPos = getTrackPosition(c, step);
          key = `track-${trackPos}`;
        }

        if (!groups[key]) groups[key] = [];
        groups[key].push({ token: { ...t, stepCount: step }, isMovable });
      });
    });

    return groups;
  }, [activeColors, currentTurn, movableTokenIds, tokens, visualTokens]);

  return (
    <div className="relative w-full aspect-square max-w-[340px] xs:max-w-[360px] sm:max-w-[420px] md:max-w-[460px] mx-auto select-none p-1 sm:p-2 bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl shadow-2xl border-2 sm:border-3 border-slate-700/80">
      {/* Static Memoized Board Grid */}
      <StaticLudoGrid
        activeColors={activeColors}
        currentTurn={currentTurn}
        baseTokensMovable={baseTokensMovable}
        onBaseClick={handleBaseClick}
      />

      {/* Target Destination Preview Glow */}
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

      {/* ================= HIGH-PERFORMANCE GPU TOKEN LAYER ================= */}
      <div className="absolute inset-0 pointer-events-none p-1 sm:p-2">
        <div className="relative w-full h-full">
          {Object.entries(cellTokenGroups).flatMap(([groupKey, groupTokens]) => {
            const stackTotal = groupTokens.length;

            return groupTokens.map(({ token, isMovable }, stackIndex) => {
              const visual = visualTokens[`${token.color}-${token.id}`];
              const coords = getTokenBoardPercent(
                token.color,
                token.id,
                visual ? visual.stepCount : token.stepCount,
                stackIndex,
                stackTotal
              );

              const leftVal = visual ? visual.left : coords.left;
              const topVal = visual ? visual.top : coords.top;
              const arcOffset = visual ? visual.arcOffsetPx : 0;
              const scaleVal = visual ? visual.scale : 1.0;

              const colorTheme = COLOR_HEX[token.color] || COLOR_HEX.red;

              return (
                <div
                  key={`${token.color}-${token.id}`}
                  style={{
                    left: `${leftVal}%`,
                    top: `${topVal}%`,
                    width: `${TOKEN_DIAMETER_PCT}%`,
                    height: `${TOKEN_DIAMETER_PCT}%`,
                    transform: `translate3d(0, ${arcOffset}px, 0) scale(${scaleVal})`,
                    transition: visual?.isAnimating
                      ? 'left 70ms linear, top 70ms linear, transform 70ms ease-out'
                      : 'transform 150ms ease-out',
                    willChange: visual?.isAnimating ? 'transform, left, top' : 'auto',
                  }}
                  className={`absolute rounded-full flex items-center justify-center z-30 ${
                    isMovable && isCurrentPlayerTurn
                      ? 'pointer-events-auto cursor-pointer'
                      : 'pointer-events-none'
                  }`}
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
                  title={`${token.color.toUpperCase()} Token ${token.id + 1}${
                    isMovable ? ' (Click to move)' : ''
                  }`}
                >
                  {/* Contact Shadow Underneath (lifts during hop) */}
                  <div
                    className="absolute -bottom-1 w-[80%] h-1.5 rounded-full bg-black/60 blur-[1px] pointer-events-none transition-all"
                    style={{
                      transform: `scale(${arcOffset < -2 ? 1.3 : 1})`,
                      opacity: arcOffset < -2 ? 0.35 : 0.65,
                    }}
                  />

                  {/* 3D Glossy Token Body */}
                  <div
                    className={`relative w-full h-full rounded-full flex items-center justify-center shadow-lg transition-transform ${
                      isMovable && isCurrentPlayerTurn
                        ? 'ring-3 ring-amber-300 ring-offset-1 ring-offset-slate-900 shadow-xl shadow-amber-400/80 scale-105'
                        : ''
                    }`}
                    style={{
                      background: `radial-gradient(circle at 35% 30%, ${colorTheme.light}, ${colorTheme.primary} 65%, ${colorTheme.dark} 100%)`,
                      border: `2px solid ${colorTheme.light}`,
                    }}
                  >
                    {/* Inner Metallic Bezel Ring & Token Number */}
                    <div className="w-[58%] h-[58%] rounded-full bg-white/30 border border-white/80 flex items-center justify-center shadow-inner">
                      <span className="text-[9px] sm:text-[11px] font-black text-white drop-shadow">
                        {token.id + 1}
                      </span>
                    </div>

                    {/* Radiant Breathing Ring for Movable Tokens */}
                    {isMovable && isCurrentPlayerTurn && (
                      <span
                        className="absolute -inset-1 rounded-full opacity-80 animate-ping pointer-events-none"
                        style={{ backgroundColor: colorTheme.light }}
                      />
                    )}
                  </div>
                </div>
              );
            });
          })}
        </div>
      </div>
    </div>
  );
};
