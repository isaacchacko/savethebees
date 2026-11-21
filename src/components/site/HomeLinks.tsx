"use client";

import { useEffect, useRef, useState } from "react";
import Row, { BackIcon, OnIcon } from "./Row";

const SUBDOMAINS = ["basalt.isaacchacko.com", "graph.isaacchacko.com", "jobless.isaacchacko.com"];

// The home list. Subdomains opens in place: the list slides off to the left and the subdomains slide in,
// with a breadcrumb to slide back. Blog is a real page, reached by a row that grows into it.
export default function HomeLinks() {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const back = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    back.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => {
    setOpen(false);
    opener.current?.focus({ preventScroll: true });
  };

  return (
    <nav className="panes" aria-label="Links" data-view={open ? "subdomains" : undefined}>
      <div className="pane pane-main" inert={open}>
        <ul className="rows">
          <Row href="https://dryft.ai">Founding Eng @ Dryft</Row>
          <Row href="/blog" morph="blog">
            Blog
          </Row>
          <li>
            <button
              ref={opener}
              type="button"
              className="row"
              aria-expanded={open}
              aria-controls="pane-subdomains"
              onClick={() => setOpen(true)}
            >
              <span>Subdomains</span>
              <span />
              <OnIcon />
            </button>
          </li>
          <Row href="https://aggier.ing">aggier.ing</Row>
          <Row href="https://tidaltamu.com">TIDAL</Row>
          <Row href="/Isaac_Chacko.pdf">Resume</Row>
        </ul>
        <ul className="social">
          <li>
            <a href="https://github.com/isaacchacko" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </li>
          <li>
            <a href="https://www.linkedin.com/in/isaacchacko" target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
          </li>
          <li>
            <a href="mailto:isaac.chacko05@gmail.com">Email</a>
          </li>
        </ul>
      </div>
      <div className="pane pane-sub" id="pane-subdomains" data-open={open ? "" : undefined} inert={!open}>
        <button ref={back} type="button" className="crumb" onClick={close}>
          <BackIcon />
          <span>Subdomains</span>
        </button>
        <ul className="rows">
          {SUBDOMAINS.map((host) => (
            <Row key={host} href={`https://${host}`}>
              {host}
            </Row>
          ))}
        </ul>
      </div>
    </nav>
  );
}
