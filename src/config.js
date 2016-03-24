// Global config
var Config = {
  // debug toggles
  playSound: true,
  playMusic: false,
  hitDetect: true,
  showDebug: true,
  antialias: false,
  useWakelock: false,

  //const dimensions
  // size of floor in x direction
  FLOOR_WIDTH: 360,
  // size of floor in z direction
  FLOOR_DEPTH: 720,
  //z distance to move before recreating a new floor strip
  MOVE_STEP: 50,

  renderMode: function() {
    let renderMode = "cardboard";
    return renderMode || 'simple';
  },
  devicePixelRatio: function() {
    var ratio = window.devicePixelRatio;
    if(ratio > 2) {
      ratio = 2;
    }
    return ratio;
  },
};

const noiseScale = 3;
const noiseSeed = Math.random() * 100;
const snoise = new ImprovedNoise();

const backgroundColor = 0x061837;
