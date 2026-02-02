import './style.css'

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

// --- CONFIGURATION ---
const VIEWPORT_WIDTH = 1920;
const VIEWPORT_HEIGHT = 1080;
const GROUND_Y = 900;

// Asset Paths
const ASSETS = {
  bg: '/background.jpg',
  shop: '/shop.jpg',
  girl_stand: '/girl_stand.png',
  girl_surprise: '/girl_surprise.png',
  boy_walk1: '/boy_walk1.jpg',
  boy_walk2: '/boy_walk2.jpg',
  boy_kneel: '/boy_kneel.png',
  hug: '/hug.jpg'
};

// Colors for text
const messageColors = [
  "#e53935", "#d81b60", "#8e24aa", "#5e35b1", "#3949ab",
  "#1e88e5", "#00acc1", "#00897b", "#43a047", "#7cb342", "#f4511e"
];

const messages = [
  "In a world of black and white...",
  "You paint my life with color.",
  "Every moment with you is magic.",
  "Your smile is my favorite sunlight.",
  "I promise to always hold your hand.",
  "To buy you flowers just because.",
  "To listen to your stories.",
  "To be your biggest fan.",
  "You are my best friend.",
  "My safe place.",
  "I love you, Arushi. ❤️"
];

const images = {};
// Background Music
const audio = new Audio('/music.mp3');
audio.loop = true;
audio.volume = 0.5; // Starts soft

let loadedCount = 0;
const totalAssets = Object.keys(ASSETS).length;
let gameStarted = false;

// --- STATE MANAGEMENT ---
const state = {
  time: 0,
  scene: 'intro', // intro, enter, walk, kneel, reaction, celebration
  camera: { x: 0, y: 0 },
  boy: { x: 2200, y: GROUND_Y, speed: 4, bobOffset: 0 },
  girl: { x: 600, y: GROUND_Y }
};

// --- INIT ---
function init() {
  resize();
  window.addEventListener('resize', resize);
  setupUI();

  // AUDIO HANDLING: Browser Autoplay Policy
  // Try to play immediately
  audio.play().catch(() => {
    console.log("Autoplay blocked. Waiting for interact.");
    // Add one-time listener to start music on ANY click
    const startAudio = () => {
      audio.play();
      document.removeEventListener('click', startAudio);
      document.removeEventListener('keydown', startAudio);
    };
    document.addEventListener('click', startAudio);
    document.addEventListener('keydown', startAudio);
  });

  // Safety Timer
  setTimeout(() => {
    if (!gameStarted) {
      console.warn("Forcing Start...");
      document.getElementById('loading').classList.add('hidden');
      startLoop();
    }
  }, 3000);

  // Load Images
  for (const [key, path] of Object.entries(ASSETS)) {
    const img = new Image();
    img.src = path;
    img.onload = () => {
      if (gameStarted) return;
      loadedCount++;
      if (loadedCount === totalAssets) {
        document.getElementById('loading').classList.add('hidden');
        startLoop();
      }
    };
    img.onerror = () => {
      console.error(`ERROR LOADING: ${path}`);
      loadedCount++;
      if (loadedCount === totalAssets) {
        document.getElementById('loading').classList.add('hidden');
        startLoop();
      }
    };
    images[key] = img;
  }
}

