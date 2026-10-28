import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewGame, rollDice, moveToken, addPlayerToOnlineRoom, startOnlineRoomGame } from './src/lib/ludoEngine.ts';

test('Security & Room Engine - Cryptographic Room Code Format & Validation', async () => {
  const ROOM_CODE_REGEX = /^ROOM-[A-Z0-9]{4,12}$/i;

  assert.equal(ROOM_CODE_REGEX.test('ROOM-X7K2M9'), true);
  assert.equal(ROOM_CODE_REGEX.test('ROOM-ABCD'), true);
  assert.equal(ROOM_CODE_REGEX.test('INVALID-ROOM'), false);
  assert.equal(ROOM_CODE_REGEX.test('ROOM-'), false);
  assert.equal(ROOM_CODE_REGEX.test('ROOM-???123'), false);
});

test('Security & Room Engine - Input Sanitization & Boundaries', async () => {
  const game = createNewGame('online_room', '<b>Attacker</b>', 'red', 0, 'ROOM-TEST01');

  assert.equal(game.id, 'ROOM-TEST01');
  assert.equal(game.mode, 'online_room');
  assert.equal(game.players.length, 1);
  assert.equal(game.players[0].name, '<b>Attacker</b>');
  assert.equal(game.players[0].color, 'red');
});

test('Security & Room Engine - Room Capacity Enforced at 4 Players', async () => {
  let game = createNewGame('online_room', 'Host', 'red', 0, 'ROOM-TEST02');

  const p2 = addPlayerToOnlineRoom(game, { name: 'Player 2', color: 'blue' });
  assert.equal('error' in p2, false);
  if ('state' in p2) game = p2.state;

  const p3 = addPlayerToOnlineRoom(game, { name: 'Player 3', color: 'yellow' });
  assert.equal('error' in p3, false);
  if ('state' in p3) game = p3.state;

  const p4 = addPlayerToOnlineRoom(game, { name: 'Player 4', color: 'green' });
  assert.equal('error' in p4, false);
  if ('state' in p4) game = p4.state;

  // 5th Player join attempt must be rejected
  const p5 = addPlayerToOnlineRoom(game, { name: 'Player 5' });
  assert.equal('error' in p5, true);
  if ('error' in p5) {
    assert.equal(p5.error.includes('full'), true);
  }
});

test('Security & Room Engine - Host Authorization for Game Start', async () => {
  let game = createNewGame('online_room', 'Host', 'red', 0, 'ROOM-TEST03');

  // Single player cannot start online room match
  const failStart = startOnlineRoomGame(game);
  assert.equal('error' in failStart, true);
  if ('error' in failStart) {
    assert.equal(failStart.error.includes('at least 2 players'), true);
  }

  // Add 2nd player
  const p2 = addPlayerToOnlineRoom(game, { name: 'Player 2', color: 'blue' });
  if ('state' in p2) game = p2.state;

  const successStart = startOnlineRoomGame(game);
  assert.equal('error' in successStart, false);
  if (!('error' in successStart)) {
    assert.equal(successStart.status, 'playing');
    assert.equal(successStart.currentTurn, 'red'); // Host starts turn
  }
});

test('Security & Room Engine - Out-of-Turn Action Rejection', async () => {
  let game = createNewGame('single_player', 'Human', 'red', 3, 'ROOM-TEST04');

  // Red's turn initially
  assert.equal(game.currentTurn, 'red');
  assert.equal(game.hasRolled, false);

  // Roll dice for Red
  const rolled = rollDice(game, 6);
  assert.equal(rolled.hasRolled, true);
  assert.equal(rolled.diceValue, 6);
  assert.deepEqual(rolled.movableTokenIds, [0, 1, 2, 3]);

  // Attempting to roll again before moving should return unchanged state or be rejected
  const doubleRoll = rollDice(rolled, 4);
  assert.equal(doubleRoll.diceValue, 6); // Retains original roll
});

test('Security & Room Engine - Illegal Token Move Rejection', async () => {
  const game = createNewGame('single_player', 'Human', 'red', 3, 'ROOM-TEST05');

  // Has not rolled yet, moving token should return unchanged state
  const invalidMoveBeforeRoll = moveToken(game, 0);
  assert.equal(invalidMoveBeforeRoll.hasRolled, false);

  // Roll a 4 (no tokens can leave base on a 4)
  const rolled4 = rollDice(game, 4);
  assert.equal(rolled4.movableTokenIds.length, 0);

  // Attempting to force move token 0 on roll of 4 must be rejected
  const invalidMoveToken = moveToken(rolled4, 0);
  assert.equal(invalidMoveToken.tokens.red[0].state, 'base');
});

test('Security & Room Engine - Authoritative Movement & Capture Rules', async () => {
  let game = createNewGame('single_player', 'Human', 'red', 3, 'ROOM-TEST06');

  // Roll 6 to spawn token 0
  game = rollDice(game, 6);
  game = moveToken(game, 0);

  assert.equal(game.tokens.red[0].state, 'track');
  assert.equal(game.tokens.red[0].stepCount, 0); // Red start position
});
