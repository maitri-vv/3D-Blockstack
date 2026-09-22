
// ============================================================
// YouTube Playables
// ============================================================

let playablesReady = false;
let playablesPaused = false;
let playablesAudioEnabled = true;
let playablesSaveLoaded = false;
let bestScore = 0;

let camera;
let scene;
let renderer;
let world;
let lastTime = 0;
let particleData = null;

function notifyPlayablesReady() {
  if (
    typeof ytgame === "undefined" ||
    !ytgame.game
  ) {
    playablesReady = true;
    playablesSaveLoaded = true;
    return;
  }

  requestAnimationFrame(() => {
    if (
      typeof ytgame !== "undefined" &&
      ytgame.game
    ) {
      ytgame.game.firstFrameReady();

      if (
        playablesSaveLoaded &&
        !playablesReady
      ) {
        playablesReady = true;
        ytgame.game.gameReady();
      }
    }
  });
}

async function loadPlayablesSave() {
  if (
    typeof ytgame === "undefined" ||
    !ytgame.game
  ) {
    playablesSaveLoaded = true;
    return;
  }

  try {
    const data = await ytgame.game.loadData();

    if (data) {
      const parsed =
        typeof data === "string"
          ? JSON.parse(data)
          : data;

      if (
        parsed &&
        Number.isFinite(parsed.bestScore) &&
        parsed.bestScore >= 0
      ) {
        bestScore =
          Math.floor(parsed.bestScore);
      }
    }
  } catch (error) {
    console.warn(
      "Playables save load failed:",
      error
    );
  } finally {
    playablesSaveLoaded = true;

    if (
      !playablesReady &&
      typeof ytgame !== "undefined" &&
      ytgame.game
    ) {
      playablesReady = true;
      ytgame.game.gameReady();
    }
  }
}

async function savePlayablesSave() {
  if (
    typeof ytgame === "undefined" ||
    !ytgame.game ||
    !playablesSaveLoaded
  ) {
    return;
  }

  const saveData = JSON.stringify({
    version: 1,
    bestScore: Math.max(
      0,
      Math.floor(bestScore)
    )
  });

  try {
    await ytgame.game.saveData(
      saveData
    );
  } catch (error) {
    console.warn(
      "Playables save failed:",
      error
    );
  }
}

async function sendPlayablesScore(score) {
  if (
    typeof ytgame === "undefined" ||
    !ytgame.engagement ||
    !Number.isFinite(score) ||
    score < 0
  ) {
    return;
  }

  try {
    await ytgame.engagement.sendScore({
      value: Math.floor(score)
    });
  } catch (error) {
    console.warn(
      "Playables score send failed:",
      error
    );
  }
}

function setupPlayablesAudio() {
  if (
    typeof ytgame === "undefined" ||
    !ytgame.system
  ) {
    return;
  }

  playablesAudioEnabled =
    ytgame.system.isAudioEnabled();

  ytgame.system.onAudioEnabledChange(
    (isAudioEnabled) => {
      playablesAudioEnabled =
        isAudioEnabled;
    }
  );
}

function setupPlayablesPauseResume() {
  if (
    typeof ytgame === "undefined" ||
    !ytgame.system
  ) {
    return;
  }

  ytgame.system.onPause(() => {
    playablesPaused = true;

    // Stop the entire Three.js animation loop.
    if (renderer) {
      renderer.setAnimationLoop(null);
    }

    // Reset timing so elapsed pause time
    // is never applied after resume.
    lastTime = 0;

    // Persist the latest score.
    savePlayablesSave();
  });

  ytgame.system.onResume(() => {
    playablesPaused = false;

    // Reset timing before restarting.
    lastTime = 0;

    // Restart the single game loop.
    if (renderer) {
      renderer.setAnimationLoop(
        animation
      );
    }
  });
}


// ============================================================
// Game state
// ============================================================

let stack;
let overhangs;

const boxHeight = 1;
const originalBoxSize = 3;

