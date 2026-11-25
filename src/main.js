import './style.css';
import { AudioEngine } from './audio/AudioEngine.js';
import { FieldEngine } from './core/FieldEngine.js';
import { EmotionPalette } from './core/EmotionPalette.js';
import { AsciiRenderer } from './render/AsciiRenderer.js';
import { BouquetFinale } from './render/BouquetFinale.js';

const canvas = document.getElementById('ascii-canvas');
const overlay = document.getElementById('ui-overlay');
const btnDefault = document.getElementById('btn-default');
const audioInput = document.getElementById('audio-input');
const statusMsg = document.getElementById('status-msg');
const hud = document.getElementById('hud');
const hudSeed = document.getElementById('hud-seed');
const btnToggle = document.getElementById('btn-toggle');
const progressWrap = document.getElementById('progress-wrap');
const progressBar = document.getElementById('progress-bar');
const lyricText = document.getElementById('lyric-text');
const finaleLayer = document.getElementById('finale-layer');
const pixiBouquetMount = document.getElementById('pixi-bouquet');
const finaleQuote = document.getElementById('finale-quote');

const audioEngine = new AudioEngine();
const fieldEngine = new FieldEngine();
const palette = new EmotionPalette(fieldEngine.seed);
const renderer = new AsciiRenderer(canvas, fieldEngine.seed);
const bouquetFinale = new BouquetFinale(pixiBouquetMount);

hudSeed.textContent = `#${fieldEngine.seed}`;

const LYRIC_CUES = [
  { start: 15, end: 19.5, text: 'Che confusione, sarà perché ti amo' },
  { start: 22, end: 26.5, text: 'È un’emozione che cresce piano piano' },
  { start: 33, end: 37.5, text: 'Stringimi forte e stammi più vicino' },
  { start: 78, end: 83, text: 'E se ci sto bene, sarà perché ti amo' }
];

let currentLyric = '';

function renderAnimatedLyric(phrase) {
  lyricText.innerHTML = '';
  [...phrase].forEach((ch, i) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.style.setProperty('--i', i);
    span.textContent = ch === ' ' ? '\u00A0' : ch;
    lyricText.appendChild(span);
  });
}

function updateLyrics(currentTime) {
  const cue = LYRIC_CUES.find((c) => currentTime >= c.start && currentTime <= c.end);
  const nextText = cue ? cue.text : '';

  if (nextText !== currentLyric) {
    currentLyric = nextText;
    if (nextText) {
      renderAnimatedLyric(nextText);
      lyricText.classList.add('visible');
    } else {
      lyricText.classList.remove('visible');
    }
  }
}

function startExperience() {
  overlay.classList.add('fade-out');
  hud.classList.remove('hidden');
}

function triggerFinale() {
  hud.classList.add('hidden');
  lyricText.classList.remove('visible');
  finaleLayer.classList.remove('hidden');

  requestAnimationFrame(() => {
    finaleLayer.classList.add('active');
    setTimeout(() => {
      bouquetFinale.start(() => {
        finaleQuote.classList.add('visible');
      });
    }, 1100);
  });
}

audioEngine.onEnded(() => triggerFinale());

function getNormalizedCoords(e) {
  const aspect = window.innerWidth / window.innerHeight;
  const nx = ((e.clientX / window.innerWidth) * 2 - 1) * aspect;
  const ny = (e.clientY / window.innerHeight) * 2 - 1;
  return { nx, ny };
}

window.addEventListener('mousemove', (e) => {
  const { nx, ny } = getNormalizedCoords(e);
  fieldEngine.setMouse(nx, ny, true);
});

window.addEventListener('mouseleave', () => {
  fieldEngine.setMouse(0, 0, false);
});

window.addEventListener('mousedown', (e) => {
  if (
    e.target.closest('#ui-overlay') ||
    e.target.closest('#hud') ||
    finaleLayer.classList.contains('active')
  ) {
    return;
  }
  const { nx, ny } = getNormalizedCoords(e);
  fieldEngine.addRipple(nx, ny, 1.3);
  fieldEngine.spawnStamp(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
});

progressWrap.addEventListener('click', (e) => {
  const rect = progressWrap.getBoundingClientRect();
  const ratio = (e.clientX - rect.left) / rect.width;
  audioEngine.seek(ratio);
});

btnDefault.addEventListener('click', async () => {
  try {
    statusMsg.textContent = 'Cargando pista...';
    await audioEngine.loadUrl('/audio/sara_perche_ti_amo.mp4');
    startExperience();
  } catch (err) {
    console.error(err);
    statusMsg.textContent =
      'No se encontró /public/audio/sara_perche_ti_amo.mp4. Usa "Cargar otro audio / video".';
  }
});

audioInput.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    await audioEngine.loadFile(file);
    startExperience();
  } catch (err) {
    console.error(err);
    statusMsg.textContent = 'Error al reproducir el archivo seleccionado.';
  }
});

btnToggle.addEventListener('click', () => {
  const playing = audioEngine.togglePlay();
  btnToggle.textContent = playing ? '❚❚' : '▶';
});

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (key === 'h') {
    hud.classList.toggle('hidden');
  } else if (e.code === 'Space' && overlay.classList.contains('fade-out')) {
    e.preventDefault();
    fieldEngine.nextShape();
    fieldEngine.addRipple(0, 0, 1.0);
  } else if (key === 'f') {
    triggerFinale();
  }
});

window.addEventListener('resize', () => renderer.resize());

let lastTime = performance.now();

function animate(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  const audioData = audioEngine.update();
  const { current, duration } = audioEngine.getTimeInfo();

  if (duration > 0) {
    progressBar.style.width = `${(current / duration) * 100}%`;
    updateLyrics(current);
  }

  fieldEngine.update(audioData, dt);
  palette.update(fieldEngine.emotion, 0.04);
  renderer.render(fieldEngine, palette, audioData);

  if (currentLyric) {
    const scale = 1 + audioData.bass * 0.05;
    lyricText.style.transform = `scale(${scale.toFixed(3)})`;
  }

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);