// A stand-in for the site you can type into. It renders the same markdown the
// site renders, in the same shell, and what you type goes back to
// content/*.md as a commit — the same read-modify-write the rest of the
// extension uses, so a change that landed elsewhere is a conflict, not an
// overwrite.

import { listDir, readFile, saveFiles } from "./store.js";
import { roundTrips, splitFrontMatter, toHtml, toMarkdown } from "./markdown.js";
import { followTheme } from "./themes.js";

followTheme();

const PAGES = [
  { id: "home", label: "home", cmd: "cat index.tsx" },
  { id: "about", label: "about", path: "content/pages/about.md", cmd: "vim about.md" },
  { id: "now", label: "now", path: "content/pages/now.md", cmd: "vim now.md" },
  { id: "running", label: "running", path: "content/pages/running.md", cmd: "vim races.md" },
  { id: "learnings", label: "learnings", cmd: "ls -l learnings/" },
];

const nav = document.getElementById("nav");
const doc = document.getElementById("doc");
const picker = document.getElementById("picker");
const hint = document.getElementById("hint");
const status = document.getElementById("status");
const saveButton = document.getElementById("save");
const dirtyFlag = document.getElementById("dirty");
const cwd = document.getElementById("cwd");
const cmd = document.getElementById("cmd");

let current = null; // { path, front, markdown }
let dirty = false;

function say(message, tone = "") {
  status.textContent = message;
  status.dataset.tone = tone;
}

function setDirty(value) {
  dirty = value;
  dirtyFlag.hidden = !value;
  saveButton.disabled = !value;
}

function el(tag, props = {}, children = []) {
  const node = Object.assign(document.createElement(tag), props);
  for (const child of [].concat(children)) if (child) node.append(child);
  return node;
}

// ──────────────────────────────── loading ────────────────────────────────

async function openPath(path, { label } = {}) {
  say("loading…");
  doc.contentEditable = "false";
  try {
    const { text } = await readFile(path);
    const { front, body } = splitFrontMatter(text);

    // Refuse to edit anything this editor cannot reproduce byte for byte.
    // Saving is a full rewrite of the file, so a construct the renderer does
    // not understand would be dropped silently — better to not open it.
    const probe = roundTrips(body, () => {
      const host = document.createElement("div");
      host.style.display = "none";
      document.body.append(host);
      return host;
    });
    if (!probe.ok) {
      current = null;
      doc.innerHTML = toHtml(body);
      doc.contentEditable = "false";
      hint.textContent =
        "read-only: this file uses markdown the editor cannot write back exactly, so editing it here would lose something. edit it in the repo instead.";
      say("not editable", "error");
      return;
    }

    current = { path, front, markdown: body };
    doc.innerHTML = toHtml(body);
    doc.contentEditable = "true";
    setDirty(false);
    cmd.textContent = `vim ${label || path.split("/").pop()}`;
    say(front ? "front matter is kept as-is; edit the prose" : "");
  } catch (error) {
    doc.innerHTML = "";
    say(error.message, "error");
  }
}

async function showLearnings() {
  picker.hidden = false;
  doc.innerHTML = "";
  doc.contentEditable = "false";
  current = null;
  setDirty(false);
  hint.textContent = "each write-up is a markdown file. pick one to edit.";
  say("loading…");
  try {
    const files = await listDir("content/learnings");
    picker.replaceChildren(
      ...files.map((name) =>
        el("button", {
          type: "button",
          textContent: name.replace(/\.md$/, ""),
          onclick: () => {
            picker.hidden = true;
            hint.textContent = "";
            openPath(`content/learnings/${name}`, { label: name });
          },
        })
      )
    );
    say(files.length ? "" : "no write-ups yet");
  } catch (error) {
    say(error.message, "error");
  }
}

function selectPage(page) {
  if (dirty && !confirmDiscard()) return;

  for (const button of nav.querySelectorAll("button")) {
    button.toggleAttribute("aria-current", button.dataset.id === page.id);
    if (button.dataset.id === page.id) button.setAttribute("aria-current", "page");
  }
  cwd.textContent = page.id === "home" ? "~" : `~/${page.id}`;
  cmd.textContent = page.cmd;
  picker.hidden = true;
  hint.textContent = "";
  setDirty(false);
  current = null;

  if (page.id === "home") {
    doc.contentEditable = "false";
    doc.innerHTML = "";
    hint.textContent =
      "home is a boid simulation, a spotify widget and live readme embeds — components, not prose, so there is nothing here to type over. the other four pages are markdown.";
    say("");
    return;
  }
  if (page.id === "learnings") return showLearnings();
  return openPath(page.path);
}

// `dirty` is only ever set by a real edit, so this cannot fire spuriously
function confirmDiscard() {
  return window.confirm("you have unsaved changes. discard them?");
}

// ──────────────────────────────── editing ────────────────────────────────

doc.addEventListener("input", () => {
  if (current) setDirty(true);
});

// Rich paste would smuggle in markup the serializer does not handle, and
// whatever it cannot read would be silently dropped on save.
doc.addEventListener("paste", (event) => {
  event.preventDefault();
  const text = event.clipboardData.getData("text/plain");
  document.execCommand("insertText", false, text);
});

doc.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "s") {
    event.preventDefault();
    save();
  }
});

async function save() {
  if (!current || !dirty) return;

  const body = toMarkdown(doc);
  const next = current.front + body;
  if (next === current.front + current.markdown) {
    setDirty(false);
    say("nothing changed");
    return;
  }

  saveButton.disabled = true;
  say("saving…");
  try {
    await saveFiles(`admin: edit ${current.path.split("/").pop()}`, [
      { path: current.path, text: next },
    ]);
    current.markdown = body;
    setDirty(false);
    say("saved — vercel will rebuild in a minute or so", "ok");
  } catch (error) {
    saveButton.disabled = false;
    say(error.message, "error");
  }
}

saveButton.onclick = save;

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
    return el("li", {}, button);
  })
);

selectPage(PAGES[1]); // land on about, the first editable page