let autopilot;
let gameEnded;
let robotPrecision;


// ============================================================
// DOM
// ============================================================

const scoreElement =
  document.getElementById("score");

const instructionsElement =
  document.getElementById("instructions");

const resultsElement =
  document.getElementById("results");

const closeResultsBtn =
  document.getElementById(
    "close-results"
  );

const finalScoreDisplay =
  document.getElementById(
    "final-score-display"
  );

const endHighScore =
  document.getElementById(
    "end-high-score"
  );


// ============================================================
// Initialization
// ============================================================

window.focus();

if (closeResultsBtn) {
  closeResultsBtn.addEventListener(
    "click",
    startGame
  );
}

init();


// ============================================================
// Game initialization
// ============================================================

function setRobotPrecision() {
  robotPrecision =
    Math.random() * 1 - 0.5;
}

function init() {
  autopilot = true;
  gameEnded = false;
  lastTime = 0;

  stack = [];
  overhangs = [];

  setRobotPrecision();


  // ----------------------------------------------------------
  // CannonJS
  // ----------------------------------------------------------

  world = new CANNON.World();

  world.gravity.set(
    0,
    -10,
    0
  );

  world.broadphase =
    new CANNON.NaiveBroadphase();

  world.solver.iterations = 40;


  // ----------------------------------------------------------
  // ThreeJS camera
  // ----------------------------------------------------------

  const viewportWidth = Math.max(1, window.innerWidth);
const viewportHeight = Math.max(1, window.innerHeight);
const aspect = viewportWidth / viewportHeight;

const height = 10;             // fixed vertical game framing
const width = height * aspect; // adapts for portrait / landscape

camera = new THREE.OrthographicCamera(
  width / -2,
  width / 2,
  height / 2,
  height / -2,
  0,
  100
);

  camera.position.set(
    3,
    3,
    3
  );

  camera.lookAt(
    0,
    0,
    0
  );


  // ----------------------------------------------------------
  // Scene
  // ----------------------------------------------------------

  scene =
    new THREE.Scene();


  // ----------------------------------------------------------
  // Gradient background
  // ----------------------------------------------------------

  function createGradientBackground() {
    const canvas =
      document.createElement(
        "canvas"
      );

    const ctx =
      canvas.getContext("2d");

    canvas.width = 512;
    canvas.height = 512;

    const gradient =
      ctx.createLinearGradient(
        0,
        0,
        0,
        canvas.height
      );

    gradient.addColorStop(
      0,
      "#ff9f43"
    );

    gradient.addColorStop(
      0.5,
      "#feca57"
    );

    gradient.addColorStop(
      1,
      "#f8e9a1"
    );

    ctx.fillStyle =
      gradient;

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new THREE.CanvasTexture(
      canvas
    );
  }

  scene.background =
    createGradientBackground();


  // ----------------------------------------------------------
  // Initial stack
  // ----------------------------------------------------------

  addLayer(
    0,
    0,
    originalBoxSize,
    originalBoxSize
  );

  addLayer(
    -10,
    0,
    originalBoxSize,
    originalBoxSize,
    "x"
  );


  // ----------------------------------------------------------
  // Lights
  // ----------------------------------------------------------

  const ambientLight =
    new THREE.AmbientLight(
      0xffffff,
      0.6
    );

  scene.add(
    ambientLight
  );

  const dirLight =
    new THREE.DirectionalLight(
      0xffffff,
      0.6
    );

  dirLight.position.set(
    10,
    20,
    0
  );

  scene.add(
    dirLight
  );


  // ----------------------------------------------------------
  // Renderer
  // ----------------------------------------------------------

  renderer =
    new THREE.WebGLRenderer({
      antialias: true
    });

renderer.domElement.id = "game-canvas";

  renderer.setSize(
  Math.max(1, window.innerWidth),
  Math.max(1, window.innerHeight)
);

  document.body.appendChild(
    renderer.domElement
  );
  renderer.setClearColor(0xff9f43, 1);
renderer.domElement.style.position = "absolute";
renderer.domElement.style.inset = "0";
renderer.domElement.style.zIndex = "1";
renderer.domElement.style.display = "block";


  // ----------------------------------------------------------
  // Particles
  // ----------------------------------------------------------

  createParticleBackground(
    scene
  );

  particleData =
    createParticles();


  // ----------------------------------------------------------
  // Camera
  // ----------------------------------------------------------

  camera.position.z = 3;


  // ----------------------------------------------------------
  // Playables
  // ----------------------------------------------------------

  setupPlayablesPauseResume();

  setupPlayablesAudio();

  loadPlayablesSave();

  notifyPlayablesReady();


  // ----------------------------------------------------------
  // Start ONE animation loop only.
  // ----------------------------------------------------------

  renderer.setAnimationLoop(
    animation
  );
}


