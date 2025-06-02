# ForagingTheory v2

Cursor IDE enhanced upgrade of version 1, with more artistic models and evolving GUI controls.

### Update 6.1.2025- this app is now live [HERE](https://app.netlify.com/projects/foragingtheoryv2/deploys)

# 🍽️ AKA Buffet Race! Version 2 🍽️

Welcome to Buffet Race! A 3D foraging simulation and playground for exploring natural and artificial intelligence, resource competition, and more. Built with React, Three.js, and TypeScript.

## 🚀 Features
- 3D race where AI players compete to collect food
- Adjustable player and food count (up to 20,000 food, 8 players)
- Live scorecard, timer, and food left counter
- Modern, minimal, and highly interactive UI
- Resizable and draggable instructions window (press **I** or click the prompt)
- "Press I for instructions" prompt always visible in the UI
- Improved camera and navigation controls (see below)
- Player follow mode (click a player to follow)
- Run mode: press **R** to make all players move 8x faster
- Performance: automatic instancing for 15,000+ food items
- Beautiful procedural wall and ground visuals (sky/clouds, grass)
- Scientific inspiration: foraging theory, producer-scrounger models, ideal free distribution, marginal value theorem, and more!

## 🧑‍💻 Local Development & Deployment

1. **Clone the repo:**
   ```bash
   git clone <your-repo-url>
   cd buffet
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the app (development):**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.
4. **Build for production:**
   ```bash
   npm run build
   ```
   The output will be in the `dist/` directory, ready for deployment.

## 🎮 Controls
- **Set player and food count** in the top bar
- **Press Start** to begin the race
- **Press I** (or click the prompt) to toggle instructions
- **Watch the live scorecard** for results
- **Camera & Navigation:**
  - Mouse Left: Rotate camera
  - Mouse Right: Pan camera
  - Mouse Wheel: Zoom in/out
  - WASD / Arrow Keys: Move camera (FPS style)
  - Q / E: Rotate camera left/right (yaw)
  - Shift: Speed boost for camera movement
- **Player Controls:**
  - R: Toggle player run mode (8x speed)
  - Click a player: Follow that player

## 🖥️ UI/UX Improvements
- **Resizable, draggable instructions window** for easy reading
- **Instructions prompt** always visible (top left, next to title)
- **Food left counter** next to timer
- **Improved wall and ground visuals** (procedural sky/clouds, tiled grass)
- **Performance optimizations** for large food counts (instancing)

## 📚 Scientific & Educational Applications
- **Foraging Theory**: Study how agents search for and consume resources
- **Producer-Scrounger Models**: Explore social foraging and resource sharing
- **Ideal Free Distribution**: See how agents distribute themselves among patches
- **Marginal Value Theorem**: Understand patch-leaving decisions
- **Asset/Crowd Modeling**: Use as a base for 3D asset or crowd simulation
- **Natural Systems**: Model animal, human, or robot foraging, resource competition, and more!

## 📝 License
MIT

Enjoy exploring! 🌱🦉🦆🍎

# Foraging Algorithms: Buffet Race Experiment

This project is an interactive simulation and base template for exploring **foraging theory** and advanced AI resource management concepts, rendered with React and Three.js.

## What is Foraging Theory?
Foraging theory is a branch of behavioral ecology that studies how agents (animals, robots, or AI) search for and consume resources in a shared environment. It explores questions like:
- How do agents distribute themselves among food patches?
- When should an agent leave a depleted patch for a richer one?
- How do competition and cooperation affect resource intake?

These concepts are highly relevant to AI, robotics, and resource management systems.

## About This Project
- **Base Template:** This is a foundational template for building and experimenting with foraging theory algorithms in a 3D environment.
- **In Development:** Advanced foraging concepts and algorithms are actively being developed and will be added in future updates.
- **Instructions:** The in-app instructions also note that this is a base template and that advanced features are in progress.

## GitHub Repository
[Photon1c/ForagingTheory](https://github.com/Photon1c/ForagingTheory)

---

*This project is a starting point for foraging theory experiments. Contributions and feedback are welcome!*

