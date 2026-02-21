class UI {
  constructor() {
    this.messages = [];
    this.maxMessages = 3;
    this.defaultDuration = 220; // frames (~3.6 seconds at 60fps)
  }

  clear() {
    this.messages = [];
  }

  show(text, durationFrames = this.defaultDuration) {
    const msg = {
      text: text,
      t: 0,
      duration: durationFrames,
    };

    this.messages.push(msg);

    // Keep only most recent messages
    while (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }
  }

  update() {
    for (const m of this.messages) {
      m.t++;
    }

    // Remove expired messages
    this.messages = this.messages.filter((m) => m.t < m.duration);
  }

  draw() {
    if (this.messages.length === 0) return;

    push();
    textAlign(LEFT, TOP);
    textSize(14);

    const pad = 14;
    const boxW = min(520, width - pad * 2);
    const lineH = 20;
    const boxH = pad * 2 + this.messages.length * lineH;

    const x = pad;
    const y = height - boxH - pad;

    // Background box
    noStroke();
    fill(0, 170);
    rect(x, y, boxW, boxH, 12);

    // Text
    let ty = y + pad;
    for (const m of this.messages) {
      const a = this._alphaFor(m.t, m.duration);
      fill(255, a);
      text(m.text, x + pad, ty, boxW - pad * 2);
      ty += lineH;
    }

    pop();
  }

  _alphaFor(t, dur) {
    const fade = 18;

    if (t < fade) {
      return map(t, 0, fade, 0, 255);
    }

    if (t > dur - fade) {
      return map(t, dur - fade, dur, 255, 0);
    }

    return 255;
  }
}