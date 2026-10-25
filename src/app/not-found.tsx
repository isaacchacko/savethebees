import { redirect } from "next/navigation";

// a page nothing answers gets the garden's own 404 page (built into public/)
export default function NotFound() {
  redirect("/404.html");
}