function setupUI() {
  const btnNo = document.getElementById('btn-no');
  const btnYes = document.getElementById('btn-yes');
  const proposalUI = document.getElementById('proposal-ui');
  const celebrationUI = document.getElementById('celebration-ui');
  const quoteText = document.querySelector('.quote');

  let isFloating = false;

  // MAGNETIC NO BUTTON LOGIC (Fixed Position Version)
  document.addEventListener('mousemove', (e) => {
    if (proposalUI.classList.contains('hidden')) return;

    // We use getBoundingClientRect because it works for relative AND fixed
    const rect = btnNo.getBoundingClientRect();
    const btnCenterX = rect.left + rect.width / 2;
    const btnCenterY = rect.top + rect.height / 2;

    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const dist = Math.hypot(mouseX - btnCenterX, mouseY - btnCenterY);
    const triggerDist = 300; // Activation distance

    if (dist < triggerDist) {
      if (!isFloating) {
        // LOCK to Fixed Position
        isFloating = true;
        btnNo.style.position = 'fixed';
        btnNo.style.left = `${rect.left}px`;
        btnNo.style.top = `${rect.top}px`;
        return;
      }

      // Calculate Repulsion
      const dx = btnCenterX - mouseX;
      const dy = btnCenterY - mouseY;

      let ndx = dx / dist;
      let ndy = dy / dist;

      const force = (triggerDist - dist) / triggerDist;
      const speed = 150;

      const moveX = ndx * force * speed;
      const moveY = ndy * force * speed;

      let newLeft = rect.left + moveX;
      let newTop = rect.top + moveY;

      // --- CLAMP TO VIEWPORT ---
      const padding = 50;
      const maxW = window.innerWidth - rect.width - padding;
      const maxH = window.innerHeight - rect.height - padding;

      if (newLeft < padding) newLeft = padding + 10;
      if (newLeft > maxW) newLeft = maxW - 10;
      if (newTop < padding) newTop = padding + 10;
      if (newTop > maxH) newTop = maxH - 10;

      // Corner Trap Escape
      if (dist < 50 && (newLeft <= padding + 20 || newLeft >= maxW - 20)) {
        newLeft = window.innerWidth / 2;
        newTop = window.innerHeight / 2;
      }

      btnNo.style.left = `${newLeft}px`;
      btnNo.style.top = `${newTop}px`;
    }
  });

  // YES LOGIC
  btnYes.addEventListener('click', () => {
    state.scene = 'celebration';
    proposalUI.classList.add('hidden');
    celebrationUI.classList.remove('hidden');
    // Ensure music is playing
    if (audio.paused) audio.play();

    initParticles();
    playMessageSequence(quoteText);
  });
}

function playMessageSequence(el) {
  let index = 0;
  function showNext() {
    if (index >= messages.length) return;

    el.classList.remove('visible');

    setTimeout(() => {
      el.textContent = messages[index];
      el.style.color = messageColors[index % messageColors.length];
      el.classList.add('visible');
      index++;
      setTimeout(showNext, 3500);
    }, 1000);
  }
  el.textContent = "";
  showNext();
}

// --- PARTICLES ---
const particles = [];
function initParticles() {
  for (let i = 0; i < 100; i++) {
    particles.push({
      x: Math.random() * VIEWPORT_WIDTH,
      y: VIEWPORT_HEIGHT + Math.random() * 200,
      vx: (Math.random() - 0.5) * 4,
      vy: -3 - Math.random() * 5,
      size: 10 + Math.random() * 30,
      color: `hsl(${320 + Math.random() * 60}, 90%, 70%)`,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.1
    });
  }
}

function updateParticles() {
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.rotation += p.spin;
    if (p.y < -100) {
      p.y = VIEWPORT_HEIGHT + 100;
      p.x = Math.random() * VIEWPORT_WIDTH;
    }
  });
}

function drawParticles() {
  particles.forEach(p => {
    ctx.save();
    ctx.translate(p.x - state.camera.x, p.y - state.camera.y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    const s = p.size;
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-s / 2, -s / 2, -s, s / 3, 0, s);
    ctx.bezierCurveTo(s, s / 3, s / 2, -s / 2, 0, 0);
    ctx.fill();
    ctx.restore();
  });
}

function resize() {
  const scale = Math.min(window.innerWidth / VIEWPORT_WIDTH, window.innerHeight / VIEWPORT_HEIGHT);
  canvas.width = VIEWPORT_WIDTH;
  canvas.height = VIEWPORT_HEIGHT;
  canvas.style.width = `${VIEWPORT_WIDTH * scale}px`;
  canvas.style.height = `${VIEWPORT_HEIGHT * scale}px`;
}

