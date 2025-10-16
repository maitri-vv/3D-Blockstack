window.focus(); // Capture keys immediately

// ----- Globals -----
let camera, scene, renderer;
let world;
let lastTime;
let stack = [];
let overhangs = [];
const boxHeight = 1;
let originalBoxSize = 3;
let autopilot, gameEnded, robotPrecision;

const scoreElement = document.getElementById("score");
const instructionsElement = document.getElementById("instructions");
const resultsElement = document.getElementById("results");
const endScoreElement = document.getElementById("end-score");
const endHighScoreElement = document.getElementById("end-high-score");
const restartTextElement = document.getElementById("restart-text");

// ----- High Score -----
const HIGH_SCORE_KEY = "stackerHighScore";
let highScore = 0;

function loadHighScore() {
  try {
    const saved = localStorage.getItem(HIGH_SCORE_KEY);
    highScore = saved ? Math.max(0, parseInt(saved, 10) || 0) : 0;
  } catch (_) {
    highScore = 0;
  }
}

function saveHighScore(value) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(Math.max(0, value | 0)));
  } catch (_) {}
}

// ----- Touch Detection -----
function isTouchDevice() {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

function updateRestartMessage() {
  if (!restartTextElement) return;
  restartTextElement.innerHTML = isTouchDevice()
    ? "Tap anywhere to restart"
    : "Press <kbd>R</kbd> to restart";
}

// ----- Robot precision -----
function setRobotPrecision() {
  robotPrecision = Math.random() * 1 - 0.5;
}

// ----- Responsive Box -----
function setResponsiveBoxSize() {
  const vw = Math.max(window.innerWidth, 320);
  const vh = Math.max(window.innerHeight, 320);
  const minDim = Math.min(vw, vh);
  if (minDim < 420) originalBoxSize = 1.8;
  else if (minDim < 768) originalBoxSize = 2.6;
  else originalBoxSize = 4;
}

// ----- THREE & CANNON Init -----
function init() {
  autopilot = true;
  gameEnded = false;
  lastTime = 0;
  stack = [];
  overhangs = [];
  setRobotPrecision();
  setResponsiveBoxSize();
  loadHighScore();

  // Scene
  scene = new THREE.Scene();
  scene.background = createGradientBackground();

  // Camera
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

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animation);
  document.body.appendChild(renderer.domElement);

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
  dirLight.position.set(10, 20, 0);
  scene.add(dirLight);

  // CannonJS
  world = new CANNON.World();
  world.gravity.set(0, -10, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 40;

  // Foundation
  addLayer(0, 0, originalBoxSize, originalBoxSize);
  addLayer(-10, 0, originalBoxSize, originalBoxSize, "x");

  // Particles
  particleData = createParticles();
  createParticleBackground(scene);
}

function createGradientBackground() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = canvas.height = 512;
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#ff9f43");
  gradient.addColorStop(0.5, "#feca57");
  gradient.addColorStop(1, "#f8e9a1");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return new THREE.CanvasTexture(canvas);
}

// ----- Particles -----
let particleData;
function createParticles() {
  const particleCount = window.innerWidth < 768 ? 100 : 200;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < positions.length; i += 3) {
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
  const points = new THREE.Points(geometry, material);
  scene.add(points);
  return { particles: points, particleGeometry: geometry };
}

function animateParticles(pData) {
  const pos = pData.particleGeometry.attributes.position.array;
  for (let i = 1; i < pos.length; i += 3) {
    pos[i] += Math.sin(Date.now() * 0.001 + i) * 0.02;
    if (pos[i] > 100) pos[i] = -100;
    if (pos[i] < -100) pos[i] = 100;
  }
  pData.particleGeometry.attributes.position.needsUpdate = true;
}

function createParticleBackground(scene) {
  const particleCount = 500;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.05,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  const particles = new THREE.Points(geometry, material);
  particles.renderOrder = -1;
  scene.add(particles);
  function animate() {
    requestAnimationFrame(animate);
    particles.rotation.y += 0.001;
  }
  animate();
}

