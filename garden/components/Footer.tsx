import { QuartzComponent, QuartzComponentConstructor } from "@basalt/components/types"

const SOCIALS = [
  { href: "/Isaac_Chacko.pdf", label: "resume" },
  { href: "https://www.github.com/isaacchacko", label: "github" },
  { href: "https://www.linkedin.com/in/isaacchacko", label: "linkedin" },
]

export default (() => {
  const Footer: QuartzComponent = () => (
    <footer class="garden-footer">
      <p>
        made with{" "}
        <a href="https://basalt.isaacchacko.com" target="_blank" rel="noopener noreferrer">
          basalt
        </a>
      </p>
      <ul>
        {SOCIALS.map((s) => (
          <li>
            <a href={s.href} target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </footer>
  )
  return Footer
}) satisfies QuartzComponentConstructor
