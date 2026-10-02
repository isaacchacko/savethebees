'use client';

import { useEffect, useState } from 'react';

const TZ = 'America/Los_Angeles';

/** "9:41 pm utc−7" */
function formatSfTime(date: Date) {
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(date)
    .toLowerCase();
  const offset =
    new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'shortOffset' })
      .formatToParts(date)
      .find((part) => part.type === 'timeZoneName')?.value ?? '';
  return `${time} ${offset.replace('GMT', 'utc').replace('-', '−')}`;
}

export default function SfClock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setTime(formatSfTime(new Date()));
    update();
    const id = setInterval(update, 10_000);
    return () => clearInterval(id);
  }, []);

  return <span className="clock">{time ?? ' '}</span>;
}
