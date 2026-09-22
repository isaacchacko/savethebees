import {
  addItem,
  addList,
  fetchCool,
  getCached,
  moveItem,
  mutate,
  removeItem,
  removeList,
  shotPath,
  shotRemovals,
  updateItem,
  updateList,
} from "./store.js";
import { capture } from "./shot.js";
import { followTheme } from "./themes.js";

followTheme();

const NEW_LIST = "__new__";

const status = document.getElementById("status");
const listSelect = document.getElementById("list");
const newListRow = document.getElementById("new-list-row");
const newListInput = document.getElementById("new-list");
const titleInput = document.getElementById("title");
const labelInput = document.getElementById("entry-label");
const urlInput = document.getElementById("url");
const noteInput = document.getElementById("note");
const listsRoot = document.getElementById("lists");
const useShot = document.getElementById("use-shot");
const shotLabel = document.getElementById("shot-label");
const shotPreview = document.getElementById("shot-preview");

let shot = null; // {base64, width, height, bytes} for the tab the popup opened on
let data = { lists: [] };
let editing = null; // { listId, itemId? } — the row swapped for a form
let arming = null; // key of the delete button waiting for a second click
let creatingList = false;
let dragging = null; // {listId, itemId, title} while an entry is in flight
const expanded = new Set();

function say(message, tone = "") {
  status.textContent = message;
  status.dataset.tone = tone;
}

function el(tag, props = {}, children = []) {
  const node = Object.assign(document.createElement(tag), props);
  for (const child of [].concat(children)) if (child) node.append(child);
  return node;
}

function listById(id) {
  return data.lists.find((list) => list.id === id);
}

/** Commit through the store, then redraw both views off what came back. */
async function commit(message, apply, okMessage) {
  say("saving…");
  try {
    data = await mutate(message, apply);
    editing = null;
    arming = null;
    creatingList = false;
    render();
    say(okMessage, "ok");
    return true;
  } catch (error) {
    say(error.message, "error");
    return false;
  }
}

// ──────────────────────────────── add view ────────────────────────────────

async function renderAdd() {
  const { lastList } = await chrome.storage.local.get("lastList");
  const previous = listSelect.value || lastList;

  listSelect.replaceChildren(
    ...data.lists.map((list) => el("option", { value: list.id, textContent: list.title })),
    el("option", { value: NEW_LIST, textContent: "+ new list…" })
  );
  listSelect.value = listById(previous) ? previous : data.lists[0]?.id || NEW_LIST;
  syncNewListRow();
}

function syncNewListRow() {
  newListRow.hidden = listSelect.value !== NEW_LIST;
}

async function prefillFromTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  titleInput.value = tab.title || "";
  urlInput.value = tab.url || "";
}

async function grabShot() {
  shot = await capture();
  if (!shot) {
    // chrome:// pages and the web store refuse capture — say so instead of
    // leaving a checkbox that silently does nothing.
    useShot.checked = false;
    useShot.disabled = true;
    shotLabel.textContent = "screenshot (this page can't be captured)";
    return;
  }
  shotLabel.textContent = `screenshot (${Math.round(shot.bytes / 1024)} kb)`;
  shotPreview.src = `data:image/webp;base64,${shot.base64}`;
  shotPreview.hidden = false;
}

async function save() {
  const title = titleInput.value.trim();
  const url = urlInput.value.trim();
  if (!title && !url) {
    say("needs a title or a url", "error");
    return;
  }

  const newListTitle = newListInput.value.trim();
  const makingList = listSelect.value === NEW_LIST;
  if (makingList && !newListTitle) {
    say("name the new list first", "error");
    return;
  }

  const entry = {
    title: title || url,
    label: labelInput.value.trim(),
    url,
    note: noteInput.value.trim(),
  };
  const target = makingList ? newListTitle : listById(listSelect.value).title;

  const attach = useShot.checked ? shot : null;
  let savedTo = listSelect.value;
  const ok = await commit(
    `cool: add "${entry.title}" to ${target}`,
    (draft, files) => {
      savedTo = makingList ? addList(draft, newListTitle) : listSelect.value;
      const id = addItem(draft, savedTo, entry, attach);
      if (attach) files.push({ path: shotPath(id), base64: attach.base64 });
    },
    `saved to ${target}`
  );

  if (ok) {
    await chrome.storage.local.set({ lastList: savedTo });
    setTimeout(() => window.close(), 600);
  }
}

