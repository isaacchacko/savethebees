# the garden

isaacchacko.com as a [Basalt](~/Programs/basalt) site. Basalt is a fork of [Quartz](https://quartz.jzhao.xyz) that is better at embedded content. It follows the look of the `redesign-site-jzhao-garde-3cd1645c` branch.

```sh
npm run garden -- --serve   # http://localhost:8080
npm run garden              # build to garden/.basalt/public
```

| path | what it is |
| --- | --- |
| `basalt.json` | where the notes come from: `notes/` here, plus `content/pages`, `content/dumps` (as `blog/`), `content/cool.json` and `public/`, which the chrome extension and the next.js site use. Nothing is copied, so the extension's edits show up on the next build |
| `quartz.config.ts`, `quartz.layout.ts` | the site's Quartz config and layout: the garden's palette and fonts, explorer, search, and isaacchacko/graph's graph view |
| `notes/` | the pages only the garden has: home, arch, library, the blog's index |
| `islands/` | the interactive bits, in preact: the surf behind the home page (a webgl dither of `notes/assets/waves.mp4` in the theme's colours), the sf clock (a quiet lowercase line), now playing (from the live site's api), the copy button, and the library, which is rendered at build time from cool.json and gets a filter in the browser |
| `plugins/notes.ts` | a page's leading `# title` becomes its title; `private: true` keeps a dump off the site |
| `styles/custom.scss` | the garden's colours in Basalt's look (Fraunces, hexagons, the arrival motion), on Quartz's markup |

The next.js site, its api routes and the game at `/play` are untouched. The garden doesn't include the game.
