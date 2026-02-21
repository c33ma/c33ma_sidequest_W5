class WorldLevel {
  constructor(json) {
    this.schemaVersion = json.schemaVersion ?? 1;

    this.w = json.world?.w ?? 2400;
    this.h = json.world?.h ?? 1600;

    // Dark world tone (space-friendly). The real background is Effects.drawFar().
    this.bg = json.world?.bg ?? [10, 12, 22];

    this.gridStep = json.world?.gridStep ?? 160;
    this.obstacles = json.obstacles ?? [];

    // Camera knob from JSON
    this.camLerp = json.camera?.lerp ?? 0.12;
  }

  drawBackground() {
    // Space background (stars/nebula) is drawn in Effects.drawFar().
    // IMPORTANT: do NOT call background() here or it will erase the starfield.
  }

  drawWorld() {
    // Very faint world bounds (keeps the feeling of a "space region" without blocking stars)
    noStroke();
    fill(0, 30);
    rect(0, 0, this.w, this.h);

    // Optional: super subtle grid (comment this out if you want pure space)
    stroke(255, 10);
    for (let x = 0; x <= this.w; x += this.gridStep) line(x, 0, x, this.h);
    for (let y = 0; y <= this.h; y += this.gridStep) line(0, y, this.w, y);

    // Obstacles (optional). If present, this can be "debris" or "asteroids"
    noStroke();
    fill(120, 140, 170, 120);
    for (const o of this.obstacles) rect(o.x, o.y, o.w, o.h, o.r ?? 0);
  }

  drawHUD(player, camX, camY) {
    noStroke();
    fill(255, 200);

    text("Space Drifter — Side Quest 5", 12, 20);

    text(
      "camLerp: " +
        this.camLerp +
        "  Player: " +
        (player.x | 0) +
        "," +
        (player.y | 0) +
        "  Cam: " +
        (camX | 0) +
        "," +
        (camY | 0),
      12,
      40
    );

    fill(255, 160);
    text("Tip: pause to brighten stars + summon shooting stars. Press E to land.", 12, 60);
  }
}