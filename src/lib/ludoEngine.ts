/**
 * Ludo Core Game Engine
 * Standard 4-player Ludo rules with 52 common track squares,
 * 4 base quadrants, 4 color home columns, safe star squares,
 * exact roll home entry, bonus rolls on 6 and capture.
 */

export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';
export type PlayerType = 'human' | 'bot';
export type BotDifficulty = 'easy' | 'medium' | 'hard';

export interface Token {
  id: number; // 0, 1, 2, 3 per color
  color: PlayerColor;
  stepCount: number; // -1: in base, 0-50: on common track, 51-55: in home column, 56: in home triangle
  state: 'base' | 'track' | 'homeColumn' | 'home';
}

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  type: PlayerType;
  avatar: string;
  isReady: boolean;
  botDifficulty?: BotDifficulty;
}

export type LudoActionType = 'roll' | 'move' | 'capture' | 'spawn' | 'home' | 'pass';

export interface GameState {
  id: string;
  name: string;
  mode: 'single_player' | 'pass_and_play' | 'online_room';
  players: Player[];
  tokens: Record<PlayerColor, Token[]>;
  currentTurn: PlayerColor;
  diceValue: number | null;
  hasRolled: boolean;
  isRolling: boolean;
  consecutiveSixes: number;
  movableTokenIds: number[];
  status: 'waiting' | 'playing' | 'finished';
  winner: PlayerColor | null;
  rankings: PlayerColor[];
  history: string[];
  turnTimeRemaining?: number;
  lastAction?: {
    type: LudoActionType;
    color: PlayerColor;
    tokenId?: number;
    value?: number;
    description: string;
    timestamp: number;
  };
}

export interface EmojiEvent {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: PlayerColor;
  emoji: string;
  text?: string;
  timestamp: number;
}

// Track starting offsets for each color in the 52-tile track
export const COLOR_START_OFFSETS: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

// Safe spots (0-indexed common track positions)
// 8 safe spots: starting tile for each of the 4 colors + 4 star safe tiles
export const SAFE_TRACK_POSITIONS = new Set<number>([
  0,  // Red Start
  8,  // Red sector safe star
  13, // Green Start
  21, // Green sector safe star
  26, // Yellow Start
  34, // Yellow sector safe star
  39, // Blue Start
  47, // Blue sector safe star
]);

export const COLOR_ORDER: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

export const COLOR_HEX: Record<PlayerColor, { primary: string; light: string; dark: string; border: string; bg: string }> = {
  red: {
    primary: '#ef4444',
    light: '#fca5a5',
    dark: '#991b1b',
    border: '#b91c1c',
    bg: '#fef2f2',
  },
  green: {
    primary: '#10b981',
    light: '#6ee7b7',
    dark: '#065f46',
    border: '#047857',
    bg: '#ecfdf5',
  },
  yellow: {
    primary: '#eab308',
    light: '#fde047',
    dark: '#854d0e',
    border: '#a16207',
    bg: '#fefce8',
  },
  blue: {
    primary: '#3b82f6',
    light: '#93c5fd',
    dark: '#1e40af',
    border: '#1d4ed8',
    bg: '#eff6ff',
  },
};

export const BOT_PROFILES = [
  { name: 'Blitz Bot', avatar: '⚡', difficulty: 'medium' as BotDifficulty },
  { name: 'Captain Ludo', avatar: '👑', difficulty: 'hard' as BotDifficulty },
  { name: 'Sparky AI', avatar: '🤖', difficulty: 'easy' as BotDifficulty },
  { name: 'Dice Master', avatar: '🎲', difficulty: 'hard' as BotDifficulty },
];

/**
 * Creates 4 tokens for a given color initialized in the base
 */
export function createInitialTokens(color: PlayerColor): Token[] {
  return [0, 1, 2, 3].map((id) => ({
    id,
    color,
    stepCount: -1,
    state: 'base',
  }));
}

export interface PassAndPlayConfig {
  playerCount: number; // 2, 3, or 4
  players?: Array<{ name: string; color: PlayerColor; avatar?: string }>;
}

export const DIAGONAL_OPPOSITE_COLOR: Record<PlayerColor, PlayerColor> = {
  red: 'yellow',
  yellow: 'red',
  green: 'blue',
  blue: 'green',
};

/**
 * Creates initial game state
 */
