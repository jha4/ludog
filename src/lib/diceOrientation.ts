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
 * Calculates continuous tumbling target angles to guarantee forward multi-axis rotation
 * without backward flipping or angular discontinuity across multiple rolls.
 */
export function calculateRollAngles(
  targetValue: number,
  prevRotations: DiceRotation,
  turns: number = 2
): DiceRotation {
  const base = DICE_FACE_ANGLES[targetValue] || DICE_FACE_ANGLES[1];

  // Target angle modulo 360 [0..359]
  const targetModX = ((base.rotateX % 360) + 360) % 360;
  const targetModY = ((base.rotateY % 360) + 360) % 360;

  // Current angle modulo 360 [0..359]
  const currentModX = ((prevRotations.rotateX % 360) + 360) % 360;
  const currentModY = ((prevRotations.rotateY % 360) + 360) % 360;

  // Calculate forward rotation delta along X axis
  let deltaX = targetModX - currentModX;
  if (turns > 0 && deltaX <= 0) deltaX += 360;
  if (turns === 0 && deltaX < 0) deltaX += 360;

  // Calculate forward rotation delta along Y axis
  let deltaY = targetModY - currentModY;
  if (turns > 0 && deltaY <= 0) deltaY += 360;
  if (turns === 0 && deltaY < 0) deltaY += 360;

  const nextX = prevRotations.rotateX + deltaX + turns * 360;
  const nextY = prevRotations.rotateY + deltaY + turns * 360;

  return {
    rotateX: nextX,
    rotateY: nextY,
    rotateZ: 0,
  };
}
