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
      options.push({ position: [+x, 0, z], scale: scale });
      options.push({ position: [-x, 0, z], scale: scale });
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

function makeTreeGroupMesh(options) {
  var geometry = new THREE.Geometry();

  const trunkColor = new THREE.Color(0x330000);

  for(let i = 0 ; i < options.length ; i++) {
    const opt = options[i];
    const type = opt.type || 0;
    const s = opt.scale || 1;
    const p = opt.position || [0, 0, 0];

    const treeColor = new THREE.Color(TREE_COLORS[type % TREE_COLORS.length]);

    var geom = makeTreeGeometry(treeColor, trunkColor, s);
    var m = new THREE.Matrix4();
    m.makeTranslation(p[0], p[1], p[2]);
    geometry.merge(geom, m);
  }

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
