'use strict';

function initStats() {
  var stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  stats.domElement.style.left = '0px';
  document.getElementById('container').appendChild(stats.domElement);
  return stats;
}


function trace(text) {
  function nl2br(text) {
    if(typeof(text) === 'string') {
      return text.replace(/\n/g, '<br/>');
    } else {
      return text;
    }
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

  var controls;
  var vrController;
  var sphere;
  var initialDir;

  function init() {
    Config.showDebug = window.location.href.indexOf("?dev")  > -1;

    if(Config.showDebug) {
      stats = initStats();
    }

    // init 3D
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(backgroundColor, Config.FLOOR_DEPTH/2, Config.FLOOR_DEPTH);

    var aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 1, 1000);
    camera.position.z = Config.FLOOR_DEPTH/2 - 30;

    // initialize renderer
    renderer = new THREE.WebGLRenderer({ antialias: Config.antialias });
    renderer.setClearColor( backgroundColor, 1 );
    renderer.setPixelRatio(Config.devicePixelRatio());
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    // for devel
    //var axisHelper = new THREE.AxisHelper( 10000 );
    //scene.add( axisHelper );

    // cardboard effect
    effect = new THREE.CardboardEffect( renderer );
    effect.setSize( window.innerWidth, window.innerHeight );

    // resize
    window.addEventListener( 'resize', onWindowResize, false );

    // button
    var buttons = new ButtonManager();
    buttons.setMode(0);

    buttons.on('fs', function() {
      buttons.setMode(1);
      //Util.fullscreenRequest(renderer.domElement);
      Util.fullscreenRequest(document.body);
    });
    buttons.on('settings', function() {
      // TOOD settings 건드릴수 있는 페이지로 이동
      console.log('TODO move settings');
    });
    buttons.on('back', function() {
      buttons.setMode(0);
      Util.fullscreenExit();
    });

    function onFullscreenChange(e) {
      if(Util.fullscreenStatus()) {
        buttons.setMode(1);
      } else {
        buttons.setMode(0);
      }
    }
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange', onFullscreenChange);
    document.addEventListener('MSFullscreenChange', onFullscreenChange);

    initControl();
    initAudio();

    // VR control - start
    vrController = new THREE.Object3D();
    controls = new THREE.VRControls(vrController);

    // TODO webvr의 센서 초기화가 끝날때까지 약간의 시간이 필요하다
    // 언제 초기화가 끝나는지 아직 못찾아서 편법으로 대기시간을 주었다
    setTimeout(function() {
      resetInitialDirection();
    }, 3000);

    sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 8),
      new THREE.MeshNormalMaterial()
    );
    //scene.add(sphere);
    // VR control - end

    game = new Game(this);
    game.init();

    animate();

    //fade in
    TweenMax.fromTo(fxParams, 1, {brightness: -1}, {brightness:0, delay:0.5});
  }

  function resetInitialDirection() {
    controls.update();
    initialDir = new THREE.Vector3(0, 0, -1);
    initialDir.applyQuaternion(vrController.quaternion);
    initialDir.y = 0;
    initialDir.normalize();
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
    resetInitialDirection();
    game.startGame(isFirstGame);
    isFirstGame = false;
  }

  function onGameOver() {
    playCollide();

    hueTime = 0;
  }

  function animate() {
    requestAnimationFrame( animate );

    controls.update();
    game.animate();

    if(typeof(initialDir) !== 'undefined') {
      var dir = new THREE.Vector3(0, 0, -1);
      dir.applyQuaternion(vrController.quaternion);
      dir.y = 0;
      dir.normalize();

      // vector normalized를 이미 거쳤기때문에 dot 결과가가 곧 cos
      var dotVal = initialDir.dot(dir);
      var crossVec = initialDir.clone();
      crossVec.cross(dir);
      var innerDegree = Math.acos(dotVal) * 180 / Math.PI;
      if(crossVec.y > 0) {
        innerDegree *= -1;
      }

      var allowDegSize = 20;
      var deg = innerDegree;
      if(deg < -allowDegSize) {
        deg = -allowDegSize;
      } else if(deg > allowDegSize) {
        deg = allowDegSize;
      }
      var turn = deg / allowDegSize;
      // TODO 좌우/강도 기반 입력이 가능하도록
      /*
      trace([
        `v1: ${JSON.stringify(initialDir)}`,
        `v2: ${JSON.stringify(dir)}`,
        `deg: ${innerDegree}`,
        `turn: ${turn}`,
      ].join('\n'));
      */
      game.turnScale(turn);
    }

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

    render();
  }

  function render() {
    const renderMode = Config.renderMode();
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
        game.turnScale(1);
        break;
      case leftKey:
        game.turnScale(-1);
        break;
      }
    }

    document.onkeyup = function(event) {
      lastEvent = null;

      switch ( event.keyCode ) {
      case rightKey:
        game.turnScale(0);
        break;
      case leftKey:
        game.turnScale(0);
        break;
      }
    }

    renderer.domElement.ontouchstart = function(event) {
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

    renderer.domElement.ontouchend = function(event) {
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
    vrController,

    scene: function() { return scene; },
    camera: function() { return camera; },
    game: function() { return game; },
  };
};

if(!Util.webglDetect()) {
  alert('WebGL not supported!');
}
var main = new Main();
main.init();
