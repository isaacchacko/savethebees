// node extension/store.test.mjs
//
// store.js is an ES module but the package is not, so it is loaded from a data
// URL rather than renamed. It imports nothing, which is what makes that work.
//
// The markdown round-trip tests need a DOM and run in the browser instead —
// see the README.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "store.js"), "utf8");

// ── fake chrome.storage.local ────────────────────────────────────────────────
const store = {};
globalThis.chrome = {
  storage: {
    local: {
      async get(key) {
        const keys = typeof key === "string" ? [key] : Object.keys(key ?? store);
        return Object.fromEntries(keys.filter((k) => k in store).map((k) => [k, store[k]]));
      },
      async set(patch) {
        Object.assign(store, patch);
      },
    },
  },
};

// ── fake git repo behind the github git-data API ─────────────────────────────
const blobs = {};
const trees = { t0: {} };
const commits = { c0: { tree: "t0", parent: null } };
let head = "c0";
let n = 0;
const sha = (p) => `${p}${++n}`;
let onRead = null;
let staleFor = 0;
let staleSha = null;
let alwaysConflict = false;

const b64 = (t) => Buffer.from(t, "utf8").toString("base64");
const json = (status, body) => ({ ok: status < 300, status, statusText: "", json: async () => body });

globalThis.fetch = async (url, init = {}) => {
  // github sends `Cache-Control: private, max-age=60` on these. A cached branch
  // head is poison: the retry re-reads the same stale answer, so every attempt
  // builds on a parent that is no longer the tip.
  assert.equal(init.cache, "no-store", `request to ${url} must skip the http cache`);

  const path = url.replace("https://api.github.com", "");
  const body = init.body ? JSON.parse(init.body) : null;

  if (init.method === "POST" && path.endsWith("/git/blobs")) {
    const id = sha("b");
    blobs[id] = { base64: body.content };
    return json(201, { sha: id });
  }

  if (init.method === "POST" && path.endsWith("/git/trees")) {
    const next = { ...trees[body.base_tree] };
    for (const entry of body.tree) {
      if (entry.sha === null) {
        assert.ok(entry.path in next, `delete of a path that is not there: ${entry.path}`);
        delete next[entry.path];
      } else if (entry.content !== undefined) next[entry.path] = { text: entry.content };
      else next[entry.path] = blobs[entry.sha];
    }
    const id = sha("t");
    trees[id] = next;
    return json(201, { sha: id });
  }

  if (init.method === "POST" && path.endsWith("/git/commits")) {
    const id = sha("c");
    commits[id] = { tree: body.tree, parent: body.parents[0], message: body.message };
    return json(201, { sha: id });
  }

  if (init.method === "PATCH" && path.includes("/git/refs/heads/")) {
    assert.equal(body.force, false, "ref updates must never force");
    if (alwaysConflict) return json(422, { message: "not a fast forward" });
    if (commits[body.sha].parent !== head) return json(422, { message: "not a fast forward" });
    head = body.sha;
    return json(200, { object: { sha: head } });
  }

  if (path.includes("/git/ref/heads/")) {
    if (onRead) {
      const hook = onRead;
      onRead = null;
      hook();
    }
    if (staleFor > 0) {
      staleFor -= 1;
      return json(200, { object: { sha: staleSha } });
    }
    return json(200, { object: { sha: head } });
  }

  const commitMatch = path.match(/\/git\/commits\/(\w+)$/);
  if (commitMatch) return json(200, { tree: { sha: commits[commitMatch[1]].tree } });

  const contents = path.match(/\/contents\/([^?]+)\?ref=(\w+)/);
  if (contents) {
    const wanted = decodeURIComponent(contents[1]);
    const tree = trees[commits[contents[2]].tree];
    if (wanted === "content/learnings") {
      return json(200, Object.keys(tree)
        .filter((p) => p.startsWith("content/learnings/"))
        .map((p) => ({ type: "file", name: p.split("/").pop() })));
    }
    if (!tree[wanted]) return json(404, { message: "Not Found" });
    return json(200, { content: b64(tree[wanted].text), sha: "x" });
  }

  throw new Error(`unhandled ${init.method || "GET"} ${path}`);
};

const {
  fetchCool, mutate, setConfig, addList, addItem, updateItem, removeItem,
  removeList, moveItem, shotPath, shotRemovals, readFile, saveFiles, listDir,
} = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));

await setConfig({ token: "t" });
const readJson = () => JSON.parse(trees[commits[head].tree]["content/cool.json"].text);
const paths = () => Object.keys(trees[commits[head].tree]).sort();

// a missing file reads as empty, and the first commit creates it
assert.deepEqual((await fetchCool()).data, { lists: [] });
await mutate("add list", (d) => addList(d, "cool webrings"));
assert.equal(readJson().lists[0].id, "cool-webrings");

