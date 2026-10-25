import { QuartzConfig } from "@basalt/cfg"
import * as Plugin from "@basalt/plugins"
import { KeepPrivate, LeadingTitle } from "./plugins/notes"

/**
 * isaacchacko.com, built with Basalt (~/Programs/basalt), a fork of Quartz:
 *
 *   cd ~/Programs/basalt && npx quartz build --site <this folder> --serve
 *
 * The notes come from where the rest of the repo keeps them (basalt.json):
 * content/pages and content/dumps, which the chrome extension writes to, plus
 * the pages only the garden has, in notes/.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "isaacchacko.com",
    pageTitleSuffix: " — isaacchacko.com",
    enableSPA: true,
    enablePopovers: true,
    analytics: null,
    locale: "en-US",
    baseUrl: "isaacchacko.com",
    ignorePatterns: ["private", "templates", ".obsidian", "*.tex"],
    defaultDateType: "created",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        title: "DM Serif Display",
        header: "DM Serif Display",
        body: "Bricolage Grotesque",
        code: "JetBrains Mono",
      },
      // cream paper, ink-blue text, a terracotta accent: the garden redesign's palette
      colors: {
        lightMode: {
          light: "#f5eedd",
          lightgray: "#e3d9c0",
          gray: "#9a8e76",
          darkgray: "#2d4673",
          dark: "#16294e",
          secondary: "#284d78",
          tertiary: "#c8482b",
          highlight: "#c8482b1a",
          textHighlight: "#f4c84b88",
        },
        darkMode: {
          light: "#06182f",
          lightgray: "#122845",
          gray: "#7191b8",
          darkgray: "#caddf4",
          dark: "#eef4fc",
          secondary: "#8fb9de",
          tertiary: "#e0552f",
          highlight: "#e0552f24",
          textHighlight: "#c9542f55",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      LeadingTitle(),
      Plugin.CreatedModifiedDate({ priority: ["frontmatter", "filesystem"] }),
      Plugin.SyntaxHighlighting({
        theme: { light: "github-light", dark: "github-dark" },
        keepBackground: false,
      }),
      Plugin.Diagrams(),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false, enableYouTubeEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Embeds(),
      Plugin.Islands(),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts(), KeepPrivate()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({ enableSiteMap: true, enableRSS: true }),
      Plugin.Assets(),
      Plugin.IslandBundles(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
    ],
  },
}

export default config
