var skyMaterial = new THREE.MeshBasicMaterial( {
  map: new THREE.TextureLoader().load( "res/img/xmas-sky.jpg" ),
  transparent:true,
  depthTest: true,
  fog:false
} );

function Sky() {
  THREE.Object3D.call(this);
  this.type = 'Sky';

  let planeGeometry = new THREE.PlaneGeometry( 800, 300,1,1 );
  let skyMesh = new THREE.Mesh( planeGeometry, skyMaterial );
  skyMesh.scale.x = skyMesh.scale.y = 15;
  //skyMesh.position.z = -3600;
  skyMesh.position.z = -10000;
  skyMesh.position.y = 1500;

  this.add(skyMesh);
}

Sky.prototype = Object.create( THREE.Object3D.prototype );
Sky.prototype.constructor = Sky;

Sky.prototype.animate = function() {
  //TODO Game.getSpeed();
  var speed = 100;
  var opac = (speed - 0.5) *2;
  skyMaterial.opacity = opac;
}
