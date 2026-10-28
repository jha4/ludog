import { PlayerColor, getTrackPosition } from './ludoEngine.js';

export interface GridCoord {
  row: number; // 0 - 14
  col: number; // 0 - 14
}

export interface ColorGeometry {
  color: PlayerColor;
  corner: 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left';
  startIndex: number;
  startCoordinate: GridCoord;
  basePits: Array<{ centerX: number; centerY: number }>;
  homeLaneCoordinates: GridCoord[];
  centerCoordinate: GridCoord;
}

/**
 * Standard 52 Track cells mapped to 15x15 board coordinates [row, col]
 * Clockwise path around the 15x15 board:
 * 
 * Corner Arrangement:
 * - RED:    Top-Left     (Rows 0-5,  Cols 0-5)   -> Start: Row 6,  Col 1 (Index 0)
 * - GREEN:  Top-Right    (Rows 0-5,  Cols 9-14)  -> Start: Row 1,  Col 8 (Index 13)
 * - YELLOW: Bottom-Right (Rows 9-14, Cols 9-14)  -> Start: Row 8,  Col 13 (Index 26)
 * - BLUE:   Bottom-Left  (Rows 9-14, Cols 0-5)   -> Start: Row 13, Col 6 (Index 39)
 */
export const TRACK_GRID_COORDS: GridCoord[] = [
  // Sector 1: From Red Start (Row 6, Col 1) heading East then North along Top Arm
  { row: 6, col: 1 },  // 0  (RED START - Safe)
  { row: 6, col: 2 },  // 1
  { row: 6, col: 3 },  // 2
  { row: 6, col: 4 },  // 3
  { row: 6, col: 5 },  // 4
  { row: 5, col: 6 },  // 5  (Turn North up col 6)
  { row: 4, col: 6 },  // 6
  { row: 3, col: 6 },  // 7
  { row: 2, col: 6 },  // 8  (Safe Star 1)
  { row: 1, col: 6 },  // 9
  { row: 0, col: 6 },  // 10
  { row: 0, col: 7 },  // 11 (Green home entry cell)
  { row: 0, col: 8 },  // 12 (Turn South down col 8)

  // Sector 2: From Green Start (Row 1, Col 8) heading South then East along Right Arm
  { row: 1, col: 8 },  // 13 (GREEN START - Safe)
  { row: 2, col: 8 },  // 14
  { row: 3, col: 8 },  // 15
  { row: 4, col: 8 },  // 16
  { row: 5, col: 8 },  // 17
  { row: 6, col: 9 },  // 18 (Turn East along row 6)
  { row: 6, col: 10 }, // 19
  { row: 6, col: 11 }, // 20
  { row: 6, col: 12 }, // 21 (Safe Star 2)
  { row: 6, col: 13 }, // 22
  { row: 6, col: 14 }, // 23
  { row: 7, col: 14 }, // 24 (Yellow home entry cell)
  { row: 8, col: 14 }, // 25 (Turn West along row 8)

  // Sector 3: From Yellow Start (Row 8, Col 13) heading West then South along Bottom Arm
  { row: 8, col: 13 }, // 26 (YELLOW START - Safe)
  { row: 8, col: 12 }, // 27
  { row: 8, col: 11 }, // 28
  { row: 8, col: 10 }, // 29
  { row: 8, col: 9 },  // 30
  { row: 9, col: 8 },  // 31 (Turn South down col 8)
  { row: 10, col: 8 }, // 32
  { row: 11, col: 8 }, // 33
  { row: 12, col: 8 }, // 34 (Safe Star 3)
  { row: 13, col: 8 }, // 35
  { row: 14, col: 8 }, // 36
  { row: 14, col: 7 }, // 37 (Blue home entry cell)
  { row: 14, col: 6 }, // 38 (Turn North up col 6)

  // Sector 4: From Blue Start (Row 13, Col 6) heading North then West along Left Arm
  { row: 13, col: 6 }, // 39 (BLUE START - Safe)
  { row: 12, col: 6 }, // 40
  { row: 11, col: 6 }, // 41
  { row: 10, col: 6 }, // 42
  { row: 9, col: 6 },  // 43
  { row: 8, col: 5 },  // 44 (Turn West along row 8)
  { row: 8, col: 4 },  // 45
  { row: 8, col: 3 },  // 46
  { row: 8, col: 2 },  // 47 (Safe Star 4)
  { row: 8, col: 1 },  // 48
  { row: 8, col: 0 },  // 49
  { row: 7, col: 0 },  // 50 (Red home entry cell)
  { row: 6, col: 0 },  // 51 (Wraps back to Index 0 at row 6, col 1)
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
  green: [
    { row: 1, col: 7 },
    { row: 2, col: 7 },
    { row: 3, col: 7 },
    { row: 4, col: 7 },
    { row: 5, col: 7 },
  ],
  yellow: [
    { row: 7, col: 13 },
    { row: 7, col: 12 },
    { row: 7, col: 11 },
    { row: 7, col: 10 },
    { row: 7, col: 9 },
  ],
  blue: [
    { row: 13, col: 7 },
    { row: 12, col: 7 },
    { row: 11, col: 7 },
    { row: 10, col: 7 },
    { row: 9, col: 7 },
  ],
};

