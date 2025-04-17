const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);

let player;
let stars;
let platforms;
let score = 0;
let scoreText;

function preload() {
  this.load.image("sky", "assets/sky.jpg");
  this.load.image("ground", "assets/platform.png");
  this.load.image("star", "assets/star.png");
  this.load.spritesheet("dude", "assets/bayu.png", {
    frameWidth: 100,
    frameHeight: 100,
  });
}

function create() {
  // Background
  this.add.image(400, 300, "sky");

  // Platforms
  platforms = this.physics.add.staticGroup();
  platforms.create(400, 568, "ground").setScale(0.1).refreshBody(); // Lebar 100%, tinggi 50%
  platforms.create(600, 400, "ground").setScale(0.1).refreshBody(); // 50% dari ukuran asli
  platforms.create(50, 250, "ground").setScale(0.1).refreshBody();
  platforms.create(750, 220, "ground").setScale(0.1).refreshBody();

  // Player
  player = this.physics.add.sprite(100,10, "dude").setScale(1.5 );
  player.setBounce(0.2);
  player.setCollideWorldBounds(true);

  this.anims.create({
    key: "left",
    frames: [{ key: "dude", frame: 0 }],
    frameRate: 10,
  });
  
  this.anims.create({
    key: "turn",
    frames: [{ key: "dude", frame: 0 }],
    frameRate: 10,
  });
  
  this.anims.create({
    key: "right",
    frames: [{ key: "dude", frame: 1 }],
    frameRate: 10,
  });
  
  

  // Stars
  stars = this.physics.add.group({
    key: "star",
    repeat: 11,
    setXY: { x: 12, y: 0, stepX: 70 },
  });

  stars.children.iterate(function (child) {
    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    child.setScale(0.1);
  });

  // Score
  scoreText = this.add.text(16, 16, "Score: 0", {
    fontSize: "32px",
    fill: "#000",
  });

  // Colliders
  this.physics.add.collider(player, platforms);
  this.physics.add.collider(stars, platforms);
  this.physics.add.overlap(player, stars, collectStar, null, this);
}

function update() {
  const cursors = this.input.keyboard.createCursorKeys();

  if (cursors.left.isDown) {
    player.setVelocityX(-160);
    player.anims.play("left", true);
  } else if (cursors.right.isDown) {
    player.setVelocityX(160);
    player.anims.play("right", true);
  } else {
    player.setVelocityX(0);
    player.anims.play("turn");
  }

  if (cursors.up.isDown && player.body.touching.down) {
    player.setVelocityY(-330);
  }
}

function collectStar(player, star) {
  star.disableBody(true, true);
  score += 10;
  scoreText.setText("Score: " + score);

  if (stars.countActive(true) === 0) {
    stars.children.iterate(function (child) {
      child.enableBody(true, child.x, 0, true, true);
    });
  }
}
