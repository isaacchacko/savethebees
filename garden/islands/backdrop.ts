// Breaking surf behind every page, dithered to dots of the garden's own
// colours. It's mounted from the footer (components/Footer.astro), so every
// page has it, and it carries on from one page to the next: the canvas sits
// outside <body>, which each navigation replaces, and a page that leaves hands
// it to the page that arrives instead of stopping it.
//
// Every cell of the grid samples the clip at its centre and lights a dot when
// that brightness clears the cell's spot in an 8×8 Bayer matrix (ordered
// dithering, one dot per cell). By night the foam is the dots, pale on the
// paper; by day it's the water, so the foam stays paper and the dots stay
// faint. Behind the note's text, and the navbar while it's open, the dots thin
// out, so the surf is mostly in the margins. The colours are read from the theme, and follow it when it
// switches.
// The wave button beside the theme toggle (components/Darkmode.astro) turns it
// off and on: html[data-surf="off"]. Reduced motion gets the first frame as a
// still; without WebGL there's no backdrop at all.

const VIDEO = "/assets/waves.mp4"

/** The dot grid's pitch in css px. */
const CELL_PX = 4

/** How far the dots go from the paper towards --secondary, by day and by night. */
const STRENGTH = { light: 0.22, dark: 0.32 }

/** How many of the dots are left behind the text, and how wide, in css px, the fade into it is. */
const CALM = 0.25
const CALM_FEATHER_PX = 64

/**
 * The brightness the clip's average is pulled to before dithering, so it comes
 * out about half dots. First its darkest and brightest LEVELS_CLIP of pixels
 * are stretched to black and white.
 */
const MID_GREY = 0.42
const LEVELS_CLIP = 0.05

/** How often, in ms, the clip's brightness is measured again. */
const METER_MS = 1000

const VERTEX = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

const FRAGMENT = `
precision mediump float;
uniform sampler2D u_clip;
// the black point, the white point, and the gamma after them
uniform vec3 u_levels;
uniform vec2 u_size;
uniform float u_cell;
uniform vec2 u_scale;
uniform vec2 u_offset;
uniform vec3 u_paper;
uniform vec3 u_dot;
uniform float u_invert;
// the text column's left and right edges in device px, and its fade's width
uniform vec3 u_calm;
// the navbar's left and right edges, and how far open it is (0 folded, 1 open)
uniform vec3 u_calm_nav;

// the 8×8 matrix built up from the 2×2 one, as thresholds in [0, 1)
float bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}
float bayer(vec2 a) {
  return bayer2(0.25 * a) * 0.0625 + bayer2(0.5 * a) * 0.25 + bayer2(a);
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, u_size.y - gl_FragCoord.y);
  vec2 cell = floor(px / u_cell);
  vec2 centre = (cell + 0.5) * u_cell;
  vec2 uv = centre / u_size * u_scale + u_offset;
  float l = dot(texture2D(u_clip, uv).rgb, vec3(0.299, 0.587, 0.114));
  l = pow(clamp((l - u_levels.x) / (u_levels.y - u_levels.x), 0.0, 1.0), u_levels.z);
  l = mix(l, 1.0 - l, u_invert);
  float inside = smoothstep(u_calm.x - u_calm.z, u_calm.x, centre.x) * (1.0 - smoothstep(u_calm.y, u_calm.y + u_calm.z, centre.x));
  inside = max(inside, u_calm_nav.z * smoothstep(u_calm_nav.x - u_calm.z, u_calm_nav.x, centre.x) * (1.0 - smoothstep(u_calm_nav.y, u_calm_nav.y + u_calm.z, centre.x)));
  l *= mix(1.0, ${CALM.toFixed(2)}, inside);

  float lit = step(bayer(cell) + 0.01, l);
  float radius = u_cell * mix(0.3, 0.42, l);
  float d = length(px - centre);
  float dot = lit * (1.0 - smoothstep(radius - 0.75, radius + 0.75, d));
  gl_FragColor = vec4(mix(u_paper, u_dot, dot), 1.0);
}
`

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  return shader
}

