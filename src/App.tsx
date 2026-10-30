/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from './lib/ludoEngine.js';
import { sounds } from './lib/audioEffects.js';
import { LudoBoard } from './components/LudoBoard.js';
import { PlayerCard } from './components/PlayerCard.js';
import { SharedDiceControl } from './components/SharedDiceControl.js';
import { GameEntryScreen, BotGameConfig, PassAndPlayConfigInput } from './components/GameEntryScreen.js';
import { WaitingRoomView } from './components/WaitingRoomView.js';
import { AnimatedEmojiOverlay, QuickEmojiBar } from './components/AnimatedEmojiOverlay.js';
import { VictoryModal } from './components/VictoryModal.js';
import { RulesModal } from './components/RulesModal.js';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  BookOpen,
  Copy,
  Check,
  ArrowLeft,
  Crown,
  Zap,
} from 'lucide-react';

type AppView = 'menu' | 'waiting_room' | 'game';

export default function App() {
  // App navigation view: 'menu' (entry screen), 'waiting_room' (online lobby), 'game' (play arena)
  const [currentView, setCurrentView] = useState<AppView>('menu');

  // Game State
  const [gameState, setGameState] = useState<GameState>(() =>
    createNewGame('single_player', 'You', 'red', 3)
  );

  // Online multiplayer state
  const [isHost, setIsHost] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [myPlayerToken, setMyPlayerToken] = useState<string>('');
  const [isLoadingOnline, setIsLoadingOnline] = useState(false);
  const [onlineErrorMessage, setOnlineErrorMessage] = useState<string | null>(null);

  // Audio mute state
  const [isMuted, setIsMuted] = useState(() => sounds.getMuted());

  // Rules Modal
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Fast bot mode toggle
  const [isFastBot, setIsFastBot] = useState(false);

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
      const activePlayer = gameState.players.find((p) => p.id === myPlayerId) ||
        gameState.players.find((p) => p.type === 'human') ||
        gameState.players[0];

      const newEvent: EmojiEvent = {
        id: 'emoji-' + Math.random().toString(36).substring(2, 9),
        senderId: activePlayer.id,
        senderName: activePlayer.name,
        senderColor: activePlayer.color,
        emoji,
        text,
        timestamp: Date.now(),
      };

      if (gameState.mode === 'online_room') {
        fetch(`/api/rooms/${gameState.id}/emoji`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${myPlayerToken}`,
          },
          body: JSON.stringify(newEvent),
        }).catch(() => {});
      } else {
        setEmojiEvents((prev) => [...prev.slice(-15), newEvent]);
      }
    },
    [gameState.id, gameState.mode, gameState.players, myPlayerId, myPlayerToken]
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
    if (gameState.mode === 'online_room' && (currentView === 'waiting_room' || currentView === 'game')) {
      const source = new EventSource(`/api/rooms/${gameState.id}/stream`);
      sseRef.current = source;

      source.addEventListener('state_update', (e) => {
        try {
          const updatedState = JSON.parse(e.data) as GameState;
          setGameState((prev) => {
            if (updatedState.diceValue !== prev.diceValue && updatedState.diceValue !== null) {
              sounds.playDiceRoll();
            }
            return updatedState;
          });

          // If game started, automatically switch from waiting room to game view
          if (updatedState.status === 'playing' && currentView === 'waiting_room') {
            setCurrentView('game');
          }
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
  }, [gameState.id, gameState.mode, currentView]);

  // Handle Dice Rolling
  const handleRollDice = useCallback(() => {
    if (gameState.hasRolled || gameState.isRolling || gameState.status !== 'playing' || isHopping) {
      return;
    }

    if (gameState.mode === 'online_room') {
      // Authoritative Server Roll
      fetch(`/api/rooms/${gameState.id}/roll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${myPlayerToken}`,
        },
        body: JSON.stringify({ playerId: myPlayerId }),
      }).catch(() => {});
      return;
    }

    // Local Single Player / Pass & Play Roll
    sounds.playDiceRoll();
    setGameState((prev) => ({ ...prev, isRolling: true }));

    setTimeout(() => {
      setGameState((prev) => {
        const rolled = rollDice(prev, undefined, false);
        if (rolled.lastAction?.type === 'pass') {
          sounds.playPass();
        } else if (rolled.diceValue === 6) {
          sounds.playSpawn();
        }
        return rolled;
      });
    }, 500);
  }, [gameState.hasRolled, gameState.isRolling, gameState.status, gameState.id, gameState.mode, isHopping, myPlayerId, myPlayerToken]);

  // Delayed Turn Pass when no moves are available
  useEffect(() => {
    if (gameState.mode === 'online_room') return; // Handled authoritatively by server
    if (gameState.hasRolled && gameState.movableTokenIds.length === 0 && gameState.status === 'playing') {
      const delay = isFastBot ? 600 : 1100;
      passTurnTimerRef.current = setTimeout(() => {
        setGameState((prev) => passTurn(prev));
      }, delay);

      return () => {
        if (passTurnTimerRef.current) clearTimeout(passTurnTimerRef.current);
      };
    }
  }, [gameState.hasRolled, gameState.movableTokenIds.length, gameState.status, gameState.mode, isFastBot]);

  // Move Token Action
  const executeMoveToken = useCallback(
    (tokenId: number) => {
      if (!gameState.hasRolled || gameState.diceValue === null || isHopping) return;
      if (!gameState.movableTokenIds.includes(tokenId)) return;

      if (gameState.mode === 'online_room') {
        // Authoritative Server Move
        fetch(`/api/rooms/${gameState.id}/move`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${myPlayerToken}`,
          },
          body: JSON.stringify({ tokenId, playerId: myPlayerId }),
        }).catch(() => {});
        return;
      }

      // Local Single Player / Pass & Play Move
      const color = gameState.currentTurn;
      const nextState = moveToken(gameState, tokenId);
      const actionType = nextState.lastAction?.type;

      if (actionType === 'capture') {
        triggerBotReaction(color, 'capture');
      } else if (actionType === 'home') {
        triggerBotReaction(color, 'home');
      }

      if (nextState.winner === color) {
        triggerBotReaction(color, 'win');
      }

      setGameState(nextState);
    },
    [gameState, isHopping, myPlayerId, myPlayerToken, triggerBotReaction]
  );

  // Automated Client-Side Bot Loop (Single Player Match)
  useEffect(() => {
    if (gameState.mode === 'online_room') return; // Handled by server scheduler
    if (gameState.status !== 'playing' || isHopping) return;

    const currentP = getCurrentPlayer(gameState);
    if (!currentP || currentP.type !== 'bot') {
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
            if (rolled.diceValue === 6 && Math.random() < 0.6) {
              triggerBotReaction(currentP.color, 'roll6');
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

  // Restart Current Round
  const handleRestart = () => {
    if (gameState.mode === 'online_room') {
      fetch(`/api/rooms/${gameState.id}/restart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${myPlayerToken}`,
        },
        body: JSON.stringify({ playerId: myPlayerId }),
      }).catch(() => {});
      return;
    }
    const human = gameState.players.find((p) => p.type === 'human') || gameState.players[0];
    const botCount = gameState.players.filter((p) => p.type === 'bot').length;
    const freshGame = createNewGame(gameState.mode, human.name, human.color, botCount, gameState.id);
    setGameState(freshGame);
  };

  // Launch Bot Game from Entry Screen
  const handleStartBotGame = (config: BotGameConfig) => {
    const newGame = createNewGame(
      'single_player',
      config.playerName,
      config.playerColor,
      config.botCount,
      'BOT-' + Math.floor(1000 + Math.random() * 9000)
    );
    newGame.players.forEach((p) => {
      if (p.type === 'bot') {
        p.botDifficulty = config.difficulty;
      }
    });
    setGameState(newGame);
    setCurrentView('game');
  };

  // Launch Pass & Play from Entry Screen
  const handleStartPassAndPlay = (config: PassAndPlayConfigInput) => {
    const newGame = createNewGame(
      'pass_and_play',
      config.players[0].name,
      config.players[0].color,
      0,
      'LOCAL-' + Math.floor(1000 + Math.random() * 9000),
      {
        playerCount: config.playerCount,
        players: config.players,
      }
    );
    setGameState(newGame);
    setCurrentView('game');
  };

  // Create Online Room
  const handleCreateOnlineRoom = async (playerName: string, playerColor: PlayerColor) => {
    setIsLoadingOnline(true);
    setOnlineErrorMessage(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'online_room',
          playerName,
          playerColor,
          botCount: 0,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned an unexpected non-JSON response. Please check server deployment.');
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to create online room.');
      }

      setGameState(data);
      setIsHost(true);
      setMyPlayerId(data.assignedPlayerId || data.players[0].id);
      setMyPlayerToken(data.playerToken || '');
      if (typeof window !== 'undefined' && data.playerToken) {
        try {
          localStorage.setItem(`ludo_token_${data.id}`, data.playerToken);
        } catch {}
      }
      setCurrentView('waiting_room');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setOnlineErrorMessage('Room creation timed out. Please check server deployment.');
      } else {
        setOnlineErrorMessage(err?.message || 'Error connecting to room server.');
      }
    } finally {
      setIsLoadingOnline(false);
    }
  };

  // Join Existing Online Room
  const handleJoinOnlineRoom = async (roomId: string, playerName: string) => {
    setIsLoadingOnline(true);
    setOnlineErrorMessage(null);
    try {
      const normalizedRoomId = roomId.trim().toUpperCase();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(`/api/rooms/${encodeURIComponent(normalizedRoomId)}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: playerName.trim() }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Room not found or server returned an unexpected response.');
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to join online room.');
      }

      setGameState(data);
      setIsHost(false);
      setMyPlayerId(data.assignedPlayerId);
      setMyPlayerToken(data.playerToken || '');
      if (typeof window !== 'undefined' && data.playerToken) {
        try {
          localStorage.setItem(`ludo_token_${data.id}`, data.playerToken);
        } catch {}
      }

      if (data.status === 'playing') {
        setCurrentView('game');
      } else {
        setCurrentView('waiting_room');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setOnlineErrorMessage('Join request timed out. Please check room code.');
      } else {
        setOnlineErrorMessage(err?.message || 'Error joining online room.');
      }
    } finally {
      setIsLoadingOnline(false);
    }
  };

  // Start Online Game (Host Trigger)
  const handleStartOnlineGame = async () => {
    try {
      const res = await fetch(`/api/rooms/${gameState.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${myPlayerToken}`,
        },
        body: JSON.stringify({ playerId: myPlayerId }),
      });
      if (res.ok) {
        const startedState = (await res.json()) as GameState;
        setGameState(startedState);
        setCurrentView('game');
      } else {
        const data = await res.json();
        alert(data.error || 'Could not start game');
      }
    } catch {}
  };

  // Leave Waiting Room / Game
  const handleLeaveRoom = () => {
    sounds.playClick();
    if (gameState.mode === 'online_room' && myPlayerId) {
      fetch(`/api/rooms/${gameState.id}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${myPlayerToken}`,
        },
        body: JSON.stringify({ playerId: myPlayerId }),
      }).catch(() => {});

      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(`ludo_token_${gameState.id}`);
        } catch {}
      }
    }
    if (sseRef.current) {
      sseRef.current.close();
    }
    setCurrentView('menu');
  };

  // Handle Turn Timeout (auto-play or auto-pass on 15s expiration)
  const handleTurnTimeout = useCallback(() => {
    if (gameState.status !== 'playing' || isHopping) return;

    if (gameState.mode === 'online_room') {
      const curP = getCurrentPlayer(gameState);
      if (curP?.id !== myPlayerId) return;
    }

    if (!gameState.hasRolled && !gameState.isRolling) {
      handleRollDice();
    } else if (gameState.hasRolled && gameState.movableTokenIds.length > 0) {
      executeMoveToken(gameState.movableTokenIds[0]);
    } else if (gameState.hasRolled && gameState.movableTokenIds.length === 0) {
      if (gameState.mode !== 'online_room') {
        setGameState((prev) => passTurn(prev));
      }
    }
  }, [gameState, myPlayerId, isHopping, handleRollDice, executeMoveToken]);

  const turnKey = `${gameState.currentTurn}-${gameState.hasRolled ? 'rolled' : 'unrolled'}-${gameState.diceValue || 0}-${gameState.history.length}`;

  // Turn status calculations
  const currentPlayer = getCurrentPlayer(gameState);

  const isHumanTurn =
    gameState.mode === 'pass_and_play'
      ? true
      : gameState.mode === 'online_room'
      ? currentPlayer?.id === myPlayerId
      : currentPlayer?.type === 'human';

  const canRoll =
    isHumanTurn &&
    !gameState.hasRolled &&
    !gameState.isRolling &&
    gameState.status === 'playing' &&
    !isHopping;

  // Render player stations according to participants
  const greenPlayer = gameState.players.find((p) => p.color === 'green');
  const yellowPlayer = gameState.players.find((p) => p.color === 'yellow');
  const redPlayer = gameState.players.find((p) => p.color === 'red');
  const bluePlayer = gameState.players.find((p) => p.color === 'blue');

  // VIEW 1: Initial Game Entry Screen
  if (currentView === 'menu') {
    return (
      <>
        <GameEntryScreen
          onStartBotGame={handleStartBotGame}
          onStartPassAndPlay={handleStartPassAndPlay}
          onCreateOnlineRoom={handleCreateOnlineRoom}
          onJoinOnlineRoom={handleJoinOnlineRoom}
          isLoading={isLoadingOnline}
          errorMessage={onlineErrorMessage}
          onOpenRules={() => setIsRulesOpen(true)}
        />
        <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      </>
    );
  }

  // VIEW 2: Waiting Room Lobby for Play with Friends
  if (currentView === 'waiting_room') {
    return (
      <>
        <WaitingRoomView
          gameState={gameState}
          isHost={isHost}
          onStartGame={handleStartOnlineGame}
          onLeaveRoom={handleLeaveRoom}
        />
        <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      </>
    );
  }

  // VIEW 3: Gameplay Arena
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-2 sm:p-4 selection:bg-amber-500 selection:text-slate-950 font-outfit relative overflow-x-hidden">
      {/* Background Lighting */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/10 via-slate-950/80 to-slate-950 -z-10" />

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
        onNewGameSetup={() => setCurrentView('menu')}
      />

      {/* Rules & Help Modal */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* Main Board Arena Container */}
      <div className="w-full max-w-xl md:max-w-2xl bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-800 shadow-2xl p-2.5 sm:p-4 flex flex-col gap-2 my-auto">
        {/* ================= HEADER BAR ================= */}
        <header className="flex items-center justify-between gap-2.5 px-2 py-2 sm:px-3 sm:py-2.5 bg-slate-950/40 rounded-2xl border border-slate-800/60 mb-0.5">
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleLeaveRoom}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Return to Main Menu"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Menu</span>
            </button>

            {/* Brand Logo & Title Lockup */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-950 p-1 border border-slate-700/80 shadow-sm flex items-center justify-center shrink-0">
                <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <rect x="2" y="2" width="14" height="14" rx="3.5" fill="#EF4444" />
                  <rect x="20" y="2" width="14" height="14" rx="3.5" fill="#10B981" />
                  <rect x="2" y="20" width="14" height="14" rx="3.5" fill="#3B82F6" />
                  <rect x="20" y="20" width="14" height="14" rx="3.5" fill="#F59E0B" />
                  <circle cx="9" cy="9" r="2.5" fill="white" fillOpacity="0.95" />
                  <circle cx="27" cy="9" r="2.5" fill="white" fillOpacity="0.95" />
                  <circle cx="9" cy="27" r="2.5" fill="white" fillOpacity="0.95" />
                  <circle cx="27" cy="27" r="2.5" fill="white" fillOpacity="0.95" />
                  <rect x="12" y="12" width="12" height="12" rx="3" fill="#0B1020" stroke="#F59E0B" strokeWidth="1.2" />
                  <path d="M14.5 20.5H21.5L22 17.5L19.5 18.5L18 15.5L16.5 18.5L14 17.5L14.5 20.5Z" fill="#FBBF24" />
                </svg>
              </div>

              <div>
                <h1 className="font-outfit font-extrabold text-sm sm:text-base tracking-tight text-white leading-none flex items-center gap-1">
                  <span>LUDO</span>
                  <span className="text-amber-300/90 font-black">ROYAL</span>
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] sm:text-[11px] font-medium text-amber-200/80 tracking-wide">
                    {gameState.mode === 'single_player'
                      ? 'AI Battle'
                      : gameState.mode === 'pass_and_play'
                      ? 'Pass & Play'
                      : 'Online Match'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Supporting Information Chips */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Player Count Chip */}
            <div className="hidden sm:inline-flex items-center px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-[11px] font-medium text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
              <span>{gameState.players.length} Players</span>
            </div>

            {/* Room Code Badge (if online room) */}
            {gameState.mode === 'online_room' && (
              <button
                onClick={handleCopyRoomCode}
                className="px-2 sm:px-2.5 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-200/90 border border-amber-400/30 text-[11px] sm:text-xs font-mono font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer transition active:scale-95"
                title="Click to copy Room Code"
              >
                <span className="text-[9px] uppercase font-sans text-amber-300/70 font-bold hidden xs:inline">Room</span>
                <span>{gameState.id}</span>
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-300/70" />}
              </button>
            )}

            {/* Sound Mute Toggle */}
            <button
              onClick={toggleSound}
              className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer shadow-sm active:scale-95 ${
                isMuted
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-400 hover:bg-rose-500/25'
                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isMuted ? 'Unmute Sounds' : 'Mute Sounds'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* ================= TOP PLAYER STATIONS ================= */}
        <div className="grid grid-cols-2 gap-2">
          {redPlayer ? (
            <PlayerCard
              player={redPlayer}
              isCurrentTurn={gameState.currentTurn === 'red'}
              tokens={gameState.tokens.red}
              position="top-left"
              isRankedWinner={gameState.rankings.includes('red')}
              turnDurationSeconds={15}
              turnKey={turnKey}
              onTurnTimeout={handleTurnTimeout}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-800/60 p-2 flex items-center justify-center text-[10px] text-slate-600 font-bold uppercase">
              Empty Red Seat
            </div>
          )}

          {greenPlayer ? (
            <PlayerCard
              player={greenPlayer}
              isCurrentTurn={gameState.currentTurn === 'green'}
              tokens={gameState.tokens.green}
              position="top-right"
              isRankedWinner={gameState.rankings.includes('green')}
              turnDurationSeconds={15}
              turnKey={turnKey}
              onTurnTimeout={handleTurnTimeout}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-800/60 p-2 flex items-center justify-center text-[10px] text-slate-600 font-bold uppercase">
              Empty Green Seat
            </div>
          )}
        </div>

        {/* ================= CENTRAL 15X15 LUDO BOARD ================= */}
        <div className="relative my-1 flex items-center justify-center">
          <LudoBoard
            gameState={gameState}
            onTokenClick={executeMoveToken}
            isCurrentPlayerTurn={isHumanTurn && !isHopping}
            isFastBot={isFastBot}
            onAnimationStateChange={(animating) => setIsHopping(animating)}
          />
        </div>

        {/* ================= BOTTOM PLAYER STATIONS & CENTRAL ROLL DICE ================= */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          {bluePlayer ? (
            <PlayerCard
              player={bluePlayer}
              isCurrentTurn={gameState.currentTurn === 'blue'}
              tokens={gameState.tokens.blue}
              position="bottom-left"
              isRankedWinner={gameState.rankings.includes('blue')}
              turnDurationSeconds={15}
              turnKey={turnKey}
              onTurnTimeout={handleTurnTimeout}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-800/60 p-2 flex items-center justify-center text-[10px] text-slate-600 font-bold uppercase">
              Empty Blue
            </div>
          )}

          {/* Central Dice Control in middle between bottom player stations */}
          {currentPlayer && (
            <SharedDiceControl
              gameState={gameState}
              activePlayer={currentPlayer}
              isRolling={gameState.isRolling}
              canRoll={canRoll}
              onRoll={handleRollDice}
              onQuickMove={executeMoveToken}
            />
          )}

          {yellowPlayer ? (
            <PlayerCard
              player={yellowPlayer}
              isCurrentTurn={gameState.currentTurn === 'yellow'}
              tokens={gameState.tokens.yellow}
              position="bottom-right"
              isRankedWinner={gameState.rankings.includes('yellow')}
              turnDurationSeconds={15}
              turnKey={turnKey}
              onTurnTimeout={handleTurnTimeout}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-800/60 p-2 flex items-center justify-center text-[10px] text-slate-600 font-bold uppercase">
              Empty Yellow
            </div>
          )}
        </div>

        {/* ================= RECENT EVENT TICKER & FAST BOT TOGGLE ================= */}
        <div className="flex items-center justify-between gap-2 px-1 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="truncate">{gameState.history[0] || 'Game started! Good luck!'}</span>
          </div>

          {gameState.mode === 'single_player' && (
            <button
              onClick={() => {
                sounds.playClick();
                setIsFastBot(!isFastBot);
              }}
              className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold shrink-0 transition ${
                isFastBot
                  ? 'bg-amber-500/20 border-amber-400 text-amber-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              Fast Bot: {isFastBot ? 'ON' : 'OFF'}
            </button>
          )}
        </div>

        {/* ================= QUICK EMOJI BAR ================= */}
        <QuickEmojiBar onSendEmoji={handleSendEmoji} />
      </div>
    </div>
  );
}
