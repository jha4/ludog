import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
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
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Security Middleware: Body size limits
app.use(express.json({ limit: '10kb' }));

// Security Middleware: Production Security Headers & CORS
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Player-Token');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// In-Memory Rate Limiting
interface RateLimitEntry {
  count: number;
  resetTime: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();

function checkRateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count++;
  return true;
}

// Clean up stale rate limit entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 10 * 60 * 1000);

// In-Memory Room & Session Structures
interface PlayerSession {
  token: string;
  playerId: string;
  playerColor: PlayerColor;
  joinedAt: number;
}

interface RoomEntry {
  state: GameState;
  clients: Set<Response>;
  playerSessions: Map<string, PlayerSession>; // playerToken -> PlayerSession
  hostToken: string;
  lastActive: number;
  botTimer: NodeJS.Timeout | null;
}

const MAX_ROOMS = 100;
const rooms = new Map<string, RoomEntry>();

// Room Code Format Regex (ROOM-XXXXXX)
const ROOM_CODE_REGEX = /^ROOM-[A-Z0-9]{4,12}$/i;

/**
 * Generate a cryptographically secure, collision-resistant room code
 */
function generateUniqueRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let attempts = 0;
  while (attempts < 100) {
    let code = '';
    const randomBytes = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) {
      code += chars[randomBytes[i] % chars.length];
    }
    const roomId = 'ROOM-' + code;
    if (!rooms.has(roomId)) {
      return roomId;
    }
    attempts++;
  }
  return 'ROOM-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Extract player token from Authorization header or body/query
 */
function extractPlayerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const customHeader = req.headers['x-player-token'];
  if (typeof customHeader === 'string' && customHeader.trim()) {
    return customHeader.trim();
  }
  if (req.body && typeof req.body.playerToken === 'string') {
    return req.body.playerToken.trim();
  }
  if (req.query && typeof req.query.token === 'string') {
    return req.query.token.trim();
  }
  return null;
}

/**
 * Input sanitization & validation helpers
 */
function sanitizeString(input: unknown, maxLen: number = 20): string {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/<[^>]*>/g, '').substring(0, maxLen);
}

const VALID_COLORS: PlayerColor[] = ['red', 'blue', 'yellow', 'green'];
const VALID_MODES = ['single_player', 'pass_and_play', 'online_room'];

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
  const emoji = emojis[crypto.randomInt(0, emojis.length)];

  const event: EmojiEvent = {
    id: 'emoji-' + crypto.randomBytes(4).toString('hex'),
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

        scheduleBotTurnIfNeeded(roomId);
      }, 700);
    }, 800);
    return;
  }

  // Phase 2: Bot moves token
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

        scheduleBotTurnIfNeeded(roomId);
      }
    }, 750);
  }
}

// ---------------- PERIODIC KEEP-ALIVE & ROOM CLEANUP ----------------

// SSE Keep-Alive Heartbeat every 15 seconds
setInterval(() => {
  for (const room of rooms.values()) {
    for (const client of room.clients) {
      try {
        client.write(':\n\n');
      } catch {
        room.clients.delete(client);
      }
    }
  }
}, 15000);

// Inactive Room Cleanup every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, room] of rooms.entries()) {
    // Cleanup if room has no SSE clients and inactive for over 30 minutes
    if (room.clients.size === 0 && now - room.lastActive > 30 * 60 * 1000) {
      if (room.botTimer) clearTimeout(room.botTimer);
      rooms.delete(id);
    }
  }
}, 5 * 60 * 1000);

// ---------------- REST API ROUTES ----------------

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  res.json({
    status: 'ok',
    activeRooms: rooms.size,
    timestamp: Date.now(),
    uptime: Math.floor(process.uptime()),
    version: '2.0.0',
    memoryUsage: {
      rssMB: Math.round(memoryUsage.rss / (1024 * 1024)),
      heapMB: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
    },
  });
});

