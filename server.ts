import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  GameState,
  PlayerColor,
  createNewGame,
  rollDice,
  moveToken,
  selectBotMove,
  getCurrentPlayer,
  addPlayerToOnlineRoom,
  startOnlineRoomGame,
  EmojiEvent,
} from './src/lib/ludoEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-memory Room Management
interface RoomEntry {
  state: GameState;
  clients: Set<Response>;
  lastActive: number;
  botTimer: NodeJS.Timeout | null;
}

const rooms = new Map<string, RoomEntry>();

// Bot Reaction Emojis
const BOT_EXPRESSIONS: Record<string, string[]> = {
  roll6: ['🔥', '🎲', '😎', '⚡'],
  capture: ['🎯', '😂', '👑', '💥'],
  captured: ['😭', '💀', '😱', '😡'],
  home: ['🥳', '🏆', '🎉', '👏'],
  win: ['👑', '🥳', '🏆', '🥇'],
};

function broadcastToRoom(roomId: string, data: { type: string; payload: unknown }) {
  const room = rooms.get(roomId);
  if (!room) return;

  const message = `event: ${data.type}\ndata: ${JSON.stringify(data.payload)}\n\n`;
  for (const client of room.clients) {
    try {
      client.write(message);
    } catch {
      room.clients.delete(client);
    }
  }
}

function triggerBotEmoji(roomId: string, botColor: PlayerColor, situation: keyof typeof BOT_EXPRESSIONS) {
  const room = rooms.get(roomId);
  if (!room) return;
  const botPlayer = room.state.players.find((p) => p.color === botColor);
  if (!botPlayer || botPlayer.type !== 'bot') return;

  const emojis = BOT_EXPRESSIONS[situation] || ['🎲'];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];

  const event: EmojiEvent = {
    id: 'emoji-' + Math.random().toString(36).substring(2, 9),
    senderId: botPlayer.id,
    senderName: botPlayer.name,
    senderColor: botColor,
    emoji,
    timestamp: Date.now(),
  };

  broadcastToRoom(roomId, { type: 'emoji', payload: event });
}

function scheduleBotTurnIfNeeded(roomId: string) {
  const room = rooms.get(roomId);
  if (!room || room.state.status !== 'playing') return;

  const currentPlayer = getCurrentPlayer(room.state);
  if (!currentPlayer || currentPlayer.type !== 'bot') {
    if (room.botTimer) {
      clearTimeout(room.botTimer);
      room.botTimer = null;
    }
    return;
  }

  if (room.botTimer) {
    clearTimeout(room.botTimer);
  }

  // Phase 1: Bot rolls dice
  if (!room.state.hasRolled) {
    room.botTimer = setTimeout(() => {
      const currentRoom = rooms.get(roomId);
      if (!currentRoom || currentRoom.state.status !== 'playing') return;

      const player = getCurrentPlayer(currentRoom.state);
      if (!player || player.type !== 'bot') return;

      // Broadcast rolling state
      broadcastToRoom(roomId, { type: 'bot_rolling', payload: { color: player.color } });

      setTimeout(() => {
        const activeRoom = rooms.get(roomId);
        if (!activeRoom) return;

        const rolledState = rollDice(activeRoom.state);
        activeRoom.state = rolledState;
        activeRoom.lastActive = Date.now();

        if (rolledState.diceValue === 6 && Math.random() < 0.6) {
          triggerBotEmoji(roomId, player.color, 'roll6');
        }

        broadcastToRoom(roomId, { type: 'state_update', payload: rolledState });

        // Phase 2: If rolled has legal moves, schedule move
        if (rolledState.hasRolled && rolledState.movableTokenIds.length > 0) {
          scheduleBotTurnIfNeeded(roomId);
        } else {
          // Turn passed automatically
          scheduleBotTurnIfNeeded(roomId);
        }
      }, 700);
    }, 800);
    return;
  }

  // Phase 2: Bot moves a token
  if (room.state.hasRolled && room.state.movableTokenIds.length > 0) {
    room.botTimer = setTimeout(() => {
      const activeRoom = rooms.get(roomId);
      if (!activeRoom || activeRoom.state.status !== 'playing') return;

      const player = getCurrentPlayer(activeRoom.state);
      if (!player || player.type !== 'bot') return;

      const chosenToken = selectBotMove(activeRoom.state);
      if (chosenToken !== null) {
        const movedState = moveToken(activeRoom.state, chosenToken);
        const prevAction = movedState.lastAction;
        activeRoom.state = movedState;
        activeRoom.lastActive = Date.now();

        if (prevAction?.type === 'capture') {
          triggerBotEmoji(roomId, player.color, 'capture');
        } else if (prevAction?.type === 'home') {
          triggerBotEmoji(roomId, player.color, 'home');
        }

        if (movedState.winner === player.color) {
          triggerBotEmoji(roomId, player.color, 'win');
        }

        broadcastToRoom(roomId, { type: 'state_update', payload: movedState });

        // If bot got bonus roll or turn passed to another bot, continue
        scheduleBotTurnIfNeeded(roomId);
      }
    }, 750);
  }
}

