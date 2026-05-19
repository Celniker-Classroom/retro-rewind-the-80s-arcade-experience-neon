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

  if (state === "title") {
    titleScreen();
  } else if (state === "play") {
    playGame();
  } else if (state === "gameover") {
    gameOverScreen();
  } else if (state === "win") {
    winScreen();
  }
}

function titleScreen() {
  drawGrid();

  fill(0, 255, 255);
  textAlign(CENTER);
  textSize(42);
  text("NEON GOBBLER", width / 2, 115);

  fill(255, 0, 255);
  textSize(18);
  text("Pac-Man Inspired Arcade Chase", width / 2, 155);

  fill(255);
  textSize(16);
  text("Collect pellets. Avoid ghosts.", width / 2, 230);
  text("Grab power cores to eat ghosts.", width / 2, 255);
  text("Move with Arrow Keys or WASD.", width / 2, 280);

  fill(255, 255, 0);
  textSize(20);
  text("PRESS SPACE TO START", width / 2, 350);

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

  walls = new Group();
  pellets = new Group();
  powerUps = new Group();
  enemies = new Group();

  makeMaze();

  state = "play";
}

function makeMaze() {
  let tile = 32;

  let maze = [
    "11111111111111111111",
    "1P.....1......1....O1",
    "1.111..1.111..1.111.1",
    "1..................1",
    "1.111.11111111.111.1",
    "1......1....1......1",
    "11111..1.E..1..11111",
    "1......1....1......1",
    "1.111.11111111.111.1",
    "1..................1",
    "1.111..1.111..1.111.1",
    "1O....E1......1.....1",
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
        wall.color = "blue";
        walls.add(wall);
      }

      if (spot === "." || spot === "P" || spot === "E") {
        let pellet = new Sprite(x, y, 8, 8, "static");
        pellet.color = "yellow";
        pellets.add(pellet);
      }

      if (spot === "O") {
        let p = new Sprite(x, y, 18, 18, "static");
        p.color = "cyan";
        powerUps.add(p);
      }

      if (spot === "P") {
        player = new Sprite(x, y, 24, 24, "dynamic");
        player.color = "yellow";
        player.rotationLock = true;
      }

      if (spot === "E") {
        let enemy = new Sprite(x, y, 24, 24, "dynamic");
        enemy.color = "magenta";
        enemy.rotationLock = true;
        enemy.homeX = x;
        enemy.homeY = y;
        enemies.add(enemy);
      }
    }
  }
}

function playGame() {
  drawHUD();

  movePlayer();
  moveEnemies();

  player.collides(walls);
  enemies.collides(walls);

  player.overlaps(pellets, collectPellet);
  player.overlaps(powerUps, collectPowerUp);
  player.overlaps(enemies, touchGhost);

  if (poweredUp) {
    powerTimer--;

    for (let enemy of enemies) {
      enemy.color = "cyan";
    }

    if (powerTimer <= 0) {
      poweredUp = false;

      for (let enemy of enemies) {
        enemy.color = "magenta";
      }
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

    if (poweredUp) {
      dx = enemy.x - player.x;
      dy = enemy.y - player.y;
      enemy.speed = 1.7;
    } else {
      enemy.speed = 2.1;
    }

    if (abs(dx) > abs(dy)) {
      if (dx > 0) {
        enemy.vel.x = enemy.speed;
        enemy.vel.y = 0;
      } else {
        enemy.vel.x = -enemy.speed;
        enemy.vel.y = 0;
      }
    } else {
      if (dy > 0) {
        enemy.vel.y = enemy.speed;
        enemy.vel.x = 0;
      } else {
        enemy.vel.y = -enemy.speed;
        enemy.vel.x = 0;
      }
    }

    if (random() < 0.015) {
      enemy.vel.x = random([-enemy.speed, enemy.speed, 0]);
      enemy.vel.y = random([-enemy.speed, enemy.speed, 0]);
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

  for (let enemy of enemies) {
    enemy.color = "cyan";
  }
}

function touchGhost(playerSprite, enemySprite) {
  if (poweredUp) {
    score += 200;

    enemySprite.x = enemySprite.homeX;
    enemySprite.y = enemySprite.homeY;
    enemySprite.vel.x = 0;
    enemySprite.vel.y = 0;
  } else {
    lives--;

    player.x = 48;
    player.y = 48;
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

  fill(255, 255, 0);
  textAlign(RIGHT);
  text("LEFT: " + (pellets.length + powerUps.length), width - 15, 24);
}

function gameOverScreen() {
  clearGame();
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
  clearGame();
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