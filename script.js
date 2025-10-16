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

const scoreElement = document.getElementById("score");
const instructionsElement = document.getElementById("instructions");
const resultsElement = document.getElementById("results");

// High score UI references
const endScoreElement = document.getElementById("end-score");
const endHighScoreElement = document.getElementById("end-high-score");
const restartTextElement = document.getElementById("restart-text");

// High score storage
const HIGH_SCORE_KEY = "stackerHighScore";
let highScore = 0;

// Detect if user is on a touch device
function isTouchDevice() {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}

// Update restart message based on device type
function updateRestartMessage() {
  if (restartTextElement) {
    if (isTouchDevice()) {
      restartTextElement.innerHTML = "Tap anywhere to restart";
    } else {
      restartTextElement.innerHTML = 'Press <kbd>R</kbd> to restart';
    }
  }
}

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
  } catch (_) {
    // ignore storage errors
  }
}


init();

// Determines how precise the game is on autopilot
function setRobotPrecision() {
  robotPrecision = Math.random() * 1 - 0.5;
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

  createParticleBackground(scene);
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
  // Choose base scale: keep boxes readable across devices
  const vw = Math.max(window.innerWidth, 320);
  const vh = Math.max(window.innerHeight, 320);

  // We'll base the box size on the smaller of (viewport width, viewport height)
  // Map range: small screens -> ~1.8, medium -> ~3, large -> ~4.5
  const minDim = Math.min(vw, vh);
  // Keep desktop size at the original 3 units. Reduce only for smaller screens.
  if (minDim < 420) {
    originalBoxSize = 1.8; // very small phones
  } else if (minDim < 768) {
    originalBoxSize = 2.6; // small tablets / large phones
  } else {
    originalBoxSize = 4; // desktop and most tablets
  }
}
// Function to create a ring effect at (x, y, z)
function createRingEffect(x, y, z) {
  const ringGeometry = new THREE.RingGeometry(0.8, 1.5, 32);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd700, // Golden yellow
    transparent: true,
    opacity: 0.8,

  });

  const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
  ringMesh.position.set(x, y + 0.1, z);
  ringMesh.rotation.x = -Math.PI / 2; // Make it flat

  scene.add(ringMesh);

  // Expand & fade out animation
  new TWEEN.Tween(ringMesh.scale)
    .to({ x: 2, y: 2 }, 800) // Expands outward
    .easing(TWEEN.Easing.Quadratic.Out)
    .start();

  new TWEEN.Tween(ringMaterial)
    .to({ opacity: 0 }, 800) // Fades out
    .easing(TWEEN.Easing.Quadratic.Out)
    .onComplete(() => scene.remove(ringMesh)) // Remove after animation
    .start();
}



function addLayer(x, z, width, depth, direction) {
  const y = boxHeight * stack.length; // Add the new box one layer higher
  const layer = generateBox(x, y, z, width, depth, false);
  layer.direction = direction;
  stack.push(layer);
  createRingEffect(x, y, z);
}

