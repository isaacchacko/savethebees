// The rules of the game page: days, the score each one demands, what the
// player is given to build with, and how fast people move in.

import { PARK, STATION, type Board } from './board.ts';
import { maxScore } from './optimize.ts';
import { tunnelPairs } from './sim.ts';

/** How long a day lasts. */
export const DAY_MS = 45_000;

/** The tutorial's one day, shorter: it is there to show a day, not to test one. */
export const TUTORIAL_DAY_MS = 30_000;

/** How close to the planner's best a day has to come. */
export const TARGET_SHARE = 0.9;

/**
 * The score a day must end at or above for the game to go on: 90% of the
 * best the planner (lib/map/optimize) could do with the same people and the
 * same allowance. It moves as people arrive, and the day is judged on the
 * board it ends with.
 */
export function targetFor(b: Board, day: number): number {
  return Math.max(1, Math.round(TARGET_SHARE * maxScore(b, allowance(day))));
}

/** Every other day the land turns on the town (see sim.catastrophe). */
export const isCatastropheDay = (day: number) => day % 2 === 0;

/** How far into a catastrophe day it strikes. */
export const CATASTROPHE_AT = 0.35;

/** What can be built: everything handed out so far, from day one up to this day. */
export type Allowance = { station: number; park: number; tunnel: number };

export function allowance(day: number): Allowance {
  return {
    station: 3 + 2 * (day - 1),
    park: day,
    tunnel: 1 + Math.floor((day - 1) / 2),
  };
}

/** What's built that counts against the allowance. Tunnels count in pairs. */
export function used(b: Board): Allowance {
  let station = 0;
  let park = 0;
  for (const v of b.build) {
    if (v === STATION) station++;
    else if (v === PARK) park++;
  }
  return { station, park, tunnel: tunnelPairs(b) };
}

/**
 * What's left to build with. It's worked out from the board, not tallied, so
 * erasing a station or undoing one gives it straight back.
 */
export function left(b: Board, day: number): Allowance {
  const have = allowance(day);
  const spent = used(b);
  return {
    station: have.station - spent.station,
    park: have.park - spent.park,
    tunnel: have.tunnel - spent.tunnel,
  };
}

/** Whether a board stays within the day's allowance — the check every placement passes. */
export function affordable(b: Board, day: number): boolean {
  const l = left(b, day);
  return l.station >= 0 && l.park >= 0 && l.tunnel >= 0;
}

/** New residents a day brings, spread across it. */
export function arrivals(day: number): number {
  return 4 + 2 * day;
}

/** How scattered they are: higher than the site's town, so they land in awkward places. */
export const SPREAD = 0.3;

/** What the player has done, for the end screen. */
export type Stats = {
  days: number;
  score: number;
  best: number;
  people: number;
  served: number;
  stations: number;
  rail: number;
  tunnels: number;
  parks: number;
  catastrophes: number;
};
