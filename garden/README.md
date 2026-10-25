# the garden

isaacchacko.com as a [Basalt](https://github.com/isaacchacko/basalt) site (a checkout at `~/Programs/basalt-astro`). It follows the look of the `redesign-site-jzhao-garde-3cd1645c` branch.

```sh
npm run garden              # serve it, live, on http://localhost:4322
npm run garden -- build     # build to garden/.basalt/astro/dist
```

| path | what it is |
| --- | --- |
| `basalt.json` | where the notes come from: `notes/` here, plus `content/pages`, `content/dumps` (as `blog/`), `content/cool.json` and `public/`, which the chrome extension and the next.js site use. Nothing is copied, so the extension's edits show up on the next build |
| `basalt.config.ts` | a page's leading `# title` becomes its title |
| `notes/` | the pages only the garden has: home, arch, library, the blog's index |
| `islands/` | the interactive bits, in preact: the surf behind every page (a webgl dither of `notes/assets/waves.mp4` in the theme's colours), the time in sf (a line under the home page's title), now playing (from the live site's api), and the library, which is rendered at build time from cool.json |
| `styles/custom.scss` | the garden's look on top of Basalt's |

The next.js site, its api routes and the game at `/play` are untouched. The garden doesn't include the game.