// ============================================================
// Background particles
// ============================================================

function createParticleBackground(
  scene
) {
  const particleCount = 500;

  const particlesGeometry =
    new THREE.BufferGeometry();

  const positions =
    new Float32Array(
      particleCount * 3
    );

  for (
    let i = 0;
    i < particleCount;
    i++
  ) {
    positions[i * 3] =
      (Math.random() - 0.5) * 10;

    positions[i * 3 + 1] =
      (Math.random() - 0.5) * 10;

    positions[i * 3 + 2] =
      (Math.random() - 0.5) * 10;
  }

  particlesGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
      positions,
      3
    )
  );

  const particlesMaterial =
    new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
      opacity: 0.5,
      depthWrite: false
    });

  const particleSystem =
    new THREE.Points(
      particlesGeometry,
      particlesMaterial
    );

  particleSystem.renderOrder =
    -1;

  scene.add(
    particleSystem
  );

  return particleSystem;
}


// ============================================================
// Ring effect
// ============================================================

function createRingEffect(
  x,
  y,
  z
) {
  const ringGeometry =
    new THREE.RingGeometry(
      0.8,
      1.5,
      32
    );

  const ringMaterial =
    new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });

  const ringMesh =
    new THREE.Mesh(
      ringGeometry,
      ringMaterial
    );

  ringMesh.position.set(
    x,
    y + 0.1,
    z
  );

  ringMesh.rotation.x =
    -Math.PI / 2;

  scene.add(
    ringMesh
  );

  new TWEEN.Tween(
    ringMesh.scale
  )
    .to(
      {
        x: 2,
        y: 2
      },
      800
    )
    .easing(
      TWEEN.Easing.Quadratic.Out
    )
    .start();

  new TWEEN.Tween(
    ringMaterial
  )
    .to(
      {
        opacity: 0
      },
      800
    )
    .easing(
      TWEEN.Easing.Quadratic.Out
    )
    .onComplete(() => {
      scene.remove(
        ringMesh
      );
    })
    .start();
}


// ============================================================
// Start / restart game
// ============================================================

function startGame() {
  if (playablesPaused) {
    return;
  }

  autopilot = false;
  gameEnded = false;
  lastTime = 0;

  stack = [];
  overhangs = [];

  if (instructionsElement) {
    instructionsElement.style.display =
      "none";
  }

  if (resultsElement) {
    resultsElement.style.display =
      "none";
  }

  if (scoreElement) {
    scoreElement.innerText = "0";
  }

  if (world) {
    while (
      world.bodies.length > 0
    ) {
      world.remove(
        world.bodies[0]
      );
    }
  }

  if (scene) {
    while (
      scene.children.find(
        (child) =>
          child.type === "Mesh"
      )
    ) {
      const mesh =
        scene.children.find(
          (child) =>
            child.type === "Mesh"
        );

      scene.remove(mesh);
    }

    addLayer(
      0,
      0,
      originalBoxSize,
      originalBoxSize
    );

    addLayer(
      -10,
      0,
      originalBoxSize,
      originalBoxSize,
      "x"
    );
  }

  if (camera) {
    camera.position.set(
      4,
      4,
      4
    );

    camera.lookAt(
      0,
      0,
      0
    );
  }
}


