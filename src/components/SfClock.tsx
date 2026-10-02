'use client';

import { useEffect, useState } from 'react';

const TZ = 'America/Los_Angeles';

/** "9:41 pm" in a time zone. */
const clockTime = (date: Date, timeZone: string) =>
  new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: '2-digit', hour12: true })
    .format(date)
    .toLowerCase();

/** "9:41 pm utc−7" */
function formatSfTime(date: Date) {
  const time = clockTime(date, TZ);
  const offset =
    new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'shortOffset' })
      .formatToParts(date)
      .find((part) => part.type === 'timeZoneName')?.value ?? '';
  return `${time} ${offset.replace('GMT', 'utc').replace('-', '−')}`;
}

/**
 * The time in SF, with its offset from utc. A phone's footer has no room for
 * the offset, so it shows just the local time there, "9:41pm" (globals.css
 * picks which).
 */
export default function SfClock() {
  const [time, setTime] = useState<{ full: string; short: string } | null>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime({ full: formatSfTime(now), short: clockTime(now, TZ).replace(' ', '') });
    };
    update();
    const id = setInterval(update, 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="clock">
      <span className="clock-full">{time?.full ?? ' '}</span>
      <span className="clock-short">{time?.short ?? ' '}</span>
    </span>
  );
}
