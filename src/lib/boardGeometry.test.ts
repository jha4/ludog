import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TRACK_GRID_COORDS,
  HOME_COLUMN_GRID_COORDS,
  HOME_FINISH_GRID_COORDS,
  BASE_PIT_PERCENT_COORDS,
  BOARD_GEOMETRY,
  getTokenBoardPercent,
  GridCoord,
} from './boardCoordinates.js';
import {
  PlayerColor,
  COLOR_START_OFFSETS,
  SAFE_TRACK_POSITIONS,
  COLOR_ORDER,
  createNewGame,
  rollDice,
  moveToken,
  getTrackPosition,
} from './ludoEngine.js';

// Helper to check adjacency on grid (orthogonal or corner-diagonal turn)
function areAdjacent(a: GridCoord, b: GridCoord): boolean {
  const dRow = Math.abs(a.row - b.row);
  const dCol = Math.abs(a.col - b.col);
  return dRow <= 1 && dCol <= 1 && (dRow + dCol > 0);
}

test('1. Exactly 52 unique shared-track coordinates exist', () => {
  assert.equal(TRACK_GRID_COORDS.length, 52);
  const keys = new Set(TRACK_GRID_COORDS.map((c) => `${c.row},${c.col}`));
  assert.equal(keys.size, 52, 'All 52 coordinates must be strictly unique');
});

test('2. All track coordinates are valid grid positions inside cross area', () => {
  TRACK_GRID_COORDS.forEach((coord, idx) => {
    assert.ok(coord.row >= 0 && coord.row <= 14, `Row ${coord.row} at index ${idx} out of range [0, 14]`);
    assert.ok(coord.col >= 0 && coord.col <= 14, `Col ${coord.col} at index ${idx} out of range [0, 14]`);

    // Must be inside cross: either cols 6..8 or rows 6..8
    const inVerticalArm = coord.col >= 6 && coord.col <= 8;
    const inHorizontalArm = coord.row >= 6 && coord.row <= 8;
    assert.ok(
      inVerticalArm || inHorizontalArm,
      `Track cell [${coord.row}, ${coord.col}] at index ${idx} must be inside the cross area`
    );
  });
});

test('3. Consecutive track coordinates are adjacent, including the wraparound', () => {
  for (let i = 0; i < 52; i++) {
    const curr = TRACK_GRID_COORDS[i];
    const next = TRACK_GRID_COORDS[(i + 1) % 52];
    assert.ok(
      areAdjacent(curr, next),
      `Track cell ${i} [${curr.row}, ${curr.col}] must be adjacent to cell ${(i + 1) % 52} [${next.row}, ${next.col}]`
    );
  }
});

test('4. The four start indices are distinct and map to the intended colored cells', () => {
  assert.equal(COLOR_START_OFFSETS.red, 0);
  assert.equal(COLOR_START_OFFSETS.green, 13);
  assert.equal(COLOR_START_OFFSETS.yellow, 26);
  assert.equal(COLOR_START_OFFSETS.blue, 39);

  // RED: Top-Left corner -> starts at [6, 1] on left arm heading East
  assert.deepEqual(TRACK_GRID_COORDS[0], { row: 6, col: 1 });
  // GREEN: Top-Right corner -> starts at [1, 8] on top arm heading South
  assert.deepEqual(TRACK_GRID_COORDS[13], { row: 1, col: 8 });
  // YELLOW: Bottom-Right corner -> starts at [8, 13] on right arm heading West
  assert.deepEqual(TRACK_GRID_COORDS[26], { row: 8, col: 13 });
  // BLUE: Bottom-Left corner -> starts at [13, 6] on bottom arm heading North
  assert.deepEqual(TRACK_GRID_COORDS[39], { row: 13, col: 6 });

  // Verify all 4 start squares are marked as safe
  assert.ok(SAFE_TRACK_POSITIONS.has(0));
  assert.ok(SAFE_TRACK_POSITIONS.has(13));
  assert.ok(SAFE_TRACK_POSITIONS.has(26));
  assert.ok(SAFE_TRACK_POSITIONS.has(39));
});

test('5. Each finishing lane contains 5 unique cells and leads toward the center', () => {
  const colors: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

  colors.forEach((color) => {
    const lane = HOME_COLUMN_GRID_COORDS[color];
    assert.equal(lane.length, 5);

    // Each cell in lane must be unique
    const laneKeys = new Set(lane.map((c) => `${c.row},${c.col}`));
    assert.equal(laneKeys.size, 5);

    // Consecutive cells in lane must be adjacent
    for (let i = 0; i < 4; i++) {
      assert.ok(areAdjacent(lane[i], lane[i + 1]), `${color} lane step ${i} -> ${i + 1} must be adjacent`);
    }

    // Lane must not intersect common track
    const trackSet = new Set(TRACK_GRID_COORDS.map((c) => `${c.row},${c.col}`));
    lane.forEach((c) => {
      assert.ok(!trackSet.has(`${c.row},${c.col}`), `${color} lane cell [${c.row}, ${c.col}] must not overlap track`);
    });

    // Final lane cell must be adjacent to center triangle finish
    const lastCell = lane[4];
    const finish = HOME_FINISH_GRID_COORDS[color];
    const finishGridCoord: GridCoord = { row: Math.round(finish.row), col: Math.round(finish.col) };
    assert.ok(areAdjacent(lastCell, finishGridCoord), `${color} last lane cell must be adjacent to center finish`);
  });
});

