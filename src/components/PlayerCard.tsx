import React from 'react';
import { Player, COLOR_HEX, Token } from '../lib/ludoEngine.js';
import { Crown, Bot, User, CheckCircle2 } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  isCurrentTurn: boolean;
  tokens: Token[];
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  isRankedWinner?: boolean;
  statusText?: string;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isCurrentTurn,
  tokens,
  position,
  isRankedWinner,
}) => {
  const colorTheme = COLOR_HEX[player.color] || COLOR_HEX.red;
  const homeCount = tokens.filter((t) => t.state === 'home').length;
  const isRight = position.endsWith('right');

  return (
    <div
      className={`relative flex items-center gap-1.5 p-1.5 sm:p-2 rounded-2xl transition-all duration-300 select-none ${
        isCurrentTurn
          ? 'bg-slate-800/95 shadow-md border-2 z-20 scale-[1.01]'
          : 'bg-slate-900/80 border border-slate-800/80 opacity-90'
      } ${isRight ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}
      style={{
        borderColor: isCurrentTurn ? colorTheme.primary : 'rgba(51, 65, 85, 0.6)',
        boxShadow: isCurrentTurn ? `0 0 12px -2px ${colorTheme.primary}60` : undefined,
      }}
    >
      {/* Player Avatar */}
      <div className="relative flex-shrink-0">
        <div
          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-base sm:text-xl shadow-xs border ${
            isCurrentTurn ? 'animate-pulse' : ''
          }`}
          style={{
            backgroundColor: colorTheme.dark,
            borderColor: colorTheme.primary,
          }}
        >
          {player.avatar}
        </div>

        {/* Human / Bot Badge */}
        <span
          className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-slate-950 text-slate-300 border border-slate-700 shadow-xs"
          title={player.type === 'bot' ? 'AI Bot Player' : 'Human Player'}
        >
          {player.type === 'bot' ? (
            <Bot className="w-2.5 h-2.5 text-cyan-400" />
          ) : (
            <User className="w-2.5 h-2.5 text-emerald-400" />
          )}
        </span>

        {/* Winner Crown */}
        {isRankedWinner && (
          <div className="absolute -top-2 -right-1 text-amber-400 animate-bounce">
            <Crown className="w-3.5 h-3.5 fill-amber-400 drop-shadow" />
          </div>
        )}
      </div>

      {/* Meta Details */}
      <div className="flex-1 min-w-0">
        <div className={`flex items-center gap-1 ${isRight ? 'justify-end' : 'justify-start'}`}>
          <span className="font-bold text-xs text-white truncate max-w-[70px] xs:max-w-[90px] sm:max-w-[120px]">
            {player.name}
          </span>
          {isCurrentTurn && (
            <span
              className="w-1.5 h-1.5 rounded-full animate-ping flex-shrink-0"
              style={{ backgroundColor: colorTheme.primary }}
            />
          )}
        </div>

        {/* Progress Counters */}
        <div className={`flex items-center gap-1 text-[10px] font-semibold text-slate-400 ${isRight ? 'justify-end' : 'justify-start'}`}>
          {homeCount === 4 ? (
            <span className="text-amber-400 flex items-center gap-0.5 font-bold">
              <CheckCircle2 className="w-2.5 h-2.5" /> Won!
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <span className="font-bold text-slate-200">{homeCount}/4</span> Home
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
