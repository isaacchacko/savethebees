// The single source of truth is content/cool.json on GitHub. Every mutation is
// a read-modify-write commit, which Vercel picks up and rebuilds /cool from.

const CONFIG_DEFAULTS = {
  owner: "isaacchacko",
  repo: "savethebees",
  branch: "main",
  filePath: "content/cool.json",
  token: "",
};

const CACHE_KEY = "cool";

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

async function setCached(data, sha) {
  await chrome.storage.local.set({ [CACHE_KEY]: { data, sha } });
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

function contentsPath(config) {
  return `/repos/${config.owner}/${config.repo}/contents/${config.filePath}`;
}

export async function fetchCool() {
  const config = await getConfig();
  const response = await github(
    config,
    `${contentsPath(config)}?ref=${encodeURIComponent(config.branch)}`
  );

  if (response.status === 404) {
    // The file does not exist yet; the first commit will create it.
    return { data: { lists: [] }, sha: null };
  }
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
  if (!Array.isArray(data.lists)) data = { lists: [] };

  await setCached(data, body.sha);
  return { data, sha: body.sha };
}

async function commit(config, data, sha, message) {
  return github(config, contentsPath(config), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      branch: config.branch,
      content: encodeBase64(`${JSON.stringify(data, null, 2)}\n`),
      ...(sha ? { sha } : {}),
    }),
  });
}

/**
 * Read cool.json, hand it to `apply`, and commit what comes back. The sha makes
 * the write conditional, so a commit that landed elsewhere since the read is a
 * conflict rather than a silent overwrite — we re-read and reapply once.
 */
export async function mutate(message, apply) {
  const config = await getConfig();

  for (let attempt = 0; attempt < 2; attempt++) {
    const { data, sha } = await fetchCool();
    const next = apply(structuredClone(data));
    const response = await commit(config, next, sha, message);

    if (response.ok) {
      const body = await response.json();
      await setCached(next, body.content.sha);
      return next;
    }
    if (response.status !== 409 && response.status !== 422) {
      throw new Error(await explain(response));
    }
  }

  throw new Error("cool.json changed while saving — try again");
}

// ──────────────────────────────  pure helpers  ──────────────────────────────

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

export function removeList(data, listId) {
  data.lists = data.lists.filter((list) => list.id !== listId);
}

export function addItem(data, listId, item) {
  findList(data, listId).items.unshift({
    id: crypto.randomUUID(),
    title: item.title.trim(),
    url: (item.url || "").trim(),
    note: (item.note || "").trim(),
    added: new Date().toISOString().slice(0, 10),
  });
}

export function updateItem(data, listId, itemId, patch) {
  const list = findList(data, listId);
  const item = list.items.find((candidate) => candidate.id === itemId);
  if (!item) throw new Error("that entry is gone");
  Object.assign(item, patch);
}

export function removeItem(data, listId, itemId) {
  const list = findList(data, listId);
  list.items = list.items.filter((item) => item.id !== itemId);
}
