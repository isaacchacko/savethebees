#!/usr/bin/env node
// Builds or serves the site in garden/ with Basalt (github.com/isaacchacko/basalt):
//
//   npm run garden                     serve it, live, on http://localhost:4322
//   npm run garden -- build            build it to garden/.basalt/astro/dist
//   npm run garden -- check            build it and list what's broken
//   npm run garden -- edit <file>      serve it, and say where <file>'s page is and what edits it
//   npm run garden -- help [topic]     Basalt's docs ("agents", "editing", ...)
//
// Basalt is a checkout of its own, at $BASALT or ~/Programs/basalt-astro.
import { spawnSync } from "child_process"
import fs from "fs"
import os from "os"
import path from "path"
import { fileURLToPath } from "url"

const basalt = process.env.BASALT ?? path.join(os.homedir(), "Programs", "basalt-astro")
const cli = path.join(basalt, "bin", "basalt.mjs")
const site = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "garden")
if (!fs.existsSync(cli)) {
  console.error(`no basalt checkout at ${basalt} (set BASALT to where it is)`)
  process.exit(1)
}
const [command = "dev", ...rest] = process.argv.slice(2)
const args = ["dev", "edit"].includes(command) && !rest.includes("--port") ? ["--port", "4322", ...rest] : rest
const { status } = spawnSync(process.execPath, [cli, command, ...(command === "help" ? [] : [site]), ...args], { stdio: "inherit" })
process.exit(status ?? 1)
