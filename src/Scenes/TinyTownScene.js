class TinyTown extends Phaser.Scene {
    constructor() {
        super("tinyTown");
        this.playerSpeed = 250;
        this.playerDirection = 'right';
        this.walkAnimationSpeed = 10;
        this.lastWalkTime = 0;
        this.walkFrameDelay = 100;
        this.currentWalkFrame = 0;
        this.shootCooldown = 500;
        this.lastShotTime = 0;
        this.mouseSpawnDelay = 1; // Time between mouse spawns in ms
        this.lastMouseSpawnTime = 0;
        this.mouseSpeed = 100; // Speed of mouse movement
        this.money = 0;
        this.roachSpawnDelay = 10000; // Time between roach spawns
        this.lastRoachSpawnTime = 0;
        this.lives = 3;
        this.level = 1;
        this.goal = 150;
        this.increment = 1;
        this.roachSpeed = 60;
        
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.image("tiny_town_tiles", "kenny-tiny-town-tilemap-packed.png");
        this.load.tilemapTiledJSON("map", "TinyTownMap.json");

        this.load.image("mouse", "mouse.png");
        this.load.image("cheese", "cheese.png");
        this.load.image("pellet", "pellet.png");
        this.load.image("roach", "spider.png");
        this.load.image("left1", "player_22.png");
        this.load.image("left2", "player_21.png");
        this.load.image("left3", "player_20.png"); 
        this.load.image("right1", "player_19.png");
        this.load.image("right2", "player_18.png");
        this.load.image("right3", "player_17.png");
        this.load.image("shoot", "player_08.png");
    }

    create() {
        document.getElementById('description').innerHTML = '<h2>Move using A and D shoot using Space Bar</h2>'
        
        // Add tilemap and layers
        this.map = this.add.tilemap("map", 16, 16, 10, 10);
        this.tileset = this.map.addTilesetImage("tiny-town-packed", "tiny_town_tiles");
        this.baseLayer = this.map.createLayer("Floors", this.tileset, 0, 0);
        this.floorLayer = this.map.createLayer("Cabinets", this.tileset, 0, 0);
        this.baseLayer.setScale(4.0);
        this.floorLayer.setScale(4.0);

        // Create player
        this.player = this.physics.add.sprite(
            this.game.config.width / 2, 
            this.game.config.height - 60, 
            'shoot'
        );
        this.player.setScale(2.0);
        this.player.setCollideWorldBounds(true);

        
        // Create input keys
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        // Arrays for animation frames
        this.leftWalkFrames = ['left1', 'left2', 'left3'];
        this.rightWalkFrames = ['right1', 'right2', 'right3'];

        // Create groups
        this.pellets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.mice = this.physics.add.group(); // Specific group for mice
        this.roaches = this.physics.add.group();
        this.cheeseProjectiles = this.physics.add.group();
        this.roachProjectiles = this.physics.add.group();

        // Spawn initial roach
        this.time.delayedCall(2000, () => {
            this.spawnRoach();
        });
        
        // Set up colliders
        this.physics.add.collider(this.pellets, this.enemies, (pellet, enemy) => {
            this.handleEnemyHit(pellet, enemy);
        });


        // Add collider for cheese hitting player
        this.physics.add.collider(this.player, this.cheeseProjectiles, (player, cheese) => {
            cheese.destroy();
            this.takeDamage()
            console.log("Player hit by cheese!");
            
        });
        
        this.physics.add.collider(this.player, this.roachProjectiles, (player, roach) => {
            roach.destroy();
            this.takeDamage();
            console.log("Player hit by roach projectile!");
        });

        this.moneyText = this.add.text(170, 20, '$0', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });
        this.moneyText.setScrollFactor(0);

        this.livesText = this.add.text(20, 20, 'Lives: 3', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });
        this.livesText.setScrollFactor(0);

        this.levelText= this.add.text(450, 20, 'Level: 1 \nGoal: ' + this.goal, {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });
        this.levelText.setScrollFactor(0);

    }

    update(time) {
        //player movement and animation
        this.player.setVelocityX(0);
        
        if (this.keyA.isDown) {
            this.player.setVelocityX(-this.playerSpeed);
            this.playerDirection = 'left';
            this.animateWalk(time);
        }
        else if (this.keyD.isDown) {
            this.player.setVelocityX(this.playerSpeed);
            this.playerDirection = 'right';
            this.animateWalk(time);
        }
        else {
            this.player.setTexture('shoot');
            this.currentWalkFrame = 0;
        }

        //shooting
        if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
            if (time > this.lastShotTime + this.shootCooldown) {
                this.shootPellet();
                this.lastShotTime = time;
            }
        }

        //move all pellets
        this.pellets.getChildren().forEach(pellet => {
            pellet.y -= pellet.speed;
            if (pellet.y < -pellet.displayHeight) {
                pellet.destroy();
            }
        });

        //spawn mice randomly
        if (time > this.lastMouseSpawnTime + this.mouseSpawnDelay) {
            this.spawnMouse();
            this.lastMouseSpawnTime = time;
            this.mouseSpawnDelay = Phaser.Math.Between(2000, 4000) * this.increment;
        }

        //spawn roaches
        if (time > this.lastRoachSpawnTime + this.roachSpawnDelay) {
            this.spawnRoach();
            this.lastRoachSpawnTime = time;
            this.roachSpawnDelay = Phaser.Math.Between(6000, 10000) * this.increment;
        }

        if (this.money >= this.goal){
            this.levelUp();
            this.increment = this.increment * .8; // spawn sooner;
            this.mouseSpeed = this.mouseSpeed * 1.2; //mouse go fast
            this.roachSpeed = this.roachSpeed * 1.2; //roach go fast
            this.mice.getChildren().forEach(mouse => {
                mouse.destroy();
            });
    
            this.roaches.getChildren().forEach(roach => {
                roach.destroy();
            });

            this.cheeseProjectiles.getChildren().forEach(cheese => {
                cheese.destroy();
            });

            this.roachProjectiles.getChildren().forEach(cheese => {
                cheese.destroy();
            })
        }

        //update mice movement
        this.mice.getChildren().forEach(mouse => {
            mouse.update();
        });

        this.roaches.getChildren().forEach(roach => {
            roach.update();
        });
    }

    levelUp(){
        this.level++;
        this.goal = (this.goal * 1.5 | 0);
        this.levelText.setText('Level: ' + this.level + '\nGoal: ' + this.goal);
        this.lives = 3;
        this.money = 0;
        this.moneyText.setText('$' + this.money);
        this.livesText.setText('Lives: ' + this.lives);
    }

    addMoney(amount) {
        this.money += amount;
        this.moneyText.setText('$' + this.money); // Update display
        console.log('Money updated to: $' + this.money); // Debug log
    }

    takeDamage(){
        this.lives--;
        this.livesText.setText('Lives: ' + this.lives);
        console.log('lost a life');
        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    spawnRoach() {
        // Spawn at top center
        const x = this.game.config.width / 2;
        const y = 50; // Top of screen
        const speed = this.roachSpeed; // Add this line to define the speed
    
        const roach = new Roach(this, x, y, speed); // Pass the speed parameter
        this.roaches.add(roach);
        this.enemies.add(roach);
    }

    spawnMouse() {
        // Define the four spawn points
        const spawnPoints = [
            { x: this.game.config.width - 600, y: this.game.config.height - 460, direction: 1 }, // Right side, moving left
            { x: this.game.config.width - 30, y: this.game.config.height - 460, direction: -1 }, // Left side, moving right
            { x: this.game.config.width - 600, y: this.game.config.height -270, direction: 1 }, // Right side, moving left
            { x: this.game.config.width - 30, y: this.game.config.height -270, direction: -1 } // Left side, moving right
        ];
        
        // Choose a random spawn point
        const spawn = Phaser.Utils.Array.GetRandom(spawnPoints);
        
        // Create mouse
        const mouse = new Mouse(this, spawn.x, spawn.y, spawn.direction, this.mouseSpeed);
        this.mice.add(mouse);
        this.enemies.add(mouse); // Add to enemies group for collision
    }

    handleEnemyHit(pellet, enemy) {
        pellet.destroy();
        enemy.destroy();
        if (enemy.texture.key === 'mouse') {
            this.addMoney(15);
        } else if (enemy.texture.key === 'roach') {
            this.addMoney(25); // More money for roaches
        }
    }

    animateWalk(time) {
        if (time > this.lastWalkTime + this.walkFrameDelay) {
            this.currentWalkFrame = (this.currentWalkFrame + 1) % 3;
            
            if (this.playerDirection === 'left') {
                this.player.setTexture(this.leftWalkFrames[this.currentWalkFrame]);
            } else {
                this.player.setTexture(this.rightWalkFrames[this.currentWalkFrame]);
            }
            
            this.lastWalkTime = time;
        }
    }

    shootPellet() {
        const pellet = this.add.sprite(
            this.player.x,
            this.player.y - this.player.displayHeight/2,
            'pellet'
        );
        pellet.setScale(0.02);
        pellet.speed = 6; // Pixels per frame to move
        this.pellets.add(pellet);
    }

    gameOver() {
        // Stop all movement
    this.physics.pause();
    this.player.setTint(0xff0000);
    
    // Display game over text
    const gameOverText = this.add.text(
        this.game.config.width / 2, 
        this.game.config.height / 2, 
        'GAME OVER', 
        {
            fontSize: '64px',
            fontFamily: 'Arial',
            color: '#ff0000',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }
    );
    gameOverText.setOrigin(0.5);
    
    // Add restart instruction
    const restartText = this.add.text(
        this.game.config.width / 2,
        this.game.config.height / 2 + 80,
        'Press R to Restart',
        {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }
    );
    restartText.setOrigin(0.5);
    // Set up restart key
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.keyR.on('down', () => {
        location.reload();
    });
    }

}

