import { fetchCool, getConfig, setConfig } from "./store.js";
import { followTheme } from "./themes.js";

followTheme();

const FIELDS = ["owner", "repo", "branch", "filePath", "token"];
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

document.getElementById("save").onclick = async () => {
  await setConfig(read());
  say("saved", "ok");
};

document.getElementById("test").onclick = async () => {
  await setConfig(read());
  say("checking…");
  try {
    const { data } = await fetchCool();
    const items = data.lists.reduce((total, list) => total + list.items.length, 0);
    say(`ok — ${data.lists.length} lists, ${items} entries`, "ok");
  } catch (error) {
    say(error.message, "error");
  }
};
