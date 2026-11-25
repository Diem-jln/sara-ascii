export const SHAPE_LIST = [
  { id: 'heart', emotion: 'latido' },
  { id: 'rose', emotion: 'intimidad' },
  { id: 'vortex', emotion: 'confusion' },
  { id: 'infinity', emotion: 'intimidad' },
  { id: 'star', emotion: 'euforia' },
  { id: 'orbits', emotion: 'latido' },
  { id: 'butterfly', emotion: 'intimidad' },
  { id: 'diamond', emotion: 'confusion' },
  { id: 'lissajous', emotion: 'confusion' },
  { id: 'spiralHearts', emotion: 'latido' },
  { id: 'galaxy', emotion: 'euforia' },
  { id: 'eclipse', emotion: 'intimidad' },
  { id: 'clover', emotion: 'latido' },
  { id: 'tunnel', emotion: 'euforia' },
  { id: 'kaleidoscope', emotion: 'euforia' },
  { id: 'ripples', emotion: 'intimidad' },
  { id: 'lotus', emotion: 'intimidad' },
  { id: 'hexgrid', emotion: 'confusion' },
  { id: 'nebula', emotion: 'intimidad' },
  { id: 'crown', emotion: 'euforia' }
];

const ASCII_STAMPS = [
  ['.♥.', '♥♥♥', ' ♥ '],
  [' ✦ ', '✦✧✦', ' ✦ '],
  [' ♪ ', '♫ ♪'],
  ['♡ ♡', ' ♡ '],
  [' + ', '+*+', ' + '],
  ['.·*', '*★*', '*·.'],
  ['(♡)', ' ︶ '],
  ['\\|/', '-✺-', '/|\\'],
  [' ✧ ', '✧♡✧', ' ✧ '],
  ['~♪~', ' ♫ '],
  [' . ', '♦*♦', ' ` '],
  ['╭♡╮', '╰─╯']
];

export class FieldEngine {
  constructor() {
    this.seed = Math.floor(Math.random() * 99999);
    this.time = 0;

    this.shapeIndex = 0;
    this.shapeTimer = 0;
    this.shapeDuration = 7.5 + (this.seed % 4);

    this.weights = {};
    this.params = {};
    for (const s of SHAPE_LIST) {
      this.weights[s.id] = s.id === 'heart' ? 1 : 0;
      this.params[s.id] = this.generateRandomParams();
    }

    this.activeIds = ['heart'];
    this.emotion = 'latido';
    this.smoothAudio = { bass: 0, mid: 0, vocal: 0, treble: 0, energy: 0 };

    this.beatCount = 0;
    this.pulse = 0;
    this.rotation = (this.seed % 360) * (Math.PI / 180);

    this.mouse = { x: 0, y: 0, active: false, energy: 0 };
    this.ripples = [];
    this.stamps = [];
  }

  generateRandomParams() {
    return {
      petals: 3 + Math.floor(Math.random() * 6),
      freqA: 2.0 + Math.random() * 4.5,
      freqB: 2.0 + Math.random() * 4.5,
      dir: Math.random() > 0.5 ? 1 : -1,
      scale: 0.85 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2,
      mirror: Math.random() > 0.65
    };
  }

  get currentShape() {
    return SHAPE_LIST[this.shapeIndex];
  }

  nextShape() {
    let next = Math.floor(Math.random() * SHAPE_LIST.length);
    if (next === this.shapeIndex) {
      next = (this.shapeIndex + 1) % SHAPE_LIST.length;
    }
    this.shapeIndex = next;
    const shape = this.currentShape;
    this.emotion = shape.emotion;
    this.shapeTimer = 0;
    this.shapeDuration = 7.0 + Math.random() * 4.5;
    this.params[shape.id] = this.generateRandomParams();
  }

  setMouse(nx, ny, active) {
    this.mouse.x = nx;
    this.mouse.y = ny;
    this.mouse.active = active;
    if (active) this.mouse.energy = Math.min(1, this.mouse.energy + 0.14);
  }

  addRipple(nx, ny, strength = 1.0) {
    this.ripples.push({ x: nx, y: ny, radius: 0.02, strength });
    if (this.ripples.length > 5) this.ripples.shift();
  }