// slugs stay unique
await mutate("dupe", (d) => addList(d, "Cool Webrings!"));
assert.deepEqual(readJson().lists.map((l) => l.id), ["cool-webrings", "cool-webrings-2"]);

// an entry and its screenshot land in ONE commit
const before = head;
const shot = { base64: b64("fake-webp-bytes"), width: 640, height: 400, bytes: 15 };
await mutate("add with shot", (d, files) => {
  const id = addItem(d, "cool-webrings", { title: "ドーナツ — café ☕", url: "https://a.example/ü" }, shot);
  files.push({ path: shotPath(id), base64: shot.base64 });
});
assert.equal(commits[head].parent, before, "exactly one commit");
const item = readJson().lists[0].items[0];
assert.equal(item.title, "ドーナツ — café ☕", "unicode survives the round trip");
assert.equal(item.shot, `/cool-shots/${item.id}.webp`);
assert.deepEqual(paths(), ["content/cool.json", `public/cool-shots/${item.id}.webp`]);

// no screenshot and no label means no such fields at all
await mutate("plain", (d) => addItem(d, "cool-webrings", { title: "plain" }));
assert.equal("shot" in readJson().lists[0].items[0], false);
assert.equal("label" in readJson().lists[0].items[0], false);

// a label rides along, and clearing it removes the field
await mutate("labelled", (d) =>
  addItem(d, "cool-webrings", { title: "Lucas Jin — Software Engineer", label: "lucas" }));
const labelled = readJson().lists[0].items[0];
assert.equal(labelled.label, "lucas");
await mutate("unlabel", (d) => updateItem(d, "cool-webrings", labelled.id, { label: "", note: "kept" }));
const unlabelled = readJson().lists[0].items.find((i) => i.id === labelled.id);
assert.equal("label" in unlabelled, false, 'a blank label must not linger as ""');
assert.equal(unlabelled.note, "kept");

// moving keeps the id, so the screenshot it points at stays put
await mutate("target", (d) => addList(d, "movable"));
await mutate("move it", (d) => moveItem(d, "cool-webrings", item.id, "movable"));
const moved = readJson().lists.find((l) => l.id === "movable").items[0];
assert.equal(moved.id, item.id, "same id, so the shot path still resolves");
assert.ok(paths().includes(shotPath(item.id)), "the screenshot blob must not be touched");

// deleting an entry takes its screenshot with it
await mutate("rm", (d, files) => files.push(...shotRemovals([removeItem(d, "movable", item.id)])));
assert.equal(paths().includes(shotPath(item.id)), false, "orphan screenshot must not linger");

// a stale branch head (github's 60s max-age) must recover, not dead-end
staleSha = head;
await mutate("first", (d) => addItem(d, "cool-webrings", { title: "one" }));
staleFor = 1;
await mutate("second", (d) => addItem(d, "cool-webrings", { title: "two" }));
assert.equal(readJson().lists[0].items[0].title, "two", "a stale head must not lose the save");
assert.equal(readJson().lists[0].items[1].title, "one", "nor the one before it");

// a commit landing between our read and our ref update is retried, not clobbered
onRead = () => {
  const t = sha("t");
  trees[t] = { ...trees[commits[head].tree], "unrelated.txt": { text: "from elsewhere" } };
  const c = sha("c");
  commits[c] = { tree: t, parent: head };
  head = c;
};
await mutate("racy", (d) => addItem(d, "cool-webrings", { title: "kept" }));
assert.ok(paths().includes("unrelated.txt"), "the outside commit must survive");
assert.equal(readJson().lists[0].items[0].title, "kept", "and so must ours");

// the admin view's plain-file path
await saveFiles("admin: edit about.md", [{ path: "content/pages/about.md", text: "# about\n" }]);
assert.equal((await readFile("content/pages/about.md")).text, "# about\n");
await saveFiles("add a write-up", [{ path: "content/learnings/x.md", text: "# x\n" }]);
assert.deepEqual(await listDir("content/learnings"), ["x.md"]);
assert.equal((await readFile("content/pages/missing.md")).missing, true);

// a conflict that never clears gives up instead of looping forever
alwaysConflict = true;
await assert.rejects(mutate("doomed", (d) => addItem(d, "cool-webrings", { title: "no" })), /changed while saving/);
await assert.rejects(saveFiles("doomed", [{ path: "a.md", text: "x" }]), /changed while saving/);
alwaysConflict = false;

// a missing list is a clear error, not a crash
assert.throws(() => addItem({ lists: [] }, "ghost", { title: "y" }), /no list "ghost"/);
assert.throws(() => removeList({ lists: [] }, "ghost"), /no list "ghost"/);

console.log("all store.js assertions passed");
