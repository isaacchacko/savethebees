// The admin page's markdown editor: CodeMirror 6 with Obsidian-style live
// preview, so the file's own text is what you edit and markdown syntax only
// shows on the line your cursor is in. Chrome extensions cannot load remote
// code and this one has no bundler, so `npm run build:editor` bundles this
// file and everything it imports into editor.js, which is committed.

import { EditorState, RangeSetBuilder } from "@codemirror/state";
import { EditorView, ViewPlugin, Decoration, WidgetType, highlightActiveLine, keymap } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdownLanguage, markdownKeymap } from "@codemirror/lang-markdown";
import {
  collapseOnSelectionFacet,
  editorTheme,
  linkPlugin,
  livePreviewPlugin,
  markdownStylePlugin,
  mouseSelectingField,
  setMouseSelecting,
  shouldShowSource,
} from "codemirror-live-markdown";

// The live preview library only marks heading text, not which line a heading,
// bullet or fence sits on, and the site's look hangs on the line: a rule above
// a section heading, a drawn bullet in front of a list item.
const LINE_CLASSES = {
  ATXHeading1: "md-h1",
  ATXHeading2: "md-h2",
  ATXHeading3: "md-h3",
  ListItem: "md-li",
  FencedCode: "md-fence",
};

/**
 * A sub-item's indent is typed spaces, so the drawn bullet has to move over by
 * the same amount to sit in front of its text rather than at the margin.
 */
function listItem(node, text) {
  let nested = false;
  for (let parent = node.node.parent; parent; parent = parent.parent) {
    if (parent.name === "ListItem") nested = true;
  }
  const indent = /^\s*/.exec(text)[0].length;
  return Decoration.line({
    class: nested ? "md-li md-li-nested" : "md-li",
    attributes: { style: `--indent: ${indent}ch` },
  });
}

function lineClasses(view) {
  const { state } = view;
  const classes = new Map();
  syntaxTree(state).iterate({
    enter(node) {
      const name = LINE_CLASSES[node.name];
      if (!name) return;
      const first = state.doc.lineAt(node.from).number;
      // a list item's wrapped continuation lines are not new bullets
      const last = node.name === "FencedCode" ? state.doc.lineAt(node.to).number : first;
      for (let line = first; line <= last; line++) {
        const { from, text } = state.doc.line(line);
        classes.set(from, name === "md-li" ? listItem(node, text) : Decoration.line({ class: name }));
      }
    },
  });

  const builder = new RangeSetBuilder();
  for (const [from, decoration] of [...classes].sort((a, b) => a[0] - b[0])) {
    builder.add(from, from, decoration);
  }
  return builder.finish();
}

const lineClassPlugin = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.decorations = lineClasses(view);
    }
    update(update) {
      if (update.docChanged || update.viewportChanged) this.decorations = lineClasses(update.view);
    }
  },
  { decorations: (plugin) => plugin.decorations }
);

// The library has an image preview, but it can only prefix a src with a fixed
// base path. A pasted image is not on the site until it is committed and
// deployed, so where to load one from is the caller's call: `resolveImage`
// gives the urls to try, in order.
class ImageWidget extends WidgetType {
  constructor(src, alt, resolveImage) {
    super();
    this.src = src;
    this.alt = alt;
    this.resolveImage = resolveImage;
  }

  eq(other) {
    return other.src === this.src && other.alt === this.alt;
  }

  toDOM() {
    const img = document.createElement("img");
    img.className = "md-img";
    img.alt = this.alt;
    const candidates = this.resolveImage(this.src);
    img.onerror = () => {
      if (candidates.length) img.src = candidates.shift();
    };
    img.src = candidates.shift();
    return img;
  }

  ignoreEvent() {
    return false;
  }
}

const IMAGE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;

