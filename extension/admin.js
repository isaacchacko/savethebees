// A stand-in for the site you can type into. It renders the same markdown the
// site renders, in the same card, and what you type goes back to
// content/*.md as a commit — the same read-modify-write the rest of the
// extension uses, so a change that landed elsewhere is a conflict, not an
// overwrite.

import { getConfig, listDir, readFile, saveFiles } from "./store.js";
import { buildFrontMatter, parseFrontMatter, slugify, splitFrontMatter } from "./markdown.js";
import { createEditor } from "./editor.js";
import { createCoolView } from "./admin-cool.js";
import { editorFor } from "./site-paths.js";

// labels and card sizes as the site's Card.tsx has them: home is the small
// corner card, the list-heavy tabs take the width. The card's heading is the
// label, except on home, which says hi.
const PAGES = [
  { id: "home", label: "home", size: "sm" },
  { id: "about", label: "about", size: "md", path: "content/pages/about.md" },
  { id: "now", label: "now", size: "md", path: "content/pages/now.md" },
  { id: "running", label: "runs", size: "md", path: "content/pages/running.md" },
  { id: "blog", label: "blog", size: "lg" },
  { id: "library", label: "library", size: "lg" },
];

const WORDS_PER_MINUTE = 200; // the site's, from blog/[slug]/page.tsx

const nav = document.getElementById("nav");
const card = document.getElementById("card");
const cardTitle = card.querySelector(".card-title");
const doc = document.getElementById("doc");
const editor = createEditor({
  parent: doc,
  onChange: () => {
    if (current) setDirty(true);
    refreshPostHeader();
  },
  onSave: () => save(),
});
const picker = document.getElementById("picker");
const hint = document.getElementById("hint");
const legend = document.getElementById("legend");
const meta = document.getElementById("meta");
const metaFields = {
  title: document.getElementById("meta-title"),
  date: document.getElementById("meta-date"),
  description: document.getElementById("meta-description"),
};
const slugField = document.getElementById("meta-slug");
const slugPreview = document.getElementById("slug-preview");
const privateBox = document.getElementById("meta-private");
const privateWarn = document.getElementById("private-warn");
const descWarn = document.getElementById("desc-warn");
const postStats = document.getElementById("post-stats");
const revertButton = document.getElementById("revert");
const coolRoot = document.getElementById("cool");
const liveLink = document.getElementById("live");
const coolView = createCoolView({ root: coolRoot, say });
const status = document.getElementById("status");
const saveButton = document.getElementById("save");
const dirtyFlag = document.getElementById("dirty");

const DUMPS_DIR = "content/dumps";

let current = null; // { path, fields, markdown, isDump }
let dirty = false;
let arming = null; // the delete button waiting for a second click

let siteUrl = "";

/**
 * Where the thing being edited lives on the real site. A write-up points at
 * the path that is actually deployed — the saved one — because a slug you have
 * typed but not committed is a url that does not exist yet.
 */
function setLive(path, unavailable = false) {
  liveLink.href = siteUrl + path;
  liveLink.title = unavailable
    ? "a private dump has no page on the site"
    : siteUrl + path;
  // toggleAttribute writes an empty value, which is not the aria contract and
  // does not match [aria-disabled="true"]
  if (unavailable) liveLink.setAttribute("aria-disabled", "true");
  else liveLink.removeAttribute("aria-disabled");
}

/** The live link is meaningless while a dump is private — no page is built. */
function refreshLive() {
  privateWarn.hidden = !privateBox.checked;
  if (!current?.isDump) return;
  const slug = current.path.split("/").pop().replace(/\.md$/, "");
  setLive(`/blog/${slug}`, privateBox.checked);
}

/** "2026-08-21" -> "08/21/26", as the post's header shows it. */
function shortDate(date) {
  const match = /^\d{2}(\d{2})-(\d{2})-(\d{2})/.exec(date);
  return match ? `${match[2]}/${match[3]}/${match[1]}` : "";
}

/** The date and read time above a post, kept current as you type. */
function refreshPostHeader() {
  if (!current?.isDump) return;
  const words = editor.text().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  const date = shortDate(metaFields.date.value.trim());
  postStats.textContent = `${date ? `${date} · ` : ""}${minutes} min`;
  descWarn.hidden = Boolean(metaFields.description.value.trim());
}

