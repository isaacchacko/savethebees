// Images shrunk to something a git repo can carry: screenshots of the page
// being saved (the visible viewport, 640px wide), and images pasted into a
// post (twice the post's 720px column, so they stay sharp on a retina screen).

const MAX_WIDTH = 640;
const QUALITY = 0.72;
const PASTED_MAX_WIDTH = 1440;
const PASTED_QUALITY = 0.85;

function dataUrlToBlob(dataUrl) {
  const [meta, base64] = dataUrl.split(",");
  const binary = atob(base64);
  return new Blob([Uint8Array.from(binary, (char) => char.charCodeAt(0))], {
    type: meta.match(/:(.*?);/)[1],
  });
}

// Chunked because spreading a whole image into fromCharCode blows the stack.
async function blobToBase64(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

async function toWebp(source, maxWidth, quality) {
  const bitmap = await createImageBitmap(source);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = new OffscreenCanvas(width, height);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await canvas.convertToBlob({ type: "image/webp", quality });
  return { blob, width, height };
}

async function shrink(dataUrl) {
  const { blob, width, height } = await toWebp(dataUrlToBlob(dataUrl), MAX_WIDTH, QUALITY);
  return { base64: await blobToBase64(blob), width, height, bytes: blob.size };
}

/**
 * A pasted image, ready to commit: webp unless the original is already
 * smaller (a small flat png often is). A gif is kept as is, since redrawing it
 * on a canvas would keep only its first frame.
 */
export async function preparePasted(file) {
  const original = { blob: file, extension: file.type.split("/")[1].replace("jpeg", "jpg") };
  if (file.type === "image/gif") return { ...original, base64: await blobToBase64(file) };

  const { blob } = await toWebp(file, PASTED_MAX_WIDTH, PASTED_QUALITY);
  if (blob.size >= file.size) return { ...original, base64: await blobToBase64(file) };
  return { blob, extension: "webp", base64: await blobToBase64(blob) };
}

/**
 * The visible viewport of the active tab. Returns null rather than throwing:
 * chrome:// pages, the web store and the pdf viewer all refuse to be captured,
 * and an entry without a screenshot still beats no entry.
 */
export async function capture() {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab({ format: "jpeg", quality: 90 });
    return dataUrl ? await shrink(dataUrl) : null;
  } catch {
    return null;
  }
}
