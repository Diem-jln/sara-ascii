export const ASCII_SETS = {
  intimidad: [
    '  .`·,:;-~=+*°oO',
    '  .`·,:;~-+=*°✧✦',
    '  .`·,´`¨~-:=+*°○◎',
    '  .`·,:;…~-+=*°·✧○'
  ],
  confusion: [
    '  .`·:;/\\|()[]{}?¿!%#',
    '  .`·,:;~<>/?¿\\|{}[]#@',
    '  .`·:;!¡?¿/\\|<>[]{}&%$#',
    '  .`·,:;^~<>()[]{}/\\|?#§@'
  ],
  latido: [
    '  .`·,:;oO0*@+♦♡♥●',
    '  .`·,:;~+oO0@♦♡♥█',
    '  .`·,:;°oO0◎●♦♡♥✦',
    '  .`·,:;-~+oO0*♦♡♥▓█'
  ],
  euforia: [
    '  .`·,:;+*=#░▒▓█✦★',
    '  .`·,:;~+*xX#░▒▓█✺✦',
    '  .`·,:;+=*xX%#░▒▓█✧✦★',
    '  .`·,:;~+*#&@░▒▓█✵✦★✺'
  ]
};

const SPARK_CHARS = ['✦', '✧', '★', '☆', '✺', '✵', '·', '°', '+', '×', '♡', '♦'];

export class AsciiLibrary {
  constructor(seed) {
    this.seed = seed;
    this.ramps = {
      intimidad: ASCII_SETS.intimidad[seed % ASCII_SETS.intimidad.length],
      confusion: ASCII_SETS.confusion[(seed >> 1) % ASCII_SETS.confusion.length],
      latido: ASCII_SETS.latido[(seed >> 2) % ASCII_SETS.latido.length],
      euforia: ASCII_SETS.euforia[(seed >> 3) % ASCII_SETS.euforia.length]
    };
  }

  pickChar(emotion, intensity, treble = 0, spatialHash = 0) {
    const ramp = this.ramps[emotion] || this.ramps.intimidad;
    const clamped = Math.max(0, Math.min(0.999, intensity));
    const index = Math.floor(clamped * ramp.length);

    if (intensity > 0.84 && treble > 0.4 && ((spatialHash + this.seed) % 17 === 0)) {
      return SPARK_CHARS[(spatialHash + this.seed) % SPARK_CHARS.length];
    }

    return ramp[index];
  }
}