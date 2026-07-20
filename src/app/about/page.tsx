import Navbar from "@/components/Navbar";
import Likes from "@/components/Likes";
import Dislikes from "@/components/Dislikes";

export default function About() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main
        style={{
          flex: 1,
          maxWidth: "42rem",
          width: "100%",
          margin: "0 auto",
          padding: "2rem 1.25rem",
        }}
      >
        <h2 style={{ marginTop: 0 }}>about</h2>
        <Likes />
        <div style={{ marginTop: "1.5rem" }}>
          <Dislikes />
        </div>
      </main>
    </div>
  );
}
