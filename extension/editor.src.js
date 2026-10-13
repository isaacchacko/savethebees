// The admin page's markdown editor: CodeMirror 6 with Obsidian-style live
// preview, so the file's own text is what you edit and markdown syntax only
// shows on the line your cursor is in. Chrome extensions cannot load remote
// code and this one has no bundler, so `npm run build:editor` bundles this
// file and everything it imports into editor.js, which is committed.

import { EditorState, RangeSetBuilder } from "@codemirror/state";
import { EditorView, ViewPlugin, Decoration, highlightActiveLine, keymap } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdownLanguage, markdownKeymap } from "@codemirror/lang-markdown";
import {
  collapseOnSelectionFacet,
  editorTheme,
  linkPlugin,
  livePreviewPlugin,
  markdownStylePlugin,
  mouseSelectingField,
  setMouseSelecting,
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
      for (let line = first; line <= last; line++) classes.set(state.doc.line(line).from, name);
    },
  });

  const builder = new RangeSetBuilder();
  for (const [from, name] of [...classes].sort((a, b) => a[0] - b[0])) {
    builder.add(from, from, Decoration.line({ class: name }));
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

/**
 * Mount an editor in `parent`. `onChange` fires on every edit with the new
 * text; `onSave` on mod-s.
 */
export function createEditor({ parent, onChange, onSave }) {
  const extensions = [
    history(),
    keymap.of([
      { key: "Mod-s", preventDefault: true, run: () => (onSave(), true) },
      ...markdownKeymap,
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
