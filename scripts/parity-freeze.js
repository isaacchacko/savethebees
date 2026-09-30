// Pin everything that changes on its own, so two captures of identical markup
// produce identical pixels. Run in the page before each screenshot.
// See scripts/visual-parity.md.
document.documentElement.dataset.theme = "dryft";

let style = document.getElementById("parity-freeze");
if (!style) {
  style = document.createElement("style");
  style.id = "parity-freeze";
  document.head.append(style);
}
style.textContent = `
  *, *::before, *::after { transition: none !important; animation: none !important; }
  .titlebar > span:last-child { visibility: hidden !important; }  /* the clock */
  .cursor { opacity: 1 !important; }
  nextjs-portal { display: none !important; }                     /* dev overlay */
`;
