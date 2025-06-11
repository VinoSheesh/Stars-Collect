// Global Game State
const gameState = {
  level: 5,
  lives: 3,
  score: 0,
  totalStars: 0,
  starsCollected: 0,
  maxLevel: 5,
  audioEnabled: true,
  volume: 0.7,
  backgroundMusic: null,
  sounds: {},
}

// Declare Phaser variable
const Phaser = window.Phaser

// Audio Manager Class - Fixed to prevent double playing
class AudioManager {
  constructor(scene) {
    this.scene = scene
    this.sounds = {}
    this.backgroundMusic = null
    this.walkingSound = null
    this.isWalking = false
    this.musicStarted = false
  }

  preloadSounds() {
    // Create placeholder audio using Web Audio API
    this.createPlaceholderAudio()
  }

  createPlaceholderAudio() {
    // Create audio context for sound generation
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }

  createSounds() {
    // Create sound objects with placeholder sounds
    this.sounds.walking = { play: () => this.playTone(200, 0.1), stop: () => {}, setVolume: () => {} }
    this.sounds.jump = { play: () => this.playTone(400, 0.2), setVolume: () => {} }
    this.sounds.collect = { play: () => this.playTone(800, 0.3), setVolume: () => {} }
    this.sounds.levelChange = { play: () => this.playMelody([523, 659, 784], 0.5), setVolume: () => {} }
    this.sounds.gameOver = { play: () => this.playMelody([400, 300, 200], 0.8), setVolume: () => {} }
    this.sounds.touch = { play: () => this.playTone(600, 0.1), setVolume: () => {} }

    // Background music placeholder
    this.backgroundMusic = {
      play: () => {
        if (!this.musicStarted && gameState.audioEnabled) {
          this.playBackgroundLoop()
          this.musicStarted = true
        }
      },
      stop: () => {
        this.musicStarted = false
        if (this.bgMusicInterval) {
          clearInterval(this.bgMusicInterval)
        }
      },
      setVolume: () => {},
    }
  }

  playTone(frequency, duration) {
    if (!gameState.audioEnabled || !this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)
    oscillator.type = "square"

    gainNode.gain.setValueAtTime(gameState.volume * 0.1, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + duration)
  }

  playMelody(frequencies, duration) {
    if (!gameState.audioEnabled) return

    frequencies.forEach((freq, index) => {
      setTimeout(
        () => {
          this.playTone(freq, duration / frequencies.length)
        },
        (index * (duration * 1000)) / frequencies.length,
      )
    })
  }

  playBackgroundLoop() {
    if (!gameState.audioEnabled) return

    const melody = [523, 659, 784, 659, 523, 440, 523]
    let noteIndex = 0

    this.bgMusicInterval = setInterval(() => {
      if (gameState.audioEnabled && this.musicStarted) {
        this.playTone(melody[noteIndex], 0.5)
        noteIndex = (noteIndex + 1) % melody.length
      }
    }, 600)
  }

  playSound(soundName) {
    if (!gameState.audioEnabled || !this.sounds[soundName]) return

    if (soundName === "walking") {
      if (!this.isWalking) {
        this.sounds.walking.play()
        this.isWalking = true
      }
    } else {
      this.sounds[soundName].play()
    }
  }

  stopSound(soundName) {
    if (!this.sounds[soundName]) return

    if (soundName === "walking") {
      this.sounds.walking.stop()
      this.isWalking = false
    } else {
      this.sounds[soundName].stop()
    }
  }

  playBackgroundMusic() {
    if (gameState.audioEnabled && this.backgroundMusic && !this.musicStarted) {
      this.backgroundMusic.play()
    }
  }

  stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.stop()
    }
  }

  updateVolume() {
    // Volume is handled in playTone method
  }
}

