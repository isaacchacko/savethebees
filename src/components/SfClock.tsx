'use client';

import { useEffect, useState } from 'react';

function formatSfTime(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(date)
    .toLowerCase();
}

export default function SfClock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setTime(formatSfTime(new Date()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      style={{
        color: 'var(--muted)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {time ?? ' '}
    </span>
  );
}
