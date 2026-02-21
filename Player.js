class Player {
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.s = speed ?? 3;

    this.angle = 0;      // ship rotation
    this.thrustAnim = 0; // for engine flame
  }

  updateInput() {
    const dx =
      (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) -
      (keyIsDown(LEFT_ARROW) || keyIsDown(65));

    const dy =
      (keyIsDown(DOWN_ARROW) || keyIsDown(83)) -
      (keyIsDown(UP_ARROW) || keyIsDown(87));

    const len = max(1, abs(dx) + abs(dy));

    const vx = (dx / len) * this.s;
    const vy = (dy / len) * this.s;

    this.x += vx;
    this.y += vy;

    // Rotate ship toward movement direction
    if (abs(vx) > 0.01 || abs(vy) > 0.01) {
      this.angle = atan2(vy, vx);
      this.thrustAnim = frameCount;
    }
  }

  draw() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);

    noStroke();

    // Ship body
    fill(220);
    beginShape();
    vertex(18, 0);   // nose
    vertex(-12, -10);
    vertex(-6, 0);
    vertex(-12, 10);
    endShape(CLOSE);

    // Cockpit
    fill(120, 200, 255);
    ellipse(-2, 0, 10, 8);

    // Engine flame (only when moving)
    if (frameCount - this.thrustAnim < 8) {
      fill(255, 140, 0, 180);
      triangle(-14, -5, -26, 0, -14, 5);

      fill(255, 220, 100, 200);
      triangle(-16, -3, -22, 0, -16, 3);
    }

    pop();
  }
}