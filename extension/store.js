// The single source of truth is content/cool.json on GitHub. Every mutation is
// a read-modify-write commit, which Vercel picks up and rebuilds /cool from.
//
// Commits go through the git data API rather than the contents API because an
// entry and its screenshot have to land together: two commits would mean two
// builds, and a half-applied pair in between.

const CONFIG_DEFAULTS = {
  owner: "isaacchacko",
  repo: "savethebees",
  branch: "main",
  filePath: "content/cool.json",
  token: "",
};

const CACHE_KEY = "cool";
const SHOT_DIR = "public/cool-shots";

export async function getConfig() {
  const { config } = await chrome.storage.local.get("config");
  return { ...CONFIG_DEFAULTS, ...(config || {}) };
}

export async function setConfig(patch) {
  const config = { ...(await getConfig()), ...patch };
  await chrome.storage.local.set({ config });
  return config;
}

// The last data we saw, kept so the popup and the context menus can render
// before the network answers.
export async function getCached() {
  const stored = await chrome.storage.local.get(CACHE_KEY);
  return stored[CACHE_KEY] || null;
}

async function setCached(data, head) {
  await chrome.storage.local.set({ [CACHE_KEY]: { data, head } });
}

function encodeBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeBase64(base64) {
  const binary = atob(base64.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function github(config, path, init) {
  if (!config.token) {
    throw new Error("no github token — open the extension options");
  }
  return fetch(`https://api.github.com${path}`, {
    ...init,
    // github answers with `Cache-Control: private, max-age=60`, so without this
    // chrome serves a minute-old branch head back to us — and a commit built on
    // a stale parent is rejected as a non-fast-forward. That reads exactly like
    // someone else committing, except retrying cannot help, because the retry
    // re-reads the same cached answer. Two saves inside a minute is normal use,
    // so the reads have to skip the http cache.
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers || {}),
    },
  });
}

async function explain(response) {
  const body = await response.json().catch(() => null);
  const detail = body?.message || response.statusText;
  if (response.status === 401) return "github rejected the token (401)";
  if (response.status === 403) return `github refused: ${detail} (403)`;
  if (response.status === 404) {
    return "repo or branch not found — check the options, and that the token can see this repo (404)";
  }
  return `github: ${detail} (${response.status})`;
}

function repoPath(config, suffix) {
  return `/repos/${config.owner}/${config.repo}${suffix}`;
}

/** POST/PATCH helper: returns the parsed body, or the response when it failed. */
async function send(config, path, method, payload) {
  const response = await github(config, path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) return { failed: response };
  return { body: await response.json() };
}

async function getHead(config) {
  const response = await github(
    config,
    repoPath(config, `/git/ref/heads/${config.branch}`)
  );
  if (!response.ok) throw new Error(await explain(response));
  return (await response.json()).object.sha;
}

async function readCool(config, ref) {
  const response = await github(
    config,
    `${repoPath(config, `/contents/${config.filePath}`)}?ref=${ref}`
  );

  // The file does not exist yet; the first commit will create it.
  if (response.status === 404) return { lists: [] };
  if (!response.ok) throw new Error(await explain(response));

  const body = await response.json();
  if (!body.content) {
    throw new Error("cool.json is too large for the contents API");
  }

  let data;
  try {
    data = JSON.parse(decodeBase64(body.content));
  } catch {
    throw new Error("cool.json on github is not valid JSON — fix it by hand");
  }
  return Array.isArray(data.lists) ? data : { lists: [] };
}

export async function fetchCool() {
  const config = await getConfig();
  const head = await getHead(config);
  const data = await readCool(config, head);
  await setCached(data, head);
  return { data, head };
}

/**
 * Build one commit containing every file, on top of `head`. The ref update is
 * not forced, so a commit that landed since we read `head` makes this a
 * non-fast-forward and github rejects it — which is the conflict signal.
 * Returns the new commit sha, or null when it needs another try.
 */
