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
    this.lives = 2;
    this.shootCooldown = 0;
    this.shootCooldownMax = 15; // frames between shots
    this.isInvulnerable = false;
    this.invulnerabilityTimer = 0;
    this.invulnerabilityDuration = 90; // 1.5 seconds at 60fps
    
    // Powerups
    this.activePowerups = {
      tripleShot: false,
      powerShot: false,
      shield: false,
      speedBoost: false
    };
    
    // Powerup timers
    this.powerupTimers = {
      shield: 0
    };
    
    // Powerup durations
    this.SHIELD_DURATION = 600; // 10 seconds at 60fps
    
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
    
    // Apply friction to slow down when not accelerating
    this.vel.mult(0.9);
    
    // Keep player within boundaries
    this.pos.x = constrain(this.pos.x, this.size / 2, width - this.size / 2);
    this.pos.y = constrain(this.pos.y, this.size / 2, height - this.size / 2);
    
    // Update shooting cooldown
    if (this.shootCooldown > 0) {
      this.shootCooldown--;
    }
    
    // Update invulnerability state
    if (this.isInvulnerable) {
      this.invulnerabilityTimer--;
      
      // If not shield-powered invulnerability, check timer
      if (!this.activePowerups.shield) {
        if (this.invulnerabilityTimer <= 0) {
          this.isInvulnerable = false;
        }
      }
    }
    
    // Update shield timer
    if (this.activePowerups.shield) {
      this.powerupTimers.shield--;
      
      if (this.powerupTimers.shield <= 0) {
        this.activePowerups.shield = false;
        this.isInvulnerable = false;
        console.log("Shield expired");
      }
    }
    
    // Update animation timers
    this.thrustAnimation += 0.2;
    
    // Gradually rotate toward target angle
    const angleDiff = this.targetAngle - this.angle;
    this.angle += angleDiff * 0.1;
  }
  
  applyPowerup(type) {
    // Clear current powerups of the same category
    if (type === 'tripleShot' || type === 'powerShot') {
      this.activePowerups.tripleShot = false;
      this.activePowerups.powerShot = false;
    } else if (type === 'shield' || type === 'speedBoost') {
      this.activePowerups.shield = false;
      this.activePowerups.speedBoost = false;
    }
    
    // Apply the new powerup
    switch(type) {
      case 'tripleShot':
        this.activePowerups.tripleShot = true;
        break;
      case 'powerShot':
        this.activePowerups.powerShot = true;
        break;
      case 'shield':
        this.activePowerups.shield = true;
        this.powerupTimers.shield = this.SHIELD_DURATION;
        this.isInvulnerable = true;
        break;
      case 'speedBoost':
        this.activePowerups.speedBoost = true;
        break;
    }
  }
  
  takeDamage(amount) {
    // If invulnerable, don't take damage
    if (this.isInvulnerable) return;
    
    // Apply damage
    this.health -= amount;
    
    // Reset all powerups when taking damage
    this.clearPowerups();
    
    // Apply screen shake
    applyScreenShake(10, 5);
    
    // Start invulnerability period
    this.isInvulnerable = true;
    this.invulnerabilityTimer = this.invulnerabilityDuration;
    
    // If health depleted, lose a life and reset health
    if (this.health <= 0) {
      this.lives--;
      
      if (this.lives > 0) {
        this.health = this.maxHealth;
      }
    }
  }
  
  clearPowerups() {
    // Clear all active powerups
    for (const powerup in this.activePowerups) {
      this.activePowerups[powerup] = false;
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
      
      // Create projectiles with increased damage
      const damage = this.activePowerups.powerShot ? 2 : 1;
      
      if (this.activePowerups.tripleShot) {
        // Triple shot powerup active
        const center = new Projectile(this.pos.x, this.pos.y, 0, -10);
        const left = new Projectile(this.pos.x, this.pos.y, -2, -9);
        const right = new Projectile(this.pos.x, this.pos.y, 2, -9);
        
        // Set damage and log
        center.damage = damage;
        left.damage = damage;
        right.damage = damage;
        
        console.log(`Shooting triple projectiles, damage=${damage}, hitboxSize=${center.hitboxSize}`);
        
        game.projectiles.push(center);
        game.projectiles.push(left);
        game.projectiles.push(right);
      } else {
        // Regular single shot
        const projectile = new Projectile(this.pos.x, this.pos.y, 0, -10);
        projectile.damage = damage;
        
        console.log(`Shooting projectile, damage=${damage}, hitboxSize=${projectile.hitboxSize}`);
        
        game.projectiles.push(projectile);
      }
      
      // Create muzzle flash effect
      game.createExplosion(this.pos.x, this.pos.y - this.size/2, 5, 5, color(255, 200, 50));
    }
  }
  
  updateBoundaries() {
    // Called when canvas is resized
    this.pos.x = constrain(this.pos.x, this.size / 2, width - this.size / 2);
    this.pos.y = constrain(this.pos.y, this.size / 2, height - this.size / 2);
  }
} 