function imageDecorations(view, resolveImage) {
  const { state } = view;
  const builder = new RangeSetBuilder();
  syntaxTree(state).iterate({
    enter(node) {
      if (node.name !== "Image") return;
      if (shouldShowSource(state, node.from, node.to)) return; // false mid-drag
      const match = IMAGE.exec(state.doc.sliceString(node.from, node.to));
      if (!match) return;
      const widget = new ImageWidget(match[2], match[1], resolveImage);
      builder.add(node.from, node.to, Decoration.replace({ widget }));
    },
  });
  return builder.finish();
}

function imagePlugin(resolveImage) {
  return ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.decorations = imageDecorations(view, resolveImage);
      }
      update(update) {
        const moved = update.docChanged || update.selectionSet || update.viewportChanged;
        const dragged = update.transactions.some((tr) => tr.effects.length);
        if (moved || dragged) this.decorations = imageDecorations(update.view, resolveImage);
      }
    },
    { decorations: (plugin) => plugin.decorations }
  );
}

/**
 * Enter on an empty top-level bullet leaves the list. CodeMirror's own version
 * only clears the "- ", so whatever you type next sits on the very next line —
 * which markdown reads as more of the last bullet, not a new paragraph. This
 * leaves the blank line in between. An empty sub-item is left to CodeMirror,
 * which moves it out a level.
 */
function leaveList(view) {
  const { state } = view;
  const { empty, head } = state.selection.main;
  const line = state.doc.lineAt(head);
  if (!empty || head !== line.to || !/^[-*+]\s*$/.test(line.text)) return false;
  view.dispatch({
    changes: { from: line.from, to: line.to, insert: "\n" },
    selection: { anchor: line.from + 1 },
  });
  return true;
}

const PASTABLE = ["image/png", "image/jpeg", "image/gif", "image/webp"];

/**
 * Mount an editor in `parent`. `onChange` fires on every edit with the new
 * text; `onSave` on mod-s. `onPasteImage` gets a pasted image file and
 * resolves to the markdown to insert for it; `resolveImage` maps an image's
 * src to the urls to load its preview from.
 */
export function createEditor({ parent, onChange, onSave, onPasteImage, resolveImage }) {
  const extensions = [
    history(),
    keymap.of([
      { key: "Mod-s", preventDefault: true, run: () => (onSave(), true) },
      { key: "Enter", run: leaveList },
      ...markdownKeymap,
      indentWithTab, // tab / shift-tab nest and un-nest a bullet
      ...historyKeymap,
      ...defaultKeymap,
    ]),
    markdownLanguage, // the language alone: markdown() would also bundle html, css and js parsers
    EditorView.lineWrapping,
    highlightActiveLine(),
    collapseOnSelectionFacet.of(true),
    mouseSelectingField,
    livePreviewPlugin,
    markdownStylePlugin,
    linkPlugin({ openInNewTab: true }),
    imagePlugin(resolveImage),
    EditorView.domEventHandlers({
      paste(event, view) {
        const file = [...event.clipboardData.files].find((f) => PASTABLE.includes(f.type));
        if (!file) return false;
        event.preventDefault();
        onPasteImage(file).then((markdown) => {
          if (markdown) view.dispatch(view.state.replaceSelection(markdown));
        });
        return true;
      },
    }),
    lineClassPlugin,
    editorTheme,
    EditorView.updateListener.of((update) => {
      if (update.docChanged) onChange(update.state.doc.toString());
    }),
  ];

  const view = new EditorView({ parent, state: EditorState.create({ extensions }) });

  // the live preview holds markup back while a drag selection is in progress,
  // so it does not jump under the pointer
  view.contentDOM.addEventListener("mousedown", () => {
    view.dispatch({ effects: setMouseSelecting.of(true) });
  });
  document.addEventListener("mouseup", () => {
    requestAnimationFrame(() => view.dispatch({ effects: setMouseSelecting.of(false) }));
  });

  return {
    text: () => view.state.doc.toString(),
    /** A fresh document with its own undo history; not an edit, so no onChange. */
    load(text) {
      view.setState(EditorState.create({ doc: text, extensions }));
    },
  };
}
