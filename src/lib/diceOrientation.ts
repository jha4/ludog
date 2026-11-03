/**
 * 3D Dice Face Orientations and Geometry
 * Authoritative mapping of face values (1-6) to 3D Euler angles (X, Y, Z degrees).
 * Adheres to standard casino/board-game layout where opposite faces sum to 7:
 * 1 opposite 6, 2 opposite 5, 3 opposite 4.
 */

export interface DiceRotation {
  rotateX: number;
  rotateY: number;
  rotateZ: number;
}

export const DICE_FACE_ANGLES: Record<number, DiceRotation> = {
  1: { rotateX: 0, rotateY: 0, rotateZ: 0 },
  2: { rotateX: -90, rotateY: 0, rotateZ: 0 },
  3: { rotateX: 0, rotateY: -90, rotateZ: 0 },
  4: { rotateX: 0, rotateY: 90, rotateZ: 0 },
  5: { rotateX: 90, rotateY: 0, rotateZ: 0 },
  6: { rotateX: 0, rotateY: 180, rotateZ: 0 },
};

/**
 * Opposite face pairs sum to 7 in standard Western dice layout.
 */
export function getOppositeFace(face: number): number {
  if (face >= 1 && face <= 6) {
    return 7 - face;
  }
  return 1;
}

/**
 * Verifies if two faces are opposite each other
 */
export function isOppositeFace(a: number, b: number): boolean {
  return a + b === 7 && a >= 1 && a <= 6 && b >= 1 && b <= 6;
}

/**
 * Standard pip positions on a 3x3 grid (row: 0-2, col: 0-2)
 */
export const DICE_PIP_POSITIONS: Record<number, Array<[number, number]>> = {
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [0, 2],
    [2, 0],
    [2, 2],
  ],
  5: [
    [0, 0],
    [0, 2],
    [1, 1],
    [2, 0],
    [2, 2],
  ],
  6: [
    [0, 0],
    [0, 2],
    [1, 0],
    [1, 2],
    [2, 0],
    [2, 2],
  ],
};

/**
 * Calculates continuous tumbling target angles to prevent backward flipping
 * when spinning across multiple turns.
 */
export function calculateRollAngles(
  targetValue: number,
  prevRotations: DiceRotation,
  turns: number = 3
): DiceRotation {
  const base = DICE_FACE_ANGLES[targetValue] || DICE_FACE_ANGLES[1];

  // Add multiples of 360 to smoothly spin in the positive forward direction
  const xTurns = turns * 360;
  const yTurns = turns * 360;

  // Find next nearest multiple of 360 that is greater than current rotation
  const nextX = Math.ceil(prevRotations.rotateX / 360) * 360 + xTurns + base.rotateX;
  const nextY = Math.ceil(prevRotations.rotateY / 360) * 360 + yTurns + base.rotateY;

  return {
    rotateX: nextX,
    rotateY: nextY,
    rotateZ: base.rotateZ,
  };
}