/** A theme colour as rgb in [0, 1], whatever css form it's written in. */
function colour(name: string): number[] {
  const probe = document.createElement("canvas").getContext("2d")!
  probe.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#000"
  probe.fillRect(0, 0, 1, 1)
  return Array.from(probe.getImageData(0, 0, 1, 1).data.slice(0, 3), (c) => c / 255)
}

const surfOff = () => document.documentElement.dataset.surf === "off"

/** Starts the surf behind the page, returning how to stop it. */
function start(src: string): () => void {
  const canvas = document.createElement("canvas")
  canvas.className = "backdrop"
  canvas.setAttribute("aria-hidden", "true")
  const video = document.createElement("video")
  video.className = "backdrop-source"
  video.src = src
  video.muted = true
  video.loop = true
  video.playsInline = true
  // switched off, it doesn't fetch the clip until it's switched on
  video.preload = surfOff() ? "none" : "auto"
  video.setAttribute("aria-hidden", "true")
  // a navigation swaps <body> for the next page's, so this lives beside it
  document.documentElement.append(canvas, video)
  const remove = () => {
    canvas.remove()
    video.remove()
  }

  const gl = canvas.getContext("webgl", { antialias: false, alpha: false })
  if (!gl) return remove
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches

  const program = gl.createProgram()!
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX))
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return remove
  gl.useProgram(program)

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const pos = gl.getAttribLocation(program, "a_pos")
  gl.enableVertexAttribArray(pos)
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)

  const at = (name: string) => gl.getUniformLocation(program, name)

  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture())
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.uniform1i(at("u_clip"), 0)

  let dirty = true
  const retheme = () => {
    const dark = document.documentElement.getAttribute("saved-theme") === "dark"
    const paper = colour("--light")
    const ink = colour("--secondary")
    const strength = dark ? STRENGTH.dark : STRENGTH.light
    gl.uniform3fv(at("u_paper"), paper)
    gl.uniform3fv(at("u_dot"), paper.map((p, i) => p + (ink[i] - p) * strength))
    gl.uniform1f(at("u_invert"), dark ? 0 : 1)
    dirty = true
  }
  retheme()

  // the clip covers the canvas like object-fit: cover
  const fit = () => {
    const dpr = window.devicePixelRatio || 1
    const w = Math.round(canvas.clientWidth * dpr)
    const h = Math.round(canvas.clientHeight * dpr)
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    gl.viewport(0, 0, w, h)
    gl.uniform2f(at("u_size"), w, h)
    gl.uniform1f(at("u_cell"), Math.max(2, Math.round(CELL_PX * dpr)))
    const clip = (video.videoWidth || 16) / (video.videoHeight || 9)
    const view = w / h
    const sx = view < clip ? view / clip : 1
    const sy = view < clip ? 1 : clip / view
    gl.uniform2f(at("u_scale"), sx, sy)
    gl.uniform2f(at("u_offset"), (1 - sx) / 2, (1 - sy) / 2)
    const [textLeft, textRight, navLeft, navRight, navOpen] = calm
    gl.uniform3f(at("u_calm"), textLeft * dpr, textRight * dpr, CALM_FEATHER_PX * dpr)
    gl.uniform3f(at("u_calm_nav"), navLeft * dpr, navRight * dpr, navOpen)
  }

  // where the text and the navbar are, and how far open the navbar is (its
  // contents' fade), measured every frame: both move as the navbar opens, and
  // the calm behind them follows along rather than waiting for the clip's
  // next frame
  let calm = [0, 0, 0, 0, 0]
  const measureCalm = () => {
    const text = document.querySelector(".center")?.getBoundingClientRect()
    const nav = document.querySelector(".left.sidebar")
    const rect = nav?.getBoundingClientRect()
    const contents = nav?.querySelector(":scope > :not(.nav-rail)")
    const open = contents ? Number(getComputedStyle(contents).opacity) : 0
    const next = [text?.left ?? 0, text?.right ?? 0, rect?.left ?? 0, rect?.right ?? 0, open]
    if (next.some((v, i) => Math.abs(v - calm[i]) > 0.01)) {
      calm = next
      dirty = true
    }
  }

  // levels that stretch the clip to black and white and then take its average
  // to MID_GREY, measured on a thumbnail of the frame and eased so they never
  // flash
  const meter = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!
  meter.canvas.width = 48
  meter.canvas.height = 27
  let levels = [0, 0, 0]
  let metered = -Infinity
  const measure = (now: number) => {
    if (now - metered < METER_MS) return levels
    metered = now
    meter.drawImage(video, 0, 0, 48, 27)
    const px = meter.getImageData(0, 0, 48, 27).data
    const lumas: number[] = []
    for (let k = 0; k < px.length; k += 4) lumas.push((0.299 * px[k] + 0.587 * px[k + 1] + 0.114 * px[k + 2]) / 255)
    lumas.sort((a, b) => a - b)
    const lo = lumas[Math.floor(lumas.length * LEVELS_CLIP)]
    const hi = Math.max(lo + 0.1, lumas[Math.ceil(lumas.length * (1 - LEVELS_CLIP)) - 1])
    const stretched = lumas.reduce((sum, l) => sum + Math.min(1, Math.max(0, (l - lo) / (hi - lo))), 0) / lumas.length
    const mean = Math.min(0.95, Math.max(0.03, stretched))
    const target = [lo, hi, Math.min(2.5, Math.max(0.4, Math.log(MID_GREY) / Math.log(mean)))]
    levels = levels[2] ? levels.map((v, k) => v + (target[k] - v) * 0.5) : target
    return levels
  }

  let shown = -1
  const draw = () => {
    if (video.readyState < video.HAVE_CURRENT_DATA) return
    measureCalm()
    // only a new frame of the clip, or new colours, are worth a redraw
    if (!dirty && video.currentTime === shown) return
    shown = video.currentTime
    dirty = false
    fit()
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video)
    gl.uniform3fv(at("u_levels"), measure(performance.now()))
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    canvas.dataset.on = "true"
  }

  let frame = 0
  const loop = () => {
    draw()
    frame = requestAnimationFrame(loop)
  }
  // runs while it's switched on and the tab is showing; switched off, it fades
  // away and stops
  const follow = () => {
    if (surfOff() || document.hidden) {
      cancelAnimationFrame(frame)
      frame = 0
      video.pause()
      if (surfOff()) canvas.dataset.on = "false"
      return
    }
    if (frame) return
    dirty = true
    frame = requestAnimationFrame(loop)
    if (still) video.preload = "auto"
    else {
      video.play().catch(() => {
        // autoplay refused (low power mode): the still frame stays up
      })
    }
  }
  follow()
  document.addEventListener("visibilitychange", follow)
  const watch = new MutationObserver(() => {
    retheme()
    follow()
  })
  watch.observe(document.documentElement, { attributes: true, attributeFilter: ["saved-theme", "data-surf"] })
  const ro = new ResizeObserver(() => {
    dirty = true
    draw()
  })
  ro.observe(canvas)

  return () => {
    cancelAnimationFrame(frame)
    video.pause()
    document.removeEventListener("visibilitychange", follow)
    watch.disconnect()
    ro.disconnect()
    remove()
  }
}

