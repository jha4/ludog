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
  statusText,
}) => {
  const colorTheme = COLOR_HEX[player.color] || COLOR_HEX.red;
  const homeCount = tokens.filter((t) => t.state === 'home').length;
  const onTrackCount = tokens.filter((t) => t.state === 'track' || t.state === 'homeColumn').length;
  const inBaseCount = tokens.filter((t) => t.state === 'base').length;

  const isRight = position.endsWith('right');

  return (
    <div
      className={`relative flex items-center gap-2 p-2 sm:p-2.5 rounded-2xl transition-all duration-300 select-none ${
        isCurrentTurn
          ? 'bg-slate-800/95 shadow-lg border-2 z-20 scale-[1.02]'
          : 'bg-slate-900/80 border border-slate-800/80 opacity-90'
      } ${isRight ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}
      style={{
        borderColor: isCurrentTurn ? colorTheme.primary : 'rgba(51, 65, 85, 0.6)',
        boxShadow: isCurrentTurn ? `0 0 16px -2px ${colorTheme.primary}70` : undefined,
      }}
    >
      {/* Player Avatar */}
      <div className="relative flex-shrink-0">
        <div
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-lg sm:text-2xl shadow-md border-2 ${
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
          className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-slate-950 text-slate-300 border border-slate-700 shadow"
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
          <div className="absolute -top-2.5 -right-1 text-amber-400 animate-bounce">
            <Crown className="w-4 h-4 fill-amber-400 drop-shadow" />
          </div>
        )}
      </div>

      {/* Meta Details */}
      <div className="flex-1 min-w-0">
        <div className={`flex items-center gap-1.5 ${isRight ? 'justify-end' : 'justify-start'}`}>
          <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[90px] xs:max-w-[120px] sm:max-w-[160px]">
            {player.name}
          </span>
          {isCurrentTurn && (
            <span
              className="w-2 h-2 rounded-full animate-ping flex-shrink-0"
              style={{ backgroundColor: colorTheme.primary }}
            />
          )}
        </div>

        {/* Progress Counters */}
        <div className={`flex items-center gap-1.5 mt-0.5 text-[10px] font-semibold text-slate-400 ${isRight ? 'justify-end' : 'justify-start'}`}>
          {homeCount === 4 ? (
            <span className="text-amber-400 flex items-center gap-0.5 font-bold">
              <CheckCircle2 className="w-3 h-3" /> Won!
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <span className="font-bold text-slate-200">{homeCount}/4</span> Home
              {onTrackCount > 0 && (
                <span className="text-slate-500">• {onTrackCount} active</span>
              )}
            </span>
          )}
        </div>

        {/* Turn Status Message */}
        {isCurrentTurn ? (
          <div
            className="text-[10px] sm:text-[11px] font-bold mt-0.5 truncate animate-pulse"
            style={{ color: colorTheme.light }}
          >
            {statusText || (player.type === 'bot' ? 'Thinking...' : 'Your turn')}
          </div>
        ) : (
          <div className="text-[10px] text-slate-500 mt-0.5 truncate">
            {player.color.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
};