// Function to Create Particles
function createParticles() {
  const particleCount = 200; // Number of particles
  const particleGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 50; // Spread particles across X-axis
    positions[i + 1] = Math.random() * 30; // Y-axis height variation
    positions[i + 2] = (Math.random() - 0.5) * 50; // Spread across Z-axis
  }

  particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const particleMaterial = new THREE.PointsMaterial({
    color: 0xffd700, // Golden yellow
    size: 0.5, // Particle size
    transparent: true,
    opacity: 0.8,
    depthWrite: false
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  return { particles, particleGeometry };
}

// Function to Animate Particles (Floating Effect)
function animateParticles(particleData) {
  const positions = particleData.particleGeometry.attributes.position.array;

  for (let i = 1; i < positions.length; i += 3) {
    positions[i] += Math.sin(Date.now() * 0.001 + i) * 0.02; // Floating motion
    // keep particles within a bound to avoid runaway values
    if (positions[i] > 100) positions[i] = -100;
    if (positions[i] < -100) positions[i] = 100;
  }

  particleData.particleGeometry.attributes.position.needsUpdate = true;
}

// Initialize Particles
const particleData = createParticles();



function addOverhang(x, z, width, depth) {
  const y = boxHeight * (stack.length - 1); // Add the new box one the same layer
  const overhang = generateBox(x, y, z, width, depth, true);
  overhangs.push(overhang);
}

function generateBox(x, y, z, width, depth, falls) {
  // ThreeJS
  const geometry = new THREE.BoxGeometry(width, boxHeight, depth);
  const color = new THREE.Color(`hsl(${30 + stack.length * 4}, 100%, 50%)`);
  const material = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  scene.add(mesh);

  // CannonJS
  const shape = new CANNON.Box(
    new CANNON.Vec3(width / 2, boxHeight / 2, depth / 2)
  );
  let mass = falls ? 5 : 0; // If it shouldn't fall then setting the mass to zero will keep it stationary
  mass *= width / originalBoxSize; // Reduce mass proportionately by size
  mass *= depth / originalBoxSize; // Reduce mass proportionately by size
  const body = new CANNON.Body({ mass, shape });
  body.position.set(x, y, z);
  world.addBody(body);

  return {
    threejs: mesh,
    cannonjs: body,
    width,
    depth
  };
}

function cutBox(topLayer, overlap, size, delta) {
  const direction = topLayer.direction;
  const newWidth = direction == "x" ? overlap : topLayer.width;
  const newDepth = direction == "z" ? overlap : topLayer.depth;

  // Update metadata
  topLayer.width = newWidth;
  topLayer.depth = newDepth;

  // Update ThreeJS model
  topLayer.threejs.scale[direction] = overlap / size;
  topLayer.threejs.position[direction] -= delta / 2;

  // Update CannonJS model
  topLayer.cannonjs.position[direction] -= delta / 2;

  // Replace shape to a smaller one (in CannonJS you can't simply just scale a shape)
  const shape = new CANNON.Box(
    new CANNON.Vec3(newWidth / 2, boxHeight / 2, newDepth / 2)
  );
  topLayer.cannonjs.shapes = [];
  topLayer.cannonjs.addShape(shape);
}


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
    startGame();
  } else {
    // During gameplay, handle normal touch
    eventHandler();
  }
}, { passive: false });


function eventHandler() {
  if (autopilot) startGame();
  else splitBlockAndAddNextOneIfOverlaps();
}

function splitBlockAndAddNextOneIfOverlaps() {
  if (gameEnded) return;

  const topLayer = stack[stack.length - 1];
  const previousLayer = stack[stack.length - 2];

  const direction = topLayer.direction;

  const size = direction == "x" ? topLayer.width : topLayer.depth;
  const delta =
    topLayer.threejs.position[direction] -
    previousLayer.threejs.position[direction];
  const overhangSize = Math.abs(delta);
  const overlap = size - overhangSize;

  if (overlap > 0) {
    cutBox(topLayer, overlap, size, delta);

    // Overhang
    const overhangShift = (overlap / 2 + overhangSize / 2) * Math.sign(delta);
    const overhangX =
      direction == "x"
        ? topLayer.threejs.position.x + overhangShift
        : topLayer.threejs.position.x;
    const overhangZ =
      direction == "z"
        ? topLayer.threejs.position.z + overhangShift
        : topLayer.threejs.position.z;
    const overhangWidth = direction == "x" ? overhangSize : topLayer.width;
    const overhangDepth = direction == "z" ? overhangSize : topLayer.depth;

    addOverhang(overhangX, overhangZ, overhangWidth, overhangDepth);

    // Next layer
    const nextX = direction == "x" ? topLayer.threejs.position.x : -10;
    const nextZ = direction == "z" ? topLayer.threejs.position.z : -10;
    const newWidth = topLayer.width; // New layer has the same size as the cut top layer
    const newDepth = topLayer.depth; // New layer has the same size as the cut top layer
    const nextDirection = direction == "x" ? "z" : "x";

    if (scoreElement) scoreElement.innerText = `${stack.length - 1} ◆`;
    addLayer(nextX, nextZ, newWidth, newDepth, nextDirection);
  } else {
    missedTheSpot();
  }

}

