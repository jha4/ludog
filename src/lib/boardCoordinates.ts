import { PlayerColor, getTrackPosition } from './ludoEngine.js';

export interface GridCoord {
  row: number; // 0 - 14
  col: number; // 0 - 14
}

/**
 * Standard 52 Track cells mapped to 15x15 board coordinates [row, col]
 * Clockwise path around the 15x15 board:
 * Red: Bottom-Left (exit Row 8, Col 1 -> move along track)
 */
export const TRACK_GRID_COORDS: GridCoord[] = [
  { row: 8, col: 1 },  // 0  (Red Start, Safe)
  { row: 8, col: 2 },  // 1
  { row: 8, col: 3 },  // 2
  { row: 8, col: 4 },  // 3
  { row: 8, col: 5 },  // 4
  { row: 9, col: 6 },  // 5
  { row: 10, col: 6 }, // 6
  { row: 11, col: 6 }, // 7
  { row: 12, col: 6 }, // 8  (Safe star)
  { row: 13, col: 6 }, // 9
  { row: 14, col: 6 }, // 10
  { row: 14, col: 7 }, // 11
  { row: 14, col: 8 }, // 12
  { row: 13, col: 8 }, // 13 (Blue Start, Safe)
  { row: 12, col: 8 }, // 14
  { row: 11, col: 8 }, // 15
  { row: 10, col: 8 }, // 16
  { row: 9, col: 8 },  // 17
  { row: 8, col: 9 },  // 18
  { row: 8, col: 10 }, // 19
  { row: 8, col: 11 }, // 20
  { row: 8, col: 12 }, // 21 (Safe star)
  { row: 8, col: 13 }, // 22
  { row: 8, col: 14 }, // 23
  { row: 7, col: 14 }, // 24
  { row: 6, col: 14 }, // 25
  { row: 6, col: 13 }, // 26 (Yellow Start, Safe)
  { row: 6, col: 12 }, // 27
  { row: 6, col: 11 }, // 28
  { row: 6, col: 10 }, // 29
  { row: 6, col: 9 },  // 30
  { row: 5, col: 8 },  // 31
  { row: 4, col: 8 },  // 32
  { row: 3, col: 8 },  // 33
  { row: 2, col: 8 },  // 34 (Safe star)
  { row: 1, col: 8 },  // 35
  { row: 0, col: 8 },  // 36
  { row: 0, col: 7 },  // 37
  { row: 0, col: 6 },  // 38
  { row: 1, col: 6 },  // 39 (Green Start, Safe)
  { row: 2, col: 6 },  // 40
  { row: 3, col: 6 },  // 41
  { row: 4, col: 6 },  // 42
  { row: 5, col: 6 },  // 43
  { row: 6, col: 5 },  // 44
  { row: 6, col: 4 },  // 45
  { row: 6, col: 3 },  // 46
  { row: 6, col: 2 },  // 47 (Safe star)
  { row: 6, col: 1 },  // 48
  { row: 6, col: 0 },  // 49
  { row: 7, col: 0 },  // 50
  { row: 8, col: 0 },  // 51
];

/**
 * 5 Home column cells for each color leading to center (steps 51 to 55)
 */
export const HOME_COLUMN_GRID_COORDS: Record<PlayerColor, GridCoord[]> = {
  red: [
    { row: 7, col: 1 },
    { row: 7, col: 2 },
    { row: 7, col: 3 },
    { row: 7, col: 4 },
    { row: 7, col: 5 },
  ],
  blue: [
    { row: 13, col: 7 },
    { row: 12, col: 7 },
    { row: 11, col: 7 },
    { row: 10, col: 7 },
    { row: 9, col: 7 },
  ],
  yellow: [
    { row: 7, col: 13 },
    { row: 7, col: 12 },
    { row: 7, col: 11 },
    { row: 7, col: 10 },
    { row: 7, col: 9 },
  ],
  green: [
    { row: 1, col: 7 },
    { row: 2, col: 7 },
    { row: 3, col: 7 },
    { row: 4, col: 7 },
    { row: 5, col: 7 },
  ],
};

/**
 * Center finish target positions (step 56)
 */
export const HOME_FINISH_GRID_COORDS: Record<PlayerColor, GridCoord> = {
  red: { row: 7, col: 6.4 },
  blue: { row: 7.6, col: 7 },
  yellow: { row: 7, col: 7.6 },
  green: { row: 6.4, col: 7 },
};

/**
 * Exact slot coordinates for the 4 tokens inside each player's 6x6 base.
 * In a 15x15 board, cell coordinates represent the exact center of each pit:
 * Green (top-left, 0-5): cols 1.75, 4.25; rows 1.75, 4.25
 * Yellow (top-right, cols 9-14, rows 0-5): cols 10.75, 13.25; rows 1.75, 4.25
 * Red (bottom-left, cols 0-5, rows 9-14): cols 1.75, 4.25; rows 10.75, 13.25
 * Blue (bottom-right, cols 9-14, rows 9-14): cols 10.75, 13.25; rows 10.75, 13.25
 */
