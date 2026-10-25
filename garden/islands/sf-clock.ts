// The time in SF, as the home page says it: "the time in san francisco is 9:41pm".
const TZ = "America/Los_Angeles"

function format(now: Date): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true })
    .format(now)
    .replace(/\s/g, "")
    .toLowerCase()
}

export function mount(el: HTMLElement) {
  const tick = () => (el.textContent = format(new Date()))
  tick()
  const timer = setInterval(tick, 10_000)
  return () => clearInterval(timer)
}