function missedTheSpot() {
  const topLayer = stack[stack.length - 1];

  // Turn to top layer into an overhang and let it fall down
  addOverhang(
    topLayer.threejs.position.x,
    topLayer.threejs.position.z,
    topLayer.width,
    topLayer.depth
  );
  world.remove(topLayer.cannonjs);
  scene.remove(topLayer.threejs);

  gameEnded = true;
  // Evaluate and update high score
  const currentScore = Math.max(0, stack.length - 1);
  if (currentScore > highScore) {
    highScore = currentScore;
    saveHighScore(highScore);
  }
  // Update end-game UI with current and high scores
  if (endScoreElement) endScoreElement.innerText = `${currentScore} ◆`;
  if (endHighScoreElement) endHighScoreElement.innerText = `${highScore} ◆`;

  // Update restart message based on device type
  updateRestartMessage();

  if (resultsElement && !autopilot) resultsElement.style.display = "flex";
}

function animation(time) {
  if (lastTime) {
    const timePassed = time - lastTime;
    const speed = 0.008;
    TWEEN.update(); // 🔥 Ensures animations run
    const topLayer = stack[stack.length - 1];
    const previousLayer = stack[stack.length - 2];

    // The top level box should move if the game has not ended AND
    // it's either NOT in autopilot or it is in autopilot and the box did not yet reach the robot position
    const boxShouldMove =
      !gameEnded &&
      (!autopilot ||
        (autopilot &&
          topLayer.threejs.position[topLayer.direction] <
          previousLayer.threejs.position[topLayer.direction] +
          robotPrecision));

    if (boxShouldMove) {
      // Keep the position visible on UI and the position in the model in sync
      topLayer.threejs.position[topLayer.direction] += speed * timePassed;
      topLayer.cannonjs.position[topLayer.direction] += speed * timePassed;

      // If the box went beyond the stack then show up the fail screen
      if (topLayer.threejs.position[topLayer.direction] > 10) {
        missedTheSpot();
      }
    } else {
      // If it shouldn't move then is it because the autopilot reached the correct position?
      // Because if so then next level is coming
      if (autopilot) {
        splitBlockAndAddNextOneIfOverlaps();
        setRobotPrecision();
      }
    }

    // 4 is the initial camera height
    if (camera.position.y < boxHeight * (stack.length - 2) + 4) {
      camera.position.y += speed * timePassed;
    }

    updatePhysics(timePassed);
    animateParticles(particleData);
    renderer.render(scene, camera);
  }
  lastTime = time;
}

function updatePhysics(timePassed) {
  world.step(timePassed / 1000); // Step the physics world

  // Copy coordinates from Cannon.js to Three.js
  overhangs.forEach((element) => {
    element.threejs.position.copy(element.cannonjs.position);
    element.threejs.quaternion.copy(element.cannonjs.quaternion);
  });
}

window.addEventListener("resize", () => {
  // Adjust camera
  // Recalculate responsive box size so new blocks follow new dimensions
  setResponsiveBoxSize();
  const aspect = window.innerWidth / window.innerHeight;
  const width = 10;
  const height = width / aspect;
  // Recompute orthographic frustum based on new aspect
  camera.left = -width / 2;
  camera.right = width / 2;
  camera.top = height / 2;
  camera.bottom = -height / 2;
  camera.updateProjectionMatrix();

  // Update renderer size and pixel ratio for crisp rendering on high DPI
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  // If particles exist, update their geometry draw range (safe no-op otherwise)
  if (typeof particleData !== "undefined" && particleData.particleGeometry) {
    particleData.particleGeometry.attributes.position.needsUpdate = true;
  }

  // Re-render once to avoid a visible gap during resize
  renderer.render(scene, camera);
});
