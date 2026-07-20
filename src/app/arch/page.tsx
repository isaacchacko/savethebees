import Navbar from "@/components/Navbar";

/** Place the walkthrough clip at this path under `public/`. */
const ARCH_VIDEO_SRC = "/arch/rice.mp4";

export default function ArchPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main
        style={{
          flex: 1,
          maxWidth: "42rem",
          width: "100%",
          margin: "0 auto",
          padding: "2rem 1.25rem",
        }}
      >
        <h2 style={{ marginTop: 0 }}>arch linux &amp; ricing</h2>
        <p>check out my setup!</p>

        <video
          controls
          playsInline
          preload="metadata"
          style={{
            width: "100%",
            aspectRatio: "16 / 9",
            background: "#000",
            border: "1px solid var(--border)",
            borderRadius: 4,
            display: "block",
            margin: "1.5rem 0",
          }}
        >
          <source src={ARCH_VIDEO_SRC} type="video/mp4" />
          your browser does not support the video tag.
        </video>

        <h3>stack &amp; workflow</h3>
        <ul>
          <li>
            os:{" "}
            <a href="https://archlinux.org/" target="_blank" rel="noopener noreferrer">
              arch
            </a>{" "}
            with{" "}
            <a href="https://hypr.land/" target="_blank" rel="noopener noreferrer">
              hyprland
            </a>
          </li>
          <li>
            terminal:{" "}
            <a
              href="https://sw.kovidgoyal.net/kitty/"
              target="_blank"
              rel="noopener noreferrer"
            >
              kitty
            </a>
          </li>
          <li>
            ide:{" "}
            <a href="http://www.lazyvim.org/" target="_blank" rel="noopener noreferrer">
              lazyvim
            </a>
            , a batteries-included neovim distribution
          </li>
          <li>
            status bar:{" "}
            <a href="https://waybar.org/" target="_blank" rel="noopener noreferrer">
              waybar
            </a>
          </li>
        </ul>

        <h3>tools worth naming</h3>
        <ul>
          <li>
            <a
              href="https://yazi-rs.github.io/"
              target="_blank"
              rel="noopener noreferrer"
            >
              yazi
            </a>{" "}
            for vim-style browsing in the terminal
          </li>
          <li>
            <a
              href="https://github.com/lsd-rs/lsd"
              target="_blank"
              rel="noopener noreferrer"
            >
              lsd
            </a>{" "}
            for prettier ls output with colors and icons
          </li>
          <li>
            <a
              href="https://github.com/fastfetch-cli/fastfetch"
              target="_blank"
              rel="noopener noreferrer"
            >
              fastfetch
            </a>{" "}
            to replace neofetch
          </li>
          <li>
            <a
              href="https://github.com/nsxiv/nsxiv"
              target="_blank"
              rel="noopener noreferrer"
            >
              nsxiv
            </a>{" "}
            for my wallpaper selector
          </li>
          <li>
            <a
              href="https://github.com/dylanaraps/pywal"
              target="_blank"
              rel="noopener noreferrer"
            >
              pywal
            </a>{" "}
            to generate color schemes
          </li>
        </ul>

        <h3>wallpapers &amp; colors</h3>
        <p>
          i pull wallpapers from{" "}
          <a href="https://wallhaven.cc" target="_blank" rel="noopener noreferrer">
            wallhaven.cc
          </a>{" "}
          and sync palettes across apps.
        </p>

        <h3>more reading</h3>
        <ul>
          <li>
            curated setups and inspiration live on communities like{" "}
            <a
              href="https://www.reddit.com/r/unixporn/"
              target="_blank"
              rel="noopener noreferrer"
            >
              reddit
            </a>
          </li>
          <li>
            nice nerd fonts and glyphs to choose from over at{" "}
            <a
              href="https://www.nerdfonts.com/#home"
              target="_blank"
              rel="noopener noreferrer"
            >
              nerdfonts.com
            </a>
          </li>
          <li>
            nice neovim plugins and colorschemes at{" "}
            <a href="https://nvim.store/" target="_blank" rel="noopener noreferrer">
              nvim.store
            </a>
          </li>
        </ul>

        <h3>dotfiles?</h3>
        <p>
          sorry for gatekeeping my configuration files! i&apos;ve never gotten
          around to cleaning them up and uploading them, so they&apos;re on
          request for now.
        </p>
      </main>
    </div>
  );
}