// ============================================================
// Add layer
// ============================================================

function addLayer(
  x,
  z,
  width,
  depth,
  direction
) {
  const y =
    boxHeight *
    stack.length;

  const layer =
    generateBox(
      x,
      y,
      z,
      width,
      depth,
      false
    );

  layer.direction =
    direction;

  stack.push(
    layer
  );

  createRingEffect(
    x,
    y,
    z
  );
}


// ============================================================
// Decorative particles
// ============================================================

function createParticles() {
  const particleCount = 200;

  const particleGeometry =
    new THREE.BufferGeometry();

  const positions =
    new Float32Array(
      particleCount * 3
    );

  for (
    let i = 0;
    i <
    particleCount * 3;
    i += 3
  ) {
    positions[i] =
      (Math.random() - 0.5) *
      50;

    positions[i + 1] =
      Math.random() * 30;

    positions[i + 2] =
      (Math.random() - 0.5) *
      50;
  }

  particleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
      positions,
      3
    )
  );

  const particleMaterial =
    new THREE.PointsMaterial({
      color: 0xffd700,
      size: 0.5,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });

  const particles =
    new THREE.Points(
      particleGeometry,
      particleMaterial
    );

  scene.add(
    particles
  );

  return {
    particles,
    particleGeometry
  };
}

function animateParticles(
  particleData
) {
  if (!particleData) {
    return;
  }

  const positions =
    particleData
      .particleGeometry
      .attributes
      .position
      .array;

  for (
    let i = 1;
    i < positions.length;
    i += 3
  ) {
    positions[i] +=
      Math.sin(
        Date.now() * 0.001 + i
      ) * 0.02;
  }

  particleData
    .particleGeometry
    .attributes
    .position
    .needsUpdate = true;
}


// ============================================================
// Generate box
// ============================================================

function generateBox(
  x,
  y,
  z,
  width,
  depth,
  falls
) {
  // ThreeJS
  const geometry =
    new THREE.BoxGeometry(
      width,
      boxHeight,
      depth
    );

  const color =
    new THREE.Color(
      `hsl(${
        30 +
        stack.length * 4
      }, 100%, 50%)`
    );

  const material =
    new THREE.MeshLambertMaterial({
      color
    });

  const mesh =
    new THREE.Mesh(
      geometry,
      material
    );

  mesh.position.set(
    x,
    y,
    z
  );

  scene.add(
    mesh
  );


  // CannonJS
  const shape =
    new CANNON.Box(
      new CANNON.Vec3(
        width / 2,
        boxHeight / 2,
        depth / 2
      )
    );

  let mass =
    falls ? 5 : 0;

  mass *=
    width /
    originalBoxSize;

  mass *=
    depth /
    originalBoxSize;

  const body =
    new CANNON.Body({
      mass,
      shape
    });

  body.position.set(
    x,
    y,
    z
  );

  world.addBody(
    body
  );

  return {
    threejs: mesh,
    cannonjs: body,
    width,
    depth
  };
}


// ============================================================
// Cut block
// ============================================================

function cutBox(
  topLayer,
  overlap,
  size,
  delta
) {
  const direction =
    topLayer.direction;

  const newWidth =
    direction === "x"
      ? overlap
      : topLayer.width;

  const newDepth =
    direction === "z"
      ? overlap
      : topLayer.depth;

  topLayer.width =
    newWidth;

  topLayer.depth =
    newDepth;

  topLayer.threejs
    .scale[direction] =
    overlap / size;

  topLayer.threejs
    .position[direction] -=
    delta / 2;

  topLayer.cannonjs
    .position[direction] -=
    delta / 2;

  const shape =
    new CANNON.Box(
      new CANNON.Vec3(
        newWidth / 2,
        boxHeight / 2,
        newDepth / 2
      )
    );

  topLayer.cannonjs.shapes =
    [];

  topLayer.cannonjs.addShape(
    shape
  );
}


