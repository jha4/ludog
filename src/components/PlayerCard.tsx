import React from 'react';
import { Player, PlayerColor, COLOR_HEX, Token } from '../lib/ludoEngine.js';
import { Dice3D } from './Dice3D.js';
import { Crown, Bot, User, CheckCircle2 } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  isCurrentTurn: boolean;
  diceValue: number | null;
  isRolling: boolean;
  canRoll: boolean;
  onRoll: () => void;
  tokens: Token[];
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  isRankedWinner?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isCurrentTurn,
  diceValue,
  isRolling,
  canRoll,
  onRoll,
  tokens,
  position,
  isRankedWinner,
}) => {
  const colorTheme = COLOR_HEX[player.color] || COLOR_HEX.red;
  const homeCount = tokens.filter((t) => t.state === 'home').length;
  const inTrackCount = tokens.filter((t) => t.state === 'track' || t.state === 'homeColumn').length;

  const isBottom = position.startsWith('bottom');
  const isRight = position.endsWith('right');

  return (
    <div
      className={`relative flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-2xl transition-all duration-300 ${
        isCurrentTurn
          ? 'bg-slate-800/95 shadow-lg border-2 scale-101 z-20'
          : 'bg-slate-900/70 border border-slate-800/80 opacity-90'
      } ${isRight ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}
      style={{
        borderColor: isCurrentTurn ? colorTheme.primary : 'rgba(51, 65, 85, 0.6)',
        boxShadow: isCurrentTurn ? `0 0 16px -2px ${colorTheme.primary}80` : undefined,
      }}
    >
      {/* Avatar Container with Ring */}
      <div className="relative flex-shrink-0">
        <div
          className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-2xl shadow-md border-2 ${
            isCurrentTurn ? 'animate-pulse' : ''
          }`}
          style={{
            backgroundColor: colorTheme.dark,
            borderColor: colorTheme.primary,
          }}
        >
          {player.avatar}
        </div>

        {/* Bot or Human badge */}
        <span
          className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-700 shadow"
          title={player.type === 'bot' ? 'AI Bot Player' : 'Human Player'}
        >
          {player.type === 'bot' ? (
            <Bot className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-400" />
          ) : (
            <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400" />
          )}
        </span>

        {/* Winner Crown */}
        {isRankedWinner && (
          <div className="absolute -top-2 -right-1 text-amber-400 animate-bounce">
            <Crown className="w-3.5 h-3.5 fill-amber-400" />
          </div>
        )}
      </div>

      {/* Player Meta Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="font-bold text-[11px] sm:text-xs text-white truncate max-w-[70px] xs:max-w-[100px] sm:max-w-[130px]">
            {player.name}
          </span>
          {isCurrentTurn && (
            <span
              className="w-1.5 h-1.5 rounded-full animate-ping flex-shrink-0"
              style={{ backgroundColor: colorTheme.primary }}
            />
          )}
        </div>

        {/* Progress & Home Count */}
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[10px] font-semibold text-slate-400">
            {homeCount === 4 ? (
              <span className="text-amber-400 flex items-center gap-0.5 font-bold">
                <CheckCircle2 className="w-3 h-3" /> Won!
              </span>
            ) : (
              `${homeCount}/4 Home`
            )}
          </span>
        </div>

        {/* Active turn status */}
        {isCurrentTurn && (
          <div
            className="text-[10px] font-bold mt-0.5 animate-pulse truncate"
            style={{ color: colorTheme.light }}
          >
            {player.type === 'bot'
              ? isRolling
                ? 'Rolling...'
                : diceValue
                ? 'Thinking...'
                : 'Bot turn...'
              : diceValue
              ? `Rolled ${diceValue}!`
              : 'Tap to roll'}
          </div>
        )}
      </div>

      {/* Embedded 3D Dice for Active Player */}
      {isCurrentTurn && (
        <div className="flex-shrink-0">
          <Dice3D
            value={diceValue}
            isRolling={isRolling}
            canRoll={canRoll && player.type === 'human'}
            onRoll={onRoll}
            color={player.color}
            size="sm"
          />
        </div>
      )}
    </div>
  );
};