// ---------------- REST API ROUTES ----------------

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    activeRooms: rooms.size,
    timestamp: Date.now(),
  });
});

// List active rooms
app.get('/api/rooms', (req: Request, res: Response) => {
  const roomList = Array.from(rooms.values()).map((r) => ({
    id: r.state.id,
    name: r.state.name,
    mode: r.state.mode,
    playerCount: r.state.players.length,
    status: r.state.status,
    currentTurn: r.state.currentTurn,
    lastActive: r.lastActive,
  }));
  res.json(roomList);
});

// Create Room
app.post('/api/rooms', (req: Request, res: Response) => {
  const { mode = 'single_player', playerName = 'Player 1', playerColor = 'red', botCount = 3 } = req.body;
  const roomId = 'ROOM-' + Math.floor(1000 + Math.random() * 9000);
  const botsToSpawn = mode === 'online_room' ? 0 : botCount;
  const initialGame = createNewGame(mode, playerName, playerColor, botsToSpawn, roomId);

  rooms.set(roomId, {
    state: initialGame,
    clients: new Set(),
    lastActive: Date.now(),
    botTimer: null,
  });

  if (initialGame.status === 'playing') {
    scheduleBotTurnIfNeeded(roomId);
  }

  res.status(201).json(initialGame);
});

// Get Room State
app.get('/api/rooms/:roomId', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found. Please verify your room code.' });
  }
  res.json(room.state);
});

// Join Room
app.post('/api/rooms/:roomId/join', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { playerName = 'New Player', playerColor } = req.body;
  const room = rooms.get(roomId);

  if (!room) {
    return res.status(404).json({ error: 'Room not found. Please verify the room code.' });
  }

  if (room.state.status === 'playing') {
    return res.status(400).json({ error: 'Game in this room has already started.' });
  }

  if (room.state.players.length >= 4) {
    return res.status(400).json({ error: 'Room is full (maximum 4 players).' });
  }

  const joinResult = addPlayerToOnlineRoom(room.state, {
    name: playerName,
    color: playerColor,
  });

  if ('error' in joinResult) {
    return res.status(400).json({ error: joinResult.error });
  }

  room.state = joinResult.state;
  room.lastActive = Date.now();
  broadcastToRoom(roomId, { type: 'state_update', payload: room.state });

  res.json({
    ...room.state,
    assignedPlayerId: joinResult.player.id,
    assignedColor: joinResult.player.color,
  });
});

// Start Room Game (host starts when 2+ players)
app.post('/api/rooms/:roomId/start', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const startResult = startOnlineRoomGame(room.state);
  if ('error' in startResult) {
    return res.status(400).json({ error: startResult.error });
  }

  room.state = startResult;
  room.lastActive = Date.now();
  broadcastToRoom(roomId, { type: 'state_update', payload: room.state });
  res.json(room.state);
});

