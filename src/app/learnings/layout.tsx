import Navbar from "@/components/Navbar";

export default function LearningsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        {children}
      </main>
    </div>
  );
}
