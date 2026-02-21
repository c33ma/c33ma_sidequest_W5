/*
Space Drifter — Side Quest 5
Builds on Week 5 Example 4 (JSON World + Smooth Camera)

Features:
- Parallax star layers
- Shooting stars (increase when still)
- Comets
- Nebula
- Vignette + fog overlay
- Landable planets
- Satellite + astronaut discoveries
- Black hole slowdown + warp
- Constellation message
*/

const VIEW_W = 800;
const VIEW_H = 480;

let worldData;
let level;
let player;

let camX = 0;
let camY = 0;

let ui;
let effects;
let entities;

// For stillness detection
let prevPX = 0;
let prevPY = 0;

function preload() {
  worldData = loadJSON("world.json");
}

function setup() {
  createCanvas(VIEW_W, VIEW_H);
  textFont("sans-serif");
  textSize(14);

  level = new WorldLevel(worldData);

  const start = worldData.playerStart ?? { x: 300, y: 300, speed: 3 };
  player = new Player(start.x, start.y, start.speed);

  camX = player.x - width / 2;
  camY = player.y - height / 2;

  ui = new UI();
  effects = new Effects(level, ui);
  entities = new Entities(level, ui, worldData);

  prevPX = player.x;
  prevPY = player.y;
}

function draw() {
  // --- INPUT ---
  player.updateInput();

  // --- Movement delta (for stillness + warp logic) ---
  const dx = player.x - prevPX;
  const dy = player.y - prevPY;
  const moveMag = sqrt(dx * dx + dy * dy);

  prevPX = player.x;
  prevPY = player.y;

  // --- Apply speed effects (black hole + landing zones) ---
  entities.applySpeedEffects(player, moveMag);

  // --- Constrain player to world ---
  player.x = constrain(player.x, 0, level.w);
  player.y = constrain(player.y, 0, level.h);

  // --- Camera targeting ---
  let targetX = player.x - width / 2;
  let targetY = player.y - height / 2;

  const maxCamX = max(0, level.w - width);
  const maxCamY = max(0, level.h - height);

  targetX = constrain(targetX, 0, maxCamX);
  targetY = constrain(targetY, 0, maxCamY);

  camX = lerp(camX, targetX, level.camLerp);
  camY = lerp(camY, targetY, level.camLerp);

  // ================================
  // SPACE BACKGROUND (parallax, nebula, stars)
  // ================================
  effects.update(player, moveMag, camX, camY);
  effects.drawFar(camX, camY);

  // World background (does NOT clear screen)
  level.drawBackground();

  // ================================
  // WORLD SPACE
  // ================================
  push();
  translate(-camX, -camY);

  entities.update(player, moveMag);
  entities.draw();

  level.drawWorld();
  player.draw();

  pop();

  // ================================
  // UI + OVERLAYS
  // ================================
  level.drawHUD(player, camX, camY);

  ui.update();
  ui.draw();

  effects.drawOverlay(entities.getWarpStrength(player));
}

function keyPressed() {
  if (key === "r" || key === "R") {
    const start = worldData.playerStart ?? { x: 300, y: 300, speed: 3 };
    player = new Player(start.x, start.y, start.speed);
    prevPX = player.x;
    prevPY = player.y;

    entities.reset();
    ui.clear();
  }

  if (key === "e" || key === "E") {
    entities.interact(player);
  }
}