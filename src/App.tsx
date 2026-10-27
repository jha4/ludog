/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GameState,
  PlayerColor,
  createNewGame,
  rollDice,
  passTurn,
  moveToken,
  selectBotMove,
  getCurrentPlayer,
  EmojiEvent,
  COLOR_HEX,
  BotDifficulty,
} from './lib/ludoEngine.js';
import { sounds } from './lib/audioEffects.js';
import { LudoBoard } from './components/LudoBoard.js';
import { PlayerCard } from './components/PlayerCard.js';
import { AnimatedEmojiOverlay, QuickEmojiBar } from './components/AnimatedEmojiOverlay.js';
import { VictoryModal } from './components/VictoryModal.js';
import { GameSetupModal } from './components/GameSetupModal.js';
import { RulesModal } from './components/RulesModal.js';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  BookOpen,
  Settings,
  Copy,
  Check,
  Bot,
  Zap,
  Sparkles,
  Smartphone,
  ChevronRight,
} from 'lucide-react';

export default function App() {
  // Game State
  const [gameState, setGameState] = useState<GameState>(() =>
    createNewGame('single_player', 'You', 'red', 3)
  );

  // Audio mute state
  const [isMuted, setIsMuted] = useState(() => sounds.getMuted());

  // Modals & Panels
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Fast bot mode toggle
  const [isFastBot, setIsFastBot] = useState(false);

  // Mobile frame wrapper view or full-width view
  const [isMobileFrame, setIsMobileFrame] = useState(true);

  // Animated token hopping override: { color, tokenId, stepCount }
  const [animatedTokenStep, setAnimatedTokenStep] = useState<{
    color: PlayerColor;
    tokenId: number;
    stepCount: number;
  } | null>(null);

  // Is currently executing hop animation
  const [isHopping, setIsHopping] = useState(false);

  // Emoji events list for animated overlay
  const [emojiEvents, setEmojiEvents] = useState<EmojiEvent[]>([]);

  // Timers and stream references
  const sseRef = useRef<EventSource | null>(null);
  const botTurnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const passTurnTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync sounds mute state
  const toggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      sounds.playClick();
    }
  };

  // Copy Room Code to clipboard
  const handleCopyRoomCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(gameState.id).catch(() => {});
      setIsCopied(true);
      sounds.playClick();
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Broadcast Emoji Reaction
  const handleSendEmoji = useCallback(
    (emoji: string, text?: string) => {
      const human = gameState.players.find((p) => p.type === 'human') || gameState.players[0];
      const newEvent: EmojiEvent = {
        id: 'emoji-' + Math.random().toString(36).substring(2, 9),
        senderId: human.id,
        senderName: human.name,
        senderColor: human.color,
        emoji,
        text,
        timestamp: Date.now(),
      };

      setEmojiEvents((prev) => [...prev.slice(-15), newEvent]);

      if (gameState.mode === 'online_room') {
        fetch(`/api/rooms/${gameState.id}/emoji`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newEvent),
        }).catch(() => {});
      }
    },
    [gameState.id, gameState.mode, gameState.players]
  );

  // Trigger Local Bot Reaction on special events
  const triggerBotReaction = useCallback(
    (botColor: PlayerColor, situation: 'roll6' | 'capture' | 'captured' | 'home' | 'win') => {
      const botPlayer = gameState.players.find((p) => p.color === botColor);
      if (!botPlayer || botPlayer.type !== 'bot') return;

      const reactionMap = {
        roll6: ['🔥', '🎲', '😎', '⚡'],
        capture: ['🎯', '😂', '👑', '💥'],
        captured: ['😭', '💀', '😱', '😡'],
        home: ['🥳', '🏆', '🎉', '👏'],
        win: ['👑', '🥳', '🏆', '🥇'],
      };

      const options = reactionMap[situation] || ['🎲'];
      const emoji = options[Math.floor(Math.random() * options.length)];

      const newEvent: EmojiEvent = {
        id: 'bot-emoji-' + Math.random().toString(36).substring(2, 9),
        senderId: botPlayer.id,
        senderName: botPlayer.name,
        senderColor: botColor,
        emoji,
        timestamp: Date.now(),
      };

      setEmojiEvents((prev) => [...prev.slice(-15), newEvent]);
    },
    [gameState.players]
  );

  // Connect to backend SSE stream for online rooms
  useEffect(() => {
    if (gameState.mode === 'online_room') {
      const source = new EventSource(`/api/rooms/${gameState.id}/stream`);
      sseRef.current = source;

      source.addEventListener('state_update', (e) => {
        try {
          const updatedState = JSON.parse(e.data) as GameState;
          setGameState(updatedState);
        } catch {}
      });

      source.addEventListener('emoji', (e) => {
        try {
          const event = JSON.parse(e.data) as EmojiEvent;
          setEmojiEvents((prev) => [...prev.slice(-15), event]);
          sounds.playEmojiPop();
        } catch {}
      });

      return () => {
        source.close();
      };
    }
  }, [gameState.id, gameState.mode]);

  // Roll Dice Action
  const handleRollDice = useCallback(() => {
    if (gameState.hasRolled || gameState.isRolling || gameState.status !== 'playing' || isHopping) {
      return;
    }

    sounds.playDiceRoll();

    // Visual rolling wobble
    setGameState((prev) => ({ ...prev, isRolling: true }));

    setTimeout(() => {
      setGameState((prev) => {
        // Roll dice (autoPass is false so player sees what was rolled)
        const rolled = rollDice(prev, undefined, false);

        if (rolled.lastAction?.type === 'pass') {
          sounds.playPass();
        } else if (rolled.diceValue === 6) {
          sounds.playSpawn();
        }
        return rolled;
      });

      // Sync with server if online room
      if (gameState.mode === 'online_room') {
        fetch(`/api/rooms/${gameState.id}/roll`, { method: 'POST' }).catch(() => {});
      }
    }, 500);
  }, [gameState.hasRolled, gameState.isRolling, gameState.status, gameState.id, gameState.mode, isHopping]);

  // Delayed Turn Pass when no moves are available
  useEffect(() => {
    if (gameState.hasRolled && gameState.movableTokenIds.length === 0 && gameState.status === 'playing') {
      const delay = isFastBot ? 600 : 1100;
      passTurnTimerRef.current = setTimeout(() => {
        setGameState((prev) => passTurn(prev));
      }, delay);

      return () => {
        if (passTurnTimerRef.current) clearTimeout(passTurnTimerRef.current);
      };
    }
  }, [gameState.hasRolled, gameState.movableTokenIds.length, gameState.status, isFastBot]);

  // Step-by-Step Hopping Move Token Action
  const executeMoveToken = useCallback(
    (tokenId: number) => {
      if (!gameState.hasRolled || gameState.diceValue === null || isHopping) return;
      if (!gameState.movableTokenIds.includes(tokenId)) return;

      const color = gameState.currentTurn;
      const targetToken = gameState.tokens[color].find((t) => t.id === tokenId);
      if (!targetToken) return;

      const dice = gameState.diceValue;

      // Case 1: Deploy from base
      if (targetToken.state === 'base') {
        sounds.playSpawn();
        const nextState = moveToken(gameState, tokenId);
        setGameState(nextState);

        if (gameState.mode === 'online_room') {
          fetch(`/api/rooms/${gameState.id}/move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tokenId }),
          }).catch(() => {});
        }
        return;
      }

      // Case 2: Multi-step hop along the track
      setIsHopping(true);
      const startStep = targetToken.stepCount;
      const finalStep = startStep + dice;
      let currentStep = startStep;

      const hopInterval = setInterval(() => {
        currentStep++;
        sounds.playStep(currentStep);
        setAnimatedTokenStep({ color, tokenId, stepCount: currentStep });

        if (currentStep >= finalStep) {
          clearInterval(hopInterval);
          setAnimatedTokenStep(null);
          setIsHopping(false);

          const nextState = moveToken(gameState, tokenId);
          const actionType = nextState.lastAction?.type;

          if (actionType === 'capture') {
            sounds.playCapture();
            triggerBotReaction(color, 'capture');
          } else if (actionType === 'home') {
            sounds.playHome();
            triggerBotReaction(color, 'home');
          } else if (finalStep < 51) {
            // Check if landed on safe star
            const trackPos = (color === 'red' ? 0 : color === 'blue' ? 13 : color === 'yellow' ? 26 : 39) + finalStep;
            if ([0, 8, 13, 21, 26, 34, 39, 47].includes(trackPos % 52)) {
              sounds.playSafeZone();
            }
          }

          if (nextState.winner === color) {
            triggerBotReaction(color, 'win');
          }

          setGameState(nextState);

          if (gameState.mode === 'online_room') {
            fetch(`/api/rooms/${gameState.id}/move`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tokenId }),
            }).catch(() => {});
          }
        }
      }, isFastBot ? 80 : 140);
    },
    [gameState, isFastBot, isHopping, triggerBotReaction]
  );

  // Automated Client-Side Bot Loop (Single Player & Local Play)
  useEffect(() => {
    if (gameState.mode === 'online_room') return; // Handled by server scheduler
    if (gameState.status !== 'playing' || isHopping) return;

    const currentPlayer = getCurrentPlayer(gameState);
    if (!currentPlayer || currentPlayer.type !== 'bot') {
      if (botTurnTimerRef.current) {
        clearTimeout(botTurnTimerRef.current);
        botTurnTimerRef.current = null;
      }
      return;
    }

    const botDelay = isFastBot ? 300 : 700;

    // Phase 1: Bot rolls dice
    if (!gameState.hasRolled && !gameState.isRolling) {
      botTurnTimerRef.current = setTimeout(() => {
        sounds.playDiceRoll();
        setGameState((prev) => ({ ...prev, isRolling: true }));

        setTimeout(() => {
          setGameState((prev) => {
            const rolled = rollDice(prev, undefined, false);
            if (rolled.diceValue === 6 && Math.random() < 0.5) {
              triggerBotReaction(currentPlayer.color, 'roll6');
            }
            if (rolled.lastAction?.type === 'pass') {
              sounds.playPass();
            }
            return rolled;
          });
        }, botDelay * 0.7);
      }, botDelay);

      return () => {
        if (botTurnTimerRef.current) clearTimeout(botTurnTimerRef.current);
      };
    }

    // Phase 2: Bot picks legal move
    if (gameState.hasRolled && gameState.movableTokenIds.length > 0) {
      botTurnTimerRef.current = setTimeout(() => {
        const bestToken = selectBotMove(gameState);
        if (bestToken !== null) {
          executeMoveToken(bestToken);
        }
      }, botDelay);

      return () => {
        if (botTurnTimerRef.current) clearTimeout(botTurnTimerRef.current);
      };
    }
  }, [gameState, isFastBot, isHopping, executeMoveToken, triggerBotReaction]);

  // Restart / Rematch
  const handleRestart = () => {
    const human = gameState.players.find((p) => p.type === 'human') || gameState.players[0];
    const botCount = gameState.players.filter((p) => p.type === 'bot').length;
    const freshGame = createNewGame(gameState.mode, human.name, human.color, botCount, gameState.id);
    setGameState(freshGame);
  };

  // Launch New Game Setup
  const handleStartGame = (config: {
    mode: 'single_player' | 'pass_and_play' | 'online_room';
    playerName: string;
    playerColor: PlayerColor;
    botCount: number;
    botDifficulty: BotDifficulty;
    roomId?: string;
  }) => {
    const roomId = config.roomId || 'ROOM-' + Math.floor(1000 + Math.random() * 9000);
    const newGame = createNewGame(
      config.mode,
      config.playerName,
      config.playerColor,
      config.botCount,
      roomId
    );

    newGame.players.forEach((p) => {
      if (p.type === 'bot') {
        p.botDifficulty = config.botDifficulty;
      }
    });

    setGameState(newGame);
    setIsSetupOpen(false);
  };

  const currentPlayer = getCurrentPlayer(gameState);
  const currentTheme = currentPlayer ? COLOR_HEX[currentPlayer.color] : COLOR_HEX.red;
  const isHumanTurn = currentPlayer?.type === 'human';

  // Find player for each of the 4 board corners
  const greenPlayer = gameState.players.find((p) => p.color === 'green');
  const yellowPlayer = gameState.players.find((p) => p.color === 'yellow');
  const redPlayer = gameState.players.find((p) => p.color === 'red');
  const bluePlayer = gameState.players.find((p) => p.color === 'blue');

  // One-click dice tap when exactly 1 move is available
  const handleDiceOrAutoMove = () => {
    if (!gameState.hasRolled) {
      handleRollDice();
    } else if (gameState.movableTokenIds.length === 1 && !isHopping) {
      executeMoveToken(gameState.movableTokenIds[0]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-1.5 sm:p-4 selection:bg-amber-500 selection:text-slate-950 font-outfit">
      
      {/* Animated Emoji Floating Layer */}
      <AnimatedEmojiOverlay
        events={emojiEvents}
        onSendEmoji={handleSendEmoji}
        playerColor={redPlayer?.color}
      />

      {/* Victory & Winner Podium Modal */}
      <VictoryModal
        gameState={gameState}
        onRestart={handleRestart}
        onNewGameSetup={() => setIsSetupOpen(true)}
      />

      {/* Game Setup Dialog */}
      <GameSetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        onStartGame={handleStartGame}
      />

      {/* Rules & Help Modal */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      {/* Main Container - Mobile Phone Frame or Expanded View */}
      <div
        className={`w-full flex flex-col transition-all duration-300 ${
          isMobileFrame
            ? 'max-w-[420px] rounded-3xl bg-slate-900/95 border-2 border-slate-800 shadow-2xl p-2.5 sm:p-3 my-1'
            : 'max-w-2xl bg-slate-900/80 rounded-3xl p-4 border border-slate-800'
        }`}
      >
        {/* ================= HEADER BAR ================= */}
        <header className="flex items-center justify-between gap-2 px-1 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 shadow-md">
              <Sparkles className="w-4 h-4 fill-slate-950" />
            </div>
            <div>
              <h1 className="font-fredoka font-black text-sm sm:text-base tracking-wide text-white leading-tight">
                LUDO ROYAL
              </h1>
              <span className="text-[10px] font-bold text-amber-400 capitalize flex items-center gap-1">
                {gameState.mode.replace('_', ' ')}
                {gameState.mode === 'single_player' && ' 🤖'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Room Code Badge */}
            <button
              onClick={handleCopyRoomCode}
              className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/80 text-[11px] font-mono flex items-center gap-1 shadow-sm cursor-pointer"
              title="Click to copy Room Code"
            >
              <span>{gameState.id}</span>
              {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
            </button>

            {/* Sound Mute Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isMuted
                  ? 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                  : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300'
              }`}
              title={isMuted ? 'Unmute Sounds' : 'Mute Sounds'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Rules Dialog */}
            <button
              onClick={() => {
                sounds.playClick();
                setIsRulesOpen(true);
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="How to Play"
            >
              <BookOpen className="w-4 h-4" />
            </button>

            {/* Setup / Settings */}
            <button
              onClick={() => {
                sounds.playClick();
                setIsSetupOpen(true);
              }}
              className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-400 transition-all cursor-pointer"
              title="Game Setup / Modes"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ================= TURN STATUS BANNER ================= */}
        <div className="my-2 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <span
              className="w-2.5 h-2.5 rounded-full animate-ping flex-shrink-0"
              style={{ backgroundColor: currentTheme.primary }}
            />
            <span className="font-bold text-white truncate">
              {currentPlayer?.name}
              <span className="font-normal text-slate-400 ml-1">
                ({currentPlayer?.color.toUpperCase()})
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1 font-semibold text-[11px]" style={{ color: currentTheme.light }}>
            {gameState.isRolling ? (
              <span className="animate-pulse">Rolling dice...</span>
            ) : isHopping ? (
              <span className="animate-bounce">Moving token...</span>
            ) : gameState.diceValue !== null ? (
              gameState.movableTokenIds.length > 0 ? (
                <span>Rolled {gameState.diceValue}! Tap piece to move</span>
              ) : (
                <span>Rolled {gameState.diceValue} — No moves!</span>
              )
            ) : isHumanTurn ? (
              <span className="animate-bounce">Tap dice to roll!</span>
            ) : (
              <span>Bot turn...</span>
            )}
          </div>
        </div>

        {/* ================= TOP PLAYER STATIONS ================= */}
        <div className="grid grid-cols-2 gap-2 mb-1.5">
          {/* Top-Left: Green Player */}
          {greenPlayer && (
            <PlayerCard
              player={greenPlayer}
              isCurrentTurn={gameState.currentTurn === 'green'}
              diceValue={gameState.diceValue}
              isRolling={gameState.isRolling}
              canRoll={gameState.currentTurn === 'green' && (!gameState.hasRolled || gameState.movableTokenIds.length === 1)}
              onRoll={handleDiceOrAutoMove}
              tokens={gameState.tokens.green}
              position="top-left"
              isRankedWinner={gameState.rankings.includes('green')}
            />
          )}

          {/* Top-Right: Yellow Player */}
          {yellowPlayer && (
            <PlayerCard
              player={yellowPlayer}
              isCurrentTurn={gameState.currentTurn === 'yellow'}
              diceValue={gameState.diceValue}
              isRolling={gameState.isRolling}
              canRoll={gameState.currentTurn === 'yellow' && (!gameState.hasRolled || gameState.movableTokenIds.length === 1)}
              onRoll={handleDiceOrAutoMove}
              tokens={gameState.tokens.yellow}
              position="top-right"
              isRankedWinner={gameState.rankings.includes('yellow')}
            />
          )}
        </div>

        {/* ================= CENTRAL 15X15 LUDO BOARD ================= */}
        <div className="relative my-auto flex items-center justify-center">
          <LudoBoard
            gameState={gameState}
            onTokenClick={executeMoveToken}
            isCurrentPlayerTurn={(isHumanTurn || gameState.mode === 'pass_and_play') && !isHopping}
            animatedTokenOverride={animatedTokenStep}
          />
        </div>

        {/* ================= BOTTOM PLAYER STATIONS ================= */}
        <div className="grid grid-cols-2 gap-2 mt-1.5">
          {/* Bottom-Left: Red Player */}
          {redPlayer && (
            <PlayerCard
              player={redPlayer}
              isCurrentTurn={gameState.currentTurn === 'red'}
              diceValue={gameState.diceValue}
              isRolling={gameState.isRolling}
              canRoll={gameState.currentTurn === 'red' && (!gameState.hasRolled || gameState.movableTokenIds.length === 1)}
              onRoll={handleDiceOrAutoMove}
              tokens={gameState.tokens.red}
              position="bottom-left"
              isRankedWinner={gameState.rankings.includes('red')}
            />
          )}

          {/* Bottom-Right: Blue Player */}
          {bluePlayer && (
            <PlayerCard
              player={bluePlayer}
              isCurrentTurn={gameState.currentTurn === 'blue'}
              diceValue={gameState.diceValue}
              isRolling={gameState.isRolling}
              canRoll={gameState.currentTurn === 'blue' && (!gameState.hasRolled || gameState.movableTokenIds.length === 1)}
              onRoll={handleDiceOrAutoMove}
              tokens={gameState.tokens.blue}
              position="bottom-right"
              isRankedWinner={gameState.rankings.includes('blue')}
            />
          )}
        </div>

        {/* ================= QUICK EMOJI BAR ================= */}
        <div className="mt-2">
          <QuickEmojiBar onSendEmoji={handleSendEmoji} />
        </div>

        {/* ================= RECENT EVENT TICKER ================= */}
        <div className="mt-2 px-3 py-1.5 rounded-xl bg-slate-950/50 border border-slate-850 text-[11px] text-slate-400 truncate flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="truncate">
            {gameState.history[0] || 'Game in progress...'}
          </span>
        </div>

        {/* ================= MOBILE BOTTOM ACTIONS BAR ================= */}
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
          {/* Fast Bot Toggle */}
          <button
            onClick={() => {
              sounds.playClick();
              setIsFastBot(!isFastBot);
            }}
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isFastBot
                ? 'bg-amber-500/20 border-amber-400 text-amber-400 shadow-sm'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
            title="Toggle Bot Speed"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Fast Bot {isFastBot ? 'ON' : 'OFF'}</span>
          </button>

          {/* Mobile Frame Toggle */}
          <button
            onClick={() => {
              sounds.playClick();
              setIsMobileFrame(!isMobileFrame);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title={isMobileFrame ? 'Expand View' : 'Phone App View'}
          >
            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
            <span>{isMobileFrame ? 'Phone View' : 'Wide View'}</span>
          </button>

          {/* New Game / Reset */}
          <button
            onClick={() => {
              sounds.playClick();
              handleRestart();
            }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-200 border border-slate-700 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
            title="Restart current round"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart</span>
          </button>
        </div>

      </div>
    </div>
  );
}
