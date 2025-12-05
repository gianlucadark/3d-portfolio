import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild, AfterViewInit, NgZone } from '@angular/core';
import { PACMAN_CONFIG } from '../constants/app.constants';

/** Rappresenta un fantasma nel gioco */
interface Ghost {
  x: number;
  y: number;
  color: string;
  dirX: number;
  dirY: number;
  speed: number;
  vulnerable: boolean;
  type: 'chase' | 'ambush' | 'random';
}

/** Direzione di movimento */
interface Direction {
  x: number;
  y: number;
}

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() readonly closeGame = new EventEmitter<void>();
  @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private animationId: number | null = null;

  // Game State
  isPlaying = false;
  gameOver = false;
  gameWon = false;
  score = 0;
  highScore = 10000;

  // Power Mode
  private powerModeTime = 0;
  private ghostsEatenInPowerMode = 0;

  // Config
  private readonly TILE_SIZE = PACMAN_CONFIG.TILE_SIZE;
  private readonly ROWS = PACMAN_CONFIG.ROWS;
  private readonly COLS = PACMAN_CONFIG.COLS;
  private readonly SPEED = PACMAN_CONFIG.SPEED;

  // Game entities
  private map: number[][] = [];
  private readonly initialMap = this.createInitialMap();
  private pacman = this.createPacman();
  private ghosts: Ghost[] = [];

  // Directions
  private readonly DIRECTIONS: Direction[] = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 }
  ];

  constructor(private readonly ngZone: NgZone) { }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;

    window.addEventListener('keydown', this.handleInput);
    this.resetGame();
    this.draw();
  }

  ngOnDestroy(): void {
    this.stopGameLoop();
    window.removeEventListener('keydown', this.handleInput);
  }

  onClose(): void {
    this.closeGame.emit();
  }

  startGame(): void {
    if (this.isPlaying) return;

    this.resetGame();
    this.isPlaying = true;
    this.gameOver = false;
    this.gameWon = false;

    this.ngZone.runOutsideAngular(() => {
      this.gameLoop();
    });
  }

  // ============================================
  // GAME SETUP
  // ============================================

  private createInitialMap(): number[][] {
    return [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
      [0, 3, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 3, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0],
      [0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 2, 0, 0, 0, 1, 0, 0, 0, 0, 0],
      [2, 2, 2, 0, 1, 0, 2, 2, 2, 2, 2, 2, 2, 0, 1, 0, 2, 2, 2, 2],
      [0, 0, 0, 0, 1, 0, 2, 0, 0, 2, 0, 0, 2, 0, 1, 0, 0, 0, 0, 0],
      [0, 2, 2, 2, 1, 2, 2, 0, 2, 2, 2, 0, 2, 2, 1, 2, 2, 2, 2, 0],
      [0, 0, 0, 0, 1, 0, 2, 0, 0, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0],
      [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0],
      [0, 3, 1, 0, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 0, 1, 3, 0, 0],
      [0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0],
      [0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0],
      [0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];
  }

  private createPacman() {
    return {
      x: 9.5,
      y: 14.5,
      dirX: 0,
      dirY: 0,
      nextDirX: 0,
      nextDirY: 0,
      mouthOpen: 0,
      mouthSpeed: 0.2
    };
  }

  private createGhosts(): Ghost[] {
    const { GHOST_SPEED_MULTIPLIER } = PACMAN_CONFIG;
    return [
      { x: 9.5, y: 8.5, color: 'red', dirX: 1, dirY: 0, speed: this.SPEED * GHOST_SPEED_MULTIPLIER.BLINKY, vulnerable: false, type: 'chase' },
      { x: 10.5, y: 8.5, color: 'pink', dirX: -1, dirY: 0, speed: this.SPEED * GHOST_SPEED_MULTIPLIER.PINKY, vulnerable: false, type: 'ambush' },
      { x: 9.5, y: 9.5, color: 'cyan', dirX: 1, dirY: 0, speed: this.SPEED * GHOST_SPEED_MULTIPLIER.INKY, vulnerable: false, type: 'random' },
      { x: 10.5, y: 9.5, color: 'orange', dirX: -1, dirY: 0, speed: this.SPEED * GHOST_SPEED_MULTIPLIER.CLYDE, vulnerable: false, type: 'random' }
    ];
  }

  private resetGame(): void {
    this.map = this.initialMap.map(row => [...row]);
    this.powerModeTime = 0;
    this.ghostsEatenInPowerMode = 0;
    this.pacman = this.createPacman();
    this.ghosts = this.createGhosts();
    this.score = 0;
  }

  // ============================================
  // INPUT HANDLING
  // ============================================

  private handleInput = (e: KeyboardEvent): void => {
    if (!this.isPlaying) {
      if (e.code === 'Enter' || e.code === 'Space') {
        this.startGame();
      }
      return;
    }

    const directionMap: Record<string, Direction> = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 }
    };

    const direction = directionMap[e.code];
    if (direction) {
      e.preventDefault();
      this.pacman.nextDirX = direction.x;
      this.pacman.nextDirY = direction.y;
    }
  };

  // ============================================
  // GAME LOOP
  // ============================================

  private gameLoop = (): void => {
    if (!this.isPlaying) return;

    this.update();
    this.draw();

    if (this.isPlaying) {
      this.animationId = requestAnimationFrame(this.gameLoop);
    }
  };

  private stopGameLoop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.isPlaying = false;
  }

  // ============================================
  // GAME UPDATE
  // ============================================

  private update(): void {
    this.updatePowerMode();
    this.moveCharacter(this.pacman, this.SPEED, true);
    this.updateGhosts();
    this.collectItems();
    this.animatePacmanMouth();
  }

  private updatePowerMode(): void {
    if (this.powerModeTime > 0) {
      this.powerModeTime--;
      if (this.powerModeTime === 0) {
        this.ghosts.forEach(g => g.vulnerable = false);
      }
    }
  }

  private updateGhosts(): void {
    this.ghosts.forEach(ghost => {
      const speed = ghost.vulnerable ? ghost.speed * 0.5 : ghost.speed;
      this.moveCharacter(ghost, speed, false);

      const dist = Math.hypot(ghost.x - this.pacman.x, ghost.y - this.pacman.y);
      if (dist < 0.8) {
        if (ghost.vulnerable) {
          this.eatGhost(ghost);
        } else {
          this.handleGameOver();
        }
      }
    });
  }

  private collectItems(): void {
    const tileX = Math.floor(this.pacman.x);
    const tileY = Math.floor(this.pacman.y);

    if (!this.isValidTile(tileX, tileY)) return;

    const tile = this.map[tileY][tileX];
    if (tile === 1) {
      this.map[tileY][tileX] = 2;
      this.score += PACMAN_CONFIG.POINTS.DOT;
      this.checkWin();
    } else if (tile === 3) {
      this.map[tileY][tileX] = 2;
      this.score += PACMAN_CONFIG.POINTS.POWER_PELLET;
      this.activatePowerMode();
    }
  }

  private animatePacmanMouth(): void {
    this.pacman.mouthOpen += this.pacman.mouthSpeed;
    if (this.pacman.mouthOpen > 0.2 || this.pacman.mouthOpen < 0) {
      this.pacman.mouthSpeed *= -1;
    }
  }

  private activatePowerMode(): void {
    this.powerModeTime = PACMAN_CONFIG.POWER_MODE_DURATION;
    this.ghostsEatenInPowerMode = 0;
    this.ghosts.forEach(ghost => {
      ghost.vulnerable = true;
      ghost.dirX *= -1;
      ghost.dirY *= -1;
    });
  }

  private eatGhost(ghost: Ghost): void {
    const points = PACMAN_CONFIG.POINTS.BASE_GHOST * Math.pow(2, this.ghostsEatenInPowerMode);
    this.score += points;
    this.ghostsEatenInPowerMode++;

    // Reset ghost position
    ghost.vulnerable = false;
    ghost.x = 9.5;
    ghost.y = 8.5;
    ghost.dirX = 0;
    ghost.dirY = -1;
  }

  // ============================================
  // MOVEMENT
  // ============================================

  private moveCharacter(char: any, speed: number, isPlayer: boolean): void {
    const tileX = Math.floor(char.x);
    const tileY = Math.floor(char.y);
    const centerX = tileX + 0.5;
    const centerY = tileY + 0.5;
    const distToCenter = Math.hypot(char.x - centerX, char.y - centerY);
    const snapThreshold = speed * 1.1;

    if (distToCenter < snapThreshold) {
      if (isPlayer) {
        this.handlePlayerTurn(char, tileX, tileY, centerX, centerY);
      } else {
        this.handleGhostAI(char, tileX, tileY, centerX, centerY);
      }
    }

    this.applyMovement(char, speed, tileX, tileY, centerX, centerY);
    this.handleWrapping(char);
  }

  private handlePlayerTurn(char: any, tileX: number, tileY: number, centerX: number, centerY: number): void {
    if (char.nextDirX === 0 && char.nextDirY === 0) return;
    if (char.nextDirX === char.dirX && char.nextDirY === char.dirY) return;

    if (this.canMoveTo(tileX + char.nextDirX, tileY + char.nextDirY)) {
      char.x = centerX;
      char.y = centerY;
      char.dirX = char.nextDirX;
      char.dirY = char.nextDirY;
      char.nextDirX = 0;
      char.nextDirY = 0;
    }
  }

  private handleGhostAI(char: Ghost, tileX: number, tileY: number, centerX: number, centerY: number): void {
    if (!this.canMoveTo(tileX + char.dirX, tileY + char.dirY) || Math.random() < 0.1) {
      char.x = centerX;
      char.y = centerY;
      this.updateGhostDirection(char, tileX, tileY);
    }
  }

  private applyMovement(char: any, speed: number, tileX: number, tileY: number, centerX: number, centerY: number): void {
    const nextX = char.x + char.dirX * speed;
    const nextY = char.y + char.dirY * speed;
    const checkX = nextX + char.dirX * 0.49;
    const checkY = nextY + char.dirY * 0.49;
    const nextTileX = Math.floor(checkX);
    const nextTileY = Math.floor(checkY);

    if (this.canMoveTo(nextTileX, nextTileY)) {
      char.x = nextX;
      char.y = nextY;
    } else if (Math.abs(char.x - centerX) < 0.1 && Math.abs(char.y - centerY) < 0.1) {
      char.x = centerX;
      char.y = centerY;
    }
  }

  private handleWrapping(char: any): void {
    if (char.x < 0) char.x = this.COLS - 0.5;
    if (char.x >= this.COLS) char.x = 0.5;
  }

  private updateGhostDirection(ghost: Ghost, tileX: number, tileY: number): void {
    const validDirs = this.DIRECTIONS.filter(d => {
      if (d.x === -ghost.dirX && d.y === -ghost.dirY) return false;
      return this.canMoveTo(tileX + d.x, tileY + d.y);
    });

    if (validDirs.length === 0) {
      const backDir = this.DIRECTIONS.find(d => d.x === -ghost.dirX && d.y === -ghost.dirY);
      if (backDir && this.canMoveTo(tileX + backDir.x, tileY + backDir.y)) {
        ghost.dirX = backDir.x;
        ghost.dirY = backDir.y;
      }
      return;
    }

    let chosenDir = validDirs[0];

    if (ghost.vulnerable) {
      chosenDir = validDirs[Math.floor(Math.random() * validDirs.length)];
    } else if (ghost.type === 'chase' && Math.random() < 0.8) {
      let minDist = Infinity;
      for (const d of validDirs) {
        const dist = Math.hypot((tileX + d.x) - this.pacman.x, (tileY + d.y) - this.pacman.y);
        if (dist < minDist) {
          minDist = dist;
          chosenDir = d;
        }
      }
    } else {
      chosenDir = validDirs[Math.floor(Math.random() * validDirs.length)];
    }

    ghost.dirX = chosenDir.x;
    ghost.dirY = chosenDir.y;
  }

  private canMoveTo(x: number, y: number): boolean {
    if (x < 0 || x >= this.COLS) return true;
    if (y < 0 || y >= this.ROWS) return false;
    return this.map[y][x] !== 0;
  }

  private isValidTile(x: number, y: number): boolean {
    return x >= 0 && x < this.COLS && y >= 0 && y < this.ROWS;
  }

  // ============================================
  // GAME STATE
  // ============================================

  private checkWin(): void {
    let dotsLeft = 0;
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (this.map[r][c] === 1 || this.map[r][c] === 3) dotsLeft++;
      }
    }

    if (dotsLeft === 0) {
      this.gameWon = true;
      this.stopGameLoop();
      this.ngZone.run(() => { });
    }
  }

  private handleGameOver(): void {
    this.gameOver = true;
    this.stopGameLoop();
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
    this.ngZone.run(() => { });
  }

  // ============================================
  // RENDERING
  // ============================================

  private draw(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);

    this.drawMap();
    this.drawPacman();
    this.drawGhosts();
  }

  private drawMap(): void {
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const tile = this.map[r][c];
        const x = c * this.TILE_SIZE;
        const y = r * this.TILE_SIZE;

        if (tile === 0) {
          this.drawWall(x, y);
        } else if (tile === 1) {
          this.drawDot(x, y, 2);
        } else if (tile === 3) {
          this.drawDot(x, y, 6);
        }
      }
    }
  }

  private drawWall(x: number, y: number): void {
    this.ctx.fillStyle = '#1919A6';
    this.ctx.fillRect(x, y, this.TILE_SIZE, this.TILE_SIZE);
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(x + 4, y + 4, this.TILE_SIZE - 8, this.TILE_SIZE - 8);
  }

  private drawDot(x: number, y: number, radius: number): void {
    this.ctx.fillStyle = '#ffb8ae';
    this.ctx.beginPath();
    this.ctx.arc(x + this.TILE_SIZE / 2, y + this.TILE_SIZE / 2, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawPacman(): void {
    const px = this.pacman.x * this.TILE_SIZE;
    const py = this.pacman.y * this.TILE_SIZE;

    let angle = 0;
    if (this.pacman.dirX === 1) angle = 0;
    else if (this.pacman.dirX === -1) angle = Math.PI;
    else if (this.pacman.dirY === -1) angle = -Math.PI / 2;
    else if (this.pacman.dirY === 1) angle = Math.PI / 2;

    const mouth = 0.2 + this.pacman.mouthOpen;

    this.ctx.fillStyle = 'yellow';
    this.ctx.beginPath();
    this.ctx.arc(px, py, this.TILE_SIZE / 2 - 2, angle + mouth, angle + Math.PI * 2 - mouth);
    this.ctx.lineTo(px, py);
    this.ctx.fill();
  }

  private drawGhosts(): void {
    this.ghosts.forEach(ghost => {
      const gx = ghost.x * this.TILE_SIZE;
      const gy = ghost.y * this.TILE_SIZE;

      // Ghost color
      if (ghost.vulnerable) {
        this.ctx.fillStyle = (this.powerModeTime < 120 && Math.floor(this.powerModeTime / 10) % 2 === 0)
          ? 'white'
          : '#0000FF';
      } else {
        this.ctx.fillStyle = ghost.color;
      }

      // Ghost body
      this.ctx.beginPath();
      this.ctx.arc(gx, gy - 2, this.TILE_SIZE / 2 - 2, Math.PI, 0);
      this.ctx.lineTo(gx + this.TILE_SIZE / 2 - 2, gy + this.TILE_SIZE / 2 - 2);
      this.ctx.lineTo(gx - this.TILE_SIZE / 2 + 2, gy + this.TILE_SIZE / 2 - 2);
      this.ctx.fill();

      // Ghost face
      if (ghost.vulnerable) {
        this.ctx.fillStyle = '#ffb8ae';
        this.ctx.fillRect(gx - 4, gy + 2, 2, 2);
        this.ctx.fillRect(gx, gy + 2, 2, 2);
        this.ctx.fillRect(gx + 4, gy + 2, 2, 2);
      } else {
        // Eyes
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(gx - 4, gy - 4, 3, 0, Math.PI * 2);
        this.ctx.arc(gx + 4, gy - 4, 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Pupils
        this.ctx.fillStyle = 'blue';
        this.ctx.beginPath();
        this.ctx.arc(gx - 4 + ghost.dirX * 2, gy - 4 + ghost.dirY * 2, 1.5, 0, Math.PI * 2);
        this.ctx.arc(gx + 4 + ghost.dirX * 2, gy - 4 + ghost.dirY * 2, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }
}
