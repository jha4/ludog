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

  return (
    <div className="flex items-center justify-center z-30 select-none shrink-0">
      <motion.div
        layout
        className={`relative flex items-center justify-center p-1.5 rounded-2xl border-2 backdrop-blur-md shadow-xl transition-all duration-300 ${
          canRoll && !hasRolled && !isRolling
            ? 'ring-2 ring-offset-1 ring-offset-slate-950 shadow-md scale-105'
            : ''
        }`}
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          borderColor: colorTheme.primary,
          boxShadow: `0 8px 20px -4px ${colorTheme.primary}50`,
        }}
      >
        {/* 3D Roll Dice Only */}
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
            size="sm"
          />
        </div>
      </motion.div>
    </div>
  );
};