  spawnStamp(colNorm = null, rowNorm = null) {
    const art = ASCII_STAMPS[Math.floor(Math.random() * ASCII_STAMPS.length)];
    this.stamps.push({
      art,
      colNorm: colNorm ?? 0.1 + Math.random() * 0.8,
      rowNorm: rowNorm ?? 0.18 + Math.random() * 0.66,
      vy: -(0.04 + Math.random() * 0.05),
      life: 1.0,
      decay: 0.36 + Math.random() * 0.2
    });
    if (this.stamps.length > 9) this.stamps.shift();
  }

  update(audio, dt) {
    const smoothRate = Math.min(1, dt * 7.0);
    this.smoothAudio.bass += (audio.bass - this.smoothAudio.bass) * smoothRate;
    this.smoothAudio.mid += (audio.mid - this.smoothAudio.mid) * smoothRate;
    this.smoothAudio.vocal += (audio.vocal - this.smoothAudio.vocal) * smoothRate;
    this.smoothAudio.treble += (audio.treble - this.smoothAudio.treble) * smoothRate;
    this.smoothAudio.energy += (audio.energy - this.smoothAudio.energy) * smoothRate;

    const sa = this.smoothAudio;
    this.time += dt * (0.65 + sa.energy * 2.1);
    this.pulse = Math.max(sa.bass, this.pulse * 0.91);
    this.rotation += dt * (0.22 + sa.energy * 1.05);
    this.mouse.energy *= 0.94;

    this.shapeTimer += dt * (0.85 + sa.energy * 1.15);
    if (this.shapeTimer >= this.shapeDuration) {
      this.nextShape();
    }

    const morphSpeed = Math.min(1, dt * 1.5);
    const activeId = this.currentShape.id;
    this.activeIds = [];

    for (const s of SHAPE_LIST) {
      const target = s.id === activeId ? 1 : 0;
      this.weights[s.id] += (target - this.weights[s.id]) * morphSpeed;
      if (this.weights[s.id] > 0.01) {
        this.activeIds.push(s.id);
      }
    }

    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += dt * 1.45;
      r.strength *= 0.96;
      if (r.strength < 0.04 || r.radius > 2.5) this.ripples.splice(i, 1);
    }

    for (let i = this.stamps.length - 1; i >= 0; i--) {
      const s = this.stamps[i];
      s.rowNorm += s.vy * dt;
      s.life -= dt * s.decay;
      if (s.life <= 0) this.stamps.splice(i, 1);
    }

