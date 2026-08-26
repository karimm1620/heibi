const DEFAULT_COOKIE_LOBES = 8;
const DEFAULT_COOKIE_INNER_RATIO = 0.82;
const COOKIE_CORNER_SMOOTHING = 0.62;

interface Point {
  x: number;
  y: number;
}

function finiteOr(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Builds an original rounded scallop path for small focal badges and selected
 * moments. It intentionally does not copy Material's normalized path data.
 */
export function buildCookiePath(
  size: number,
  lobes = DEFAULT_COOKIE_LOBES,
  innerRatio = DEFAULT_COOKIE_INNER_RATIO,
): string {
  const safeSize = Math.max(1, finiteOr(size, 1));
  const safeLobes = Math.round(clamp(finiteOr(lobes, DEFAULT_COOKIE_LOBES), 4, 12));
  const safeInnerRatio = clamp(
    finiteOr(innerRatio, DEFAULT_COOKIE_INNER_RATIO),
    0.65,
    0.92,
  );
  const center = safeSize / 2;
  const outerRadius = center;
  const innerRadius = outerRadius * safeInnerRatio;
  const vertexCount = safeLobes * 2;

  const vertices: Point[] = Array.from({ length: vertexCount }, (_, index) => {
    const angle = (Math.PI * 2 * index) / vertexCount - Math.PI / 2;
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  });

  let path = "";
  vertices.forEach((current, index) => {
    const previous = vertices[(index - 1 + vertexCount) % vertexCount];
    const next = vertices[(index + 1) % vertexCount];
    const start = {
      x: current.x + (previous.x - current.x) * COOKIE_CORNER_SMOOTHING,
      y: current.y + (previous.y - current.y) * COOKIE_CORNER_SMOOTHING,
    };
    const end = {
      x: current.x + (next.x - current.x) * COOKIE_CORNER_SMOOTHING,
      y: current.y + (next.y - current.y) * COOKIE_CORNER_SMOOTHING,
    };

    path += index === 0
      ? `M ${start.x} ${start.y} `
      : `L ${start.x} ${start.y} `;
    path += `Q ${current.x} ${current.y} ${end.x} ${end.y} `;
  });

  return `${path}Z`;
}

/** Builds a filled, horizontally repeating wave in the supplied view box. */
export function buildWavePath(width: number, height: number, waves = 2): string {
  const safeWidth = Math.max(1, finiteOr(width, 1));
  const safeHeight = Math.max(1, finiteOr(height, 1));
  const safeWaves = Math.round(clamp(finiteOr(waves, 2), 1, 6));
  const baseline = safeHeight * 0.42;
  const amplitude = safeHeight * 0.22;
  const segmentWidth = safeWidth / safeWaves;

  let path = `M 0 ${baseline} `;
  for (let index = 0; index < safeWaves; index += 1) {
    const start = index * segmentWidth;
    const midpoint = start + segmentWidth / 2;
    const end = start + segmentWidth;
    path += `C ${start + segmentWidth * 0.18} ${baseline - amplitude} `;
    path += `${start + segmentWidth * 0.32} ${baseline - amplitude} ${midpoint} ${baseline} `;
    path += `C ${start + segmentWidth * 0.68} ${baseline + amplitude} `;
    path += `${start + segmentWidth * 0.82} ${baseline + amplitude} ${end} ${baseline} `;
  }

  return `${path}L ${safeWidth} ${safeHeight} L 0 ${safeHeight} Z`;
}
