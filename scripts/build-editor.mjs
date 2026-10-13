// Bundles extension/editor.src.js into extension/editor.js, the one file the
// admin page loads. Run `npm run build:editor` after changing either the source
// or the editor dependencies, and commit the output.
//
// codemirror-live-markdown's dist inlines all of highlight.js (~1.5mb) for its
// code-block plugin, even though it lists lowlight as an optional peer. We do
// not use that plugin, so the inlined copy is cut out here and lowlight is
// stubbed as unavailable, which is the state the library already handles.

import { build } from "esbuild";
import { readFile } from "node:fs/promises";

const LIBRARY = /codemirror-live-markdown[\\/]dist[\\/]index\.js$/;
const START = "// node_modules/highlight.js/";
const END = "// src/core/";

const stripHighlighter = {
  name: "strip-highlighter",
  setup(build) {
    build.onLoad({ filter: LIBRARY }, async ({ path }) => {
      const source = await readFile(path, "utf8");
      const start = source.indexOf(START);
      const lowlight = source.indexOf("var init_lowlight", start);
      const end = source.indexOf(END, lowlight);
      if (start < 0 || lowlight < 0 || end < 0) {
        throw new Error("codemirror-live-markdown's layout changed; update scripts/build-editor.mjs");
      }

      // the slice between the end of init_lowlight and src/core is the
      // library's own code (its facets and fields), so keep it
      const lowlightEnd = source.indexOf("\n});\n", lowlight) + "\n});\n".length;
      const stub =
        "var lowlight_exports = {};\n" +
        'var init_lowlight = () => { throw new Error("lowlight is not bundled"); };\n';
      return {
        contents: source.slice(0, start) + stub + source.slice(lowlightEnd),
        loader: "js",
      };
    });
  },
};

await build({
  entryPoints: ["extension/editor.src.js"],
  outfile: "extension/editor.js",
  bundle: true,
  format: "esm",
  minify: true,
  legalComments: "none",
  plugins: [stripHighlighter],
  logLevel: "info",
});
