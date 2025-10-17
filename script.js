window.focus(); // Capture keys right away (by default focus is on editor)

let camera, scene, renderer; // ThreeJS globals
let world; // CannonJs world
let lastTime; // Last timestamp of animation
let stack; // Parts that stay solid on top of each other
let overhangs; // Overhanging parts that fall down
const boxHeight = 1; // Height of each layer
let originalBoxSize = 3; // Original width and height of a box (made responsive)
let autopilot;
let gameEnded;
let robotPrecision; // Determines how precise the game is on autopilot

// Particle data will be initialised after scene is created
let particleData;

const scoreElement = document.getElementById("score");
const instructionsElement = document.getElementById("instructions");
const resultsElement = document.getElementById("results");
const endScoreElement = document.getElementById("end-score");
const endHighScoreElement = document.getElementById("end-high-score");
const restartTextElement = document.getElementById("restart-text");

// High score
const HIGH_SCORE_KEY = "stackerHighScore";
let highScore = 0;

// Audio
const sounds = {
  place: new Audio("sound/put.bg.mp3"),
  fail: new Audio("sound/fall.bg.mp3"),
  bgm: new Audio("sound/bg.mp3.mp3"),
};
Object.values(sounds).forEach((s) => s.load());
sounds.bgm.volume = 0.2;
sounds.bgm.loop = true;
let muted = false;

// ----- Utility Functions -----
function isTouchDevice() {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

function updateRestartMessage() {
  if (!restartTextElement) return;
  restartTextElement.innerHTML = isTouchDevice()
    ? "Tap anywhere to restart"
    : "Press <kbd>R</kbd> to restart";
}

// Load and save high score from localStorage
function loadHighScore() {
  try {
    const saved = localStorage.getItem(HIGH_SCORE_KEY);
    highScore = saved ? Math.max(0, parseInt(saved, 10) || 0) : 0;
  } catch (_) {
    highScore = 0;
  }
}

// save high score to localStorage
function saveHighScore(value) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(Math.max(0, value | 0)));
  } catch (_) {}
}

init();

// Determines how precise the game is on autopilot
function setRobotPrecision() {
  robotPrecision = Math.random() - 0.5; // range [-0.5, 0.5)
}

function init() {
  autopilot = true;
  gameEnded = false;
  lastTime = 0;
  stack = [];
  overhangs = [];
  setRobotPrecision();

  // Compute responsive box size based on viewport
  setResponsiveBoxSize();

  // Load high score on initial game setup
  loadHighScore();

  function createParticleBackground(scene) {
    const particleCount = 500;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10; // X
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10; // Y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10; // Z
    }

    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
      opacity: 0.5,
      depthWrite: false
    });

    const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
    particleSystem.renderOrder = -1; // Ensure it renders behind game objects

    scene.add(particleSystem);

    // Animation function
    function animateParticles() {
      requestAnimationFrame(animateParticles);
      particleSystem.rotation.y += 0.001;
    }
    animateParticles();
  }

  // Initialize CannonJS
  world = new CANNON.World();
  world.gravity.set(0, -10, 0); // Gravity pulls things down
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 40;

  // Initialize ThreeJs
  const aspect = window.innerWidth / window.innerHeight;
  const width = 10;
  const height = width / aspect;

  camera = new THREE.OrthographicCamera(
    width / -2, // left
    width / 2, // right
    height / 2, // top
    height / -2, // bottom
    0, // near plane
    100 // far plane
  );

  /*
  // If you want to use perspective camera instead, uncomment these lines
  camera = new THREE.PerspectiveCamera(
    45, // field of view
    aspect, // aspect ratio
    1, // near plane
    100 // far plane
  );
  */

  camera.position.set(3, 3, 3);
  camera.lookAt(0, 0, 0);

  scene = new THREE.Scene();
  // Create a canvas for the gradient texture
  function createGradientBackground() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas size
    canvas.width = 512;
    canvas.height = 512;

    // Create a gradient (from pink to light pink beige)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#ff9f43"); // Light pink
    gradient.addColorStop(0.5, "#feca57"); // Soft pink
    gradient.addColorStop(1, "#f8e9a1"); // Light beige

    // Apply gradient to canvas
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // Apply gradient background to scene
  scene.background = createGradientBackground();
  /*
  scene.background = new THREE.Color(0x87CEEB); // Sky blue
  */

  // Foundation
  addLayer(0, 0, originalBoxSize, originalBoxSize);

  // First layer
  addLayer(-10, 0, originalBoxSize, originalBoxSize, "x");

  // Set up lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
  dirLight.position.set(10, 20, 0);
  scene.add(dirLight);

  // Set up renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animation);
  document.body.appendChild(renderer.domElement);

  // particle background + particle system (floating)
  createParticleBackground(scene);
  // createParticles uses 'scene', so initialise after scene exists
  particleData = createParticles();

  camera.position.z = 3;
}

