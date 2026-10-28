import React, { useState, useEffect } from 'react';
import { Player, COLOR_HEX, Token } from '../lib/ludoEngine.js';
import { Crown, Bot, User, CheckCircle2 } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  isCurrentTurn: boolean;
  tokens: Token[];
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  isRankedWinner?: boolean;
  turnDurationSeconds?: number;
  turnKey?: string;
  onTurnTimeout?: () => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = React.memo(({
  player,
  isCurrentTurn,
  tokens,
  position,
  isRankedWinner,
  turnDurationSeconds = 15,
  turnKey = '',
  onTurnTimeout,
}) => {
  const colorTheme = COLOR_HEX[player.color] || COLOR_HEX.red;
  const homeCount = tokens.filter((t) => t.state === 'home').length;
  const isRight = position.endsWith('right');

  // Turn timer state
  const [timeLeftMs, setTimeLeftMs] = useState(turnDurationSeconds * 1000);

  useEffect(() => {
    if (!isCurrentTurn) {
      setTimeLeftMs(turnDurationSeconds * 1000);
      return;
    }

    const durationMs = turnDurationSeconds * 1000;
    const startTime = Date.now();
    setTimeLeftMs(durationMs);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, durationMs - elapsed);
      setTimeLeftMs(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        if (onTurnTimeout) {
          onTurnTimeout();
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isCurrentTurn, turnDurationSeconds, turnKey, onTurnTimeout]);

  const totalMs = turnDurationSeconds * 1000;
  const progressPercent = Math.max(0, Math.min(100, (timeLeftMs / totalMs) * 100));
  const remainingSec = Math.ceil(timeLeftMs / 1000);

  return (
    <div
      className={`relative flex items-center gap-1.5 p-1.5 sm:p-2 rounded-2xl transition-all duration-300 select-none overflow-hidden ${
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
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-base sm:text-xl shadow-xs border ${
            isCurrentTurn ? 'ring-2 ring-offset-1 ring-offset-slate-950' : ''
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
          <div className="absolute -top-2.5 -right-1 text-amber-400 animate-bounce">
            <Crown className="w-4 h-4 fill-amber-400 drop-shadow" />
          </div>
        )}
      </div>

      {/* Meta Details */}
      <div className="flex-1 min-w-0">
        <div className={`flex items-center gap-1 ${isRight ? 'justify-end' : 'justify-start'}`}>
          <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[70px] xs:max-w-[90px] sm:max-w-[130px]">
            {player.name}
          </span>
          {isCurrentTurn && (
            <div className="flex items-center gap-1 shrink-0">
              <span
                className="w-2 h-2 rounded-full animate-ping"
                style={{ backgroundColor: colorTheme.primary }}
              />
              <span
                className={`text-[10px] font-mono font-bold px-1 rounded ${
                  progressPercent < 25
                    ? 'text-rose-400 animate-pulse bg-rose-500/20'
                    : 'text-amber-300/90 bg-slate-900/80'
                }`}
              >
                {remainingSec}s
              </span>
            </div>
          )}
        </div>

        {/* 4 Tokens Status Dots */}
        <div className={`flex items-center gap-1 mt-0.5 ${isRight ? 'justify-end' : 'justify-start'}`}>
          {tokens.map((t) => {
            const isHome = t.state === 'home';
            const isTrack = t.state === 'track' || t.state === 'homeColumn';
            return (
              <span
                key={t.id}
                className="w-2 h-2 rounded-full border transition-all"
                style={{
                  backgroundColor: isHome
                    ? '#fbbf24'
                    : isTrack
                    ? colorTheme.primary
                    : 'transparent',
                  borderColor: isHome
                    ? '#f59e0b'
                    : isTrack
                    ? colorTheme.light
                    : 'rgba(148, 163, 184, 0.4)',
                  boxShadow: isTrack || isHome ? `0 0 4px ${colorTheme.primary}80` : undefined,
                }}
                title={`Token ${t.id + 1}: ${t.state}`}
              />
            );
          })}
          <span className="text-[10px] font-bold text-slate-400 ml-0.5">
            {homeCount === 4 ? (
              <span className="text-amber-400 font-extrabold flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" /> Won!
              </span>
            ) : (
              <span>{homeCount}/4</span>
            )}
          </span>
        </div>
      </div>

      {/* Visual Turn Timer Progress Bar at Bottom of Card */}
      {isCurrentTurn && (
        <div className="absolute bottom-0 left-0 right-0 h-1 sm:h-1.5 bg-slate-950/80 pointer-events-none overflow-hidden">
          <div
            className="h-full transition-all duration-75 ease-linear"
            style={{
              width: `${progressPercent}%`,
              backgroundColor:
                progressPercent < 25
                  ? '#f43f5e'
                  : progressPercent < 50
                  ? '#f59e0b'
                  : colorTheme.primary,
              boxShadow: `0 0 8px ${
                progressPercent < 25 ? '#f43f5e' : colorTheme.primary
              }`,
            }}
          />
        </div>
      )}
    </div>
  );
});

PlayerCard.displayName = 'PlayerCard';
