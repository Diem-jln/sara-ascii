import { AsciiLibrary } from '../core/AsciiSets.js';

export class AsciiRenderer {
  constructor(canvas, seed = 0) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ascii = new AsciiLibrary(seed);
    this.cellSize = 16;
    this.cols = 0;
    this.rows = 0;
    this.resize();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.cols = Math.ceil(this.width / this.cellSize);
    this.rows = Math.ceil(this.height / this.cellSize);

    this.ctx.font = `700 ${this.cellSize}px "JetBrains Mono", "Fira Code", monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
  }

  render(field, palette, audio) {
    const ctx = this.ctx;
    const [r, g, b] = palette.current.bg;

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.24)`;
    ctx.fillRect(0, 0, this.width, this.height);

    const aspect = this.width / this.height;
    const halfCell = this.cellSize * 0.5;

    const stampMap = new Map();
    for (const s of field.stamps) {
      const baseRow = Math.floor(s.rowNorm * this.rows);
      const baseCol = Math.floor(s.colNorm * this.cols);
      for (let lr = 0; lr < s.art.length; lr++) {
        const line = s.art[lr];
        for (let lc = 0; lc < line.length; lc++) {
          const ch = line[lc];
          if (ch === ' ') continue;
          const row = baseRow + lr;
          const col = baseCol + lc;
          if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            stampMap.set(`${row},${col}`, { char: ch, life: s.life });
          }
        }
      }
    }

    for (let row = 0; row < this.rows; row++) {
      const ny = (row / this.rows) * 2 - 1;
      const py = row * this.cellSize + halfCell;

      for (let col = 0; col < this.cols; col++) {
        const px = col * this.cellSize + halfCell;

        const stamp = stampMap.get(`${row},${col}`);
        if (stamp) {
          ctx.fillStyle = `rgba(255, 232, 198, ${Math.min(1, stamp.life * 1.25)})`;
          ctx.fillText(stamp.char, px, py);
          continue;
        }

        const nx = ((col / this.cols) * 2 - 1) * aspect;
        const { intensity, radialDist } = field.sample(nx, ny);

        if (intensity < 0.14) continue;

        const spatialHash = row * 31 + col * 17;
        const char = this.ascii.pickChar(field.emotion, intensity, audio.treble, spatialHash);
        if (char === ' ') continue;

        ctx.fillStyle = palette.getColor(intensity, field.time, radialDist);
        ctx.fillText(char, px, py);
      }
    }
  }
}