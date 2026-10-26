---
title: Making Basalt
date: 2026-10-25
description: Philosophy of Basalt, Why not Quartz, learnings of Basalt, and future
toc: true
---

![The Giant's Causeway: basalt columns, worn into hexagons, stepping down into the sea](/images/making-basalt-causeway.webp "The Giant's Causeway, ~60 million years old. Mine's a day old")

TL;DR: I ignored existing solutions and made my own markdown $\to$  static site generator overnight. Now, my solution is perfectly tailored to my needs and looks great. I should do this more often.

# Philosophy

Realistically, I could've stuck with [Quartz](https://quartz.jzhao.xyz), but I had a revelation yesterday that changed my mind. 

In the agent era, pain points should not be tolerated. As long as you have tokens, you should be able to tackle any computer problem, and if your problem can be well-defined: you can solve it. We're moving towards an era of perfectly personalized software, where if someone doesn't like you handled line spacing in the footer of your privacy policy, they will either fork your code or clean room it and make the fix themselves. We shouldn't wait for upstream contributors/frameworks to make our fixes for us.

Of course, personalized/handrolled *everything* comes at the tradeoff of tokens, and (if it's not an autonomous process), developer focus. In my current situation, I am nowhere close to a token throttle, leading to my next realization: I need to automate more. This is a separate discussion.

# Why not Quartz

Pros of Quartz:
- Quartz is <span title="Basalt is tested by one guy. It's me">battle-tested</span>
- I don't have to maintain Quartz to see improvements
- There's a lot of features unsupported by Basalt, like [giscus](https://giscus.app)[^aside]

[^aside]: Quartz is currently the hydrogen bomb and Basalt is the sad coughing baby

Cons of Quartz:
- No hot reloading/saving your scroll position[^caveat]
- Harder to make dynamic: its client code is inline scripts hanging off a global `nav` event, and every weird state bug I hit traced back to that
- I wanted remarks next to the line they're about, [Tufte](https://edwardtufte.github.io/tufte-css/) style, not in a footnote at the bottom

[^caveat]: Not to say that Quartz won't do this soon, and in fact they already have a branch in development for this. Basalt is cooked!

I also realized in hindsight that handrolling your own tight implementation keeps code terse and light. For instance, here's the code that essentially defines all of my music grid. The next tab shows the same code under Quartz v5. Both use the same three functions: `lean` tilts a cover toward the pointer, `rest` straightens it, `open` opens it on Spotify.

> [!tab] Basalt
> In Basalt, it's one component. The handlers sit on the tiles they belong to:
>
> ```tsx title="islands/music.tsx"
> export default function Music({ data }) {
>   return (
>     <div class="music-grid">
>       {data.albums.map((a) => (
>         <span
>           class="music-tile"
>           role="link"
>           tabIndex={0}
>           data-href={a.spotify}
>           onPointerMove={lean}
>           onPointerLeave={rest}
>           onClick={open}
>           onKeyDown={open}
>         >
>           <img src={a.cover} alt="" />
>         </span>
>       ))}
>     </div>
>   )
> }
> ```
>
> and a note puts it on the page:
>
> ```md title="notes/collections/music.md"
> <island name="music" data="music.json" ssr>
> </island>
> ```

> [!tab] Quartz v5
> In Quartz v5, it's two files. The markup is JSX too, but it only runs once, when the site is built, so an `onClick` here would never reach the browser:
>
> ```tsx title="plugins/music/src/components/Music.tsx"
> import albums from "./music.json"
> // @ts-expect-error: imported as a string
> import script from "./scripts/music.inline"
>
> export default (() => {
>   const Music: QuartzComponent = ({ fileData }) => {
>     if (fileData.slug !== "collections/music") return null
>     return (
>       <div class="music-grid">
>         {albums.map((a) => (
>           <span
>             class="music-tile"
>             role="link"
>             tabIndex={0}
>             data-href={a.spotify}
>           >
>             <img src={a.cover} alt="" />
>           </span>
>         ))}
>       </div>
>     )
>   }
>   Music.afterDOMLoaded = script
>   return Music
> }) satisfies QuartzComponentConstructor
> ```
>
> Everything that moves goes in a second file, which Quartz ships to the browser as a string. It runs after every page change, has to find the tiles again, wire them up, and unwire them before the next page change:
>
> ```ts title="plugins/music/src/components/scripts/music.inline.ts"
> // runs after every page change
> document.addEventListener("nav", () => {
>   const tiles =
>     document.querySelectorAll(".music-tile")
>   for (const tile of tiles) {
>     tile.addEventListener("pointermove", lean)
>     tile.addEventListener("pointerleave", rest)
>     tile.addEventListener("click", open)
>     tile.addEventListener("keydown", open)
>     // undone before the next page change
>     window.addCleanup(() => {
>       tile.removeEventListener("pointermove", lean)
>       tile.removeEventListener("pointerleave", rest)
>       tile.removeEventListener("click", open)
>       tile.removeEventListener("keydown", open)
>     })
>   }
> })
> ```
>
> and the config puts it on the page, every page:
>
> ```diff title="quartz.config.yaml" lang=yaml
>  plugins:
> +  - source: ./plugins/music
> +    enabled: true
> +    layout:
> +      position: afterBody
> ```

And here's where those files live. Each is a fresh site, with what the music grid adds marked:

> [!tab] Basalt
> ```tree title="basalt new my-site"
> my-site/
>   basalt.json           # the title, and where the notes are
>   basalt.config.ts      # optional: layout, theme, markdown plugins
>   .gitignore            # `.basalt/`, the build cache
>   notes/
>     index.md
>     about.md
>     + collections/
>       + music.md        # `<island name="music" data="music.json" ssr>`
>       + music.json      # the albums
>   islands/              # live components
>     counter.tsx
>     + music.tsx         # the grid, handlers and all
>   components/
>     README.md           # a file named like a Basalt component replaces it
>   styles/
>     custom.scss
>   .basalt/…             # build cache and output, gitignored
> ```
>
> Twelve files, all mine, and Basalt's gitignored cache. Basalt itself is the `basalt` command.

> [!tab] Quartz v5
> ```tree title="git clone quartz, quartz create"
> quartz/
>   ~ quartz.config.yaml  # made by `quartz create`: settings, plugins, layout
>   ~ quartz.lock.json    # pins 42 plugins
>   content/
>     index.md            # made by `quartz create`
>     + collections/
>       + music.md
>   + plugins/
>     + music/            # `npx quartz plugin add ./plugins/music`
>       + package.json
>       + src/
>         + index.ts
>         + components/
>           + Music.tsx
>           + music.json
>           + scripts/
>             + music.inline.ts
>   quartz/…              # Quartz itself, 132 files
>   docs/…                # Quartz's docs site, 127 files
>   … 22 more files and folders
> ```
>
> My files are `content/` and two configs, inside Quartz's ~290, and four gitignored folders. Updating Quartz (`npx quartz upgrade`) is a git merge into my repo.

TL;DR: Lots of overhead. But in reality, outside of the performance gains, I just wanted to make my website as "standard" as Quartz sites but also preserve the customization possible with <span title="Preact, technically. Same vibes, 3kB">React</span>. So I made [Basalt](https://basalt.isaacchacko.com), a static site generator alternative to Quartz. 

# Development

## Quartz fork

I first started by forking Quartz v4 and trying to apply my desired changes on top:

- Sidenotes and margin notes, each beside its line
- One full-screen viewer for every picture, diagram and page
- A PDF reader with selectable text
- Screenshots that follow the theme: put `shot.dark.png` beside `shot.png` and the page picks the right one
- Graphs and diagrams written as text
- [Islands](https://jasonformat.com/islands-architecture/), i.e. live components in a static page

It worked, and I moved this site onto it. But every feature meant fighting the global-script model, and I was patching the fork more than I was writing on it.

## Astro

The tipping point was when my agents tried to implement hot reloading and were struggling, which made me realize that it might be better to apply changes onto a hot reloading setup rather than applying hot reloading onto simple changes. So I rewrote it on [Astro](https://astro.build). 

The rewrite was mostly agents. One supervisor, a handful of workers (markdown, page shell, margin, media, dev loop, polish), each in its own worktree. The one rule that made it work: keep the old HTML markup exactly. If the classes and data attributes match, the old scripts and styles port nearly verbatim, and you can diff every page against the Quartz build.

First commit was <span title="On a Saturday night, like a normal person">1:46am</span>, it was on GitHub by 3:13am, and on npm by the morning.

Same page, before and after:

| | Quartz fork | Basalt on Astro |
|---|---|---|
| Save a note → see it | 0.94s | 0.21s, scroll kept |
| Edit an island | 1.82s, remounts | 0.02–0.23s, state kept |
| Edit the layout | 1.78s, full reload | ~0.15s, in place |
| Make an error | kills the server | page stays up, error at file:line:col |
| Page HTML | 134KB | 35KB |
| Initial JS | 188KB | 50KB |
| Cold build | 3.7s | 6.3s |

Against my fork the cold build got worse (Vite bundling), and everything else got a lot better.

Against Quartz v5 itself, on the same 110 notes (Quartz's own docs), medians on my laptop:

| | Quartz v5 | Basalt |
|---|---|---|
| Cold build | 10.2s | 4.35s |
| Warm build | 9.9s | 1.9s |
| First page load (gzip) | ~911KB | ~104KB |
| Save a note → see it | 491ms, full reload | 301ms, scroll kept |
| Main text visible (LCP) | 176ms | 960ms |

About 4s of Quartz's build is making share images, which Basalt doesn't do. The LCP row is Basalt's own fault: the page fades in on arrival, and with reduced motion on it's a tie.

Of the fork-vs-Basalt rows, the one I care about most is the error one. Basalt is built for agents too: the dev server tells you when a change is live and exactly what broke (`basalt wait`, `basalt status`, `basalt check`), so an agent editing your site doesn't have to guess.

# Deployment

The site is still one Vercel project: the build runs Basalt, drops the whole site into Next's `public/`, and Next only keeps the stuff that needs a server (at the moment, just Spotify).

# Reflection

This (overnight) sprint has taught me a lot.

- Background some agents with a well-defined goal and anything is possible.
- I learn virtually nothing except how to define a goal well. I have to try to squeeze more out of my experience if I am to learn something tangible.
- My biggest blocker to shipping more is my creativity.
- My opinion in [[#Philosophy|above]] still stands: we're going to move to a world where all software is personalized!
