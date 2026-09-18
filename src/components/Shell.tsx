import Navbar from "@/components/Navbar";
import Prompt from "@/components/Prompt";

// every page is a terminal window: titlebar nav, a prompt line naming the
// command that "produced" the page, then the output
export default function Shell({
  cmd,
  children,
}: {
  cmd: string;
  children: React.ReactNode;
}) {
  return (
    <div className="shell">
      <Navbar />
      <Prompt cmd={cmd} />
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}
