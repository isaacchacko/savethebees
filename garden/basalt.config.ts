// The garden's own additions to Basalt on Astro (quartz.config.ts is the
// Quartz build's, kept until the move is done). `private: true` needs nothing
// here: Basalt leaves private notes unpublished.

import type { Root } from "mdast"
import { toString } from "mdast-util-to-string"

/**
 * The site's pages open with their title as a `# heading` (content/pages has
 * no frontmatter, and the extension writes dumps that way). That heading is
 * the note's title, not its first section: it becomes the title, unless the
 * frontmatter has one, and leaves the body so it isn't shown twice.
 */
function leadingTitle() {
  return (tree: Root, file: { stem?: string; data: { astro?: { frontmatter?: Record<string, unknown> } } }) => {
    const first = tree.children.findIndex((n) => n.type !== "yaml" && n.type !== "html")
    const node = tree.children[first]
    if (!node || node.type !== "heading" || node.depth !== 1) return
    const heading = toString(node).trim()
    const fm = file.data.astro?.frontmatter
    if (!fm) return
    // a note without a title is titled after its file name
    const title = typeof fm.title === "string" ? fm.title : undefined
    const untitled = !title || title === file.stem
    if (!untitled && title.toLowerCase() !== heading.toLowerCase()) return
    if (untitled) fm.title = heading
    tree.children.splice(first, 1)
  }
}

export default {
  markdown: { remarkPlugins: [leadingTitle] },
}