// ----- Game Logic -----
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

function generateBox(x, y, z, width, depth, falls) {
  const geometry = new THREE.BoxGeometry(width, boxHeight, depth);
  const color = new THREE.Color(`hsl(${30 + stack.length * 4},100%,50%)`);
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

// ----- Ring Effect -----
function createRingEffect(x, y, z) {
  const geometry = new THREE.RingGeometry(0.8, 1.5, 32);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffd700,
    transparent: true,
    opacity: 0.8,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y + 0.1, z);
  mesh.rotation.x = -Math.PI / 2;
  scene.add(mesh);
  new TWEEN.Tween(mesh.scale)
    .to({ x: 2, y: 2 }, 800)
    .easing(TWEEN.Easing.Quadratic.Out)
    .start();
  new TWEEN.Tween(material)
    .to({ opacity: 0 }, 800)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onComplete(() => scene.remove(mesh))
    .start();
}

// ----- Cut & Split -----
function cutBox(topLayer, overlap, size, delta) {
  const direction = topLayer.direction;
  const newWidth = direction == "x" ? overlap : topLayer.width;
  const newDepth = direction == "z" ? overlap : topLayer.depth;
  topLayer.width = newWidth;
  topLayer.depth = newDepth;
  topLayer.threejs.scale[direction] = overlap / size;
  topLayer.threejs.position[direction] -= delta / 2;
  topLayer.cannonjs.position[direction] -= delta / 2;
  const shape = new CANNON.Box(
    new CANNON.Vec3(newWidth / 2, boxHeight / 2, newDepth / 2)
  );
  topLayer.cannonjs.shapes = [];
  topLayer.cannonjs.addShape(shape);
}

// ----- Audio -----
const sounds = {
  place: new Audio("sounds/put.bg.mp3"),
  fail: new Audio("sounds/fall.bg.mp3"),
  bgm: new Audio("sounds/bg.mp3.mp3"),
};
Object.values(sounds).forEach((s) => s.load());
sounds.bgm.volume = 0.2;
sounds.bgm.loop = true;

let muted = false;
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
  sounds.bgm
    .play()
    .catch(() => console.log("User interaction required to play sound"));
}
window.addEventListener("mousedown", enableBackgroundMusic, { once: true });
window.addEventListener("touchstart", enableBackgroundMusic, { once: true });
window.addEventListener("keydown", enableBackgroundMusic, { once: true });

function playPlaceSound() {
  if (muted) return;
  const s = sounds.place.cloneNode();
  s.volume = 0.7;
  s.play().catch(() => {});
}
function playFailSound() {
  if (muted) return;
  const s = sounds.fail.cloneNode();
  s.volume = 0.7;
  s.play().catch(() => {});
}

// ----- Game Events -----
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
  } else {
    missedTheSpot();
  }
}

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
  const score = Math.max(0, stack.length - 1);
  if (score > highScore) {
    highScore = score;
    saveHighScore(highScore);
  }
  if (endScoreElement) endScoreElement.innerText = `${score} ◆`;
  if (endHighScoreElement) endHighScoreElement.innerText = `${highScore} ◆`;
  updateRestartMessage();
  if (resultsElement && !autopilot) resultsElement.style.display = "flex";
  playFailSound();
}

// ----- Animation -----
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

function updatePhysics(deltaTime) {
  world.step(deltaTime / 1000);
  overhangs.forEach((e) => {
    e.threejs.position.copy(e.cannonjs.position);
    e.threejs.quaternion.copy(e.cannonjs.quaternion);
  });
}

// ----- Event Listeners -----
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
    e.preventDefault();
    gameEnded ? startGame() : eventHandler();
  },
  { passive: false }
);

function eventHandler() {
  autopilot ? startGame() : splitBlockAndAddNextOneIfOverlaps();
}

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
  if (particleData?.particleGeometry)
    particleData.particleGeometry.attributes.position.needsUpdate = true;
  renderer.render(scene, camera);
});

// ----- Start / Restart -----
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

// ----- Init Game -----
init();
