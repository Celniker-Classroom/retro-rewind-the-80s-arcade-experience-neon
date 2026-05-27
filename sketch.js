let state = "title";

let player;
let walls;
let pellets;
let powerUps;
let enemies;

let score = 0;
let lives = 3;
let poweredUp = false;
let powerTimer = 0;

let revealTimer = 0;
let ghostsRevealed = false;

function setup() {
  new Canvas(640, 480);
  world.gravity.y = 0;
  textFont("monospace");

  walls = new Group();
  pellets = new Group();
  powerUps = new Group();
  enemies = new Group();
}

function draw() {
  background(5, 0, 20);

  if (state === "title") titleScreen();
  else if (state === "about") aboutScreen();
  else if (state === "play") playGame();
  else if (state === "gameover") gameOverScreen();
  else if (state === "win") winScreen();
}

function titleScreen() {
  drawGrid();

  fill(0, 255, 255);
  textAlign(CENTER);
  textSize(42);
  text("NEON GOBBLER", width / 2, 115);

  drawGreenGlob(width / 2 - 110, 210, 70);
  drawPurpleGlob(width / 2 + 110, 210, 70, false);

  fill(255);
  textSize(16);
  text("Collect pellets. Avoid purple globs.", width / 2, 305);
  text("Power up or survive 30 seconds to eat them.", width / 2, 330);

  fill(255, 255, 0);
  textSize(20);
  text("PRESS SPACE TO START", width / 2, 385);

  if (kb.presses("space")) {
    state = "about";
  }
}

function aboutScreen() {
  drawGrid();

  // Title
  fill(0, 255, 255);
  textAlign(CENTER);
  textSize(28);
  text("ABOUT NEON GOBBLER", width / 2, 60);

  // Divider line
  stroke(0, 255, 255);
  strokeWeight(1);
  line(40, 75, width - 40, 75);
  noStroke();

  // Inspiration paragraph — wrapped into lines that fit the canvas
  fill(200, 200, 255);
  textSize(13);
  textAlign(LEFT);

  let lines = [
    "Neon Gobbler was directly inspired by the 1980 arcade",
    "classic Pac-Man, developed by Namco and widely regarded",
    "as one of the most iconic games of the Golden Age of",
    "arcades. Like Pac-Man, the core loop revolves around",
    "navigating a maze, collecting pellets, and avoiding",
    "ghost-like enemies that chase the player. I adapted this",
    "formula by replacing traditional pixel sprites with glowing",
    "blob-shaped characters rendered in neon colors to give the",
    "game a distinct synthwave aesthetic inspired by 80s visual",
    "culture. Rather than the standard power pellet mechanic",
    "that immediately empowers the player, I introduced a",
    "30-second countdown timer that forces ghosts to reveal",
    "themselves and become vulnerable — adding suspense and",
    "strategic patience that rewards survival over aggression.",
    "The result honors the addictive arcade spirit while putting",
    "a fresh twist on one of its most beloved mechanics."
  ];

  let startY = 105;
  let lineH = 22;
  for (let i = 0; i < lines.length; i++) {
    text(lines[i], 45, startY + i * lineH);
  }

  // Prompt
  fill(255, 255, 0);
  textAlign(CENTER);
  textSize(18);
  text("PRESS SPACE TO PLAY", width / 2, 460);

  if (kb.presses("space")) {
    startGame();
  }
}

function startGame() {
  clearGame();

  score = 0;
  lives = 3;
  poweredUp = false;
  powerTimer = 0;

  revealTimer = 60 * 30;
  ghostsRevealed = false;

  walls = new Group();
  pellets = new Group();
  powerUps = new Group();
  enemies = new Group();

  makeMaze();

  state = "play";
}

let playerSpawnX = 48;
let playerSpawnY = 48;

