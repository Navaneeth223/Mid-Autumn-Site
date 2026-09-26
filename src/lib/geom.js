// ---------------------------------------------------------------------------
// cover-fit math shared by the frame-scrub canvas, the 3D cake placement and
// every easter-egg hit-area: "where does a point of the SOURCE frame land on
// screen?" — so overlays stay glued to the video content at any viewport.
// ---------------------------------------------------------------------------

// Rectangle (in canvas px) that a cover-fit draw of the image occupies.
export function coverRect(imgW, imgH, cw, ch) {
  const s = Math.max(cw / imgW, ch / imgH)
  const w = imgW * s
  const h = imgH * s
  return { x: (cw - w) / 2, y: (ch - h) / 2, w, h, s }
}

// Map a fractional point of the source frame (0..1, 0..1) to canvas px.
export function framePointToCanvas(fx, fy, imgW, imgH, cw, ch) {
  const r = coverRect(imgW, imgH, cw, ch)
  return { x: r.x + fx * r.w, y: r.y + fy * r.h }
}
