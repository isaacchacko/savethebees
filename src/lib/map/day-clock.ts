export type DayClock = { elapsed: number; updatedAt: number; speed: 1 | 2 };

export function dayClock(now: number): DayClock {
  return { elapsed: 0, updatedAt: now, speed: 1 };
}

export function advanceDayClock(clock: DayClock, now: number): DayClock {
  return { ...clock, elapsed: clock.elapsed + Math.max(0, now - clock.updatedAt) * clock.speed, updatedAt: now };
}

export function toggleDaySpeed(clock: DayClock, now: number): DayClock {
  return { ...advanceDayClock(clock, now), speed: clock.speed === 1 ? 2 : 1 };
}
