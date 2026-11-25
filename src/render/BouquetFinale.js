import { Application, Container, Graphics } from 'pixi.js';
import { AsciiFilter } from 'pixi-filters';

const FLOWER_PALETTES = [
  { outer: 0xd90429, mid: 0xff4d6d, inner: 0xffb3c1, center: 0xffd166, shadow: 0x4a0514 },
  { outer: 0xff4d8d, mid: 0xff8fab, inner: 0xffe5ec, center: 0xfff3b0, shadow: 0x590d22 },
  { outer: 0xf77f00, mid: 0xfcbf49, inner: 0xffe8a3, center: 0xfff8e7, shadow: 0x5c2400 },
  { outer: 0x9d4edd, mid: 0xc77dff, inner: 0xe0aaff, center: 0xffd166, shadow: 0x2e0652 },
  { outer: 0xff595e, mid: 0xff8c82, inner: 0xffd6d6, center: 0xffe66d, shadow: 0x5c0a0d },
  { outer: 0xffb703, mid: 0xffd166, inner: 0xfff3b0, center: 0xd90429, shadow: 0x663d00 }
];

const SPECIES = ['rose', 'tulip', 'lily', 'daisy', 'rose'];

function quadBezier(p0, p1, p2, t) {
  const inv = 1 - t;
  return {
    x: inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x,
    y: inv * inv * p0.y + 2 * inv * t * p1.y + t * t * p2.y
  };
}

function quadBezierTangent(p0, p1, p2, t) {
  const dx = 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
  const dy = 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
  return Math.atan2(dy, dx);
}

export class BouquetFinale {
  constructor(mountEl) {
    this.mountEl = mountEl;
    this.app = null;
    this.running = false;
    this.elapsed = 0;

    this.flowers = [];
    this.ferns = [];
    this.fillers = [];
    this.petals = [];
    this.fireflies = [];
    this.mouseX = 0;
  }

  async start(onBloomedCallback) {
    if (this.running) return;
    this.running = true;
    this.elapsed = 0;
    this.onBloomed = onBloomedCallback;
    this.quoteTriggered = false;

    this.app = new Application();
    await this.app.init({
      resizeTo: window,
      backgroundColor: 0x05030a,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true
    });

    this.mountEl.innerHTML = '';
    this.mountEl.appendChild(this.app.canvas);

    window.addEventListener('mousemove', (e) => {
      this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    });

    this.bouquetContainer = new Container();
    this.bouquetContainer.filters = [
      new AsciiFilter({
        size: 4,
        replaceColor: false
      })
    ];
    this.app.stage.addChild(this.bouquetContainer);

    this.bgGraphics = new Graphics();
    this.foliageGraphics = new Graphics();
    this.stemsGraphics = new Graphics();
    this.bloomsGraphics = new Graphics();
    this.ribbonGraphics = new Graphics();
    this.fxGraphics = new Graphics();

    this.bouquetContainer.addChild(this.bgGraphics);
    this.bouquetContainer.addChild(this.foliageGraphics);
    this.bouquetContainer.addChild(this.stemsGraphics);
    this.bouquetContainer.addChild(this.bloomsGraphics);
    this.bouquetContainer.addChild(this.ribbonGraphics);
    this.bouquetContainer.addChild(this.fxGraphics);

    this.buildBouquetData();
    this.app.ticker.add((ticker) => this.update(ticker.deltaMS / 1000));
  }

