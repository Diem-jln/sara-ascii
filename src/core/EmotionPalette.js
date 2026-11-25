const PALETTES = {
  intimidad: {
    bg: [9, 7, 18],
    stops: [
      [48, 36, 92],
      [112, 78, 168],
      [194, 132, 178],
      [242, 206, 174],
      [255, 246, 232]
    ]
  },
  confusion: {
    bg: [22, 7, 19],
    stops: [
      [104, 24, 58],
      [186, 42, 78],
      [255, 92, 88],
      [255, 172, 118],
      [255, 236, 204]
    ]
  },
  latido: {
    bg: [20, 5, 16],
    stops: [
      [115, 16, 56],
      [204, 28, 92],
      [255, 56, 136],
      [255, 158, 128],
      [255, 232, 168]
    ]
  },
  euforia: {
    bg: [16, 9, 26],
    stops: [
      [168, 48, 62],
      [245, 104, 48],
      [255, 184, 64],
      [255, 228, 128],
      [255, 252, 240]
    ]
  }
};

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpRGB(c1, c2, t) {
  return [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t))
  ];
}

export class EmotionPalette {
  constructor(seed) {
    this.seed = seed;
    this.sessionShift = ((seed % 21) - 10) * 1.4;
    this.current = JSON.parse(JSON.stringify(PALETTES.intimidad));
  }

  update(emotionName, speed = 0.03) {
    const target = PALETTES[emotionName] || PALETTES.intimidad;
    this.current.bg = lerpRGB(this.current.bg, target.bg, speed);

    for (let i = 0; i < this.current.stops.length; i++) {
      this.current.stops[i] = lerpRGB(this.current.stops[i], target.stops[i], speed);
    }
  }

  getColor(intensity, time, radialDist = 0) {
    const stops = this.current.stops;
    const maxIdx = stops.length - 1;

    const spatialShift = Math.sin(time * 0.35 + radialDist * 1.8 + this.seed) * 0.07;
    const t = Math.max(0, Math.min(0.999, intensity + spatialShift));

    const scaled = t * maxIdx;
    const idx = Math.floor(scaled);
    const localT = scaled - idx;

    const rgb = lerpRGB(stops[idx], stops[Math.min(idx + 1, maxIdx)], localT);

    const r = Math.max(0, Math.min(255, Math.round(rgb[0] + this.sessionShift * 0.6)));
    const g = Math.max(0, Math.min(255, Math.round(rgb[1] - this.sessionShift * 0.3)));
    const b = Math.max(0, Math.min(255, Math.round(rgb[2] + this.sessionShift * 0.4)));

    return `rgb(${r}, ${g}, ${b})`;
  }
}