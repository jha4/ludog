import React from 'react';
import { motion } from 'motion/react';
import { GameState, Player, COLOR_HEX } from '../lib/ludoEngine.js';
import { Dice3D } from './Dice3D.js';

interface SharedDiceControlProps {
  gameState: GameState;
  activePlayer: Player;
  isRolling: boolean;
  canRoll: boolean;
  onRoll: () => void;
  onQuickMove?: (tokenId: number) => void;
}

export const SharedDiceControl: React.FC<SharedDiceControlProps> = React.memo(({
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

    // If already rolled and exactly 1 legal move exists, clicking the dice triggers the quick move
    if (hasRolled && singleMoveAvailable && onQuickMove && !isBotTurn) {
      onQuickMove(movableTokens[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center z-30 select-none shrink-0">
      <motion.div
        layout
        className={`relative flex items-center justify-center p-1.5 sm:p-2 rounded-2xl border-2 backdrop-blur-md shadow-xl transition-all duration-300 ${
          canRoll && !hasRolled && !isRolling
            ? 'ring-3 ring-amber-300 ring-offset-2 ring-offset-slate-950 shadow-2xl scale-105'
            : ''
        }`}
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          borderColor: colorTheme.primary,
          boxShadow: `0 8px 25px -4px ${colorTheme.primary}70`,
        }}
      >
        {/* 3D Roll Dice */}
        <div
          onClick={handleControlClick}
          className={`cursor-pointer transition-transform duration-150 ${
            (canRoll && !hasRolled) || (singleMoveAvailable && !isBotTurn)
              ? 'hover:scale-105 active:scale-95'
              : ''
          }`}
          title={
            !hasRolled && canRoll
              ? 'Click to Roll Dice'
              : singleMoveAvailable && !isBotTurn
              ? 'Click to Move Token'
              : undefined
          }
        >
          <Dice3D
            value={lastDiceValue}
            isRolling={isRolling}
            canRoll={canRoll && !hasRolled && !isBotTurn}
            onRoll={onRoll}
            color={activePlayer.color}
            size="sm"
          />
        </div>
      </motion.div>

      {/* Action Status Micro Label */}
      <div className="mt-1 h-3.5 flex items-center justify-center">
        {canRoll && !hasRolled && !isRolling && !isBotTurn ? (
          <span className="px-2 py-0.2 rounded-full text-[9px] font-black tracking-wider uppercase text-amber-300 bg-amber-500/20 animate-pulse">
            ROLL
          </span>
        ) : hasRolled && singleMoveAvailable && !isBotTurn ? (
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold text-slate-300 bg-slate-800 animate-bounce">
            TAP MOVE
          </span>
        ) : hasRolled && movableTokens.length > 1 && !isBotTurn ? (
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold text-amber-300 bg-amber-500/20">
            PICK TOKEN
          </span>
        ) : null}
      </div>
    </div>
  );
});

SharedDiceControl.displayName = 'SharedDiceControl';
