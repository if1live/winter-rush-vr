'use strict';

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
  skyMesh.scale.x = skyMesh.scale.y = 1.5;
  skyMesh.position.z = -360;
  skyMesh.position.y = 150;

  this.add(skyMesh);
}

Sky.prototype = Object.create( THREE.Object3D.prototype );
Sky.prototype.constructor = Sky;

Sky.prototype.animate = function(game) {
  var speed = game.speed();
  var opac = (speed - 0.5) *2;
  skyMaterial.opacity = opac;
}
