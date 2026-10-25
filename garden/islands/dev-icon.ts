// While serving locally, the tab says "wq" (notes/assets/icon-dev.svg) instead
// of the site's "ic", so it can't be mistaken for isaacchacko.com. Footer.astro
// mounts it only in dev.
export function mount() {
  document.querySelector<HTMLLinkElement>('link[rel="icon"]')!.href = "/assets/icon-dev.svg"
}
