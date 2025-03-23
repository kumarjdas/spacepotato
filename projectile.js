class Projectile {
  constructor(x, y, vx = 0, vy = -10) {
    // Position and physics
    this.pos = createVector(x, y);
    this.vel = createVector(vx, vy);
    this.size = 15;
    this.hitboxSize = this.size * 0.8; // More accurate hitbox size
    this.damage = 1;
    
    console.log(`Created projectile at (${x},${y}) with hitboxSize: ${this.hitboxSize}`);
    
    // Visual properties
    this.rotation = random(TWO_PI); // Random initial rotation
    this.rotationSpeed = random(-0.1, 0.1); // Random rotation speed
    this.length = this.size * random(1.5, 2.0); // Vary the length a bit
    this.width = this.size * random(0.3, 0.5); // Vary the width a bit
    
    // Color variations
    this.baseColor = color(255, 220, 100); // Base french fry color
    this.tipColor = color(200, 150, 50); // Darker tip
    this.colorVariation = random(0.8, 1.2); // Random color variation
  }
  
  update() {
    // Update position
    this.pos.add(this.vel);
    
    // Update rotation
    this.rotation += this.rotationSpeed;
  }
  
  display() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.rotation);
    
    // Draw french fry projectile
    this.drawFrenchFry();
    
    // Draw trail effect
    this.drawTrail();
    
    pop();
  }
  
  drawFrenchFry() {
    // No stroke for the fry
    noStroke();
    
    // Main body of the fry (slightly curved rectangle)
    fill(this.baseColor);
    beginShape();
    vertex(-this.width/2, -this.length/2);
    vertex(this.width/2, -this.length/2);
    vertex(this.width/2 + sin(frameCount * 0.1) * 2, this.length/2);
    vertex(-this.width/2 + sin(frameCount * 0.1) * 2, this.length/2);
    endShape(CLOSE);
    
    // Darker tip (fried part)
    fill(this.tipColor);
    beginShape();
    vertex(-this.width/2, -this.length/2);
    vertex(this.width/2, -this.length/2);
    vertex(this.width/2, -this.length/2 + this.length * 0.3);
    vertex(-this.width/2, -this.length/2 + this.length * 0.3);
    endShape(CLOSE);
    
    // Highlights on the fry
    fill(255, 255, 200, 100);
    rect(-this.width/4, -this.length/2 + this.length * 0.4, this.width/10, this.length * 0.5);
  }
  
  drawTrail() {
    // Draw a motion trail behind the projectile
    for (let i = 1; i <= 5; i++) {
      const trailSize = map(i, 1, 5, this.width * 0.8, this.width * 0.2);
      const alpha = map(i, 1, 5, 100, 0);
      const distance = i * 3;
      
      // Calculate trail position opposite to velocity
      const trailX = -this.vel.x * distance * 0.15;
      const trailY = -this.vel.y * distance * 0.15;
      
      // Draw trail particle
      fill(255, 220, 100, alpha);
      noStroke();
      ellipse(trailX, trailY, trailSize);
    }
  }
  
  isOffscreen() {
    // Check if projectile is off the screen
    return (
      this.pos.x < -this.size || 
      this.pos.x > width + this.size ||
      this.pos.y < -this.size || 
      this.pos.y > height + this.size
    );
  }
  
  // Collision detection
  collidesWith(entity) {
    if (!entity || !entity.hitboxSize) {
      console.warn('Warning: Entity missing hitboxSize property in collision check');
      return false;
    }
    
    // Simple circle-based collision detection
    const distance = dist(this.pos.x, this.pos.y, entity.pos.x, entity.pos.y);
    const combinedRadius = this.hitboxSize / 2 + entity.hitboxSize / 2;
    
    return distance < combinedRadius;
  }
} 