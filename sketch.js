// Global variables
let game;
let canvas;
let screenShake = 0;
let shakeAmount = 0;

function setup() {
  // Create responsive canvas
  canvas = createCanvas(windowWidth > 1200 ? 1200 : windowWidth - 20, 
                       windowHeight > 800 ? 800 : windowHeight - 20);
  frameRate(60);
  
  // Initialize game controller
  game = new Game();
  
  // Disable right-click context menu
  canvas.elt.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
}

function draw() {
  // Apply screen shake effect
  if (screenShake > 0) {
    translate(random(-shakeAmount, shakeAmount), random(-shakeAmount, shakeAmount));
    screenShake--;
  }
  
  // Update and draw game
  if (game) {
    game.update();
    game.display();
  }
}

function windowResized() {
  // Make canvas responsive
  resizeCanvas(windowWidth > 1200 ? 1200 : windowWidth - 20, 
              windowHeight > 800 ? 800 : windowHeight - 20);
  
  // Check if game exists before calling methods
  if (game) {
    game.updateBoundaries();
  }
}

function mousePressed() {
  if (game) {
    game.mousePressed();
  }
}

function keyPressed() {
  if (game) {
    game.keyPressed();
  }
}

function keyReleased() {
  if (game) {
    game.keyReleased();
  }
}

// Utility function to trigger screen shake
function applyScreenShake(intensity, duration) {
  screenShake = duration;
  shakeAmount = intensity;
} 