function say(message, tone = "") {
  status.textContent = message;
  status.dataset.tone = tone;
}

function setDirty(value) {
  dirty = value;
  dirtyFlag.hidden = !value;
  saveButton.disabled = !value;
  revertButton.disabled = !value;
}

function el(tag, props = {}, children = []) {
  const node = Object.assign(document.createElement(tag), props);
  for (const child of [].concat(children)) if (child) node.append(child);
  return node;
}

// ──────────────────────────────── loading ────────────────────────────────

async function openPath(path) {
  say("loading…");
  doc.hidden = true;
  legend.hidden = true;
  meta.hidden = true;
  try {
    const { text } = await readFile(path);
    const { front, body: rawBody } = splitFrontMatter(text);
    // buildFrontMatter writes the blank line after the front matter itself
    const body = rawBody.replace(/^\n+/, "");
    const isDump = path.startsWith(`${DUMPS_DIR}/`);

    const fields = parseFrontMatter(front);
    current = { path, fields, markdown: body, isDump };

    meta.hidden = !isDump;
    if (isDump) {
      for (const [key, input] of Object.entries(metaFields)) input.value = fields[key] || "";
      privateBox.checked = fields.private === "true" || fields.private === true;
      slugField.value = path.split("/").pop().replace(/\.md$/, "");
      slugFollowsTitle = false;
      showSlug();
      refreshLive();
    }

    editor.load(body);
    doc.hidden = false;
    doc.classList.toggle("post", isDump);
    legend.hidden = false;
    refreshPostHeader();
    setDirty(false);
    composed.lastSaved = null;
    say("");
  } catch (error) {
    doc.hidden = true;
    say(error.message, "error");
  }
}

async function showDumps() {
  picker.hidden = false;
  doc.hidden = true;
  legend.hidden = true;
  meta.hidden = true;
  current = null;
  arming = null;
  setDirty(false);
  doc.classList.remove("post");
  hint.textContent = "just let a man yap — each post is a markdown file in content/dumps.";
  say("loading…");

  try {
    const names = await listDir(DUMPS_DIR);
    // the index reads front matter, not filenames, so this does too — one
    // read per file, which is fine at this size
    const files = await Promise.all(
      names.map(async (name) => {
        try {
          const { front } = splitFrontMatter((await readFile(`${DUMPS_DIR}/${name}`)).text);
          return { name, ...parseFrontMatter(front) };
        } catch {
          return { name };
        }
      })
    );
    // newest first, as the site sorts them
    files.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    renderDumps(files);
    say("");
  } catch (error) {
    say(error.message, "error");
  }
}

/** "2026-08-21" -> "08/26", as the blog index shows it. */
function monthYear(date) {
  const match = /^(\d{4})-(\d{2})/.exec(date || "");
  return match ? `${match[2]}/${match[1].slice(2)}` : "";
}

const isPrivate = (fields) => fields.private === "true" || fields.private === true;

/** `files` is [{name, title?, date?, description?, private?}], one per dump. */
function renderDumps(files) {
  const rows = files.map((file) => {
    const { name } = file;
    const open = el("button", { type: "button", className: "open" }, [
      el("span", { className: "blog-title", textContent: file.title || name.replace(/\.md$/, "") }),
      el("span", { className: "muted tabular", textContent: monthYear(file.date) }),
      el("span", { className: "blog-desc", textContent: file.description || "" }),
    ]);
    open.onclick = () => {
      picker.hidden = true;
      hint.textContent = "";
      openPath(`${DUMPS_DIR}/${name}`);
    };

    const armed = arming === name;
    const remove = el("button", {
      className: "danger",
      textContent: armed ? "sure?" : "del",
      onclick: () => {
        if (!armed) {
          arming = name;
          return renderDumps(files);
        }
        deleteDump(name, files);
      },
    });

    const tag = isPrivate(file) ? el("span", { className: "blog-private", textContent: "private" }) : el("span");
    return el("div", { className: "row" }, [open, tag, remove]);
  });

  rows.push(
    el("button", {
      className: "new",
      type: "button",
      textContent: "+ new post",
      onclick: () => newDump(files),
    })
  );

  picker.replaceChildren(...rows);
}

