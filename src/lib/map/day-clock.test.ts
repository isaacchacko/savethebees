import assert from 'node:assert/strict';
import { test } from 'node:test';
import { advanceDayClock, dayClock, toggleDaySpeed } from './day-clock.ts';

test('speed changes apply only to time after the toggle', () => {
  let clock = dayClock(100);
  clock = advanceDayClock(clock, 1100);
  assert.equal(clock.elapsed, 1000);
  clock = toggleDaySpeed(clock, 1600);
  assert.equal(clock.elapsed, 1500);
  assert.equal(clock.speed, 2);
  clock = advanceDayClock(clock, 2600);
  assert.equal(clock.elapsed, 3500);
  clock = toggleDaySpeed(clock, 3100);
  assert.equal(clock.elapsed, 4500);
  assert.equal(clock.speed, 1);
  clock = advanceDayClock(clock, 4100);
  assert.equal(clock.elapsed, 5500);
});

test('the same clock crosses arrival, catastrophe and sundown deadlines at 2×', () => {
  let clock = toggleDaySpeed(dayClock(0), 0);
  clock = advanceDayClock(clock, 750);
  assert.equal(clock.elapsed, 1500);
  clock = advanceDayClock(clock, 7875);
  assert.ok(clock.elapsed >= 45_000 * 0.35);
  clock = advanceDayClock(clock, 20_250);
  assert.equal((45_000 - clock.elapsed) / 45_000, 0.1);
  clock = advanceDayClock(clock, 22_500);
  assert.equal(clock.elapsed, 45_000);
  assert.deepEqual(dayClock(22_500), { elapsed: 0, updatedAt: 22_500, speed: 1 });
});