// List active rooms
app.get('/api/rooms', (req: Request, res: Response) => {
  const clientIp = req.ip || 'unknown';
  if (!checkRateLimit(clientIp, 30, 60000)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

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
  const clientIp = req.ip || 'unknown';
  if (!checkRateLimit(clientIp, 10, 15 * 60000)) {
    return res.status(429).json({ error: 'Room creation limit reached. Please wait before creating another room.' });
  }

  if (rooms.size >= MAX_ROOMS) {
    return res.status(503).json({ error: 'Server room capacity reached. Please try again later.' });
  }

  const { mode = 'single_player', playerName = 'Player 1', playerColor = 'red', botCount = 3 } = req.body || {};

  if (!VALID_MODES.includes(mode)) {
    return res.status(400).json({ error: 'Invalid game mode specified.' });
  }

  const sanitizedName = sanitizeString(playerName, 20) || 'Player 1';
  const sanitizedColor: PlayerColor = VALID_COLORS.includes(playerColor) ? playerColor : 'red';
  const parsedBotCount = Math.max(0, Math.min(3, typeof botCount === 'number' ? botCount : 3));

  const roomId = generateUniqueRoomId();
  const botsToSpawn = mode === 'online_room' ? 0 : parsedBotCount;
  const initialGame = createNewGame(mode, sanitizedName, sanitizedColor, botsToSpawn, roomId);

  // Generate secure host token
  const hostToken = crypto.randomBytes(16).toString('hex');
  const hostPlayer = initialGame.players[0];

  const playerSessions = new Map<string, PlayerSession>();
  playerSessions.set(hostToken, {
    token: hostToken,
    playerId: hostPlayer.id,
    playerColor: hostPlayer.color,
    joinedAt: Date.now(),
  });

  rooms.set(roomId, {
    state: initialGame,
    clients: new Set(),
    playerSessions,
    hostToken,
    lastActive: Date.now(),
    botTimer: null,
  });

  if (initialGame.status === 'playing') {
    scheduleBotTurnIfNeeded(roomId);
  }

  res.status(201).json({
    ...initialGame,
    playerToken: hostToken,
    assignedPlayerId: hostPlayer.id,
    assignedColor: hostPlayer.color,
  });
});

// Get Room State
app.get('/api/rooms/:roomId', (req: Request, res: Response) => {
  const { roomId } = req.params;
  if (!ROOM_CODE_REGEX.test(roomId)) {
    return res.status(400).json({ error: 'Invalid room code format.' });
  }

  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found. Please verify your room code.' });
  }

  const token = extractPlayerToken(req);
  const session = token ? room.playerSessions.get(token) : null;

  res.json({
    ...room.state,
    ...(session ? { assignedPlayerId: session.playerId, assignedColor: session.playerColor } : {}),
  });
});

// Join Room
app.post('/api/rooms/:roomId/join', (req: Request, res: Response) => {
  const { roomId } = req.params;
  if (!ROOM_CODE_REGEX.test(roomId)) {
    return res.status(400).json({ error: 'Invalid room code format.' });
  }

  const clientIp = req.ip || 'unknown';
  if (!checkRateLimit(clientIp, 20, 60000)) {
    return res.status(429).json({ error: 'Too many join attempts. Please slow down.' });
  }

  const { playerName = 'New Player', playerColor } = req.body || {};
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

  const sanitizedName = sanitizeString(playerName, 20) || 'Player';
  const requestedColor: PlayerColor | undefined = VALID_COLORS.includes(playerColor) ? playerColor : undefined;

  const joinResult = addPlayerToOnlineRoom(room.state, {
    name: sanitizedName,
    color: requestedColor,
  });

  if ('error' in joinResult) {
    return res.status(400).json({ error: joinResult.error });
  }

  // Generate player token
  const playerToken = crypto.randomBytes(16).toString('hex');
  room.playerSessions.set(playerToken, {
    token: playerToken,
    playerId: joinResult.player.id,
    playerColor: joinResult.player.color,
    joinedAt: Date.now(),
  });

  room.state = joinResult.state;
  room.lastActive = Date.now();
  broadcastToRoom(roomId, { type: 'state_update', payload: room.state });

  res.json({
    ...room.state,
    playerToken,
    assignedPlayerId: joinResult.player.id,
    assignedColor: joinResult.player.color,
  });
});