/** The running surf: its clip, how many pages hold it, and how to stop it. */
type Live = { src: string; held: number; stop: () => void }
// on window, so a hot-swapped copy of this module can stop the old one's
const running = () => (window as { gardenBackdrop?: Live }).gardenBackdrop
const setRunning = (live?: Live) => ((window as { gardenBackdrop?: Live }).gardenBackdrop = live)

/** How long, in ms, a let-go backdrop waits for the next page before it stops. */
const HANDOFF_MS = 10_000

export function mount(_el: HTMLElement, { src = VIDEO }: { src?: string }) {
  let live = running()
  if (live?.src !== src) {
    live?.stop()
    live = { src, held: 0, stop: start(src) }
    setRunning(live)
  }
  const mine = live
  mine.held++
  return () => {
    mine.held--
    // the page is leaving: the next one picks the surf up when it mounts its
    // footer, and only if none does is it stopped
    const settle = () => {
      document.removeEventListener("astro:page-load", settle)
      clearTimeout(timer)
      // the arriving page's island mounts a moment after it loads
      const coming = document.querySelector('.island[data-island="backdrop"]')
      if (mine.held > 0 || coming || running() !== mine) return
      mine.stop()
      setRunning(undefined)
    }
    document.addEventListener("astro:page-load", settle)
    const timer = setTimeout(settle, HANDOFF_MS)
  }
}