function startGame() {
  autopilot = false;
  gameEnded = false;
  lastTime = 0;
  stack = [];
  overhangs = [];

  // Recompute box size in case viewport changed before restarting
  setResponsiveBoxSize();

  if (instructionsElement) instructionsElement.style.display = "none";
  if (resultsElement) resultsElement.style.display = "none";
  if (scoreElement) scoreElement.innerText = 0;

  if (world) {
    // Remove every object from world
    while (world.bodies.length > 0) {
      world.remove(world.bodies[0]);
    }
  }

  if (scene) {
    // Remove every Mesh from the scene
    while (scene.children.find((c) => c.type == "Mesh")) {
      const mesh = scene.children.find((c) => c.type == "Mesh");
      scene.remove(mesh);
    }

    // Foundation
    addLayer(0, 0, originalBoxSize, originalBoxSize);

    // First layer
    addLayer(-10, 0, originalBoxSize, originalBoxSize, "x");
  }

  if (camera) {
    // Reset camera positions
    camera.position.set(4, 4, 4);
    camera.lookAt(0, 0, 0);
  }
}

// Compute responsive box size based on viewport dimensions
function setResponsiveBoxSize() {
  const vw = Math.max(window.innerWidth, 320);
  const vh = Math.max(window.innerHeight, 320);
  const minDim = Math.min(vw, vh);
  if (minDim < 420) originalBoxSize = 1.8;
  else if (minDim < 768) originalBoxSize = 2.6;
  else originalBoxSize = 4;
}

// Function to create a ring effect at (x, y, z)
function createRingEffect(x, y, z) {
  const ringGeometry = new THREE.RingGeometry(1.2, 1.5, 32);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd700, // Golden yellow
    transparent: true,
    opacity: 0.6,
  });

// ----- Three.js & Cannon.js Setup -----
function createGradientBackground() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#ff9f43");
  gradient.addColorStop(0.5, "#feca57");
  gradient.addColorStop(1, "#f8e9a1");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return new THREE.CanvasTexture(canvas);
}

function addLayer(x, z, width, depth, direction) {
  const y = boxHeight * stack.length; // Add the new box one layer higher
  const layer = generateBox(x, y, z, width, depth, false);
  layer.direction = direction;
  stack.push(layer);
  createRingEffect(x, y, z);
}

function createParticles() {
  const particleCount = 200;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 50;
    positions[i + 1] = Math.random() * 30;
    positions[i + 2] = (Math.random() - 0.5) * 50;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xffd700,
    size: 0.5,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });
  const particles = new THREE.Points(geometry, material);
  scene.add(particles);
  return { particles, geometry };
}

