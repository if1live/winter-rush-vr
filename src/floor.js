const FLOOR_RES = 20;
const FLOOR_YPOS = -300;
const FLOOR_THICKNESS = 300;

const floorMaterial = new THREE.MeshLambertMaterial({
  color: 0xCCCCCC, //diffuse
  emissive: 0x000000,
  side: THREE.DoubleSide,
});


function makePlaneGeometry(step) {
  var floorGeometry = new THREE.PlaneGeometry(
    Config.FLOOR_WIDTH + 3200, Config.FLOOR_DEPTH,
    FLOOR_RES, FLOOR_RES
  );
  setFloorGeometryHeight(floorGeometry, step);

  floorGeometry.step = step;
  return floorGeometry;
};


function setFloorGeometryHeight(geometry, step) {
  var offset = step * FLOOR_RES;

  for(let i = 0 ; i < FLOOR_RES + 1 ; i++) {
    for(let j = 0 ; j < FLOOR_RES + 1 ; j++) {
      var ipos = i + offset;
      var noiseVal = snoise.noise(
        ipos/FLOOR_RES * noiseScale,
        j/FLOOR_RES * noiseScale,
        noiseSeed
      );
      geometry.vertices[i * (FLOOR_RES + 1)+ j].z = noiseVal * FLOOR_THICKNESS;
    }
  }

  // noise로 좌표를 조정한 다음에 회전을 걸어야 의도한대로 돌아갈것이다
  var m = new THREE.Matrix4();
  m.makeRotationX(Math.PI / 2);
  geometry.applyMatrix(m);

  geometry.verticesNeedUpdate = true;
}


function Floor() {
  THREE.Object3D.call(this);
  this.type = 'Floor';

  var step = 0;
  var subGeometries = [
    makePlaneGeometry(step),
    makePlaneGeometry(step+1),
    makePlaneGeometry(step+2),
  ];
  var geometry = new THREE.Geometry();
  var mesh = new THREE.Mesh(geometry, floorMaterial);
  this.add(mesh);

  this.step = function() {
    return step;
  }

  this.nextStep = function() {
    step += 1;

    subGeometries[0].dispose();

    subGeometries[0] = subGeometries[1];
    subGeometries[1] = subGeometries[2];
    subGeometries[2] = makePlaneGeometry(step + 2);

    function mergeSubGeometry(geometry, subGeometries) {
      // clear previous geometry
      geometry.vertices.length = 0;
      geometry.faces.length = 0;
      geometry.faceVertexUvs[0].length = 0;

      var m = new THREE.Matrix4();

      m.makeTranslation(0, 0, Config.FLOOR_DEPTH * 1);
      geometry.merge(subGeometries[0], m);

      m.makeTranslation(0, 0, Config.FLOOR_DEPTH * 0);
      geometry.merge(subGeometries[1], m);

      m.makeTranslation(0, 0, Config.FLOOR_DEPTH * -1);
      geometry.merge(subGeometries[2], m);

      return geometry;
    }

    var geometry = new THREE.Geometry();
    mergeSubGeometry(geometry, subGeometries);
    geometry.verticesNeedUpdate = true;
    mesh.geometry.dispose();
    mesh.geometry = geometry;
  };

  this.nextStep();
  this.position.y = FLOOR_YPOS;
}

Floor.prototype = Object.create( THREE.Object3D.prototype );
Floor.prototype.constructor = Floor;
