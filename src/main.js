function initStats() {
  var stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  stats.domElement.style.left = '0px';
  document.getElementById('container').appendChild(stats.domElement);
  return stats;
}

function initFullscreen(renderer) {
  // enable fullscreen feature
  renderer.domElement.addEventListener( 'click', function () {
    if ( this.requestFullscreen ) {
      this.requestFullscreen();
    } else if ( this.msRequestFullscreen ) {
      this.msRequestFullscreen();
    } else if ( this.mozRequestFullScreen ) {
      this.mozRequestFullScreen();
    } else if ( this.webkitRequestFullscreen ) {
      this.webkitRequestFullscreen();
    }
  });
}

function trace(text) {
  function nl2br(text) {
    return text.replace(/\n/g, '<br/>');
  }
  var debugTextNode = document.getElementById('debug-text');
  debugTextNode.innerHTML = nl2br(text);
}


function Main() {
  var game;

  var stats;

  var camera, scene, renderer;
  var effect;

  var hueTime = 0;
  var fxParams = {
    vignetteAmount: 0.8,
    brightness: 0,
    saturation: 0.5,
  };

  var sndPickup;
  var sndCollide;
  var sndBest;
  var sndMusic;

  var isFirstGame = true;

  function init() {
    Config.showDebug = window.location.href.indexOf("?dev")  > -1;

    if(Config.showDebug) {
      stats = initStats();
    }

    initControl();
    initAudio();

    // init 3D
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(backgroundColor, Config.FLOOR_DEPTH/2, Config.FLOOR_DEPTH);

    var aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 1, 10000);
    camera.position.z = Config.FLOOR_DEPTH/2 - 300;

    // initialize renderer
    renderer = new THREE.WebGLRenderer( { antialias: Config.antialias } );
    renderer.setClearColor( backgroundColor, 1 );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    // for devel
    var axisHelper = new THREE.AxisHelper( 10000 );
    scene.add( axisHelper );


    // cardboard effect
    effect = new THREE.CardboardEffect( renderer );
    effect.setSize( window.innerWidth, window.innerHeight );

    // enable fullscreen feature
    if(Config.getRenderMode() === 'cardboard') {
      initFullscreen(renderer);
    }

    // resize
    window.addEventListener( 'resize', onWindowResize, false );

    game = new Game(this);
    game.init();

    animate();

    //fade in
    TweenMax.fromTo(fxParams, 1, {brightness: -1}, {brightness:0, delay:0.5});
  }

  function onWindowResize() {
    let w = window.innerWidth;
    let h = window.innerHeight;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    effect.setSize(w, h);
    renderer.setSize(w, h);
  }

  function onGameStart() {
    //score = 0;

    if(typeof(sndMusic) !== 'undefined' && isFirstGame) {
      sndMusic.play();
    }
    game.startGame(isFirstGame);
    isFirstGame = false;
  }

  function onGameOver() {
    playCollide();

    hueTime = 0;
  }

  function animate() {
    requestAnimationFrame( animate );
    game.animate();
    if (Config.showDebug){
      stats.update();
    }

    //faster = more hue amount and faster shifts
    var hueAmount;
    if(game.speed() < 0.5) {
      hueAmount = 0;
    } else {
      hueAmount = (game.speed() - 0.5) * 2;
    }

    hueTime += game.speed() * game.speed() * 0.05;
    var hue = hueTime % 2 - 1; //put in range -1 to 1

    /*
    snow.animate();
    sky.animate();
    barGroup.animate();

    var step = calcStep();
    edgeTreeGroup.position.z = -step * Config.FLOOR_DEPTH;
    floor.position.z = -step * Config.FLOOR_DEPTH;
    if(floor.step() !== step) {
      floor.nextStep();
      console.log(`next floor step : ${step}`);
    }
    if(present.position.z > camera.position.z) {
      present.nextStep();
      console.log(`next present step : ${step}`);
    }
    present.animate();
    */

    render();
  }

  function render() {
    const renderMode = Config.getRenderMode();
    if(renderMode === 'cardboard') {
      effect.render( scene, camera );
    } else if(renderMode === 'simple') {
      renderer.render(scene, camera);
    } else {
      console.error(`unknown render mode : ${Config.renderMode}`);
    }
  }

  function playCollide() {
    if(typeof(sndCollide) !== 'undefined') {
      sndCollide.play();
    }
  }

  function playScorePoint() {
    if(typeof(sndPickup) !== 'undefined') {
      sndPickup.play();
    }
  }

  // howler 안에 isMuted() 같은 함수가 없다
  // 그래서 재생 상태를 따로 관리
  var musicMuted = false;
  function toggleMusic() {
    if(musicMuted) {
      sndMusic.unmute();
    } else {
      sndMusic.mute();
    }
    musicMuted = !musicMuted;
  }


  function initAudio() {
    if(Config.playSound) {
      sndPickup = new Howl( {urls: ["res/audio/point.mp3"]});
      sndCollide = new Howl({ urls: ["res/audio/hit.mp3"]});
      sndBest = new Howl( {urls: ["res/audio/best.mp3"]});
    }

    if(Config.playMusic) {
      sndMusic = new Howl( {urls: ["res/audio/rouet.mp3"], loop: true,});
    }
  }

  function initControl() {
    let lastEvent;

    // https://css-tricks.com/snippets/javascript/javascript-keycodes/
    const leftKey = 37;
    const rightKey = 39;

    document.onkeydown = function(event) {
      if (lastEvent && lastEvent.keyCode == event.keyCode) {
        return;
      }

      lastEvent = event;

      if(!game.playing() && game.acceptInput()) {
        onGameStart();
      }

      switch ( event.keyCode ) {
      case rightKey:
        game.rightDown(true);
        break;
      case leftKey:
        game.leftDown( true);
        break;
      }
    }

    document.onkeyup = function(event) {
      lastEvent = null;

      switch ( event.keyCode ) {
      case rightKey:
        game.rightDown(false);
        break;
      case leftKey:
        game.leftDown(false);
        break;
      }
    }

    document.ontouchstart = function(event) {
      if(!game.playing() && game.acceptInput()){
        onGameStart();
      }

      for(let i = 0; i <  event.touches.length; i++) {
        event.preventDefault();
        var xpos = event.touches[ i ].pageX;
        if (xpos > window.innerWidth / 2){
          game.rightDown(true);
        } else {
          game.leftDown(true);
        }
      }
    }

    document.ontouchend = function(event) {
      for(  var i = 0; i <  event.changedTouches.length; i++) {
        event.preventDefault();
        var xpos = event.changedTouches[ i ].pageX;
        if (xpos > window.innerWidth / 2){
          game.rightDown(false);
        }else{
          game.leftDown( false);
        }
      }
    }
  }


  return {
    init,
    trace,

    playCollide,
    playScorePoint,
    toggleMusic,

    onGameStart,
    onGameOver,

    fxParams,

    scene: function() { return scene; },
    camera: function() { return camera; },
  };
};

var main = new Main();
main.init();
