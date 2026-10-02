// Everything free play lets you put on the map, in toolbar order, with the
// words the toolbar shows for each. The rules themselves live in the spec
// (docs/map-spec.md); these are the player-facing version of them.

export type ToolId = 'house' | 'park' | 'station' | 'tunnel' | 'track' | 'land' | 'water' | 'mountain';

export type Tool = {
  id: ToolId;
  name: string;
  /** Builds sit on the terrain; brushes change it. The toolbar splits them. */
  group: 'build' | 'terrain';
  place: string;
  score: string;
};

export const TOOLS: Tool[] = [
  {
    id: 'house',
    name: 'house',
    group: 'build',
    place:
      'put one on any empty land. click a house again to grow it: one house, then two, then three.',
    score:
      'a house holds as many people as it has houses. each person scores a point for every other person they can reach, so a house by a station is worth the most.',
  },
  {
    id: 'park',
    name: 'park',
    group: 'build',
    place: 'put one on any empty land. parks that touch join into one bigger park.',
    score:
      'everyone who can reach a park scores for it: 2 for a small park (1–2 tiles), 5 for a medium one (3–5), 10 for a large one (6 or more).',
  },
  {
    id: 'station',
    name: 'station',
    group: 'build',
    place: 'put one on any empty land. track can only cross other track at a station.',
    score:
      'people get on at a station next to home and off at a station next to where they’re going. no station nearby, no trips. a station grows as more people rely on it.',
  },
  {
    id: 'tunnel',
    name: 'tunnel',
    group: 'build',
    place:
      'comes in pairs. put one end on land touching water, then the other end on any other shore, as far away as you like.',
    score:
      'track that goes in one end comes out the other. it’s the only way across water, so it can join two coasts into one network.',
  },
  {
    id: 'track',
    name: 'track',
    group: 'build',
    place:
      'drag from one station to another and the route is drawn for you; hold shift to paint it tile by tile. not on water, mountains, houses or parks.',
    score:
      'stations joined by track can reach each other, and so can everyone living next to them. one network is worth more than two.',
  },
  {
    id: 'land',
    name: 'land',
    group: 'terrain',
    place: 'paint over any tile. whatever was there is cleared away.',
    score: 'everything is built on land. more open land is more room for houses, parks and stations.',
  },
  {
    id: 'water',
    name: 'water',
    group: 'terrain',
    place: 'paint over any tile. anything that can’t sit in water is cleared away.',
    score: 'nothing crosses water but a tunnel, so a river splits your town until you link it up.',
  },
  {
    id: 'mountain',
    name: 'mountain',
    group: 'terrain',
    place: 'paint over any tile. anything that can’t sit on a mountain is cleared away.',
    score: 'nothing crosses a mountain, not even a tunnel. it scores nothing itself; it walls routes off.',
  },
];
