// Where Basalt's CLI is: the checkout at $BASALT when that's set, else
// @isaacchacko/basalt's newest release from npm, installed apart from Next's
// dependencies into node_modules/.cache/basalt (and again once there's a newer).
import { execFileSync } from "child_process"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

export const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")

export function basaltCli() {
  if (process.env.BASALT) return path.join(process.env.BASALT, "bin", "basalt.mjs")
  const prefix = path.join(root, "node_modules", ".cache", "basalt")
  const pkg = path.join(prefix, "node_modules", "@isaacchacko", "basalt")
  let have = null
  try {
    have = JSON.parse(fs.readFileSync(path.join(pkg, "package.json"), "utf8")).version
  } catch {}
  let newest = have
  try {
    newest = execFileSync("npm", ["view", "@isaacchacko/basalt", "version", "--prefer-online"], { encoding: "utf8" }).trim()
  } catch (err) {
    // offline: whatever's installed, if anything is
    if (!have) throw err
  }
  if (have !== newest) {
    fs.rmSync(prefix, { recursive: true, force: true })
    fs.mkdirSync(prefix, { recursive: true })
    execFileSync("npm", ["install", "--prefix", prefix, "--no-save", "--no-audit", "--no-fund", `@isaacchacko/basalt@${newest}`], { cwd: root, stdio: "inherit" })
  }
  return path.join(pkg, "bin", "basalt.mjs")
}
