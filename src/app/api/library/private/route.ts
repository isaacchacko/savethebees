import { openPrivateEntries } from "@/lib/privateLibrary";

// POST rather than GET so the password rides in the body, not in a url that
// ends up in access logs and browser history.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password) return Response.json({ error: "no password" }, { status: 400 });

  const entries = await openPrivateEntries(password);
  if (!entries) return Response.json({ error: "wrong password" }, { status: 401 });
  return Response.json({ entries }, { headers: { "Cache-Control": "no-store" } });
}