class Mouse extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, direction, speed) {
        super(scene, x, y, 'mouse');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setScale(1.0);
        this.direction = direction;
        this.speed = speed;
        this.isDead = false;
        this.hasThrownCheese = false;
        
        if (this.direction === 1) {
            this.setFlipX(true);
        }
    }

    update() {
        if (this.isDead) return;
        
        this.x += this.direction * this.speed * (this.scene.game.loop.delta / 1000);
        
        // Check if reached center (width/2) and hasn't thrown cheese yet
        if (!this.hasThrownCheese && 
            ((this.direction === 1 && this.x >= this.scene.game.config.width * .75) ||
             (this.direction === -1 && this.x <= this.scene.game.config.width * .25))) {
            this.throwCheese();
            this.hasThrownCheese = true;
        }
        
        // Remove if out of bounds
        if ((this.direction === 1 && this.x >= this.scene.game.config.width - 30) || 
            (this.direction === -1 && this.x <= this.scene.game.config.width - 600)) {
            this.destroy();
        }
    }

    throwCheese() {
        if (this.isDead) return;
        
        const cheese = this.scene.add.sprite(
            this.x,
            this.y,
            'cheese'
        );
        cheese.setScale(0.1);
        this.scene.cheeseProjectiles.add(cheese);
        
        // Simple tween to move cheese toward player
        this.scene.tweens.add({
            targets: cheese,
            x: this.scene.player.x,
            y: this.scene.player.y,
            duration: 3000, // 1 second to reach target
            ease: 'Linear',
            onComplete: () => {
                cheese.destroy();
            }
        });
    }

    die() {
        if (this.isDead) return;
        
        this.isDead = true;
        this.setTexture('mouseD');
        this.body.enable = false;
        
        this.scene.time.delayedCall(1000, () => {
            this.destroy();
        });
    }
}