export function createNewGame(
  mode: GameState['mode'] = 'single_player',
  playerName: string = 'You',
  playerColor: PlayerColor = 'red',
  botCount: number = 3,
  roomId: string = 'LUDO-' + Math.floor(1000 + Math.random() * 9000),
  passAndPlayConfig?: PassAndPlayConfig
): GameState {
  const players: Player[] = [];

  if (mode === 'single_player') {
    // Add human player
    players.push({
      id: 'player-1',
      name: playerName.trim() || 'Player 1',
      color: playerColor,
      type: 'human',
      avatar: '😎',
      isReady: true,
    });

    const count = Math.max(1, Math.min(3, botCount));
    if (count === 1) {
      // For 1v1 (2 players total), place the bot in the diagonally opposite window/corner
      const botColor = DIAGONAL_OPPOSITE_COLOR[playerColor];
      const botProfile = BOT_PROFILES[0];
      players.push({
        id: 'bot-1',
        name: botProfile.name,
        color: botColor,
        type: 'bot',
        avatar: botProfile.avatar,
        isReady: true,
        botDifficulty: botProfile.difficulty,
      });
    } else {
      const otherColors = COLOR_ORDER.filter((c) => c !== playerColor);
      for (let i = 0; i < count; i++) {
        const botProfile = BOT_PROFILES[i % BOT_PROFILES.length];
        players.push({
          id: `bot-${i + 1}`,
          name: botProfile.name,
          color: otherColors[i],
          type: 'bot',
          avatar: botProfile.avatar,
          isReady: true,
          botDifficulty: botProfile.difficulty,
        });
      }
    }
  } else if (mode === 'pass_and_play') {
    // Pass and play with 2, 3, or 4 human players ONLY - NEVER ADD BOTS!
    const count = Math.max(2, Math.min(4, passAndPlayConfig?.playerCount ?? 2));
    const defaultAvatars: Record<PlayerColor, string> = {
      red: '🦁',
      blue: '🐬',
      yellow: '🦅',
      green: '🐯',
    };

    if (passAndPlayConfig?.players && passAndPlayConfig.players.length >= count) {
      passAndPlayConfig.players.slice(0, count).forEach((p, idx) => {
        players.push({
          id: `local-${idx + 1}`,
          name: p.name.trim() || `Player ${idx + 1}`,
          color: p.color,
          type: 'human',
          avatar: p.avatar || defaultAvatars[p.color] || '😎',
          isReady: true,
        });
      });
    } else if (count === 2) {
      // 2 players: assign diagonally opposite corners
      const p1Color = playerColor;
      const p2Color = DIAGONAL_OPPOSITE_COLOR[p1Color];
      players.push({
        id: 'local-1',
        name: playerName.trim() || 'Player 1',
        color: p1Color,
        type: 'human',
        avatar: defaultAvatars[p1Color] || '😎',
        isReady: true,
      });
      players.push({
        id: 'local-2',
        name: 'Player 2',
        color: p2Color,
        type: 'human',
        avatar: defaultAvatars[p2Color] || '🦁',
        isReady: true,
      });
    } else {
      players.push({
        id: 'local-1',
        name: playerName.trim() || 'Player 1',
        color: playerColor,
        type: 'human',
        avatar: defaultAvatars[playerColor] || '😎',
        isReady: true,
      });

      const remainingColors = COLOR_ORDER.filter((c) => c !== playerColor);
      for (let i = 1; i < count; i++) {
        const c = remainingColors[i - 1];
        players.push({
          id: `local-${i + 1}`,
          name: `Player ${i + 1}`,
          color: c,
          type: 'human',
          avatar: defaultAvatars[c] || '🦁',
          isReady: true,
        });
      }
    }
  } else {
    // Online room: 1 human player (Host) - NEVER ADD AUTOMATIC BOTS!
    players.push({
      id: 'host-1',
      name: playerName.trim() || 'Host',
      color: playerColor,
      type: 'human',
      avatar: '👑',
      isReady: true,
    });
  }

  // Ensure players are ordered by standard turn order
  players.sort((a, b) => COLOR_ORDER.indexOf(a.color) - COLOR_ORDER.indexOf(b.color));

  const tokens: Record<PlayerColor, Token[]> = {
    red: createInitialTokens('red'),
    green: createInitialTokens('green'),
    yellow: createInitialTokens('yellow'),
    blue: createInitialTokens('blue'),
  };

  const initialStatus = mode === 'online_room' ? 'waiting' : 'playing';

  return {
    id: roomId,
    name: 'Royal Ludo Arena',
    mode,
    players,
    tokens,
    currentTurn: players[0].color,
    diceValue: null,
    hasRolled: false,
    isRolling: false,
    consecutiveSixes: 0,
    movableTokenIds: [],
    status: initialStatus,
    winner: null,
    rankings: [],
    turnTimeRemaining: 20,
    history: [
      mode === 'online_room'
        ? `Room ${roomId} created. Waiting for friends to join...`
        : `Game started with ${players.length} players. First turn: ${players[0].name} (${players[0].color.toUpperCase()})`,
    ],
  };
}

