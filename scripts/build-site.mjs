#!/usr/bin/env node
// Builds the site in garden/ with Basalt and copies it into public/, so that
// `next build` serves it: every page as /<slug>/index.html, which
// next.config.ts's fallback rewrites answer /<slug> with. The Next.js app keeps
// what the garden doesn't have: /api (spotify, the private library) and /play.
//
// `npm run build` runs it before `next build`. Basalt is
// github.com/isaacchacko/basalt at BASALT_SHA, cloned and installed into
// node_modules/.cache/basalt, or the checkout at $BASALT when that's set.
//
// The copy into public/ happens on Vercel (or with --into-public): locally the
// pages would land among public/'s tracked files, so a local `npm run build`
// only checks that the garden builds.
import { execFileSync } from "child_process"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const BASALT_SHA = "26a63a402d2cd921f8f1d8cf0a2925300f6ba16d"
const BASALT_REPO = "https://github.com/isaacchacko/basalt.git"

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const garden = path.join(root, "garden")
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: "inherit" })

function basalt() {
  if (process.env.BASALT) return process.env.BASALT
  const dir = path.join(root, "node_modules", ".cache", "basalt")
  const at = () => {
    try {
      return execFileSync("git", ["rev-parse", "HEAD"], { cwd: dir, encoding: "utf8" }).trim()
    } catch {
      return null
    }
  }
  if (at() !== BASALT_SHA) {
    fs.rmSync(dir, { recursive: true, force: true })
    fs.mkdirSync(dir, { recursive: true })
    run("git", ["init", "-q"], dir)
    run("git", ["fetch", "-q", "--depth", "1", BASALT_REPO, BASALT_SHA], dir)
    run("git", ["checkout", "-q", "FETCH_HEAD"], dir)
    run("npm", ["ci", "--no-audit", "--no-fund"], dir)
  }
  return dir
}

const cli = path.join(basalt(), "bin", "basalt.mjs")
run(process.execPath, [cli, "build", garden], root)

if (process.env.VERCEL || process.argv.includes("--into-public")) {
  const dist = path.join(garden, ".basalt", "astro", "dist")
  fs.cpSync(dist, path.join(root, "public"), { recursive: true, force: true })
  console.log(`build-site: the garden is in public/ (${fs.readdirSync(dist).length} entries)`)
}