class Roach extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, rSpeed) {
        super(scene, x, y, 'roach');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setScale(0.5);
        this.verticalSpeed = rSpeed;
        this.horizontalSpeed = rSpeed;
        this.isDead = false;
        this.moveDirection = Phaser.Math.Between(0, 1) ? 1 : -1;
        this.directionChangeTimer = 0;
        this.directionChangeInterval = 10;
        this.turnAngle = 0;
        this.maxRotation = 25;
        this.hasSplit = false;
        
        // Enable physics body
        this.body.setCollideWorldBounds(false);
        this.body.onWorldBounds = true;
    }

    update(time, delta) {
        if (this.isDead) return;
        
        // Movement logic
        this.directionChangeTimer += delta;
        if (this.directionChangeTimer >= this.directionChangeInterval) {
            this.directionChangeTimer = 0;
            
            
            // Normal direction change
            this.moveDirection *= -1;
            this.turnAngle = this.maxRotation * this.moveDirection;
        }
        
        // Apply velocity
        this.setVelocityX(this.horizontalSpeed * this.moveDirection * 1.5);
        this.setVelocityY(this.verticalSpeed);
        
        // Visual rotation
        this.turnAngle = Phaser.Math.Linear(this.turnAngle, 0, 0.3);
        this.setRotation(Phaser.Math.DegToRad(this.turnAngle));
        
        // Boundary checks
        if (this.x < 150) {
            this.x = 150;
            this.moveDirection = 1;
            this.turnAngle = this.maxRotation;
            this.splitIntoThree();
            this.die();
        } 
        else if (this.x > this.scene.game.config.width - 150) {
            this.x = this.scene.game.config.width - 150;
            this.moveDirection = -1;
            this.turnAngle = -this.maxRotation;
            this.splitIntoThree();
            this.die();
        }
      
        // Bottom boundary
        if (this.y > this.scene.game.config.height + this.displayHeight) {
            this.destroy();
        }
    }

    splitIntoThree() {
        if (this.isDead) return;
        
        // Calculate angle to player
        const angleToPlayer = Phaser.Math.Angle.Between(
            this.x, this.y,
            this.scene.player.x, this.scene.player.y
        );
        
        // Create three roaches at different angles
        const angles = [
            angleToPlayer - Phaser.Math.DegToRad(30), // Left 30 degrees
            angleToPlayer,                            // Straight at player
            angleToPlayer + Phaser.Math.DegToRad(30)  // Right 30 degrees
        ];
        
        // Calculate distance to move (you can adjust this)
        const distance = 500; 
        
        angles.forEach(angle => {
            // Create each roach
            const roach = this.scene.add.sprite(
                this.x,
                this.y,
                'roach'
            );
            roach.setScale(0.5);
            this.scene.roachProjectiles.add(roach);
            this.scene.enemies.add(roach); // Add to enemies group for collision
            
            // Calculate target position based on angle
            const targetX = this.x + Math.cos(angle) * distance;
            const targetY = this.y + Math.sin(angle) * distance;
            
            // Tween to move in straight line
            this.scene.tweens.add({
                targets: roach,
                x: targetX,
                y: targetY,
                duration: 2000, // 2 seconds to reach target
                ease: 'Linear',
                onComplete: () => {
                    roach.destroy();
                }
            });
            
            // Add collision for pellets
            this.scene.physics.add.overlap(
                this.scene.pellets, 
                roach, 
                (pellet, roach) => {
                    pellet.destroy();
                    roach.destroy();
                    this.scene.addMoney(25); // Award money for hitting split roaches
                }
            );
            
        });
        
        this.die();
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.setVelocity(0, 0);
        this.setRotation(0);
        this.body.enable = false;
        this.scene.time.delayedCall(500, () => this.destroy());
    }
}