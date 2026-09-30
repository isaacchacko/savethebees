// A stand-in for the site you can type into. It renders the same markdown the
// site renders, in the same shell, and what you type goes back to
// content/*.md as a commit — the same read-modify-write the rest of the
// extension uses, so a change that landed elsewhere is a conflict, not an
// overwrite.

import { listDir, readFile, saveFiles } from "./store.js";
import {
  buildFrontMatter,
  parseFrontMatter,
  roundTrips,
  slugify,
  splitFrontMatter,
  toHtml,
  toMarkdown,
} from "./markdown.js";
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
const legend = document.getElementById("legend");
const meta = document.getElementById("meta");
const metaFields = {
  title: document.getElementById("meta-title"),
  date: document.getElementById("meta-date"),
  description: document.getElementById("meta-description"),
};
const slugField = document.getElementById("meta-slug");
const revertButton = document.getElementById("revert");
const status = document.getElementById("status");
const saveButton = document.getElementById("save");
const dirtyFlag = document.getElementById("dirty");
const cwd = document.getElementById("cwd");
const cmd = document.getElementById("cmd");

const LEARNINGS_DIR = "content/learnings";

let current = null; // { path, fields, markdown, isLearning }
let dirty = false;
let arming = null; // the delete button waiting for a second click

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

async function openPath(path, { label } = {}) {
  say("loading…");
  doc.contentEditable = "false";
  legend.hidden = true;
  meta.hidden = true;
  try {
    const { text } = await readFile(path);
    const { front, body } = splitFrontMatter(text);
    const isLearning = path.startsWith(`${LEARNINGS_DIR}/`);

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
      legend.hidden = true;
      meta.hidden = true;
      hint.textContent =
        "read-only: this file uses markdown the editor cannot write back exactly, so editing it here would lose something. edit it in the repo instead.";
      say("not editable", "error");
      return;
    }

    const fields = parseFrontMatter(front);
    current = { path, fields, markdown: body, isLearning };

    meta.hidden = !isLearning;
    if (isLearning) {
      for (const [key, input] of Object.entries(metaFields)) input.value = fields[key] || "";
      slugField.value = path.split("/").pop().replace(/\.md$/, "");
    }

    doc.innerHTML = toHtml(body);
    doc.contentEditable = "true";
    legend.hidden = false;
    setDirty(false);
    composed.lastSaved = null;
    cmd.textContent = `vim ${label || path.split("/").pop()}`;
    say("");
  } catch (error) {
    doc.innerHTML = "";
    say(error.message, "error");
  }
}

async function showLearnings() {
  picker.hidden = false;
  doc.innerHTML = "";
  doc.contentEditable = "false";
  legend.hidden = true;
  meta.hidden = true;
  current = null;
  arming = null;
  setDirty(false);
  hint.textContent = "each write-up is a markdown file.";
  say("loading…");

  try {
    const files = await listDir(LEARNINGS_DIR);
    renderLearnings(files);
    say("");
  } catch (error) {
    say(error.message, "error");
  }
}

function renderLearnings(files) {
  const rows = files.map((name) => {
    const open = el("button", {
      type: "button",
      textContent: name.replace(/\.md$/, ""),
      onclick: () => {
        picker.hidden = true;
        hint.textContent = "";
        openPath(`${LEARNINGS_DIR}/${name}`, { label: name });
      },
    });

    const armed = arming === name;
    const remove = el("button", {
      className: "danger",
      textContent: armed ? "sure?" : "del",
      onclick: () => {
        if (!armed) {
          arming = name;
          return renderLearnings(files);
        }
        deleteLearning(name, files);
      },
    });

    return el("div", { className: "row" }, [open, remove]);
  });

  rows.push(
    el("button", {
      className: "new",
      type: "button",
      textContent: "+ new write-up",
      onclick: () => newLearning(files),
    })
  );

  picker.replaceChildren(...rows);
}

async function deleteLearning(name, files) {
  arming = null;
  say(`deleting ${name}…`);
  try {
    await saveFiles(`admin: delete ${name}`, [
      { path: `${LEARNINGS_DIR}/${name}`, remove: true },
    ]);
    renderLearnings(files.filter((file) => file !== name));
    say(`deleted ${name}`, "ok");
  } catch (error) {
    renderLearnings(files);
    say(error.message, "error");
  }
}

/**
 * A new write-up starts as a real file so everything downstream — the index
 * page, the editor, a save — sees the same shape as any other.
 */
