// Global variables
let game;
let canvas;
let screenShake = 0;
let shakeAmount = 0;
// Declare noise variable globally to avoid initialization issues
let noise;

function setup() {
  // Create responsive canvas
  canvas = createCanvas(windowWidth > 1200 ? 1200 : windowWidth - 20, 
                       windowHeight > 800 ? 800 : windowHeight - 20);
  frameRate(60);
  
  // Initialize game controller
  game = new Game();
  
  // Initialize noise function to avoid the initialization error
  noise = (x, y, z) => {
    // Simple noise function replacement that uses sin and cos
    return 0.5 + 0.5 * sin(x * 10) * cos(y * 10 + z);
  };
  
  // Add event listeners for starting audio context
  document.addEventListener('click', startAudioIfNeeded);
  document.addEventListener('keydown', startAudioIfNeeded);
  
  // Disable right-click context menu
  canvas.elt.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
}

// Helper function to start audio on user interaction
function startAudioIfNeeded() {
  if (game) {
    game.startAudioContext();
  }
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

function keyTyped() {
  if (game) {
    game.keyTyped();
  }
  return false; // Prevent default browser behavior
}

// Utility function to trigger screen shake
function applyScreenShake(intensity, duration) {
  screenShake = duration;
  shakeAmount = intensity;
} 