// Menu Scene
class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" })
  }

  preload() {
    this.audioManager = new AudioManager(this)
    this.audioManager.preloadSounds()
    this.createGameAssets()
  }

  createGameAssets() {
    // Enhanced Player sprite - Modern robot character
    const playerGraphics = this.add.graphics()

    // Body with metallic gradient
    playerGraphics.fillGradientStyle(0x4a90e2, 0x4a90e2, 0x2c5aa0, 0x2c5aa0)
    playerGraphics.fillRoundedRect(6, 10, 20, 28, 4)

    // Head with visor
    playerGraphics.fillGradientStyle(0x5ba0f2, 0x5ba0f2, 0x4a90e2, 0x4a90e2)
    playerGraphics.fillRoundedRect(8, 4, 16, 16, 6)

    // Visor
    playerGraphics.fillStyle(0x00d4ff, 0.8)
    playerGraphics.fillRoundedRect(10, 8, 12, 8, 3)

    // Visor reflection
    playerGraphics.fillStyle(0xffffff, 0.6)
    playerGraphics.fillRoundedRect(11, 9, 4, 3, 1)

    // Chest panel
    playerGraphics.fillStyle(0x357abd)
    playerGraphics.fillRoundedRect(10, 18, 12, 12, 2)

    // Power core
    playerGraphics.fillStyle(0x00ff88)
    playerGraphics.fillCircle(16, 24, 3)
    playerGraphics.fillStyle(0xffffff, 0.7)
    playerGraphics.fillCircle(16, 23, 1)

    // Arms
    playerGraphics.fillStyle(0x4a90e2)
    playerGraphics.fillRoundedRect(2, 14, 5, 16, 2)
    playerGraphics.fillRoundedRect(25, 14, 5, 16, 2)

    // Legs
    playerGraphics.fillRoundedRect(9, 38, 5, 10, 2)
    playerGraphics.fillRoundedRect(18, 38, 5, 10, 2)

    // Feet
    playerGraphics.fillStyle(0x2c5aa0)
    playerGraphics.fillRoundedRect(8, 46, 7, 4, 2)
    playerGraphics.fillRoundedRect(17, 46, 7, 4, 2)

    playerGraphics.generateTexture("player", 32, 50)
    playerGraphics.destroy()

    // Enhanced Star sprite with animated glow
    const starGraphics = this.add.graphics()

    // Outer glow layers
    for (let i = 3; i >= 1; i--) {
      starGraphics.fillStyle(0xffd700, 0.2 * i)
      this.drawStar(starGraphics, 16, 16, 12 + i * 2, 6 + i)
    }

    // Main star body
    starGraphics.fillGradientStyle(0xffd700, 0xffd700, 0xff8c00, 0xff8c00)
    this.drawStar(starGraphics, 16, 16, 12, 6)

    // Inner highlight
    starGraphics.fillStyle(0xffffff, 0.8)
    this.drawStar(starGraphics, 16, 16, 6, 3)

    // Center sparkle
    starGraphics.fillStyle(0xffffff)
    starGraphics.fillCircle(16, 16, 2)

    starGraphics.generateTexture("star", 32, 32)
    starGraphics.destroy()

    // Enhanced Platform sprite - Futuristic crystal platform
    const platformGraphics = this.add.graphics()

    // Platform shadow
    platformGraphics.fillStyle(0x000000, 0.2)
    platformGraphics.fillEllipse(50, 38, 95, 12)

    // Main platform with gradient
    platformGraphics.fillGradientStyle(0x8a2be2, 0x8a2be2, 0x4b0082, 0x4b0082)
    platformGraphics.fillRoundedRect(5, 10, 90, 18, 8)

    // Crystal facets
    platformGraphics.fillStyle(0x9932cc, 0.8)
    for (let i = 0; i < 4; i++) {
      const x = 15 + i * 20
      platformGraphics.fillTriangle(x, 10, x + 10, 5, x + 20, 10)
    }

    // Energy lines
    platformGraphics.lineStyle(2, 0x00ffff, 0.8)
    platformGraphics.lineBetween(10, 19, 90, 19)
    platformGraphics.lineStyle(1, 0x00ffff, 0.6)
    platformGraphics.lineBetween(15, 15, 85, 15)

    // Glow effect
    platformGraphics.fillStyle(0x00ffff, 0.3)
    platformGraphics.fillEllipse(50, 32, 85, 8)

    platformGraphics.generateTexture("platform", 100, 40)
    platformGraphics.destroy()

    // Enhanced Enemy sprite - Aggressive spiky creature
    const enemyGraphics = this.add.graphics()

    // Shadow
    enemyGraphics.fillStyle(0x000000, 0.3)
    platformGraphics.fillEllipse(16, 30, 28, 6)

    // Main body with gradient
    enemyGraphics.fillGradientStyle(0xff4500, 0xff4500, 0x8b0000, 0x8b0000)
    enemyGraphics.fillRoundedRect(4, 6, 24, 20, 4)

    // Spikes on top and sides
    for (let i = 6; i < 26; i += 4) {
      enemyGraphics.fillStyle(0xdc143c)
      enemyGraphics.fillTriangle(i, 6, i + 2, 0, i + 4, 6)
    }

    // Side spikes
    enemyGraphics.fillTriangle(4, 10, 0, 12, 4, 14)
    enemyGraphics.fillTriangle(28, 10, 32, 12, 28, 14)

    // Eyes with glow
    enemyGraphics.fillStyle(0xff0000)
    enemyGraphics.fillCircle(12, 12, 3)
    enemyGraphics.fillCircle(20, 12, 3)

    // Eye glow
    enemyGraphics.fillStyle(0xff6666, 0.6)
    enemyGraphics.fillCircle(12, 12, 4)
    enemyGraphics.fillCircle(20, 12, 4)

    // Pupils
    enemyGraphics.fillStyle(0x000000)
    enemyGraphics.fillCircle(12, 13, 1)
    enemyGraphics.fillCircle(20, 13, 1)

    // Mouth
    enemyGraphics.fillStyle(0x000000)
    enemyGraphics.fillTriangle(14, 18, 18, 18, 16, 22)

    // Sharp teeth
    enemyGraphics.fillStyle(0xffffff)
    enemyGraphics.fillTriangle(14, 18, 15, 20, 16, 18)
    enemyGraphics.fillTriangle(16, 18, 17, 20, 18, 18)

    enemyGraphics.generateTexture("enemy", 32, 32)
    enemyGraphics.destroy()

    // Enhanced Heart sprite
    const heartGraphics = this.add.graphics()

    // Heart glow
    heartGraphics.fillStyle(0xff69b4, 0.4)
    this.drawHeart(heartGraphics, 12, 12, 10)

    // Main heart
    heartGraphics.fillGradientStyle(0xff1493, 0xff1493, 0xdc143c, 0xdc143c)
    this.drawHeart(heartGraphics, 12, 12, 8)

    // Heart highlight
    heartGraphics.fillStyle(0xffffff, 0.7)
    heartGraphics.fillEllipse(10, 10, 6, 4)

    heartGraphics.generateTexture("heart", 24, 24)
    heartGraphics.destroy()

    // Enhanced Ground texture
    const bgGraphics = this.add.graphics()

    // Grass layer with texture
    bgGraphics.fillGradientStyle(0x32cd32, 0x32cd32, 0x228b22, 0x228b22)
    bgGraphics.fillRect(0, 0, 1000, 25)

    // Dirt layer
    bgGraphics.fillGradientStyle(0x8b4513, 0x8b4513, 0x654321, 0x654321)
    bgGraphics.fillRect(0, 25, 1000, 35)

    // Rock layer
    bgGraphics.fillGradientStyle(0x696969, 0x696969, 0x2f4f4f, 0x2f4f4f)
    bgGraphics.fillRect(0, 60, 1000, 40)

    // Grass details
    for (let i = 5; i < 1000; i += 8) {
      const height = Phaser.Math.Between(5, 12)
      bgGraphics.fillStyle(0x90ee90)
      bgGraphics.fillTriangle(i, 0, i + 2, -height, i + 4, 0)
    }

    // Small rocks and details
    for (let i = 20; i < 1000; i += 30) {
      bgGraphics.fillStyle(0x8b7355)
      bgGraphics.fillCircle(i, 45, Phaser.Math.Between(2, 4))
    }

    bgGraphics.generateTexture("ground", 1000, 100)
    bgGraphics.destroy()
  }

  drawStar(graphics, x, y, outerRadius, innerRadius) {
    const points = 5
    graphics.beginPath()
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points
      const radius = i % 2 === 0 ? outerRadius : innerRadius
      const px = x + Math.cos(angle - Math.PI / 2) * radius
      const py = y + Math.sin(angle - Math.PI / 2) * radius

      if (i === 0) {
        graphics.moveTo(px, py)
      } else {
        graphics.lineTo(px, py)
      }
    }
    graphics.closePath()
    graphics.fillPath()
  }

  drawHeart(graphics, x, y, size) {
    graphics.beginPath()
    graphics.arc(x - size / 3, y - size / 3, size / 3, Math.PI, 0, false)
    graphics.arc(x + size / 3, y - size / 3, size / 3, Math.PI, 0, false)
    graphics.lineTo(x, y + size / 2)
    graphics.closePath()
    graphics.fillPath()
  }

  create() {
    this.audioManager.createSounds()

    // Enhanced background with animated elements
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x87ceeb, 0x87ceeb, 0x4682b4, 0x4682b4)
    bg.fillRect(0, 0, 1000, 700)

    // Animated clouds with better design
    for (let i = 0; i < 6; i++) {
      const cloud = this.add.graphics()
      cloud.fillStyle(0xffffff, 0.8 + i * 0.03)

      // More detailed cloud shape
      cloud.fillCircle(0, 0, 20)
      cloud.fillCircle(18, -8, 25)
      cloud.fillCircle(35, -5, 22)
      cloud.fillCircle(50, 0, 18)
      cloud.fillCircle(15, 8, 16)
      cloud.fillCircle(30, 10, 18)
      cloud.fillCircle(42, 8, 15)

      cloud.x = Phaser.Math.Between(50, 950)
      cloud.y = Phaser.Math.Between(50, 250)

      // Floating animation
      this.tweens.add({
        targets: cloud,
        y: cloud.y - 8,
        x: cloud.x + 20,
        duration: Phaser.Math.Between(8000, 12000),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      })
    }

    // Title with enhanced styling
    const title = this.add.text(500, 150, "⭐ STAR COLLECTOR ⭐", {
      fontSize: "52px",
      fontFamily: "Arial Black",
      fill: "#FFD700",
      stroke: "#FF6347",
      strokeThickness: 5,
      shadow: {
        offsetX: 4,
        offsetY: 4,
        color: "#000000",
        blur: 10,
        fill: true,
      },
    })
    title.setOrigin(0.5)

    // Subtitle
    const subtitle = this.add.text(500, 220, "Collect all stars and avoid the spiky enemies!", {
      fontSize: "26px",
      fontFamily: "Arial",
      fill: "#FFFFFF",
      stroke: "#000000",
      strokeThickness: 3,
    })
    subtitle.setOrigin(0.5)

    // Game info with better formatting
    const info = this.add.text(
      500,
      300,
      "• 5 Challenging Levels\n• 3 Lives per Game\n• Avoid Spiky Monsters\n• Don't Fall Off Platforms!\n• Collect All Stars to Win",
      {
        fontSize: "22px",
        fontFamily: "Arial",
        fill: "#FFFFFF",
        align: "center",
        lineSpacing: 12,
        stroke: "#000000",
        strokeThickness: 2,
      },
    )
    info.setOrigin(0.5)

    // Enhanced start button
    const startButton = this.add.rectangle(500, 450, 220, 70, 0x32cd32)
    startButton.setStrokeStyle(5, 0xffffff)
    startButton.setInteractive({ useHandCursor: true })

    const startText = this.add.text(500, 450, "START GAME", {
      fontSize: "28px",
      fontFamily: "Arial Black",
      fill: "#FFFFFF",
    })
    startText.setOrigin(0.5)

    // Button animations
    startButton.on("pointerover", () => {
      startButton.setFillStyle(0x228b22)
      startButton.setScale(1.05)
      this.audioManager.playSound("touch")
    })

    startButton.on("pointerout", () => {
      startButton.setFillStyle(0x32cd32)
      startButton.setScale(1)
    })

    startButton.on("pointerdown", () => {
      this.audioManager.playSound("touch")
      this.cameras.main.fade(500, 0, 0, 0)
      this.time.delayedCall(500, () => {
        this.scene.start("GameScene")
      })
    })

    // Instructions
    const instructions = this.add.text(500, 550, "Use ARROW KEYS to move and jump • Don't fall off the platforms!", {
      fontSize: "18px",
      fontFamily: "Arial",
      fill: "#FFFFFF",
      alpha: 0.9,
      align: "center",
    })
    instructions.setOrigin(0.5)

    // Floating animation for title
    this.tweens.add({
      targets: title,
      y: title.y - 8,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    })

    // Start background music
    this.audioManager.playBackgroundMusic()
  }
}