/**
 * Add a new human player to an online room
 */
export function addPlayerToOnlineRoom(
  state: GameState,
  player: { name: string; color?: PlayerColor; avatar?: string }
): { state: GameState; player: Player } | { error: string } {
  if (state.mode !== 'online_room') {
    return { error: 'Not an online room' };
  }
  if (state.players.length >= 4) {
    return { error: 'Room is full (max 4 players)' };
  }
  if (state.status === 'playing') {
    return { error: 'Game has already started in this room' };
  }

  const occupiedColors = new Set(state.players.map((p) => p.color));
  let assignedColor: PlayerColor;
  if (player.color && !occupiedColors.has(player.color)) {
    assignedColor = player.color;
  } else {
    // For 2-player online room (when 2nd player joins), assign diagonally opposite corner seat
    const hostColor = state.players[0]?.color;
    const diagColor = hostColor ? DIAGONAL_OPPOSITE_COLOR[hostColor] : undefined;
    if (state.players.length === 1 && diagColor && !occupiedColors.has(diagColor)) {
      assignedColor = diagColor;
    } else {
      const available = COLOR_ORDER.find((c) => !occupiedColors.has(c));
      if (!available) {
        return { error: 'No available color seats in room' };
      }
      assignedColor = available;
    }
  }

  const newPlayer: Player = {
    id: 'player-' + Math.random().toString(36).substring(2, 9),
    name: player.name.trim() || `Player ${state.players.length + 1}`,
    color: assignedColor,
    type: 'human',
    avatar: player.avatar || (assignedColor === 'blue' ? '🐬' : assignedColor === 'yellow' ? '🦅' : assignedColor === 'green' ? '🐯' : '🦁'),
    isReady: true,
  };

  const newPlayers = [...state.players, newPlayer];
  newPlayers.sort((a, b) => COLOR_ORDER.indexOf(a.color) - COLOR_ORDER.indexOf(b.color));

  return {
    state: {
      ...state,
      players: newPlayers,
      currentTurn: newPlayers[0].color,
      history: [`${newPlayer.name} joined the room as ${assignedColor.toUpperCase()}!`, ...state.history.slice(0, 19)],
    },
    player: newPlayer,
  };
}

/**
 * Start an online room game once 2+ players are present
 */
export function startOnlineRoomGame(state: GameState): GameState | { error: string } {
  if (state.mode !== 'online_room') {
    return { error: 'Not an online room' };
  }
  if (state.players.length < 2) {
    return { error: 'Need at least 2 players to start game' };
  }
  if (state.status === 'playing') {
    return state;
  }

  return {
    ...state,
    status: 'playing',
    currentTurn: state.players[0].color,
    history: [`Game started with ${state.players.length} players! First turn: ${state.players[0].name} (${state.players[0].color.toUpperCase()})`, ...state.history.slice(0, 19)],
  };
}

/**
 * Calculates the board track position (0-51) given a token's stepCount and color.
 * Returns null if the token is in base, in home column, or in home.
 */
export function getTrackPosition(color: PlayerColor, stepCount: number): number | null {
  if (stepCount < 0 || stepCount > 50) return null;
  const startOffset = COLOR_START_OFFSETS[color];
  return (startOffset + stepCount) % 52;
}

/**
 * Checks if a track position is a safe star square.
 */
export function isSafePosition(trackPos: number): boolean {
  return SAFE_TRACK_POSITIONS.has(trackPos);
}

/**
 * Determine which tokens of the current player can move given the rolled dice value.
 */
