'use client';

import { useEffect, useRef, useState } from 'react';

export default function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return; // clipboard unavailable, nothing to do
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1400);
  };

  return (
    <button type="button" onClick={copy} className="copy-btn">
      {copied ? 'copied' : 'copy'}
    </button>
  );
}