// Main Game Scene
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" })
  }

  create() {
    this.audioManager = new AudioManager(this)
    this.audioManager.createSounds()
    this.audioManager.playBackgroundMusic()

    // Reset game state for new game
    if (gameState.level === 1) {
      gameState.lives = 3
      gameState.score = 0
    }

    // Enhanced background
    this.createMagicalBackground()

    // Create physics groups
    this.platforms = this.physics.add.staticGroup()
    this.stars = this.physics.add.group()
    this.enemies = this.physics.add.group()

    // Create level
    this.createLevel()

    // Create player
    this.createPlayer()

    // Create UI
    this.createUI()

    // Setup controls
    this.cursors = this.input.keyboard.createCursorKeys()
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    // Setup collisions
    this.setupCollisions()

    // Camera effects
    this.cameras.main.fadeIn(500)

    // Level intro
    this.showLevelIntro()

    // Death zone (bottom of screen) - Fixed to be more forgiving
    this.deathZone = 650
  }

  createMagicalBackground() {
    // Gradient sky background
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x87ceeb, 0x87ceeb, 0x4682b4, 0x4682b4)
    bg.fillRect(0, 0, 1000, 600)

    // Magical atmosphere with floating particles
    for (let i = 0; i < 20; i++) {
      const particle = this.add.circle(
        Phaser.Math.Between(0, 1000),
        Phaser.Math.Between(0, 600),
        Phaser.Math.Between(1, 3),
        0xffffff,
        0.4,
      )

      this.tweens.add({
        targets: particle,
        y: particle.y - 150,
        alpha: 0,
        duration: Phaser.Math.Between(4000, 8000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 4000),
      })
    }

    // Enhanced clouds
    for (let i = 0; i < 5; i++) {
      const cloud = this.add.graphics()
      const alpha = 0.5 + i * 0.1
      cloud.fillStyle(0xffffff, alpha)

      const scale = 0.7 + i * 0.15
      cloud.fillCircle(0, 0, 18 * scale)
      cloud.fillCircle(14 * scale, -4, 22 * scale)
      cloud.fillCircle(28 * scale, -2, 18 * scale)
      cloud.fillCircle(40 * scale, 0, 16 * scale)
      cloud.fillCircle(10 * scale, 6, 14 * scale)
      cloud.fillCircle(20 * scale, 7, 16 * scale)
      cloud.fillCircle(32 * scale, 6, 14 * scale)

      cloud.x = Phaser.Math.Between(100, 900)
      cloud.y = Phaser.Math.Between(50, 200)

      this.tweens.add({
        targets: cloud,
        x: cloud.x + 30 * (i + 1),
        y: cloud.y - 5,
        duration: Phaser.Math.Between(25000, 35000),
        repeat: -1,
        yoyo: true,
        ease: "Sine.easeInOut",
      })
    }

    // Enhanced magical ground
    this.add.image(500, 650, "ground")

    // Add mystical background elements
    for (let i = 0; i < 10; i++) {
      const crystal = this.add.graphics()
      crystal.fillStyle(0x9370db, 0.3)
      crystal.fillTriangle(0, 0, 8, -15, 16, 0)
      crystal.fillStyle(0xba55d3, 0.5)
      crystal.fillTriangle(2, 0, 8, -12, 14, 0)
      crystal.x = Phaser.Math.Between(50, 950)
      crystal.y = 620

      this.tweens.add({
        targets: crystal,
        alpha: 0.7,
        duration: 3000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        delay: i * 400,
      })
    }
  }

  createLevel() {
    const levels = {
      1: {
        platforms: [
          { x: 100, y: 600 },
          { x: 300, y: 500 },
          { x: 500, y: 400 },
          { x: 700, y: 300 },
          { x: 900, y: 200 },
        ],
        stars: [
          { x: 100, y: 550 },
          { x: 300, y: 450 },
          { x: 500, y: 350 },
          { x: 700, y: 250 },
          { x: 900, y: 150 },
        ],
        enemies: [
          { x: 400, y: 550, speed: 50, platformIndex: 0 },
          { x: 600, y: 350, speed: 60, platformIndex: 2 },
        ],
      },
      2: {
        platforms: [
          { x: 100, y: 600 },
          { x: 200, y: 500 },
          { x: 400, y: 450 },
          { x: 600, y: 350 },
          { x: 800, y: 250 },
          { x: 300, y: 300 },
          { x: 500, y: 200 },
        ],
        stars: [
          { x: 100, y: 550 },
          { x: 200, y: 450 },
          { x: 400, y: 400 },
          { x: 600, y: 300 },
          { x: 800, y: 200 },
          { x: 300, y: 250 },
          { x: 500, y: 150 },
        ],
        enemies: [
          { x: 150, y: 550, speed: 40, platformIndex: 0 },
          { x: 450, y: 400, speed: 50, platformIndex: 2 },
          { x: 650, y: 300, speed: 55, platformIndex: 3 },
        ],
      },
      3: {
        platforms: [
          { x: 100, y: 600 },
          { x: 250, y: 550 },
          { x: 400, y: 500 },
          { x: 550, y: 400 },
          { x: 700, y: 300 },
          { x: 850, y: 200 },
          { x: 300, y: 350 },
          { x: 600, y: 250 },
        ],
        stars: [
          { x: 100, y: 550 },
          { x: 250, y: 500 },
          { x: 400, y: 450 },
          { x: 550, y: 350 },
          { x: 700, y: 250 },
          { x: 850, y: 150 },
          { x: 300, y: 300 },
          { x: 600, y: 200 },
        ],
        enemies: [
          { x: 175, y: 550, speed: 45, platformIndex: 1 },
          { x: 475, y: 450, speed: 55, platformIndex: 2 },
          { x: 625, y: 350, speed: 60, platformIndex: 3 },
          { x: 375, y: 300, speed: 50, platformIndex: 6 },
        ],
      },
      4: {
        platforms: [
          { x: 100, y: 600 },
          { x: 300, y: 550 },
          { x: 500, y: 500 },
          { x: 700, y: 450 },
          { x: 900, y: 400 },
          { x: 200, y: 400 },
          { x: 400, y: 350 },
          { x: 600, y: 300 },
          { x: 800, y: 250 },
          { x: 350, y: 200 },
        ],
        stars: [
          { x: 100, y: 550 },
          { x: 300, y: 500 },
          { x: 500, y: 450 },
          { x: 700, y: 400 },
          { x: 900, y: 350 },
          { x: 200, y: 350 },
          { x: 400, y: 300 },
          { x: 600, y: 250 },
          { x: 800, y: 200 },
          { x: 350, y: 150 },
        ],
        enemies: [
          { x: 175, y: 550, speed: 50, platformIndex: 1 },
          { x: 375, y: 500, speed: 60, platformIndex: 2 },
          { x: 575, y: 450, speed: 65, platformIndex: 3 },
          { x: 275, y: 350, speed: 55, platformIndex: 5 },
          { x: 475, y: 300, speed: 70, platformIndex: 6 },
        ],
      },
      5: {
        platforms: [
          { x: 100, y: 600 },
          { x: 250, y: 550 },
          { x: 400, y: 500 },
          { x: 550, y: 450 },
          { x: 700, y: 400 },
          { x: 850, y: 350 },
          { x: 200, y: 450 },
          { x: 350, y: 400 },
          { x: 500, y: 350 },
          { x: 650, y: 300 },
          { x: 800, y: 250 },
          { x: 300, y: 300 },
          { x: 450, y: 250 },
          { x: 600, y: 200 },
          { x: 750, y: 150 },
        ],
        stars: [
          { x: 100, y: 550 },
          { x: 250, y: 500 },
          { x: 400, y: 450 },
          { x: 550, y: 400 },
          { x: 700, y: 350 },
          { x: 850, y: 300 },
          { x: 200, y: 400 },
          { x: 350, y: 350 },
          { x: 500, y: 300 },
          { x: 650, y: 250 },
          { x: 800, y: 200 },
          { x: 300, y: 250 },
          { x: 450, y: 200 },
          { x: 600, y: 150 },
          { x: 750, y: 100 },
        ],
        enemies: [
          { x: 175, y: 550, speed: 55, platformIndex: 1 },
          { x: 325, y: 500, speed: 60, platformIndex: 2 },
          { x: 475, y: 450, speed: 65, platformIndex: 3 },
          { x: 625, y: 400, speed: 70, platformIndex: 4 },
          { x: 275, y: 400, speed: 60, platformIndex: 6 },
          { x: 425, y: 350, speed: 65, platformIndex: 8 },
          { x: 575, y: 300, speed: 70, platformIndex: 9 },
          { x: 375, y: 250, speed: 75, platformIndex: 11 },
        ],
      },
    }

    const currentLevel = levels[gameState.level]

    if (!currentLevel) {
      console.error("Level not found:", gameState.level)
      return
    }

    // Create platforms
    currentLevel.platforms.forEach((platform, index) => {
      const p = this.platforms.create(platform.x, platform.y, "platform")
      p.setScale(1)
      p.refreshBody()
      p.platformIndex = index

      // Add platform glow
      const glow = this.add.ellipse(platform.x, platform.y + 22, 90, 10, 0x00ffff, 0.3)
      this.tweens.add({
        targets: glow,
        alpha: 0.6,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      })

      // Add floating animation
      this.tweens.add({
        targets: p,
        y: p.y - 3,
        duration: Phaser.Math.Between(3000, 4000),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      })
    })

    // Create stars
    gameState.totalStars = currentLevel.stars.length
    gameState.starsCollected = 0

    currentLevel.stars.forEach((star) => {
      const s = this.stars.create(star.x, star.y, "star")
      s.setBounce(0.2)
      s.setCollideWorldBounds(true)

      // Add star floating animation
      this.tweens.add({
        targets: s,
        y: s.y - 8,
        rotation: 0.5,
        duration: Phaser.Math.Between(2000, 3000),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      })

      // Add star glow
      const glow = this.add.ellipse(star.x, star.y + 5, 30, 10, 0xffd700, 0.3)
      this.tweens.add({
        targets: glow,
        alpha: 0.6,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      })
    })

    // Create enemies with improved AI
    currentLevel.enemies.forEach((enemy) => {
      const e = this.enemies.create(enemy.x, enemy.y, "enemy")
      e.setBounce(0.1)
      e.setCollideWorldBounds(true)
      e.setVelocityX(enemy.speed)
      e.speed = enemy.speed
      e.originalSpeed = enemy.speed
      e.platformIndex = enemy.platformIndex
      e.direction = 1
      e.originalTint = 0xffffff
      e.setTint(e.originalTint)

      // Store platform reference for better AI
      e.assignedPlatform = currentLevel.platforms[enemy.platformIndex]

      // Add enemy tint animation
      this.tweens.add({
        targets: e,
        tint: 0xff6666,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      })
    })
  }

  createPlayer() {
    // Create player
    this.player = this.physics.add.sprite(100, 550, "player")
    this.player.setBounce(0.1)
    this.player.setCollideWorldBounds(true)
    this.player.canJump = true
    this.player.isAlive = true
    this.player.invulnerable = false

    // Add player glow
    this.playerGlow = this.add.ellipse(this.player.x, this.player.y + 25, 30, 10, 0x00ffff, 0.3)
  }

  createUI() {
    // Score text
    this.scoreText = this.add.text(16, 16, "Score: 0", {
      fontSize: "24px",
      fontFamily: "Arial",
      fill: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    })

    // Level text
    this.levelText = this.add.text(16, 50, "Level: " + gameState.level, {
      fontSize: "24px",
      fontFamily: "Arial",
      fill: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    })

    // Stars counter
    this.starsText = this.add.text(16, 84, "Stars: 0/" + gameState.totalStars, {
      fontSize: "24px",
      fontFamily: "Arial",
      fill: "#FFD700",
      stroke: "#000000",
      strokeThickness: 4,
    })

    // Lives display
    this.livesGroup = this.add.group()
    this.updateLives()
  }

  updateLives() {
    this.livesGroup.clear(true, true)

    for (let i = 0; i < gameState.lives; i++) {
      const heart = this.livesGroup.create(900 - i * 30, 30, "heart")
      heart.setScale(1)

      // Add heart beat animation
      this.tweens.add({
        targets: heart,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        delay: i * 300,
      })
    }
  }

  setupCollisions() {
    // Collisions
    this.physics.add.collider(this.player, this.platforms)
    this.physics.add.collider(this.stars, this.platforms)
    this.physics.add.collider(this.enemies, this.platforms)

    // Star collection
    this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this)

    // Enemy collision
    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this)
  }

  showLevelIntro() {
    // Level intro text
    const levelIntro = this.add.text(500, 300, "Level " + gameState.level, {
      fontSize: "64px",
      fontFamily: "Arial Black",
      fill: "#ffffff",
      stroke: "#000000",
      strokeThickness: 8,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: "#000000",
        blur: 5,
        fill: true,
      },
    })
    levelIntro.setOrigin(0.5)
    levelIntro.setAlpha(0)

    // Intro animation
    this.tweens.add({
      targets: levelIntro,
      alpha: 1,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 1000,
      ease: "Power2",
      yoyo: true,
      onComplete: () => {
        levelIntro.destroy()
      },
    })
  }

  collectStar(player, star) {
    // Play collect sound
    this.audioManager.playSound("collect")

    // Add particle effect
    this.addStarParticles(star.x, star.y)

    // Remove star
    star.disableBody(true, true)

    // Update score
    gameState.score += 10
    this.scoreText.setText("Score: " + gameState.score)

    // Update stars counter
    gameState.starsCollected++
    this.starsText.setText("Stars: " + gameState.starsCollected + "/" + gameState.totalStars)

    // Check if all stars are collected
    if (gameState.starsCollected === gameState.totalStars) {
      this.levelComplete()
    }
  }

  addStarParticles(x, y) {
    // Create particle emitter
    const particles = this.add.particles(x, y, "star", {
      scale: { start: 0.3, end: 0 },
      speed: { min: 50, max: 120 },
      angle: { min: 0, max: 360 },
      gravityY: 100,
      lifespan: 1200,
      quantity: 15,
      blendMode: "ADD",
    })

    // Auto destroy after animation
    this.time.delayedCall(1200, () => {
      particles.destroy()
    })
  }

  hitEnemy(player, enemy) {
    if (player.invulnerable || !player.isAlive) return

    this.playerDeath()
  }

  playerDeath() {
    if (!this.player.isAlive) return

    this.player.isAlive = false
    this.player.invulnerable = true

    // Stop walking sound
    this.audioManager.stopSound("walking")

    // Play death sound
    this.audioManager.playSound("gameOver")

    // Add death particles
    this.addDeathParticles(this.player.x, this.player.y)

    // Shake camera
    this.cameras.main.shake(500, 0.02)

    // Decrease lives
    gameState.lives--
    this.updateLives()

    // Player death animation
    this.player.setTint(0xff0000)
    this.tweens.add({
      targets: this.player,
      alpha: 0.5,
      scaleX: 1.5,
      scaleY: 0.5,
      rotation: Math.PI,
      duration: 1000,
      onComplete: () => {
        this.handlePlayerDeath()
      },
    })
  }

  addDeathParticles(x, y) {
    // Create particle emitter
    const particles = this.add.particles(x, y, "player", {
      scale: { start: 0.4, end: 0 },
      speed: { min: 100, max: 200 },
      angle: { min: 0, max: 360 },
      gravityY: 300,
      lifespan: 1000,
      quantity: 20,
      tint: 0xff0000,
    })

    // Auto destroy after animation
    this.time.delayedCall(1000, () => {
      particles.destroy()
    })
  }

  handlePlayerDeath() {
    if (gameState.lives <= 0) {
      // Game Over
      this.time.delayedCall(1000, () => {
        this.scene.start("GameOverScene")
      })
    } else {
      // Respawn player
      this.time.delayedCall(1000, () => {
        this.respawnPlayer()
      })
    }
  }

  respawnPlayer() {
    this.player.setPosition(100, 550)
    this.player.setAlpha(1)
    this.player.setScale(1)
    this.player.setRotation(0)
    this.player.clearTint()
    this.player.isAlive = true
    this.player.setVelocity(0, 0)

    // Invulnerability period
    this.player.invulnerable = true

    // Flashing effect during invulnerability
    this.tweens.add({
      targets: this.player,
      alpha: 0.5,
      duration: 200,
      yoyo: true,
      repeat: 10,
      onComplete: () => {
        this.player.invulnerable = false
        this.player.setAlpha(1)
      },
    })
  }

  levelComplete() {
    // Play level change sound
    this.audioManager.playSound("levelChange")

    // Add victory particles
    this.addVictoryParticles()

    // Show level complete text
    const levelComplete = this.add.text(500, 300, "Level Complete!", {
      fontSize: "64px",
      fontFamily: "Arial Black",
      fill: "#FFD700",
      stroke: "#000000",
      strokeThickness: 8,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: "#000000",
        blur: 5,
        fill: true,
      },
    })
    levelComplete.setOrigin(0.5)
    levelComplete.setAlpha(0)

    // Level complete animation
    this.tweens.add({
      targets: levelComplete,
      alpha: 1,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 1000,
      ease: "Power2",
      yoyo: true,
      onComplete: () => {
        levelComplete.destroy()

        // Go to next level or game complete
        if (gameState.level < gameState.maxLevel) {
          gameState.level++
          this.scene.restart()
        } else {
          this.gameComplete()
        }
      },
    })
  }

  addVictoryParticles() {
    // Create multiple firework emitters
    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(100, 900)
      const y = Phaser.Math.Between(100, 500)
      const color = Phaser.Display.Color.HSVToRGB(Math.random(), 1, 1).color

      // Create particle emitter
      const particles = this.add.particles(x, y, "star", {
        scale: { start: 0.5, end: 0 },
        speed: { min: 100, max: 250 },
        angle: { min: 0, max: 360 },
        gravityY: 50,
        lifespan: 2500,
        quantity: 40,
        tint: color,
        blendMode: "ADD",
      })

      // Auto destroy after animation
      this.time.delayedCall(2500, () => {
        particles.destroy()
      })
    }
  }

  gameComplete() {
    // Show game complete text
    const gameComplete = this.add.text(500, 300, "Game Complete!", {
      fontSize: "64px",
      fontFamily: "Arial Black",
      fill: "#FFD700",
      stroke: "#000000",
      strokeThickness: 8,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: "#000000",
        blur: 5,
        fill: true,
      },
    })
    gameComplete.setOrigin(0.5)
    gameComplete.setAlpha(0)

    // Final score
    const finalScore = this.add.text(500, 380, "Final Score: " + gameState.score, {
      fontSize: "32px",
      fontFamily: "Arial",
      fill: "#FFFFFF",
      stroke: "#000000",
      strokeThickness: 4,
    })
    finalScore.setOrigin(0.5)
    finalScore.setAlpha(0)

    // Game complete animation
    this.tweens.add({
      targets: [gameComplete, finalScore],
      alpha: 1,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 1000,
      ease: "Power2",
      onComplete: () => {
        // Add restart button
        const restartButton = this.add.rectangle(500, 480, 200, 60, 0x32cd32)
        restartButton.setStrokeStyle(4, 0xffffff)
        restartButton.setInteractive({ useHandCursor: true })

        const restartText = this.add.text(500, 480, "PLAY AGAIN", {
          fontSize: "24px",
          fontFamily: "Arial Black",
          fill: "#FFFFFF",
        })
        restartText.setOrigin(0.5)

        // Button animations
        restartButton.on("pointerover", () => {
          restartButton.setFillStyle(0x228b22)
          restartButton.setScale(1.1)
          this.audioManager.playSound("touch")
        })

        restartButton.on("pointerout", () => {
          restartButton.setFillStyle(0x32cd32)
          restartButton.setScale(1)
        })

        restartButton.on("pointerdown", () => {
          this.audioManager.playSound("touch")
          gameState.level = 1
          gameState.lives = 3
          gameState.score = 0
          this.scene.restart()
        })
      },
    })
  }

  update() {
    if (!this.player.isAlive) return

    let isMoving = false

    // Player movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160)
      this.player.flipX = true
      isMoving = true
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160)
      this.player.flipX = false
      isMoving = true
    } else {
      this.player.setVelocityX(0)
    }

    // Walking sound
    if (isMoving && this.player.body.touching.down) {
      this.audioManager.playSound("walking")
    } else {
      this.audioManager.stopSound("walking")
    }

    // Player jump
    if (this.cursors.up.isDown && this.player.body.touching.down && this.player.canJump) {
      this.player.setVelocityY(-400)
      this.player.canJump = false
      this.audioManager.playSound("jump")

      // Add jump particles
      this.addJumpParticles(this.player.x, this.player.y + 25)
    }

    // Reset jump ability when touching ground
    if (this.player.body.touching.down) {
      this.player.canJump = true
    }

    // Update player glow position
    if (this.playerGlow) {
      this.playerGlow.x = this.player.x
      this.playerGlow.y = this.player.y + 25
    }

    // Check if player fell off the world (death zone) - Fixed condition
    if (this.player.y > this.deathZone && this.player.isAlive) {
      this.playerDeath()
    }

    // Enhanced Enemy AI - Fixed movement
    this.enemies.getChildren().forEach((enemy) => {
      if (!enemy.assignedPlatform) return

      const platform = enemy.assignedPlatform
      const platformLeft = platform.x - 45 // Platform width consideration
      const platformRight = platform.x + 45

      // Check if enemy is on its assigned platform
      const onPlatform = enemy.y >= platform.y - 50 && enemy.y <= platform.y + 10

      if (onPlatform) {
        // Platform edge detection - improved logic
        if (enemy.x <= platformLeft + 10) {
          enemy.direction = 1
          enemy.setVelocityX(enemy.speed)
        } else if (enemy.x >= platformRight - 10) {
          enemy.direction = -1
          enemy.setVelocityX(-enemy.speed)
        }

        // Continue moving in current direction
        if (enemy.direction === 1) {
          enemy.setVelocityX(enemy.speed)
        } else {
          enemy.setVelocityX(-enemy.speed)
        }
      }

      // Reverse direction when hitting world bounds
      if (enemy.body.blocked.right || enemy.body.blocked.left) {
        enemy.direction *= -1
        enemy.setVelocityX(enemy.speed * enemy.direction)
      }
    })
  }

  addJumpParticles(x, y) {
    // Create particle emitter
    const particles = this.add.particles(x, y, "player", {
      scale: { start: 0.2, end: 0 },
      speed: { min: 20, max: 60 },
      angle: { min: 230, max: 310 },
      gravityY: 300,
      lifespan: 600,
      quantity: 12,
      alpha: { start: 0.6, end: 0 },
    })

    // Auto destroy after animation
    this.time.delayedCall(600, () => {
      particles.destroy()
    })
  }
}

