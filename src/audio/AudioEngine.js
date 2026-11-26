export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.analyser = null;
    this.media = document.createElement('video');
    this.media.playsInline = true;
    this.media.preload = 'auto';
    this.source = null;
    this.data = null;

    this.currentObjectUrl = null;
    this.energyHistory = [];
    this.lastBeatTime = 0;
    this.isPlaying = false;
  }

  async initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.78;
      this.data = new Uint8Array(this.analyser.frequencyBinCount);

      this.source = this.ctx.createMediaElementSource(this.media);
      this.source.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  resetMedia() {
    this.media.pause();
    this.isPlaying = false;
    this.media.removeAttribute('src');
    this.media.load();

    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = null;
    }
  }

  async loadUrl(url, isBlob = false) {
    await this.initContext();
    this.resetMedia();

    if (isBlob) {
      this.currentObjectUrl = url;
    }

    this.media.src = url;
    this.media.currentTime = 0;

    // Espera a que el navegador confirme que la nueva pista cargó antes de reproducir
    await new Promise((resolve, reject) => {
      const onReady = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error(`No se pudo cargar el archivo (${url})`));
      };
      const cleanup = () => {
        this.media.removeEventListener('canplay', onReady);
        this.media.removeEventListener('error', onError);
      };

      this.media.addEventListener('canplay', onReady, { once: true });
      this.media.addEventListener('error', onError, { once: true });
      this.media.load();
    });

    await this.media.play();
    this.isPlaying = true;
  }

  async loadFile(file) {
    const objectUrl = URL.createObjectURL(file);
    await this.loadUrl(objectUrl, true);
  }

  togglePlay() {
    if (!this.ctx) return false;
    if (this.media.paused) {
      this.media.play();
      this.isPlaying = true;
    } else {
      this.media.pause();
      this.isPlaying = false;
    }
    return this.isPlaying;
  }

  getTimeInfo() {
    return {
      current: this.media.currentTime || 0,
      duration: this.media.duration || 0
    };
  }

  seek(ratio) {
    if (this.media.duration) {
      this.media.currentTime = Math.max(0, Math.min(1, ratio)) * this.media.duration;
    }
  }

  onEnded(callback) {
    this.media.addEventListener('ended', callback);
  }

  getBandAverage(startBin, endBin) {
    let sum = 0;
    const count = Math.max(1, endBin - startBin);
    for (let i = startBin; i < endBin; i++) {
      sum += this.data[i];
    }
    return sum / (count * 255);
  }

  update() {
    if (!this.analyser || !this.isPlaying) {
      return { bass: 0, mid: 0, vocal: 0, treble: 0, energy: 0, isBeat: false };
    }

    this.analyser.getByteFrequencyData(this.data);

    const bass = this.getBandAverage(1, 10);
    const mid = this.getBandAverage(10, 45);
    const vocal = this.getBandAverage(45, 130);
    const treble = this.getBandAverage(130, 280);
    const energy = bass * 0.4 + mid * 0.25 + vocal * 0.2 + treble * 0.15;

    this.energyHistory.push(bass);
    if (this.energyHistory.length > 40) this.energyHistory.shift();

    const avgBass =
      this.energyHistory.reduce((acc, v) => acc + v, 0) / this.energyHistory.length;

    const now = performance.now();
    const isBeat = bass > avgBass * 1.28 && bass > 0.35 && now - this.lastBeatTime > 260;

    if (isBeat) this.lastBeatTime = now;

    return { bass, mid, vocal, treble, energy, isBeat };
  }
}