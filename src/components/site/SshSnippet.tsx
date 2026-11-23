"use client";

import { useState } from "react";

const COMMAND = "ssh isaacchacko.com";

export default function SshSnippet() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(COMMAND);
    } catch {
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <span className="ssh">
      <span className="ssh-prompt" aria-hidden="true">
        $
      </span>
      <code>{COMMAND}</code>
      <button type="button" onClick={copy} aria-label={copied ? "Copied" : "Copy command"}>
        {copied ? (
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 8.5l3 3 7-7" />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
            <path d="M10.5 3.5v-.5A1.5 1.5 0 0 0 9 1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5" />
          </svg>
        )}
      </button>
    </span>
  );
}
