// Screenshots of the page being saved, shrunk to something a git repo can
// carry: the visible viewport, 640px wide, webp.

const MAX_WIDTH = 640;
const QUALITY = 0.72;

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

async function shrink(dataUrl) {
  const bitmap = await createImageBitmap(dataUrlToBlob(dataUrl));
  const scale = Math.min(1, MAX_WIDTH / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = new OffscreenCanvas(width, height);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await canvas.convertToBlob({ type: "image/webp", quality: QUALITY });
  return { base64: await blobToBase64(blob), width, height, bytes: blob.size };
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