export const BASE_SLOT_GRID_COORDS: Record<PlayerColor, GridCoord[]> = {
  green: [
    { row: 2.0, col: 2.0 },
    { row: 2.0, col: 4.0 },
    { row: 4.0, col: 2.0 },
    { row: 4.0, col: 4.0 },
  ],
  yellow: [
    { row: 2.0, col: 11.0 },
    { row: 2.0, col: 13.0 },
    { row: 4.0, col: 11.0 },
    { row: 4.0, col: 13.0 },
  ],
  red: [
    { row: 11.0, col: 2.0 },
    { row: 11.0, col: 4.0 },
    { row: 13.0, col: 2.0 },
    { row: 13.0, col: 4.0 },
  ],
  blue: [
    { row: 11.0, col: 11.0 },
    { row: 11.0, col: 13.0 },
    { row: 13.0, col: 11.0 },
    { row: 13.0, col: 13.0 },
  ],
};

/**
 * Token visual diameter in percentage of board width
 */
export const TOKEN_DIAMETER_PCT = 6.4;

/**
 * Convert any token state & stepCount into exact percentage coordinates [left%, top%] on the 15x15 board.
 * Returns the exact top-left percentage of the token so it is perfectly centered on the target cell!
 */
export function getTokenBoardPercent(
  color: PlayerColor,
  tokenId: number,
  stepCount: number,
  stackIndex: number = 0,
  stackTotal: number = 1
): { left: number; top: number; centerX: number; centerY: number } {
  const CELL_SIZE_PCT = 100 / 15; // 6.66667%
  const HALF_TOKEN = TOKEN_DIAMETER_PCT / 2; // 3.2%

  let cellCenterX = 50;
  let cellCenterY = 50;

  if (stepCount < 0) {
    // Inside Base: coordinates are exact pit centers
    const slot = BASE_SLOT_GRID_COORDS[color][tokenId] || BASE_SLOT_GRID_COORDS[color][0];
    cellCenterX = (slot.col - 0.5) * CELL_SIZE_PCT;
    cellCenterY = (slot.row - 0.5) * CELL_SIZE_PCT;

    return {
      left: cellCenterX - HALF_TOKEN,
      top: cellCenterY - HALF_TOKEN,
      centerX: cellCenterX,
      centerY: cellCenterY,
    };
  }

  // Offset if multiple tokens share the same track/home cell
  let offsetX = 0;
  let offsetY = 0;
  if (stackTotal > 1) {
    if (stackTotal === 2) {
      offsetX = stackIndex === 0 ? -0.8 : 0.8;
      offsetY = stackIndex === 0 ? -0.8 : 0.8;
    } else {
      const angle = (stackIndex / stackTotal) * 2 * Math.PI;
      offsetX = Math.cos(angle) * 1.1;
      offsetY = Math.sin(angle) * 1.1;
    }
  }

  if (stepCount >= 56) {
    // In Home Finish Triangle
    const finish = HOME_FINISH_GRID_COORDS[color];
    const finishOffsets = [
      { dx: -0.25, dy: -0.25 },
      { dx: 0.25, dy: -0.25 },
      { dx: -0.25, dy: 0.25 },
      { dx: 0.25, dy: 0.25 },
    ];
    const off = finishOffsets[tokenId % 4];
    cellCenterX = (finish.col + 0.5 + off.dx) * CELL_SIZE_PCT;
    cellCenterY = (finish.row + 0.5 + off.dy) * CELL_SIZE_PCT;

    return {
      left: cellCenterX - HALF_TOKEN,
      top: cellCenterY - HALF_TOKEN,
      centerX: cellCenterX,
      centerY: cellCenterY,
    };
  }

  if (stepCount > 50) {
    // In Home Column (steps 51 to 55 -> index 0 to 4)
    const homeColIndex = stepCount - 51;
    const coord = HOME_COLUMN_GRID_COORDS[color][homeColIndex];
    cellCenterX = (coord.col + 0.5) * CELL_SIZE_PCT + offsetX;
    cellCenterY = (coord.row + 0.5) * CELL_SIZE_PCT + offsetY;

    return {
      left: cellCenterX - HALF_TOKEN,
      top: cellCenterY - HALF_TOKEN,
      centerX: cellCenterX,
      centerY: cellCenterY,
    };
  }

  // On common track (steps 0 to 50)
  const trackPos = getTrackPosition(color, stepCount);
  if (trackPos === null) {
    return {
      left: 50 - HALF_TOKEN,
      top: 50 - HALF_TOKEN,
      centerX: 50,
      centerY: 50,
    };
  }

  const coord = TRACK_GRID_COORDS[trackPos];
  cellCenterX = (coord.col + 0.5) * CELL_SIZE_PCT + offsetX;
  cellCenterY = (coord.row + 0.5) * CELL_SIZE_PCT + offsetY;

  return {
    left: cellCenterX - HALF_TOKEN,
    top: cellCenterY - HALF_TOKEN,
    centerX: cellCenterX,
    centerY: cellCenterY,
  };
}
