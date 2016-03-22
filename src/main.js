function initStats() {
  var stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  stats.domElement.style.left = '0px';
  document.querySelector("#container").appendChild(stats.domElement);
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

function fillGeometryVertexColors(geometry, color) {
  const faceIndices = [ 'a', 'b', 'c' ];
  for(let i = 0 ; i < geometry.faces.length ; i++) {
    let f = geometry.faces[i];
    for(let j = 0 ; j < 3 ; j++) {
      let vertexIndex = f[ faceIndices[ j ] ];
      let p = geometry.vertices[ vertexIndex ];
      f.vertexColors[ j ] = color;
    }
  }
}

var Main = function() {
  var stats;

  var camera, scene, renderer;
  var effect;

  var edgeTree;
  var floor;
  var snow;

  var cameraFollowingLights = [];

  var presentGroup;
  var moverGroup;

  function init() {
    Config.showDebug = window.location.href.indexOf("?dev")  > -1;

    if(Config.showDebug){
      stats = initStats();
    }

    // initialize scene
    scene = new THREE.Scene();

    // initialize fog
    scene.fog = new THREE.Fog(backgroundColor, Config.FLOOR_DEPTH/2, Config.FLOOR_DEPTH);

    // initialize camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.z = Config.FLOOR_DEPTH/2 - 300;
    camera.focalLength = camera.position.distanceTo( scene.position );
    camera.lookAt( scene.position );

    // lights
    // HemisphereLight(skyColorHex, groundColorHex, intensity)
    var hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.6);
    scene.add( hemisphereLight );
    hemisphereLight.position.y = 300;

    //middle light
    var centerLight = new THREE.PointLight( 0xFFFFFF, 0.8, 4500 );
    scene.add(centerLight);
    centerLight.position.z = Config.FLOOR_DEPTH/4;
    centerLight.position.y = 500;

    var frontLight = new THREE.PointLight( 0xFFFFFF, 1, 2500 );
    scene.add(frontLight);
    frontLight.position.z = Config.FLOOR_DEPTH/2;

    cameraFollowingLights.push(centerLight);
    cameraFollowingLights.push(frontLight);

    moverGroup = new THREE.Object3D();
    scene.add( moverGroup );

    // for development helper
    //var axisHelper = new THREE.AxisHelper( 10000 );
    //scene.add( axisHelper );

    // init tree
    //var treeScale = ATUtil.randomRange(0.8,1.3);

    // add trees down the edges
    edgeTree = new EdgeTree();
    scene.add(edgeTree);

    // init floor
    floor = new Floor();
    scene.add(floor);

    // init snow
    snow = new Snow();
    snow.init(scene, moverGroup);

    //add floating present
    present = new Present();
    scene.add(present);

    // initialize renderer
    renderer = new THREE.WebGLRenderer( { antialias: Config.antialias } );
    renderer.setClearColor( backgroundColor, 1 );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    // enable fullscreen feature
    if(Config.getRenderMode() === 'cardboard') {
      initFullscreen(renderer);
    }

    // cardboard effect
    effect = new THREE.CardboardEffect( renderer );
    effect.setSize( window.innerWidth, window.innerHeight );

    // resize
    window.addEventListener( 'resize', onWindowResize, false );
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    effect.setSize( window.innerWidth, window.innerHeight );
  }

  function calcStep() {
    // 카메라 위치를 플레이어 위치로. 일단은 간단하니까
    var posZ = camera.position.z;
    var tmp = posZ + Config.FLOOR_DEPTH / 2;
    var step = Math.abs(Math.floor(tmp / Config.FLOOR_DEPTH)) + 1;
    return step;
  }

  function animate() {
    requestAnimationFrame( animate );

    if (Config.showDebug){
      stats.update();
    }

    var speed = -30;
    camera.position.z += speed;
    _.each(cameraFollowingLights, function(light) {
      light.position.z = camera.position.z;
    });
    moverGroup.position.z = camera.position.z;

    snow.animate();

    var step = calcStep();
    edgeTree.position.z = -step * Config.FLOOR_DEPTH;
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

    if(Config.showDebug) {
    //  showDebugInfo();
    }

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

  function showDebugInfo() {
    var msg = [
      `cam pos z : ${camera.position.z}`,
      `edge tree pos z : ${edgeTree.position.z}`,
      `floor pos z : ${floor.position.z}`,
      `step : ${step}`,
    ].join('\n');
    trace(msg);
  }

  var debugTextNode = document.querySelector('#debug-text');
  function trace(text){
    function nl2br(text) {
      return text.replace(/\n/g, '<br/>');
    }
    if (Config.showDebug){
      debugTextNode.innerHTML = nl2br(text);
    }
  }

  return {
    init: init,
    animate: animate,
    trace: trace,
  };
};

var main = new Main();
main.init();
main.animate();
