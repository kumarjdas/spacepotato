class Enemy {
  constructor(x, y, type = 'basic', level = 1) {
    // Position and physics
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    
    // Enemy type and properties
    this.type = type;
    this.level = level;
    this.setPropertiesByType(type, level);
    
    // Animation
    this.animationOffset = random(TWO_PI);
    this.animationSpeed = random(0.03, 0.08);
    this.rotation = 0;
    this.pulseSize = 0;
    
    // Enemy behavior
    this.behaviorTimer = 0;
    this.behaviorDuration = floor(random(60, 120));
    this.targetX = random(width * 0.2, width * 0.8);
    this.targetY = random(height * 0.2, height * 0.6);
    
    // Shooting (for shooter type)
    this.shootCooldown = 0;
    this.shootCooldownMax = floor(random(90, 120) / this.level);  // Faster shooting at higher levels
  }
  
  setPropertiesByType(type, level) {
    // Base stats that get modified by type
    let baseSize = 35;
    let baseSpeed = 2;
    let baseColor = color(150, 0, 0);
    let scoreValue = 100;
    
    // Apply level scaling (except health which is handled per type)
    baseSpeed = baseSpeed * (1 + (level - 1) * 0.1);
    scoreValue = scoreValue * level;
    
    // Set properties based on type
    switch(type) {
      case 'basic':
        // Default enemy - moderate stats, moves in patterns
        this.health = 1; // Always just 1 health (easy to kill)
        this.size = baseSize;
        this.maxSpeed = baseSpeed;
        this.color = color(200, 50, 50);
        this.scoreValue = scoreValue;
        this.hitboxSize = this.size * 1.0;
        break;
      
      case 'shooter':
        // Ranged enemy - 2 health, shoots projectiles
        this.health = 2; // Always 2 health as requested
        this.size = baseSize * 0.9;
        this.maxSpeed = baseSpeed * 0.8;
        this.color = color(50, 100, 200);
        this.scoreValue = scoreValue * 1.5;
        this.hitboxSize = this.size * 1.0;
        this.canShoot = true;
        break;
      
      case 'bomber':
        // Tanky enemy - more health, slower, worth more points
        this.health = 3; // Always 3 health (tanky)
        this.size = baseSize * 1.3;
        this.maxSpeed = baseSpeed * 0.6;
        this.color = color(100, 50, 150);
        this.scoreValue = scoreValue * 2;
        this.hitboxSize = this.size * 1.0;
        break;
      
      case 'zigzag':
        // Fast, erratic enemy - hard to hit but only 1 health
        this.health = 1; // Always 1 health (fragile but fast)
        this.size = baseSize * 0.7;
        this.maxSpeed = baseSpeed * 1.5;
        this.color = color(50, 200, 100);
        this.scoreValue = scoreValue * 1.2;
        this.hitboxSize = this.size * 1.0;
        break;
    }
    
    console.log(`Created ${type} enemy with hitboxSize: ${this.hitboxSize}, health: ${this.health}`);
  }
  
  update() {
    // Update behavior timer
    this.behaviorTimer++;
    if (this.behaviorTimer >= this.behaviorDuration) {
      this.changeBehavior();
      this.behaviorTimer = 0;
    }
    
    // Apply behavior based on type
    switch(this.type) {
      case 'basic':
        this.basicBehavior();
        break;
      case 'shooter':
        this.shooterBehavior();
        break;
      case 'bomber':
        this.bomberBehavior();
        break;
      case 'zigzag':
        this.zigzagBehavior();
        break;
    }
    
    // Apply physics
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
    
    // Update animation
    this.updateAnimation();
    
    // Update shooting cooldown for shooter type
    if (this.type === 'shooter' && this.shootCooldown > 0) {
      this.shootCooldown--;
    }
  }
  
  // Different movement patterns for each enemy type
  basicBehavior() {
    // Move towards target with slight sine wave pattern
    const direction = p5.Vector.sub(createVector(this.targetX, this.targetY), this.pos);
    direction.normalize();
    direction.mult(0.2);
    
    // Add slight sine wave to movement
    direction.x += sin(frameCount * 0.02 + this.animationOffset) * 0.05;
    
    this.acc.add(direction);
  }
  
  shooterBehavior() {
    // Move to position and stay at distance
    const toPlayer = p5.Vector.sub(game.player.pos, this.pos);
    const distToPlayer = toPlayer.mag();
    
    // Try to maintain distance from player
    const idealDistance = 250;
    if (distToPlayer < idealDistance * 0.8) {
      // Too close, back away
      toPlayer.normalize();
      toPlayer.mult(-0.2);
      this.acc.add(toPlayer);
    } else if (distToPlayer > idealDistance * 1.2) {
      // Too far, move closer
      toPlayer.normalize();
      toPlayer.mult(0.1);
      this.acc.add(toPlayer);
    } else {
      // At good distance, strafe side to side
      const strafeDir = createVector(-toPlayer.y, toPlayer.x);
      strafeDir.normalize();
      strafeDir.mult(sin(frameCount * 0.03 + this.animationOffset) * 0.2);
      this.acc.add(strafeDir);
    }
    
    // Shoot at player if cooldown is ready
    if (this.shootCooldown <= 0 && distToPlayer < 400) {
      this.shoot(toPlayer);
      this.shootCooldown = this.shootCooldownMax;
    }
  }
  
  bomberBehavior() {
    // Move directly towards player with increasing speed
    const toPlayer = p5.Vector.sub(game.player.pos, this.pos);
    toPlayer.normalize();
    
    // Gradually increase acceleration as they get closer
    const distToPlayer = dist(this.pos.x, this.pos.y, game.player.pos.x, game.player.pos.y);
    const accelerationMultiplier = map(distToPlayer, 0, 400, 0.3, 0.05);
    toPlayer.mult(accelerationMultiplier);
    
    this.acc.add(toPlayer);
    
    // Add slight wobble
    this.acc.x += sin(frameCount * 0.1 + this.animationOffset) * 0.02;
    this.acc.y += cos(frameCount * 0.1 + this.animationOffset) * 0.02;
  }
  
  zigzagBehavior() {
    // Erratic zigzag pattern toward player
    const toPlayer = p5.Vector.sub(game.player.pos, this.pos);
    toPlayer.normalize();
    toPlayer.mult(0.15);
    
    // Add strong zigzag movement
    const zigzagAmount = 0.5;
    toPlayer.x += sin(frameCount * 0.1 + this.animationOffset) * zigzagAmount;
    toPlayer.y += cos(frameCount * 0.08 + this.animationOffset) * zigzagAmount;
    
    this.acc.add(toPlayer);
  }
  
  changeBehavior() {
    // Set new behavior pattern
    this.behaviorDuration = floor(random(60, 120));
    
    // Set new target position based on type
    switch(this.type) {
      case 'basic':
        this.targetX = random(width * 0.1, width * 0.9);
        this.targetY = random(height * 0.1, height * 0.7);
        break;
      case 'shooter':
        // Shooters prefer to stay at mid range
        this.targetX = random(width * 0.2, width * 0.8);
        this.targetY = random(height * 0.2, height * 0.5);
        break;
      case 'bomber':
        // Bombers aim directly for player
        this.targetX = game.player.pos.x;
        this.targetY = game.player.pos.y;
        break;
      case 'zigzag':
        // Zigzags move erratically around the player
        this.targetX = game.player.pos.x + random(-200, 200);
        this.targetY = game.player.pos.y + random(-200, 200);
        break;
    }
  }
  
  shoot(direction) {
    // Normalize direction and set velocity
    direction.normalize();
    direction.mult(5); // Projectile speed
    
    // Create enemy projectile with appropriate color
    const enemyProjectile = new EnemyProjectile(
      this.pos.x, this.pos.y,
      direction.x, direction.y,
      this.color
    );
    
    // Add to game's enemy projectiles array
    if (!game.enemyProjectiles) {
      game.enemyProjectiles = [];
    }
    game.enemyProjectiles.push(enemyProjectile);
    
    // Create small muzzle flash
    game.createExplosion(this.pos.x, this.pos.y, 3, 5, this.color);
  }
  
  updateAnimation() {
    // Update rotation
    this.rotation = frameCount * 0.01 * (this.type === 'zigzag' ? 3 : 1);
    
    // Update pulse
    this.pulseSize = sin(frameCount * this.animationSpeed + this.animationOffset) * 0.1;
  }
  
  display() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.rotation);
    
    // Draw based on enemy type
    switch(this.type) {
      case 'basic':
        this.drawBasicEnemy();
        break;
      case 'shooter':
        this.drawShooterEnemy();
        break;
      case 'bomber':
        this.drawBomberEnemy();
        break;
      case 'zigzag':
        this.drawZigzagEnemy();
        break;
    }
    
    pop();
  }
  
  drawBasicEnemy() {
    // Main body
    fill(this.color);
    noStroke();
    const currentSize = this.size * (1 + this.pulseSize);
    ellipse(0, 0, currentSize);
    
    // Enemy features
    fill(255, 100);
    ellipse(0, 0, currentSize * 0.7);
    
    // Eyes
    fill(255);
    const eyeOffset = currentSize * 0.2;
    ellipse(-eyeOffset, -eyeOffset, currentSize * 0.25);
    ellipse(eyeOffset, -eyeOffset, currentSize * 0.25);
    
    // Angry pupils
    fill(0);
    ellipse(-eyeOffset, -eyeOffset, currentSize * 0.1);
    ellipse(eyeOffset, -eyeOffset, currentSize * 0.1);
    
    // Angry mouth
    stroke(0);
    strokeWeight(2);
    noFill();
    arc(0, eyeOffset, currentSize * 0.4, currentSize * 0.2, PI, TWO_PI);
  }
  
  drawShooterEnemy() {
    // Triangle-shaped enemy with cannon
    const currentSize = this.size * (1 + this.pulseSize);
    
    // Main body
    fill(this.color);
    noStroke();
    triangle(
      -currentSize/2, currentSize/2,
      currentSize/2, currentSize/2,
      0, -currentSize/2
    );
    
    // Cannon/shooter part
    fill(this.color.levels[0] * 0.7, this.color.levels[1] * 0.7, this.color.levels[2] * 0.7);
    rect(-currentSize * 0.15, 0, currentSize * 0.3, currentSize * 0.6);
    
    // Eyes
    fill(255);
    const eyeOffset = currentSize * 0.15;
    ellipse(-eyeOffset, -eyeOffset*0.5, currentSize * 0.15);
    ellipse(eyeOffset, -eyeOffset*0.5, currentSize * 0.15);
    
    // Pupils
    fill(0);
    ellipse(-eyeOffset, -eyeOffset*0.5, currentSize * 0.07);
    ellipse(eyeOffset, -eyeOffset*0.5, currentSize * 0.07);
    
    // Glow effect when about to shoot
    if (this.shootCooldown < 15 && this.shootCooldown > 0) {
      fill(255, 200, 0, map(this.shootCooldown, 15, 0, 0, 150));
      ellipse(0, currentSize * 0.6, currentSize * 0.2, currentSize * 0.1);
    }
  }
  
  drawBomberEnemy() {
    // Larger, chunky enemy
    const currentSize = this.size * (1 + this.pulseSize);
    
    // Main body
    fill(this.color);
    noStroke();
    
    // Simple wobbling shape
    push();
    beginShape();
    // Use simple polygon approach
    for (let angle = 0; angle < TWO_PI; angle += PI/4) {
      // Add some wobble with sine
      const wobble = sin(frameCount * 0.05 + angle * 2) * 4;
      const radius = currentSize/2 + wobble;
      const x = cos(angle) * radius;
      const y = sin(angle) * radius;
      vertex(x, y);
    }
    endShape(CLOSE);
    pop();
    
    // Inner body detail
    fill(this.color.levels[0] * 1.2, this.color.levels[1] * 1.2, this.color.levels[2] * 1.2);
    ellipse(0, 0, currentSize * 0.7);
    
    // Glowing core
    fill(255, 150, 0, 150 + sin(frameCount * 0.1) * 50);
    ellipse(0, 0, currentSize * 0.4 + sin(frameCount * 0.2) * 5);
    
    // Eyes
    fill(255);
    const eyeOffset = currentSize * 0.15;
    ellipse(-eyeOffset, -eyeOffset, currentSize * 0.2);
    ellipse(eyeOffset, -eyeOffset, currentSize * 0.2);
    
    // Angry pupils
    fill(255, 0, 0);
    ellipse(-eyeOffset, -eyeOffset, currentSize * 0.1);
    ellipse(eyeOffset, -eyeOffset, currentSize * 0.1);
  }
  
  drawZigzagEnemy() {
    // Small, fast-moving zigzagging enemy
    const currentSize = this.size * (1 + this.pulseSize);
    
    // Dynamic rotation based on movement
    rotate(this.vel.heading());
    
    // Main body (pointy)
    fill(this.color);
    noStroke();
    beginShape();
    vertex(currentSize * 0.6, 0); // Front tip
    vertex(-currentSize * 0.3, currentSize * 0.4); // Bottom-right
    vertex(-currentSize * 0.5, 0); // Back
    vertex(-currentSize * 0.3, -currentSize * 0.4); // Top-right
    endShape(CLOSE);
    
    // Trailing effect
    for (let i = 1; i <= 3; i++) {
      const alpha = map(i, 1, 3, 150, 0);
      const offset = i * 10;
      fill(this.color.levels[0], this.color.levels[1], this.color.levels[2], alpha);
      
      beginShape();
      vertex(-currentSize * 0.3 - offset, currentSize * 0.25);
      vertex(-currentSize * 0.5 - offset, 0);
      vertex(-currentSize * 0.3 - offset, -currentSize * 0.25);
      endShape(CLOSE);
    }
    
    // Eye
    fill(255);
    ellipse(currentSize * 0.2, 0, currentSize * 0.25);
    
    // Pupil
    fill(0);
    ellipse(currentSize * 0.25, 0, currentSize * 0.12);
  }
  
  isOffscreen() {
    const buffer = this.size * 2;
    return (
      this.pos.x < -buffer || 
      this.pos.x > width + buffer ||
      this.pos.y < -buffer || 
      this.pos.y > height + buffer
    );
  }
  
  // Collision detection
  collidesWith(entity) {
    const distance = dist(this.pos.x, this.pos.y, entity.pos.x, entity.pos.y);
    const combinedRadius = this.hitboxSize / 2 + entity.hitboxSize / 2;
    return distance < combinedRadius;
  }
}

// Special class for enemy projectiles (different behavior than player projectiles)
class EnemyProjectile extends Enemy {
  constructor(x, y, vx, vy, enemyColor) {
    super(x, y, 'basic', 1);
    
    // Override properties
    this.vel = createVector(vx, vy);
    this.size = 10;
    this.hitboxSize = 8;
    this.health = 1;
    this.damage = 1;
    this.color = enemyColor || color(200, 50, 50);
    this.scoreValue = 0; // No points for destroying these
  }
  
  update() {
    // Simple straight movement
    this.pos.add(this.vel);
    
    // Rotation for visual effect
    this.rotation += 0.2;
  }
  
  display() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.rotation);
    
    // Draw enemy projectile
    fill(this.color);
    noStroke();
    ellipse(0, 0, this.size);
    
    // Draw glow effect
    fill(255, 100);
    ellipse(0, 0, this.size * 0.6);
    
    pop();
  }
} 