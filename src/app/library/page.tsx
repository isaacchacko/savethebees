import CoolLists from "@/components/CoolLists";
import { getCoolLists } from "@/lib/cool";

export const metadata = {
  title: "library — isaacchacko.com",
  description: "Lists of cool things I find.",
};

export default function LibraryPage() {
  const lists = getCoolLists();

  return (
    <>
      <p>
        things i find and want to keep. i add them from chrome as i run into
        them, so this grows on its own.
      </p>
      {lists.length === 0 ? <p>nothing here yet.</p> : <CoolLists lists={lists} />}
    </>
  );
}
