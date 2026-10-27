import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, Player, COLOR_HEX } from '../lib/ludoEngine.js';
import { Dice3D } from './Dice3D.js';
import { Hand, Sparkles, AlertCircle, Bot, Rocket } from 'lucide-react';

interface SharedDiceControlProps {
  gameState: GameState;
  activePlayer: Player;
  isRolling: boolean;
  canRoll: boolean;
  onRoll: () => void;
  onQuickMove?: (tokenId: number) => void;
}

export const SharedDiceControl: React.FC<SharedDiceControlProps> = ({
  gameState,
  activePlayer,
  isRolling,
  canRoll,
  onRoll,
  onQuickMove,
}) => {
  const colorTheme = COLOR_HEX[activePlayer.color] || COLOR_HEX.red;
  const hasRolled = gameState.hasRolled;
  const lastDiceValue = gameState.diceValue;
  const movableTokens = gameState.movableTokenIds || [];
  const singleMoveAvailable = hasRolled && movableTokens.length === 1;
  const isBotTurn = activePlayer.type === 'bot';

  // Handle click on the control container or dice
  const handleControlClick = () => {
    if (!hasRolled && canRoll && !isRolling) {
      onRoll();
      return;
    }

    // If already rolled and exactly 1 legal move exists, clicking the shared dice control triggers the quick move
    if (hasRolled && singleMoveAvailable && onQuickMove && !isBotTurn) {
      onQuickMove(movableTokens[0]);
    }
  };

  // Turn status hint text
  let statusText = '';
  let statusBadgeColor = 'bg-slate-800 text-slate-300';

  if (isRolling) {
    statusText = 'Rolling the dice...';
    statusBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  } else if (!hasRolled) {
    if (isBotTurn) {
      statusText = `${activePlayer.name} is thinking...`;
      statusBadgeColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    } else if (canRoll) {
      statusText = 'Tap dice to roll!';
      statusBadgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 animate-pulse';
    } else {
      statusText = `Waiting for ${activePlayer.name}'s turn`;
      statusBadgeColor = 'bg-slate-800 text-slate-400 border-slate-700';
    }
  } else {
    // Has rolled
    if (movableTokens.length === 0) {
      statusText = `Rolled ${lastDiceValue} — No legal moves!`;
      statusBadgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    } else if (movableTokens.length === 1) {
      const activeToken = gameState.tokens[activePlayer.color].find((t) => t.id === movableTokens[0]);
      if (activeToken && activeToken.stepCount < 0) {
        statusText = `Rolled a 6! Tap dice or base to deploy token`;
      } else {
        statusText = `Rolled ${lastDiceValue}! Tap dice or token to move`;
      }
      statusBadgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 animate-pulse';
    } else {
      statusText = `Rolled ${lastDiceValue}! Choose a token on board (${movableTokens.length} choices)`;
      statusBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
  }

  return (
    <div className="w-full flex justify-center items-center py-1 px-2 z-30 select-none">
      <motion.div
        layout
        className={`relative flex items-center gap-3 px-4 py-2.5 rounded-2xl border-2 backdrop-blur-md shadow-2xl transition-all duration-300 ${
          canRoll && !hasRolled && !isRolling
            ? 'ring-4 ring-offset-2 ring-offset-slate-950 shadow-lg'
            : ''
        }`}
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          borderColor: colorTheme.primary,
          boxShadow: `0 10px 25px -5px ${colorTheme.primary}40`,
        }}
      >
        {/* Active Player Mini Info (Left) */}
        <div className="flex items-center gap-2 pr-2 border-r border-slate-800">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-md font-bold text-white relative"
            style={{ backgroundColor: colorTheme.primary }}
          >
            <span>{activePlayer.avatar || '🤠'}</span>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center">
              {isBotTurn ? (
                <Bot className="w-2 h-2 text-indigo-400" />
              ) : (
                <div
                  className="w-1.5 h-1.5 rounded-full animate-ping"
                  style={{ backgroundColor: colorTheme.primary }}
                />
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-black tracking-wide text-white uppercase font-fredoka flex items-center gap-1">
              {activePlayer.name}
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: colorTheme.primary }}
            >
              {activePlayer.color} Turn
            </span>
          </div>
        </div>

        {/* Central Dice 3D */}
        <div
          onClick={handleControlClick}
          className={`cursor-pointer transition-transform duration-150 ${
            (canRoll && !hasRolled) || (singleMoveAvailable && !isBotTurn)
              ? 'hover:scale-105 active:scale-95'
              : ''
          }`}
        >
          <Dice3D
            value={lastDiceValue}
            isRolling={isRolling}
            canRoll={canRoll && !hasRolled && !isBotTurn}
            onRoll={onRoll}
            color={activePlayer.color}
            size="md"
          />
        </div>

        {/* Turn Guidance and Status Pill (Right) */}
        <div className="flex flex-col justify-center min-w-[130px] sm:min-w-[170px]">
          <div
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border tracking-wide flex items-center gap-1.5 transition-colors ${statusBadgeColor}`}
          >
            {isRolling ? (
              <div className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
            ) : movableTokens.length === 0 && hasRolled ? (
              <AlertCircle className="w-3 h-3 shrink-0" />
            ) : singleMoveAvailable ? (
              <Rocket className="w-3 h-3 shrink-0" />
            ) : canRoll && !hasRolled && !isBotTurn ? (
              <Hand className="w-3 h-3 shrink-0 animate-bounce" />
            ) : (
              <Sparkles className="w-3 h-3 shrink-0" />
            )}
            <span className="truncate">{statusText}</span>
          </div>

          {/* Sub-label for consecutive sixes or bonus */}
          {gameState.consecutiveSixes > 0 && !hasRolled && (
            <span className="text-[10px] text-amber-400 font-bold mt-0.5 tracking-wide px-1">
              🔥 Bonus Roll! ({gameState.consecutiveSixes}/2 sixes)
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
};
