import { PlayerColor, getTrackPosition } from './ludoEngine.js';
import { getTokenBoardPercent, GridCoord } from './boardCoordinates.js';

export interface TokenAnimationConfig {
  stepDurationMs: number;
  spawnDurationMs: number;
  captureDurationMs: number;
  homeDurationMs: number;
  maxTotalDurationMs: number;
}

export const DEFAULT_ANIMATION_CONFIG: TokenAnimationConfig = {
  stepDurationMs: 90,
  spawnDurationMs: 220,
  captureDurationMs: 250,
  homeDurationMs: 260,
  maxTotalDurationMs: 520,
};

export const FAST_ANIMATION_CONFIG: TokenAnimationConfig = {
  stepDurationMs: 55,
  spawnDurationMs: 150,
  captureDurationMs: 180,
  homeDurationMs: 180,
  maxTotalDurationMs: 320,
};

/**
 * Checks if user prefers reduced motion
 */
export function isReducedMotionPreferred(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Generates the sequence of intermediate step numbers for a token move.
 * Example: fromStep = 3, toStep = 7 -> [3, 4, 5, 6, 7]
 * Spawning: fromStep = -1, toStep = 0 -> [-1, 0]
 * Capture kickback: fromStep = 24, toStep = -1 -> [24, -1]
 */
export function generateTokenPath(fromStep: number, toStep: number): number[] {
  if (fromStep === toStep) return [toStep];

  // Case 1: Deploy from base
  if (fromStep === -1 && toStep === 0) {
    return [-1, 0];
  }

  // Case 2: Returned to base (capture)
  if (toStep === -1) {
    return [fromStep, -1];
  }

  // Case 3: Normal progression along track/home column
  if (toStep > fromStep) {
    const path: number[] = [];
    for (let s = fromStep; s <= toStep; s++) {
      path.push(s);
    }
    return path;
  }

  // Fallback direct
  return [fromStep, toStep];
}

/**
 * Calculate the interpolated visual position of a token during movement.
 * Includes a parabolic hop height (arc) and scale effect.
 */
export interface VisualTokenPosition {
  leftPct: number;
  topPct: number;
  arcOffsetPx: number;
  scale: number;
  shadowScale: number;
}

export function calculateHopPosition(
  fromCoord: { left: number; top: number },
  toCoord: { left: number; top: number },
  progress: number, // 0 to 1
  isReducedMotion: boolean = false
): VisualTokenPosition {
  if (isReducedMotion) {
    const currentCoord = progress >= 1 ? toCoord : fromCoord;
    return {
      leftPct: currentCoord.left,
      topPct: currentCoord.top,
      arcOffsetPx: 0,
      scale: 1,
      shadowScale: 1,
    };
  }

  // Linear interpolation of coordinate percentages
  const leftPct = fromCoord.left + (toCoord.left - fromCoord.left) * progress;
  const topPct = fromCoord.top + (toCoord.top - fromCoord.top) * progress;

  // Parabolic vertical arc: 4 * progress * (1 - progress) peaks at 1.0 when progress = 0.5
  const arcFactor = 4 * progress * (1 - progress);
  const arcOffsetPx = arcFactor === 0 ? 0 : -arcFactor * 10; // 10px hop peak
  const scale = 1 + arcFactor * 0.18; // 1.18x peak scale during hop
  const shadowScale = 1 + arcFactor * 0.35;

  return {
    leftPct,
    topPct,
    arcOffsetPx,
    scale,
    shadowScale,
  };
}
