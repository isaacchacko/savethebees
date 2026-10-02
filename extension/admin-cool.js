// The /cool page (the site's "library" tab), editable. The popup can do all of
// this too, but in a 22rem-wide popup; here every list is open at once, laid
// out as the site lays them out — hovering an entry slides its screenshot and
// note into the drawer on the right — and moving one is a drag rather than a
// trip through a submenu.
//
// Every action is its own commit through the same mutate() the popup uses, so
// the conflict handling and the screenshot cleanup come along for free.

import {
  addItem,
  addList,
  fetchCool,
  getConfig,
  moveItem,
  mutate,
  removeItem,
  removeList,
  shotRemovals,
  updateItem,
  updateList,
} from "./store.js";
import { toHtml } from "./markdown.js";

function el(tag, props = {}, children = []) {
  const node = Object.assign(document.createElement(tag), props);
  for (const child of [].concat(children)) if (child) node.append(child);
  return node;
}

function hostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// long enough to move the mouse across the gap from a link into the drawer
const CLOSE_DELAY_MS = 1000;

export function createCoolView({ root, say }) {
  let data = { lists: [] };
  let closeTimer;
  let site = "";
  let editing = null; // { listId, itemId? } — the row swapped for a form
  let adding = null; // listId whose "+ entry" form is open, or "__list__"
  let arming = null; // the delete button waiting for a second click
  let dragging = null;

  async function commit(message, apply, okMessage) {
    say("saving…");
    try {
      data = await mutate(message, apply);
      editing = null;
      adding = null;
      arming = null;
      render();
      say(okMessage, "ok");
    } catch (error) {
      say(error.message, "error");
    }
  }

  // ─────────────────────────────── entries ───────────────────────────────

  function entryForm(list, item) {
    const fields = {
      title: el("input", { type: "text", value: item?.title || "" }),
      label: el("input", {
        type: "text",
        value: item?.label || "",
        placeholder: "optional — the link reads as this",
      }),
      url: el("input", { type: "text", value: item?.url || "", placeholder: "https://" }),
      note: el("input", {
        type: "text",
        value: item?.note || "",
        placeholder: "optional — [links](url) work",
      }),
    };

    const submit = () => {
      const values = Object.fromEntries(
        Object.entries(fields).map(([key, input]) => [key, input.value.trim()])
      );
      if (!values.title && !values.url) return say("needs a title or a url", "error");

      if (item) {
        commit(
          `library: update "${values.title}" in ${list.title}`,
          (draft) => updateItem(draft, list.id, item.id, values),
          "updated"
        );
      } else {
        commit(
          `library: add "${values.title || values.url}" to ${list.title}`,
          (draft) => addItem(draft, list.id, { ...values, title: values.title || values.url }),
          `added to ${list.title}`
        );
      }
    };

    const rows = [];
    for (const [key, input] of Object.entries(fields)) {
      rows.push(el("label", { textContent: key }), input);
    }
    rows.push(
      el("div", { className: "form-actions" }, [
        el("button", { type: "button", textContent: "save", onclick: submit }),
        el("button", {
          type: "button",
          textContent: "cancel",
          onclick: () => {
            editing = null;
            adding = null;
            render();
          },
        }),
      ])
    );

    return el("div", { className: "entry-form" }, rows);
  }

  function deleteButton(key, onConfirm) {
    const armed = arming === key;
    return el("button", {
      className: "danger",
      textContent: armed ? "sure?" : "del",
      onclick: () => {
        if (armed) return onConfirm();
        arming = key;
        render();
      },
    });
  }

  // ─────────────────────────────── drawer ────────────────────────────────

  const drawerShot = el("div", { className: "cool-shot" });
  const drawerNote = el("div", { className: "cool-note" });
  const drawer = el("div", { className: "cool-drawer" }, [drawerShot, drawerNote]);
  drawer.setAttribute("aria-hidden", "true");
  drawer.dataset.open = "false";
  drawer.onmouseenter = () => clearTimeout(closeTimer);
  drawer.onmouseleave = () => closeDrawerSoon();

  /** The site's drawer, showing `item`. Thumbnails come from the live site. */
  function showInDrawer(item) {
    clearTimeout(closeTimer);
    const host = hostname(item.url);
    drawerShot.style.backgroundImage = item.shot ? `url("${site + item.shot}")` : "";
    drawerShot.replaceChildren(
      // a brand new shot is only on the site once its commit has deployed
      item.shot
        ? el("span")
        : el("span", {
            className: "cool-shot-missing",
            textContent: "no screenshot — re-save it from the popup on the page itself",
          }),
      host ? el("span", { className: "cool-host", textContent: `↗ ${host}` }) : null
    );
    // notes are markdown on the site — [links](url) work — and toHtml escapes
    drawerNote.innerHTML = item.note ? toHtml(item.note) : "";
    drawer.dataset.open = "true";
  }

  function closeDrawerSoon() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => (drawer.dataset.open = "false"), CLOSE_DELAY_MS);
  }

  function entryRow(list, item) {
    if (editing?.itemId === item.id) return entryForm(list, item);

    const host = hostname(item.url);
    const text = item.label || item.title;

    const name = item.url
      ? el("a", { href: item.url, target: "_blank", rel: "noopener noreferrer", textContent: text })
      : el("span", { className: "entry-text", textContent: text });
    name.onmouseenter = () => showInDrawer(item);
    name.onmouseleave = closeDrawerSoon;

    const favicon = el("span", { className: "favicon" });
    if (host) favicon.style.backgroundImage = `url(https://www.google.com/s2/favicons?domain=${host}&sz=32)`;

    const row = el("div", { className: "cool-row", draggable: true }, [
      el("span", { className: "bullet" }),
      favicon,
      name,
      el("button", {
        type: "button",
        textContent: "ed",
        onclick: () => {
          editing = { listId: list.id, itemId: item.id };
          render();
        },
      }),
      deleteButton(`item:${item.id}`, () =>
        commit(
          `library: remove "${item.title}" from ${list.title}`,
          (draft, files) => files.push(...shotRemovals([removeItem(draft, list.id, item.id)])),
          "removed"
        )
      ),
    ]);

    row.ondragstart = (event) => {
      dragging = { listId: list.id, itemId: item.id, title: text };
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", item.url || item.title);
      row.classList.add("dragging");
    };
    row.ondragend = () => {
      dragging = null;
      row.classList.remove("dragging");
      for (const node of root.querySelectorAll(".drop-target")) node.classList.remove("drop-target");
    };

    return row;
  }

  // ──────────────────────────────── lists ────────────────────────────────

  function listForm(list) {
    const title = el("input", { type: "text", value: list?.title || "", placeholder: "cool webrings" });
    const description = el("input", {
      type: "text",
      value: list?.description || "",
      placeholder: "optional — [links](url) work",
    });

    const submit = () => {
      const name = title.value.trim();
      if (!name) return say("name the list first", "error");
      const patch = { title: name, description: description.value.trim() };

      if (list) {
        commit(`library: rename list to "${name}"`, (draft) => updateList(draft, list.id, patch), "updated");
      } else {
        commit(
          `library: add list "${name}"`,
          (draft) => updateList(draft, addList(draft, name), patch),
          "list added"
        );
      }
    };

    return el("div", { className: "entry-form" }, [
      el("label", { textContent: "list name" }),
      title,
      el("label", { textContent: "description" }),
      description,
      el("div", { className: "form-actions" }, [
        el("button", { type: "button", textContent: "save", onclick: submit }),
        el("button", {
          type: "button",
          textContent: "cancel",
          onclick: () => {
            editing = null;
            adding = null;
            render();
          },
        }),
      ]),
    ]);
  }

  function listSection(list) {
    const head = el("div", { className: "list-bar" }, [
      el("span", { className: "label", textContent: list.title }),
      el("span", { className: "count", textContent: `${list.items.length}` }),
      el("button", {
        type: "button",
        textContent: "ed",
        onclick: () => {
          editing = { listId: list.id };
          render();
        },
      }),
      deleteButton(`list:${list.id}`, () =>
        commit(
          `library: delete list "${list.title}"`,
          (draft, files) => files.push(...shotRemovals(removeList(draft, list.id).items)),
          "list deleted"
        )
      ),
    ]);

    const editingThisList = editing?.listId === list.id && !editing.itemId;
    const body = [];

    if (editingThisList) body.push(listForm(list));
    else if (list.description) body.push(el("p", { className: "list-desc", textContent: list.description }));

    body.push(
      ...(list.items.length
        ? list.items.map((item) => entryRow(list, item))
        : [el("p", { className: "empty", textContent: "empty for now." })])
    );

    body.push(
      adding === list.id
        ? entryForm(list, null)
        : el("button", {
            type: "button",
            className: "add-entry",
            textContent: "+ entry",
            onclick: () => {
              adding = list.id;
              editing = null;
              render();
            },
          })
    );

    const section = el("section", { className: "cool-list" }, [head, ...body]);

    // a list takes any entry that is not already in it, collapsed or not
    const canTake = () => dragging && dragging.listId !== list.id;
    section.ondragover = (event) => {
      if (!canTake()) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      section.classList.add("drop-target");
    };
    section.ondragleave = (event) => {
      if (!section.contains(event.relatedTarget)) section.classList.remove("drop-target");
    };
    section.ondrop = (event) => {
      if (!canTake()) return;
      event.preventDefault();
      const { listId, itemId, title } = dragging;
      dragging = null;
      section.classList.remove("drop-target");
      commit(
        `library: move "${title}" to ${list.title}`,
        (draft) => moveItem(draft, listId, itemId, list.id),
        `moved to ${list.title}`
      );
    };

    return section;
  }

  function render() {
    const sections = data.lists.map(listSection);

    sections.push(
      adding === "__list__"
        ? el("section", { className: "cool-list" }, listForm(null))
        : el("button", {
            type: "button",
            className: "add-list",
            textContent: "+ new list",
            onclick: () => {
              adding = "__list__";
              editing = null;
              render();
            },
          })
    );

    // the drawer outlives a render, so a commit does not blink it shut
    root.replaceChildren(el("div", { className: "cool-lists" }, sections), drawer);
  }

  return {
    async load() {
      root.replaceChildren();
      say("loading…");
      try {
        site = (await getConfig()).site.replace(/\/$/, "");
        ({ data } = await fetchCool());
        editing = null;
        adding = null;
        arming = null;
        render();
        say("");
      } catch (error) {
        say(error.message, "error");
      }
    },
  };
}
