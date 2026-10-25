import { Root } from "mdast"
import { toString } from "mdast-util-to-string"
import { QuartzFilterPlugin, QuartzTransformerPlugin } from "@basalt/plugins/types"

/**
 * The site's pages open with their title as a `# heading` (content/pages has
 * no frontmatter, and the extension writes dumps that way). That heading is
 * the note's title, not its first section: it becomes the title, unless the
 * frontmatter has one, and leaves the body so it isn't shown twice.
 */
export const LeadingTitle: QuartzTransformerPlugin = () => ({
  name: "LeadingTitle",
  markdownPlugins() {
    return [
      () => (tree: Root, file) => {
        const first = tree.children.findIndex((n) => n.type !== "yaml" && n.type !== "html")
        const node = tree.children[first]
        if (!node || node.type !== "heading" || node.depth !== 1) return
        const heading = toString(node).trim()
        const fm = file.data.frontmatter
        if (!fm) return
        // the frontmatter plugin titles a note without one after its file name
        const untitled = fm.title === file.stem
        if (!untitled && fm.title?.toLowerCase() !== heading.toLowerCase()) return
        if (untitled) fm.title = heading
        tree.children.splice(first, 1)
      },
    ]
  },
})

/** `private: true` keeps a dump off the site, the way the next.js site does. */
export const KeepPrivate: QuartzFilterPlugin = () => ({
  name: "KeepPrivate",
  shouldPublish(_ctx, [_tree, vfile]) {
    const flag = vfile.data?.frontmatter?.private
    return !(flag === true || flag === "true")
  },
})
