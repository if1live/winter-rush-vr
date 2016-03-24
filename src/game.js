'use strict';

function getTimestamp() {
  var d = new Date();
  return (d.getTime() + d.getMilliseconds() / 1000.0);
}


function Game(main) {
  const ACCEL = 100;
  const MAX_SPEED_ACCEL = 7;
  const START_MAX_SPEED = 150;
  const FINAL_MAX_SPEED = 500;
  const SIDE_ACCEL = 250;
  const MAX_SIDE_SPEED = 400;

  var scene = main.scene();
  var camera = main.camera();

  var currStep = 0;
  var moveSpeed = 0; //z distance per second
  var maxSpeed = START_MAX_SPEED; //increments over time
  var slideSpeed = 0;

  var clock;

  var turnScale = 0;
  var playing = false;
  var acceptInput = true;

  var edgeTreeGroup;
  var floor;
  var present;
  var snow, barGroup, sky;

  // 카메라 따라서 움직이는 객체
  var cameraFollowingGroup;
  var treeBatch;

  var score = 0;

  function init() {
    cameraFollowingGroup = new THREE.Object3D();
    scene.add(cameraFollowingGroup);

    // lights
    // HemisphereLight(skyColorHex, groundColorHex, intensity)
    var hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.6);
    scene.add( hemisphereLight );
    hemisphereLight.position.y = 30;

    //middle light
    var centerLight = new THREE.PointLight( 0xFFFFFF, 0.8, 450 );
    cameraFollowingGroup.add(centerLight);
    centerLight.position.z = Config.FLOOR_DEPTH/4;
    centerLight.position.y = 50;

    var frontLight = new THREE.PointLight( 0xFFFFFF, 1, 250 );
    cameraFollowingGroup.add(frontLight);
    frontLight.position.z = Config.FLOOR_DEPTH/2;

    // make floor
    floor = new Floor();
    scene.add(floor);

    // make trees
    treeBatch = new TreeBatch();
    scene.add(treeBatch);

    // add trees down the edges
    edgeTreeGroup = new EdgeTreeGroup();
    scene.add(edgeTreeGroup);

    // add floating present
    present = new Present();
    scene.add(present);

    // init snow and etc
    snow = new Snow();
    scene.add(snow);

    sky = new Sky();
    cameraFollowingGroup.add(sky);

    barGroup = new BarGroup();
    _.each(barGroup.bars, function(bar) {
      //moverGroup.add(bar);
    });

    resetField();

    clock = new THREE.Clock();
    clock.start();
  }

  function animate() {
    var delta = clock.getDelta();
    if(playing) {
      //max speed accelerates slowly
      maxSpeed += delta * MAX_SPEED_ACCEL;
      maxSpeed = Math.min(maxSpeed,FINAL_MAX_SPEED);

      //move speed accelerates quickly after a collision
      moveSpeed += delta * ACCEL;
      moveSpeed = Math.min(moveSpeed, maxSpeed);

      //right takes precedence
      if(turnScale > 0) {
        slideSpeed = SIDE_ACCEL * turnScale;
        slideSpeed = Math.min(slideSpeed, MAX_SIDE_SPEED);

      } else if (turnScale < 0) {
        slideSpeed = SIDE_ACCEL * turnScale;
        slideSpeed = Math.max(slideSpeed, -MAX_SIDE_SPEED);

      } else {
        slideSpeed *= 0.8;
      }

      // bounce off edges of rails
      var nextx = camera.position.x + delta * slideSpeed;

      if (nextx > Config.FLOOR_WIDTH/2 || nextx < -Config.FLOOR_WIDTH/2){
        slideSpeed = 0;
        main.playCollide();
      }

      camera.position.x += delta * slideSpeed;

      //TILT
      //camera.rotation.z = -slideSpeed * 0.00038;

    } else {
      //slow down after dead
      moveSpeed *= 0.95;
    }

    present.animate();

    camera.position.z -= delta * moveSpeed;

    cameraFollowingGroup.position.z -= delta * moveSpeed;
    cameraFollowingGroup.position.x = camera.position.x;

    var step = calcStep();
    if(currStep != step) {
      //console.log(`step : ${currStep} -> ${step}`);
      currStep = step;

      edgeTreeGroup.position.z = -step * Config.FLOOR_DEPTH;

      floor.position.z = -step * Config.FLOOR_DEPTH;
      floor.step(step);

      treeBatch.step(step);

      if(step % 2 == 0) {
        present.step(step + 1);
      }
    }

    // 눈은 카메라의 위치를 계속 따라간다. 흘러가는 속도로 입체감을 조절
    snow.position.z -= delta * moveSpeed;
    snow.animate(this, delta);

    sky.animate(this);
    barGroup.animate(this);

    // SIMPLE HIT DETECT
    if(Config.hitDetect) {
      var camPos = camera.position.clone();
      camPos.z -= 20;

      let p = present.position.clone();
      let dist = p.distanceTo(camPos);
      if (dist < 20 && !present.collided){
        //GOT POINT
        score += 1;

        // visible 속성을 이용해서 숨기면 순각적으로 끊기는것처럼 보인다
        // 그래서 위치 변경으로 대응
        //present.visible = false;
        present.position.z = 10000;
        present.collided = true;

        console.log(`curr score : ${score}`);

        main.playScorePoint();
      }

      const treeHitCheckDist = 20;
      for(let i = 0 ; i < treeBatch.trees.length ; i++) {
        let tree = treeBatch.trees[i];
        let p = tree.position;

        //can only hit trees if they are in front of you
        if (p.z < camPos.z && p.z > camPos.z - treeHitCheckDist){
          let distSquare = p.distanceToSquared(camPos);
          if (distSquare < treeHitCheckDist * treeHitCheckDist && !tree.collided ) {
            tree.collided = true;
            onGameEnd();
          }
        }
      }
    }
  }

  function calcStep() {
    // 카메라 위치를 플레이어 위치로. 일단은 간단하니까
    var posZ = camera.position.z;
    var tmp = posZ + Config.FLOOR_DEPTH / 2;
    var step = Math.abs(Math.floor(tmp / Config.FLOOR_DEPTH));
    return step;
  }

  function startGame(isFirstGame) {
    acceptInput = false;
    //if first game just start run
    if(isFirstGame) {
      startRun();
      return;
    }

    //fade out
    TweenMax.fromTo(main.fxParams, 0.3, {brightness:0}, {brightness:-1});
    TweenMax.delayedCall(0.3, resetField);

    TweenMax.fromTo(main.fxParams, 0.3, {brightness:-1}, {brightness:0, delay:0.3});
    TweenMax.delayedCall(0.6, startRun);
  }

  function resetField() {
    var camPos = camera.position;

    //set tilt to 0
    slideSpeed = 0;
    camera.rotation.z = 0;

    score = 0;

    // kill trees that are too close at the start
    let changed = false;
    for(let i = 0; i < treeBatch.trees.length; i++) {
      let tree = treeBatch.trees[i];
      let p = tree.position;

      if (p.z < camPos.z && p.z > camPos.z - Config.FLOOR_DEPTH/2){
        tree.collided = true;
        tree.visible = false;
        changed = true;
      }
    }

    if(changed) {
      treeBatch.updateMesh();
    }
  }

  function startRun() {
    playing = true;
    acceptInput = true;
  }

  function onAcceptInput() {
    acceptInput = true;
  }

  function onGameEnd() {
    moveSpeed = -120;
    maxSpeed = START_MAX_SPEED;
    playing = false;
    acceptInput = false;
    // wait before re-enabling start game
    TweenMax.delayedCall(1, onAcceptInput);
    main.onGameOver();
  }

  return {
    init,
    animate,

    startGame,
    resetField,

    turnScale: function(v) {
      if(typeof(v) !== 'undefined') { turnScale = v; }
      return turnScale;
    },
    speed: function() { return moveSpeed/FINAL_MAX_SPEED; },
    absoluteSpeed: function() { return moveSpeed; },
    playing: function() { return playing; },
    acceptInput: function() { return acceptInput; },
  };
}