  buildBouquetData() {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const baseX = w * 0.5;
    const baseY = h + 35;
    const tieY = h * 0.85;

    this.tiePoint = { x: baseX, y: tieY };

    this.ferns = [];
    const fernCount = 10;
    for (let i = 0; i < fernCount; i++) {
      const norm = (i / (fernCount - 1)) * 2 - 1;
      const spreadX = norm * Math.min(w * 0.36, 390);
      const tipY = h - (0.44 + (1 - Math.abs(norm) * 0.35) * 0.28) * h;
      this.ferns.push({
        p0: { x: baseX + norm * 14, y: baseY },
        p1: { x: baseX + spreadX * 0.45, y: tieY - 130 },
        p2: { x: baseX + spreadX, y: tipY },
        delay: 0.3 + Math.abs(norm) * 0.9,
        duration: 2.1,
        swayPhase: Math.random() * Math.PI * 2,
        leafPairs: 6
      });
    }

    const count = 17;
    this.flowers = [];

    for (let i = 0; i < count; i++) {
      const norm = (i / (count - 1)) * 2 - 1;
      const layer = i % 3;
      const spreadX = norm * Math.min(w * 0.31, 340) + (Math.random() - 0.5) * 28;

      const heightFactor = layer === 0 ? 0.65 : layer === 1 ? 0.54 : 0.43;
      const archHeight = (1 - Math.abs(norm) * 0.26) * (h * heightFactor) + (Math.random() - 0.5) * 34;

      const tipX = baseX + spreadX;
      const tipY = h - archHeight;
      const ctrlX = baseX + spreadX * 0.3 + (Math.random() - 0.5) * 26;
      const ctrlY = tieY - (tieY - tipY) * 0.5;

      this.flowers.push({
        layer,
        species: SPECIES[i % SPECIES.length],
        p0: { x: baseX + norm * 18, y: baseY },
        p1: { x: ctrlX, y: ctrlY },
        p2: { x: tipX, y: tipY },
        delay: 0.45 + Math.abs(norm) * 1.3 + layer * 0.28,
        stemDuration: 1.85 + Math.random() * 0.55,
        bloomDuration: 1.55 + Math.random() * 0.45,
        radius: (layer === 0 ? 44 : layer === 1 ? 52 : 58) + Math.random() * 12,
        palette: FLOWER_PALETTES[i % FLOWER_PALETTES.length],
        stemColor: layer === 0 ? 0x1d5e3f : layer === 1 ? 0x2b8257 : 0x3ba36e,
        leafColor: layer === 0 ? 0x25734d : layer === 1 ? 0x379e69 : 0x4ec285,
        swayPhase: Math.random() * Math.PI * 2,
        tilt: norm * 0.36,
        leaves: [
          { t: 0.32 + Math.random() * 0.08, side: -1, size: 1.05 },
          { t: 0.54 + Math.random() * 0.08, side: 1, size: 0.92 },
          { t: 0.72 + Math.random() * 0.06, side: norm >= 0 ? -1 : 1, size: 0.78 }
        ]
      });
    }

    this.flowers.sort((a, b) => a.layer - b.layer);

    this.fillers = [];
    for (let i = 0; i < 9; i++) {
      const norm = (i / 8) * 2 - 1;
      const spreadX = norm * Math.min(w * 0.34, 370) + (Math.random() - 0.5) * 35;
      const tipY = h - (0.38 + Math.random() * 0.28) * h;
      this.fillers.push({
        p0: { x: baseX + norm * 10, y: baseY },
        p1: { x: baseX + spreadX * 0.4, y: tieY - 120 },
        p2: { x: baseX + spreadX, y: tipY },
        delay: 1.1 + Math.random() * 1.1,
        duration: 1.9,
        swayPhase: Math.random() * Math.PI * 2,
        buds: Array.from({ length: 6 }, () => ({
          dx: (Math.random() - 0.5) * 44,
          dy: (Math.random() - 0.5) * 38,
          r: 3.5 + Math.random() * 3
        }))
      });
    }

    this.petals = Array.from({ length: 18 }, (_, i) => ({
      x: w * (0.15 + Math.random() * 0.7),
      y: h * (0.1 + Math.random() * 0.8),
      vx: (Math.random() - 0.5) * 14,
      vy: 10 + Math.random() * 16,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 1.4,
      size: 7 + Math.random() * 6,
      color: FLOWER_PALETTES[i % FLOWER_PALETTES.length].mid
    }));

    this.fireflies = Array.from({ length: 28 }, () => ({
      x: w * (0.15 + Math.random() * 0.7),
      y: h * (0.15 + Math.random() * 0.8),
      vy: -(9 + Math.random() * 15),
      phase: Math.random() * Math.PI * 2,
      size: 2.5 + Math.random() * 3.5
    }));
  }

  drawBezierPetal(g, x, y, angle, length, width, fillColor, strokeColor) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const px = -sin;
    const py = cos;

    const tipX = x + cos * length;
    const tipY = y + sin * length;
    const c1x = x + cos * (length * 0.42) + px * width;
    const c1y = y + sin * (length * 0.42) + py * width;
    const c2x = x + cos * (length * 0.42) - px * width;
    const c2y = y + sin * (length * 0.42) - py * width;

