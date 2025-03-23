class Particle {
  constructor(x, y, size = 5, particleColor) {
    // Position and physics
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(1, 3));
    this.acc = createVector(0, 0);
    
    // Visual properties
    this.size = random(size * 0.5, size);
    this.originalSize = this.size;
    this.color = particleColor || color(255, 150, 0);
    this.alpha = 255;
    this.fadeSpeed = random(3, 8);
    
    // Lifespan
    this.life = 100;
    this.decayRate = random(1.5, 3);
  }
  
  update() {
    // Add some random movement
    this.acc.add(createVector(random(-0.1, 0.1), random(-0.1, 0.1)));
    
    // Apply physics
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);
    
    // Add drag
    this.vel.mult(0.95);
    
    // Decay life and size
    this.life -= this.decayRate;
    this.size = map(this.life, 100, 0, this.originalSize, 0);
    this.alpha = map(this.life, 100, 0, 255, 0);
  }
  
  display() {
    // Skip rendering if life is too low
    if (this.life < 0) return;
    
    // Draw particle
    if (this.color) {
      // If a color was provided, use it with alpha
      const c = this.color;
      fill(c.levels[0], c.levels[1], c.levels[2], this.alpha);
    } else {
      // Otherwise use a default explosion color
      fill(255, constrain(this.life * 2, 0, 255), 0, this.alpha);
    }
    
    noStroke();
    
    // Choose a shape based on size and random factor
    if (this.originalSize > 8 && random() > 0.7) {
      // Larger particles sometimes draw as embers with glow
      this.drawEmber();
    } else {
      // Default to circle particles
      ellipse(this.pos.x, this.pos.y, this.size);
    }
  }
  
  drawEmber() {
    // Draw a glowing ember effect
    const halfSize = this.size / 2;
    
    // Inner bright core
    fill(255, 255, 200, this.alpha);
    ellipse(this.pos.x, this.pos.y, halfSize);
    
    // Outer glow
    fill(255, 150, 0, this.alpha * 0.5);
    ellipse(this.pos.x, this.pos.y, this.size);
    
    // Extra outer glow
    fill(255, 100, 0, this.alpha * 0.2);
    ellipse(this.pos.x, this.pos.y, this.size * 1.5);
  }
  
  isDead() {
    return this.life <= 0;
  }
}

// Special sparks that move in more controlled patterns
class Spark extends Particle {
  constructor(x, y, angle, speed, size, color) {
    super(x, y, size, color);
    
    // Override velocity with specified angle and speed
    this.vel = p5.Vector.fromAngle(angle).mult(speed);
    
    // Sparks have higher decay
    this.decayRate = random(2, 4);
    
    // Trailing effect
    this.hasTrail = true;
    this.trailLength = 5;
    this.history = [];
  }
  
  update() {
    // Store position history for trail
    if (this.hasTrail) {
      this.history.push(createVector(this.pos.x, this.pos.y));
      
      // Limit history length
      if (this.history.length > this.trailLength) {
        this.history.splice(0, 1);
      }
    }
    
    // Rest of update is same as parent
    super.update();
  }
  
  display() {
    // Draw trail first (if enabled)
    if (this.hasTrail && this.history.length > 1) {
      noFill();
      stroke(this.color.levels[0], this.color.levels[1], this.color.levels[2], this.alpha * 0.5);
      strokeWeight(this.size * 0.5);
      
      beginShape();
      for (let i = 0; i < this.history.length; i++) {
        vertex(this.history[i].x, this.history[i].y);
      }
      vertex(this.pos.x, this.pos.y);
      endShape();
    }
    
    // Draw the spark itself
    noStroke();
    fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], this.alpha);
    ellipse(this.pos.x, this.pos.y, this.size);
  }
} 