// ============================================================
// Input
// ============================================================

window.addEventListener("pointerdown", eventHandler);

window.addEventListener(
  "keydown",
  function (event) {
    if (playablesPaused) {
      return;
    }

    const activeElement =
      document.activeElement;

    const isInputFocused =
      activeElement &&
      (
        activeElement.tagName ===
          "INPUT" ||
        activeElement.tagName ===
          "TEXTAREA"
      );

    if (event.key === " ") {
      if (!isInputFocused) {
        event.preventDefault();
        eventHandler();
      }

      return;
    }

    if (
      event.key === "R" ||
      event.key === "r"
    ) {
      if (!isInputFocused) {
        event.preventDefault();
        startGame();
      }
    }
  }
);

function eventHandler(event) {
  if (
    event?.target?.closest(
      "#theme-controls, #results, button, input"
    )
  ) {
    return;
  }

  if (playablesPaused) return;

  if (autopilot) {
    startGame();
  } else {
    splitBlockAndAddNextOneIfOverlaps();
  }
}


// ============================================================
// Block placement
// ============================================================

function splitBlockAndAddNextOneIfOverlaps() {
  if (
    gameEnded ||
    playablesPaused
  ) {
    return;
  }

  const topLayer =
    stack[
      stack.length - 1
    ];

  const previousLayer =
    stack[
      stack.length - 2
    ];

  const direction =
    topLayer.direction;

  const size =
    direction === "x"
      ? topLayer.width
      : topLayer.depth;

  const delta =
    topLayer.threejs
      .position[direction] -
    previousLayer.threejs
      .position[direction];

  const overhangSize =
    Math.abs(delta);

  const overlap =
    size -
    overhangSize;

  if (overlap > 0) {
    cutBox(
      topLayer,
      overlap,
      size,
      delta
    );

    const overhangShift =
      (
        overlap / 2 +
        overhangSize / 2
      ) *
      Math.sign(delta);

    const overhangX =
      direction === "x"
        ? topLayer.threejs
            .position.x +
          overhangShift
        : topLayer.threejs
            .position.x;

    const overhangZ =
      direction === "z"
        ? topLayer.threejs
            .position.z +
          overhangShift
        : topLayer.threejs
            .position.z;

    const overhangWidth =
      direction === "x"
        ? overhangSize
        : topLayer.width;

    const overhangDepth =
      direction === "z"
        ? overhangSize
        : topLayer.depth;

    addOverhang(
      overhangX,
      overhangZ,
      overhangWidth,
      overhangDepth
    );


    // Next layer
    const nextX =
      direction === "x"
        ? topLayer.threejs
            .position.x
        : -10;

    const nextZ =
      direction === "z"
        ? topLayer.threejs
            .position.z
        : -10;

    const newWidth =
      topLayer.width;

    const newDepth =
      topLayer.depth;

    const nextDirection =
      direction === "x"
        ? "z"
        : "x";

    if (scoreElement) {
      scoreElement.innerText =
        `${stack.length - 1} ◆`;
    }

    addLayer(
      nextX,
      nextZ,
      newWidth,
      newDepth,
      nextDirection
    );
  } else {
    missedTheSpot();
  }
}


// ============================================================
// Falling overhang
// ============================================================

function addOverhang(
  x,
  z,
  width,
  depth
) {
  const y =
    boxHeight *
    (stack.length - 1);

  const overhang =
    generateBox(
      x,
      y,
      z,
      width,
      depth,
      true
    );

  overhangs.push(
    overhang
  );
}


// ============================================================
// Game over
// ============================================================