// Game Over Scene
class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameOverScene" })
  }

  create() {
    this.audioManager = new AudioManager(this)
    this.audioManager.createSounds()

    // Background
    this.add.rectangle(500, 350, 1000, 700, 0x000000, 0.8)

    // Game Over text
    const gameOverText = this.add.text(500, 200, "GAME OVER", {
      fontSize: "64px",
      fontFamily: "Arial Black",
      fill: "#FF0000",
      stroke: "#FFFFFF",
      strokeThickness: 4,
    })
    gameOverText.setOrigin(0.5)

    // Final score
    const scoreText = this.add.text(500, 300, `Final Score: ${gameState.score}`, {
      fontSize: "32px",
      fontFamily: "Arial",
      fill: "#FFFFFF",
    })
    scoreText.setOrigin(0.5)

    // Level reached
    const levelText = this.add.text(500, 350, `Level Reached: ${gameState.level}`, {
      fontSize: "24px",
      fontFamily: "Arial",
      fill: "#FFFFFF",
    })
    levelText.setOrigin(0.5)

    // Restart button
    const restartButton = this.add.rectangle(400, 450, 180, 60, 0x32cd32)
    restartButton.setStrokeStyle(4, 0xffffff)
    restartButton.setInteractive({ useHandCursor: true })

    const restartText = this.add.text(400, 450, "PLAY AGAIN", {
      fontSize: "20px",
      fontFamily: "Arial Bold",
      fill: "#FFFFFF",
    })
    restartText.setOrigin(0.5)

    // Menu button
    const menuButton = this.add.rectangle(600, 450, 180, 60, 0xff6347)
    menuButton.setStrokeStyle(4, 0xffffff)
    menuButton.setInteractive({ useHandCursor: true })

    const menuText = this.add.text(600, 450, "MAIN MENU", {
      fontSize: "20px",
      fontFamily: "Arial Bold",
      fill: "#FFFFFF",
    })
    menuText.setOrigin(0.5)

    // Button interactions
    restartButton.on("pointerover", () => {
      restartButton.setFillStyle(0x228b22)
      restartButton.setScale(1.1)
      this.audioManager.playSound("touch")
    })

    restartButton.on("pointerout", () => {
      restartButton.setFillStyle(0x32cd32)
      restartButton.setScale(1)
    })

    restartButton.on("pointerdown", () => {
      this.audioManager.playSound("touch")
      gameState.level = 1
      this.scene.start("GameScene")
    })

    menuButton.on("pointerover", () => {
      menuButton.setFillStyle(0xcd5c5c)
      menuButton.setScale(1.1)
      this.audioManager.playSound("touch")
    })

    menuButton.on("pointerout", () => {
      menuButton.setFillStyle(0xff6347)
      menuButton.setScale(1)
    })

    menuButton.on("pointerdown", () => {
      this.audioManager.playSound("touch")
      gameState.level = 1
      this.scene.start("MenuScene")
    })
  }
}

// Audio Controls
document.addEventListener("DOMContentLoaded", () => {
  const muteBtn = document.getElementById("muteBtn")
  const volumeDownBtn = document.getElementById("volumeDown")
  const volumeUpBtn = document.getElementById("volumeUp")

  if (muteBtn) {
    muteBtn.addEventListener("click", () => {
      gameState.audioEnabled = !gameState.audioEnabled
      muteBtn.textContent = gameState.audioEnabled ? "🔊 Mute" : "🔇 Unmute"
    })
  }

  if (volumeDownBtn) {
    volumeDownBtn.addEventListener("click", () => {
      gameState.volume = Math.max(0, gameState.volume - 0.1)
    })
  }

  if (volumeUpBtn) {
    volumeUpBtn.addEventListener("click", () => {
      gameState.volume = Math.min(1, gameState.volume + 0.1)
    })
  }
})

// Game Configuration
const config = {
  type: Phaser.AUTO,
  width: 1000,
  height: 700,
  parent: "game-container",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: [MenuScene, GameScene, GameOverScene],
}

// Create game
const game = new Phaser.Game(config)
