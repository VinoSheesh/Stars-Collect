// Import Phaser
const Phaser = window.Phaser

var scenePlay = new Phaser.Class({
  Extends: Phaser.Scene,

  initialize: function () {
    Phaser.Scene.call(this, { key: "scenePlay" })
    this.gameStarted = false
    this.currentLevel = 1
    this.gameFinished = false
    this.checkpointReached = false

    // PERBAIKAN: Posisi checkpoint yang lebih terlihat untuk semua level
    this.checkpoints = {
      1: { x: 750, y: 100 },
      2: { x: 650, y: 200 }, // Diperbaiki ke platform paling kanan atas
      3: { x: 750, y: 70 },
      4: { x: 700, y: 70 },
      5: { x: 750, y: 130 },
      6: { x: 200, y: 30 },
      7: { x: 750, y: 30 },
      8: { x: 400, y: 30 },
      9: { x: 400, y: 70 },
      10: { x: 500, y: 20 },
    }
  },

  preload: function () {
    this.load.setBaseURL("assets/")
    this.load.image("background", "images/BG.png")
    this.load.image("btn_play", "images/ButtonPlay.png")
    this.load.image("gameover", "images/GameOver.png")
    this.load.image("stars", "star.png")
    this.load.image("ground", "images/Tile50.png")

    // PERBAIKAN: Load checkpoint image dengan fallback
    this.load.image("checkpoint", "images/checkpoint.png")

    // FALLBACK: Jika gambar tidak ada, buat placeholder
    this.load.on("loaderror", (file) => {
      if (file.key === "checkpoint") {
        console.log("Checkpoint image not found, creating placeholder")
        this.createCheckpointPlaceholder()
      }
    })

    // Audio files
    this.load.audio("snd_coin", "audio/koin.mp3")
    this.load.audio("snd_lose", "audio/kalah.mp3")
    this.load.audio("snd_jump", "audio/lompat.mp3")
    this.load.audio("snd_leveling", "audio/ganti_level.mp3")
    this.load.audio("snd_walk", "audio/jalan.mp3")
    this.load.audio("snd_touch", "audio/touch.mp3")
    this.load.audio("music_play", "audio/music_play.mp3")

    // Character spritesheet
    this.load.spritesheet("char", "CharaSpriteAnim.png", {
      frameWidth: 44.8,
      frameHeight: 93,
    })
  },

  // TAMBAHAN: Buat placeholder checkpoint jika gambar tidak ada
  createCheckpointPlaceholder: function () {
    const graphics = this.add.graphics()
    graphics.fillStyle(0x00ff00)
    graphics.fillRect(0, 0, 32, 48)
    graphics.fillStyle(0xffffff)
    graphics.fillRect(4, 4, 24, 40)
    graphics.fillStyle(0x000000)
    graphics.fillRect(8, 8, 16, 32)
    this.textures.generate("checkpoint", { data: ["0"], pixelWidth: 32, pixelHeight: 48 })
    graphics.destroy()
  },

  create: function () {
    // Initialize game state
    this.gameStarted = false
    this.gameFinished = false
    this.checkpointReached = false
    this.starsCollected = 0
    this.totalStars = 0

    // PERBAIKAN: Buat placeholder checkpoint jika belum ada
    if (!this.textures.exists("checkpoint")) {
      this.createCheckpointPlaceholder()
    }

    // Setup sounds
    this.snd_coin = this.sound.add("snd_coin")
    this.snd_jump = this.sound.add("snd_jump")
    this.snd_leveling = this.sound.add("snd_leveling")
    this.snd_lose = this.sound.add("snd_lose")
    this.snd_touch = this.sound.add("snd_touch")
    this.snd_walk = this.sound.add("snd_walk", { loop: true, volume: 0 })
    this.snd_walk.play()

    this.music_play = this.sound.add("music_play", { loop: true })

    // Game dimensions
    this.gameWidth = 800
    this.gameHeight = 600

    // Add background
    this.add.image(this.gameWidth / 2, this.gameHeight / 2, "background")

    // Create UI
    this.createUI()

    // Create physics groups
    this.platforms = this.physics.add.staticGroup()
    this.stars = this.physics.add.group()

    // Create player
    this.createPlayer()

    // Create animations
    this.createAnimations()

    // Setup input
    this.cursors = this.input.keyboard.createCursorKeys()
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    // Create initial level
    this.createLevel()

    // Setup collisions
    this.setupCollisions()

    // Create start screen
    this.createStartScreen()

    // Initially pause physics
    this.physics.pause()

    this.jumpCoyoteTime = 0
    this.jumpCoyoteTimeMax = 6
  },

  createUI: function () {
    // Level text
    this.levelText = this.add.text(16, 16, "Level: 1", {
      fontSize: "24px",
      fill: "#000",
    })
    this.levelText.setDepth(10)

    // Stars counter
    this.starsText = this.add.text(16, 50, "Stars: 0/0", {
      fontSize: "24px",
      fill: "#000",
    })
    this.starsText.setDepth(10)

    // Checkpoint indicator
    this.checkpointText = this.add.text(16, 84, "Checkpoint: Not Reached", {
      fontSize: "18px",
      fill: "#ff0000",
    })
    this.checkpointText.setDepth(10)
  },

  createPlayer: function () {
    this.player = this.physics.add.sprite(100, 450, "char")
    this.player.setBounce(0.2)
    this.player.setCollideWorldBounds(true)

    // PERBAIKAN: Sesuaikan collision box agar tidak terpentok
    this.player.body.setSize(30, 80, true) // width, height, center
    this.player.body.setOffset(7, 13) // offset x, y untuk centering
  },

  createAnimations: function () {
    // Left animation
    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("char", { start: 0, end: 3 }),
      frameRate: 12,
      repeat: -1,
    })

    // Right animation
    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("char", { start: 5, end: 8 }),
      frameRate: 12,
      repeat: -1,
    })

    // Front/idle animation
    this.anims.create({
      key: "front",
      frames: [{ key: "char", frame: 4 }],
      frameRate: 20,
    })

    // Turn animation
    this.anims.create({
      key: "turn",
      frames: [{ key: "char", frame: 4 }],
      frameRate: 20,
    })
  },

  createStartScreen: function () {
    // Dark overlay
    this.darkenLayer = this.add.rectangle(
      this.gameWidth / 2,
      this.gameHeight / 2,
      this.gameWidth,
      this.gameHeight,
      0x000000,
    )
    this.darkenLayer.setDepth(10)
    this.darkenLayer.alpha = 0.5

    // Play button
    this.buttonPlay = this.add.image(this.gameWidth / 2, this.gameHeight / 2, "btn_play")
    this.buttonPlay.setDepth(10)
    this.buttonPlay.setInteractive({ useHandCursor: true })
    this.buttonPlay.setScale(0.8)

    // Button interactions
    this.buttonPlay.on("pointerdown", () => {
      this.buttonPlay.setTint(0x5a5a5a)
    })

    this.buttonPlay.on("pointerup", () => {
      this.buttonPlay.clearTint()
      this.startGame()
    })
  },

  startGame: function () {
    this.snd_touch.play()
    this.music_play.play()

    // Animate button disappearing
    this.tweens.add({
      targets: this.buttonPlay,
      ease: "Back.in",
      scaleX: 0,
      scaleY: 0,
      duration: 250,
    })

    // Fade out overlay
    this.tweens.add({
      delay: 150,
      targets: this.darkenLayer,
      duration: 250,
      alpha: 0,
      onComplete: () => {
        this.gameStarted = true
        this.physics.resume()
        this.darkenLayer.destroy()
        this.buttonPlay.destroy()
      },
    })
  },

  createLevel: function () {
    // PERBAIKAN: Clear existing elements dengan lebih thorough
    this.platforms.clear(true, true)
    this.stars.clear(true, true)

    // Clear checkpoint elements
    if (this.checkpointSprite) {
      this.checkpointSprite.destroy()
      this.checkpointSprite = null
    }
    if (this.checkpointIndicator) {
      this.checkpointIndicator.destroy()
      this.checkpointIndicator = null
    }

    // Reset player position
    this.player.setPosition(100, 450)
    this.player.clearTint()
    this.checkpointReached = false
    this.starsCollected = 0

    // Update UI
    this.levelText.setText("Level: " + this.currentLevel)
    this.checkpointText.setText("Checkpoint: Not Reached")
    this.checkpointText.setFill("#ff0000")

    // Create level layout
    this.createLevelLayout()

    // Create checkpoint
    this.createCheckpoint()

    // Update stars counter
    this.totalStars = this.stars.children.size
    this.starsText.setText("Stars: 0/" + this.totalStars)

    // PERBAIKAN: Setup collisions setelah semua objek dibuat
    this.setupCollisions()
  },

  createLevelLayout: function () {
    const levelLayouts = {
      1: {
        platforms: [
          { x: 50, y: 568 },
          { x: 150, y: 568 },
          { x: 250, y: 568 },
          { x: 350, y: 568 },
          { x: 450, y: 568 },
          { x: 550, y: 568 },
          { x: 650, y: 568 },
          { x: 750, y: 568 },
          { x: 200, y: 450 },
          { x: 400, y: 350 },
          { x: 600, y: 250 },
          { x: 750, y: 150 },
        ],
        stars: [
          { x: 100, y: 500 },
          { x: 300, y: 500 },
          { x: 200, y: 400 },
          { x: 400, y: 300 },
          { x: 600, y: 200 },
          { x: 750, y: 100 },
        ],
      },
      2: {
        platforms: [
          { x: 75, y: 568 },
          { x: 175, y: 568 },
          { x: 325, y: 568 },
          { x: 425, y: 568 },
          { x: 575, y: 568 },
          { x: 675, y: 568 },
          { x: 150, y: 450 },
          { x: 300, y: 380 },
          { x: 500, y: 320 },
          { x: 650, y: 250 },
          { x: 400, y: 180 },
        ],
        stars: [
          { x: 75, y: 500 },
          { x: 325, y: 500 },
          { x: 675, y: 500 },
          { x: 150, y: 400 },
          { x: 300, y: 330 },
          { x: 500, y: 270 },
          { x: 650, y: 200 },
          { x: 400, y: 130 },
        ],
      },
      3: {
        platforms: [
          { x: 100, y: 568 },
          { x: 200, y: 568 },
          { x: 150, y: 480 },
          { x: 250, y: 420 },
          { x: 350, y: 360 },
          { x: 450, y: 300 },
          { x: 550, y: 240 },
          { x: 650, y: 180 },
          { x: 750, y: 120 },
          { x: 600, y: 400 },
          { x: 500, y: 480 },
        ],
        stars: [
          { x: 100, y: 500 },
          { x: 150, y: 430 },
          { x: 250, y: 370 },
          { x: 350, y: 310 },
          { x: 450, y: 250 },
          { x: 550, y: 190 },
          { x: 650, y: 130 },
          { x: 750, y: 70 },
          { x: 600, y: 350 },
          { x: 550, y: 430 },
        ],
      },
      4: {
        platforms: [
          { x: 100, y: 568 },
          { x: 200, y: 568 },
          { x: 350, y: 480 },
          { x: 150, y: 400 },
          { x: 500, y: 350 },
          { x: 250, y: 280 },
          { x: 600, y: 220 },
          { x: 350, y: 160 },
          { x: 700, y: 120 },
          { x: 450, y: 400 },
          { x: 550, y: 480 },
        ],
        stars: [
          { x: 100, y: 500 },
          { x: 350, y: 430 },
          { x: 150, y: 350 },
          { x: 500, y: 300 },
          { x: 250, y: 230 },
          { x: 600, y: 170 },
          { x: 350, y: 110 },
          { x: 700, y: 70 },
          { x: 450, y: 350 },
          { x: 550, y: 430 },
        ],
      },
      5: {
        platforms: [
          { x: 100, y: 568 },
          { x: 200, y: 568 },
          { x: 350, y: 450 },
          { x: 500, y: 350 },
          { x: 650, y: 250 },
          { x: 300, y: 500 },
          { x: 450, y: 480 },
          { x: 600, y: 460 },
          { x: 400, y: 380 },
          { x: 550, y: 320 },
          { x: 750, y: 180 },
        ],
        stars: [
          { x: 100, y: 500 },
          { x: 350, y: 400 },
          { x: 500, y: 300 },
          { x: 650, y: 200 },
          { x: 300, y: 450 },
          { x: 450, y: 430 },
          { x: 600, y: 410 },
          { x: 400, y: 330 },
          { x: 550, y: 270 },
          { x: 750, y: 130 },
        ],
      },
      6: {
        platforms: [
          { x: 100, y: 568 },
          { x: 200, y: 568 },
          { x: 300, y: 568 },
          { x: 150, y: 480 },
          { x: 250, y: 480 },
          { x: 200, y: 400 },
          { x: 120, y: 320 },
          { x: 280, y: 320 },
          { x: 200, y: 240 },
          { x: 150, y: 160 },
          { x: 250, y: 160 },
          { x: 200, y: 80 },
          { x: 400, y: 450 },
          { x: 500, y: 350 },
          { x: 600, y: 250 },
          { x: 700, y: 150 },
        ],
        stars: [
          { x: 100, y: 500 },
          { x: 300, y: 500 },
          { x: 150, y: 430 },
          { x: 250, y: 430 },
          { x: 200, y: 350 },
          { x: 120, y: 270 },
          { x: 280, y: 270 },
          { x: 200, y: 190 },
          { x: 200, y: 30 },
          { x: 400, y: 400 },
          { x: 500, y: 300 },
          { x: 600, y: 200 },
          { x: 750, y: 100 },
        ],
      },
      7: {
        platforms: [
          { x: 75, y: 568 },
          { x: 175, y: 568 },
          { x: 300, y: 480 },
          { x: 380, y: 420 },
          { x: 460, y: 360 },
          { x: 540, y: 300 },
          { x: 620, y: 240 },
          { x: 700, y: 180 },
          { x: 250, y: 400 },
          { x: 350, y: 320 },
          { x: 450, y: 240 },
          { x: 550, y: 160 },
          { x: 650, y: 100 },
          { x: 750, y: 80 },
        ],
        stars: [
          { x: 75, y: 500 },
          { x: 175, y: 500 },
          { x: 300, y: 430 },
          { x: 380, y: 370 },
          { x: 460, y: 310 },
          { x: 540, y: 250 },
          { x: 620, y: 190 },
          { x: 700, y: 130 },
          { x: 250, y: 350 },
          { x: 350, y: 270 },
          { x: 450, y: 190 },
          { x: 550, y: 110 },
          { x: 650, y: 50 },
          { x: 750, y: 30 },
        ],
      },
      8: {
        platforms: [
          { x: 100, y: 568 },
          { x: 200, y: 568 },
          { x: 700, y: 568 },
          { x: 350, y: 500 },
          { x: 450, y: 500 },
          { x: 550, y: 500 },
          { x: 150, y: 420 },
          { x: 300, y: 380 },
          { x: 500, y: 380 },
          { x: 650, y: 420 },
          { x: 200, y: 300 },
          { x: 400, y: 260 },
          { x: 600, y: 300 },
          { x: 300, y: 180 },
          { x: 500, y: 140 },
          { x: 400, y: 80 },
        ],
        stars: [
          { x: 100, y: 500 },
          { x: 200, y: 500 },
          { x: 350, y: 450 },
          { x: 450, y: 450 },
          { x: 550, y: 450 },
          { x: 700, y: 500 },
          { x: 150, y: 370 },
          { x: 300, y: 330 },
          { x: 500, y: 330 },
          { x: 650, y: 370 },
          { x: 200, y: 250 },
          { x: 400, y: 210 },
          { x: 600, y: 250 },
          { x: 300, y: 130 },
          { x: 500, y: 90 },
          { x: 400, y: 30 },
        ],
      },
      9: {
        platforms: [
          { x: 100, y: 568 },
          { x: 200, y: 500 },
          { x: 280, y: 450 },
          { x: 360, y: 400 },
          { x: 440, y: 350 },
          { x: 520, y: 300 },
          { x: 600, y: 250 },
          { x: 680, y: 200 },
          { x: 750, y: 150 },
          { x: 150, y: 380 },
          { x: 250, y: 320 },
          { x: 350, y: 260 },
          { x: 450, y: 200 },
          { x: 550, y: 140 },
          { x: 650, y: 100 },
          { x: 700, y: 80 },
          { x: 400, y: 120 },
        ],
        stars: [
          { x: 100, y: 500 },
          { x: 200, y: 450 },
          { x: 280, y: 400 },
          { x: 360, y: 350 },
          { x: 440, y: 300 },
          { x: 520, y: 250 },
          { x: 600, y: 200 },
          { x: 680, y: 150 },
          { x: 750, y: 100 },
          { x: 150, y: 330 },
          { x: 250, y: 270 },
          { x: 350, y: 210 },
          { x: 450, y: 150 },
          { x: 550, y: 90 },
          { x: 650, y: 50 },
          { x: 700, y: 30 },
          { x: 400, y: 70 },
        ],
      },
      10: {
        platforms: [
          { x: 100, y: 568 },
          { x: 200, y: 568 },
          { x: 300, y: 500 },
          { x: 150, y: 450 },
          { x: 450, y: 420 },
          { x: 100, y: 370 },
          { x: 500, y: 350 },
          { x: 200, y: 300 },
          { x: 600, y: 280 },
          { x: 250, y: 230 },
          { x: 650, y: 210 },
          { x: 350, y: 180 },
          { x: 450, y: 150 },
          { x: 550, y: 120 },
          { x: 400, y: 80 },
          { x: 500, y: 50 },
          { x: 50, y: 320 },
          { x: 750, y: 340 },
          { x: 700, y: 160 },
          { x: 300, y: 100 },
        ],
        stars: [
          { x: 100, y: 500 },
          { x: 200, y: 500 },
          { x: 300, y: 450 },
          { x: 150, y: 400 },
          { x: 450, y: 370 },
          { x: 100, y: 320 },
          { x: 500, y: 300 },
          { x: 200, y: 250 },
          { x: 600, y: 230 },
          { x: 250, y: 180 },
          { x: 650, y: 160 },
          { x: 350, y: 130 },
          { x: 450, y: 100 },
          { x: 550, y: 70 },
          { x: 400, y: 30 },
          { x: 500, y: 20 },
          { x: 50, y: 320 },
          { x: 750, y: 340 },
          { x: 700, y: 160 },
          { x: 300, y: 100 },
        ],
      },
    }

    const layout = levelLayouts[this.currentLevel] || levelLayouts[1]

    // Create platforms
    layout.platforms.forEach((platform) => {
      const platformSprite = this.platforms.create(platform.x, platform.y, "ground")
      platformSprite.setScale(1).refreshBody()
      platformSprite.body.setSize(platformSprite.width, platformSprite.height * 0.7, true)
      platformSprite.body.setOffset(0, platformSprite.height * 0.3)
    })

    // Create stars
    layout.stars.forEach((star) => {
      const starSprite = this.stars.create(star.x, star.y, "stars")
      starSprite.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8))
      starSprite.setScale(0.1)
    })
  },

  createCheckpoint: function () {
    const checkpoint = this.checkpoints[this.currentLevel]
    console.log(`Creating checkpoint for level ${this.currentLevel} at:`, checkpoint)

    // PERBAIKAN: Buat checkpoint dengan error handling
    try {
      this.checkpointSprite = this.physics.add.sprite(checkpoint.x, checkpoint.y - 25, "checkpoint")
      this.checkpointSprite.setScale(0.8)
      this.checkpointSprite.body.allowGravity = false
      this.checkpointSprite.setTint(0xff0000)
      this.checkpointSprite.body.setImmovable(true)

      console.log("Checkpoint sprite created successfully")

      // TAMBAHAN: Efek pulsing
      this.tweens.add({
        targets: this.checkpointSprite,
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      })

      // TAMBAHAN: Indikator checkpoint
      this.checkpointIndicator = this.add.text(checkpoint.x, checkpoint.y - 60, "⬇️ CHECKPOINT", {
        fontSize: "14px",
        fill: "#ff0000",
        backgroundColor: "#ffffff80",
        padding: { x: 5, y: 2 },
      })
      this.checkpointIndicator.setOrigin(0.5)
      this.checkpointIndicator.setDepth(5)
    } catch (error) {
      console.error("Error creating checkpoint:", error)
      // Fallback: buat checkpoint sederhana
      this.checkpointSprite = this.add.rectangle(checkpoint.x, checkpoint.y - 25, 32, 48, 0xff0000)
      this.physics.add.existing(this.checkpointSprite, true) // true = static body
    }
  },

  setupCollisions: function () {
    // Clear existing collisions
    if (this.playerPlatformCollider) this.playerPlatformCollider.destroy()
    if (this.starPlatformCollider) this.starPlatformCollider.destroy()
    if (this.starCollectOverlap) this.starCollectOverlap.destroy()
    if (this.checkpointOverlap) this.checkpointOverlap.destroy()

    // Create new collisions
    this.playerPlatformCollider = this.physics.add.collider(this.player, this.platforms)
    this.starPlatformCollider = this.physics.add.collider(this.stars, this.platforms)
    this.starCollectOverlap = this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this)

    // PERBAIKAN: Checkpoint collision dengan error handling
    if (this.checkpointSprite && this.checkpointSprite.body) {
      this.checkpointOverlap = this.physics.add.overlap(
        this.player,
        this.checkpointSprite,
        this.reachCheckpoint,
        null,
        this,
      )
      console.log("Checkpoint collision setup complete")
    } else {
      console.warn("Checkpoint sprite or body not found for collision setup")
    }
  },

  reachCheckpoint: function (player, checkpoint) {
    console.log("Checkpoint collision detected!")

    if (!this.checkpointReached) {
      this.checkpointReached = true
      checkpoint.setTint(0x00ff00)
      this.snd_touch.play()

      // Update UI
      this.checkpointText.setText("Checkpoint: Reached!")
      this.checkpointText.setFill("#00ff00")

      // Update checkpoint indicator
      if (this.checkpointIndicator) {
        this.checkpointIndicator.setText("✅ REACHED!")
        this.checkpointIndicator.setFill("#00ff00")
      }

      // Visual feedback
      const checkpointFeedback = this.add.text(checkpoint.x, checkpoint.y - 50, "Checkpoint!", {
        fontSize: "16px",
        fill: "#00FF00",
        backgroundColor: "#00000080",
        padding: { x: 8, y: 4 },
      })
      checkpointFeedback.setOrigin(0.5)
      checkpointFeedback.setDepth(10)

      // Animate feedback
      this.tweens.add({
        targets: checkpointFeedback,
        y: checkpointFeedback.y - 30,
        alpha: 0,
        duration: 1500,
        onComplete: () => {
          checkpointFeedback.destroy()
        },
      })

      // Check level completion
      this.checkLevelCompletion()
    }
  },

  collectStar: function (player, star) {
    star.disableBody(true, true)
    this.starsCollected++
    this.snd_coin.play()

    // Update UI
    this.starsText.setText("Stars: " + this.starsCollected + "/" + this.totalStars)

    // Check level completion
    this.checkLevelCompletion()
  },

  checkLevelCompletion: function () {
    if (this.starsCollected >= this.totalStars && this.checkpointReached) {
      this.time.delayedCall(500, () => {
        if (this.currentLevel < 10) {
          this.nextLevel()
        } else {
          this.gameFinished = true
          this.showGameComplete()
        }
      })
    }
  },

  nextLevel: function () {
    this.currentLevel++
    this.snd_leveling.play()
    this.gameStarted = false
    this.physics.pause()

    const levelTransition = this.add.text(this.gameWidth / 2, this.gameHeight / 2, "Level " + this.currentLevel, {
      fontSize: "48px",
      fill: "#FFD700",
    })
    levelTransition.setOrigin(0.5)
    levelTransition.setDepth(20)

    this.tweens.add({
      targets: levelTransition,
      duration: 1500,
      alpha: 0,
      onComplete: () => {
        levelTransition.destroy()
        this.createLevel()
        this.gameStarted = true
        this.physics.resume()
      },
    })
  },

  showGameComplete: function () {
    this.physics.pause()
    this.music_play.stop()

    const completeText = this.add.text(
      this.gameWidth / 2,
      this.gameHeight / 2,
      "🎉 GAME COMPLETE! 🎉\nYou finished all 10 levels!\nPress SPACE to restart",
      {
        fontSize: "36px",
        fill: "#00FF00",
        align: "center",
      },
    )
    completeText.setOrigin(0.5)
    completeText.setDepth(20)

    // Celebration effect
    for (let i = 0; i < 20; i++) {
      this.time.delayedCall(i * 100, () => {
        const firework = this.add.circle(
          Phaser.Math.Between(100, 700),
          Phaser.Math.Between(100, 400),
          Phaser.Math.Between(5, 15),
          Phaser.Math.Between(0x000000, 0xffffff),
        )
        firework.setDepth(15)

        this.time.delayedCall(2000, () => {
          firework.destroy()
        })
      })
    }
  },

  gameOver: function () {
    this.physics.pause()
    this.gameStarted = false
    this.snd_lose.play()
    this.music_play.stop()

    this.player.setTint(0xff0000)

    const gameOverImage = this.add.image(this.gameWidth / 2, this.gameHeight / 2, "gameover")
    gameOverImage.setScale(0.5)
    gameOverImage.setDepth(20)

    const restartText = this.add.text(this.gameWidth / 2, this.gameHeight / 2 + 100, "Press SPACE to restart level", {
      fontSize: "24px",
      fill: "#fff",
    })
    restartText.setOrigin(0.5)
    restartText.setDepth(20)
  },

  restartLevel: function () {
    this.player.clearTint()
    this.createLevel()
    this.gameStarted = true
    this.physics.resume()
    this.music_play.play()

    this.children.list.forEach((child) => {
      if (child.depth === 20) {
        child.destroy()
      }
    })
  },

  restartGame: function () {
    this.currentLevel = 1
    this.gameFinished = false
    this.restartLevel()
  },

  update: function () {
    if (!this.gameStarted || this.gameFinished) {
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        if (this.gameFinished) {
          this.restartGame()
        } else {
          this.restartLevel()
        }
      }
      return
    }

    // Player movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-220)
      this.player.anims.play("left", true)
      this.snd_walk.setVolume(0.5)
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(220)
      this.player.anims.play("right", true)
      this.snd_walk.setVolume(0.5)
    } else {
      this.player.setVelocityX(0)
      this.player.anims.play("front")
      this.snd_walk.setVolume(0)
    }

    // Coyote time for better jumping
    if (this.player.body.touching.down) {
      this.jumpCoyoteTime = this.jumpCoyoteTimeMax
    } else if (this.jumpCoyoteTime > 0) {
      this.jumpCoyoteTime--
    }

    // Jumping with coyote time
    if (this.cursors.up.isDown && this.jumpCoyoteTime > 0) {
      this.player.setVelocityY(-680)
      this.jumpCoyoteTime = 0
      this.snd_jump.play()
    }

    // Check for void death
    if (this.player.y > this.gameHeight) {
      this.gameOver()
    }
  },
})

// Game configuration
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game-container",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 800 },
      debug: false, // Set ke true untuk debug collision boxes
    },
  },
  scene: scenePlay,
}

// Start the game
const game = new Phaser.Game(config)
