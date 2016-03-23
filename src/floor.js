const FLOOR_RES = 20;
const FLOOR_YPOS = -30;
const FLOOR_THICKNESS = 30;

const floorMaterial = new THREE.MeshLambertMaterial({
  color: 0xCCCCCC, //diffuse
  emissive: 0x000000,
  side: THREE.DoubleSide,
});



function makePlaneGeometry() {
  var floorGeometry = new THREE.PlaneGeometry(
    Config.FLOOR_WIDTH + 320, Config.FLOOR_DEPTH,
    FLOOR_RES, FLOOR_RES
  );
  var m = new THREE.Matrix4();
  m.makeRotationX(Math.PI / 2);
  floorGeometry.applyMatrix(m);

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
      geometry.vertices[i * (FLOOR_RES + 1)+ j].y = noiseVal * FLOOR_THICKNESS;
    }
  }

  geometry.verticesNeedUpdate = true;
}


function Floor() {
  THREE.Object3D.call(this);
  this.type = 'Floor';

  var step = -1;
  var subGeometries = [
    makePlaneGeometry(),
    makePlaneGeometry(),
    makePlaneGeometry(),
  ];
  setFloorGeometryHeight(subGeometries[0], 0);
  setFloorGeometryHeight(subGeometries[1], 1);
  setFloorGeometryHeight(subGeometries[2], 2);

  var geometry = new THREE.Geometry();
  var m = new THREE.Matrix4();
  m.makeTranslation(0, 0, Config.FLOOR_DEPTH * 1);
  geometry.merge(subGeometries[0], m);
  m.makeTranslation(0, 0, Config.FLOOR_DEPTH * 0);
  geometry.merge(subGeometries[1], m);
  m.makeTranslation(0, 0, Config.FLOOR_DEPTH * -1);
  geometry.merge(subGeometries[2], m);

  var mesh = new THREE.Mesh(geometry, floorMaterial);
  this.add(mesh);

  this.step = function() {
    return step;
  }

  this.nextStep = function() {
    step += 1;

    var tmpSubGeom = subGeometries[0];
    setFloorGeometryHeight(tmpSubGeom, step+3);
    subGeometries[0] = subGeometries[1];
    subGeometries[1] = subGeometries[2];
    subGeometries[2] = tmpSubGeom;

    var startIdx = [
      0,
      subGeometries[0].vertices.length,
      subGeometries[0].vertices.length + subGeometries[1].vertices.length,
    ];
    var offsets = [
      Config.FLOOR_DEPTH * 1,
      Config.FLOOR_DEPTH * 0,
      Config.FLOOR_DEPTH * -1,
    ];

    for(let j = 0 ; j < startIdx.length  ; j++) {
      for(let i = 0 ; i < subGeometries[j].vertices.length ; i++) {
        var base = startIdx[j];
        var src = subGeometries[j].vertices[i];

        mesh.geometry.vertices[i + base].x = src.x;
        mesh.geometry.vertices[i + base].y = src.y;
        mesh.geometry.vertices[i + base].z = src.z + offsets[j];
      }
    }

    mesh.geometry.verticesNeedUpdate = true;
  };

  this.nextStep();
  this.position.y = FLOOR_YPOS;
}

Floor.prototype = Object.create( THREE.Object3D.prototype );
Floor.prototype.constructor = Floor;
