import { fetchCool, getConfig, rekeyPrivate, setConfig } from "./store.js";

const FIELDS = ["owner", "repo", "branch", "filePath", "site", "token", "password"];
const status = document.getElementById("status");

function say(message, tone = "") {
  status.textContent = message;
  status.dataset.tone = tone;
}

function read() {
  return Object.fromEntries(
    FIELDS.map((field) => [field, document.getElementById(field).value.trim()])
  );
}

const config = await getConfig();
for (const field of FIELDS) document.getElementById(field).value = config[field];

/**
 * A new password re-seals the private entries under it straight away, while
 * the old one is still here to open them. Saved without that, the new one
 * would open nothing and every save after would refuse.
 */
async function store() {
  const before = (await getConfig()).password;
  const next = read();
  if (next.password && next.password !== before) {
    say("re-sealing private entries…");
    await setConfig({ ...next, password: before });
    if (await rekeyPrivate(before, next.password)) {
      await setConfig(next);
      return "saved — private entries re-sealed under the new password";
    }
  }
  await setConfig(next);
  return "saved";
}

document.getElementById("save").onclick = async () => {
  try {
    say(await store(), "ok");
  } catch (error) {
    say(error.message, "error");
  }
};

document.getElementById("test").onclick = async () => {
  try {
    await store();
  } catch (error) {
    return say(error.message, "error");
  }
  say("checking…");
  try {
    const { data } = await fetchCool();
    const entries = data.lists.flatMap((list) => list.items);
    const hidden = entries.filter((item) => item.private).length;
    say(`ok — ${data.lists.length} lists, ${entries.length} entries (${hidden} private)`, "ok");
  } catch (error) {
    say(error.message, "error");
  }
};
