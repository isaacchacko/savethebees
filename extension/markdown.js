// Markdown in, DOM out, and back again. The admin view edits the rendered page
// directly, so the way back matters as much as the way there: whatever the
// serializer emits is what gets committed. Both halves handle exactly the same
// constructs — headings, paragraphs, unordered lists, and inline links, bold,
// italic and code — and markdown.test asserts that render then serialize is the
// identity for every page in content/.
//
// Headings keep their real level here (h1 stays h1) even though the site maps
// markdown h1 onto an <h2>. Rendering both as <h2> would make the trip back
// ambiguous; admin.css makes them look the same instead.

const ESCAPE_HTML = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };

function escapeHtml(text) {
  return text.replace(/[&<>"]/g, (c) => ESCAPE_HTML[c]);
}

/** Only the characters that would otherwise be read as markup. */
function escapeMarkdown(text) {
  return text.replace(/([\\`*[\]])/g, "\\$1");
}

function unescapeMarkdown(text) {
  return text.replace(/\\([\\`*[\]])/g, "$1");
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

// ──────────────────────────────── html → md ────────────────────────────────

function inlineToMarkdown(node) {
  let out = "";

  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      // contenteditable leaves nbsp behind wherever it kept a space visible
      out += escapeMarkdown(child.textContent.replace(/ /g, " "));
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;

    const tag = child.tagName.toLowerCase();
    if (tag === "br") out += " ";
    else if (tag === "a") out += `[${inlineToMarkdown(child)}](${child.getAttribute("href") || ""})`;
    else if (tag === "strong" || tag === "b") out += `**${inlineToMarkdown(child)}**`;
    else if (tag === "em" || tag === "i") out += `*${inlineToMarkdown(child)}*`;
    else if (tag === "code") out += `\`${child.textContent}\``;
    else out += inlineToMarkdown(child);
  }

  return out;
}

/** A <pre>'s visible text, with whatever contenteditable used for line breaks. */
function preToText(node) {
  let out = "";
  const walk = (parent) => {
    for (const child of parent.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) out += child.textContent;
      else if (child.nodeType !== Node.ELEMENT_NODE) continue;
      else {
        const tag = child.tagName.toLowerCase();
        if (tag === "br") out += "\n";
        else if (tag === "div" || tag === "p") {
          if (out && !out.endsWith("\n")) out += "\n";
          walk(child);
        } else walk(child);
      }
    }
  };
  walk(node);
  return out.replace(/\n+$/, "");
}

/** The DOM the editor is holding, back to the markdown we will commit. */
export function toMarkdown(root) {
  const blocks = [];

  for (const node of root.children) {
    const tag = node.tagName.toLowerCase();
    const heading = /^h([1-6])$/.exec(tag);

    if (tag === "pre") {
      blocks.push("```" + (node.dataset.lang || "") + "\n" + preToText(node) + "\n```");
      continue;
    }

    if (heading) {
      const text = inlineToMarkdown(node).trim();
      if (text) blocks.push("#".repeat(Number(heading[1])) + " " + text);
    } else if (tag === "ul") {
      const items = [...node.children]
        .map((li) => inlineToMarkdown(li).trim())
        .filter(Boolean)
        .map((text) => `- ${text}`);
      if (items.length) blocks.push(items.join("\n"));
    } else {
      const text = inlineToMarkdown(node).replace(/\s+/g, " ").trim();
      if (text) blocks.push(text);
    }
  }

  return blocks.join("\n\n") + "\n";
}

// ─────────────────────────── front matter passthrough ───────────────────────

/** Learnings carry yaml front matter the editor must not touch. */
export function splitFrontMatter(markdown) {
  const match = /^(---\n[\s\S]*?\n---\n)([\s\S]*)$/.exec(markdown);
  return match ? { front: match[1], body: match[2] } : { front: "", body: markdown };
}

/**
 * Whether this markdown survives a trip through the editor untouched. The
 * admin view calls this before turning editing on: anything it cannot
 * reproduce exactly — a construct the renderer does not know — would be
 * silently dropped on save, so it refuses to open the file instead.
 */
export function roundTrips(markdown, makeHost) {
  const host = makeHost();
  host.innerHTML = toHtml(markdown);
  const back = toMarkdown(host);
  host.remove();
  const norm = (text) => text.replace(/\r\n/g, "\n").trim();
  return { ok: norm(back) === norm(markdown), got: back };
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
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled"
  );
}

export { escapeMarkdown, unescapeMarkdown };
