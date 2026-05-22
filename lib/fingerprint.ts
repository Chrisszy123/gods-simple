/**
 * Generates a stable browser fingerprint from hardware and rendering characteristics.
 * Survives: IP changes, wifi cycling, incognito mode, localStorage clears.
 * Does NOT survive: different browser, different device, full browser reinstall.
 */
export async function getBrowserFingerprint(): Promise<string> {
  const nav = navigator as Navigator & { deviceMemory?: number }

  const components = [
    nav.userAgent,
    nav.language,
    nav.languages?.join(',') ?? '',
    nav.platform ?? '',
    nav.hardwareConcurrency ?? '',
    nav.deviceMemory ?? '',
    `${screen.width}x${screen.height}`,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    getCanvasFingerprint(),
    getWebGLFingerprint(),
  ]

  const raw = components.join('|||')
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32)
}

function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 240
    canvas.height = 60
    const ctx = canvas.getContext('2d')
    if (!ctx) return 'no-canvas'
    // Rendering differences between GPU/OS produce unique pixel output
    ctx.fillStyle = '#FEBF53'
    ctx.fillRect(0, 0, 240, 60)
    ctx.fillStyle = 'rgba(0,0,0,0.8)'
    ctx.font = 'bold 18px Arial, sans-serif'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText('GodsOfTheStage⁠', 4, 38)
    ctx.fillStyle = 'rgba(213,66,30,0.6)'
    ctx.font = '11px Courier New, monospace'
    ctx.fillText('VOTE​2025', 4, 54)
    return canvas.toDataURL('image/png').slice(-64)
  } catch {
    return 'canvas-blocked'
  }
}

function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') as WebGLRenderingContext | null
    if (!gl) return 'no-webgl'
    const renderer = gl.getParameter(gl.RENDERER) as string
    const vendor = gl.getParameter(gl.VENDOR) as string
    return `${vendor}::${renderer}`.slice(0, 60)
  } catch {
    return 'webgl-blocked'
  }
}
