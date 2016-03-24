'use strict';

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
//const TREE_COLORS = [0xff0000, 0x00ff00, 0x0000ff];
const trunkColor = new THREE.Color(0x330000);

function makeTree(scale, treeType) {
  const treeColor = new THREE.Color(TREE_COLORS[treeType % TREE_COLORS.length]);
  var geom = makeScaledTreeGeometry(treeColor, trunkColor, scale);
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
      var x = Config.FLOOR_WIDTH / 2 + 30;
      options.push({ position: new THREE.Vector3(+x, 0, z), scale: scale });
      options.push({ position: new THREE.Vector3(-x, 0, z), scale: scale });
    }
  }
  var trees = makeTreeGroupMesh(options);
  return trees;
}

function makeTreeGeometry(treeColor, trunkColor) {
  const trunkHeight = 20;
  const treeHeight = 120;

  const trunkGeom = new THREE.CylinderGeometry(5, 5, trunkHeight, 8, 1, false);
  const treeGeom = new THREE.CylinderGeometry(0, 25, treeHeight, 8, 1, false);
  fillGeometryVertexColors(treeGeom, treeColor);
  fillGeometryVertexColors(trunkGeom, trunkColor);

  var trunkMat = new THREE.Matrix4();
  trunkMat.makeTranslation(0, -70, 0);
  treeGeom.merge(trunkGeom, trunkMat);

  var m = new THREE.Matrix4();
  var centerY = (trunkHeight + treeHeight/2);
  m.makeTranslation(0, centerY, 0);

  treeGeom.applyMatrix(m);
  return treeGeom;
}

function makeScaledTreeGeometry(treeColor, trunkColor, scale) {
  const geometry = makeTreeGeometry(treeColor, trunkColor);

  var m2 = new THREE.Matrix4();
  m2.makeScale(scale, scale, scale);

  var m3 = new THREE.Matrix4();
  var offset = FLOOR_YPOS;
  m3.makeTranslation(0, offset / scale, 0);

  var m = new THREE.Matrix4();
  m = m.multiplyMatrices(m2, m3);

  geometry.applyMatrix(m);
  return geometry;
}

const basicTreeGeometries = _.map(TREE_COLORS, function(c) {
  const treeColor = new THREE.Color(c);
  return makeTreeGeometry(treeColor, trunkColor);
});

function makeTreeGroupGeometry(geometry, options) {
  // new Geometry의 호출을 통제하려고 geometry를 밖에서 받음
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

    var geom = makeScaledTreeGeometry(treeColor, trunkColor, s);

    var m1 = new THREE.Matrix4();
    m1.makeTranslation(p.x, p.y, p.z);

    var m2 = new THREE.Matrix4();
    m2.makeRotationY(rotY);

    var m = new THREE.Matrix4();
    m.multiplyMatrices(m1, m2);
    geometry.merge(geom, m);
  }
}

function makeTreeGroupMesh(options) {
  var geometry = new THREE.Geometry();
  makeTreeGroupGeometry(geometry, options);
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

const TREE_COUNT = 6;
//const TREE_COUNT = 1;

function TreeBatch() {
  var self = this;
  THREE.Object3D.call(this);
  this.type = 'TreeBatch';

  this.trees = [];
  _.each([-1, 0, 1], function(step, idx) {
    for(let i = 0 ; i < TREE_COUNT ; i++) {
      var matId = i % TREE_COLORS.length;
      //var matId = idx % TREE_COLORS.length;
      var tree = makeTree(1, matId);
      tree.step = step;
      tree.groupId = (step + 3) % 3;
      self.trees.push(tree);
    }
  });

  var geometry = new THREE.Geometry();
  _.each(this.trees, function(tree) {
    geometry.merge(tree.geometry.clone());
  });
  this.mesh = new THREE.Mesh(geometry, treeMaterial);

  this.step(0);

  this.add(this.mesh);
}

TreeBatch.prototype = Object.create( THREE.Object3D.prototype );
TreeBatch.prototype.constructor = TreeBatch;

TreeBatch.prototype.resetTree = function(tree, step, rng) {
  tree.collided = false;
  tree.visible = true;
  tree.step = step;

  const zOffset = -step * Config.FLOOR_DEPTH;

  var posi = rng();
  var posj = rng();
  tree.position.x = posj * Config.FLOOR_WIDTH - Config.FLOOR_WIDTH/2;
  tree.position.z = (-(posi * Config.FLOOR_DEPTH) + Config.FLOOR_DEPTH/2) + zOffset;

  var scaleMin = 0.8;
  var scaleMax = 1.3;

  var scale = rng() * (scaleMax - scaleMin) + scaleMin;
  tree.scale.set(scale, scale, scale);
}

TreeBatch.prototype.updateMesh = function(step) {
  var geometry = this.mesh.geometry;

  var rootVerticesIdx = 0;
  _.each(this.trees, function(tree) {
    let treeGeometry = tree.geometry;
    let p = tree.position;
    let s = tree.scale;

    for(let j = 0 ; j < treeGeometry.vertices.length ; j++) {
      let vertIdx = rootVerticesIdx + j;
      if(tree.visible) {
        geometry.vertices[vertIdx].x = treeGeometry.vertices[j].x * s.x + p.x;
        geometry.vertices[vertIdx].y = treeGeometry.vertices[j].y * s.y + p.y;
        geometry.vertices[vertIdx].z = treeGeometry.vertices[j].z * s.z + p.z;
      } else {
        geometry.vertices[vertIdx].x = 0;
        geometry.vertices[vertIdx].y = 0;
        geometry.vertices[vertIdx].z = 0;
      }
    }
    rootVerticesIdx += treeGeometry.vertices.length;
  });

  geometry.computeBoundingSphere();
  geometry.verticesNeedUpdate = true;
}

TreeBatch.prototype.lowestStep = function() {
  return _.minBy(this.trees, function(t) { return t.step; }).step;
}
TreeBatch.prototype.highestStep = function() {
  return _.maxBy(this.trees, function(t) { return t.step; }).step;
}

TreeBatch.prototype.step = function(step) {
  var prev = this.lowestStep() + 1;
  //console.log(`tree group next step : ${prev} -> ${step}`);

  var steps = [
    { next: step-1, rng: new Math.seedrandom(step-1), },
    { next: step, rng: new Math.seedrandom(step), },
    { next: step+1, rng: new Math.seedrandom(step+1), },
  ];

  for(let i = 0 ; i < this.trees.length ; i++) {
    let found = false;
    for(let j = 0 ; j < steps.length ; j++) {
      if(found) { break; }
      if(this.trees[i].groupId === (steps[j].next + 3) % 3) {
        this.resetTree(this.trees[i], steps[j].next, steps[j].rng);
        found = true;
      }
    }
  }

  this.updateMesh(step);
}
