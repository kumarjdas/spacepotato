class Game {
  constructor() {
    // Game states
    this.GAME_START = 0;
    this.GAME_PLAYING = 1;
    this.GAME_OVER = 2;
    this.GAME_PAUSED = 3;
    this.GAME_HELP = 4; // New state for help screen
    this.GAME_NAME_ENTRY = 5; // New state for name entry
    
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
    
    // Name entry variables
    this.playerName = "POTATO";
    this.nameEntryActive = false;
    this.nameEntryMaxLength = 10;
    this.isNewHighScore = false;
    
    // Power-up message display
    this.powerupMessage = "";
    this.powerupMessageTimer = 0;
    this.powerupMessageDuration = 180; // 3 seconds at 60fps
    
    // High scores
    this.loadHighScores();
    
    // UI elements
    this.stars = this.createStars(200);
    
    // Base colors
    this.colors = {
      background: color(10, 15, 30),
      text: color(255),
      scoreText: color(255, 220, 150),
      buttonFill: color(60, 100, 150),
      buttonHover: color(80, 130, 180),
      buttonText: color(255),
      healthBar: color(100, 200, 100),
      healthBarBg: color(60, 60, 60),
      inputField: color(40, 40, 60),
      inputFieldActive: color(50, 50, 80)
    };
    
    // Update background color based on level
    this.updateBackgroundColor();
    
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
  
  // Update background color based on current level
  updateBackgroundColor() {
    // Start with base dark color and make it lighter with each level
    const baseR = 10;
    const baseG = 15;
    const baseB = 30;
    
    // Calculate how much to lighten (max 30% lighter at level 10)
    const lightenFactor = min(0.3, (this.level - 1) * 0.03);
    
    const r = baseR + lightenFactor * (255 - baseR);
    const g = baseG + lightenFactor * (255 - baseG);
    const b = baseB + lightenFactor * (255 - baseB);
    
    this.colors.background = color(r, g, b);
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
      case this.GAME_HELP:
        this.displayGame(); // Show game in background
        this.displayHelpScreen();
        break;
      case this.GAME_NAME_ENTRY:
        this.displayGameOverScreen();
        this.displayNameEntryScreen();
        break;
    }
  }
  
  // Game state updates
  updateGame() {
    this.updateStars();
    
    // Update level up message timer if active
    if (this.showLevelUpMessage) {
      this.levelUpTimer--;
      if (this.levelUpTimer <= 0) {
        this.showLevelUpMessage = false;
      }
    }
    
    // Update powerup message timer if active
    if (this.powerupMessageTimer > 0) {
      this.powerupMessageTimer--;
    }
    
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
      if (this.checkCollision(enemy, this.player)) {
        if (this.player.activePowerups.shield) {
          // Player has shield - damage the enemy instead
          enemy.health -= 1;
          
          // Create visual effect for shield collision
          this.createExplosion(enemy.pos.x, enemy.pos.y, 10, enemy.size, color(100, 150, 255));
          applyScreenShake(5, 5);
          
          // Check if enemy is destroyed
          if (enemy.health <= 0) {
            // Award score and create explosion
            this.score += enemy.scoreValue;
            this.createExplosion(enemy.pos.x, enemy.pos.y, 15, enemy.size * 1.5);
            
            // Chance to drop powerup
            if (random() < 0.2) {
              this.powerups.push(new Powerup(enemy.pos.x, enemy.pos.y));
            }
            
            // Remove the enemy
            this.enemies.splice(i, 1);
            applyScreenShake(5, 5);
            this.playSound("explosion");
          }
        } else if (!this.player.isInvulnerable) {
          // Normal collision - player takes damage
          this.player.takeDamage(1);
          this.createExplosion(enemy.pos.x, enemy.pos.y, 10, enemy.size);
          this.enemies.splice(i, 1);
          applyScreenShake(10, 10);
          this.playSound("explosion");
        }
        continue;
      }
      
      // Check collision with projectiles
      for (let j = this.projectiles.length - 1; j >= 0; j--) {
        const projectile = this.projectiles[j];
        
        // Calculate distance between projectile and enemy
        const distance = dist(projectile.pos.x, projectile.pos.y, enemy.pos.x, enemy.pos.y);
        
        // Use the hitbox sizes to determine collision
        const combinedRadius = (projectile.hitboxSize / 2) + (enemy.hitboxSize / 2);
        
        if (distance < combinedRadius) {
          console.log(`HIT! Type: ${enemy.type}, Enemy health before: ${enemy.health}, damage: ${projectile.damage}`);
          
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
        
        // Set powerup message based on type
        let message = "";
        switch(powerup.type) {
          case 'tripleShot':
            message = "Triple Shot: Fire 3 projectiles at once!";
            break;
          case 'powerShot':
            message = "Power Shot: Projectiles deal double damage!";
            break;
          case 'shield':
            message = "Shield: 10 seconds of invulnerability. Ram enemies to destroy them!";
            break;
          case 'speedBoost':
            message = "Speed Boost: Move 50% faster!";
            break;
          default:
            message = `Collected ${powerup.type.toUpperCase()} power-up!`;
        }
        
        this.powerupMessage = message;
        this.powerupMessageTimer = this.powerupMessageDuration;
        
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
    
    // Show level up message if active
    if (this.showLevelUpMessage) {
      textAlign(CENTER, CENTER);
      textSize(40);
      fill(255, 255, 0, map(this.levelUpTimer, 0, 120, 0, 255));
      text(`LEVEL ${this.level}`, width / 2, height / 3);
      textSize(24);
      text("Enemies are getting stronger!", width / 2, height / 3 + 50);
    }
    
    // Show powerup message if active
    if (this.powerupMessageTimer > 0) {
      textAlign(CENTER, CENTER);
      textSize(20);
      // Fade out as timer decreases
      fill(100, 255, 100, map(this.powerupMessageTimer, 0, this.powerupMessageDuration, 0, 255));
      text(this.powerupMessage, width / 2, height - 150);
    }
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
    
    // Level progress bar
    this.displayLevelProgress();
    
    // Lives
    this.displayLives();
    
    // Help button - drawn last so it's on top of everything
    fill(this.colors.buttonFill);
    stroke(255);
    strokeWeight(1);
    ellipse(width - 30, 30, 30, 30);
    
    fill(255);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(20);
    text("?", width - 30, 30);
    
    // Check if help button was clicked
    if (dist(mouseX, mouseY, width - 30, 30) < 15 && mouseIsPressed) {
      this.gameState = this.GAME_HELP;
    }
  }
  
  displayLevelProgress() {
    // Level progress bar
    const barWidth = 200;
    const barHeight = 6;
    const x = width / 2 - barWidth / 2;
    const y = 50;
    
    // Calculate progress percentage
    const progressPercent = this.difficultyTimer / this.DIFFICULTY_INCREASE;
    
    // Background
    fill(this.colors.healthBarBg);
    rect(x, y, barWidth, barHeight, 3);
    
    // Progress
    fill(255, 220, 100);
    rect(x, y, barWidth * progressPercent, barHeight, 3);
    
    // Label
    textAlign(CENTER, TOP);
    textSize(12);
    fill(255);
    text("NEXT LEVEL", width / 2, y + barHeight + 5);
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
    
    // Draw buttons
    this.displayButton("START GAME", width / 2, height * 2/3, 200, 50);
    this.displayButton("HIGH SCORES", width / 2, height * 2/3 + 70, 200, 50);
    
    // Credits
    textSize(16);
    text("Created with p5.js", width / 2, height - 30);
    
    // Show high scores if requested
    if (this.showHighScores) {
      this.displayHighScores();
    }
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
    text("GAME OVER", width / 2, height / 4);
    
    // Score
    textSize(24);
    const isNewHighScore = this.score > 0 && this.highScores.length > 0 && 
                         this.score >= this.highScores[0].score && 
                         this.highScores[0].score !== this.score;
    this.isNewHighScore = isNewHighScore;
    
    let scoreText = `Score: ${this.score}`;
    if (isNewHighScore) {
      scoreText += " - NEW HIGH SCORE!";
      fill(255, 255, 0);
    } else {
      scoreText += ` - High Score: ${this.highScore}`;
      fill(this.colors.text);
    }
    text(scoreText, width / 2, height / 3);
    
    // Draw buttons
    const buttonY = height * 2/3;
    const buttonSpacing = 220;
    
    fill(this.colors.text);
    
    // High scores button
    if (this.displayButton("HIGH SCORES", width / 2 - buttonSpacing/2, buttonY, 180, 50)) {
      this.showHighScores = true;
    }
    
    // Play again button
    if (this.displayButton("PLAY AGAIN", width / 2 + buttonSpacing/2, buttonY, 180, 50)) {
      this.startGame();
    }
    
    // Show high scores if requested
    if (this.showHighScores) {
      // Back button on high scores screen
      if (this.displayButton("BACK", width / 2, height * 0.85, 150, 40)) {
        this.showHighScores = false;
      }
    }
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
    // Check if score qualifies for high score before changing state
    if (this.isHighScore(this.score)) {
      this.isNewHighScore = this.score > 0 && this.highScores.length > 0 && 
                         this.score >= this.highScores[0].score;
      this.gameState = this.GAME_NAME_ENTRY;
      this.playerName = ""; // Clear the player name for entry
    } else {
      this.gameState = this.GAME_OVER;
      // Just save with default name if not a high score
      this.saveHighScore(this.score);
    }
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
    
    // Update background color to reflect the new level
    this.updateBackgroundColor();
    
    // Display level up message
    this.showLevelUpMessage = true;
    this.levelUpTimer = 120; // Show for 2 seconds
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
        
        // High scores button on start screen
        if (this.displayButton("HIGH SCORES", width / 2, height * 2/3 + 70, 200, 50)) {
          this.showHighScores = true;
        }
        
        // Show high scores if requested
        if (this.showHighScores) {
          if (this.displayButton("BACK", width / 2, height * 0.85, 150, 40)) {
            this.showHighScores = false;
          }
          return; // Skip other processing when showing high scores
        }
        break;
        
      case this.GAME_PLAYING:
        // Check if help button was clicked
        if (dist(mouseX, mouseY, width - 30, 30) < 15) {
          this.gameState = this.GAME_HELP;
        } else {
          // Otherwise shoot
          this.player.shoot();
          this.playSound("shoot");
        }
        break;
        
      case this.GAME_OVER:
        // High scores button
        if (this.displayButton("HIGH SCORES", width / 2 - 110, height * 2/3, 180, 50)) {
          this.showHighScores = true;
        }
        
        // Play again button
        if (this.displayButton("PLAY AGAIN", width / 2 + 110, height * 2/3, 180, 50)) {
          this.startGame();
        }
        
        // Show high scores if requested
        if (this.showHighScores) {
          // Back button on high scores screen
          if (this.displayButton("BACK", width / 2, height * 0.85, 150, 40)) {
            this.showHighScores = false;
          }
        }
        break;
        
      case this.GAME_PAUSED:
        if (this.displayButton("RESUME", width / 2, height * 2/3, 200, 50)) {
          this.togglePause();
        }
        break;
        
      case this.GAME_HELP:
        if (this.displayButton("RESUME GAME", width / 2, height * 0.9, 200, 40)) {
          this.gameState = this.GAME_PLAYING;
        }
        break;
    }
  }
  
  keyPressed() {
    // Start audio context on any user interaction
    this.startAudioContext();
    
    // Special handling for name entry
    if (this.gameState === this.GAME_NAME_ENTRY) {
      if (keyCode === BACKSPACE) {
        // Remove the last character when backspace is pressed
        this.playerName = this.playerName.slice(0, -1);
        return false; // Prevent browser from navigating back
      } else if (keyCode === ENTER || keyCode === RETURN) {
        // Submit name when Enter is pressed
        if (this.playerName.trim().length > 0) {
          this.saveHighScore(this.score, this.playerName);
          this.gameState = this.GAME_OVER;
        }
        return false;
      }
    }
    
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
  
  // High scores functionality
  loadHighScores() {
    try {
      const savedScores = localStorage.getItem('spacePotatoHighScores');
      this.highScores = savedScores ? JSON.parse(savedScores) : [];
      
      // If no scores yet, initialize with empty array
      if (!Array.isArray(this.highScores)) {
        this.highScores = [];
      }
      
      // Sort scores from highest to lowest
      this.highScores.sort((a, b) => b.score - a.score);
      
      // Set current high score from saved scores
      this.highScore = this.highScores.length > 0 ? this.highScores[0].score : 0;
      
      console.log("Loaded high scores:", this.highScores);
    } catch (e) {
      console.warn("Error loading high scores:", e);
      this.highScores = [];
    }
  }
  
  saveHighScore(score, playerName = "POTATO") {
    try {
      // Only save if score is greater than 0
      if (score <= 0) return;
      
      // Use the provided name, or a default if empty
      const name = playerName.trim() || "POTATO";
      
      // Add new score
      const newScore = {
        name: name,
        score: score,
        level: this.level,
        date: new Date().toISOString().split('T')[0] // Just the date part YYYY-MM-DD
      };
      
      this.highScores.push(newScore);
      
      // Sort and keep top 10
      this.highScores.sort((a, b) => b.score - a.score);
      if (this.highScores.length > 10) {
        this.highScores = this.highScores.slice(0, 10);
      }
      
      // Save to localStorage
      localStorage.setItem('spacePotatoHighScores', JSON.stringify(this.highScores));
      
      // Update current high score
      this.highScore = this.highScores[0].score;
      
      console.log("Saved high scores:", this.highScores);
    } catch (e) {
      console.warn("Error saving high score:", e);
    }
  }
  
  displayHighScores() {
    // Background overlay
    fill(0, 0, 0, 200);
    rect(0, 0, width, height);
    
    // Title
    textAlign(CENTER, TOP);
    textSize(36);
    fill(this.colors.text);
    text("HIGH SCORES", width / 2, height * 0.1);
    
    // Show scores
    const startY = height * 0.2;
    const rowHeight = 40;
    
    textSize(18);
    textAlign(CENTER, TOP);
    
    if (this.highScores.length === 0) {
      fill(this.colors.text);
      text("No high scores yet. Play and be the first!", width / 2, startY + rowHeight * 2);
    } else {
      // Header
      fill(this.colors.scoreText);
      textAlign(LEFT, TOP);
      text("RANK", width * 0.2, startY);
      text("NAME", width * 0.3, startY);
      text("SCORE", width * 0.5, startY);
      text("LEVEL", width * 0.65, startY);
      text("DATE", width * 0.8, startY);
      
      line(width * 0.15, startY + rowHeight * 0.8, width * 0.85, startY + rowHeight * 0.8);
      
      // Scores
      for (let i = 0; i < this.highScores.length; i++) {
        const score = this.highScores[i];
        const y = startY + (i + 1) * rowHeight;
        
        // Highlight current score if it's a new high score
        if (this.score === score.score && this.isNewHighScore) {
          fill(255, 255, 100);
        } else {
          fill(this.colors.text);
        }
        
        textAlign(LEFT, TOP);
        text(`${i + 1}.`, width * 0.2, y);
        text(score.name, width * 0.3, y);
        text(score.score, width * 0.5, y);
        text(score.level, width * 0.65, y);
        text(score.date, width * 0.8, y);
      }
    }
    
    // Back button
    this.displayButton("BACK", width / 2, height * 0.85, 150, 40);
  }
  
  displayHelpScreen() {
    // Semi-transparent overlay
    fill(0, 0, 0, 200);
    rect(0, 0, width, height);
    
    // Title
    textAlign(CENTER, TOP);
    textSize(36);
    fill(this.colors.text);
    text("HELP GUIDE", width / 2, height * 0.05);
    
    // Content sections
    const startY = height * 0.15;
    const sectionHeight = height * 0.4;
    
    // Left section: Enemy types
    this.displayEnemyGuide(width * 0.25, startY, width * 0.4, sectionHeight);
    
    // Right section: Powerup types
    this.displayPowerupGuide(width * 0.75, startY, width * 0.4, sectionHeight);
    
    // Controls section
    this.displayControlsGuide(width / 2, startY + sectionHeight + 30, width * 0.8, height * 0.2);
    
    // Back button
    if (this.displayButton("RESUME GAME", width / 2, height * 0.9, 200, 40)) {
      this.gameState = this.GAME_PLAYING;
    }
  }
  
  displayEnemyGuide(x, y, w, h) {
    textAlign(CENTER, TOP);
    textSize(24);
    fill(this.colors.text);
    text("ENEMY TYPES", x, y);
    
    textAlign(LEFT, TOP);
    textSize(16);
    const lineHeight = 24;
    let currentY = y + 40;
    
    // Basic enemy
    fill(200, 50, 50);
    ellipse(x - w/4, currentY + 10, 20);
    fill(this.colors.text);
    text("Basic Enemy - 1 hit point", x - w/4 + 20, currentY);
    text("Standard movement pattern", x - w/4 + 20, currentY + lineHeight);
    
    currentY += lineHeight * 3;
    
    // Shooter enemy
    fill(50, 100, 200);
    ellipse(x - w/4, currentY + 10, 20);
    fill(this.colors.text);
    text("Shooter Enemy - 2 hit points", x - w/4 + 20, currentY);
    text("Shoots projectiles at player", x - w/4 + 20, currentY + lineHeight);
    
    currentY += lineHeight * 3;
    
    // Bomber enemy
    fill(100, 50, 150);
    ellipse(x - w/4, currentY + 10, 20);
    fill(this.colors.text);
    text("Bomber Enemy - 3 hit points", x - w/4 + 20, currentY);
    text("Slow but tough, charges at player", x - w/4 + 20, currentY + lineHeight);
    
    currentY += lineHeight * 3;
    
    // Zigzag enemy
    fill(50, 200, 100);
    ellipse(x - w/4, currentY + 10, 20);
    fill(this.colors.text);
    text("Zigzag Enemy - 1 hit point", x - w/4 + 20, currentY);
    text("Fast and erratic movement", x - w/4 + 20, currentY + lineHeight);
  }
  
  displayPowerupGuide(x, y, w, h) {
    textAlign(CENTER, TOP);
    textSize(24);
    fill(this.colors.text);
    text("POWERUPS", x, y);
    
    textAlign(LEFT, TOP);
    textSize(16);
    const lineHeight = 24;
    let currentY = y + 40;
    
    // Triple shot
    fill(100, 200, 255);
    ellipse(x - w/4, currentY + 10, 20);
    fill(this.colors.text);
    text("Triple Shot", x - w/4 + 20, currentY);
    text("Fire 3 projectiles at once", x - w/4 + 20, currentY + lineHeight);
    
    currentY += lineHeight * 3;
    
    // Power shot
    fill(255, 100, 100);
    ellipse(x - w/4, currentY + 10, 20);
    fill(this.colors.text);
    text("Power Shot", x - w/4 + 20, currentY);
    text("Increased damage", x - w/4 + 20, currentY + lineHeight);
    
    currentY += lineHeight * 3;
    
    // Shield
    fill(100, 255, 100);
    ellipse(x - w/4, currentY + 10, 20);
    fill(this.colors.text);
    text("Shield", x - w/4 + 20, currentY);
    text("10 seconds of invulnerability", x - w/4 + 20, currentY + lineHeight);
    text("Ram enemies to destroy them", x - w/4 + 20, currentY + lineHeight * 2);
    
    currentY += lineHeight * 4;
    
    // Speed boost
    fill(255, 255, 100);
    ellipse(x - w/4, currentY + 10, 20);
    fill(this.colors.text);
    text("Speed Boost", x - w/4 + 20, currentY);
    text("50% faster movement", x - w/4 + 20, currentY + lineHeight);
    
    currentY += lineHeight * 3;
    
    // Extra info
    fill(this.colors.scoreText);
    text("Most powerups last until you take", x - w/4, currentY);
    text("damage or collect a new one", x - w/4, currentY + lineHeight);
  }
  
  displayControlsGuide(x, y, w, h) {
    textAlign(CENTER, TOP);
    textSize(24);
    fill(this.colors.text);
    text("CONTROLS", x, y);
    
    textAlign(CENTER, TOP);
    textSize(16);
    const lineHeight = 24;
    let currentY = y + 40;
    
    fill(this.colors.text);
    text("Move: Arrow Keys or WASD", x, currentY);
    text("Shoot: Left Mouse Button or Spacebar", x, currentY + lineHeight);
    text("Pause: ESC key", x, currentY + lineHeight * 2);
  }
  
  displayNameEntryScreen() {
    // Semi-transparent overlay
    fill(0, 0, 0, 200);
    rect(0, 0, width, height);
    
    // Title
    textAlign(CENTER, TOP);
    textSize(36);
    fill(255, 255, 0);
    text("NEW HIGH SCORE!", width / 2, height * 0.25);
    
    // Display score
    textSize(24);
    fill(this.colors.text);
    text(`Score: ${this.score} - Level: ${this.level}`, width / 2, height * 0.35);
    
    // Name entry field
    textSize(24);
    text("Enter your name:", width / 2, height * 0.45);
    
    // Input field
    const fieldWidth = 300;
    const fieldHeight = 40;
    const fieldX = width/2 - fieldWidth/2;
    const fieldY = height * 0.5;
    
    // Draw field background
    fill(this.colors.inputField);
    stroke(255);
    strokeWeight(2);
    rect(fieldX, fieldY, fieldWidth, fieldHeight, 5);
    
    // Draw entered name
    textAlign(LEFT, CENTER);
    fill(255);
    noStroke();
    text(this.playerName + (frameCount % 60 < 30 ? "|" : ""), fieldX + 10, fieldY + fieldHeight/2);
    
    // Submit button
    textAlign(CENTER, CENTER);
    if (this.displayButton("SUBMIT", width / 2, height * 0.65, 150, 40)) {
      // Save the score with the entered name
      this.saveHighScore(this.score, this.playerName);
      this.gameState = this.GAME_OVER;
    }
    
    // Instructions
    textSize(16);
    fill(200);
    text("Type your name and press SUBMIT or ENTER", width / 2, height * 0.75);
  }
  
  // Handle key typing for name entry
  keyTyped() {
    if (this.gameState === this.GAME_NAME_ENTRY) {
      // Add the typed character to the name if it's a valid character
      if (this.playerName.length < this.nameEntryMaxLength) {
        // Only allow alphanumeric characters, spaces, and some punctuation
        const validChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 !?-_".split("");
        if (validChars.includes(key)) {
          this.playerName += key;
        }
      }
    }
    // Return false to allow default browser behavior
    return false;
  }
  
  // Check if score qualifies for high score list
  isHighScore(score) {
    if (score <= 0) return false;
    
    if (this.highScores.length < 10) {
      return true; // Less than 10 scores recorded, so automatically qualifies
    }
    
    // Check if score is higher than the lowest score in the top 10
    return score > this.highScores[this.highScores.length - 1].score;
  }
} 