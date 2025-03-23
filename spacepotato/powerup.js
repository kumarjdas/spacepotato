class Powerup {
  constructor(x, y) {
    // Position and physics
    this.pos = createVector(x, y);
    this.vel = createVector(random(-1, 1), random(1, 2));
    this.acc = createVector(0, 0);
    this.size = 20;
    this.hitboxSize = this.size;
    
    // Choose a random powerup type
    this.types = ['tripleShot', 'shield', 'speedBoost', 'health', 'extraLife'];
    this.typeWeights = [0.25, 0.25, 0.25, 0.2, 0.05]; // Rarer for extra life
    this.type = this.getRandomType();
    
    // Animation properties
    this.rotation = random(TWO_PI);
    this.rotationSpeed = random(-0.05, 0.05);
    this.oscillationOffset = random(TWO_PI);
    this.oscillationSpeed = random(0.03, 0.07);
    this.pulseAmount = 0;
    
    // Glow effect
    this.glowSize = this.size * 1.5;
    this.glowOpacity = 150;
    
    // Hover particles timer
    this.particleTimer = 0;
  }
  
  getRandomType() {
    // Weighted random selection of powerup type
    const totalWeight = this.typeWeights.reduce((sum, w) => sum + w, 0);
    const normalizedWeights = this.typeWeights.map(w => w / totalWeight);
    
    const rand = random();
    let cumulativeWeight = 0;
    let selectedType = this.types[0];
    
    for (let i = 0; i < normalizedWeights.length; i++) {
      cumulativeWeight += normalizedWeights[i];
      if (rand < cumulativeWeight) {
        selectedType = this.types[i];
        break;
      }
    }
    
    return selectedType;
  }
  
  update() {
    // Apply gravity
    this.acc.y = 0.05;
    
    // Apply physics
    this.vel.add(this.acc);
    this.vel.limit(3);
    this.pos.add(this.vel);
    this.acc.mult(0);
    
    // Add some random horizontal movement
    this.vel.x += random(-0.1, 0.1);
    
    // Add drag
    this.vel.mult(0.98);
    
    // Update animation
    this.rotation += this.rotationSpeed;
    this.pulseAmount = sin(frameCount * this.oscillationSpeed + this.oscillationOffset) * 0.2;
    
    // Create hover particles
    this.particleTimer++;
    if (this.particleTimer > 10) {
      this.createHoverParticle();
      this.particleTimer = 0;
    }
  }
  
  createHoverParticle() {
    // Create a small particle that floats upward
    const offset = this.size / 2;
    const x = this.pos.x + random(-offset, offset);
    const y = this.pos.y + random(-offset, offset);
    const particleColor = this.getTypeColor(0.7); // Slightly transparent
    
    // Add a spark particle with upward motion
    game.particles.push(new Spark(
      x, y, 
      random(-0.5, 0.5) + PI * 1.5, // Mostly upward angle
      random(0.5, 1), // Slow speed
      random(2, 4), // Small size
      particleColor
    ));
  }
  
  display() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.rotation);
    
    // Draw glow effect
    this.drawGlow();
    
    // Draw the powerup based on type
    const currentSize = this.size * (1 + this.pulseAmount);
    this.drawPowerup(currentSize);
    
    pop();
  }
  
  drawGlow() {
    // Draw outer glow
    const glowColor = this.getTypeColor(this.glowOpacity / 255);
    fill(glowColor);
    noStroke();
    
    const currentGlowSize = this.glowSize * (1 + this.pulseAmount);
    ellipse(0, 0, currentGlowSize);
  }
  
  drawPowerup(size) {
    // Get base color for the powerup type
    const baseColor = this.getTypeColor();
    
    switch(this.type) {
      case 'tripleShot':
        this.drawTripleShotPowerup(size, baseColor);
        break;
      case 'shield':
        this.drawShieldPowerup(size, baseColor);
        break;
      case 'speedBoost':
        this.drawSpeedPowerup(size, baseColor);
        break;
      case 'health':
        this.drawHealthPowerup(size, baseColor);
        break;
      case 'extraLife':
        this.drawExtraLifePowerup(size, baseColor);
        break;
    }
  }
  
  getTypeColor(alpha = 1) {
    // Return appropriate color based on powerup type
    switch(this.type) {
      case 'tripleShot':
        return color(255, 150, 0, 255 * alpha); // Orange
      case 'shield':
        return color(100, 150, 255, 255 * alpha); // Blue
      case 'speedBoost':
        return color(0, 255, 150, 255 * alpha); // Green
      case 'health':
        return color(255, 100, 100, 255 * alpha); // Red
      case 'extraLife':
        return color(255, 50, 200, 255 * alpha); // Pink
      default:
        return color(255, 255, 255, 255 * alpha); // White
    }
  }
  
  drawTripleShotPowerup(size, baseColor) {
    // Base circle
    fill(baseColor);
    ellipse(0, 0, size);
    
    // Three lines representing triple shot
    stroke(255);
    strokeWeight(2);
    
    // Center line
    line(0, -size/3, 0, size/3);
    
    // Left line
    push();
    rotate(-PI/6);
    line(0, -size/3, 0, size/3);
    pop();
    
    // Right line
    push();
    rotate(PI/6);
    line(0, -size/3, 0, size/3);
    pop();
  }
  
  drawShieldPowerup(size, baseColor) {
    // Base circle
    fill(baseColor);
    ellipse(0, 0, size);
    
    // Shield icon
    noFill();
    stroke(255);
    strokeWeight(2);
    arc(0, 0, size * 0.7, size * 0.7, PI, TWO_PI);
    
    // Shield handle
    line(-size/6, 0, size/6, 0);
  }
  
  drawSpeedPowerup(size, baseColor) {
    // Base circle
    fill(baseColor);
    ellipse(0, 0, size);
    
    // Lightning bolt for speed
    fill(255);
    noStroke();
    beginShape();
    vertex(-size/6, -size/3);
    vertex(0, -size/8);
    vertex(-size/10, size/8);
    vertex(size/6, size/3);
    vertex(0, -size/8);
    vertex(size/10, -size/5);
    endShape(CLOSE);
  }
  
  drawHealthPowerup(size, baseColor) {
    // Base circle
    fill(baseColor);
    ellipse(0, 0, size);
    
    // Plus sign for health
    fill(255);
    noStroke();
    rect(-size/4, -size/12, size/2, size/6, 2);
    rect(-size/12, -size/4, size/6, size/2, 2);
  }
  
  drawExtraLifePowerup(size, baseColor) {
    // Base circle
    fill(baseColor);
    ellipse(0, 0, size);
    
    // Heart symbol
    fill(255);
    noStroke();
    
    // Draw a heart using bezier curves
    beginShape();
    vertex(0, size/6);
    bezierVertex(size/4, -size/4, size/2, 0, 0, size/3);
    bezierVertex(-size/2, 0, -size/4, -size/4, 0, size/6);
    endShape();
  }
  
  isOffscreen() {
    return (
      this.pos.x < -this.size || 
      this.pos.x > width + this.size ||
      this.pos.y < -this.size || 
      this.pos.y > height + this.size
    );
  }
  
  collidesWith(entity) {
    const distance = dist(this.pos.x, this.pos.y, entity.pos.x, entity.pos.y);
    const combinedRadius = this.hitboxSize / 2 + entity.hitboxSize / 2;
    return distance < combinedRadius;
  }
} 