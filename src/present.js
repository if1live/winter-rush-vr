const presentMaterial = new THREE.MeshPhongMaterial({
  color: 0xFF0000,
  specular: 0x00FFFF,
  emissive: 0x0000FF,
  shininess: 60,
  shading: THREE.FlatShading,
  blending: THREE.NormalBlending,
  depthTest: true,
  transparent: false,
  opacity: 1.0
});

function Present() {
  THREE.Object3D.call(this);

  var step = 1;

  this.step = function() {
    return step;
  }
  this.nextStep = function() {
    step += 1;

    var offset = -step * Config.FLOOR_DEPTH;
    this.position.x = ATUtil.randomRange(-Config.FLOOR_WIDTH/2, Config.FLOOR_WIDTH/2);
    this.position.z = ATUtil.randomRange(-Config.FLOOR_DEPTH/2, Config.FLOOR_DEPTH/2);
    this.position.z += offset;

  };

  this.position.x = ATUtil.randomRange(-Config.FLOOR_WIDTH/2, Config.FLOOR_WIDTH/2);
  this.position.z = ATUtil.randomRange(-Config.FLOOR_DEPTH/2, Config.FLOOR_DEPTH/2);

  //this.position.x = 0;
  //this.position.z = 2000;

  const presentGeom = new THREE.TetrahedronGeometry(100, 2);
  const present = new THREE.Mesh( presentGeom, presentMaterial );
  this.add( present );

  //PointLight(hex, intensity, distance)
  const presentLight = new THREE.PointLight( 0xFF00FF, 1.2, 600 );
  this.add( presentLight );

  this.collided = false;
}

Present.prototype = Object.create( THREE.Object3D.prototype );
Present.prototype.constructor = Present;

Present.prototype.animate = function(dt) {
  this.rotation.x += 0.01;
  this.rotation.y += 0.02;
};