// ────────────────────────────── manage view ───────────────────────────────

function deleteButton(key, label, onConfirm) {
  const armed = arming === key;
  return el("button", {
    className: "danger",
    textContent: armed ? "sure?" : label,
    onclick: () => {
      if (armed) {
        onConfirm();
      } else {
        arming = key;
        renderManage();
      }
    },
  });
}

function itemEditor(list, item) {
  const title = el("input", { type: "text", value: item.title });
  const label = el("input", {
    type: "text",
    value: item.label || "",
    placeholder: "optional — the link reads as this",
  });
  const url = el("input", { type: "text", value: item.url });
  const note = el("input", { type: "text", value: item.note, placeholder: "note" });

  return el("div", { className: "editor" }, [
    el("label", { textContent: "title" }),
    title,
    el("label", { textContent: "label" }),
    label,
    el("label", { textContent: "url" }),
    url,
    el("label", { textContent: "note" }),
    note,
    el("div", { className: "row" }, [
      el("button", {
        textContent: "save",
        onclick: () =>
          commit(
            `cool: update "${title.value.trim()}" in ${list.title}`,
            (draft) =>
              updateItem(draft, list.id, item.id, {
                title: title.value.trim(),
                label: label.value.trim(),
                url: url.value.trim(),
                note: note.value.trim(),
              }),
            "updated"
          ),
      }),
      el("button", {
        textContent: "cancel",
        onclick: () => {
          editing = null;
          renderManage();
        },
      }),
    ]),
  ]);
}

/** Doubles as the create form: no list means we are making one. */
function listEditor(list) {
  const title = el("input", {
    type: "text",
    value: list?.title || "",
    placeholder: "cool webrings",
  });
  const description = el("input", {
    type: "text",
    value: list?.description || "",
    placeholder: "optional — [links](url) work",
  });

  const submit = () => {
    const name = title.value.trim();
    if (!name) {
      say("name the list first", "error");
      return;
    }
    if (list) {
      commit(
        `cool: rename list to "${name}"`,
        (draft) =>
          updateList(draft, list.id, { title: name, description: description.value.trim() }),
        "updated"
      );
    } else {
      commit(
        `cool: add list "${name}"`,
        (draft) => updateList(draft, addList(draft, name), { description: description.value.trim() }),
        "list added"
      );
    }
  };

  return el("div", { className: "editor" }, [
    el("label", { textContent: "list name" }),
    title,
    el("label", { textContent: "description" }),
    description,
    el("div", { className: "row" }, [
      el("button", { textContent: "save", onclick: submit }),
      el("button", {
        textContent: "cancel",
        onclick: () => {
          editing = null;
          creatingList = false;
          renderManage();
        },
      }),
    ]),
  ]);
}

function renderItem(list, item) {
  if (editing?.listId === list.id && editing.itemId === item.id) {
    return el("li", {}, itemEditor(list, item));
  }

  // shows the label when there is one, so the row reads like the site does
  const row = el("li", { title: item.url, draggable: true }, [
    el("span", { className: "name", textContent: item.label || item.title }),
    el("button", {
      textContent: "ed",
      onclick: () => {
        editing = { listId: list.id, itemId: item.id };
        renderManage();
      },
    }),
    deleteButton(`item:${item.id}`, "del", () =>
      commit(
        `cool: remove "${item.title}" from ${list.title}`,
        (draft, files) => files.push(...shotRemovals([removeItem(draft, list.id, item.id)])),
        "removed"
      )
    ),
  ]);

  row.ondragstart = (event) => {
    dragging = { listId: list.id, itemId: item.id, title: item.label || item.title };
    event.dataTransfer.effectAllowed = "move";
    // firefox and others ignore a drag with nothing on the transfer
    event.dataTransfer.setData("text/plain", item.url || item.title);
    row.classList.add("dragging");
  };
  row.ondragend = () => {
    dragging = null;
    row.classList.remove("dragging");
    for (const node of listsRoot.querySelectorAll(".drop-target")) {
      node.classList.remove("drop-target");
    }
  };

  return row;
}