async function deleteDump(name, files) {
  arming = null;
  say(`deleting ${name}…`);
  try {
    await saveFiles(`admin: delete ${name}`, [
      { path: `${DUMPS_DIR}/${name}`, remove: true },
    ]);
    renderDumps(files.filter((file) => file.name !== name));
    say(`deleted ${name}`, "ok");
  } catch (error) {
    renderDumps(files);
    say(error.message, "error");
  }
}

/**
 * A new write-up starts as a real file so everything downstream — the index
 * page, the editor, a save — sees the same shape as any other.
 */
async function newDump(files) {
  const title = el("input", { type: "text", placeholder: "what did you learn?" });
  const create = el("button", {
    type: "button",
    textContent: "create",
    onclick: async () => {
      const text = title.value.trim();
      if (!text) return say("give it a title first", "error");

      const slug = slugify(text);
      const name = `${slug}.md`;
      if (files.some((file) => file.name === name)) return say(`${name} already exists`, "error");

      create.disabled = true;
      say("creating…");
      const today = new Date().toISOString().slice(0, 10);
      // no `# title` in the body: the site takes a post's title from the front
      // matter and drops the body's h1, so one here would only go unread
      const body = buildFrontMatter({ title: text, date: today, description: "" }) + "start here.\n";

      try {
        await saveFiles(`admin: add ${name}`, [{ path: `${DUMPS_DIR}/${name}`, text: body }]);
        picker.hidden = true;
        hint.textContent = "";
        await openPath(`${DUMPS_DIR}/${name}`);
        slugFollowsTitle = true; // until you edit the slug yourself
        say("created — give it a description, then write", "ok");
      } catch (error) {
        create.disabled = false;
        say(error.message, "error");
      }
    },
  });

  picker.replaceChildren(
    el("div", { className: "create" }, [
      title,
      create,
      el("button", { type: "button", textContent: "cancel", onclick: () => renderDumps(files) }),
    ])
  );
  title.focus();
}

function selectPage(page) {
  if (dirty && !confirmDiscard()) return;

  for (const button of nav.querySelectorAll("button")) {
    button.toggleAttribute("aria-current", button.dataset.id === page.id);
    if (button.dataset.id === page.id) button.setAttribute("aria-current", "page");
  }
  card.dataset.size = page.size;
  cardTitle.textContent = page.id === "home" ? "howdy!" : page.label;
  // home and library have nothing held back to save: library commits every action
  saveButton.hidden = revertButton.hidden = page.id === "home" || page.id === "library";
  doc.classList.remove("post");
  setLive(page.id === "home" ? "/" : `/${page.id}`);
  picker.hidden = true;
  coolRoot.hidden = true;
  hint.textContent = "";
  setDirty(false);
  current = null;

  if (page.id === "home") {
    doc.hidden = true;
    legend.hidden = true;
    meta.hidden = true;
    hint.textContent =
      "home is a few lines of jsx and a spotify widget over the map — components, not prose, so there is nothing here to type over. about, now, runs and blog are markdown; library is cool.json.";
    say("");
    return;
  }
  if (page.id === "blog") return showDumps();
  if (page.id === "library") {
    coolRoot.hidden = false;
    doc.hidden = true;
    legend.hidden = true;
    meta.hidden = true;
    hint.textContent =
      "lists and entries, the same as the popup's manage tab. hover an entry for its screenshot and note, drag it onto another list to move it. every change is its own commit.";
    return coolView.load();
  }
  return openPath(page.path);
}

// `dirty` is only ever set by a real edit, so this cannot fire spuriously
function confirmDiscard() {
  return window.confirm("you have unsaved changes. discard them?");
}

// ──────────────────────────────── editing ────────────────────────────────

privateBox.addEventListener("change", () => {
  if (current) setDirty(true);
  refreshLive();
});

for (const input of [...Object.values(metaFields), slugField]) {
  input.addEventListener("input", () => {
    if (current) setDirty(true);
    refreshPostHeader();
  });
}

document.getElementById("back").onclick = () => {
  if (dirty && !confirmDiscard()) return;
  showDumps();
};

/**
 * The slug field takes whatever you type — spaces and all — because
 * normalising each keystroke makes it impossible to type: a trailing space
 * would be stripped before you reached the next word. It is normalised when
 * you leave the field, and the filename it will actually become is shown
 * underneath the whole time, so the field never quietly disagrees with what
 * gets committed.
 */
