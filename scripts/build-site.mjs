#!/usr/bin/env node
// Builds the site in garden/ with Basalt and copies it into public/, so that
// `next build` serves it: every page as /<slug>/index.html, which
// next.config.ts's fallback rewrites answer /<slug> with. The Next.js app keeps
// what the garden doesn't have: /api (spotify, the private library) and /play.
//
// `npm run build` runs it before `next build`, with Basalt's newest release
// (scripts/basalt.mjs), or the checkout at $BASALT when that's set.
//
// The copy into public/ happens on Vercel (or with --into-public): locally the
// pages would land among public/'s tracked files, so a local `npm run build`
// only checks that the garden builds.
import { execFileSync } from "child_process"
import fs from "fs"
import path from "path"
import { basaltCli, root } from "./basalt.mjs"

const garden = path.join(root, "garden")
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: "inherit" })

const cli = basaltCli()
run(process.execPath, [cli, "build", garden], root)

if (process.env.VERCEL || process.argv.includes("--into-public")) {
  const dist = path.join(garden, ".basalt", "astro", "dist")
  fs.cpSync(dist, path.join(root, "public"), { recursive: true, force: true })
  console.log(`build-site: the garden is in public/ (${fs.readdirSync(dist).length} entries)`)
}