function missedTheSpot() {
  const topLayer =
    stack[
      stack.length - 1
    ];

  addOverhang(
    topLayer.threejs
      .position.x,
    topLayer.threejs
      .position.z,
    topLayer.width,
    topLayer.depth
  );

  world.remove(
    topLayer.cannonjs
  );

  scene.remove(
    topLayer.threejs
  );

  gameEnded = true;

  if (
    resultsElement &&
    !autopilot
  ) {
    resultsElement.style.display =
      "flex";

    const finalScore =
      stack.length - 1;

    if (finalScoreDisplay) {
      finalScoreDisplay.innerText =
        finalScore;
    }

    if (
      finalScore >
      bestScore
    ) {
      bestScore =
        finalScore;

      savePlayablesSave();
    }

    if (endHighScore) {
      endHighScore.innerText =
        bestScore;
    }

    sendPlayablesScore(
      bestScore
    );
  }
}


// ============================================================
// MAIN GAME LOOP
// ============================================================
//
// IMPORTANT:
// This is now the ONLY animation loop.
//
// Playables onPause() calls:
//     renderer.setAnimationLoop(null)
//
// Playables onResume() calls:
//     renderer.setAnimationLoop(animation)
//
// Therefore the game, physics, particles,
// tweens and rendering all stop together.
// ============================================================

function animation(time) {
  if (playablesPaused) {
    lastTime = 0;
    return;
  }

  // Always update decorative animation
  // from the same Playables-controlled loop.
  TWEEN.update();

  animateParticles(
    particleData
  );

  if (!lastTime) {
    lastTime = time;

    renderer.render(
      scene,
      camera
    );

    return;
  }

  const timePassed =
    time - lastTime;

  lastTime = time;

  const speed = 0.008;

  const topLayer =
    stack[
      stack.length - 1
    ];

  const previousLayer =
    stack[
      stack.length - 2
    ];

  if (
    topLayer &&
    previousLayer
  ) {
    const boxShouldMove =
      !gameEnded &&
      (
        !autopilot ||
        (
          autopilot &&
          topLayer.threejs
            .position[
              topLayer.direction
            ] <
            previousLayer
              .threejs
              .position[
                topLayer.direction
              ] +
            robotPrecision
        )
      );

    if (boxShouldMove) {
      topLayer.threejs
        .position[
          topLayer.direction
        ] +=
        speed *
        timePassed;

      topLayer.cannonjs
        .position[
          topLayer.direction
        ] +=
        speed *
        timePassed;

      if (
        topLayer.threejs
          .position[
            topLayer.direction
          ] > 10
      ) {
        missedTheSpot();
      }
    } else {
      if (autopilot) {
        splitBlockAndAddNextOneIfOverlaps();
        setRobotPrecision();
      }
    }

    if (
      camera.position.y <
      boxHeight *
        (stack.length - 2) +
        4
    ) {
      camera.position.y +=
        speed *
        timePassed;
    }

    updatePhysics(
      timePassed
    );
  }

  renderer.render(
    scene,
    camera
  );
}


// ============================================================
// Physics
// ============================================================

function updatePhysics(
  timePassed
) {
  world.step(
    timePassed / 1000
  );

  overhangs.forEach(
    (element) => {
      element.threejs.position.copy(
        element.cannonjs.position
      );

      element.threejs.quaternion.copy(
        element.cannonjs.quaternion
      );
    }
  );
}


// ============================================================
// Resize
// ============================================================

// ============================================================
// YouTube Playables Responsive Resize
// ============================================================

function resizeGame() {
  if (!camera || !renderer) return;

  const viewportWidth = Math.max(1, window.innerWidth);
  const viewportHeight = Math.max(1, window.innerHeight);
  const aspect = viewportWidth / viewportHeight;

  const height = 10;
  const width = height * aspect;

  camera.left = -width / 2;
  camera.right = width / 2;
  camera.top = height / 2;
  camera.bottom = -height / 2;
  camera.updateProjectionMatrix();

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, 2)
  );
  renderer.setSize(viewportWidth, viewportHeight, false);
  renderer.render(scene, camera);
}
window.addEventListener("resize", resizeGame);
window.addEventListener("orientationchange", resizeGame);

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", resizeGame);
}