'use strict';

const BAR_COUNT = 20;

const barMaterial = new THREE.MeshBasicMaterial({
  color: 0x0FF66FF,
  blending: THREE.AdditiveBlending,
  depthTest: false,
  transparent: true,
  opacity:.6,
  side: THREE.DoubleSide,
});

function BarGroup() {
  THREE.Object3D.call(this);
  this.type = 'BarGroup';

  const width = 4;
  const spread =  1000;

  const barGeom = new THREE.PlaneGeometry(20,500,1,1);

  const bars = [];

  for (let i = 0; i < BAR_COUNT; i++) {
    let bar = new THREE.Mesh( barGeom, barMaterial );

    bar.scale.x = ATUtil.randomRange(0.2,2);
    bar.origYScale = ATUtil.randomRange(0.2,2);
    bar.scale.z = ATUtil.randomRange(0.2,2);

    bar.rotation.x = Math.PI/2;
    bar.rotation.y = Math.PI/2;

    bar.position.x = ATUtil.randomRange(-Config.FLOOR_WIDTH/2, Config.FLOOR_WIDTH/2);
    bar.position.y = ATUtil.randomRange(-300, 600);
    bar.position.z = ATUtil.randomRange(-Config.FLOOR_DEPTH/2, Config.FLOOR_DEPTH/2);

    bars.push(bar);
  }

  this.bars = bars;
}
BarGroup.prototype = Object.create( THREE.Object3D.prototype );
BarGroup.prototype.constructor = BarGroup;


BarGroup.prototype.animate = function(game) {
  var bars = this.bars;

  var speed = game.speed();
  var opac = (speed - 0.5) *2;

  barMaterial.opacity = opac*2/3;

  for (let i = 0; i < BAR_COUNT; i++) {
    var p = bars[i].position;
    p.z +=40;

    bars[i].scale.y = bars[i].origYScale * opac;
  }
}

BarGroup.prototype.shift = function(moverGroup) {
  var bars = this.bars;

  for (let i = 0; i < BAR_COUNT; i++) {
    var p = bars[i].position;
    p.z += Config.MOVE_STEP;
    if (p.z + moverGroup.position.z > Config.FLOOR_DEPTH/2){
      p.z-= Config.FLOOR_DEPTH;
    }
  }
}
