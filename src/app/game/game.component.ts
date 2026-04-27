import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild, AfterViewInit, NgZone } from '@angular/core';
import { PACMAN_CONFIG } from '../constants/app.constants';

/** Difficulty modes */
type Difficulty = 'easy' | 'normal' | 'hard';

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
  lastTurnX?: number;
  lastTurnY?: number;
}

/** Direzione di movimento */
interface Direction {
  x: number;
  y: number;
}

// Difficulty multipliers for ghost speed
const DIFFICULTY_SETTINGS: Record<Difficulty, { ghostMult: number; chaseChance: number; powerDuration: number }> = {
  easy: { ghostMult: 0.45, chaseChance: 0.4, powerDuration: 900 },
  normal: { ghostMult: 0.7, chaseChance: 0.7, powerDuration: 600 },
  hard: { ghostMult: 1.0, chaseChance: 0.9, powerDuration: 300 }
};

// ============================================
// FLAPPY BIRD CONFIG
// ============================================
interface FlappyPipe {
  x: number;
  gapY: number;
  scored: boolean;
}

interface FlappyBird {
  y: number;
  vy: number;
}

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() readonly closeGame = new EventEmitter<void>();
  @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('flappyCanvas') flappyCanvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private flappyCtx!: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private flappyAnimationId: number | null = null;
  private wallCache: HTMLCanvasElement | null = null;

  // Game State
  isPlaying = false;
  gameOver = false;
  gameWon = false;
  isNewHighScore = false;
  score = 0;
  highScore = 0;
  isMobile = false;
  selectedDifficulty: Difficulty = 'normal';

  readonly confettiRange = Array.from({ length: 24 }, (_, i) => i);

  // Flappy Bird State
  flappyPlaying = false;
  flappyOver = false;
  flappyScore = 0;
  flappyHighScore = 0;

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

  // ============================================
  // FLAPPY BIRD INTERNALS
  // ============================================
  private readonly FB_WIDTH = 320;
  private readonly FB_HEIGHT = 480;
  private readonly FB_GRAVITY = 0.35;
  private readonly FB_JUMP = -7.5;
  private readonly FB_BIRD_X = 60;
  private readonly FB_PIPE_W = 44;
  private readonly FB_GAP = 130;
  private readonly FB_PIPE_SPEED = 2.4;
  private readonly FB_PIPE_INTERVAL = 170; // frames

  private flappyBird: FlappyBird = { y: 240, vy: 0 };
  private flappyPipes: FlappyPipe[] = [];
  private flappyFrame = 0;
  private flappyBirdAngle = 0;
  private flappyStarted = false; // waiting for tap
  private flappyParticles: Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }> = [];

  constructor(private readonly ngZone: NgZone) { }

  ngOnInit(): void {
    this.isMobile = window.innerWidth <= 1024 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const saved = localStorage.getItem('pacmanHigh');
    if (saved) this.highScore = parseInt(saved, 10);
    const savedFlappy = localStorage.getItem('flappyHigh');
    if (savedFlappy) this.flappyHighScore = parseInt(savedFlappy, 10);
  }

  ngAfterViewInit(): void {
    if (!this.isMobile) {
      const canvas = this.canvasRef.nativeElement;
      this.ctx = canvas.getContext('2d')!;
      // Outside Angular zone: keyboard events don't trigger change detection
      this.ngZone.runOutsideAngular(() => {
        window.addEventListener('keydown', this.handleInput);
      });
      this.resetGame();
      this.draw();
    } else {
      // Setup flappy
      this.setupFlappy();
    }
  }

  ngOnDestroy(): void {
    this.stopGameLoop();
    this.stopFlappyLoop();
    window.removeEventListener('keydown', this.handleInput);
  }

  onClose(): void {
    this.closeGame.emit();
  }

  setDifficulty(d: Difficulty): void {
    if (this.isPlaying) return;
    this.selectedDifficulty = d;
  }

  startGame(): void {
    if (this.isPlaying) return;
    this.resetGame();
    this.isPlaying = true;
    this.gameOver = false;
    this.gameWon = false;
    this.isNewHighScore = false;

    this.ngZone.runOutsideAngular(() => {
      this.gameLoop();
    });
  }

  // ============================================
  // FLAPPY BIRD - PUBLIC
  // ============================================

  private setupFlappy(): void {
    if (!this.flappyCanvasRef) return;
    const canvas = this.flappyCanvasRef.nativeElement;
    this.flappyCtx = canvas.getContext('2d')!;
    this.resetFlappy();
    this.ngZone.runOutsideAngular(() => {
      this.flappyLoop();
    });
  }

  onFlappyTap(): void {
    if (this.flappyOver) {
      this.ngZone.run(() => {
        this.flappyOver = false;
        this.flappyScore = 0;
      });
      this.resetFlappy();

      // Instantly start on retry
      this.flappyStarted = true;
      this.ngZone.run(() => {
        this.flappyPlaying = true;
      });
      this.flappyBird.vy = this.FB_JUMP;
      this.spawnFlappyParticles(this.FB_BIRD_X, this.flappyBird.y);

      if (!this.flappyAnimationId) {
        this.ngZone.runOutsideAngular(() => {
          this.flappyLoop();
        });
      }
      return;
    }

    if (!this.flappyStarted) {
      this.flappyStarted = true;
      this.flappyPlaying = true;
    }

    this.flappyBird.vy = this.FB_JUMP;
    this.spawnFlappyParticles(this.FB_BIRD_X, this.flappyBird.y);
  }

  private resetFlappy(): void {
    this.flappyBird = { y: this.FB_HEIGHT / 2, vy: 0 };
    this.flappyPipes = [];
    this.flappyFrame = 0;
    this.flappyBirdAngle = 0;
    this.flappyStarted = false;
    this.flappyParticles = [];
    if (!this.flappyOver) {
      this.ngZone.run(() => {
        this.flappyPlaying = false;
      });
    }
  }

  private stopFlappyLoop(): void {
    if (this.flappyAnimationId !== null) {
      cancelAnimationFrame(this.flappyAnimationId);
      this.flappyAnimationId = null;
    }
  }

  private flappyLoop = (): void => {
    this.updateFlappy();
    this.drawFlappy();
    this.flappyAnimationId = requestAnimationFrame(this.flappyLoop);
  };

  private updateFlappy(): void {
    if (!this.flappyStarted || this.flappyOver) return;

    this.flappyFrame++;

    // Gravity
    this.flappyBird.vy += this.FB_GRAVITY;
    this.flappyBird.y += this.flappyBird.vy;

    // Bird angle
    this.flappyBirdAngle = Math.max(-30, Math.min(90, this.flappyBird.vy * 4));

    // Spawn pipes
    if (this.flappyFrame % this.FB_PIPE_INTERVAL === 0) {
      const gapY = 80 + Math.random() * (this.FB_HEIGHT - 200);
      this.flappyPipes.push({ x: this.FB_WIDTH, gapY, scored: false });
    }

    // Move pipes
    const birdR = 14;
    for (const pipe of this.flappyPipes) {
      pipe.x -= this.FB_PIPE_SPEED;

      // Score
      if (!pipe.scored && pipe.x + this.FB_PIPE_W < this.FB_BIRD_X) {
        pipe.scored = true;
        this.ngZone.run(() => {
          this.flappyScore++;
          if (this.flappyScore > this.flappyHighScore) {
            this.flappyHighScore = this.flappyScore;
            localStorage.setItem('flappyHigh', String(this.flappyHighScore));
          }
        });
      }

      // Collision
      const birdX = this.FB_BIRD_X;
      const birdY = this.flappyBird.y;
      const topPipeBottom = pipe.gapY - this.FB_GAP / 2;
      const bottomPipeTop = pipe.gapY + this.FB_GAP / 2;

      if (
        birdX + birdR > pipe.x && birdX - birdR < pipe.x + this.FB_PIPE_W &&
        (birdY - birdR < topPipeBottom || birdY + birdR > bottomPipeTop)
      ) {
        this.triggerFlappyGameOver();
        return;
      }
    }

    // Ceiling / floor
    if (this.flappyBird.y - 14 < 0 || this.flappyBird.y + 14 > this.FB_HEIGHT) {
      this.triggerFlappyGameOver();
      return;
    }

    // Remove off-screen pipes
    this.flappyPipes = this.flappyPipes.filter(p => p.x > -this.FB_PIPE_W);

    // Particles
    for (const p of this.flappyParticles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life--;
    }
    this.flappyParticles = this.flappyParticles.filter(p => p.life > 0);
  }

  private triggerFlappyGameOver(): void {
    this.spawnFlappyParticles(this.FB_BIRD_X, this.flappyBird.y, true);
    this.ngZone.run(() => {
      this.flappyOver = true;
      this.flappyPlaying = false;
    });
  }

  private spawnFlappyParticles(x: number, y: number, big = false): void {
    const count = big ? 20 : 6;
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#fff', '#FF9F43'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = big ? (1 + Math.random() * 4) : (0.5 + Math.random() * 2);
      this.flappyParticles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (big ? 2 : 1),
        life: big ? 40 : 20,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  private drawFlappy(): void {
    const ctx = this.flappyCtx;
    const W = this.FB_WIDTH;
    const H = this.FB_HEIGHT;

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#1a1a2e');
    skyGrad.addColorStop(0.6, '#16213e');
    skyGrad.addColorStop(1, '#0f3460');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    const starSeed = [
      [20, 30], [80, 60], [150, 20], [220, 45], [290, 15], [310, 80], [40, 100], [180, 90], [250, 70]
    ];
    for (const [sx, sy] of starSeed) {
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ground
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(0, H - 30, W, 30);
    ctx.fillStyle = '#3d7a37';
    ctx.fillRect(0, H - 30, W, 8);

    // Pipes
    for (const pipe of this.flappyPipes) {
      this.drawFlappyPipe(ctx, pipe);
    }

    // Particles
    for (const p of this.flappyParticles) {
      ctx.globalAlpha = p.life / 40;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Bird
    this.drawFlappyBird(ctx);

    // Score (during play)
    if (this.flappyStarted && !this.flappyOver) {
      ctx.fillStyle = 'white';
      ctx.font = 'bold 32px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(this.flappyScore), W / 2, 60);
    }

    // Overlay messages
    if (!this.flappyStarted && !this.flappyOver) {
      // intro
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 18px "Press Start 2P", monospace';
      ctx.fillText('FLAPPY BIRD', W / 2, H / 2 - 40);
      ctx.fillStyle = 'white';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText('TAP TO START', W / 2, H / 2 + 10);
    }

    if (this.flappyOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2;
      const panelX = cx - 115;
      const panelY = H / 2 - 95;
      const panelW = 230;
      const panelH = 190;

      // Panel shadow
      ctx.shadowColor = '#FF6B6B';
      ctx.shadowBlur = 18;
      ctx.fillStyle = 'rgba(8, 0, 0, 0.92)';
      ctx.fillRect(panelX, panelY, panelW, panelH);
      ctx.shadowBlur = 0;

      // Panel border
      ctx.strokeStyle = '#FF6B6B';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(panelX, panelY, panelW, panelH);
      ctx.lineWidth = 1;

      // Title
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FF6B6B';
      ctx.font = 'bold 14px "Press Start 2P", monospace';
      ctx.fillText('GAME OVER', cx, panelY + 32);

      // Horizontal divider
      ctx.strokeStyle = 'rgba(255, 107, 107, 0.25)';
      ctx.beginPath();
      ctx.moveTo(panelX + 16, panelY + 46);
      ctx.lineTo(panelX + panelW - 16, panelY + 46);
      ctx.stroke();

      // Score label & value
      ctx.fillStyle = '#888';
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('SCORE', panelX + 18, panelY + 70);
      ctx.fillStyle = '#FFD700';
      ctx.font = '13px "Press Start 2P", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(String(this.flappyScore), panelX + panelW - 18, panelY + 72);

      // Mid divider
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.moveTo(panelX + 16, panelY + 84);
      ctx.lineTo(panelX + panelW - 16, panelY + 84);
      ctx.stroke();

      // Best label & value
      const isFlappyNewBest = this.flappyScore > 0 && this.flappyScore >= this.flappyHighScore;
      ctx.fillStyle = '#888';
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('BEST', panelX + 18, panelY + 108);
      ctx.fillStyle = isFlappyNewBest ? '#FFD700' : '#fff';
      ctx.font = '13px "Press Start 2P", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(String(this.flappyHighScore), panelX + panelW - 18, panelY + 110);

      // New best badge
      if (isFlappyNewBest) {
        ctx.fillStyle = '#FFD700';
        ctx.font = '6px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('★ NEW BEST ★', cx, panelY + 130);
      }

      // Blinking retry text
      if (Math.floor(Date.now() / 450) % 2 === 0) {
        ctx.fillStyle = '#4ECDC4';
        ctx.font = '7px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TAP TO RETRY', cx, panelY + panelH - 16);
      }
    }
  }

  private drawFlappyPipe(ctx: CanvasRenderingContext2D, pipe: FlappyPipe): void {
    const topH = pipe.gapY - this.FB_GAP / 2;
    const bottomY = pipe.gapY + this.FB_GAP / 2;
    const bottomH = this.FB_HEIGHT - bottomY - 30;

    const pipeGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + this.FB_PIPE_W, 0);
    pipeGrad.addColorStop(0, '#2ecc71');
    pipeGrad.addColorStop(0.4, '#27ae60');
    pipeGrad.addColorStop(1, '#1a7a43');
    ctx.fillStyle = pipeGrad;

    // Top pipe
    ctx.fillRect(pipe.x, 0, this.FB_PIPE_W, topH);
    // Top cap
    ctx.fillRect(pipe.x - 4, topH - 20, this.FB_PIPE_W + 8, 20);

    // Bottom pipe
    ctx.fillRect(pipe.x, bottomY, this.FB_PIPE_W, bottomH);
    // Bottom cap
    ctx.fillRect(pipe.x - 4, bottomY, this.FB_PIPE_W + 8, 20);

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(pipe.x + 4, 0, 8, topH);
    ctx.fillRect(pipe.x + 4, bottomY + 20, 8, bottomH);
  }

  private drawFlappyBird(ctx: CanvasRenderingContext2D): void {
    const bx = this.FB_BIRD_X;
    const by = this.flappyBird.y;
    const angle = (this.flappyBirdAngle * Math.PI) / 180;

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(angle);

    // Body
    const bodyGrad = ctx.createRadialGradient(-4, -4, 2, 0, 0, 16);
    bodyGrad.addColorStop(0, '#FFE033');
    bodyGrad.addColorStop(0.6, '#FFD700');
    bodyGrad.addColorStop(1, '#e6a800');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing
    const wingY = -3 + Math.sin(this.flappyFrame * 0.3) * 5;
    ctx.fillStyle = '#e6a800';
    ctx.beginPath();
    ctx.ellipse(-4, wingY, 10, 5, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Eye white
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(6, -4, 5, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(7.5, -4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    ctx.moveTo(12, -2);
    ctx.lineTo(20, 0);
    ctx.lineTo(12, 3);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
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
      nextDirX: 1,
      nextDirY: 0,
      mouthOpen: 0,
      mouthSpeed: 0.15,
      lastTurnX: -1,
      lastTurnY: -1
    };
  }

  private createGhosts(): Ghost[] {
    const { GHOST_SPEED_MULTIPLIER } = PACMAN_CONFIG;
    const diffMult = DIFFICULTY_SETTINGS[this.selectedDifficulty].ghostMult;
    return [
      { x: 9.5, y: 8.5, color: 'red', dirX: 1, dirY: 0, speed: this.SPEED * GHOST_SPEED_MULTIPLIER.BLINKY * diffMult, vulnerable: false, type: 'chase' },
      { x: 10.5, y: 8.5, color: 'pink', dirX: -1, dirY: 0, speed: this.SPEED * GHOST_SPEED_MULTIPLIER.PINKY * diffMult, vulnerable: false, type: 'ambush' },
      { x: 9.5, y: 9.5, color: '#00BFFF', dirX: 1, dirY: 0, speed: this.SPEED * GHOST_SPEED_MULTIPLIER.INKY * diffMult, vulnerable: false, type: 'random' },
      { x: 10.5, y: 9.5, color: 'orange', dirX: -1, dirY: 0, speed: this.SPEED * GHOST_SPEED_MULTIPLIER.CLYDE * diffMult, vulnerable: false, type: 'random' }
    ];
  }

  private resetGame(): void {
    this.map = this.initialMap.map(row => [...row]);
    this.powerModeTime = 0;
    this.ghostsEatenInPowerMode = 0;
    this.pacman = this.createPacman();
    this.ghosts = this.createGhosts();
    this.score = 0;
    this.buildWallCache();
  }

  private buildWallCache(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const offCtx = offscreen.getContext('2d')!;

    offCtx.fillStyle = '#000';
    offCtx.fillRect(0, 0, offscreen.width, offscreen.height);

    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (this.initialMap[r][c] === 0) {
          const x = c * this.TILE_SIZE;
          const y = r * this.TILE_SIZE;
          offCtx.fillStyle = '#1919A6';
          offCtx.fillRect(x, y, this.TILE_SIZE, this.TILE_SIZE);
          offCtx.fillStyle = '#000';
          offCtx.fillRect(x + 3, y + 3, this.TILE_SIZE - 6, this.TILE_SIZE - 6);
          offCtx.strokeStyle = '#3333cc';
          offCtx.lineWidth = 1;
          offCtx.strokeRect(x + 1, y + 1, this.TILE_SIZE - 2, this.TILE_SIZE - 2);
        }
      }
    }
    this.wallCache = offscreen;
  }

  // ============================================
  // INPUT HANDLING
  // ============================================

  private handleInput = (e: KeyboardEvent): void => {
    if (!this.isPlaying) {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        this.ngZone.run(() => this.startGame());
      }
      return;
    }

    const directionMap: Record<string, Direction> = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
      KeyW: { x: 0, y: -1 },
      KeyS: { x: 0, y: 1 },
      KeyA: { x: -1, y: 0 },
      KeyD: { x: 1, y: 0 }
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
      if (dist < 0.75) {
        if (ghost.vulnerable) {
          this.eatGhost(ghost);
        } else {
          this.ngZone.run(() => this.handleGameOver());
        }
      }
    });
  }

  private collectItems(): void {
    const tileX = Math.round(this.pacman.x - 0.5);
    const tileY = Math.round(this.pacman.y - 0.5);

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
    if (this.pacman.mouthOpen > 0.25 || this.pacman.mouthOpen < 0) {
      this.pacman.mouthSpeed *= -1;
    }
  }

  private activatePowerMode(): void {
    this.powerModeTime = DIFFICULTY_SETTINGS[this.selectedDifficulty].powerDuration;
    this.ghostsEatenInPowerMode = 0;
    this.ghosts.forEach(ghost => {
      ghost.vulnerable = true;
      ghost.dirX *= -1;
      ghost.dirY *= -1;
    });
  }

  private eatGhost(ghost: Ghost): void {
    const points = PACMAN_CONFIG.POINTS.BASE_GHOST * Math.pow(2, this.ghostsEatenInPowerMode);
    this.ngZone.run(() => this.score += points);
    this.ghostsEatenInPowerMode++;

    // Reset ghost to spawn
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
    const snapThreshold = Math.max(speed * 1.5, 0.1);

    if (distToCenter < snapThreshold && (char.lastTurnX !== tileX || char.lastTurnY !== tileY)) {
      let turned = false;
      if (isPlayer) {
        turned = this.handlePlayerTurn(char, tileX, tileY, centerX, centerY);
      } else {
        turned = this.handleGhostAI(char, tileX, tileY, centerX, centerY);
      }
      if (turned) {
        char.lastTurnX = tileX;
        char.lastTurnY = tileY;
      }
    }

    this.applyMovement(char, speed, centerX, centerY);
    this.handleWrapping(char);
  }

  private handlePlayerTurn(char: any, tileX: number, tileY: number, centerX: number, centerY: number): boolean {
    if (char.nextDirX === 0 && char.nextDirY === 0) return false;
    if (char.dirX === char.nextDirX && char.dirY === char.nextDirY) return false;

    // Try to turn to next direction
    if (this.canMoveTo(tileX + char.nextDirX, tileY + char.nextDirY)) {
      char.x = centerX;
      char.y = centerY;
      char.dirX = char.nextDirX;
      char.dirY = char.nextDirY;
      return true;
    }
    return false;
  }

  private handleGhostAI(char: Ghost, tileX: number, tileY: number, centerX: number, centerY: number): boolean {
    const hitWall = !this.canMoveTo(tileX + char.dirX, tileY + char.dirY);

    let validDirsCount = 0;
    for (const d of this.DIRECTIONS) {
      if (d.x === -char.dirX && d.y === -char.dirY) continue;
      if (this.canMoveTo(tileX + d.x, tileY + d.y)) validDirsCount++;
    }
    const atIntersection = validDirsCount > 1;
    const randomTurn = Math.random() < 0.2;

    if (hitWall || (atIntersection && randomTurn)) {
      char.x = centerX;
      char.y = centerY;
      this.updateGhostDirection(char, tileX, tileY);
      return true; // We performed a turn action
    }
    return false;
  }

  private applyMovement(char: any, speed: number, centerX: number, centerY: number): void {
    const tileX = Math.floor(char.x);
    const tileY = Math.floor(char.y);
    const nextX = char.x + char.dirX * speed;
    const nextY = char.y + char.dirY * speed;
    const checkX = nextX + char.dirX * 0.45;
    const checkY = nextY + char.dirY * 0.45;
    const nextTileX = Math.floor(checkX);
    const nextTileY = Math.floor(checkY);

    if (this.canMoveTo(nextTileX, nextTileY)) {
      char.x = nextX;
      char.y = nextY;
    } else {
      // Snap to center to avoid getting stuck
      if (Math.abs(char.x - centerX) < 0.15 && Math.abs(char.y - centerY) < 0.15) {
        char.x = centerX;
        char.y = centerY;
        char.dirX = 0;
        char.dirY = 0;
        if (char.nextDirX === undefined) {
          // ghost: pick new direction
          this.updateGhostDirection(char as Ghost, tileX, tileY);
          char.lastTurnX = tileX;
          char.lastTurnY = tileY;
        }
      }
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
      // Allow reversing if no other option
      const backDir = this.DIRECTIONS.find(d => d.x === -ghost.dirX && d.y === -ghost.dirY);
      if (backDir && this.canMoveTo(tileX + backDir.x, tileY + backDir.y)) {
        ghost.dirX = backDir.x;
        ghost.dirY = backDir.y;
      }
      return;
    }

    const chaseChance = DIFFICULTY_SETTINGS[this.selectedDifficulty].chaseChance;
    let chosenDir = validDirs[0];

    if (ghost.vulnerable) {
      // Flee from pacman
      let maxDist = -1;
      for (const d of validDirs) {
        const dist = Math.hypot((tileX + d.x) - this.pacman.x, (tileY + d.y) - this.pacman.y);
        if (dist > maxDist) { maxDist = dist; chosenDir = d; }
      }
    } else if (ghost.type === 'chase' && Math.random() < chaseChance) {
      let minDist = Infinity;
      for (const d of validDirs) {
        const dist = Math.hypot((tileX + d.x) - this.pacman.x, (tileY + d.y) - this.pacman.y);
        if (dist < minDist) { minDist = dist; chosenDir = d; }
      }
    } else if (ghost.type === 'ambush' && Math.random() < chaseChance * 0.7) {
      // Target 4 tiles ahead of pacman
      const targetX = this.pacman.x + this.pacman.dirX * 4;
      const targetY = this.pacman.y + this.pacman.dirY * 4;
      let minDist = Infinity;
      for (const d of validDirs) {
        const dist = Math.hypot((tileX + d.x) - targetX, (tileY + d.y) - targetY);
        if (dist < minDist) { minDist = dist; chosenDir = d; }
      }
    } else {
      chosenDir = validDirs[Math.floor(Math.random() * validDirs.length)];
    }

    ghost.dirX = chosenDir.x;
    ghost.dirY = chosenDir.y;
  }

  private canMoveTo(x: number, y: number): boolean {
    if (x < 0 || x >= this.COLS) return true; // wrap
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
      this.ngZone.run(() => {
        this.gameWon = true;
        this.stopGameLoop();
        if (this.score > this.highScore) {
          this.highScore = this.score;
          this.isNewHighScore = true;
          localStorage.setItem('pacmanHigh', String(this.highScore));
        }
      });
    }
  }

  private handleGameOver(): void {
    this.gameOver = true;
    this.stopGameLoop();
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.isNewHighScore = true;
      localStorage.setItem('pacmanHigh', String(this.highScore));
    }
  }

  // ============================================
  // RENDERING - PACMAN
  // ============================================

  private draw(): void {
    // Blit pre-rendered wall cache (O(1) drawImage vs O(n²) per-tile loop)
    if (this.wallCache) {
      this.ctx.drawImage(this.wallCache, 0, 0);
    } else {
      const canvas = this.canvasRef.nativeElement;
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    this.drawDynamicTiles();
    this.drawPacman();
    this.drawGhosts();
  }

  private drawDynamicTiles(): void {
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        const tile = this.map[r][c];
        if (tile === 1) {
          this.drawDot(c * this.TILE_SIZE, r * this.TILE_SIZE, 2);
        } else if (tile === 3) {
          this.drawPowerPellet(c * this.TILE_SIZE, r * this.TILE_SIZE);
        }
      }
    }
  }


  private drawDot(x: number, y: number, radius: number): void {
    this.ctx.fillStyle = '#ffb8ae';
    this.ctx.beginPath();
    this.ctx.arc(x + this.TILE_SIZE / 2, y + this.TILE_SIZE / 2, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawPowerPellet(x: number, y: number): void {
    const cx = x + this.TILE_SIZE / 2;
    const cy = y + this.TILE_SIZE / 2;
    const pulse = 4 + Math.sin(Date.now() / 200) * 2;

    // Glow
    const grd = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, pulse * 1.5);
    grd.addColorStop(0, 'rgba(255,184,174,0.9)');
    grd.addColorStop(1, 'rgba(255,184,174,0)');
    this.ctx.fillStyle = grd;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, pulse * 1.5, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#ffb8ae';
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, pulse, 0, Math.PI * 2);
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

    const mouth = 0.15 + Math.abs(this.pacman.mouthOpen);

    // Glow
    this.ctx.shadowColor = 'yellow';
    this.ctx.shadowBlur = 10;

    this.ctx.fillStyle = '#FFE033';
    this.ctx.beginPath();
    this.ctx.arc(px, py, this.TILE_SIZE / 2 - 1, angle + mouth, angle + Math.PI * 2 - mouth);
    this.ctx.lineTo(px, py);
    this.ctx.fill();

    this.ctx.shadowBlur = 0;
  }

  private drawGhosts(): void {
    this.ghosts.forEach(ghost => {
      const gx = ghost.x * this.TILE_SIZE;
      const gy = ghost.y * this.TILE_SIZE;
      const r = this.TILE_SIZE / 2 - 2;

      let color: string;
      if (ghost.vulnerable) {
        color = (this.powerModeTime < 120 && Math.floor(this.powerModeTime / 10) % 2 === 0)
          ? 'white'
          : '#0000FF';
      } else {
        color = ghost.color;
      }

      // Glow for non-vulnerable
      if (!ghost.vulnerable) {
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 6;
      }

      this.ctx.fillStyle = color;

      // Ghost body (rounded top + wavy bottom)
      this.ctx.beginPath();
      this.ctx.arc(gx, gy - 2, r, Math.PI, 0);

      // Wavy bottom
      const bottom = gy + r - 1;
      const steps = 3;
      const stepW = (r * 2) / steps;
      for (let i = 0; i < steps; i++) {
        const sx = gx - r + i * stepW;
        const ex = sx + stepW;
        const mid = sx + stepW / 2;
        if (i % 2 === 0) {
          this.ctx.quadraticCurveTo(mid, bottom + 5, ex, bottom);
        } else {
          this.ctx.quadraticCurveTo(mid, bottom - 5, ex, bottom);
        }
      }
      this.ctx.lineTo(gx - r, gy - 2);
      this.ctx.fill();

      this.ctx.shadowBlur = 0;

      // Face
      if (ghost.vulnerable) {
        // Scared face - wobbly line
        this.ctx.strokeStyle = '#ffb8ae';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(gx - 5, gy + 2);
        this.ctx.lineTo(gx - 3, gy);
        this.ctx.lineTo(gx - 1, gy + 2);
        this.ctx.lineTo(gx + 1, gy);
        this.ctx.lineTo(gx + 3, gy + 2);
        this.ctx.lineTo(gx + 5, gy);
        this.ctx.stroke();
        this.ctx.lineWidth = 1;

        // Scared eyes
        this.ctx.fillStyle = '#ffb8ae';
        this.ctx.fillRect(gx - 5, gy - 5, 2, 2);
        this.ctx.fillRect(gx + 3, gy - 5, 2, 2);
      } else {
        // Eyes
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(gx - 4, gy - 4, 3.5, 0, Math.PI * 2);
        this.ctx.arc(gx + 4, gy - 4, 3.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Pupils
        this.ctx.fillStyle = '#1a6fff';
        this.ctx.beginPath();
        this.ctx.arc(gx - 4 + ghost.dirX * 2, gy - 4 + ghost.dirY * 2, 2, 0, Math.PI * 2);
        this.ctx.arc(gx + 4 + ghost.dirX * 2, gy - 4 + ghost.dirY * 2, 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }
}