export function getMovableTokenIds(tokens: Token[], diceValue: number): number[] {
  const movable: number[] = [];

  for (const token of tokens) {
    if (token.state === 'home') {
      continue;
    }

    if (token.state === 'base') {
      // Must roll 6 to release token from base
      if (diceValue === 6) {
        movable.push(token.id);
      }
    } else {
      // On track or in home column
      // Target stepCount must not exceed 56
      if (token.stepCount + diceValue <= 56) {
        movable.push(token.id);
      }
    }
  }

  return movable;
}

export function passTurn(state: GameState): GameState {
  const nextPlayer = getNextActivePlayer(state.players, state.currentTurn, state.rankings);
  return {
    ...state,
    currentTurn: nextPlayer,
    hasRolled: false,
    diceValue: null,
    movableTokenIds: [],
    isRolling: false,
  };
}

/**
 * Roll the dice for current player and update game state.
 */
export function rollDice(state: GameState, fixedValue?: number, autoPass: boolean = false): GameState {
  if (state.hasRolled || state.status !== 'playing') {
    return state;
  }

  const rolledValue = fixedValue ?? Math.floor(Math.random() * 6) + 1;
  const currentTokens = state.tokens[state.currentTurn];
  const newConsecutiveSixes = rolledValue === 6 ? state.consecutiveSixes + 1 : 0;

  // Check 3 consecutive sixes penalty rule
  if (newConsecutiveSixes === 3) {
    const nextPlayer = getNextActivePlayer(state.players, state.currentTurn, state.rankings);
    return {
      ...state,
      diceValue: null,
      hasRolled: false,
      isRolling: false,
      consecutiveSixes: 0,
      movableTokenIds: [],
      currentTurn: nextPlayer,
      history: [
        `${getCurrentPlayer(state)?.name} rolled three 6s in a row! Turn skipped as penalty.`,
        ...state.history.slice(0, 19),
      ],
      lastAction: {
        type: 'pass',
        color: state.currentTurn,
        value: rolledValue,
        description: 'Rolled three 6s in a row (Turn Skipped)',
        timestamp: Date.now(),
      },
    };
  }

  const movable = getMovableTokenIds(currentTokens, rolledValue);

  // If no movable tokens, pass turn to next player
  if (movable.length === 0) {
    if (autoPass) {
      const nextPlayer = getNextActivePlayer(state.players, state.currentTurn, state.rankings);
      return {
        ...state,
        diceValue: null,
        hasRolled: false,
        isRolling: false,
        consecutiveSixes: newConsecutiveSixes,
        movableTokenIds: [],
        currentTurn: nextPlayer,
        history: [
          `${getCurrentPlayer(state)?.name} rolled a ${rolledValue} - No legal moves available.`,
          ...state.history.slice(0, 19),
        ],
        lastAction: {
          type: 'pass',
          color: state.currentTurn,
          value: rolledValue,
          description: `Rolled ${rolledValue} - No moves`,
          timestamp: Date.now(),
        },
      };
    }

    return {
      ...state,
      diceValue: rolledValue,
      hasRolled: true,
      isRolling: false,
      consecutiveSixes: newConsecutiveSixes,
      movableTokenIds: [],
      history: [
        `${getCurrentPlayer(state)?.name} rolled a ${rolledValue} - No legal moves available.`,
        ...state.history.slice(0, 19),
      ],
      lastAction: {
        type: 'pass',
        color: state.currentTurn,
        value: rolledValue,
        description: `Rolled ${rolledValue} - No moves`,
        timestamp: Date.now(),
      },
    };
  }

  return {
    ...state,
    diceValue: rolledValue,
    hasRolled: true,
    isRolling: false,
    consecutiveSixes: newConsecutiveSixes,
    movableTokenIds: movable,
    history: [
      `${getCurrentPlayer(state)?.name} rolled a ${rolledValue}! Choose a token to move.`,
      ...state.history.slice(0, 19),
    ],
    lastAction: {
      type: 'roll',
      color: state.currentTurn,
      value: rolledValue,
      description: `Rolled a ${rolledValue}`,
      timestamp: Date.now(),
    },
  };
}

/**
 * Move a specific token by the current dice value.
 */
