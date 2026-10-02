# Map spec

Status: **draft**. Items marked **OPEN** need a decision; anything marked
*(proposed)* is a default that holds until someone changes it.

## Purpose

The hex map behind the site's card becomes a small city builder.

- **Idle:** what a visitor sees by default. A town grows slowly on its own,
  with smooth animations as things change.
- **Play:** build a high-scoring city.

Order of work: **free-play mode → idle mode → game mode.** Free play comes
first because it is the rules engine with no AI and no economy. Idle mode is
free play driven by a bot, and game mode is free play plus a budget and a
clock.

## Board

- A hex grid that fills the viewport, like the current `<hex-wfc>` with
  `shape="rect"`. **Decided**: there is no panning or zooming. The grid's
  size in tiles is taken from the viewport **when a city is created** and
  then never changes; a later window of a different size scales the board
  to fit. That keeps a saved city identical whatever the window size.
- Each tile has exactly one **terrain** type. Some tiles also hold one
  **entity**. Rail sits on top of a tile.

### Terrain

| terrain  | buildable                        | rail                  |
| -------- | -------------------------------- | --------------------- |
| land     | yes                              | yes                   |
| water    | no                               | only through a tunnel |
| mountain | no                               | never                 |

Generation, from a seed, so a map can be reproduced:

- **Water** reads like a coastline or a river: big connected bodies with
  ragged edges, plus the odd river winding inland. *(proposed)* Low-frequency
  noise with a threshold makes the coast, and one or two random-walk rivers
  run downhill to it.
- **Mountains** form ranges: long, thin, connected ridges, not blobs.
  *(proposed)* Ridged noise, kept away from the coast.
- The map must always leave enough connected land to play on. *(proposed)*
  Regenerate if the largest land region is under 50% of tiles.

## Entities

Each entity takes up one tile, except where noted.

### Housing

- Comes in three sizes. Size equals population: **small = 1**, **medium = 2**,
  **large = 3**.
- Icons:
  - small: one house
  - medium: two houses, one overlapping the other
  - large: three houses, one overlapped by both of the others
- Only on land.

### Park

- Only on land.
- A bigger park gives a bigger citizen bonus.
- **Decided**: park tiles that touch merge into one park, and its size is
  the number of tiles in it. A citizen who can reach any tile of the park
  can reach the park. In game mode this is a built-in tradeoff, since a
  bigger park uses up more of the day's park tiles.

### Station

- Only on land.
- Rail can cross other rail only at a station.
- Its size is **derived, never placed**: it comes from how many citizens need
  the station to travel. It is purely visual: small / medium / large.
  *(proposed)* The thresholds scale with the map's total population, e.g. the
  top third of stations by traffic draw large.

### Tunnel

- Always placed as a **pair** of tiles.
- **Decided**: each end is a land tile next to water. The two ends can be
  anywhere on the map, at any distance, with no shape rule. In effect a
  tunnel is a link between two coasts.
- Rail that enters one end comes out of the other. A tunnel is the only way
  for rail to cross water.
- **Decided**: mountains are impassable. No tunnel goes through them; rail
  has to go around.

### Rail

- Joins tiles. It runs through tile centers to the edges, the way the current
  renderer draws lines.
- Allowed on land tiles, stations and tunnel ends. *(proposed)* Not on housing
  or parks.
- It cannot cross other rail except at a station. The request said this for
  game mode; *(proposed)* free play uses the same rule so that a layout
  carries over between modes.
- **Decided**: rail is one shared network, with no lines and no colors.
  Any two stations joined by rail can reach each other.
- **Decided**, input: by default you drag from one station to another and the
  route is chosen automatically. It respects terrain, tunnels and the
  no-crossing rule, and prefers straight runs and 60° bends. Holding a
  modifier key switches to painting rail tile by tile.

## Travel

"Adjacent" means the 6 hex neighbours of a tile.

A citizen can make a trip from home H to a destination D only if all of
these hold:

1. a station S1 is adjacent to H
2. a station S2 is adjacent to D
3. S1 and S2 are connected by rail (through tunnels and through other
   stations)

Destinations:

- **other citizens**: any housing other than the citizen's own
- **parks**

A citizen "needs" a station when that station is the S1 or S2 of one of the
citizen's trips. Station size is based on this count.

## Scoring

**Decided**: a static reachability score, recomputed whenever the board
changes:

```
score = Σ over each citizen c
          ( number of other citizens c can reach
          + Σ over each park c can reach: parkBonus(park size) )
```

