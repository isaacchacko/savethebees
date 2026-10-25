import Card from "@/components/Card";
import { PrivateLibraryProvider } from "@/components/PrivateLibrary";
import Stage from "@/components/Stage";

// the card lives here rather than in each page so it survives navigation —
// that is what lets it resize and slide between tabs instead of reloading
export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <Stage>
      <PrivateLibraryProvider>
        <Card>{children}</Card>
      </PrivateLibraryProvider>
    </Stage>
  );
}
