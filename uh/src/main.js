// game config
let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: {
        pixelArt: true  // prevent pixel art from getting blurred when scaled
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },  // No gravity for top-down game
            debug: false       // Set to true to see physics bodies
        }
    },
    width: 640,         // 10 tiles, each 16 pixels, scaled 4x
    height: 640,
    scene: [TinyTown]
}

const game = new Phaser.Game(config);