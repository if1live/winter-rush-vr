// Global config
var Config = {
  // debug toggles
  playSound: true,
  playMusic: true,
  hitDetect: true,
  showDebug: true,
  antialias: false,

  //const dimensions
  FLOOR_WIDTH: 3600, // size of floor in x direction
  FLOOR_DEPTH: 7200, //size of floor in z direction

  // render mode
  renderMode: "cardboard",

  getRenderMode: function() {
    return this.renderMode || 'simple';
  }
};

const noiseScale = 3;
const noiseSeed = Math.random() * 100;
const snoise = new ImprovedNoise();

const backgroundColor = 0x061837;
