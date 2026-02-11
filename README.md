# Kumar J Das - GitHub Projects

This repository hosts my personal project portfolio page, showcasing various coding projects.

## Projects

### 🥔 Space Potato
A space shooter arcade game where you control a potato-shaped spaceship firing french fries at various enemies. Features custom animations, progressive difficulty, and various powerups.
- Tech: JavaScript, p5.js, HTML Canvas
- [Play Space Potato](https://kumarjdas.github.io/spacepotato/)

### 🕸️ Crawlme
A custom web crawler project that efficiently navigates and indexes web content. Built with performance and flexibility in mind.
- Tech: JavaScript, Node.js
- [View Crawlme Project](https://kumarjdas.github.io/crawlme/)

## Website Features

- Responsive design that works on desktop and mobile devices
- Dark theme with modern UI elements
- Project cards with descriptions and direct links
- Custom styling with CSS variables

## Repository Structure

`spacepotato` and `crawlme` are sibling submodules at the repo root (crawlme does not live inside spacepotato).

```
kumarjdas.github.io/
├── index.html          # Portfolio landing page
├── README.md
├── .gitignore
├── .gitmodules         # Submodule definitions (spacepotato, crawlme)
├── .nojekyll           # Disable Jekyll on GitHub Pages
├── spacepotato/        # Submodule → github.com/kumarjdas/spacepotato
│   ├── index.html      # Game entry point
│   ├── sketch.js, game.js, player.js, ...
│   └── ...
└── crawlme/            # Submodule → github.com/kumarjdas/crawlme (alongside spacepotato)
    ├── src/
    ├── public/
    ├── package.json
    └── ...
```

## Local Development

1. Clone with submodules: `git clone --recurse-submodules https://github.com/kumarjdas/kumarjdas.github.io.git`
2. If already cloned: `git submodule update --init --recursive`
3. Navigate to the project directory: `cd kumarjdas.github.io`
4. Open `index.html` in your browser to view the site
5. Make changes to HTML/CSS as needed
6. Commit and push changes to deploy to GitHub Pages

## Technologies Used

- HTML5
- CSS3 (with custom properties/variables)
- GitHub Pages for hosting

## License

This project is available as open source under the terms of the MIT License.
 
