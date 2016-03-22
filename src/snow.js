var Snow = function() {
  var SNOW_COUNT = 400;
  var SNOW_EDGE = 100;
  var SNOW_TOP = 1600;
  var SNOW_BOTTOM = -300;
  var BAR_COUNT = 20;

  var windDir = 0;
  var windStrength = 0;
  var snowTime = 0;

  var snowGeometry;
  var bars;

  var snoise = new ImprovedNoise();

  var snowMaterial = new THREE.PointsMaterial( {
    size: 50,
    sizeAttenuation: true,
    map: new THREE.TextureLoader().load( "res/img/snow.png" ),
    transparent: true ,
    blending: THREE.AdditiveBlending,
    depthTest: true,
    opacity:0.7,
    depthWrite:false
  } );

  var barMaterial = new THREE.MeshBasicMaterial({
    color: 0x0FF66FF,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true,
    opacity:.6,
    sizeAttenuation: true,
    side: THREE.DoubleSide,
  });

  var skyMaterial = new THREE.MeshBasicMaterial( {
    map: new THREE.TextureLoader().load( "res/img/xmas-sky.jpg" ),
    transparent:true,
    depthTest: true,
    fog:false
  } );

  function initSky() {
    let planeGeometry = new THREE.PlaneGeometry( 800, 300,1,1 );
    let skyMesh = new THREE.Mesh( planeGeometry, skyMaterial );
    skyMesh.scale.x = skyMesh.scale.y = 15;
    //skyMesh.position.z = -3600;
    skyMesh.position.z = -10000;
    skyMesh.position.y = 1500;
    return skyMesh;
  }

  function initSnowParticles() {
    //make falling snow
    snowGeometry = new THREE.Geometry();

    for (let i = 0; i < SNOW_COUNT; i ++ ) {
      var vertex = new THREE.Vector3();
      vertex.x = ATUtil.randomRange(-Config.FLOOR_WIDTH/2,Config.FLOOR_WIDTH/2);
      vertex.y = ATUtil.randomRange(SNOW_BOTTOM,SNOW_TOP);
      vertex.z = ATUtil.randomRange(-Config.FLOOR_DEPTH/2,Config.FLOOR_DEPTH/2);

      snowGeometry.vertices.push( vertex );
    }

    var particles = new THREE.Points( snowGeometry, snowMaterial );
    return particles;
  }

  function initBars() {
    const width = 4;
    const spread =  1000;

    const barGeom = new THREE.PlaneGeometry(20,500,1,1);
    const bar = new THREE.Mesh( barGeom, barMaterial );

    const bars = [];

    for (let i = 0; i < BAR_COUNT; i++) {
      bar.scale.x = ATUtil.randomRange(0.2,2);
      bar.origYScale = ATUtil.randomRange(0.2,2);
      bar.scale.z = ATUtil.randomRange(0.2,2);

      bar.rotation.x = Math.PI/2;
      bar.rotation.y = Math.PI/2;

      bar.position.x = ATUtil.randomRange(-Config.FLOOR_WIDTH/2,Config.FLOOR_WIDTH/2);
      bar.position.y = ATUtil.randomRange(-300,600);
      bar.position.z = ATUtil.randomRange(-Config.FLOOR_DEPTH/2,Config.FLOOR_DEPTH/2);

      bars.push(bar);
    }
    return bars;
  }

  function init(scene, moverGroup) {
    //make falling snow
    var particles = initSnowParticles();
    moverGroup.add( particles );

    //STRIPS
    //add bars for at high speed
    bars = initBars();
    _.each(bars, function(bar) { moverGroup.add( bar ); });

    //SKY
    var sky = initSky();
    moverGroup.add(sky);
  }

  function animate() {
    animateSnow();
    animateBar();
  }

  function animateSnow() {
    //global perlin wind
    snowTime += 0.001;
    windStrength = snoise.noise(snowTime,0,0)*20;
    windDir = (snoise.noise(snowTime + 100,0,0) + 1)/2 * Math.PI*2;

    for(let  i = 0; i < SNOW_COUNT; i++) {
      var vert = snowGeometry.vertices[i];

      //gravity
      vert.y -= 3;

      //bounds wrapping
      if (vert.y < SNOW_BOTTOM){
        vert.y = SNOW_TOP;
      }

      //only do fancy wind if not playing
      //if (!Game.getPlaying()){
      if (true) {

        vert.x += Math.cos(windDir)*windStrength;
        vert.z += Math.sin(windDir)*windStrength;

        //wrap around edges
        if (vert.x > Config.FLOOR_WIDTH/2 + SNOW_EDGE) vert.x = -Config.FLOOR_WIDTH/2 + SNOW_EDGE;
        if (vert.x < -Config.FLOOR_WIDTH/2 + SNOW_EDGE) vert.x = Config.FLOOR_WIDTH/2 + SNOW_EDGE;

        if (vert.z > Config.FLOOR_DEPTH/2 + SNOW_EDGE) vert.z = -Config.FLOOR_DEPTH/2 + SNOW_EDGE;
        if (vert.z < -Config.FLOOR_DEPTH/2 + SNOW_EDGE) vert.z = Config.FLOOR_DEPTH/2 + SNOW_EDGE;

      }

    }
    snowGeometry.verticesNeedUpdate = true;
  }

  function animateBar() {
    //TODO Game.getSpeed();
    var speed = 100;
    var opac = (speed - 0.5) *2;

    barMaterial.opacity = opac*2/3;
    skyMaterial.opacity = opac;

    for (let i = 0; i < BAR_COUNT; i++) {
      var p = bars[i].position;
      p.z +=40;

      bars[i].scale.y = bars[i].origYScale * opac;
    }

  }

  return {
    init,
    animate,
  }
};
