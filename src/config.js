// Global config
var Config = {
  // debug toggles
  playSound: true,
  playMusic: false,
  hitDetect: false,
  showDebug: true,
  antialias: false,

  //const dimensions
  // size of floor in x direction
  FLOOR_WIDTH: 3600,
  // size of floor in z direction
  FLOOR_DEPTH: 7200,
  //z distance to move before recreating a new floor strip
  MOVE_STEP: 500,

  // render mode
  //renderMode: "cardboard",
  getRenderMode: function() {
    return this.renderMode || 'simple';
  }
};

const noiseScale = 3;
const noiseSeed = Math.random() * 100;
const snoise = new ImprovedNoise();

const backgroundColor = 0x061837;
