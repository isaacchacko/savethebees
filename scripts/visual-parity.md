# Visual parity check

Confirms a refactor changed no pixels. Used when about/now/running moved from
hardcoded JSX to `content/pages/*.md`; every one of the five pages came back at
zero differing pixels.

## Why a plain screenshot diff lies

Four things on these pages change on their own, and each one produces a false
difference:

- the palette rotates every 5 minutes off the wall clock (`src/lib/themes.ts`)
- the SF clock in the titlebar ticks every second
- the prompt cursor blinks
- a theme change fades over 600ms, so a capture can land mid-transition

`parity-freeze.js` pins all four. Run it in the page before every capture.

## Procedure

1. `npm run dev`, and set the browser window once. Do not resize it again —
   before and after must be the same size or the images cannot be compared.
2. For each page: load it, run `parity-freeze.js`, screenshot to `before/`.
3. Apply the change. **Restart the dev server** — turbopack serves stale CSS
   after a file swap, which shows up as a spurious diff. Confirm the rule is
   live by reading it back with `getComputedStyle` before trusting a capture.
4. Capture the same pages to `after/`.
5. Compare. Zero is the only passing result:

```sh
magick compare -metric AE before/about.jpg after/about.jpg null:
```

## Finding where a diff is

`AE` gives a count, not a location. To find the rows that differ:

```sh
magick before/p.jpg after/p.jpg -compose difference -composite -colorspace Gray \
  -scale 1x840! -depth 8 txt:- | sed -n 's/^0,\([0-9]*\): (\([0-9]*\).*/\1 \2/p' \
  | awk '$2 > 2 {print $1}'
```

## A sharper instrument

Pixel counts are coarse and JPEG muddies small differences. For layout, compare
where every text run renders instead — structure-agnostic and sub-pixel, so it
survives markup changes like an added wrapper or `<strong>`:

```js
const w = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
const out = []; let n;
while ((n = w.nextNode())) {
  const t = n.textContent.replace(/\s+/g, ' ').trim();
  if (!t) continue;
  const r = document.createRange();
  r.selectNodeContents(n);
  const b = r.getBoundingClientRect();
  out.push(`${Math.round(b.x)},${Math.round(b.y)},${Math.round(b.width)},${Math.round(b.height)} ${t.slice(0, 28)}`);
}
out.join('\n');
```

Expect text-node *widths* to shift next to links: JSX puts the space in its own
node, markdown folds it into the neighbour. The x/y of every run still matches,
which is what the eye sees.