function renderList(list) {
  const open = expanded.has(list.id);
  const head = el("div", { className: "list-head" }, [
    el("span", {
      className: "name",
      textContent: `${open ? "▾" : "▸"} ${list.title}`,
      onclick: () => {
        expanded.has(list.id) ? expanded.delete(list.id) : expanded.add(list.id);
        renderManage();
      },
    }),
    el("span", { className: "count", textContent: list.items.length }),
    el("button", {
      textContent: "ed",
      onclick: () => {
        editing = { listId: list.id };
        renderManage();
      },
    }),
    deleteButton(`list:${list.id}`, "del", () =>
      commit(
        `cool: delete list "${list.title}"`,
        (draft, files) => files.push(...shotRemovals(removeList(draft, list.id).items)),
        "list deleted"
      )
    ),
  ]);

  const body = editing?.listId === list.id && !editing.itemId ? listEditor(list) : null;
  const items = open
    ? list.items.length
      ? el("ul", { className: "items" }, list.items.map((item) => renderItem(list, item)))
      : el("p", { className: "empty", textContent: "empty" })
    : null;

  const box = el("div", { className: "list" }, [head, body, items]);

  // A list is a drop target for any entry that is not already in it. Dropping
  // on a collapsed one works too, so you do not have to open it first.
  const canTake = () => dragging && dragging.listId !== list.id;

  box.ondragover = (event) => {
    if (!canTake()) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    box.classList.add("drop-target");
  };
  // moving over a child fires dragleave on the box; only a real exit counts
  box.ondragleave = (event) => {
    if (!box.contains(event.relatedTarget)) box.classList.remove("drop-target");
  };
  box.ondrop = (event) => {
    if (!canTake()) return;
    event.preventDefault();
    const { listId, itemId, title } = dragging;
    dragging = null;
    box.classList.remove("drop-target");
    expanded.add(list.id); // so you can see where it landed
    commit(
      `cool: move "${title}" to ${list.title}`,
      (draft) => moveItem(draft, listId, itemId, list.id),
      `moved to ${list.title}`
    );
  };

  return box;
}

function renderManage() {
  const rows = data.lists.length
    ? data.lists.map(renderList)
    : [el("p", { className: "empty", textContent: "no lists yet" })];
  if (creatingList) rows.push(el("div", { className: "list" }, listEditor(null)));
  listsRoot.replaceChildren(...rows);
  document.getElementById("add-list").hidden = creatingList;
}

function render() {
  renderAdd();
  renderManage();
}

// ──────────────────────────────── wiring ──────────────────────────────────

for (const tab of document.querySelectorAll(".tabs [data-view]")) {
  tab.onclick = () => {
    for (const other of document.querySelectorAll(".tabs [data-view]")) {
      other.classList.toggle("on", other === tab);
      document.getElementById(`view-${other.dataset.view}`).hidden = other !== tab;
    }
  };
}

document.getElementById("settings").onclick = () => chrome.runtime.openOptionsPage();
document.getElementById("save").onclick = save;
listSelect.onchange = syncNewListRow;

document.getElementById("add-list").onclick = () => {
  creatingList = true;
  renderManage();
};

(async function init() {
  const cached = await getCached();
  if (cached) {
    data = cached.data;
    render();
  }
  await prefillFromTab();
  await grabShot();

  say("loading lists…");
  try {
    ({ data } = await fetchCool());
    render();
    say("");
  } catch (error) {
    say(error.message, "error");
  }
})();