test('6. A token entering the board after rolling 6 appears on its own start square', () => {
  const colors: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

  colors.forEach((color) => {
    let game = createNewGame('single_player', 'Test', color, 3);
    game.currentTurn = color;
    game.hasRolled = false;
    game = rollDice(game, 6);
    game = moveToken(game, 0);

    const token = game.tokens[color][0];
    assert.equal(token.state, 'track');
    assert.equal(token.stepCount, 0);

    const trackPos = getTrackPosition(color, 0);
    assert.equal(trackPos, COLOR_START_OFFSETS[color]);

    const expectedCoord = BOARD_GEOMETRY[color].startCoordinate;
    const actualTrackCoord = TRACK_GRID_COORDS[trackPos!];
    assert.deepEqual(actualTrackCoord, expectedCoord);
  });
});

test('7. Moving a token one step advances it to the next displayed track cell', () => {
  const colors: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

  colors.forEach((color) => {
    let game = createNewGame('single_player', 'Test', color, 3);
    game.currentTurn = color;
    game.hasRolled = false;
    game = rollDice(game, 6);
    game = moveToken(game, 0);

    // Advance 1 step
    game.currentTurn = color;
    game.hasRolled = false;
    game = rollDice(game, 1);
    game = moveToken(game, 0);

    const token = game.tokens[color][0];
    assert.equal(token.stepCount, 1);

    const prevPos = getTrackPosition(color, 0)!;
    const currPos = getTrackPosition(color, 1)!;
    assert.equal(currPos, (prevPos + 1) % 52);

    const prevCoord = TRACK_GRID_COORDS[prevPos];
    const currCoord = TRACK_GRID_COORDS[currPos];
    assert.ok(areAdjacent(prevCoord, currCoord), `${color} move 0 -> 1 must advance to adjacent track cell`);
  });
});

test('8. A token entering its finishing lane follows that color lane without gaps', () => {
  const colors: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

  colors.forEach((color) => {
    // Step 50 is the last track step
    const trackStep50Pos = getTrackPosition(color, 50)!;
    const trackStep50Coord = TRACK_GRID_COORDS[trackStep50Pos];

    // Step 51 is the first home lane cell
    const homeStep51Coord = HOME_COLUMN_GRID_COORDS[color][0];

    // They must be strictly adjacent so the token turns smoothly into home
    assert.ok(
      areAdjacent(trackStep50Coord, homeStep51Coord),
      `${color} track exit [${trackStep50Coord.row}, ${trackStep50Coord.col}] must be adjacent to home entrance [${homeStep51Coord.row}, ${homeStep51Coord.col}]`
    );
  });
});

test('9. Tokens of one color cannot accidentally render as another color or in another base', () => {
  const colors: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];

  colors.forEach((color) => {
    for (let id = 0; id < 4; id++) {
      const coord = getTokenBoardPercent(color, id, -1);
      const pit = BASE_PIT_PERCENT_COORDS[color][id];
      assert.equal(coord.centerX, pit.centerX);
      assert.equal(coord.centerY, pit.centerY);
    }
  });

  // Verify all 4 corner centers are in separate quadrants
  assert.ok(BASE_PIT_PERCENT_COORDS.red[0].centerX < 50 && BASE_PIT_PERCENT_COORDS.red[0].centerY < 50, 'Red must be Top-Left');
  assert.ok(BASE_PIT_PERCENT_COORDS.green[0].centerX > 50 && BASE_PIT_PERCENT_COORDS.green[0].centerY < 50, 'Green must be Top-Right');
  assert.ok(BASE_PIT_PERCENT_COORDS.yellow[0].centerX > 50 && BASE_PIT_PERCENT_COORDS.yellow[0].centerY > 50, 'Yellow must be Bottom-Right');
  assert.ok(BASE_PIT_PERCENT_COORDS.blue[0].centerX < 50 && BASE_PIT_PERCENT_COORDS.blue[0].centerY > 50, 'Blue must be Bottom-Left');
});

test('10. The geometry works without breaking existing game modes', () => {
  // Single Player
  const single = createNewGame('single_player', 'Single', 'red', 3);
  assert.equal(single.players.length, 4);
  assert.equal(single.status, 'playing');

  // Pass and Play
  const pass = createNewGame('pass_and_play', 'Local', 'red', 0, 'ROOM-PP', {
    playerCount: 4,
    players: [
      { name: 'Red', color: 'red' },
      { name: 'Green', color: 'green' },
      { name: 'Yellow', color: 'yellow' },
      { name: 'Blue', color: 'blue' },
    ],
  });
  assert.equal(pass.players.length, 4);
  assert.deepEqual(pass.players.map((p) => p.color), COLOR_ORDER);

  // Online Room
  const online = createNewGame('online_room', 'Host', 'red', 0, 'ROOM-ON');
  assert.equal(online.players.length, 1);
  assert.equal(online.status, 'waiting');
});