// Leave Room
app.post('/api/rooms/:roomId/leave', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { playerId } = req.body;
  const room = rooms.get(roomId);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const remainingPlayers = room.state.players.filter((p) => p.id !== playerId);
  if (remainingPlayers.length === 0) {
    rooms.delete(roomId);
    return res.json({ success: true, roomClosed: true });
  }

  room.state = {
    ...room.state,
    players: remainingPlayers,
    status: remainingPlayers.length < 2 && room.state.status === 'playing' ? 'waiting' : room.state.status,
    currentTurn: remainingPlayers.some((p) => p.color === room.state.currentTurn)
      ? room.state.currentTurn
      : remainingPlayers[0].color,
    history: [`A player left the room.`, ...room.state.history.slice(0, 19)],
  };
  room.lastActive = Date.now();
  broadcastToRoom(roomId, { type: 'state_update', payload: room.state });
  res.json({ success: true, state: room.state });
});

// Roll Dice
app.post('/api/rooms/:roomId/roll', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  if (room.state.hasRolled || room.state.status !== 'playing') {
    return res.status(400).json({ error: 'Cannot roll dice right now' });
  }

  const newState = rollDice(room.state);
  room.state = newState;
  room.lastActive = Date.now();

  broadcastToRoom(roomId, { type: 'state_update', payload: newState });
  scheduleBotTurnIfNeeded(roomId);

  res.json(newState);
});

// Move Token
app.post('/api/rooms/:roomId/move', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { tokenId } = req.body;
  const room = rooms.get(roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  if (!room.state.hasRolled || typeof tokenId !== 'number') {
    return res.status(400).json({ error: 'Invalid move request' });
  }

  const newState = moveToken(room.state, tokenId);
  room.state = newState;
  room.lastActive = Date.now();

  broadcastToRoom(roomId, { type: 'state_update', payload: newState });
  scheduleBotTurnIfNeeded(roomId);

  res.json(newState);
});

// Send Emoji or Chat Message
app.post('/api/rooms/:roomId/emoji', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { senderId, senderName, senderColor, emoji, text } = req.body;
  const room = rooms.get(roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const emojiEvent: EmojiEvent = {
    id: 'emoji-' + Math.random().toString(36).substring(2, 9),
    senderId: senderId || 'anon',
    senderName: senderName || 'Player',
    senderColor: senderColor || 'red',
    emoji: emoji || '🎉',
    text: text || undefined,
    timestamp: Date.now(),
  };

  broadcastToRoom(roomId, { type: 'emoji', payload: emojiEvent });
  res.json({ success: true, event: emojiEvent });
});

// Restart Room
app.post('/api/rooms/:roomId/restart', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const firstHuman = room.state.players.find((p) => p.type === 'human') || room.state.players[0];
  const botCount = room.state.players.filter((p) => p.type === 'bot').length;

  const restarted = createNewGame(room.state.mode, firstHuman.name, firstHuman.color, botCount, roomId);
  room.state = restarted;
  room.lastActive = Date.now();

  broadcastToRoom(roomId, { type: 'state_update', payload: restarted });
  scheduleBotTurnIfNeeded(roomId);

  res.json(restarted);
});

// Server-Sent Events (SSE) Stream
app.get('/api/rooms/:roomId/stream', (req: Request, res: Response) => {
  const { roomId } = req.params;
  let room = rooms.get(roomId);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  room.clients.add(res);

  // Send initial state immediately
  res.write(`event: state_update\ndata: ${JSON.stringify(room.state)}\n\n`);

  req.on('close', () => {
    room?.clients.delete(res);
  });
});

// ---------------- VITE / STATIC SERVING ----------------

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ludo Royal Mobile Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
