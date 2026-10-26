import { createHash } from "crypto";
import { neon } from "@neondatabase/serverless";

const NAME_LIMIT = 40;
const MESSAGE_LIMIT = 280;

const db = () => neon(process.env.DATABASE_URL!);

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

// who signed, for one signature a minute each, kept as a hash rather than an ip
const visitorOf = (request: Request) =>
  createHash("sha256")
    .update(`guestbook:${request.headers.get("x-forwarded-for")?.split(",")[0] ?? ""}`)
    .digest("hex");

const refuse = (error: string, status = 400) => Response.json({ error }, { status });

export async function GET() {
  const entries = await db()`
    SELECT id, name, message, created_at FROM guestbook ORDER BY created_at DESC LIMIT 500`;
  return Response.json({ entries }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const name = text(body?.name);
  const message = text(body?.message);
  if (!name || name.length > NAME_LIMIT) return refuse(`A name, up to ${NAME_LIMIT} characters.`);
  if (!message || message.length > MESSAGE_LIMIT) return refuse(`A message, up to ${MESSAGE_LIMIT} characters.`);

  // only a bot fills in the field people can't see: it's told it worked
  if (text(body?.website)) {
    return Response.json({ entry: { id: 0, name, message, created_at: new Date().toISOString() } }, { status: 201 });
  }

  const visitor = visitorOf(request);
  const [recent] = await db()`
    SELECT count(*)::int AS signatures FROM guestbook
    WHERE visitor = ${visitor} AND created_at > now() - interval '1 minute'`;
  if (recent.signatures > 0) return refuse("One signature a minute, please.", 429);

  const [entry] = await db()`
    INSERT INTO guestbook (name, message, visitor) VALUES (${name}, ${message}, ${visitor})
    RETURNING id, name, message, created_at`;
  return Response.json({ entry }, { status: 201 });
}