async function commitFiles(config, head, files, message) {
  const headCommit = await github(config, repoPath(config, `/git/commits/${head}`));
  if (!headCommit.ok) throw new Error(await explain(headCommit));
  const baseTree = (await headCommit.json()).tree.sha;

  const tree = [];
  for (const file of files) {
    const entry = { path: file.path, mode: "100644", type: "blob" };
    if (file.remove) {
      tree.push({ ...entry, sha: null });
    } else if (file.text !== undefined) {
      tree.push({ ...entry, content: file.text });
    } else {
      const blob = await send(config, repoPath(config, "/git/blobs"), "POST", {
        content: file.base64,
        encoding: "base64",
      });
      if (blob.failed) throw new Error(await explain(blob.failed));
      tree.push({ ...entry, sha: blob.body.sha });
    }
  }

  const newTree = await send(config, repoPath(config, "/git/trees"), "POST", {
    base_tree: baseTree,
    tree,
  });
  if (newTree.failed) throw new Error(await explain(newTree.failed));

  const commit = await send(config, repoPath(config, "/git/commits"), "POST", {
    message,
    tree: newTree.body.sha,
    parents: [head],
  });
  if (commit.failed) throw new Error(await explain(commit.failed));

  const ref = await send(
    config,
    repoPath(config, `/git/refs/heads/${config.branch}`),
    "PATCH",
    { sha: commit.body.sha, force: false }
  );
  if (ref.failed) {
    if (ref.failed.status === 422 || ref.failed.status === 409) return null;
    throw new Error(await explain(ref.failed));
  }
  return commit.body.sha;
}

/**
 * Read cool.json, hand it to `apply`, and commit what comes back. `apply` gets
 * a `files` array it can push extra blobs onto — `{path, base64}` to write one,
 * `{path, remove: true}` to drop one — so a screenshot rides along in the same
 * commit as the entry that points at it.
 */
export async function mutate(message, apply) {
  const config = await getConfig();

  // A few tries with a short backoff: a real conflict clears as soon as we read
  // the ref the other commit left behind, and github's own replication can lag
  // a write by a beat.
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt) await new Promise((done) => setTimeout(done, 250 * attempt));
    const { data, head } = await fetchCool();
    const next = structuredClone(data);
    const files = [];
    apply(next, files);

    const sha = await commitFiles(
      config,
      head,
      [{ path: config.filePath, text: `${JSON.stringify(next, null, 2)}\n` }, ...files],
      message
    );
    if (sha) {
      await setCached(next, sha);
      return next;
    }
  }

  throw new Error("cool.json changed while saving — try again");
}

// ──────────────────────────────  pure helpers  ──────────────────────────────

export function shotPath(id) {
  return `${SHOT_DIR}/${id}.webp`;
}

/** The public/ prefix is how it is stored; the site serves it without one. */
function shotUrl(id) {
  return `/${SHOT_DIR.replace(/^public\//, "")}/${id}.webp`;
}

function slugify(text) {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "list"
  );
}

function uniqueId(taken, base) {
  const slug = slugify(base);
  if (!taken.includes(slug)) return slug;
  let n = 2;
  while (taken.includes(`${slug}-${n}`)) n += 1;
  return `${slug}-${n}`;
}

function findList(data, listId) {
  const list = data.lists.find((candidate) => candidate.id === listId);
  if (!list) throw new Error(`no list "${listId}"`);
  return list;
}

export function addList(data, title, description = "") {
  const id = uniqueId(data.lists.map((list) => list.id), title);
  data.lists.push({ id, title: title.trim(), description, items: [] });
  return id;
}

export function updateList(data, listId, patch) {
  Object.assign(findList(data, listId), patch);
}

/** Returns the removed list so the caller can clean up its screenshots. */
export function removeList(data, listId) {
  const list = findList(data, listId);
  data.lists = data.lists.filter((candidate) => candidate.id !== listId);
  return list;
}

/** `shot` is {base64, width, height} from shot.js, or null for no screenshot. */
export function addItem(data, listId, item, shot = null) {
  const id = crypto.randomUUID();
  const label = (item.label || "").trim();
  findList(data, listId).items.unshift({
    id,
    title: item.title.trim(),
    // only when it differs from the title — an entry that reads fine as-is
    // should not carry a redundant field
    ...(label ? { label } : {}),
    url: (item.url || "").trim(),
    note: (item.note || "").trim(),
    added: new Date().toISOString().slice(0, 10),
    ...(shot ? { shot: shotUrl(id), shotW: shot.width, shotH: shot.height } : {}),
  });
  return id;
}

export function updateItem(data, listId, itemId, patch) {
  const list = findList(data, listId);
  const item = list.items.find((candidate) => candidate.id === itemId);
  if (!item) throw new Error("that entry is gone");
  Object.assign(item, patch);
  if (!item.label) delete item.label;
}

/** Returns the removed entry so the caller can drop its screenshot too. */
export function removeItem(data, listId, itemId) {
  const list = findList(data, listId);
  const item = list.items.find((candidate) => candidate.id === itemId);
  list.items = list.items.filter((candidate) => candidate.id !== itemId);
  return item;
}

/** Tree entries that delete whatever screenshots these entries point at. */
export function shotRemovals(items) {
  return items
    .filter((item) => item?.shot)
    .map((item) => ({ path: shotPath(item.id), remove: true }));
}
