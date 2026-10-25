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
        grown by isaac with basalt, a fork of{" "}
        <a href="https://quartz.jzhao.xyz" target="_blank" rel="noopener noreferrer">
          quartz
        </a>
        , with a nod to{" "}
        <a href="https://jzhao.xyz" target="_blank" rel="noopener noreferrer">
          jzhao.xyz
        </a>{" "}
        © {new Date().getFullYear()}
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
