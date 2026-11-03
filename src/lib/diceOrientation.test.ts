import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DICE_FACE_ANGLES,
  getOppositeFace,
  isOppositeFace,
  DICE_PIP_POSITIONS,
  calculateRollAngles,
} from './diceOrientation.ts';

test('3D Dice - All 6 faces have standard opposite pairings summing to 7', () => {
  for (let face = 1; face <= 6; face++) {
    const opp = getOppositeFace(face);
    assert.equal(opp, 7 - face);
    assert.ok(isOppositeFace(face, opp));
  }

  assert.equal(isOppositeFace(1, 6), true);
  assert.equal(isOppositeFace(2, 5), true);
  assert.equal(isOppositeFace(3, 4), true);
  assert.equal(isOppositeFace(1, 2), false);
  assert.equal(isOppositeFace(3, 5), false);
});

test('3D Dice - Face Euler angles are distinct for all 6 values', () => {
  const seen = new Set<string>();
  for (let face = 1; face <= 6; face++) {
    const rot = DICE_FACE_ANGLES[face];
    assert.ok(rot, `Missing rotation for face ${face}`);
    const key = `${rot.rotateX},${rot.rotateY},${rot.rotateZ}`;
    assert.ok(!seen.has(key), `Duplicate rotation found for face ${face}: ${key}`);
    seen.add(key);
  }
  assert.equal(seen.size, 6);
});

test('3D Dice - Pip counts match face value exactly', () => {
  for (let face = 1; face <= 6; face++) {
    const pips = DICE_PIP_POSITIONS[face];
    assert.equal(pips.length, face, `Face ${face} should have exactly ${face} pips`);

    // Verify all coords are within 3x3 grid [0..2, 0..2]
    pips.forEach(([row, col]) => {
      assert.ok(row >= 0 && row <= 2, `Row ${row} out of bounds for face ${face}`);
      assert.ok(col >= 0 && col <= 2, `Col ${col} out of bounds for face ${face}`);
    });
  }

  // 1 has center pip
  assert.deepEqual(DICE_PIP_POSITIONS[1], [[1, 1]]);
});

test('3D Dice - calculateRollAngles continuously increments rotation without reversing', () => {
  const prev = { rotateX: 0, rotateY: 0, rotateZ: 0 };
  const roll1 = calculateRollAngles(4, prev, 2);

  // Must have rotated forward
  assert.ok(roll1.rotateX > prev.rotateX);
  assert.ok(roll1.rotateY > prev.rotateY);

  // Subsequent roll maintains forward accumulation
  const roll2 = calculateRollAngles(6, roll1, 3);
  assert.ok(roll2.rotateX > roll1.rotateX);
  assert.ok(roll2.rotateY > roll1.rotateY);
});

test('3D Dice - calculateRollAngles aligns modulo 360 with base face angles for all values 1..6', () => {
  let currentRot = { rotateX: 45, rotateY: 60, rotateZ: 0 };
  for (let face = 1; face <= 6; face++) {
    const rolled = calculateRollAngles(face, currentRot, 2);
    const expected = DICE_FACE_ANGLES[face];

    const actualModX = ((rolled.rotateX % 360) + 360) % 360;
    const actualModY = ((rolled.rotateY % 360) + 360) % 360;
    const expectedModX = ((expected.rotateX % 360) + 360) % 360;
    const expectedModY = ((expected.rotateY % 360) + 360) % 360;

    assert.equal(actualModX, expectedModX, `Face ${face} rotateX modulo mismatch`);
    assert.equal(actualModY, expectedModY, `Face ${face} rotateY modulo mismatch`);
    assert.ok(rolled.rotateX > currentRot.rotateX, `Face ${face} did not rotate forward in X`);
    assert.ok(rolled.rotateY > currentRot.rotateY, `Face ${face} did not rotate forward in Y`);

    currentRot = rolled;
  }
});
