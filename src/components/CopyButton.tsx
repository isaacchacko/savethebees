'use client';

import { useState } from 'react';
import { FiCheck, FiCopy } from 'react-icons/fi';

export default function CopyButton({
  value,
  label = 'copy',
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable, nothing to do
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="copy-btn"
      data-copied={copied ? 'true' : 'false'}
      aria-label={copied ? 'copied' : label}
      title={copied ? 'copied' : label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        marginLeft: '0.35em',
        padding: 0,
        border: 0,
        background: 'none',
        cursor: 'pointer',
        lineHeight: 0,
        fontSize: 'inherit',
      }}
    >
      {copied ? (
        <FiCheck size="1em" aria-hidden />
      ) : (
        <FiCopy size="1em" aria-hidden />
      )}
    </button>
  );
}
