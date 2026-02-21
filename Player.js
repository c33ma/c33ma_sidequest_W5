class Player {
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;

    // movement speed
    this.s = speed ?? 3;
  }

  updateInput() {
    const dx =
      (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) -
      (keyIsDown(LEFT_ARROW) || keyIsDown(65));

    const dy =
      (keyIsDown(DOWN_ARROW) || keyIsDown(83)) -
      (keyIsDown(UP_ARROW) || keyIsDown(87));

    // Smooth diagonal movement (more "space drift" feel)
    const len = sqrt(dx * dx + dy * dy) || 1;

    this.x += (dx / len) * this.s;
    this.y += (dy / len) * this.s;
  }

  draw() {
    fill(50, 110, 255);
    noStroke();
    rect(this.x - 12, this.y - 12, 24, 24, 5);
  }
}