// Function to Animate Particles (Floating Effect)
function animateParticles(particleDataParam) {
  if (!particleDataParam || !particleDataParam.particleGeometry) return;
  const positions = particleDataParam.particleGeometry.attributes.position.array;

  for (let i = 1; i < positions.length; i += 3) {
    positions[i] += Math.sin(Date.now() * 0.001 + i) * 0.02;
    if (positions[i] > 100) positions[i] = -100;
    if (positions[i] < -100) positions[i] = 100;
  }

  particleDataParam.particleGeometry.attributes.position.needsUpdate = true;
}

function addOverhang(x, z, width, depth) {
  const y = boxHeight * (stack.length - 1); // Add the new box one the same layer
  const overhang = generateBox(x, y, z, width, depth, true);
  overhangs.push(overhang);
}

// Helper function to generate a box (both in ThreeJS and CannonJS)
function generateBox(x, y, z, width, depth, falls) {
  const geometry = new THREE.BoxGeometry(width, boxHeight, depth);
  const color = new THREE.Color(`hsl(${30 + stack.length * 4}, 100%, 50%)`);
  const material = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  scene.add(mesh);

  const shape = new CANNON.Box(
    new CANNON.Vec3(width / 2, boxHeight / 2, depth / 2)
  );
  let mass = falls ? 5 : 0;
  mass *= width / originalBoxSize;
  mass *= depth / originalBoxSize;
  const body = new CANNON.Body({ mass, shape });
  body.position.set(x, y, z);
  world.addBody(body);

  return { threejs: mesh, cannonjs: body, width, depth };
}

function addLayer(x, z, width, depth, direction) {
  const y = boxHeight * stack.length;
  const layer = generateBox(x, y, z, width, depth, false);
  layer.direction = direction;
  stack.push(layer);
  createRingEffect(x, y, z);
}

function addOverhang(x, z, width, depth) {
  const y = boxHeight * (stack.length - 1);
  const overhang = generateBox(x, y, z, width, depth, true);
  overhangs.push(overhang);
}

// Function to cut the top layer and return the overlap
function cutBox(topLayer, overlap, size, delta) {
  const dir = topLayer.direction;
  const newWidth = dir === "x" ? overlap : topLayer.width;
  const newDepth = dir === "z" ? overlap : topLayer.depth;

  topLayer.width = newWidth;
  topLayer.depth = newDepth;

  topLayer.threejs.scale[dir] = overlap / size;
  topLayer.threejs.position[dir] -= delta / 2;
  topLayer.cannonjs.position[dir] -= delta / 2;

  const shape = new CANNON.Box(
    new CANNON.Vec3(newWidth / 2, boxHeight / 2, newDepth / 2)
  );
  topLayer.cannonjs.shapes = [];
  topLayer.cannonjs.addShape(shape);
}

// Event listeners for mouse, touch, and keyboard



// Event listeners for mouse, touch, and keyboard
window.addEventListener("mousedown", eventHandler);

window.addEventListener("keydown", function (event) {
  if (event.key == " ") {
    event.preventDefault();
    eventHandler();
    return;
  }
  if (event.key == "R" || event.key == "r") {
    event.preventDefault();
    startGame();
    return;
  }
});


// Fixed touch handler for mobile: restart game when tapped after game over
window.addEventListener("touchstart", function (event) {
  event.preventDefault(); // Prevent double-firing and unwanted scrolling

  if (gameEnded) {
    // If game is over, restart on tap
    gameEnded = false;
    startGame();
  } else if (!autopilot) {
    // During gameplay, handle normal touch
    eventHandler();
  }
}, { passive: false });

window.addEventListener("keydown", function (event) {
  if (event.key == " ") {
    event.preventDefault();
    eventHandler();
    return;
  }
  if (event.key == "R" || event.key == "r") {
    event.preventDefault();
    startGame();
    return;
  }
});

function eventHandler() {
  if (autopilot) startGame();
  else splitBlockAndAddNextOneIfOverlaps();
}

