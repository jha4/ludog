import { PlayerColor } from './ludoEngine.js';

export interface TokenAnimationConfig {
  stepDurationMs: number;
  spawnDurationMs: number;
  captureDurationMs: number;
  homeDurationMs: number;
  maxTotalDurationMs: number;
  hopHeightPx: number;
  peakScale: number;
  landingDurationMs: number;
}

export const DEFAULT_ANIMATION_CONFIG: TokenAnimationConfig = {
  stepDurationMs: 175,
  spawnDurationMs: 280,
  captureDurationMs: 380,
  homeDurationMs: 320,
  maxTotalDurationMs: 1400,
  hopHeightPx: 6,
  peakScale: 1.07,
  landingDurationMs: 60,
};

export const FAST_ANIMATION_CONFIG: TokenAnimationConfig = {
  stepDurationMs: 110,
  spawnDurationMs: 180,
  captureDurationMs: 240,
  homeDurationMs: 220,
  maxTotalDurationMs: 800,
  hopHeightPx: 5,
  peakScale: 1.05,
  landingDurationMs: 40,
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
 * Includes a parabolic hop height (arc) and subtle scale effect.
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
  isReducedMotion: boolean = false,
  hopHeightPx: number = 6,
  peakScale: number = 1.07
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
  const arcOffsetPx = arcFactor === 0 ? 0 : -arcFactor * hopHeightPx;
  const scale = 1 + arcFactor * (peakScale - 1);
  const shadowScale = 1 + arcFactor * 0.15;

  return {
    leftPct,
    topPct,
    arcOffsetPx,
    scale,
    shadowScale,
  };
}
