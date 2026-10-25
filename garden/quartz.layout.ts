import { PageLayout, SharedLayout } from "@basalt/cfg"
import * as Component from "@basalt/components"
import Footer from "./components/Footer"

// the explorer lists the rooms in the order the home page walks through them
const explorer = Component.Explorer({
  title: "the garden",
  folderDefaultState: "open",
  // sent to the browser as source, so no helpers: keepNames would wrap them in __name()
  sortFn: (a, b) => {
    const order = ["about", "now", "blog", "library", "running", "arch"]
    const ra = order.indexOf(a.slugSegment)
    const rb = order.indexOf(b.slugSegment)
    return (ra < 0 ? order.length : ra) - (rb < 0 ? order.length : rb) || a.displayName.localeCompare(b.displayName)
  },
})

const left = [
  Component.PageTitle(),
  Component.Island({ name: "sf-clock", inline: false, fallback: "sf" }),
  Component.MobileOnly(Component.Spacer()),
  Component.Flex({
    components: [{ Component: Component.Search(), grow: true }, { Component: Component.Darkmode() }],
  }),
  explorer,
]

export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Footer(),
}

export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs({ rootName: "home" }),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    // only the writing has a date and a reading time worth showing
    Component.ConditionalRender({
      component: Component.ContentMeta(),
      condition: (page) => page.fileData.frontmatter?.date !== undefined,
    }),
    Component.TagList(),
  ],
  left,
  right: [
    Component.GraphView({ title: "graph view" }),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs({ rootName: "home" }), Component.ArticleTitle()],
  left,
  right: [Component.GraphView({ title: "graph view" })],
}