// Function to split the block and add the next one if it overlaps
function splitBlockAndAddNextOneIfOverlaps() {
  if (gameEnded) return;
  const top = stack[stack.length - 1];
  const prev = stack[stack.length - 2];
  const dir = top.direction;
  const size = dir === "x" ? top.width : top.depth;
  const delta = top.threejs.position[dir] - prev.threejs.position[dir];
  const overhangSize = Math.abs(delta);
  const overlap = size - overhangSize;

  if (overlap > 0) {
    cutBox(top, overlap, size, delta);
    const shift = (overlap / 2 + overhangSize / 2) * Math.sign(delta);
    const ox =
      dir === "x" ? top.threejs.position.x + shift : top.threejs.position.x;
    const oz =
      dir === "z" ? top.threejs.position.z + shift : top.threejs.position.z;
    const ow = dir === "x" ? overhangSize : top.width;
    const od = dir === "z" ? overhangSize : top.depth;
    addOverhang(ox, oz, ow, od);

    const nx = dir === "x" ? top.threejs.position.x : -10;
    const nz = dir === "z" ? top.threejs.position.z : -10;
    addLayer(nx, nz, top.width, top.depth, dir === "x" ? "z" : "x");

    playPlaceSound();
    if (scoreElement) scoreElement.innerText = `${stack.length - 1} ◆`;
    addLayer(nextX, nextZ, newWidth, newDepth, nextDirection);
  } else {
    missedTheSpot();
  }
}

// Function to handle game over scenario
function missedTheSpot() {
  const top = stack[stack.length - 1];
  addOverhang(
    top.threejs.position.x,
    top.threejs.position.z,
    top.width,
    top.depth
  );
  world.remove(top.cannonjs);
  scene.remove(top.threejs);
  gameEnded = true;

  // Evaluate and update high score
  const currentScore = Math.max(0, stack.length - 2); // Exclude foundation and first moving layer

  if (currentScore > highScore) {
    highScore = currentScore;
    saveHighScore(highScore);
  }
  if (endScoreElement) endScoreElement.innerText = `${score} ◆`;
  if (endHighScoreElement) endHighScoreElement.innerText = `${highScore} ◆`;
  updateRestartMessage();
  if (resultsElement && !autopilot) resultsElement.style.display = "flex";

  playFailSound();
}

// ----- Audio Controls -----
const muteBtn = document.createElement("button");
muteBtn.id = "muteBtn";
muteBtn.textContent = "🔊";
Object.assign(muteBtn.style, {
  position: "absolute",
  top: "20px",
  left: "20px",
  background: "rgba(255,255,255,0.7)",
  border: "none",
  borderRadius: "8px",
  fontSize: "20px",
  padding: "5px 10px",
  cursor: "pointer",
  zIndex: "1000",
});
document.body.appendChild(muteBtn);
muteBtn.addEventListener("click", () => {
  muted = !muted;
  sounds.bgm.muted = muted;
  muteBtn.textContent = muted ? "🔇" : "🔊";
});

function enableBackgroundMusic() {
  sounds.bgm.play().catch(() => {});
}
["mousedown", "touchstart", "keydown"].forEach((evt) =>
  window.addEventListener(evt, enableBackgroundMusic, { once: true })
);

function playPlaceSound() {
  if (!muted) {
    const s = sounds.place.cloneNode();
    s.volume = 0.7;
    s.play().catch(() => {});
  }
}
function playFailSound() {
  if (!muted) {
    const s = sounds.fail.cloneNode();
    s.volume = 0.7;
    s.play().catch(() => {});
  }
}