Trains and dots moving along the rail are decoration: they show the
trips, but they do not affect the number.

**Decided**: `parkBonus` comes in flat tiers, counted in units of one
reachable citizen:

| park size | tiles | bonus |
| --------- | ----- | ----- |
| small     | 1–2   | 2     |
| medium    | 3–5   | 5     |
| large     | 6+    | 10    |

**Decided**: on top of its size bonus, a park is worth 1 more for every side
it shares with a mountain tile, summed over all of its tiles. A park tile
touching two mountains adds 2.

**Decided**: a trip where S1 = S2 counts. Housing and a park that share an
adjacent station can reach each other without riding any rail, so one
station on its own already scores for its neighbours.

## Modes

### Free play (first)

- Place or remove any entity, and draw or erase rail, with no limits.
- **Decided**, controls: a toolbar with a tool for each of housing, park,
  station, tunnel, rail and the terrain brushes. Left click (or drag)
  places. **Right click erases anything** under the cursor, whatever tool is
  selected.
  - *(proposed)* the housing tool has small / medium / large variants
  - *(proposed)* a tunnel is placed with two clicks, one per end; the
    second click is only allowed on a valid end
  - *(proposed)* right click on rail erases the run between the nearest
    stations or junctions, not just one tile
- The terrain comes from a seed, and you can reroll it. **Decided**: there are
  also terrain brushes for water, land and mountain. Painting terrain under an
  entity or rail that it makes invalid removes that entity or rail.
- A live score readout.
- *(proposed)* The city saves to localStorage, so it survives a reload.

### Idle (second)

- **Built** (`lib/map/sim.ts`, `useTownSim`): what a visitor sees with no
  input. It runs behind every page of the site, and full screen from Watch on
  the intro page.
- Every map starts with a town already on it (`growTown`).
- Every ~1.8s the town takes a step:
  - someone moves in, as a new cottage or an existing building grown a stage
  - or the planner catches up:
    1. a station for any unserved house
    2. rail joining separate networks, crossing existing rail with a station
       at each crossing when that's much shorter
    3. a tunnel across water, but only when rail can then actually use it
    4. failing all that, reshaping one water or mountain tile to land
    5. a park by a busy station
- It eases off once the town fills its share of the map, and rests while the
  tab is hidden.

### Game (third)

- **Built** (`lib/map/game.ts`, `useGame`), at `/play/game`. It reuses the fp
  page's toolbar, limited to park, station, tunnel, rail, eraser and select.
  Each budgeted tool shows how many are left as a white number in a
  terracotta circle.
- **Days** last 45s. A day starts from a breather, with the clock stopped,
  where you build and rearrange; "Start day ▸" or Enter starts it.
- **Arrivals:** during a day 4 + 2·day people arrive at odd intervals,
  scattered (spread 0.3), so they turn up in awkward places.
- **Allowance:** stations 3 + 2 a day, parks 1 a day, tunnels 1 plus one every
  other day. What's left is worked out from the board, so erasing or undoing
  refunds.
- **Target:** 90% of what a greedy planner (`lib/map/optimize.ts`) can score
  from bare land with the same people and allowance:
  - stations placed to cover the most people
  - everything joined by rail, with tunnels where needed
  - parks placed where they score most

  The target updates as people arrive, and the day is judged on the board it
  ends with. Reach it and you get the next breather; miss it and it's game
  over.
- **Catastrophes:** every other day, 35% of the way through, a flood or a
  landslide hits around the rail. It only remakes open ground, rail,
  mountains and water. Houses, stations, parks, tunnels and the water under
  tunnels are left alone, but any rail it lands on is gone. The breather
  before warns that one is due.
- **Game over:** a card with the final stats:
  - days survived
  - best score
  - people, and the share of them served
  - stations
  - rail
  - tunnels
  - parks
  - catastrophes

  From it you can share the result (the share sheet, or a copied line), play
  again or leave.

## Site integration

- **Decided**: a small "play" control near the nav. It slides the card off
  screen and shows the build toolbar and the score; Esc, or the control
  again, brings the card back. The idle town keeps running behind the card
  the rest of the time.
- *(proposed)* Desktop only for play; phones get idle mode only.

## Tech

- Replace `src/lib/hexwfc.js` with a typed module in `src/lib/map/`:
  - pure rules: terrain gen, placement checks, reachability, score
  - a canvas renderer
  - one input controller per mode

  The rules module has no DOM in it, so it can be unit tested.
- The current WFC tile set (straight, gentle, Y, …) becomes the way rail
  shapes are drawn, not the thing that generates the map.
