class WorldLevel {
  constructor(json) {
    this.schemaVersion = json.schemaVersion ?? 1;

    this.w = json.world?.w ?? 2400;
    this.h = json.world?.h ?? 1600;
    this.bg = json.world?.bg ?? [10, 12, 22]; // dark space
    this.gridStep = json.world?.gridStep ?? 160;

    this.obstacles = json.obstacles ?? [];
    this.camLerp = json.camera?.lerp ?? 0.12;

    // Items (discoveries) from JSON, or fallback defaults
    this.items = json.items ?? [
      { x: 520, y: 380, type: "astronaut", msg: "A tiny astronaut floats by… hi 🧑‍🚀" },
      { x: 1200, y: 900, type: "alien", msg: "Alien: “You’re drifting too fast. Try pausing.” 👽" },
      { x: 1900, y: 520, type: "artifact", msg: "Artifact: a warm pulse… like a heartbeat 💎" }
    ];

    // Background stars (world-space, but drawn with parallax)
    this.stars = [];
    const starCount = 900;
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: random(0, this.w),
        y: random(0, this.h),
        r: random(1, 3),
        a: random(120, 255),
        tw: random(TWO_PI)
      });
    }

    // Big planets (world-space)
    this.planets = json.planets ?? [
      { x: 700, y: 520, r: 90, col: [215, 190, 140] },  // sandy
      { x: 1500, y: 300, r: 70, col: [120, 210, 160] }, // garden
      { x: 1800, y: 900, r: 110, col: [170, 120, 210] } // glow
    ];
  }

  drawBackground(camX, camY) {
    // Deep space
    background(this.bg[0], this.bg[1], this.bg[2]);

    // Parallax stars (screen-space)
    noStroke();
    for (const s of this.stars) {
      const px = s.x - camX * 0.25;
      const py = s.y - camY * 0.25;

      // wrap to canvas so it always looks filled
      const x = ((px % width) + width) % width;
      const y = ((py % height) + height) % height;

      const twinkle = 1 + 0.25 * sin(frameCount * 0.03 + s.tw);
      fill(255, s.a * twinkle);
      circle(x, y, s.r);
    }

    // Soft nebula-ish haze (super cheap + pretty)
    noStroke();
    for (let i = 0; i < 5; i++) {
      fill(50, 90, 160, 12);
      const x = ((600 + i * 380 - camX * 0.08) % width + width) % width;
      const y = ((260 + i * 210 - camY * 0.08) % height + height) % height;
      circle(x, y, 500);
    }

    // Big planets (parallax so they feel distant)
    for (const p of this.planets) {
      const px = p.x - camX * 0.15;
      const py = p.y - camY * 0.15;

      const x = ((px % width) + width) % width;
      const y = ((py % height) + height) % height;

      noStroke();
      fill(p.col[0], p.col[1], p.col[2], 220);
      circle(x, y, p.r * 2);

      fill(255, 35);
      circle(x - p.r * 0.25, y - p.r * 0.25, p.r * 1.1);
    }
  }

  drawWorld() {
    // World is basically empty space; we only draw “discoveries”
    for (const it of this.items) this._drawItem(it);
  }

  _drawItem(it) {
    push();
    translate(it.x, it.y);

    if (it.type === "astronaut") {
      noStroke();
      fill(240);
      circle(0, -6, 16);
      fill(200);
      rectMode(CENTER);
      rect(0, 10, 12, 18, 3);
      stroke(255, 70);
      line(6, 18, 24, 30);
    } else if (it.type === "alien") {
      noStroke();
      fill(120, 255, 170);
      ellipse(0, 0, 22, 26);
      fill(0);
      ellipse(-5, -2, 5, 8);
      ellipse(5, -2, 5, 8);
      fill(120, 255, 170);
      rectMode(CENTER);
      rect(0, 16, 14, 10, 4);
    } else {
      // artifact
      noStroke();
      fill(180, 220, 255);
      beginShape();
      vertex(0, -14);
      vertex(10, 0);
      vertex(0, 14);
      vertex(-10, 0);
      endShape(CLOSE);

      fill(255, 60);
      circle(0, 0, 10);
    }

    pop();
  }

  drawHUD(player, camX, camY) {
    noStroke();
    fill(255, 200);
    text("Space Drift (simple version)", 12, 20);
    fill(255, 150);
    text("Move: WASD/Arrows • Explore and get close to things ✨", 12, 40);
  }
}