// --- RENDER ---
function drawSprite(img, x, y, options = {}) {
  if (!img) return;
  if (img.naturalWidth === 0 && img.complete) return;

  const scale = options.scale || 1;
  const anchorBottom = options.anchorBottom ?? true;
  const sw = img.width;
  const sh = img.height;
  const dw = sw * scale;
  const dh = sh * scale;
  const drawX = (x - state.camera.x) - (dw / 2);
  const drawY = (y - state.camera.y) - (anchorBottom ? dh : 0);

  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(img, 0, 0, sw, sh, drawX, drawY, dw, dh);
  ctx.globalCompositeOperation = 'source-over';
}

function update() {
  state.time++;

  if (state.scene === 'celebration') {
    updateParticles();
    const midPoint = (state.boy.x + state.girl.x) / 2;
    const targetX = midPoint - VIEWPORT_WIDTH / 2;
    state.camera.x += (targetX - state.camera.x) * 0.05;
    return;
  }

  if (state.scene === 'intro') { if (state.time > 60) state.scene = 'enter'; }
  else if (state.scene === 'enter') {
    state.boy.x -= state.boy.speed;
    state.boy.bobOffset = Math.sin(state.time * 0.4) * 5;
    const desiredCamX = state.boy.x - VIEWPORT_WIDTH * 0.7;
    state.camera.x += (Math.max(0, desiredCamX) - state.camera.x) * 0.05;
    if (state.boy.x - state.girl.x < 300) {
      state.scene = 'kneel';
      state.boy.bobOffset = 0;
    }
  }
  else if (state.scene === 'kneel') {
    const targetX = (state.boy.x + state.girl.x) / 2 - VIEWPORT_WIDTH / 2;
    state.camera.x += (targetX - state.camera.x) * 0.02;
    if (!state.kneelTime) state.kneelTime = state.time;
    if (state.time - state.kneelTime > 60) {
      state.scene = 'reaction';
      setTimeout(() => {
        document.getElementById('proposal-ui').classList.remove('hidden');
      }, 1000);
    }
  }
}

function draw() {
  ctx.fillStyle = '#fcf8e3'; ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

  if (images.bg) {
    const bgX = -state.camera.x * 0.2;
    const scale = VIEWPORT_HEIGHT / images.bg.height;
    ctx.drawImage(images.bg, bgX, 0, images.bg.width * scale, VIEWPORT_HEIGHT);
  }

  drawSprite(images.shop, 300, GROUND_Y, { scale: 0.8 });

  if (state.scene === 'celebration') {
    const useHug = (images.hug && images.hug.complete && images.hug.naturalWidth > 0);
    if (useHug) {
      const midX = (state.boy.x + state.girl.x) / 2;
      drawSprite(images.hug, midX, GROUND_Y, { scale: 0.8 });
    } else {
      drawSprite(images.girl_surprise, state.girl.x, state.girl.y, { scale: 0.65 });
      drawSprite(images.boy_kneel, state.boy.x, state.boy.y, { scale: 0.65 });
    }
  } else {
    const girlImg = (state.scene === 'reaction') ? images.girl_surprise : images.girl_stand;
    drawSprite(girlImg, state.girl.x, state.girl.y, { scale: 0.65 });

    if (state.scene === 'kneel' || state.scene === 'reaction') {
      drawSprite(images.boy_kneel, state.boy.x, state.boy.y, { scale: 0.65 });
    } else {
      const frame = Math.floor(state.time / 8) % 2;
      const walkImg = frame === 0 ? images.boy_walk1 : images.boy_walk2;
      drawSprite(walkImg, state.boy.x, state.boy.y + state.boy.bobOffset, { scale: 0.65 });
    }
  }

  if (state.scene === 'celebration') drawParticles();
}

function startLoop() {
  if (gameStarted) return;
  gameStarted = true;
  function loop() { update(); draw(); requestAnimationFrame(loop); }
  loop();
}

init();