export function moveToken(state: GameState, tokenId: number): GameState {
  if (!state.hasRolled || state.diceValue === null || !state.movableTokenIds.includes(tokenId)) {
    return state;
  }

  const color = state.currentTurn;
  const dice = state.diceValue;
  const currentTokens = [...state.tokens[color]];
  const tokenIndex = currentTokens.findIndex((t) => t.id === tokenId);
  if (tokenIndex === -1) return state;

  const token = { ...currentTokens[tokenIndex] };
  let bonusTurn = dice === 6;
  let actionType: LudoActionType = 'move';
  let actionDesc = '';

  const newTokens = { ...state.tokens };

  if (token.state === 'base') {
    // Release from base to start tile (stepCount 0)
    token.stepCount = 0;
    token.state = 'track';
    actionType = 'spawn';
    actionDesc = `${getCurrentPlayer(state)?.name} deployed a token onto the track!`;
  } else {
    // Advance along track/home column
    const newStepCount = token.stepCount + dice;
    token.stepCount = newStepCount;

    if (newStepCount === 56) {
      token.state = 'home';
      bonusTurn = true; // Bonus roll for reaching home!
      actionType = 'home';
      actionDesc = `${getCurrentPlayer(state)?.name}'s token reached Home! (Bonus roll awarded)`;
    } else if (newStepCount > 50) {
      token.state = 'homeColumn';
      actionDesc = `${getCurrentPlayer(state)?.name} advanced into home column.`;
    } else {
      token.state = 'track';
      actionDesc = `${getCurrentPlayer(state)?.name} moved token by ${dice} steps.`;
    }
  }

  currentTokens[tokenIndex] = token;
  newTokens[color] = currentTokens;

  // Check for capture if on track
  let capturedPlayerColor: PlayerColor | null = null;
  if (token.state === 'track') {
    const landingTrackPos = getTrackPosition(color, token.stepCount);
    if (landingTrackPos !== null && !isSafePosition(landingTrackPos)) {
      // Check opponent tokens on this exact track cell
      for (const otherColor of COLOR_ORDER) {
        if (otherColor === color) continue;
        const opponentTokens = [...newTokens[otherColor]];
        let captured = false;

        for (let i = 0; i < opponentTokens.length; i++) {
          const oppToken = opponentTokens[i];
          if (oppToken.state === 'track') {
            const oppTrackPos = getTrackPosition(otherColor, oppToken.stepCount);
            if (oppTrackPos === landingTrackPos) {
              // Send opponent token back to base!
              opponentTokens[i] = {
                ...oppToken,
                stepCount: -1,
                state: 'base',
              };
              captured = true;
              capturedPlayerColor = otherColor;
            }
          }
        }

        if (captured) {
          newTokens[otherColor] = opponentTokens;
          bonusTurn = true; // Capturing grants an extra roll!
          actionType = 'capture';
          const victim = state.players.find((p) => p.color === otherColor)?.name || otherColor;
          actionDesc = `${getCurrentPlayer(state)?.name} captured ${victim}'s token! (Bonus roll awarded)`;
          break;
        }
      }
    }
  }

  // Check if current player has won (all 4 tokens home)
  const allHome = newTokens[color].every((t) => t.state === 'home');
  const newRankings = [...state.rankings];
  let winner = state.winner;
  let status = state.status;

  if (allHome && !newRankings.includes(color)) {
    newRankings.push(color);
    if (!winner) {
      winner = color;
    }
    // If only 1 player remains without finishing, game ends
    const activePlayersCount = state.players.length;
    if (newRankings.length >= activePlayersCount - 1 || activePlayersCount <= 2) {
      status = 'finished';
    }
  }

  // Determine next turn
  let nextTurn = color;
  if (!bonusTurn || status === 'finished') {
    nextTurn = getNextActivePlayer(state.players, color, newRankings);
  }

  return {
    ...state,
    tokens: newTokens,
    currentTurn: nextTurn,
    diceValue: null,
    hasRolled: false,
    movableTokenIds: [],
    winner,
    rankings: newRankings,
    status,
    consecutiveSixes: bonusTurn && dice === 6 ? state.consecutiveSixes : 0,
    history: [actionDesc, ...state.history.slice(0, 19)],
    lastAction: {
      type: actionType,
      color,
      tokenId,
      value: dice,
      description: actionDesc,
      timestamp: Date.now(),
    },
  };
}

/**
 * Get current active player
 */
export function getCurrentPlayer(state: GameState): Player | undefined {
  return state.players.find((p) => p.color === state.currentTurn);
}

