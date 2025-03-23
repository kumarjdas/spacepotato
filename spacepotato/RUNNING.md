# Running Space Potato

## Quick Start

To run the game properly with all features including sound:

1. **Set up a local server**. Choose one of these methods:

   - **Using Python** (if you have Python installed):
     ```
     python -m http.server
     ```
     Then open: http://localhost:8000

   - **Using Node.js** (if you have Node.js installed):
     ```
     npm install -g http-server
     http-server
     ```
     Then open: http://localhost:8080

   - **Using VS Code**: Install the "Live Server" extension, right-click on index.html, and select "Open with Live Server"

2. **Open the game in a modern browser** (Chrome, Firefox, Edge, etc.)

## Troubleshooting

### Sound Issues

If you see errors like "Not allowed to load local resource: blob:null/..." or "Unable to load a worklet's module", it means the browser security restrictions are preventing audio from loading correctly.

This happens when you open the HTML file directly using the file:// protocol instead of through a web server (http:// protocol).

### Game Not Working

If the game doesn't start or shows errors like "Cannot read properties of undefined":

1. Make sure all JavaScript files are in the same directory as index.html
2. Check your browser console (F12) for specific errors
3. Try a different browser

## Playing Without Sound

If you just want to play without sound and don't want to set up a server, you can:

1. Open index.html directly in your browser
2. Click anywhere on the error message to dismiss it
3. The game will run without sound effects 