    if (audio.isBeat) {
      this.beatCount++;
      this.addRipple(0, 0, 0.5 + sa.bass * 0.45);
      if (this.beatCount % 2 === 0) {
        this.spawnStamp();
      }
    }
  }

  heartSDF(x, y, scale) {
    const sx = x / scale;
    const sy = -y / scale + 0.14;
    return Math.pow(sx * sx + sy * sy - 0.55, 3) - sx * sx * Math.pow(sy, 3);
  }

  evalShape(id, x, y, r, angle) {
    const p = this.params[id];
    const sa = this.smoothAudio;
    const t = this.time * p.dir;
    const rot = this.rotation * p.dir + p.phase;
    const mx = p.mirror ? Math.abs(x) : x;

    switch (id) {
      case 'heart': {
        const s = (0.58 + this.pulse * 0.24) * p.scale;
        const h = this.heartSDF(x, y, s);
        return h < 0
          ? 0.72 + Math.sin(r * 10 - t * 3.4) * 0.22
          : Math.exp(-h * 4.5) * 0.85;
      }
      case 'rose': {
        const rad = (0.55 + 0.26 * Math.cos(p.petals * (angle + rot * 0.5))) * p.scale;
        const d = Math.abs(r - rad * (0.85 + this.pulse * 0.28));
        return Math.min(1, Math.exp(-d * 7.5) * 0.9 + Math.exp(-r * 2.2) * 0.45);
      }
      case 'vortex': {
        const sp = Math.sin(r * (7.0 + p.freqA) - angle * p.petals - t * 3.2);
        const rg = Math.cos(r * 10.0 + sa.vocal * 5.0);
        return ((sp * 0.6 + rg * 0.4) + 1) * 0.5 * Math.exp(-r * 0.36);
      }
      case 'infinity': {
        const a = (0.7 + this.pulse * 0.16) * p.scale;
        const eq = Math.abs((x * x + y * y) ** 2 - a * a * (x * x - y * y));
        return Math.exp(-eq * 6.5) * (0.7 + 0.3 * Math.sin(angle * 4 - t * 4.0));
      }
      case 'star': {
        const rays = Math.pow(Math.abs(Math.cos(angle * p.petals + rot)), 3);
        const burst = Math.sin(r * 12 - t * 5.0) * 0.5 + 0.5;
        return (rays * 0.65 + burst * 0.35) * Math.exp(-r * 0.3);
      }
      case 'orbits': {
        const ox = Math.cos(rot * 1.2) * 0.45 * p.scale;
        const oy = Math.sin(rot * 1.2) * 0.32 * p.scale;
        const orb1 = Math.exp(-Math.hypot(x - ox, y - oy) * 4.5);
        const orb2 = Math.exp(-Math.hypot(x + ox, y + oy) * 4.5);
        const halo = Math.exp(-Math.abs(r - 0.55 * p.scale) * 9.0) * 0.55;
        return Math.min(1, orb1 + orb2 + halo);
      }
      case 'butterfly': {
        const wing = (0.45 + 0.38 * Math.sin(angle * 2) - 0.18 * Math.cos(angle * 6) + 0.1 * Math.sin(t * 3)) * p.scale;
        const d = Math.abs(r - Math.abs(wing) * (0.9 + this.pulse * 0.25));
        return Math.exp(-d * 6.5) * (0.75 + 0.25 * Math.sin(r * 10 - t * 3));
      }
      case 'diamond': {
        const ca = Math.cos(rot * 0.4), saRot = Math.sin(rot * 0.4);
        const rx = x * ca - y * saRot;
        const ry = x * saRot + y * ca;
        const manhattan = Math.abs(rx) + Math.abs(ry);
        return (Math.sin(manhattan * (6.0 + p.freqA) - t * 3.5) * 0.5 + 0.5) * Math.exp(-manhattan * 0.45);
      }
      case 'lissajous': {
        const v1 = Math.sin(mx * p.freqA + t);
        const v2 = Math.cos(y * p.freqB - t * 1.15);
        return Math.exp(-Math.abs(v1 - v2) * 3.2) * Math.exp(-r * 0.25);
      }
      case 'spiralHearts': {
        const a = angle + r * 2.2 - t * 1.4;
        const lobes = Math.sin(a * p.petals) * 0.5 + 0.5;
        const pulseRing = Math.exp(-Math.abs(r - (0.45 + 0.25 * lobes) * p.scale) * 7.5);
        const core = Math.exp(-r * 2.4) * (0.6 + 0.4 * this.pulse);
        return Math.min(1, pulseRing * 0.9 + core * 0.7);
      }
      case 'galaxy': {
        const arm = Math.sin(p.petals * angle + Math.log(r + 0.08) * 6.5 - t * 2.8);
        const core = Math.exp(-r * 3.2);
        return Math.min(1, ((arm * 0.5 + 0.5) * Math.exp(-r * 0.65)) + core * 0.85);
      }
      case 'eclipse': {
        const sun = Math.exp(-Math.abs(r - 0.55 * p.scale) * 8.0);
        const moonOffset = 0.16 + Math.sin(t * 0.7) * 0.08;
        const moonDist = Math.hypot(x - moonOffset, y - 0.06);
        const mask = moonDist < 0.48 * p.scale ? 0.12 : 1.0;
        const corona = Math.exp(-r * 1.4) * (0.5 + 0.5 * Math.cos(angle * p.petals + rot));
        return Math.min(1, (sun * 0.95 + corona * 0.5) * mask);
      }
      case 'clover': {
        const leaves = 0.62 * Math.abs(Math.cos(angle * 2 + rot * 0.4)) * p.scale + 0.15;
        const d = Math.abs(r - leaves * (0.9 + this.pulse * 0.25));
        return Math.exp(-d * 7.0);
      }
      case 'tunnel': {
        const invR = 1.0 / (r + 0.18);
        const rings = Math.sin(invR * 3.5 - t * 4.5) * 0.5 + 0.5;
        const ribs = Math.cos(angle * p.petals + rot) * 0.5 + 0.5;
        return (rings * 0.65 + ribs * 0.35) * Math.min(1, r * 1.6);
      }
      case 'kaleidoscope': {
        const sector = (Math.PI * 2) / p.petals;
        const a = Math.abs(((angle + rot) % sector + sector) % sector - sector * 0.5);
        const kx = Math.cos(a) * r;
        const ky = Math.sin(a) * r;
        const pat = Math.sin(kx * p.freqA * 2 + t) * Math.cos(ky * p.freqB * 2 - t);
        return (pat * 0.5 + 0.5) * Math.exp(-r * 0.28);
      }
      case 'ripples': {
        const d1 = Math.hypot(x - 0.45, y);
        const d2 = Math.hypot(x + 0.45, y);
        const w = Math.sin(d1 * 11 - t * 3.8) + Math.sin(d2 * 11 - t * 3.8);
        return (w + 2) * 0.25 * Math.exp(-r * 0.3);
      }
      case 'lotus': {
        const layer1 = 0.56 + 0.22 * Math.abs(Math.sin(angle * p.petals + rot * 0.4));
        const layer2 = 0.34 + 0.16 * Math.abs(Math.cos(angle * p.petals - rot * 0.4));
        const d1 = Math.exp(-Math.abs(r - layer1 * p.scale) * 8.5);
        const d2 = Math.exp(-Math.abs(r - layer2 * p.scale) * 9.5);
        return Math.min(1, d1 * 0.95 + d2 * 0.85);
      }
      case 'hexgrid': {
        const q = x * 3.5 * p.scale;
        const s = y * 3.5 * p.scale;
        const h1 = Math.sin(q + t);
        const h2 = Math.sin(-0.5 * q + 0.866 * s + t);
        const h3 = Math.sin(-0.5 * q - 0.866 * s + t);
        return ((h1 + h2 + h3) / 3 + 0.5) * Math.exp(-r * 0.35);
      }
      case 'nebula': {
        const n1 = Math.sin(x * p.freqA + Math.cos(y * p.freqB + t));
        const n2 = Math.cos(y * p.freqA - Math.sin(x * p.freqB - t * 1.2));
        return ((n1 + n2) * 0.25 + 0.5) * Math.exp(-r * 0.25);
      }
      case 'crown': {
        const scallop = 0.52 + 0.14 * Math.sin(angle * (p.petals * 2) + rot);
        const r1 = Math.exp(-Math.abs(r - scallop * p.scale) * 9.0);
        const r2 = Math.exp(-Math.abs(r - scallop * 0.55 * p.scale) * 9.0);
        return Math.min(1, r1 + r2 * 0.8);
      }
      default:
        return 0;
    }
  }

  sample(nx, ny) {
    let x = nx;
    let y = ny;
    const sa = this.smoothAudio;

    let mouseBoost = 0;
    if (this.mouse.energy > 0.02) {
      const dx = x - this.mouse.x;
      const dy = y - this.mouse.y;
      const dist = Math.hypot(dx, dy) + 0.001;
      if (dist < 0.65) {
        const pull = (1 - dist / 0.65) * this.mouse.energy;
        x -= (dx / dist) * pull * 0.22;
        y -= (dy / dist) * pull * 0.22;
        mouseBoost = pull * 0.6;
      }
    }

    const r = Math.hypot(x, y);
    const angle = Math.atan2(y, x);
    let blended = 0;

    for (let i = 0; i < this.activeIds.length; i++) {
      const id = this.activeIds[i];
      blended += this.evalShape(id, x, y, r, angle) * this.weights[id];
    }

    let rippleBoost = 0;
    for (let i = 0; i < this.ripples.length; i++) {
      const rp = this.ripples[i];
      const d = Math.abs(Math.hypot(nx - rp.x, ny - rp.y) - rp.radius);
      if (d < 0.14) {
        rippleBoost += (1 - d / 0.14) * rp.strength * 0.8;
      }
    }

    const total = blended * (0.72 + sa.energy * 0.55) + rippleBoost + mouseBoost;
    return {
      intensity: Math.max(0, Math.min(1, total)),
      radialDist: r
    };
  }
}