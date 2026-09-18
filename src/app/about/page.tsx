import Shell from "@/components/Shell";
import Likes from "@/components/Likes";
import Dislikes from "@/components/Dislikes";

export default function About() {
  return (
    <Shell cmd="cat about.txt">
      <h2 style={{ marginTop: 0 }}>about</h2>
      <Likes />
      <div style={{ marginTop: "1.5rem" }}>
        <Dislikes />
      </div>
    </Shell>
  );
}
