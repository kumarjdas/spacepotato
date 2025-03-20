class Player {
  constructor() {
    // Position and physics
    this.pos = createVector(width / 2, height - 100);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.maxSpeed = 5;
    this.size = 40;
    this.hitboxSize = this.size * 0.8; // Smaller hitbox than visual size
    
    // Movement flags
    this.isMovingLeft = false;
    this.isMovingRight = false;
    this.isMovingUp = false;
    this.isMovingDown = false;
    
    // Game mechanics
    this.health = 5;
    this.maxHealth = 5;
    this.lives = 3;
    this.shootCooldown = 0;
    this.shootCooldownMax = 15; // frames between shots
    this.isInvulnerable = false;
    this.invulnerabilityTimer = 0;
    this.invulnerabilityDuration = 90; // 1.5 seconds at 60fps
    
    // Powerups
    this.activePowerups = {
      tripleShot: false,
      shield: false,
      speedBoost: false
    };
    this.powerupTimers = {
      tripleShot: 0,
      shield: 0,
      speedBoost: 0
    };
    this.POWERUP_DURATION = 600; // 10 seconds at 60fps
    
    // Animation
    this.thrustAnimation = 0;
    this.angle = 0;
    this.targetAngle = 0;
  }
  
  update() {
    // Apply acceleration based on movement flags
    this.acc.set(0, 0);
    
    // Apply speed boost if active
    const currentMaxSpeed = this.activePowerups.speedBoost ? this.maxSpeed * 1.5 : this.maxSpeed;
    
    if (this.isMovingLeft) this.acc.x -= 0.5;
    if (this.isMovingRight) this.acc.x += 0.5;
    if (this.isMovingUp) this.acc.y -= 0.5;
    if (this.isMovingDown) this.acc.y += 0.5;
    
    // Apply physics
    this.vel.add(this.acc);
    this.vel.limit(currentMaxSpeed);
    this.pos.add(this.vel);
    
    // Add drag
    this.vel.mult(0.9);
    
    // Keep player on screen
    this.pos.x = constrain(this.pos.x, this.size / 2, width - this.size / 2);
    this.pos.y = constrain(this.pos.y, this.size / 2, height - this.size / 2);
    
    // Update shooting cooldown
    if (this.shootCooldown > 0) {
      this.shootCooldown--;
    }
    
    // Update invulnerability
    if (this.isInvulnerable) {
      this.invulnerabilityTimer--;
      if (this.invulnerabilityTimer <= 0) {
        this.isInvulnerable = false;
      }
    }
    
    // Calculate animation values
    this.thrustAnimation = (this.thrustAnimation + 0.2) % TWO_PI;
    
    // Calculate angle based on movement
    if (this.vel.mag() > 0.5) {
      this.targetAngle = this.vel.heading() + HALF_PI;
    }
    
    // Smooth angle transition
    const angleDiff = this.targetAngle - this.angle;
    if (abs(angleDiff) > 0.05) {
      this.angle += angleDiff * 0.1;
    }
    
    // Update powerups
    this.updatePowerups();
  }
  
  updatePowerups() {
    // Check each powerup and decrease timer
    for (const powerup in this.activePowerups) {
      if (this.activePowerups[powerup]) {
        this.powerupTimers[powerup]--;
        if (this.powerupTimers[powerup] <= 0) {
          this.activePowerups[powerup] = false;
        }
      }
    }
  }
  
  applyPowerup(type) {
    switch(type) {
      case 'tripleShot':
        this.activePowerups.tripleShot = true;
        this.powerupTimers.tripleShot = this.POWERUP_DURATION;
        break;
      case 'shield':
        this.activePowerups.shield = true;
        this.powerupTimers.shield = this.POWERUP_DURATION;
        break;
      case 'speedBoost':
        this.activePowerups.speedBoost = true;
        this.powerupTimers.speedBoost = this.POWERUP_DURATION;
        break;
      case 'health':
        this.health = min(this.maxHealth, this.health + 2);
        break;
      case 'extraLife':
        this.lives++;
        break;
    }
  }
  
  display() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.angle);
    
    // Draw thrusters
    this.drawThrusters();
    
    // Draw the potato body
    this.drawPotatoBody();
    
    // Draw shield if active
    if (this.activePowerups.shield) {
      this.drawShield();
    }
    
    // Flash when invulnerable
    if (this.isInvulnerable && frameCount % 4 < 2) {
      this.drawInvulnerabilityFlash();
    }
    
    pop();
  }
  
  drawPotatoBody() {
    // Main potato body
    fill(200, 150, 100); // Brown potato color
    noStroke();
    
    // Draw potato shape as a slightly irregular ellipse using beginShape
    beginShape();
    for (let angle = 0; angle < TWO_PI; angle += 0.1) {
      // Create an organic wobbling shape
      const wobble = sin(angle * 3 + frameCount * 0.01) * 0.1 + cos(angle * 2 - frameCount * 0.02) * 0.1;
      const r = this.size * (0.9 + wobble);
      const x = r * cos(angle);
      const y = r * sin(angle);
      vertex(x, y);
    }
    endShape(CLOSE);
    
    // Draw darker spots on the potato
    fill(150, 100, 50);
    noStroke();
    ellipse(-this.size * 0.3, this.size * 0.1, this.size * 0.2, this.size * 0.15);
    ellipse(this.size * 0.2, -this.size * 0.2, this.size * 0.15, this.size * 0.25);
    ellipse(this.size * 0.1, this.size * 0.3, this.size * 0.2, this.size * 0.1);
    
    // Eyes
    fill(255);
    ellipse(-this.size * 0.15, -this.size * 0.1, this.size * 0.2, this.size * 0.25);
    ellipse(this.size * 0.15, -this.size * 0.1, this.size * 0.2, this.size * 0.25);
    
    // Pupils
    fill(0);
    ellipse(-this.size * 0.15, -this.size * 0.1, this.size * 0.1, this.size * 0.12);
    ellipse(this.size * 0.15, -this.size * 0.1, this.size * 0.1, this.size * 0.12);
    
    // Mouth (determined by movement)
    stroke(0);
    strokeWeight(2);
    noFill();
    if (this.vel.mag() > 3) {
      // Surprised mouth when moving fast
      ellipse(0, this.size * 0.2, this.size * 0.2, this.size * 0.3);
    } else {
      // Regular smile
      arc(0, this.size * 0.15, this.size * 0.4, this.size * 0.2, 0, PI);
    }
  }
  
  drawThrusters() {
    // Draw thrusters with animation
    const thrustSize = this.size * 0.5;
    const thrustOffset = this.size * 0.6;
    
    // Main thruster flame
    if (this.vel.mag() > 0.5) {
      fill(255, 100, 50, 200); // Orange flame
      const flameSize = map(sin(this.thrustAnimation), -1, 1, thrustSize, thrustSize * 1.5);
      ellipse(0, thrustOffset, thrustSize, flameSize);
      
      fill(255, 200, 50, 150); // Yellow inner flame
      ellipse(0, thrustOffset, thrustSize * 0.6, flameSize * 0.7);
    }
    
    // Side thrusters (activate only when turning)
    if (abs(this.targetAngle - this.angle) > 0.1) {
      const sideFlameSize = map(sin(this.thrustAnimation + 0.5), -1, 1, thrustSize * 0.4, thrustSize * 0.7);
      
      // Left thruster
      if (this.isMovingLeft) {
        fill(255, 100, 50, 200);
        ellipse(this.size * 0.35, thrustOffset * 0.7, sideFlameSize, sideFlameSize * 0.8);
      }
      
      // Right thruster
      if (this.isMovingRight) {
        fill(255, 100, 50, 200);
        ellipse(-this.size * 0.35, thrustOffset * 0.7, sideFlameSize, sideFlameSize * 0.8);
      }
    }
  }
  
  drawShield() {
    // Draw shield effect
    noFill();
    stroke(100, 150, 255, 150 + sin(frameCount * 0.1) * 50);
    strokeWeight(3);
    ellipse(0, 0, this.size * 2 + sin(frameCount * 0.05) * 5);
    
    // Inner shield glow
    stroke(100, 150, 255, 50);
    strokeWeight(8);
    ellipse(0, 0, this.size * 2.2 + sin(frameCount * 0.05) * 5);
  }
  
  drawInvulnerabilityFlash() {
    // Flash effect when invulnerable
    fill(255, 255, 255, 100);
    noStroke();
    ellipse(0, 0, this.size * 2);
  }
  
  shoot() {
    if (this.shootCooldown <= 0) {
      // Reset cooldown
      this.shootCooldown = this.shootCooldownMax;
      
      if (this.activePowerups.tripleShot) {
        // Triple shot powerup active
        game.projectiles.push(new Projectile(this.pos.x, this.pos.y, 0, -10)); // Center
        game.projectiles.push(new Projectile(this.pos.x, this.pos.y, -2, -9)); // Left
        game.projectiles.push(new Projectile(this.pos.x, this.pos.y, 2, -9)); // Right
      } else {
        // Regular single shot
        game.projectiles.push(new Projectile(this.pos.x, this.pos.y, 0, -10));
      }
      
      // Create muzzle flash effect
      game.createExplosion(this.pos.x, this.pos.y - this.size/2, 5, 5, color(255, 200, 50));
    }
  }
  
  takeDamage(amount) {
    // If shield is active, don't take damage
    if (this.activePowerups.shield) {
      return;
    }
    
    // If already invulnerable, don't take damage
    if (this.isInvulnerable) {
      return;
    }
    
    // Apply damage
    this.health -= amount;
    
    // Check if health is depleted
    if (this.health <= 0) {
      this.loseLife();
    }
    
    // Make player invulnerable briefly
    this.isInvulnerable = true;
    this.invulnerabilityTimer = this.invulnerabilityDuration;
  }
  
  loseLife() {
    this.lives--;
    
    // Create big explosion
    game.createExplosion(this.pos.x, this.pos.y, 30, this.size, color(255, 200, 50));
    applyScreenShake(20, 30);
    
    // If still has lives, restore health
    if (this.lives > 0) {
      this.health = this.maxHealth;
      
      // Reset all powerups
      for (const powerup in this.activePowerups) {
        this.activePowerups[powerup] = false;
      }
    }
  }
  
  updateBoundaries() {
    // Called when canvas is resized
    this.pos.x = constrain(this.pos.x, this.size / 2, width - this.size / 2);
    this.pos.y = constrain(this.pos.y, this.size / 2, height - this.size / 2);
  }
} 