/**
 * Center finish target positions (step 56)
 */
export const HOME_FINISH_GRID_COORDS: Record<PlayerColor, GridCoord> = {
  red: { row: 7, col: 6.4 },      // Left finishing triangle
  green: { row: 6.4, col: 7 },    // Top finishing triangle
  yellow: { row: 7, col: 7.6 },   // Right finishing triangle
  blue: { row: 7.6, col: 7 },     // Bottom finishing triangle
};

/**
 * Exact percentage coordinates [centerX%, centerY%] for the 4 pits inside each player's 6x6 base.
 * In a 15x15 board:
 * - RED:    Top-Left     (Center at 20%, 20%) -> X: 13.2%, 26.8% and Y: 13.2%, 26.8%
 * - GREEN:  Top-Right    (Center at 80%, 20%) -> X: 73.2%, 86.8% and Y: 13.2%, 26.8%
 * - YELLOW: Bottom-Right (Center at 80%, 80%) -> X: 73.2%, 86.8% and Y: 73.2%, 86.8%
 * - BLUE:   Bottom-Left  (Center at 20%, 80%) -> X: 13.2%, 26.8% and Y: 73.2%, 86.8%
 */
export const BASE_PIT_PERCENT_COORDS: Record<PlayerColor, Array<{ centerX: number; centerY: number }>> = {
  red: [
    { centerX: 13.2, centerY: 13.2 },
    { centerX: 26.8, centerY: 13.2 },
    { centerX: 13.2, centerY: 26.8 },
    { centerX: 26.8, centerY: 26.8 },
  ],
  green: [
    { centerX: 73.2, centerY: 13.2 },
    { centerX: 86.8, centerY: 13.2 },
    { centerX: 73.2, centerY: 26.8 },
    { centerX: 86.8, centerY: 26.8 },
  ],
  yellow: [
    { centerX: 73.2, centerY: 73.2 },
    { centerX: 86.8, centerY: 73.2 },
    { centerX: 73.2, centerY: 86.8 },
    { centerX: 86.8, centerY: 86.8 },
  ],
  blue: [
    { centerX: 13.2, centerY: 73.2 },
    { centerX: 26.8, centerY: 73.2 },
    { centerX: 13.2, centerY: 86.8 },
    { centerX: 26.8, centerY: 86.8 },
  ],
};

export const BASE_SLOT_GRID_COORDS = BASE_PIT_PERCENT_COORDS;

/**
 * Authoritative Board Geometry mapping for each color
 */
export const BOARD_GEOMETRY: Record<PlayerColor, ColorGeometry> = {
  red: {
    color: 'red',
    corner: 'top-left',
    startIndex: 0,
    startCoordinate: TRACK_GRID_COORDS[0],
    basePits: BASE_PIT_PERCENT_COORDS.red,
    homeLaneCoordinates: HOME_COLUMN_GRID_COORDS.red,
    centerCoordinate: HOME_FINISH_GRID_COORDS.red,
  },
  green: {
    color: 'green',
    corner: 'top-right',
    startIndex: 13,
    startCoordinate: TRACK_GRID_COORDS[13],
    basePits: BASE_PIT_PERCENT_COORDS.green,
    homeLaneCoordinates: HOME_COLUMN_GRID_COORDS.green,
    centerCoordinate: HOME_FINISH_GRID_COORDS.green,
  },
  yellow: {
    color: 'yellow',
    corner: 'bottom-right',
    startIndex: 26,
    startCoordinate: TRACK_GRID_COORDS[26],
    basePits: BASE_PIT_PERCENT_COORDS.yellow,
    homeLaneCoordinates: HOME_COLUMN_GRID_COORDS.yellow,
    centerCoordinate: HOME_FINISH_GRID_COORDS.yellow,
  },
  blue: {
    color: 'blue',
    corner: 'bottom-left',
    startIndex: 39,
    startCoordinate: TRACK_GRID_COORDS[39],
    basePits: BASE_PIT_PERCENT_COORDS.blue,
    homeLaneCoordinates: HOME_COLUMN_GRID_COORDS.blue,
    centerCoordinate: HOME_FINISH_GRID_COORDS.blue,
  },
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
    const pit = BASE_PIT_PERCENT_COORDS[color]?.[tokenId] || BASE_PIT_PERCENT_COORDS[color]?.[0] || { centerX: 20, centerY: 20 };
    return {
      left: pit.centerX - HALF_TOKEN,
      top: pit.centerY - HALF_TOKEN,
      centerX: pit.centerX,
      centerY: pit.centerY,
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