/**
 * Find next player who has not finished yet
 */
export function getNextActivePlayer(
  players: Player[],
  currentColor: PlayerColor,
  rankings: PlayerColor[]
): PlayerColor {
  const activePlayers = players.filter((p) => !rankings.includes(p.color));
  if (activePlayers.length === 0) return currentColor;

  const currentIdx = players.findIndex((p) => p.color === currentColor);
  for (let i = 1; i <= players.length; i++) {
    const nextPlayer = players[(currentIdx + i) % players.length];
    if (!rankings.includes(nextPlayer.color)) {
      return nextPlayer.color;
    }
  }

  return currentColor;
}

/**
 * AI Bot Logic: selects the best token to move
 */
export function selectBotMove(state: GameState): number | null {
  const { currentTurn, diceValue, movableTokenIds, tokens } = state;
  if (!diceValue || movableTokenIds.length === 0) return null;

  if (movableTokenIds.length === 1) {
    return movableTokenIds[0];
  }

  const currentTokens = tokens[currentTurn];
  const botPlayer = state.players.find((p) => p.color === currentTurn);
  const difficulty = botPlayer?.botDifficulty || 'medium';

  // Easy bot occasionally picks a random valid move
  if (difficulty === 'easy' && Math.random() < 0.4) {
    const randomIdx = Math.floor(Math.random() * movableTokenIds.length);
    return movableTokenIds[randomIdx];
  }

  let bestTokenId = movableTokenIds[0];
  let highestScore = -Infinity;

  for (const tokenId of movableTokenIds) {
    const token = currentTokens.find((t) => t.id === tokenId);
    if (!token) continue;

    let score = 0;

    // 1. Moving directly into home
    if (token.stepCount + diceValue === 56) {
      score += 1000;
    }

    // 2. Releasing token from base on a 6
    if (token.state === 'base' && diceValue === 6) {
      score += 550;
      // Bonus if bot has few pieces on track
      const piecesOnTrack = currentTokens.filter((t) => t.state === 'track').length;
      if (piecesOnTrack === 0) score += 200;
    }

    // 3. Capturing an opponent piece
    if (token.state === 'track') {
      const targetStep = token.stepCount + diceValue;
      if (targetStep <= 50) {
        const landingPos = getTrackPosition(currentTurn, targetStep);
        if (landingPos !== null && !isSafePosition(landingPos)) {
          // Check if any opponent piece is here
          for (const oppColor of COLOR_ORDER) {
            if (oppColor === currentTurn) continue;
            for (const oppToken of tokens[oppColor]) {
              if (oppToken.state === 'track') {
                const oppPos = getTrackPosition(oppColor, oppToken.stepCount);
                if (oppPos === landingPos) {
                  score += 850;
                  // Extra value for capturing piece close to their home!
                  score += oppToken.stepCount * 5;
                }
              }
            }
          }
        }
      }
    }

    // 4. Moving to a safe star
    if (token.state === 'track') {
      const targetStep = token.stepCount + diceValue;
      if (targetStep <= 50) {
        const landingPos = getTrackPosition(currentTurn, targetStep);
        if (landingPos !== null && isSafePosition(landingPos)) {
          score += 420;
        }
      }
    }

    // 5. Escaping danger: piece is currently threatened by an opponent behind it (1-6 tiles away)
    if (token.state === 'track') {
      const currentPos = getTrackPosition(currentTurn, token.stepCount);
      if (currentPos !== null && !isSafePosition(currentPos)) {
        for (const oppColor of COLOR_ORDER) {
          if (oppColor === currentTurn) continue;
          for (const oppToken of tokens[oppColor]) {
            if (oppToken.state === 'track') {
              const oppPos = getTrackPosition(oppColor, oppToken.stepCount);
              if (oppPos !== null) {
                const distanceBehind = (currentPos - oppPos + 52) % 52;
                if (distanceBehind >= 1 && distanceBehind <= 6) {
                  score += 350; // High priority to run away!
                }
              }
            }
          }
        }
      }
    }

    // 6. Entering home column safely
    if (token.stepCount + diceValue > 50 && token.stepCount <= 50) {
      score += 480;
    }

    // 7. Progress points: reward advancing tokens further
    score += token.stepCount * 2;

    if (score > highestScore) {
      highestScore = score;
      bestTokenId = tokenId;
    }
  }

  return bestTokenId;
}
