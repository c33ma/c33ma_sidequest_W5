class Entities {
  constructor(level, ui, worldData) {
    this.level = level;
    this.ui = ui;
    this.worldData = worldData ?? {};

    this.baseSpeed = null;

    this.planets = this._loadOrMakePlanets();
    this.satellite = this._makeSatellite();
    this.astronaut = this._makeAstronaut();
    this.blackHole = this._makeBlackHole();

    this.cooldowns = new Map();
    this.landed = new Set();
    this.constellationDone = false;

    this.dwellPlanetId = null;
    this.dwellFrames = 0;
  }

  reset() {
    this.cooldowns.clear();
    this.landed.clear();
    this.constellationDone = false;
    this.dwellPlanetId = null;
    this.dwellFrames = 0;
  }

  update(player, moveMag) {
    this._tickCooldowns();

    // Satellite discovery
    if (this._within(player, this.satellite, this.satellite.radius)) {
      this._sayOnce("satellite", "Someone else was here.");
    }

    // Astronaut discovery
    if (this._within(player, this.astronaut, this.astronaut.radius)) {
      this._sayOnce("astronaut", "A tiny astronaut drifts in silence.");
    }

    let closest = null;
    let closestD = Infinity;

    for (const p of this.planets) {
      const d = dist(player.x, player.y, p.x, p.y);

      if (d < closestD) {
        closestD = d;
        closest = p;
      }

      if (d < p.discoverRadius) {
        this._sayOnce(`planet-${p.id}`, p.discoveryText);
      }
    }

    // Auto landing when hovering still
    if (closest && closestD < closest.landRadius) {
      if (this.dwellPlanetId === closest.id) {
        this.dwellFrames++;
      } else {
        this.dwellPlanetId = closest.id;
        this.dwellFrames = 0;
      }

      if (this.dwellFrames > 60 && moveMag < 0.12) {
        this._landOnPlanet(closest);
      }
    } else {
      this.dwellPlanetId = null;
      this.dwellFrames = 0;
    }

    this._checkConstellation();
  }

  draw() {
    push();

    for (const p of this.planets) this._drawPlanet(p);
    this._drawSatellite(this.satellite);
    this._drawAstronaut(this.astronaut);
    this._drawBlackHole(this.blackHole);

    pop();
  }

  interact(player) {
    const nearest = this._nearestPlanet(player);
    if (!nearest) return;

    const d = dist(player.x, player.y, nearest.x, nearest.y);

    if (d < nearest.landRadius) {
      this._landOnPlanet(nearest);
    } else if (d < nearest.landRadius + 80) {
      this.ui.show("Too far to land. Drift closer.");
    }
  }

  applySpeedEffects(player) {
    if (this.baseSpeed == null && typeof player.s === "number") {
      this.baseSpeed = player.s;
    }

    if (typeof player.s !== "number" || this.baseSpeed == null) return;

    let mult = 1.0;

    const dBH = dist(player.x, player.y, this.blackHole.x, this.blackHole.y);

    if (dBH < this.blackHole.influenceRadius) {
      const t = map(
        dBH,
        this.blackHole.influenceRadius,
        this.blackHole.coreRadius,
        0.0,
        1.0
      );

      const slow = lerp(0.85, 0.3, constrain(t, 0, 1));
      mult *= slow;

      if (dBH < this.blackHole.coreRadius) {
        this._sayOnce("blackhole", "Not everything needs to be explored.");
      }
    }

    const near = this._nearestPlanet(player);
    if (near) {
      const dp = dist(player.x, player.y, near.x, near.y);
      if (dp < near.landRadius) mult *= 0.6;
    }

    player.s = this.baseSpeed * mult;
  }

  getWarpStrength(player) {
    const dBH = dist(player.x, player.y, this.blackHole.x, this.blackHole.y);
    if (dBH > this.blackHole.influenceRadius) return 0;

    const t = map(
      dBH,
      this.blackHole.influenceRadius,
      this.blackHole.coreRadius,
      0,
      1
    );

    return constrain(t, 0, 1);
  }

  // =============================
  // INTERNAL HELPERS
  // =============================

  _landOnPlanet(p) {
    if (!this.landed.has(p.id)) {
      this.landed.add(p.id);
      this.ui.show(`Landed on ${p.name}.`);
      this.ui.show(p.landingText);
    }
  }

  _checkConstellation() {
    if (this.constellationDone) return;

    const keyIds = this.planets.slice(0, 3).map((p) => p.id);
    const allVisited = keyIds.every((id) => this.landed.has(id));

    if (allVisited) {
      this.constellationDone = true;
      this.ui.show("You were never drifting alone.");
    }
  }

  _nearestPlanet(player) {
    let best = null;
    let bestD = Infinity;

    for (const p of this.planets) {
      const d = dist(player.x, player.y, p.x, p.y);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }

    return best;
  }

  _sayOnce(key, text) {
    if (this.cooldowns.has(key)) return;
    this.ui.show(text);
    this.cooldowns.set(key, 180);
  }

  _tickCooldowns() {
    for (const [k, v] of this.cooldowns.entries()) {
      const nv = v - 1;
      if (nv <= 0) this.cooldowns.delete(k);
      else this.cooldowns.set(k, nv);
    }
  }

  _within(player, obj, r) {
    return dist(player.x, player.y, obj.x, obj.y) < r;
  }

  // =============================
  // SPAWN DATA
  // =============================

  _loadOrMakePlanets() {
    const fromJson = this.worldData.planets;
    if (Array.isArray(fromJson) && fromJson.length > 0) {
      return fromJson.map((p, i) => this._planetFromType(p, i));
    }

    return [];
  }

  _planetFromType(p, i) {
    const base = {
      id: p.id ?? `p${i + 1}`,
      x: p.x,
      y: p.y,
      r: p.r ?? 70,
      landRadius: 120,
      discoverRadius: 170,
      type: p.type ?? "desert",
      name: p.name ?? "Unknown Planet",
    };

    if (base.type === "desert") {
      return {
        ...base,
        discoveryText: "A buried artifact hums faintly.",
        landingText: "“We built before we understood.”",
      };
    }

    if (base.type === "bio") {
      return {
        ...base,
        discoveryText: "A tiny alien watches from glowing plants.",
        landingText: "Alien: “We don’t measure time here.”",
      };
    }

    if (base.type === "ice") {
      return {
        ...base,
        discoveryText: "Light flickers under cracked ice.",
        landingText: "“Some things survive quietly.”",
      };
    }

    if (base.type === "garden") {
      return {
        ...base,
        discoveryText: "Soft life drifts between floating leaves.",
        landingText: "“You are not as small as you think.”",
      };
    }

    return {
      ...base,
      discoveryText: "Something glints in the quiet.",
      landingText: "The surface feels unfamiliar.",
    };
  }

  _makeSatellite() {
    return {
      x: 0.42 * this.level.w,
      y: 0.72 * this.level.h,
      radius: 95,
      rot: random(TWO_PI),
    };
  }

  _makeAstronaut() {
    return {
      x: 0.15 * this.level.w,
      y: 0.6 * this.level.h,
      radius: 70,
      bob: random(TWO_PI),
    };
  }

  _makeBlackHole() {
    return {
      x: 0.88 * this.level.w,
      y: 0.78 * this.level.h,
      coreRadius: 95,
      influenceRadius: 240,
    };
  }

  // =============================
  // DRAWING
  // =============================

  _drawPlanet(p) {
    push();
    translate(p.x, p.y);

    noStroke();

    if (p.type === "desert") fill(215, 190, 140);
    else if (p.type === "bio") fill(170, 120, 210);
    else if (p.type === "ice") fill(140, 190, 230);
    else if (p.type === "garden") fill(120, 210, 160);
    else fill(200);

    circle(0, 0, p.r * 2);

    fill(255, 40);
    circle(-p.r * 0.25, -p.r * 0.25, p.r * 1.1);

    noFill();
    stroke(255, 40);
    circle(0, 0, p.landRadius * 2);

    pop();
  }

  _drawSatellite(s) {
    push();
    translate(s.x, s.y);

    s.rot += 0.01;
    rotate(s.rot);

    stroke(220, 220, 240, 160);
    strokeWeight(2);
    noFill();

    rectMode(CENTER);
    rect(0, 0, 36, 18, 4);

    line(-18, 0, -44, 0);
    line(18, 0, 44, 0);

    rect(-58, 0, 28, 14, 3);
    rect(58, 0, 28, 14, 3);

    noStroke();
    fill(255, 80 + 40 * sin(frameCount * 0.12));
    circle(0, -12, 5);

    noFill();
    stroke(255, 15);
    circle(0, 0, s.radius * 2);

    pop();
  }

  _drawAstronaut(a) {
    push();
    translate(a.x, a.y);

    a.bob += 0.02;
    const by = sin(a.bob) * 6;

    noStroke();
    fill(240);
    circle(0, by, 14);

    fill(200);
    rectMode(CENTER);
    rect(0, by + 14, 10, 16, 3);

    stroke(255, 50);
    strokeWeight(2);
    line(0, by + 22, 20, by + 30);

    noFill();
    stroke(255, 15);
    circle(0, 0, a.radius * 2);

    pop();
  }

  _drawBlackHole(bh) {
    push();
    translate(bh.x, bh.y);

    noFill();
    stroke(255, 18);
    strokeWeight(2);
    circle(0, 0, bh.influenceRadius * 2);

    const t = frameCount * 0.03;

    stroke(160, 200, 255, 50);
    strokeWeight(3);

    for (let i = 0; i < 5; i++) {
      const r = bh.coreRadius + i * 18;
      const w = sin(t + i) * 12;
      ellipse(0, 0, r * 2 + w, r * 2 - w);
    }

    noStroke();
    fill(0);
    circle(0, 0, bh.coreRadius * 2);

    pop();
  }
}