    g.moveTo(x, y)
      .quadraticCurveTo(c1x, c1y, tipX, tipY)
      .quadraticCurveTo(c2x, c2y, x, y)
      .fill(fillColor)
      .stroke({ width: 1.6, color: strokeColor });
  }

  drawLeaf(g, pos, stemAngle, side, scale, color) {
    if (scale <= 0.02) return;
    const len = 44 * scale;
    const wid = 15 * scale;
    const angle = stemAngle + side * 0.76;

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const tipX = pos.x + cos * len;
    const tipY = pos.y + sin * len;
    const c1x = pos.x + cos * (len * 0.45) - sin * wid;
    const c1y = pos.y + sin * (len * 0.45) + cos * wid;
    const c2x = pos.x + cos * (len * 0.45) + sin * wid;
    const c2y = pos.y + sin * (len * 0.45) - cos * wid;

    g.moveTo(pos.x, pos.y)
      .quadraticCurveTo(c1x, c1y, tipX, tipY)
      .quadraticCurveTo(c2x, c2y, pos.x, pos.y)
      .fill(color)
      .stroke({ width: 1.4, color: 0x0b2619 });

    g.moveTo(pos.x, pos.y)
      .lineTo(pos.x + cos * (len * 0.8), pos.y + sin * (len * 0.8))
      .stroke({ width: 1.3, color: 0x8ce8b5 });
  }

  drawCalyx(g, x, y, stemAngle, scale) {
    for (let s = -1; s <= 1; s++) {
      this.drawBezierPetal(g, x, y, stemAngle + s * 0.45, 19 * scale, 6 * scale, 0x2d8a5e, 0x0b2619);
    }
  }

  drawRose(g, x, y, r, pal, rot) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + rot;
      this.drawBezierPetal(g, x, y, a, r * 1.08, r * 0.62, pal.outer, pal.shadow);
    }
    for (let i = 0; i < 7; i++) {
      const a = ((i + 0.5) / 7) * Math.PI * 2 - rot * 0.6;
      this.drawBezierPetal(g, x, y, a, r * 0.8, r * 0.48, pal.mid, pal.shadow);
    }
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + rot * 1.2;
      this.drawBezierPetal(g, x, y, a, r * 0.52, r * 0.34, pal.inner, pal.outer);
    }
    g.circle(x, y, r * 0.2).fill(pal.center).stroke({ width: 1.6, color: pal.shadow });
  }

  drawTulip(g, x, y, r, pal, tilt) {
    const up = -Math.PI / 2 + tilt;
    this.drawBezierPetal(g, x, y + r * 0.16, up - 0.38, r * 1.2, r * 0.46, pal.outer, pal.shadow);
    this.drawBezierPetal(g, x, y + r * 0.16, up + 0.38, r * 1.2, r * 0.46, pal.outer, pal.shadow);
    this.drawBezierPetal(g, x, y + r * 0.2, up, r * 1.26, r * 0.52, pal.mid, pal.shadow);
    this.drawBezierPetal(g, x, y + r * 0.12, up, r * 0.82, r * 0.26, pal.inner, pal.mid);
  }

  drawLily(g, x, y, r, pal, rot) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + rot;
      const color = i % 2 === 0 ? pal.outer : pal.mid;
      this.drawBezierPetal(g, x, y, a, r * 1.24, r * 0.34, color, pal.shadow);
      g.moveTo(x, y)
        .lineTo(x + Math.cos(a) * r * 0.88, y + Math.sin(a) * r * 0.88)
        .stroke({ width: 1.5, color: pal.inner });
    }
    for (let i = 0; i < 6; i++) {
      const a = ((i + 0.5) / 6) * Math.PI * 2 + rot;
      const sx = x + Math.cos(a) * r * 0.48;
      const sy = y + Math.sin(a) * r * 0.48;
      g.moveTo(x, y).lineTo(sx, sy).stroke({ width: 1.4, color: pal.inner });
      g.circle(sx, sy, 3.4).fill(pal.center);
    }
    g.circle(x, y, r * 0.15).fill(pal.center);
  }

  drawDaisy(g, x, y, r, pal, rot) {
    const count = 13;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rot;
      const color = i % 2 === 0 ? pal.inner : pal.mid;
      this.drawBezierPetal(g, x, y, a, r * 1.15, r * 0.21, color, pal.shadow);
    }
    g.circle(x, y, r * 0.32).fill(pal.shadow);
    g.circle(x, y, r * 0.25).fill(pal.center);
  }

  drawRibbon(g, progress) {
    if (progress <= 0.05) return;
    const { x, y } = this.tiePoint;
    const w = 56 * progress;
    const h = 19 * progress;

    g.moveTo(x - 10, y + 6)
      .quadraticCurveTo(x - 40 * progress, y + 58 * progress, x - 58 * progress, y + 122 * progress)
      .stroke({ width: 8, color: 0xc92a54, cap: 'round' });
    g.moveTo(x + 10, y + 6)
      .quadraticCurveTo(x + 40 * progress, y + 58 * progress, x + 58 * progress, y + 122 * progress)
      .stroke({ width: 8, color: 0xff6b8b, cap: 'round' });

    g.ellipse(x - w * 0.68, y, w * 0.58, h * 0.9).fill(0xc92a54).stroke({ width: 2, color: 0x4a0514 });
    g.ellipse(x + w * 0.68, y, w * 0.58, h * 0.9).fill(0xff6b8b).stroke({ width: 2, color: 0x4a0514 });

    g.roundRect(x - w * 0.38, y - h * 0.68, w * 0.76, h * 1.36, 9)
      .fill(0xff9ebb)
      .stroke({ width: 2, color: 0x4a0514 });
  }

  update(dt) {
    this.elapsed += dt;
    const w = this.app.screen.width;
    const h = this.app.screen.height;

    const bg = this.bgGraphics;
    const fg = this.foliageGraphics;
    const sg = this.stemsGraphics;
    const fl = this.bloomsGraphics;
    const rb = this.ribbonGraphics;
    const fx = this.fxGraphics;

    bg.clear();
    fg.clear();
    sg.clear();
    fl.clear();
    rb.clear();
    fx.clear();

    const wind = Math.sin(this.elapsed * 0.85) * 9 + this.mouseX * 14;

    const haloPulse = 0.85 + 0.15 * Math.sin(this.elapsed * 1.2);
    bg.circle(w * 0.5, h * 0.62, Math.min(w, h) * 0.34 * haloPulse)
      .fill({ color: 0x3b1236, alpha: 0.22 });

    for (const fern of this.ferns) {
      const lt = this.elapsed - fern.delay;
      if (lt <= 0) continue;
      const prog = Math.min(1, lt / fern.duration);
      const sway = (wind + Math.sin(this.elapsed * 1.1 + fern.swayPhase) * 6) * prog;
      const p2 = { x: fern.p2.x + sway, y: fern.p2.y };

      fg.moveTo(fern.p0.x, fern.p0.y);
      const steps = 16;
      for (let s = 1; s <= Math.floor(steps * prog); s++) {
        const pt = quadBezier(fern.p0, fern.p1, p2, s / steps);
        fg.lineTo(pt.x, pt.y);
      }
      const tip = quadBezier(fern.p0, fern.p1, p2, prog);
      fg.lineTo(tip.x, tip.y);
      fg.stroke({ width: 3, color: 0x184d35 });

      for (let k = 1; k <= fern.leafPairs; k++) {
        const t = 0.25 + (k / fern.leafPairs) * 0.68;
        if (prog > t) {
          const ls = Math.min(1, (prog - t) / 0.22) * (0.75 - k * 0.06);
          const pos = quadBezier(fern.p0, fern.p1, p2, t);
          const tan = quadBezierTangent(fern.p0, fern.p1, p2, t);
          this.drawLeaf(fg, pos, tan, -1, ls, 0x1f6343);
          this.drawLeaf(fg, pos, tan, 1, ls, 0x267550);
        }
      }
    }

    for (const fil of this.fillers) {
      const lt = this.elapsed - fil.delay;
      if (lt <= 0) continue;
      const prog = Math.min(1, lt / fil.duration);
      const sway = (wind * 0.8 + Math.sin(this.elapsed * 1.3 + fil.swayPhase) * 7) * prog;
      const p2 = { x: fil.p2.x + sway, y: fil.p2.y };

      sg.moveTo(fil.p0.x, fil.p0.y);
      const steps = 16;
      for (let s = 1; s <= Math.floor(steps * prog); s++) {
        const pt = quadBezier(fil.p0, fil.p1, p2, s / steps);
        sg.lineTo(pt.x, pt.y);
      }
      const tip = quadBezier(fil.p0, fil.p1, p2, prog);
      sg.lineTo(tip.x, tip.y);
      sg.stroke({ width: 2.2, color: 0x2a704c });

      if (prog > 0.72) {
        const budScale = Math.min(1, (prog - 0.72) / 0.28);
        for (const b of fil.buds) {
          const bx = tip.x + b.dx * budScale;
          const by = tip.y + b.dy * budScale;
          sg.moveTo(tip.x, tip.y).lineTo(bx, by).stroke({ width: 1.2, color: 0x3f8f65 });
          fl.circle(bx, by, b.r * budScale).fill(0xfff6e5);
        }
      }
    }

    let allBloomed = true;

    for (const f of this.flowers) {
      const localTime = this.elapsed - f.delay;
      if (localTime <= 0) {
        allBloomed = false;
        continue;
      }

      const stemProg = Math.min(1, localTime / f.stemDuration);
      if (stemProg < 1) allBloomed = false;

      const sway = (wind + Math.sin(this.elapsed * 1.15 + f.swayPhase) * 8) * stemProg;
      const p2Dyn = { x: f.p2.x + sway, y: f.p2.y };

      const steps = 24;
      const maxStep = Math.floor(steps * stemProg);
      sg.moveTo(f.p0.x, f.p0.y);
      for (let s = 1; s <= maxStep; s++) {
        const pt = quadBezier(f.p0, f.p1, p2Dyn, s / steps);
        sg.lineTo(pt.x, pt.y);
      }
      const tipPos = quadBezier(f.p0, f.p1, p2Dyn, stemProg);
      sg.lineTo(tipPos.x, tipPos.y);
      sg.stroke({ width: 6, color: f.stemColor, cap: 'round' });

      for (const leaf of f.leaves) {
        if (stemProg > leaf.t) {
          const leafScale = Math.min(1, (stemProg - leaf.t) / 0.25) * leaf.size;
          const leafPos = quadBezier(f.p0, f.p1, p2Dyn, leaf.t);
          const tan = quadBezierTangent(f.p0, f.p1, p2Dyn, leaf.t);
          this.drawLeaf(sg, leafPos, tan, leaf.side, leafScale, f.leafColor);
        }
      }

      if (stemProg >= 1) {
        const bloomTime = localTime - f.stemDuration;
        const bloomProg = Math.min(1, bloomTime / f.bloomDuration);
        if (bloomProg < 0.85) allBloomed = false;

        const ease = 1 - Math.pow(1 - bloomProg, 3);
        const breathe = 1 + Math.sin(this.elapsed * 1.6 + f.swayPhase) * 0.035;
        const r = f.radius * ease * breathe;
        const rot = Math.sin(this.elapsed * 0.7 + f.swayPhase) * 0.1;
        const tipAngle = quadBezierTangent(f.p0, f.p1, p2Dyn, 1);

        this.drawCalyx(fl, tipPos.x, tipPos.y, tipAngle, ease);

        if (f.species === 'rose') {
          this.drawRose(fl, tipPos.x, tipPos.y, r, f.palette, rot);
        } else if (f.species === 'tulip') {
          this.drawTulip(fl, tipPos.x, tipPos.y, r, f.palette, f.tilt + rot * 0.5);
        } else if (f.species === 'lily') {
          this.drawLily(fl, tipPos.x, tipPos.y, r, f.palette, rot);
        } else {
          this.drawDaisy(fl, tipPos.x, tipPos.y, r, f.palette, rot);
        }
      }
    }

    const ribbonProg = Math.max(0, Math.min(1, (this.elapsed - 1.1) / 1.4));
    this.drawRibbon(rb, ribbonProg);

    if (this.elapsed > 2.8) {
      const fxAlpha = Math.min(1, (this.elapsed - 2.8) / 1.5);

      for (const p of this.petals) {
        p.x += (p.vx + wind * 0.45) * dt;
        p.y += p.vy * dt;
        p.rot += p.vrot * dt;
        if (p.y > h + 20) {
          p.y = -15;
          p.x = w * (0.2 + Math.random() * 0.6);
        }
        this.drawBezierPetal(fx, p.x, p.y, p.rot, p.size * 1.5, p.size * 0.55, p.color, 0x3b0818);
      }

      for (const ff of this.fireflies) {
        ff.y += ff.vy * dt;
        if (ff.y < 30) ff.y = h - 30;
        const glow = 0.35 + 0.65 * (Math.sin(this.elapsed * 2.4 + ff.phase) * 0.5 + 0.5);
        fx.circle(ff.x + Math.sin(this.elapsed * 1.2 + ff.phase) * 14, ff.y, ff.size * glow)
          .fill({ color: 0xffe8b6, alpha: 0.65 * glow * fxAlpha });
      }
    }

    if (allBloomed && !this.quoteTriggered) {
      this.quoteTriggered = true;
      if (this.onBloomed) this.onBloomed();
    }
  }
}