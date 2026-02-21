class Effects {
  constructor(level, ui) {
    this.level = level;
    this.ui = ui;

    // ---- STAR LAYERS (Parallax) ----
    this.layers = [
      { count: 450, parallax: 0.15, minR: 1, maxR: 2, twinkle: 0.2 },
      { count: 250, parallax: 0.35, minR: 1, maxR: 3, twinkle: 0.35 },
      { count: 120, parallax: 0.6, minR: 2, maxR: 4, twinkle: 0.5 },
    ];

    this.stars = this.layers.map((L) =>
      this._makeStars(L.count, L.minR, L.maxR)
    );

    // ---- Shooting stars & comets ----
    this.shooters = [];
    this.comets = [];
    this.maxShooters = 6;
    this.maxComets = 3;

    // ---- Nebula blobs ----
    this.nebula = this._makeNebula();

    // ---- Stillness mechanic ----
    this.movingTimer = 0;
    this.stillTimer = 0;
    this.starDim = 0;

    // ---- Vignette ----
    this.vig = createGraphics(width, height);
    this._renderVignette();
  }

  // =============================
  // UPDATE
  // =============================
  update(player, moveMag, camX, camY) {
    const moving = moveMag > 0.12;

    if (moving) {
      this.movingTimer++;
      this.stillTimer = max(0, this.stillTimer - 2);
    } else {
      this.stillTimer++;
      this.movingTimer = max(0, this.movingTimer - 1);
    }

    const targetDim = constrain(this.movingTimer / 360, 0, 1);
    this.starDim = lerp(this.starDim, targetDim, 0.05);

    // Shooting star frequency increases when still
    const baseChance = 0.006;
    const stillBoost = constrain(this.stillTimer / 240, 0, 1) * 0.02;

    if (random() < baseChance + stillBoost) {
      if (this.shooters.length < this.maxShooters) {
        this._spawnShooter(camX, camY);
      }
    }

    if (random() < 0.0025 && this.comets.length < this.maxComets) {
      this._spawnComet(camX, camY);
    }

    for (const s of this.shooters) {
      s.x += s.vx;
      s.y += s.vy;
      s.life++;
    }

    for (const c of this.comets) {
      c.x += c.vx;
      c.y += c.vy;
      c.life++;
    }

    this.shooters = this.shooters.filter((s) => s.life < s.maxLife);
    this.comets = this.comets.filter((c) => c.life < c.maxLife);
  }

  // =============================
  // DRAW BACKGROUND
  // =============================
  drawFar(camX, camY) {
    background(6, 8, 16);

    this._drawNebula(camX, camY);

    for (let i = 0; i < this.layers.length; i++) {
      const L = this.layers[i];
      this._drawStarsLayer(this.stars[i], camX, camY, L.parallax, L.twinkle);
    }

    this._drawShooters(camX, camY);
    this._drawComets(camX, camY);
  }

  // =============================
  // OVERLAY (Vignette + Warp)
  // =============================
  drawOverlay(warpStrength = 0) {
    push();

    image(this.vig, 0, 0);

    if (warpStrength > 0.001) {
      const t = frameCount * 0.04;
      const amp = 10 * warpStrength;

      noFill();
      stroke(255, 40 + 80 * warpStrength);
      strokeWeight(2);

      for (let r = 60; r < min(width, height); r += 50) {
        const wobble = sin(t + r * 0.05) * amp;
        ellipse(width / 2, height / 2, r * 2 + wobble, r * 2 - wobble);
      }
    }

    pop();
  }

  // =============================
  // STAR HELPERS
  // =============================
  _makeStars(n, minR, maxR) {
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push({
        x: random(0, this.level.w),
        y: random(0, this.level.h),
        r: random(minR, maxR),
        b: random(160, 255),
        p: random(TWO_PI),
      });
    }
    return arr;
  }

  _drawStarsLayer(stars, camX, camY, parallax, twinkleAmt) {
    push();
    noStroke();

    const dim = lerp(1, 0.55, this.starDim);

    for (const s of stars) {
      const sx = s.x - camX * parallax;
      const sy = s.y - camY * parallax;

      const tw = 1 + sin(frameCount * 0.03 + s.p) * twinkleAmt;
      const alpha = s.b * dim * tw;

      fill(255, alpha);
      circle(sx, sy, s.r);
    }

    pop();
  }

  // =============================
  // SHOOTERS + COMETS
  // =============================
  _spawnShooter(camX, camY) {
    const x = camX + random(-200, width + 200);
    const y = camY + random(-200, height + 200);

    const angle = random(-PI / 3, -PI / 6);
    const spd = random(12, 18);

    this.shooters.push({
      x,
      y,
      vx: cos(angle) * spd,
      vy: sin(angle) * spd,
      life: 0,
      maxLife: int(random(16, 26)),
    });
  }

  _spawnComet(camX, camY) {
    const side = random() < 0.5 ? -300 : width + 300;
    const x = camX + side;
    const y = camY + random(-200, height + 200);

    const angle = side < 0 ? random(-0.25, 0.15) : random(PI - 0.15, PI + 0.25);
    const spd = random(4, 7);

    this.comets.push({
      x,
      y,
      vx: cos(angle) * spd,
      vy: sin(angle) * spd,
      life: 0,
      maxLife: int(random(120, 220)),
    });
  }

  _drawShooters(camX, camY) {
    push();
    strokeWeight(2);

    for (const s of this.shooters) {
      const a = map(s.life, 0, s.maxLife, 220, 0);
      stroke(255, a);

      const x1 = s.x - camX;
      const y1 = s.y - camY;
      const x2 = x1 - s.vx * 1.5;
      const y2 = y1 - s.vy * 1.5;

      line(x1, y1, x2, y2);
    }

    pop();
  }

  _drawComets(camX, camY) {
    push();
    strokeWeight(3);

    for (const c of this.comets) {
      const a = map(c.life, 0, c.maxLife, 180, 0);
      stroke(220, 240, 255, a);

      const x1 = c.x - camX;
      const y1 = c.y - camY;
      const x2 = x1 - c.vx * 14;
      const y2 = y1 - c.vy * 14;

      line(x1, y1, x2, y2);
    }

    pop();
  }

  // =============================
  // NEBULA
  // =============================
  _makeNebula() {
    const blobs = [];
    for (let i = 0; i < 6; i++) {
      blobs.push({
        x: random(0.2, 0.8) * this.level.w,
        y: random(0.2, 0.8) * this.level.h,
        r: random(220, 520),
        phase: random(TWO_PI),
      });
    }
    return blobs;
  }

  _drawNebula(camX, camY) {
    push();
    noStroke();

    for (const b of this.nebula) {
      const sx = b.x - camX * 0.08;
      const sy = b.y - camY * 0.08;

      const wob = sin(frameCount * 0.01 + b.phase) * 0.08;

      for (let k = 0; k < 6; k++) {
        const rr = b.r * (1 - k * 0.12) * (1 + wob);
        fill(40, 80, 140, 12);
        circle(sx + k * 6, sy - k * 4, rr);
      }
    }

    pop();
  }

  // =============================
  // VIGNETTE
  // =============================
  _renderVignette() {
    this.vig.clear();
    this.vig.noStroke();

    for (let i = 0; i < 120; i++) {
      const t = i / 120;
      const a = lerp(0, 190, t);
      this.vig.fill(0, a);
      const w = lerp(min(width, height) * 0.6, max(width, height) * 1.8, t);
      this.vig.ellipse(width / 2, height / 2, w, w);
    }
  }
}