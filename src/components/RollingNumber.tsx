/**
 * A number whose digits roll to their new value like an odometer: each digit
 * is a column of 0–9 slid to the right one. Columns are keyed from the right,
 * so the ones place stays the ones place as the number grows a digit.
 */
export default function RollingNumber({ value }: { value: number }) {
  const digits = String(Math.max(0, Math.round(value))).split('');
  return (
    <span className="roll" role="text" aria-label={String(value)}>
      {digits.map((d, i) => (
        <span key={digits.length - 1 - i} className="roll-digit" aria-hidden>
          <span className="roll-strip" style={{ transform: `translateY(${-Number(d) * 10}%)` }}>
            {'0123456789'.split('').map((n) => (
              <span key={n}>{n}</span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}