// Reconnect to existing room seat with playerToken
app.post('/api/rooms/:roomId/reconnect', (req: Request, res: Response) => {
  const { roomId } = req.params;
  if (!ROOM_CODE_REGEX.test(roomId)) {
    return res.status(400).json({ error: 'Invalid room code format.' });
  }

  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room no longer exists.' });
  }

  const token = extractPlayerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Player token required for reconnection.' });
  }

  const session = room.playerSessions.get(token);
  if (!session) {
    return res.status(403).json({ error: 'Invalid or expired session token.' });
  }

  res.json({
    ...room.state,
    playerToken: token,
    assignedPlayerId: session.playerId,
    assignedColor: session.playerColor,
  });
});

// Start Room Game (host starts when 2+ players)
app.post('/api/rooms/:roomId/start', (req: Request, res: Response) => {
  const { roomId } = req.params;
  if (!ROOM_CODE_REGEX.test(roomId)) {
    return res.status(400).json({ error: 'Invalid room code format.' });
  }

  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const token = extractPlayerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authorization token required.' });
  }

  const session = room.playerSessions.get(token);
  if (!session || token !== room.hostToken) {
    return res.status(403).json({ error: 'Only the room host can start the game.' });
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
  if (!ROOM_CODE_REGEX.test(roomId)) {
    return res.status(400).json({ error: 'Invalid room code format.' });
  }

  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const token = extractPlayerToken(req);
  const session = token ? room.playerSessions.get(token) : null;
  const targetPlayerId = session ? session.playerId : req.body?.playerId;

  if (!targetPlayerId) {
    return res.status(400).json({ error: 'Player ID or valid token required to leave.' });
  }

  if (token) {
    room.playerSessions.delete(token);
  }

  const remainingPlayers = room.state.players.filter((p) => p.id !== targetPlayerId);
  if (remainingPlayers.length === 0) {
    if (room.botTimer) clearTimeout(room.botTimer);
    rooms.delete(roomId);
    return res.json({ success: true, roomClosed: true });
  }

  // Update host token if host left
  if (token === room.hostToken) {
    const newHostSession = Array.from(room.playerSessions.values()).find(
      (s) => s.playerId === remainingPlayers[0].id
    );
    if (newHostSession) {
      room.hostToken = newHostSession.token;
    }
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

// Authoritative Roll Dice Endpoint
app.post('/api/rooms/:roomId/roll', (req: Request, res: Response) => {
  const { roomId } = req.params;
  if (!ROOM_CODE_REGEX.test(roomId)) {
    return res.status(400).json({ error: 'Invalid room code format.' });
  }

  const room = rooms.get(roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  if (room.state.status !== 'playing') {
    return res.status(400).json({ error: 'Game is not currently active.' });
  }

  if (room.state.hasRolled) {
    return res.status(400).json({ error: 'Dice has already been rolled for this turn.' });
  }

  const token = extractPlayerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authorization token required.' });
  }

  const session = room.playerSessions.get(token);
  if (!session) {
    return res.status(403).json({ error: 'Invalid player session token.' });
  }

  const currentP = getCurrentPlayer(room.state);
  if (currentP && session.playerColor !== currentP.color) {
    return res.status(403).json({ error: `It is currently ${currentP.name}'s turn (${currentP.color.toUpperCase()}).` });
  }

  // Authoritative Dice Roll using Crypto Random
  const rolledValue = crypto.randomInt(1, 7);
  const newState = rollDice(room.state, rolledValue);

  room.state = newState;
  room.lastActive = Date.now();

  broadcastToRoom(roomId, { type: 'state_update', payload: newState });
  scheduleBotTurnIfNeeded(roomId);

  res.json(newState);
});

// Authoritative Move Token Endpoint
app.post('/api/rooms/:roomId/move', (req: Request, res: Response) => {
  const { roomId } = req.params;
  if (!ROOM_CODE_REGEX.test(roomId)) {
    return res.status(400).json({ error: 'Invalid room code format.' });
  }

  const { tokenId } = req.body || {};
  const room = rooms.get(roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  if (!room.state.hasRolled || typeof tokenId !== 'number' || tokenId < 0 || tokenId > 3) {
    return res.status(400).json({ error: 'Invalid move request parameters.' });
  }

  const token = extractPlayerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authorization token required.' });
  }

  const session = room.playerSessions.get(token);
  if (!session) {
    return res.status(403).json({ error: 'Invalid player session token.' });
  }

  const currentP = getCurrentPlayer(room.state);
  if (currentP && session.playerColor !== currentP.color) {
    return res.status(403).json({ error: `It is currently ${currentP.name}'s turn (${currentP.color.toUpperCase()}).` });
  }

  if (!room.state.movableTokenIds.includes(tokenId)) {
    return res.status(400).json({ error: 'Illegal token move for current dice roll.' });
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
  if (!ROOM_CODE_REGEX.test(roomId)) {
    return res.status(400).json({ error: 'Invalid room code format.' });
  }

  const room = rooms.get(roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const token = extractPlayerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authorization token required.' });
  }

  const session = room.playerSessions.get(token);
  if (!session) {
    return res.status(403).json({ error: 'Invalid player session token.' });
  }

  const senderPlayer = room.state.players.find((p) => p.id === session.playerId);
  const { emoji = '🎉', text } = req.body || {};

  const sanitizedEmoji = sanitizeString(emoji, 10) || '🎉';
  const sanitizedText = text ? sanitizeString(text, 100) : undefined;

  const emojiEvent: EmojiEvent = {
    id: 'emoji-' + crypto.randomBytes(4).toString('hex'),
    senderId: session.playerId,
    senderName: senderPlayer ? senderPlayer.name : 'Player',
    senderColor: session.playerColor,
    emoji: sanitizedEmoji,
    text: sanitizedText,
    timestamp: Date.now(),
  };

  broadcastToRoom(roomId, { type: 'emoji', payload: emojiEvent });
  res.json({ success: true, event: emojiEvent });
});

// Restart Room (Host Only)
app.post('/api/rooms/:roomId/restart', (req: Request, res: Response) => {
  const { roomId } = req.params;
  if (!ROOM_CODE_REGEX.test(roomId)) {
    return res.status(400).json({ error: 'Invalid room code format.' });
  }

  const room = rooms.get(roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const token = extractPlayerToken(req);
  if (!token || token !== room.hostToken) {
    return res.status(403).json({ error: 'Only the room host can restart the match.' });
  }

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
  if (!ROOM_CODE_REGEX.test(roomId)) {
    return res.status(400).json({ error: 'Invalid room code format.' });
  }

  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (room.clients.size >= 10) {
    return res.status(429).json({ error: 'Maximum stream listeners reached for this room.' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  room.clients.add(res);

  // Send initial state immediately
  res.write(`event: state_update\ndata: ${JSON.stringify(room.state)}\n\n`);

  req.on('close', () => {
    room.clients.delete(res);
  });
});

// ---------------- VITE / STATIC SERVING & 404 CATCH-ALL ----------------

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));

    // Express 404 handler for API routes (prevent HTML fallback swallowing API errors)
    app.all('/api/*', (req: Request, res: Response) => {
      res.status(404).json({ error: `API endpoint '${req.path}' not found.` });
    });

    // SPA fallback for frontend routes
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.all('/api/*', (req: Request, res: Response) => {
      res.status(404).json({ error: `API endpoint '${req.path}' not found.` });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ludo Royal Production Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
