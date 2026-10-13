// Markdown to HTML for the library's notes, plus the front matter helpers the
// post editor uses. The editor itself edits markdown text directly (editor.js),
// so nothing here has to turn a DOM back into markdown.

const ESCAPE_HTML = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };

function escapeHtml(text) {
  return text.replace(/[&<>"]/g, (c) => ESCAPE_HTML[c]);
}

// ──────────────────────────────── md → html ────────────────────────────────

function inlineToHtml(md) {
  let out = "";
  let i = 0;

  while (i < md.length) {
    const rest = md.slice(i);

    if (rest[0] === "\\" && /[\\`*[\]]/.test(rest[1] || "")) {
      out += escapeHtml(rest[1]);
      i += 2;
      continue;
    }

    const code = /^`([^`]+)`/.exec(rest);
    if (code) {
      out += `<code>${escapeHtml(code[1])}</code>`;
      i += code[0].length;
      continue;
    }

    const link = /^\[([^\]]*)\]\(([^)\s]*)\)/.exec(rest);
    if (link) {
      const external = /^https?:/.test(link[2]);
      const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : "";
      out += `<a href="${escapeHtml(link[2])}"${attrs}>${inlineToHtml(link[1])}</a>`;
      i += link[0].length;
      continue;
    }

    const bold = /^\*\*([^*]+)\*\*/.exec(rest);
    if (bold) {
      out += `<strong>${inlineToHtml(bold[1])}</strong>`;
      i += bold[0].length;
      continue;
    }

    const italic = /^\*([^*]+)\*/.exec(rest);
    if (italic) {
      out += `<em>${inlineToHtml(italic[1])}</em>`;
      i += italic[0].length;
      continue;
    }

    out += escapeHtml(rest[0]);
    i += 1;
  }

  return out;
}

/** Blank lines separate blocks, except inside a fence where they are content. */
function splitBlocks(markdown) {
  const blocks = [];
  let buffer = [];
  let fenced = false;

  const flush = () => {
    if (buffer.length) blocks.push(buffer.join("\n"));
    buffer = [];
  };

  for (const line of markdown.split("\n")) {
    if (/^\s*```/.test(line)) {
      if (fenced) {
        buffer.push(line);
        fenced = false;
        flush();
      } else {
        flush();
        fenced = true;
        buffer.push(line);
      }
      continue;
    }
    if (fenced) buffer.push(line);
    else if (!line.trim()) flush();
    else buffer.push(line);
  }
  flush();

  return blocks;
}

export function toHtml(markdown) {
  const blocks = splitBlocks(markdown.replace(/\r\n/g, "\n").trim());

  return blocks
    .map((block) => {
      const lines = block.split("\n");

      if (/^\s*```/.test(lines[0])) {
        const lang = lines[0].replace(/^\s*```/, "").trim();
        const closed = /^\s*```\s*$/.test(lines[lines.length - 1]);
        const body = lines.slice(1, closed ? -1 : undefined).join("\n");
        return `<pre data-lang="${escapeHtml(lang)}"><code>${escapeHtml(body)}</code></pre>`;
      }

      const heading = /^(#{1,6})\s+(.*)$/.exec(lines[0]);
      if (heading && lines.length === 1) {
        const level = heading[1].length;
        return `<h${level}>${inlineToHtml(heading[2])}</h${level}>`;
      }

      if (lines.every((line) => /^[-*]\s+/.test(line))) {
        const items = lines
          .map((line) => `<li>${inlineToHtml(line.replace(/^[-*]\s+/, ""))}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }

      return `<p>${inlineToHtml(lines.join(" "))}</p>`;
    })
    .join("");
}

// ─────────────────────────── front matter passthrough ───────────────────────

/** Learnings carry yaml front matter the editor must not touch. */
export function splitFrontMatter(markdown) {
  const match = /^(---\n[\s\S]*?\n---\n)([\s\S]*)$/.exec(markdown);
  return match ? { front: match[1], body: match[2] } : { front: "", body: markdown };
}

// ────────────────────────────── front matter ──────────────────────────────
// gray-matter reads these on the site, so keep to plain `key: value` and quote
// anything that would otherwise change the meaning.

export function parseFrontMatter(front) {
  const fields = {};
  for (const line of front.split("\n")) {
    const match = /^(\w+):\s*(.*)$/.exec(line);
    if (!match) continue;
    let value = match[2].trim();
    if (/^".*"$/.test(value) || /^'.*'$/.test(value)) {
      try {
        value = JSON.parse(value.replace(/^'|'$/g, '"'));
      } catch {
        value = value.slice(1, -1);
      }
    }
    fields[match[1]] = value;
  }
  return fields;
}

function yamlValue(value) {
  const text = String(value ?? "");
  // a colon-space, a leading #, or edge whitespace would all change the parse
  return /:\s|^#|^\s|\s$|^$|^["'[{]/.test(text) ? JSON.stringify(text) : text;
}

export function buildFrontMatter(fields) {
  const lines = Object.entries(fields)
    .filter(([, value]) => String(value ?? "").length)
    .map(([key, value]) => `${key}: ${yamlValue(value)}`);
  return lines.length ? `---\n${lines.join("\n")}\n---\n\n` : "";
}

/** A filename for a write-up, from its title. */
export function slugify(title) {
  return (
    title
      // decompose accents so they strip to their base letter rather than
      // vanishing — "tïtle" should be "title", not "t-tle"
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled"
  );
}

