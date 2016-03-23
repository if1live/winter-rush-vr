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

const treeMaterial = new THREE.MeshLambertMaterial({
  color: 0xffffff,
  vertexColors: THREE.VertexColors,
});

const TREE_COLORS = [0x466310, 0x355B4B, 0x449469];

function makeTree(scale, treeType) {
  const treeColor = new THREE.Color(TREE_COLORS[treeType % TREE_COLORS.length]);
  const trunkColor = new THREE.Color(0x330000);

  var geom = makeTreeGeometry(treeColor, trunkColor, scale);
  var tree = new THREE.Mesh(geom, treeMaterial);

  return tree;
}

function makeEdgeTreeMesh(segments) {
  const EDGE_TREE_COUNT = 12;
  let options = [];
  for(let j = 0 ; j < segments.length ; j++) {
    let segment = segments[j];
    let zOffset = segment * Config.FLOOR_DEPTH;
    for(let i = 0 ; i < EDGE_TREE_COUNT ; i++) {
      const scale = 1.3;
      var z = Config.FLOOR_DEPTH * i/EDGE_TREE_COUNT - Config.FLOOR_DEPTH/2 + zOffset;
      var x = Config.FLOOR_WIDTH / 2 + 300;
      options.push({ position: new THREE.Vector3(+x, 0, z), scale: scale });
      options.push({ position: new THREE.Vector3(-x, 0, z), scale: scale });
    }
  }
  var trees = makeTreeGroupMesh(options);
  return trees;
}

function makeTreeGeometry(treeColor, trunkColor, scale) {
  const trunkHeight = 200;
  const treeHeight = 1200;

  const trunkGeom = new THREE.CylinderGeometry(50, 50, trunkHeight, 8, 1, false);
  const treeGeom = new THREE.CylinderGeometry(0, 250, treeHeight, 8, 1, false);
  fillGeometryVertexColors(treeGeom, treeColor);
  fillGeometryVertexColors(trunkGeom, trunkColor);

  var trunkMat = new THREE.Matrix4();
  trunkMat.makeTranslation(0, -700, 0);
  treeGeom.merge(trunkGeom, trunkMat);

  var m1 = new THREE.Matrix4();
  var centerY = (trunkHeight + treeHeight/2);
  m1.makeTranslation(0, centerY * scale, 0);

  var m2 = new THREE.Matrix4();
  m2.makeScale(scale, scale, scale);

  var m3 = new THREE.Matrix4();
  var offset = FLOOR_YPOS;
  m3.makeTranslation(0, offset / scale, 0);

  var m = new THREE.Matrix4();
  m.identity();
  m.multiply(m1);
  m.multiply(m2);
  m.multiply(m3);

  treeGeom.applyMatrix(m);
  return treeGeom;
}

function makeTreeGroupGeometry(options) {
  var geometry = new THREE.Geometry();
  const trunkColor = new THREE.Color(0x330000);
  for(let i = 0 ; i < options.length ; i++) {
    const opt = options[i];
    const type = opt.type || 0;
    const s = opt.scale || 1;
    const p = opt.position || new THREE.Vector3(0, 0, 0);
    const rotY = opt.rotationY || 0;

    if(opt.visible === false) {
      continue;
    }

    const treeColor = new THREE.Color(TREE_COLORS[type % TREE_COLORS.length]);

    var geom = makeTreeGeometry(treeColor, trunkColor, s);

    var m1 = new THREE.Matrix4();
    m1.makeTranslation(p.x, p.y, p.z);

    var m2 = new THREE.Matrix4();
    m2.makeRotationY(rotY);

    var m = new THREE.Matrix4();
    m.multiplyMatrices(m1, m2);
    geometry.merge(geom, m);
  }
  return geometry;
}

function makeTreeGroupMesh(options) {
  var geometry = makeTreeGroupGeometry(options);
  var tree = new THREE.Mesh(geometry, treeMaterial);
  return tree;
}

function EdgeTreeGroup() {
  THREE.Object3D.call(this);
  this.type = 'EdgeTreeGroup';

  var mesh = makeEdgeTreeMesh([1, 0, -1]);
  this.add(mesh);
}

EdgeTreeGroup.prototype = Object.create( THREE.Object3D.prototype );
EdgeTreeGroup.prototype.constructor = EdgeTreeGroup;


function Tree(scale, treeType) {
  THREE.Object3D.call(this);
  this.type = 'Tree';

  var mesh = makeTree(scale, treeType);
  this.add(mesh);
}
Tree.prototype = Object.create( THREE.Object3D.prototype );
Tree.prototype.constructor = Tree;


function TreeGroup() {
  THREE.Object3D.call(this);
  this.type = 'TreeGroup';

  this.step = 0;

  this.options = [
    this.makeOptions(-1),
    this.makeOptions(0),
    this.makeOptions(1),
  ];
  var geometry = makeTreeGroupGeometry(_.flatten(this.options));
  this.mesh = new THREE.Mesh(geometry, treeMaterial);
  this.add(this.mesh);
}

TreeGroup.prototype = Object.create( THREE.Object3D.prototype );
TreeGroup.prototype.constructor = TreeGroup;

TreeGroup.prototype.nextStep = function() {
  this.step += 1;
  //console.log('tree group next step : ' + this.step);

  this.options[0] = this.options[1];
  this.options[1] = this.options[2];
  this.options[2] = this.makeOptions(this.step + 1);

  this.updateMesh();
}

TreeGroup.prototype.makeOptions = function(step) {
  const TREE_COUNT = 10;
  const zOffset = -step * Config.FLOOR_DEPTH;

  var options = [];
  for(let i = 0 ; i < TREE_COUNT ; i++) {
    var scale = ATUtil.randomRange(0.8, 1.3);
    var matId = i % TREE_COLORS.length;

    var posi = Math.random();
    var posj = Math.random();
    var position = new THREE.Vector3(
      posj * Config.FLOOR_WIDTH - Config.FLOOR_WIDTH/2,
      0,
      (-(posi * Config.FLOOR_DEPTH) + Config.FLOOR_DEPTH/2) + zOffset
    );

    options.push({
      position: position,
      scale: scale,
      type: matId,
      visible: true,
      collided: false,
      rotationY: Math.random()*Math.PI*2,
    });
  }
  return options;
}

TreeGroup.prototype.updateMesh = function() {
  var geometry = makeTreeGroupGeometry(_.flatten(this.options));
  this.mesh.geometry.dispose();
  this.mesh.geometry = geometry;
}

TreeGroup.prototype.allOptions = function() {
  var options = _.flatten(this.options);
  return options;
}
