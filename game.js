class Game {
  constructor() {
    // Game states
    this.GAME_START = 0;
    this.GAME_PLAYING = 1;
    this.GAME_OVER = 2;
    this.GAME_PAUSED = 3;
    
    this.gameState = this.GAME_START;
    
    // Game objects
    this.player = new Player();
    this.projectiles = [];
    this.enemies = [];
    this.enemyProjectiles = [];
    this.particles = [];
    this.powerups = [];
    
    // Game variables
    this.score = 0;
    this.highScore = 0;
    this.level = 1;
    this.enemySpawnRate = 120; // frames between enemy spawns
    this.enemySpawnCounter = 0;
    this.difficultyTimer = 0;
    this.DIFFICULTY_INCREASE = 30 * 60; // increase difficulty every 30 seconds
    
    // UI elements
    this.stars = this.createStars(200);
    
    // Colors
    this.colors = {
      background: color(10, 15, 30),
      text: color(255),
      scoreText: color(255, 220, 150),
      buttonFill: color(60, 100, 150),
      buttonHover: color(80, 130, 180),
      buttonText: color(255),
      healthBar: color(100, 200, 100),
      healthBarBg: color(60, 60, 60)
    };
    
    // Audio context management
    this.audioContextStarted = false;
    
    // Sounds
    this.soundEnabled = true;
    try {
      this.initSounds();
    } catch(e) {
      console.warn("Sound initialization failed, disabling sound:", e);
      this.soundEnabled = false;
    }
  }
  
  initSounds() {
    try {
      // We'll synthesize sounds using p5.Oscillator
      this.shootSound = new p5.Oscillator('square');
      this.shootSound.amp(0);
      this.shootSound.start();
      
      this.explosionSound = new p5.Noise('brown');
      this.explosionSound.amp(0);
      this.explosionSound.start();
      
      this.powerupSound = new p5.Oscillator('sine');
      this.powerupSound.amp(0);
      this.powerupSound.start();
    } catch(e) {
      console.error("Error initializing sounds:", e);
      this.soundEnabled = false;
      throw e; // Rethrow to be handled by the constructor
    }
  }
  
  playSound(type) {
    // Skip if sound is disabled
    if (!this.soundEnabled) return;
    
    try {
      switch(type) {
        case "shoot":
          this.shootSound.freq(400);
          this.shootSound.amp(0.1, 0.01);
          this.shootSound.amp(0, 0.2, 0.05);
          break;
        case "explosion":
          this.explosionSound.amp(0.2, 0.01);
          this.explosionSound.amp(0, 0.5, 0.1);
          break;
        case "powerup":
          this.powerupSound.freq(600);
          this.powerupSound.amp(0.1, 0.01);
          setTimeout(() => {
            this.powerupSound.freq(800);
          }, 100);
          setTimeout(() => {
            this.powerupSound.amp(0, 0.2);
          }, 200);
          break;
      }
    } catch(e) {
      console.warn("Error playing sound, disabling sound:", e);
      this.soundEnabled = false;
    }
  }
  
  createStars(count) {
    const stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: random(width),
        y: random(height),
        size: random(1, 3),
        speed: random(0.1, 0.5)
      });
    }
    return stars;
  }
  
  update() {
    // Update based on game state
    switch (this.gameState) {
      case this.GAME_PLAYING:
        this.updateGame();
        break;
      case this.GAME_START:
      case this.GAME_OVER:
      case this.GAME_PAUSED:
        // Update stars in all states for background animation
        this.updateStars();
        break;
    }
  }
  
  display() {
    // Clear screen
    background(this.colors.background);
    
    // Display based on game state
    switch (this.gameState) {
      case this.GAME_START:
        this.displayStartScreen();
        break;
      case this.GAME_PLAYING:
        this.displayGame();
        break;
      case this.GAME_OVER:
        this.displayGameOverScreen();
        break;
      case this.GAME_PAUSED:
        this.displayGame();
        this.displayPauseScreen();
        break;
    }
  }
  
  // Game state updates
  updateGame() {
    this.updateStars();
    
    // Update player
    this.player.update();
    
    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      this.projectiles[i].update();
      if (this.projectiles[i].isOffscreen()) {
        this.projectiles.splice(i, 1);
      }
    }
    
    // Update enemy projectiles
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const projectile = this.enemyProjectiles[i];
      projectile.update();
      
      // Check collision with player
      if (this.checkCollision(projectile, this.player) && !this.player.isInvulnerable) {
        this.player.takeDamage(1);
        this.createExplosion(projectile.pos.x, projectile.pos.y, 5, projectile.size);
        this.enemyProjectiles.splice(i, 1);
        continue;
      }
      
      // Remove offscreen projectiles
      if (projectile.isOffscreen()) {
        this.enemyProjectiles.splice(i, 1);
      }
    }
    
    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update();
      
      // Check collision with player
      if (this.checkCollision(enemy, this.player) && !this.player.isInvulnerable) {
        this.player.takeDamage(1);
        this.createExplosion(enemy.pos.x, enemy.pos.y, 10, enemy.size);
        this.enemies.splice(i, 1);
        applyScreenShake(10, 10);
        this.playSound("explosion");
        continue;
      }
      
      // Check collision with projectiles
      for (let j = this.projectiles.length - 1; j >= 0; j--) {
        const projectile = this.projectiles[j];
        
        // More lenient collision check for projectiles
        const distance = dist(projectile.pos.x, projectile.pos.y, enemy.pos.x, enemy.pos.y);
        // Use a fixed distance for more consistent hits
        const hitDistance = 30; // Fixed distance for hit detection
        
        if (distance < hitDistance) {
          console.log(`HIT! Enemy health before: ${enemy.health}`);
          
          // Apply damage to enemy
          enemy.health -= projectile.damage;
          console.log(`Enemy health after: ${enemy.health}`);
          
          // Create visual effect
          this.createExplosion(projectile.pos.x, projectile.pos.y, 3, projectile.size);
          
          // Remove the projectile
          this.projectiles.splice(j, 1);
          
          // Check if enemy is destroyed
          if (enemy.health <= 0) {
            this.score += enemy.scoreValue;
            this.createExplosion(enemy.pos.x, enemy.pos.y, 15, enemy.size * 1.5);
            
            // Chance to drop powerup
            if (random() < 0.2) {
              this.powerups.push(new Powerup(enemy.pos.x, enemy.pos.y));
            }
            
            this.enemies.splice(i, 1);
            applyScreenShake(5, 5);
            this.playSound("explosion");
          }
          break;
        }
      }
      
      // Remove offscreen enemies
      if (enemy.isOffscreen()) {
        this.enemies.splice(i, 1);
      }
    }
    
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].isDead()) {
        this.particles.splice(i, 1);
      }
    }
    
    // Update powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const powerup = this.powerups[i];
      powerup.update();
      
      // Check collision with player
      if (powerup.collidesWith(this.player)) {
        this.player.applyPowerup(powerup.type);
        this.createExplosion(powerup.pos.x, powerup.pos.y, 10, powerup.size, color(100, 255, 100));
        this.powerups.splice(i, 1);
        this.playSound("powerup");
        continue;
      }
      
      // Remove offscreen powerups
      if (powerup.isOffscreen()) {
        this.powerups.splice(i, 1);
      }
    }
    
    // Spawn enemies
    this.enemySpawnCounter++;
    if (this.enemySpawnCounter >= this.enemySpawnRate) {
      this.spawnEnemy();
      this.enemySpawnCounter = 0;
    }
    
    // Increase difficulty over time
    this.difficultyTimer++;
    if (this.difficultyTimer >= this.DIFFICULTY_INCREASE) {
      this.increaseDifficulty();
      this.difficultyTimer = 0;
    }
    
    // Game over check
    if (this.player.lives <= 0) {
      this.gameOver();
    }
  }
  
  updateStars() {
    for (let star of this.stars) {
      star.y += star.speed;
      if (star.y > height) {
        star.y = 0;
        star.x = random(width);
      }
    }
  }
  
  // Display functions
  displayGame() {
    // Draw stars
    fill(255);
    noStroke();
    for (let star of this.stars) {
      ellipse(star.x, star.y, star.size);
    }
    
    // Draw game objects
    this.powerups.forEach(powerup => powerup.display());
    this.projectiles.forEach(projectile => {
      projectile.display();
    });
    
    this.enemies.forEach(enemy => {
      enemy.display();
    });
    
    this.enemyProjectiles.forEach(projectile => projectile.display());
    this.player.display();
    this.particles.forEach(particle => particle.display());
    
    // Display UI
    this.displayHUD();
  }
  
  displayHUD() {
    // Score
    textAlign(LEFT, TOP);
    textSize(24);
    fill(this.colors.scoreText);
    text(`Score: ${this.score}`, 20, 20);
    
    // Level
    textAlign(CENTER, TOP);
    text(`Level ${this.level}`, width / 2, 20);
    
    // Lives
    this.displayLives();
  }
  
  displayLives() {
    // Health bar
    const barWidth = 200;
    const barHeight = 15;
    const x = width - barWidth - 20;
    const y = 20;
    
    // Background
    fill(this.colors.healthBarBg);
    rect(x, y, barWidth, barHeight, 5);
    
    // Health
    const healthPercent = this.player.health / this.player.maxHealth;
    fill(this.colors.healthBar);
    rect(x, y, barWidth * healthPercent, barHeight, 5);
    
    // Lives icons
    for (let i = 0; i < this.player.lives; i++) {
      fill(200, 100, 50);
      ellipse(width - 30 - (i * 25), y + barHeight + 15, 15);
    }
  }
  
  displayStartScreen() {
    // Draw stars
    fill(255);
    noStroke();
    for (let star of this.stars) {
      ellipse(star.x, star.y, star.size);
    }
    
    // Title
    textAlign(CENTER, CENTER);
    textSize(60);
    fill(this.colors.text);
    text("SPACE POTATO", width / 2, height / 3);
    
    // Instructions
    textSize(20);
    text("Arrow keys or WASD to move. Left mouse button to shoot.", width / 2, height / 2);
    
    // Draw button
    this.displayButton("START GAME", width / 2, height * 2/3, 200, 50);
    
    // Credits
    textSize(16);
    text("Created with p5.js", width / 2, height - 30);
  }
  
  displayGameOverScreen() {
    // Draw stars
    fill(255);
    noStroke();
    for (let star of this.stars) {
      ellipse(star.x, star.y, star.size);
    }
    
    // Game Over text
    textAlign(CENTER, CENTER);
    textSize(60);
    fill(this.colors.text);
    text("GAME OVER", width / 2, height / 3);
    
    // Score
    textSize(24);
    let scoreText = `Score: ${this.score}`;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      scoreText += " - NEW HIGH SCORE!";
    } else {
      scoreText += ` - High Score: ${this.highScore}`;
    }
    text(scoreText, width / 2, height / 2);
    
    // Draw button
    this.displayButton("PLAY AGAIN", width / 2, height * 2/3, 200, 50);
  }
  
  displayPauseScreen() {
    // Semi-transparent overlay
    fill(0, 0, 0, 150);
    rect(0, 0, width, height);
    
    // Pause text
    textAlign(CENTER, CENTER);
    textSize(60);
    fill(this.colors.text);
    text("PAUSED", width / 2, height / 3);
    
    // Instructions
    textSize(20);
    text("Press ESC to resume", width / 2, height / 2);
    
    // Draw button
    this.displayButton("RESUME", width / 2, height * 2/3, 200, 50);
  }
  
  displayButton(label, x, y, w, h) {
    rectMode(CENTER);
    
    // Check if mouse is over button
    const isHover = mouseX > x - w/2 && mouseX < x + w/2 && 
                    mouseY > y - h/2 && mouseY < y + h/2;
    
    // Draw button
    fill(isHover ? this.colors.buttonHover : this.colors.buttonFill);
    rect(x, y, w, h, 10);
    
    // Draw label
    textAlign(CENTER, CENTER);
    textSize(20);
    fill(this.colors.buttonText);
    text(label, x, y);
    
    rectMode(CORNER);
    return isHover;
  }
  
  // Game state management
  startGame() {
    this.gameState = this.GAME_PLAYING;
    this.resetGame();
  }
  
  resetGame() {
    this.player = new Player();
    this.projectiles = [];
    this.enemies = [];
    this.enemyProjectiles = [];
    this.particles = [];
    this.powerups = [];
    this.score = 0;
    this.level = 1;
    this.enemySpawnRate = 120;
    this.enemySpawnCounter = 0;
    this.difficultyTimer = 0;
  }
  
  gameOver() {
    this.gameState = this.GAME_OVER;
  }
  
  togglePause() {
    if (this.gameState === this.GAME_PLAYING) {
      this.gameState = this.GAME_PAUSED;
    } else if (this.gameState === this.GAME_PAUSED) {
      this.gameState = this.GAME_PLAYING;
    }
  }
  
  // Utility functions
  createExplosion(x, y, particleCount = 10, size = 20, particleColor) {
    for (let i = 0; i < particleCount; i++) {
      this.particles.push(new Particle(x, y, size, particleColor));
    }
  }
  
  spawnEnemy() {
    const types = ['basic', 'shooter', 'bomber', 'zigzag'];
    const weights = [1, 0.6, 0.4, 0.5]; // Spawn probability weights
    
    // Adjust weights based on level
    if (this.level >= 2) weights[1] = 0.8;
    if (this.level >= 3) weights[2] = 0.6;
    if (this.level >= 4) weights[3] = 0.7;
    
    // Normalize weights
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const normalizedWeights = weights.map(w => w / totalWeight);
    
    // Random weighted selection
    const rand = random();
    let cumulativeWeight = 0;
    let selectedType = types[0];
    
    for (let i = 0; i < normalizedWeights.length; i++) {
      cumulativeWeight += normalizedWeights[i];
      if (rand < cumulativeWeight) {
        selectedType = types[i];
        break;
      }
    }
    
    // Create enemy
    const x = random(width);
    const enemy = new Enemy(x, -50, selectedType, this.level);
    this.enemies.push(enemy);
  }
  
  increaseDifficulty() {
    this.level++;
    this.enemySpawnRate = max(40, this.enemySpawnRate - 10);
  }
  
  // Input handling
  mousePressed() {
    // Start audio context on any user interaction
    this.startAudioContext();
    
    switch(this.gameState) {
      case this.GAME_START:
        if (this.displayButton("START GAME", width / 2, height * 2/3, 200, 50)) {
          this.startGame();
        }
        break;
      case this.GAME_PLAYING:
        this.player.shoot();
        this.playSound("shoot");
        break;
      case this.GAME_OVER:
        if (this.displayButton("PLAY AGAIN", width / 2, height * 2/3, 200, 50)) {
          this.startGame();
        }
        break;
      case this.GAME_PAUSED:
        if (this.displayButton("RESUME", width / 2, height * 2/3, 200, 50)) {
          this.togglePause();
        }
        break;
    }
  }
  
  keyPressed() {
    // Start audio context on any user interaction
    this.startAudioContext();
    
    // Pause game with Escape key
    if (keyCode === ESCAPE && (this.gameState === this.GAME_PLAYING || this.gameState === this.GAME_PAUSED)) {
      this.togglePause();
      return;
    }
    
    // In-game controls
    if (this.gameState === this.GAME_PLAYING) {
      // Movement controls
      if (keyCode === LEFT_ARROW || key === 'a' || key === 'A') this.player.isMovingLeft = true;
      if (keyCode === RIGHT_ARROW || key === 'd' || key === 'D') this.player.isMovingRight = true;
      if (keyCode === UP_ARROW || key === 'w' || key === 'W') this.player.isMovingUp = true;
      if (keyCode === DOWN_ARROW || key === 's' || key === 'S') this.player.isMovingDown = true;
      
      // Shooting
      if (key === ' ') {
        this.player.shoot();
        this.playSound("shoot");
      }
    }
  }
  
  keyReleased() {
    if (this.gameState === this.GAME_PLAYING) {
      // Movement controls
      if (keyCode === LEFT_ARROW || key === 'a' || key === 'A') this.player.isMovingLeft = false;
      if (keyCode === RIGHT_ARROW || key === 'd' || key === 'D') this.player.isMovingRight = false;
      if (keyCode === UP_ARROW || key === 'w' || key === 'W') this.player.isMovingUp = false;
      if (keyCode === DOWN_ARROW || key === 's' || key === 'S') this.player.isMovingDown = false;
    }
  }
  
  // Canvas boundary update for responsive design
  updateBoundaries() {
    this.player.updateBoundaries();
  }
  
  // Handle audio context starting - must be called on user interaction
  startAudioContext() {
    if (this.audioContextStarted) return;
    
    try {
      // Get the audio context from p5
      if (getAudioContext().state !== 'running') {
        getAudioContext().resume();
      }
      this.audioContextStarted = true;
      console.log("Audio context started");
    } catch (e) {
      console.warn("Could not start audio context:", e);
    }
  }
  
  // Check for collision between two entities with hitboxes
  checkCollision(entity1, entity2) {
    // Check if either entity is missing a hitboxSize
    if (!entity1 || !entity2) {
      console.warn("Collision check with null entity");
      return false;
    }
    
    if (!entity1.hitboxSize || !entity2.hitboxSize) {
      console.warn(`Missing hitboxSize: entity1=${entity1.hitboxSize}, entity2=${entity2.hitboxSize}`);
      return false;
    }
    
    // Calculate distance between entities
    const distance = dist(entity1.pos.x, entity1.pos.y, entity2.pos.x, entity2.pos.y);
    
    // Calculate combined radius with a slight increase for more reliable hits
    const combinedRadius = (entity1.hitboxSize / 2) + (entity2.hitboxSize / 2) + 5; // Added 5px buffer
    
    // Log collision details if objects are close
    if (distance < combinedRadius + 50) {
      console.log(`Collision check: distance=${distance.toFixed(2)}, radius=${combinedRadius.toFixed(2)}, hit=${distance < combinedRadius}`);
      console.log(`Entity1: x=${entity1.pos.x.toFixed(2)}, y=${entity1.pos.y.toFixed(2)}, hitbox=${entity1.hitboxSize}`);
      console.log(`Entity2: x=${entity2.pos.x.toFixed(2)}, y=${entity2.pos.y.toFixed(2)}, hitbox=${entity2.hitboxSize}`);
    }
    
    return distance < combinedRadius;
  }
} 