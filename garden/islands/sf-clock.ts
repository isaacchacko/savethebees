// The time in SF, as the home page says it: "The time in San Francisco is 9:41 PM".
const TZ = "America/Los_Angeles"

function format(now: Date): string {
  // Intl puts a narrow no-break space before AM/PM; a plain one matches the text
  return new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true })
    .format(now)
    .replace(/\s/g, " ")
}

export function mount(el: HTMLElement) {
  const tick = () => (el.textContent = format(new Date()))
  tick()
  const timer = setInterval(tick, 10_000)
  return () => clearInterval(timer)
}
