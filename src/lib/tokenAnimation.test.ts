import test from 'node:test';
import assert from 'node:assert/strict';
import { generateTokenPath, calculateHopPosition } from './tokenAnimation.ts';

test('Token Animation - Generates correct step sequences', () => {
  // Deploy from base
  assert.deepEqual(generateTokenPath(-1, 0), [-1, 0]);

  // Normal track movement
  assert.deepEqual(generateTokenPath(0, 4), [0, 1, 2, 3, 4]);
  assert.deepEqual(generateTokenPath(48, 52), [48, 49, 50, 51, 52]);

  // Movement into home finish
  assert.deepEqual(generateTokenPath(53, 56), [53, 54, 55, 56]);

  // Capture kickback
  assert.deepEqual(generateTokenPath(32, -1), [32, -1]);

  // Same step
  assert.deepEqual(generateTokenPath(10, 10), [10]);
});

test('Token Animation - Parabolic hop position calculation', () => {
  const fromCoord = { left: 10, top: 20 };
  const toCoord = { left: 20, top: 40 };

  // Progress 0
  const start = calculateHopPosition(fromCoord, toCoord, 0, false);
  assert.equal(start.leftPct, 10);
  assert.equal(start.topPct, 20);
  assert.equal(start.arcOffsetPx, 0);

  // Progress 0.5 (peak of hop)
  const mid = calculateHopPosition(fromCoord, toCoord, 0.5, false);
  assert.equal(mid.leftPct, 15);
  assert.equal(mid.topPct, 30);
  assert.ok(mid.arcOffsetPx < 0); // Arc lifts up
  assert.ok(mid.scale > 1); // Scale expands at peak

  // Progress 1 (landing)
  const end = calculateHopPosition(fromCoord, toCoord, 1, false);
  assert.equal(end.leftPct, 20);
  assert.equal(end.topPct, 40);
  assert.equal(end.arcOffsetPx, 0);
  assert.equal(end.scale, 1);
});

test('Token Animation - Reduced motion compliance', () => {
  const fromCoord = { left: 10, top: 20 };
  const toCoord = { left: 20, top: 40 };

  const mid = calculateHopPosition(fromCoord, toCoord, 0.5, true);
  assert.equal(mid.arcOffsetPx, 0);
  assert.equal(mid.scale, 1);
});
