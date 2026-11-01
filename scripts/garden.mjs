#!/usr/bin/env node
// Builds or serves the site in garden/ with Basalt (github.com/isaacchacko/basalt):
//
//   npm run garden                     serve it, live, on http://localhost:4322
//   npm run garden -- build            build it to garden/.basalt/astro/dist
//   npm run garden -- check            build it and list what's broken
//
// Basalt is its newest release, or the checkout at $BASALT (scripts/basalt.mjs).
import { spawnSync } from "child_process"
import path from "path"
import { basaltCli, root } from "./basalt.mjs"

const cli = basaltCli()
const site = path.join(root, "garden")
const [command = "dev", ...rest] = process.argv.slice(2)
const args = command === "dev" && !rest.includes("--port") ? ["--port", "4322", ...rest] : rest
const { status } = spawnSync(process.execPath, [cli, command, site, ...args], { stdio: "inherit" })
process.exit(status ?? 1)