function showSlug() {
  const slug = slugify(slugField.value || metaFields.title.value || "untitled");
  slugPreview.textContent = `${DUMPS_DIR}/${slug}.md`;
}

// typing a title for a new write-up names the file too, until you name it
// yourself — after that the slug is yours and stops following along
let slugFollowsTitle = false;

metaFields.title.addEventListener("input", () => {
  if (slugFollowsTitle) slugField.value = slugify(metaFields.title.value);
  showSlug();
});

slugField.addEventListener("input", () => {
  slugFollowsTitle = false;
  showSlug();
});

slugField.addEventListener("blur", () => {
  const slug = slugify(slugField.value || metaFields.title.value || "untitled");
  if (slugField.value !== slug) slugField.value = slug;
  showSlug();
});

/** What the file would look like if saved right now. */
function composed() {
  const body = editor.text().replace(/\n*$/, "\n");
  if (!current.isDump) return { text: body, path: current.path };

  const fields = Object.fromEntries(
    Object.entries(metaFields).map(([key, input]) => [key, input.value.trim()])
  );
  if (privateBox.checked) fields.private = "true";
  const slug = slugify(slugField.value || fields.title || "untitled");
  return {
    text: buildFrontMatter(fields) + body,
    path: `${DUMPS_DIR}/${slug}.md`,
    fields,
  };
}

async function save() {
  if (!current || !dirty) return;

  const next = composed();
  const renamed = next.path !== current.path;

  if (!renamed && next.text === composed.lastSaved) {
    setDirty(false);
    return say("nothing changed");
  }

  saveButton.disabled = true;
  revertButton.disabled = true;
  say("saving…");

  // a rename is the new file and the old one's removal in a single commit, so
  // the write-up is never briefly absent or briefly duplicated
  const files = [{ path: next.path, text: next.text }];
  if (renamed) files.push({ path: current.path, remove: true });

  const name = next.path.split("/").pop();
  try {
    await saveFiles(renamed ? `admin: rename ${current.path.split("/").pop()} to ${name}` : `admin: edit ${name}`, files);
    current.path = next.path;
    current.markdown = editor.text();
    if (next.fields) current.fields = next.fields;
    composed.lastSaved = next.text;
    setDirty(false);
    if (current.isDump) refreshLive();
    say(renamed ? `saved as ${name} — the old url is gone` : "saved — vercel will rebuild in a minute or so", "ok");
  } catch (error) {
    saveButton.disabled = false;
    revertButton.disabled = false;
    say(error.message, "error");
  }
}

/** Back to what was last loaded or saved, without touching the repo. */
function revert() {
  if (!current || !dirty) return;

  editor.load(current.markdown);
  if (current.isDump) {
    for (const [key, input] of Object.entries(metaFields)) input.value = current.fields[key] || "";
    slugField.value = current.path.split("/").pop().replace(/\.md$/, "");
    privateBox.checked = current.fields.private === "true" || current.fields.private === true;
    showSlug();
    refreshLive();
  }
  refreshPostHeader();
  setDirty(false);
  say("reverted");
}

saveButton.onclick = save;
revertButton.onclick = revert;

window.addEventListener("beforeunload", (event) => {
  if (dirty) event.preventDefault();
});

// ──────────────────────────────── start ────────────────────────────────

nav.replaceChildren(
  ...PAGES.map((page) => {
    const button = el("button", {
      type: "button",
      textContent: page.label,
      onclick: () => selectPage(page),
    });
    button.dataset.id = page.id; // dataset is read-only, so not via el()
    return button;
  })
);

/**
 * Opened from "edit this page" with the path you were looking at, so land on
 * that rather than making you find it again. A dump opens straight into its
 * own editor instead of the list.
 */
async function openRequested() {
  const asked = new URLSearchParams(location.search).get("path");
  const target = asked ? editorFor(asked) : null;
  if (!target) return selectPage(PAGES[1]); // about, the first editable page

  const page = PAGES.find((candidate) => candidate.id === target.page);
  if (!page) return selectPage(PAGES[1]);

  await selectPage(page);
  if (!target.slug) return;

  picker.hidden = true;
  hint.textContent = "";
  await openPath(`${DUMPS_DIR}/${target.slug}.md`);
}

(async () => {
  siteUrl = (await getConfig()).site.replace(/\/$/, "");
  await openRequested();
})();
