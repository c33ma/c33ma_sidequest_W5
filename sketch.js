const VIEW_W = 800;
const VIEW_H = 480;

let worldData;
let level;
let player;

let camX = 0;
let camY = 0;

// Popup state
let popupText = "";
let popupTimer = 0;
const POPUP_MAX = 180; // frames

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
}

function draw() {
  player.updateInput();

  player.x = constrain(player.x, 0, level.w);
  player.y = constrain(player.y, 0, level.h);

  // Camera target
  let targetX = player.x - width / 2;
  let targetY = player.y - height / 2;

  const maxCamX = max(0, level.w - width);
  const maxCamY = max(0, level.h - height);
  targetX = constrain(targetX, 0, maxCamX);
  targetY = constrain(targetY, 0, maxCamY);

  camX = lerp(camX, targetX, level.camLerp);
  camY = lerp(camY, targetY, level.camLerp);

  // Background (stars + planets)
  level.drawBackground(camX, camY);

  // World draw
  push();
  translate(-camX, -camY);
  level.drawWorld();
  player.draw();
  pop();

  // Check proximity to items
  checkDiscoveries();

  // HUD + popup
  level.drawHUD(player, camX, camY);
  drawPopup();
}

function checkDiscoveries() {
  const r = 80; // discovery radius

  for (const it of level.items) {
    const d = dist(player.x, player.y, it.x, it.y);
    if (d < r) {
      // Show message + refresh timer while nearby
      popupText = it.msg;
      popupTimer = POPUP_MAX;
      return;
    }
  }

  // Count down when not near anything
  if (popupTimer > 0) popupTimer--;
}

function drawPopup() {
  if (popupTimer <= 0 || !popupText) return;

  const fade = 18;
  let a = 255;
  if (popupTimer < fade) a = map(popupTimer, 0, fade, 0, 255);

  push();
  const pad = 14;
  const boxW = min(560, width - pad * 2);
  const x = pad;
  const y = height - 90;

  noStroke();
  fill(0, 170);
  rect(x, y, boxW, 60, 12);

  fill(255, a);
  textAlign(LEFT, CENTER);
  text(popupText, x + pad, y + 30, boxW - pad * 2);
  pop();
}

function keyPressed() {
  if (key === "r" || key === "R") {
    const start = worldData.playerStart ?? { x: 300, y: 300, speed: 3 };
    player = new Player(start.x, start.y, start.speed);
    popupText = "";
    popupTimer = 0;
  }
}