// ----- Event Handlers -----
function eventHandler() {
  autopilot ? startGame() : splitBlockAndAddNextOneIfOverlaps();
}
window.addEventListener("mousedown", eventHandler);
window.addEventListener("keydown", (e) => {
  if (e.key === " ") {
    e.preventDefault();
    eventHandler();
  }
  if (e.key === "r" || e.key === "R") {
    e.preventDefault();
    startGame();
  }
});
window.addEventListener(
  "touchstart",
  (e) => {
  if (e.target.closest(".twitter-link")){
      return;
    }
    e.preventDefault();
    gameEnded ? startGame() : eventHandler();
  },
  { passive: false }
);
window.addEventListener("resize", () => {
  setResponsiveBoxSize();
  const aspect = window.innerWidth / window.innerHeight;
  const width = 10;
  const height = width / aspect;
  camera.left = -width / 2;
  camera.right = width / 2;
  camera.top = height / 2;
  camera.bottom = -height / 2;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (particleData?.geometry)
    particleData.geometry.attributes.position.needsUpdate = true;
  renderer.render(scene, camera);
});

// ----- Game Start / Restart -----
function startGame() {
  autopilot = false;
  gameEnded = false;
  lastTime = 0;
  stack = [];
  overhangs = [];
  setResponsiveBoxSize();
  if (instructionsElement) instructionsElement.style.display = "none";
  if (resultsElement) resultsElement.style.display = "none";
  if (scoreElement) scoreElement.innerText = 0;

  while (world.bodies.length > 0) world.remove(world.bodies[0]);
  while (scene.children.find((c) => c.type === "Mesh"))
    scene.remove(scene.children.find((c) => c.type === "Mesh"));

  addLayer(0, 0, originalBoxSize, originalBoxSize);
  addLayer(-10, 0, originalBoxSize, originalBoxSize, "x");
  camera.position.set(4, 4, 4);
  camera.lookAt(0, 0, 0);
}

// ----- Physics Update -----
function updatePhysics(deltaTime) {
  world.step(deltaTime / 1000);
  overhangs.forEach((e) => {
    e.threejs.position.copy(e.cannonjs.position);
    e.threejs.quaternion.copy(e.cannonjs.quaternion);
  });
}

// ----- Animation Loop -----
function animation(time) {
  if (lastTime) {
    const deltaTime = time - lastTime;
    TWEEN.update();

    const top = stack[stack.length - 1];
    const prev = stack[stack.length - 2];
    const moveBox =
      !gameEnded &&
      (!autopilot ||
        (autopilot &&
          top.threejs.position[top.direction] <
            prev.threejs.position[top.direction] + robotPrecision));

    if (moveBox) {
      top.threejs.position[top.direction] += 0.008 * deltaTime;
      top.cannonjs.position[top.direction] += 0.008 * deltaTime;
      if (top.threejs.position[top.direction] > 10) missedTheSpot();
    } else if (autopilot) {
      splitBlockAndAddNextOneIfOverlaps();
      setRobotPrecision();
    }

    if (camera.position.y < boxHeight * (stack.length - 2) + 4)
      camera.position.y += 0.008 * deltaTime;

    updatePhysics(deltaTime);
    animateParticles(particleData);
    renderer.render(scene, camera);
  }
  lastTime = time;
}

// Function to update physics world and sync with Three.js
function updatePhysics(timePassed) {
  world.step(timePassed / 1000); // Step the physics world

  world = new CANNON.World();
  world.gravity.set(0, -10, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 40;

  const aspect = window.innerWidth / window.innerHeight;
  const width = 10;
  const height = width / aspect;

  camera = new THREE.OrthographicCamera(
    -width / 2,
    width / 2,
    height / 2,
    -height / 2,
    0,
    100
  );
  camera.position.set(3, 3, 3);
  camera.lookAt(0, 0, 0);

  scene = new THREE.Scene();
  scene.background = createGradientBackground();

  addLayer(0, 0, originalBoxSize, originalBoxSize);
  addLayer(-10, 0, originalBoxSize, originalBoxSize, "x");

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
  dirLight.position.set(10, 20, 0);
  scene.add(dirLight);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animation);
  document.body.appendChild(renderer.domElement);

  particleData = createParticles();
  createParticleBackground(scene);
}

// ----- Start -----
init();
