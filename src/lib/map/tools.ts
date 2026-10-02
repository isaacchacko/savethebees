// Everything free play lets you put on the map, in toolbar order, with the
// words the toolbar shows for each. The rules themselves live in the spec
// (docs/map-spec.md); these are the player-facing version of them.

export type ToolId =
  | 'house'
  | 'park'
  | 'station'
  | 'tunnel'
  | 'rail'
  | 'land'
  | 'water'
  | 'mountain'
  | 'erase';

export type Tool = {
  id: ToolId;
  name: string;
  /** Builds sit on the terrain; brushes change it; the eraser undoes. The toolbar splits them. */
  group: 'build' | 'terrain' | 'erase';
  /** The keyboard shortcut that picks it: the first letter of its name, shown as [h]ousing. */
  key: string;
  place: string;
  score: string;
};

export const TOOLS: Tool[] = [
  {
    id: 'house',
    key: 'h',
    name: 'housing',
    group: 'build',
    place:
      'put one on any empty land. click a house again to grow it: one house, then two, then three.',
    score:
      'a house holds as many people as it has houses. each person scores a point for every other person they can reach, so a house by a station is worth the most.',
  },
  {
    id: 'park',
    key: 'p',
    name: 'park',
    group: 'build',
    place: 'put one on any empty land. parks that touch join into one bigger park.',
    score:
      'everyone who can reach a park scores for it: 2 for a small park (1–2 tiles), 5 for a medium one (3–5), 10 for a large one (6 or more), plus 1 for every side it shares with a mountain.',
  },
  {
    id: 'station',
    key: 's',
    name: 'station',
    group: 'build',
    place: 'put one on any empty land. rail can only cross other rail at a station.',
    score:
      'people get on at a station next to home and off at a station next to where they’re going. no station nearby, no trips. a station grows as more people rely on it.',
  },
  {
    id: 'tunnel',
    key: 't',
    name: 'tunnel',
    group: 'build',
    place:
      'comes in pairs. put one end on land touching water, then the other end on any other shore, as far away as you like.',
    score:
      'rail that goes in one end comes out the other. it’s the only way across water, so it can join two coasts into one network.',
  },
  {
    id: 'rail',
    key: 'r',
    name: 'rail',
    group: 'build',
    place:
      'drag from one station to another and the route is drawn for you; hold shift to paint it tile by tile. not on water, mountains, houses or parks.',
    score:
      'stations joined by rail can reach each other, and so can everyone living next to them. one network is worth more than two.',
  },
  {
    id: 'land',
    key: 'l',
    name: 'land',
    group: 'terrain',
    place: 'paint over any tile. whatever was there is cleared away.',
    score: 'everything is built on land. more open land is more room for houses, parks and stations.',
  },
  {
    id: 'water',
    key: 'w',
    name: 'water',
    group: 'terrain',
    place: 'paint over any tile. anything that can’t sit in water is cleared away.',
    score: 'nothing crosses water but a tunnel, so a river splits your town until you link it up.',
  },
  {
    id: 'mountain',
    key: 'm',
    name: 'mountain',
    group: 'terrain',
    place: 'paint over any tile. anything that can’t sit on a mountain is cleared away.',
    score: 'nothing crosses a mountain, not even a tunnel. it scores nothing itself; it walls routes off.',
  },
  {
    id: 'erase',
    key: 'e',
    name: 'eraser',
    group: 'erase',
    place:
      'click or drag over anything to clear it: a building first, then the rail under it. a tunnel takes both ends with it. right click erases with any tool.',
    score: 'takes back whatever was there, and whatever it was worth.',
  },
];
