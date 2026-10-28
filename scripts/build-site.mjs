#!/usr/bin/env node
// Builds the site in garden/ with Basalt and copies it into public/, so that
// `next build` serves it: every page as /<slug>/index.html, which
// next.config.ts's fallback rewrites answer /<slug> with. The Next.js app keeps
// what the garden doesn't have: /api (spotify, the private library) and /play.
//
// `npm run build` runs it before `next build`. Basalt is @isaacchacko/basalt at
// BASALT_VERSION from npm, installed apart from Next's dependencies into
// node_modules/.cache/basalt, or the checkout at $BASALT when that's set.
//
// The copy into public/ happens on Vercel (or with --into-public): locally the
// pages would land among public/'s tracked files, so a local `npm run build`
// only checks that the garden builds.
import { execFileSync } from "child_process"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const BASALT_VERSION = "0.1.9"

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const garden = path.join(root, "garden")
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: "inherit" })

function basalt() {
  if (process.env.BASALT) return process.env.BASALT
  const prefix = path.join(root, "node_modules", ".cache", "basalt")
  const pkg = path.join(prefix, "node_modules", "@isaacchacko", "basalt")
  const at = () => {
    try {
      return JSON.parse(fs.readFileSync(path.join(pkg, "package.json"), "utf8")).version
    } catch {
      return null
    }
  }
  if (at() !== BASALT_VERSION) {
    fs.rmSync(prefix, { recursive: true, force: true })
    fs.mkdirSync(prefix, { recursive: true })
    run("npm", ["install", "--prefix", prefix, "--no-save", "--no-audit", "--no-fund", `@isaacchacko/basalt@${BASALT_VERSION}`], root)
  }
  return pkg
}

const cli = path.join(basalt(), "bin", "basalt.mjs")
run(process.execPath, [cli, "build", garden], root)

if (process.env.VERCEL || process.argv.includes("--into-public")) {
  const dist = path.join(garden, ".basalt", "astro", "dist")
  fs.cpSync(dist, path.join(root, "public"), { recursive: true, force: true })
  console.log(`build-site: the garden is in public/ (${fs.readdirSync(dist).length} entries)`)
}