function makeMaze() {
  let tile = 32;

  let maze = [
    "11111111111111111111",
    "1P.....1......1....O",
    "1.111..1.111..1.1111",
    "1..................1",
    "1.111.11111111.111.1",
    "1......1....1......1",
    "11111..1.E..1..11111",
    "1......1....1......1",
    "1.111.11111111.111.1",
    "1..................1",
    "1.111..1.111..1.1111",
    "1O....E1......1....1",
    "1.111111.11.111111.1",
    "1..................O1",
    "11111111111111111111"
  ];

  for (let row = 0; row < maze.length; row++) {
    for (let col = 0; col < maze[row].length; col++) {
      let x = col * tile + tile / 2;
      let y = row * tile + tile / 2;
      let spot = maze[row][col];

      if (spot === "1") {
        let wall = new Sprite(x, y, tile, tile, "static");
        wall.color = color(0, 60, 255);
        walls.add(wall);
      }

      if (spot === "." || spot === "P" || spot === "E") {
        let pellet = new Sprite(x, y, 8, 8, "static");
        pellet.color = color(255, 230, 90);
        pellets.add(pellet);
      }

      if (spot === "O") {
        let p = new Sprite(x, y, 18, 18, "static");
        p.color = color(0, 255, 255);
        powerUps.add(p);
      }

      if (spot === "P") {
        player = new Sprite(x, y, 28, 28, "dynamic");
        player.rotationLock = true;
        playerSpawnX = x;
        playerSpawnY = y;
        player.draw = function () {
          drawGreenGlob(0, 0, 32);
        };
      }

      if (spot === "E") {
        let enemy = new Sprite(x, y, 30, 30, "dynamic");
        enemy.rotationLock = true;
        enemy.homeX = x;
        enemy.homeY = y;
        enemy.draw = function () {
          drawPurpleGlob(0, 0, 34, poweredUp || ghostsRevealed);
        };
        enemies.add(enemy);
      }
    }
  }
}

function playGame() {
  drawHUD();

  revealTimer--;

  if (revealTimer <= 0) {
    ghostsRevealed = true;
  }

  movePlayer();
  moveEnemies();

  player.collides(walls);
  enemies.collides(walls);

  player.overlaps(pellets, collectPellet);
  player.overlaps(powerUps, collectPowerUp);
  player.overlaps(enemies, touchGhost);

  if (poweredUp) {
    powerTimer--;

    if (powerTimer <= 0) {
      poweredUp = false;
    }
  }

  if (pellets.length === 0 && powerUps.length === 0) {
    state = "win";
  }
}

function movePlayer() {
  player.vel.x = 0;
  player.vel.y = 0;

  if (kb.pressing("left") || kb.pressing("a")) {
    player.vel.x = -3.2;
  }

  if (kb.pressing("right") || kb.pressing("d")) {
    player.vel.x = 3.2;
  }

  if (kb.pressing("up") || kb.pressing("w")) {
    player.vel.y = -3.2;
  }

  if (kb.pressing("down") || kb.pressing("s")) {
    player.vel.y = 3.2;
  }
}

function moveEnemies() {
  for (let enemy of enemies) {
    let dx = player.x - enemy.x;
    let dy = player.y - enemy.y;

    if (poweredUp || ghostsRevealed) {
      dx = enemy.x - player.x;
      dy = enemy.y - player.y;
      enemy.speed = 1.6;
    } else {
      enemy.speed = 2.15;
    }

    if (abs(dx) > abs(dy)) {
      enemy.vel.x = dx > 0 ? enemy.speed : -enemy.speed;
      enemy.vel.y = 0;
    } else {
      enemy.vel.y = dy > 0 ? enemy.speed : -enemy.speed;
      enemy.vel.x = 0;
    }
  }
}

function collectPellet(playerSprite, pelletSprite) {
  pelletSprite.remove();
  score += 10;
}

function collectPowerUp(playerSprite, powerSprite) {
  powerSprite.remove();
  score += 50;
  poweredUp = true;
  powerTimer = 420;
}

function touchGhost(playerSprite, enemySprite) {
  if (poweredUp || ghostsRevealed) {
    score += 200;
    enemySprite.remove();
  } else {
    lives--;

    player.x = playerSpawnX;
    player.y = playerSpawnY;
    player.vel.x = 0;
    player.vel.y = 0;

    if (lives <= 0) {
      state = "gameover";
    }
  }
}

