import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createNewGame,
  rollDice,
  moveToken,
  getTrackPosition,
  isSafePosition,
  selectBotMove,
  addPlayerToOnlineRoom,
  startOnlineRoomGame,
} from './ludoEngine.ts';

test('creates a fresh single player game with 1 human and 3 bots', () => {
  const game = createNewGame('single_player', 'Alice', 'red', 3);
  assert.equal(game.players.length, 4);
  assert.equal(game.status, 'playing');
  assert.equal(game.currentTurn, 'red');
  assert.equal(game.tokens.red.length, 4);
  assert.equal(game.tokens.red[0].state, 'base');
  assert.equal(game.hasRolled, false);
});

test('rolling a non-6 with all tokens in base allows no moves and passes turn', () => {
  let game = createNewGame('single_player', 'Alice', 'red', 3);
  // Force roll a 3 with autoPass
  game = rollDice(game, 3, true);
  assert.equal(game.lastAction?.value, 3);
  assert.equal(game.movableTokenIds.length, 0);
  // Turn should have automatically passed to next player (blue)
  assert.equal(game.currentTurn, 'blue');
  assert.equal(game.hasRolled, false);
});

test('rolling a 6 allows deploying token from base onto the track', () => {
  let game = createNewGame('single_player', 'Alice', 'red', 3);
  // Force roll a 6
  game = rollDice(game, 6);
  assert.equal(game.diceValue, 6);
  assert.equal(game.movableTokenIds.length, 4);
  assert.equal(game.movableTokenIds.includes(0), true);

  // Move token 0
  game = moveToken(game, 0);
  assert.equal(game.tokens.red[0].state, 'track');
  assert.equal(game.tokens.red[0].stepCount, 0);
  assert.equal(getTrackPosition('red', 0), 0);
  // Rolling a 6 gives a bonus turn to red!
  assert.equal(game.currentTurn, 'red');
  assert.equal(game.hasRolled, false);
});

test('token moves forward along track by dice roll', () => {
  let game = createNewGame('single_player', 'Alice', 'red', 3);
  game = rollDice(game, 6);
  game = moveToken(game, 0);

  // Now roll a 4
  game = rollDice(game, 4);
  assert.equal(game.movableTokenIds.includes(0), true);
  game = moveToken(game, 0);

  assert.equal(game.tokens.red[0].stepCount, 4);
  assert.equal(getTrackPosition('red', 4), 4);
  // Since it was not a 6 or capture, turn passes to blue
  assert.equal(game.currentTurn, 'blue');
});

test('token captures opponent on non-safe square and sends it back to base', () => {
  let game = createNewGame('single_player', 'Alice', 'red', 3);
  // Put red token 0 on track position 10 (step 10 for red)
  game.tokens.red[0].state = 'track';
  game.tokens.red[0].stepCount = 6; // red track pos: 6

  // Put green/blue token 0 on track position 10 (blue start is 13; track pos 10 is (13 + 49) % 52)
  game.tokens.blue[0].state = 'track';
  game.tokens.blue[0].stepCount = 49; // track pos: (13 + 49) % 52 = 62 % 52 = 10

  // Verify track positions
  assert.equal(getTrackPosition('red', 10), 10);
  assert.equal(isSafePosition(10), false);

  // Set red's turn and roll a 4 to land on 10
  game.currentTurn = 'red';
  game.hasRolled = false;
  game = rollDice(game, 4);
  assert.equal(game.movableTokenIds.includes(0), true);

  game = moveToken(game, 0);
  assert.equal(game.tokens.red[0].stepCount, 10);
  // Blue token 0 should have been captured and returned to base!
  assert.equal(game.tokens.blue[0].state, 'base');
  assert.equal(game.tokens.blue[0].stepCount, -1);
  // Red gets a bonus roll for capturing!
  assert.equal(game.currentTurn, 'red');
});

test('safe star square protects token from capture', () => {
  let game = createNewGame('single_player', 'Alice', 'red', 3);
  // Star position 8 is safe
  assert.equal(isSafePosition(8), true);

  // Put red token at step 4 (pos 4)
  game.tokens.red[0].state = 'track';
  game.tokens.red[0].stepCount = 4;

  // Put blue token on safe spot 8
  // Blue start is 13, so 8 is (13 + 47) % 52 = 60 % 52 = 8
  game.tokens.blue[0].state = 'track';
  game.tokens.blue[0].stepCount = 47;
  assert.equal(getTrackPosition('blue', 47), 8);

  // Red rolls 4 and lands on safe spot 8
  game.currentTurn = 'red';
  game.hasRolled = false;
  game = rollDice(game, 4);
  game = moveToken(game, 0);

  // Blue token must NOT be captured because 8 is a safe star
  assert.equal(game.tokens.blue[0].state, 'track');
  assert.equal(game.tokens.blue[0].stepCount, 47);
});

test('exact roll required to enter home', () => {
  let game = createNewGame('single_player', 'Alice', 'red', 3);
  // Step 54 is in home column (needs exact 2 to reach 56)
  game.tokens.red[0].state = 'homeColumn';
  game.tokens.red[0].stepCount = 54;

  // Roll a 3 (54 + 3 = 57 > 56, illegal)
  game.currentTurn = 'red';
  game.hasRolled = false;
  game = rollDice(game, 3);
  assert.equal(game.movableTokenIds.includes(0), false);

  // Roll a 2 (54 + 2 = 56, legal!)
  game.currentTurn = 'red';
  game.hasRolled = false;
  game = rollDice(game, 2);
  assert.equal(game.movableTokenIds.includes(0), true);

  game = moveToken(game, 0);
  assert.equal(game.tokens.red[0].state, 'home');
  assert.equal(game.tokens.red[0].stepCount, 56);
  // Reaching home gives a bonus turn
  assert.equal(game.currentTurn, 'red');
});

