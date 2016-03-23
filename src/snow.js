const SNOW_COUNT = 400;
const SNOW_EDGE = 100;
const SNOW_TOP = 1600;
const SNOW_BOTTOM = -300;

const snowMaterial = new THREE.PointsMaterial( {
  size: 50,
  map: new THREE.TextureLoader().load( "res/img/snow.png" ),
  transparent: true ,
  blending: THREE.AdditiveBlending,
  depthTest: true,
  opacity:0.7,
  depthWrite:false
} );

function Snow() {
  THREE.Object3D.call(this);
  this.type = 'Snow';

  //make falling snow
  var snowGeometry = new THREE.Geometry();

  for (let i = 0; i < SNOW_COUNT; i ++ ) {
    var vertex = new THREE.Vector3();
    vertex.x = ATUtil.randomRange(-Config.FLOOR_WIDTH/2, Config.FLOOR_WIDTH/2);
    vertex.y = ATUtil.randomRange(SNOW_BOTTOM, SNOW_TOP);
    vertex.z = ATUtil.randomRange(-Config.FLOOR_DEPTH/2, Config.FLOOR_DEPTH/2);

    snowGeometry.vertices.push( vertex );
  }

  var particles = new THREE.Points( snowGeometry, snowMaterial );
  this.add(particles);

  this.snowGeometry = snowGeometry;
  this.snowTime = 0;
  this.snoise = new ImprovedNoise();
}

Snow.prototype = Object.create( THREE.Object3D.prototype );
Snow.prototype.constructor = Snow;

Snow.prototype.animate = function() {
  //global perlin wind
  this.snowTime += 0.001;

  var snoise = this.snoise;
  var snowTime = this.snowTime;
  var snowGeometry = this.snowGeometry;

  var windStrength = snoise.noise(snowTime, 0, 0)*20;
  var windDir = (snoise.noise(snowTime + 100,0,0) + 1)/2 * Math.PI*2;

  for(let  i = 0; i < SNOW_COUNT; i++) {
    var vert = snowGeometry.vertices[i];

    //gravity
    vert.y -= 3;

    //bounds wrapping
    if (vert.y < SNOW_BOTTOM){
      vert.y = SNOW_TOP;
    }

    vert.x += Math.cos(windDir) * windStrength;
    vert.z += Math.sin(windDir) * windStrength;

    //wrap around edges
    if (vert.x > Config.FLOOR_WIDTH/2 + SNOW_EDGE)
      vert.x = -Config.FLOOR_WIDTH/2 + SNOW_EDGE;
    if (vert.x < -Config.FLOOR_WIDTH/2 + SNOW_EDGE)
      vert.x = Config.FLOOR_WIDTH/2 + SNOW_EDGE;

    if (vert.z > Config.FLOOR_DEPTH/2 + SNOW_EDGE)
      vert.z = -Config.FLOOR_DEPTH/2 + SNOW_EDGE;
    if (vert.z < -Config.FLOOR_DEPTH/2 + SNOW_EDGE)
      vert.z = Config.FLOOR_DEPTH/2 + SNOW_EDGE;

  }

  snowGeometry.verticesNeedUpdate = true;
}

Snow.prototype.shift = function(moverGroup) {
  var snowGeometry = this.snowGeometry;

  for(let i = 0 ; i < SNOW_COUNT ; i++) {
    var vert = snowGeometry.vertices[i];
    vert.z += Config.MOVE_STEP;

    if (vert.z + moverGroup.position.z > Config.FLOOR_DEPTH/2){
      vert.z-= Config.FLOOR_DEPTH;
    }
  }
  snowGeometry.verticesNeedUpdate = true;
}