function drawHUD() {
  fill(255);
  textAlign(LEFT);
  textSize(16);
  text("SCORE: " + score, 15, 24);
  text("LIVES: " + lives, 150, 24);

  if (poweredUp) {
    fill(0, 255, 255);
    text("POWER: " + ceil(powerTimer / 60), 250, 24);
  }

  if (!ghostsRevealed) {
    fill(180, 80, 255);
    textAlign(CENTER);
    text("GHOSTS REVEAL IN: " + ceil(revealTimer / 60), width / 2, 46);
  } else {
    fill(0, 255, 120);
    textAlign(CENTER);
    text("GHOSTS REVEALED - EAT THEM!", width / 2, 46);
  }

  fill(255, 255, 0);
  textAlign(RIGHT);
  text("LEFT: " + (pellets.length + powerUps.length + enemies.length), width - 15, 24);
}

function drawGreenGlob(x, y, s) {
  push();
  translate(x, y);

  noStroke();

  fill(0, 200, 75);
  ellipse(0, 3, s, s * 0.82);

  fill(0, 255, 120);
  ellipse(-5, -5, s * 0.7, s * 0.55);

  fill(130, 255, 180);
  ellipse(-9, -10, s * 0.22, s * 0.13);

  fill(255);
  circle(-6, -2, s * 0.22);
  circle(6, -2, s * 0.22);

  fill(0);
  circle(-5, -1, s * 0.09);
  circle(7, -1, s * 0.09);

  stroke(0);
  strokeWeight(2);
  noFill();
  arc(0, 7, s * 0.35, s * 0.2, 0, PI);

  pop();
}

function drawPurpleGlob(x, y, s, edible) {
  push();
  translate(x, y);

  noStroke();

  if (edible) {
    fill(50, 230, 255);
  } else {
    fill(140, 30, 240);
  }

  ellipse(0, 3, s, s * 0.82);

  if (edible) {
    fill(140, 255, 255);
  } else {
    fill(210, 80, 255);
  }

  ellipse(-5, -6, s * 0.7, s * 0.5);

  fill(255);
  circle(-6, -2, s * 0.22);
  circle(6, -2, s * 0.22);

  fill(0);
  circle(-5, -1, s * 0.09);
  circle(7, -1, s * 0.09);

  stroke(0);
  strokeWeight(2);
  noFill();

  if (edible) {
    arc(0, 9, s * 0.35, s * 0.22, PI, TWO_PI);
  } else {
    arc(0, 7, s * 0.35, s * 0.2, 0, PI);
  }

  pop();
}

function gameOverScreen() {
  if (player) clearGame();
  drawGrid();

  fill(255, 0, 80);
  textAlign(CENTER);
  textSize(44);
  text("GAME OVER", width / 2, 160);

  fill(255);
  textSize(22);
  text("FINAL SCORE: " + score, width / 2, 230);

  fill(0, 255, 255);
  textSize(18);
  text("PRESS SPACE TO RESTART", width / 2, 320);

  if (kb.presses("space")) {
    startGame();
  }
}

function winScreen() {
  if (player) clearGame();
  drawGrid();

  fill(0, 255, 120);
  textAlign(CENTER);
  textSize(34);
  text("YOU CLEARED THE ARCADE!", width / 2, 160);

  fill(255);
  textSize(22);
  text("FINAL SCORE: " + score, width / 2, 230);

  fill(255, 255, 0);
  textSize(18);
  text("PRESS SPACE TO RESTART", width / 2, 320);

  if (kb.presses("space")) {
    startGame();
  }
}

function drawGrid() {
  stroke(80, 0, 130);

  for (let y = 0; y < height; y += 30) {
    line(0, y, width, y);
  }

  for (let x = 0; x < width; x += 30) {
    line(x, 0, x, height);
  }

  noStroke();
}

function clearGame() {
  if (player) player.remove();
  if (walls) walls.removeAll();
  if (pellets) pellets.removeAll();
  if (powerUps) powerUps.removeAll();
  if (enemies) enemies.removeAll();
}