async function newLearning(files) {
  const title = el("input", { type: "text", placeholder: "what did you learn?" });
  const create = el("button", {
    type: "button",
    textContent: "create",
    onclick: async () => {
      const text = title.value.trim();
      if (!text) return say("give it a title first", "error");

      const slug = slugify(text);
      const name = `${slug}.md`;
      if (files.includes(name)) return say(`${name} already exists`, "error");

      create.disabled = true;
      say("creating…");
      const today = new Date().toISOString().slice(0, 10);
      const body =
        buildFrontMatter({ title: text, date: today, description: "" }) +
        `# ${text}\n\nstart here.\n`;

      try {
        await saveFiles(`admin: add ${name}`, [{ path: `${LEARNINGS_DIR}/${name}`, text: body }]);
        picker.hidden = true;
        hint.textContent = "";
        await openPath(`${LEARNINGS_DIR}/${name}`, { label: name });
        say("created — give it a description, then write", "ok");
      } catch (error) {
        create.disabled = false;
        say(error.message, "error");
      }
    },
  });

  picker.replaceChildren(
    el("div", { className: "row" }, [
      title,
      create,
      el("button", { type: "button", textContent: "cancel", onclick: () => renderLearnings(files) }),
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
  cwd.textContent = page.id === "home" ? "~" : `~/${page.id}`;
  cmd.textContent = page.cmd;
  picker.hidden = true;
  hint.textContent = "";
  setDirty(false);
  current = null;

  if (page.id === "home") {
    doc.contentEditable = "false";
    doc.innerHTML = "";
    legend.hidden = true;
    meta.hidden = true;
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

for (const input of [...Object.values(metaFields), slugField]) {
  input.addEventListener("input", () => {
    if (current) setDirty(true);
  });
}

// typing a title for a new write-up names the file too, until you name it
// yourself — after that the slug is yours and stops following along
let slugFollowsTitle = false;
metaFields.title.addEventListener("input", () => {
  if (slugFollowsTitle) slugField.value = slugify(metaFields.title.value);
});
slugField.addEventListener("input", () => {
  slugFollowsTitle = false;
});

// Rich paste would smuggle in markup the serializer does not handle, and
// whatever it cannot read would be silently dropped on save.
doc.addEventListener("paste", (event) => {
  event.preventDefault();
  const text = event.clipboardData.getData("text/plain");
  document.execCommand("insertText", false, text);
});

// ───────────────────────── block structure by keyboard ─────────────────────
// The ─ and ## in front of a line are CSS, not text, so there is nothing there
// to backspace over. Without these handlers a bullet is a one-way door: you
// could never turn one back into a plain line. Backspace at the very start of
// a block unwraps it, and typing "- " or "## " wraps it again, which is how
// every other editor behaves.

function blockAt() {
  const selection = getSelection();
  if (!selection.rangeCount) return null;

  let node = selection.getRangeAt(0).startContainer;
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;

  while (node && node !== doc) {
    if (node.tagName === "LI" || node.parentElement === doc) return node;
    node = node.parentElement;
  }
  return null;
}

function caretAtStartOf(block) {
  const selection = getSelection();
  if (!selection.isCollapsed || !selection.rangeCount) return false;

  const caret = selection.getRangeAt(0);
  const before = document.createRange();
  before.selectNodeContents(block);
  before.setEnd(caret.startContainer, caret.startOffset);
  return before.toString().length === 0;
}

function putCaret(node, atStart = true) {
  const range = document.createRange();
  range.selectNodeContents(node);
  range.collapse(atStart);
  const selection = getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function paragraphFrom(node) {
  const p = document.createElement("p");
  p.innerHTML = node.innerHTML || "<br>";
  return p;
}

/** Pulls one item out of its list, keeping the items either side in lists. */
function unwrapListItem(li) {
  const list = li.parentElement;
  const p = paragraphFrom(li);
  const after = [...list.children].slice([...list.children].indexOf(li) + 1);

  li.remove();
  list.after(p);

  if (after.length) {
    const tail = document.createElement("ul");
    tail.append(...after);
    p.after(tail);
  }
  if (!list.children.length) list.remove();

  return p;
}

function unwrapBlock(block) {
  if (block.tagName === "LI") return unwrapListItem(block);
  const p = paragraphFrom(block);
  block.replaceWith(p);
  return p;
}

/** A paragraph becomes a list item, joining whichever lists it now touches. */
function makeListItem(block) {
  const li = document.createElement("li");
  li.innerHTML = block.innerHTML || "<br>";

  const previous = block.previousElementSibling;
  let list;

  if (previous && previous.tagName === "UL") {
    previous.append(li);
    block.remove();
    list = previous;
  } else {
    list = document.createElement("ul");
    list.append(li);
    block.replaceWith(list);
  }

  // a line turned into a bullet right above an existing list belongs to it,
  // rather than starting a second list touching the first
  const next = list.nextElementSibling;
  if (next && next.tagName === "UL") {
    list.append(...next.children);
    next.remove();
  }

  return li;
}

function makeHeading(block, level) {
  const heading = document.createElement(`h${level}`);
  heading.innerHTML = block.innerHTML || "<br>";
  block.replaceWith(heading);
  return heading;
}

/** "- " and "## " at the start of a line, the way markdown would read them. */
const SHORTCUTS = [
  { pattern: /^(#{1,3})\s$/, apply: (block, m) => makeHeading(block, m[1].length) },
  { pattern: /^[-*]\s$/, apply: (block) => makeListItem(block) },
];

doc.addEventListener("beforeinput", (event) => {
  if (event.inputType !== "insertText" || event.data !== " ") return;

  const block = blockAt();
  if (!block || block.tagName === "LI" || /^H[1-6]$/.test(block.tagName)) return;
  if (block.closest("pre")) return;

  const selection = getSelection();
  if (!selection.isCollapsed) return;

  const caret = selection.getRangeAt(0);
  const lead = document.createRange();
  lead.selectNodeContents(block);
  lead.setEnd(caret.startContainer, caret.startOffset);
  const typed = lead.toString() + " ";

  for (const { pattern, apply } of SHORTCUTS) {
    const match = pattern.exec(typed);
    if (!match) continue;

    event.preventDefault();
    lead.deleteContents(); // drop the "- " or "## " the shortcut consumed
    putCaret(apply(block, match));
    setDirty(true);
    return;
  }
});

doc.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "s") {
    event.preventDefault();
    save();
    return;
  }

  const block = blockAt();
  if (!block || block.closest("pre")) return;

  // backspace at the very start unwraps, since the marker itself cannot be
  // deleted — it is drawn by css, not typed
  if (event.key === "Backspace" && caretAtStartOf(block)) {
    if (block.tagName === "LI" || /^H[1-6]$/.test(block.tagName)) {
      event.preventDefault();
      putCaret(unwrapBlock(block));
      setDirty(true);
      return;
    }
  }

  if (event.key === "Enter" && !event.shiftKey) {
    // enter on an empty bullet leaves the list, rather than adding another
    if (block.tagName === "LI" && !block.textContent.trim()) {
      event.preventDefault();
      putCaret(unwrapBlock(block));
      setDirty(true);
      return;
    }
    // and enter at the end of a heading starts a paragraph, not another heading
    if (/^H[1-6]$/.test(block.tagName)) {
      const selection = getSelection();
      const atEnd =
        selection.isCollapsed &&
        selection.getRangeAt(0).endOffset === (selection.getRangeAt(0).endContainer.length ?? 0) &&
        block.contains(selection.getRangeAt(0).endContainer);
      if (atEnd) {
        event.preventDefault();
        const p = document.createElement("p");
        p.innerHTML = "<br>";
        block.after(p);
        putCaret(p);
        setDirty(true);
      }
    }
  }
});

/** What the file would look like if saved right now. */
function composed() {
  const body = toMarkdown(doc);
  if (!current.isLearning) return { text: body, path: current.path };

  const fields = Object.fromEntries(
    Object.entries(metaFields).map(([key, input]) => [key, input.value.trim()])
  );
  const slug = slugify(slugField.value || fields.title || "untitled");
  return {
    text: buildFrontMatter(fields) + body,
    path: `${LEARNINGS_DIR}/${slug}.md`,
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
    current.markdown = toMarkdown(doc);
    if (next.fields) current.fields = next.fields;
    composed.lastSaved = next.text;
    setDirty(false);
    cmd.textContent = `vim ${name}`;
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

  doc.innerHTML = toHtml(current.markdown);
  if (current.isLearning) {
    for (const [key, input] of Object.entries(metaFields)) input.value = current.fields[key] || "";
    slugField.value = current.path.split("/").pop().replace(/\.md$/, "");
  }
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
    return el("li", {}, button);
  })
);

selectPage(PAGES[1]); // land on about, the first editable page