test('bot AI prioritizes capturing opponent piece', () => {
  let game = createNewGame('single_player', 'Alice', 'red', 3);
  game.currentTurn = 'blue';
  game.diceValue = 3;

  // Token 0 can capture red token
  // Blue start offset is 13: step 4 -> (13 + 4) = 17, landing on 20
  game.tokens.blue[0].state = 'track';
  game.tokens.blue[0].stepCount = 4;
  game.tokens.red[0].state = 'track';
  game.tokens.red[0].stepCount = 20; // pos 20 (not safe)

  // Token 1 is just wandering with no capture
  game.tokens.blue[1].state = 'track';
  game.tokens.blue[1].stepCount = 30;

  game.movableTokenIds = [0, 1];
  const chosenToken = selectBotMove(game);
  assert.equal(chosenToken, 0);
});

test('winning condition registers when all 4 tokens reach home', () => {
  let game = createNewGame('single_player', 'Alice', 'red', 3);
  game.tokens.red[0].state = 'home';
  game.tokens.red[0].stepCount = 56;
  game.tokens.red[1].state = 'home';
  game.tokens.red[1].stepCount = 56;
  game.tokens.red[2].state = 'home';
  game.tokens.red[2].stepCount = 56;
  game.tokens.red[3].state = 'homeColumn';
  game.tokens.red[3].stepCount = 55;

  game.currentTurn = 'red';
  game.hasRolled = false;
  game = rollDice(game, 1);
  game = moveToken(game, 3);

  assert.equal(game.winner, 'red');
  assert.equal(game.rankings.includes('red'), true);
});

test('pass_and_play creates exactly the configured human players and zero bots', () => {
  const game = createNewGame('pass_and_play', 'Alice', 'red', 0, 'ROOM-1', {
    playerCount: 3,
    players: [
      { name: 'P1 Red', color: 'red' },
      { name: 'P2 Blue', color: 'blue' },
      { name: 'P3 Yellow', color: 'yellow' },
    ],
  });

  assert.equal(game.players.length, 3);
  assert.equal(game.players.every((p) => p.type === 'human'), true);
  assert.equal(game.players.some((p) => p.type === 'bot'), false);
  assert.equal(game.players[0].name, 'P1 Red');
  assert.equal(game.players[1].name, 'P2 Blue');
  assert.equal(game.players[2].name, 'P3 Yellow');
});

test('online_room creates 1 human host, 0 bots, and status waiting', () => {
  const game = createNewGame('online_room', 'HostPlayer', 'red', 0, 'ROOM-999');
  assert.equal(game.players.length, 1);
  assert.equal(game.players[0].type, 'human');
  assert.equal(game.status, 'waiting');
});

test('addPlayerToOnlineRoom assigns available color and blocks 5th player', () => {
  let game = createNewGame('online_room', 'Host', 'red', 0, 'ROOM-888');

  // Add 2nd player
  const res2 = addPlayerToOnlineRoom(game, { name: 'Player 2' });
  assert.equal('error' in res2, false);
  if (!('error' in res2)) {
    game = res2.state;
    assert.equal(res2.player.color, 'blue');
    assert.equal(game.players.length, 2);
  }

  // Add 3rd player
  const res3 = addPlayerToOnlineRoom(game, { name: 'Player 3' });
  assert.equal('error' in res3, false);
  if (!('error' in res3)) {
    game = res3.state;
    assert.equal(res3.player.color, 'yellow');
    assert.equal(game.players.length, 3);
  }

  // Add 4th player
  const res4 = addPlayerToOnlineRoom(game, { name: 'Player 4' });
  assert.equal('error' in res4, false);
  if (!('error' in res4)) {
    game = res4.state;
    assert.equal(res4.player.color, 'green');
    assert.equal(game.players.length, 4);
  }

  // Try 5th player -> should error
  const res5 = addPlayerToOnlineRoom(game, { name: 'Player 5' });
  assert.equal('error' in res5, true);
});

test('startOnlineRoomGame requires at least 2 players', () => {
  const soloRoom = createNewGame('online_room', 'Host', 'red', 0, 'ROOM-777');
  const errStart = startOnlineRoomGame(soloRoom);
  assert.equal('error' in errStart, true);

  const joinRes = addPlayerToOnlineRoom(soloRoom, { name: 'Guest' });
  assert.equal('error' in joinRes, false);
  if (!('error' in joinRes)) {
    const started = startOnlineRoomGame(joinRes.state);
    assert.equal('error' in started, false);
    if (!('error' in started)) {
      assert.equal(started.status, 'playing');
    }
  }
});

test('three consecutive sixes penalizes and passes turn to next player', () => {
  let game = createNewGame('single_player', 'Alice', 'red', 3);
  // Deploy 1 token first so moves are possible
  game = rollDice(game, 6);
  game = moveToken(game, 0); // Red token 0 on track, consecutiveSixes = 1

  // Second 6
  game = rollDice(game, 6);
  game = moveToken(game, 0); // consecutiveSixes = 2

  // Third 6 -> turn penalty, passes turn to blue!
  game = rollDice(game, 6);
  assert.equal(game.consecutiveSixes, 0);
  assert.equal(game.currentTurn, 'blue');
});
