// A button that copies `value`: <island name="copy" value="..."></island>
export function mount(el: HTMLElement, { value }: { value: string }) {
  const button = document.createElement("button")
  button.type = "button"
  button.className = "copy-btn"
  button.textContent = "copy"
  let timer: ReturnType<typeof setTimeout> | undefined
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      return
    }
    button.textContent = "copied"
    clearTimeout(timer)
    timer = setTimeout(() => (button.textContent = "copy"), 1400)
  })
  el.replaceChildren(button)
  return () => clearTimeout(timer)
}
