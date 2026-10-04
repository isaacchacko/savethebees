import fs from "fs";
import path from "path";
import type { CoolItem } from "@/lib/cool";

// The site's half of the sealed format the extension writes (extension/store.js,
// "private entries"). The repo is public, so private entries are committed only
// as ciphertext: PBKDF2-SHA256 → AES-GCM under the library password. There is
// no copy of the password anywhere server side — the password a visitor types
// either opens the file or it does not.

const PRIVATE_FILE = path.join(process.cwd(), "content/cool-private.json");

type Sealed = { v: 1; iterations: number; salt: string; iv: string; data: string };

/** A private entry and where it sits among its list's entries. */
export type PrivateEntry = { list: string; index: number; item: CoolItem };

const bytes = (base64: string) => Uint8Array.from(Buffer.from(base64, "base64"));

async function unseal(sealed: Sealed, password: string): Promise<string> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: bytes(sealed.salt), iterations: sealed.iterations },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: bytes(sealed.iv) },
    key,
    bytes(sealed.data)
  );
  return new TextDecoder().decode(plain);
}

/**
 * The private entries, or null when `password` does not open them — including
 * when there is no sealed file at all, so a wrong guess and an empty library
 * look the same from outside.
 */
export async function openPrivateEntries(password: string): Promise<PrivateEntry[] | null> {
  if (!fs.existsSync(PRIVATE_FILE)) return null;
  try {
    const sealed = JSON.parse(fs.readFileSync(PRIVATE_FILE, "utf8")) as Sealed;
    const { items } = JSON.parse(await unseal(sealed, password)) as { items: PrivateEntry[] };
    return Array.isArray(items) ? items : [];
  } catch {
    return null;
  }
}
