// The time in SF, with its offset from utc: "sf · 9:41 pm, utc−7".
const TZ = "America/Los_Angeles"

function format(now: Date): string {
  const time = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true })
    .format(now)
    .toLowerCase()
  const offset =
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, timeZoneName: "shortOffset" })
      .formatToParts(now)
      .find((p) => p.type === "timeZoneName")?.value ?? ""
  return `sf · ${time}, ${offset.replace("GMT", "utc").replace("-", "−")}`
}

export function mount(el: HTMLElement) {
  const tick = () => (el.textContent = format(new Date()))
  tick()
  const timer = setInterval(tick, 10_000)
  return () => clearInterval(timer)
}
