#!/usr/bin/env node
// Builds the site in garden/ with Basalt, the Quartz fork it's written for:
//
//   npm run garden                 build to garden/.basalt/public
//   npm run garden -- --serve      and serve it on http://localhost:8080
//
// Basalt is a checkout of its own, at $BASALT or ~/Programs/basalt.
import { spawnSync } from "child_process"
import fs from "fs"
import os from "os"
import path from "path"
import { fileURLToPath } from "url"

const basalt = process.env.BASALT ?? path.join(os.homedir(), "Programs", "basalt")
const site = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "garden")
if (!fs.existsSync(path.join(basalt, "quartz", "bootstrap-cli.mjs"))) {
  console.error(`no basalt checkout at ${basalt} (set BASALT to where it is)`)
  process.exit(1)
}
const { status } = spawnSync(
  process.execPath,
  ["./quartz/bootstrap-cli.mjs", "build", "--site", site, ...process.argv.slice(2)],
  { cwd: basalt, stdio: "inherit" },
)
process.exit(status ?? 1)
