import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ElementRef,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { WINDOW_CONFIG, PROMPT_COMMANDS, FULLSCREEN_WINDOWS } from '../constants/app.constants';

/** Posizione della finestra */
interface Position {
  x: number;
  y: number;
}

/** Dimensioni della finestra */
interface Size {
  width: number;
  height: number;
}

/** Bordi di ridimensionamento */
interface ResizeEdge {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

@Component({
  selector: 'app-window',
  templateUrl: './window.component.html',
  styleUrls: ['./window.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WindowComponent implements OnInit, OnChanges, OnDestroy {
  // Input properties
  @Input() title = '';
  @Input() icon = '';
  @Input() initialPosition: Position | null = null;
  @Input() zIndex = 0;
  @Input() windowType = 'default';
  @Input() pdfSrc: SafeResourceUrl | undefined;
  @Input() id!: number;
  @Input() isMinimized = false;

  // Output events
  @Output() readonly windowClosed = new EventEmitter<void>();
  @Output() readonly closeWindow = new EventEmitter<void>();
  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly focusWindow = new EventEmitter<void>();
  @Output() readonly minimizeWindow = new EventEmitter<void>();
  @Output() readonly restoreWindow = new EventEmitter<void>();

  // Window state
  isDragging = false;
  isResizing = false;
  isFullscreen = false;
  isVisible = true;
  position: Position;
  size: Size = { width: WINDOW_CONFIG.DEFAULT_WIDTH, height: WINDOW_CONFIG.DEFAULT_HEIGHT };

  // Drag & resize state
  private dragStart: Position = { x: 0, y: 0 };
  private resizeStart: Position = { x: 0, y: 0 };
  private resizeEdge: ResizeEdge = { top: false, right: false, bottom: false, left: false };
  private previousSize: Size | null = null;
  private previousPosition: Position | null = null;

  // File explorer
  folderPath: string[] = [];

  // Prompt
  readonly helpCommands = ['- aboutme', '- whyxp', '- whyprompt', '- clear'];
  output: string[] = [];
  currentInput = '';
  showHelp = false;

  // Notepad
  notepadText = '';

  // Cleanup
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly el: ElementRef,
    private readonly sanitizer: DomSanitizer,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.position = this.calculateInitialPosition();
  }

  ngOnInit(): void {
    this.initializeWindow();
    this.updateFolderPath();
    this.adaptSizeForMobile();
    this.handleFullscreenWindows();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pdfSrc'] || changes['isMinimized']) {
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  private initializeWindow(): void {
    if (!this.pdfSrc && this.windowType === 'cv') {
      this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl('assets/file/cv-gianluca.pdf');
    }
  }

  private calculateInitialPosition(): Position {
    if (this.initialPosition) {
      return this.initialPosition;
    }

    return {
      x: Math.max(0, (window.innerWidth - this.size.width) / 2),
      y: Math.max(0, (window.innerHeight - this.size.height) / 2)
    };
  }

  private adaptSizeForMobile(): void {
    if (window.innerWidth >= WINDOW_CONFIG.MOBILE_BREAKPOINT) return;

    this.size = {
      width: window.innerWidth * WINDOW_CONFIG.MOBILE_WIDTH_RATIO,
      height: window.innerHeight * WINDOW_CONFIG.MOBILE_HEIGHT_RATIO
    };
    this.position = this.calculateInitialPosition();
    this.cdr.markForCheck();
  }

  private handleFullscreenWindows(): void {
    const shouldFullscreen = this.windowType === 'cv' ||
      (this.windowType === 'default' && FULLSCREEN_WINDOWS.includes(this.id as typeof FULLSCREEN_WINDOWS[number]));

    if (shouldFullscreen) {
      this.toggleFullscreen();
    }
  }

  updateFolderPath(): void {
    this.folderPath = ['Desktop', this.title];
  }

  // ============================================
  // MOUSE EVENTS
  // ============================================

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isDragging) {
      this.handleDrag(event);
    } else if (this.isResizing) {
      this.handleResize(event);
    }
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.isDragging = false;
    this.isResizing = false;
  }

  private handleDrag(event: MouseEvent): void {
    const newX = this.clamp(
      event.clientX - this.dragStart.x,
      0,
      window.innerWidth - this.size.width
    );
    const newY = this.clamp(
      event.clientY - this.dragStart.y,
      0,
      window.innerHeight - this.size.height - WINDOW_CONFIG.TASKBAR_HEIGHT
    );

    this.position = { x: newX, y: newY };
    this.cdr.markForCheck();
  }

  private handleResize(event: MouseEvent): void {
    const dx = event.clientX - this.resizeStart.x;
    const dy = event.clientY - this.resizeStart.y;

    this.applyResizeDeltas(dx, dy);
    this.constrainHeight();

    this.resizeStart = { x: event.clientX, y: event.clientY };
    this.cdr.markForCheck();
  }

  private applyResizeDeltas(dx: number, dy: number): void {
    const { MIN_WIDTH, MIN_HEIGHT } = WINDOW_CONFIG;

    if (this.resizeEdge.right) {
      this.size.width = Math.max(MIN_WIDTH, this.size.width + dx);
    }

    if (this.resizeEdge.bottom) {
      this.size.height = Math.max(MIN_HEIGHT, this.size.height + dy);
    }

    if (this.resizeEdge.left) {
      const newWidth = Math.max(MIN_WIDTH, this.size.width - dx);
      const widthDiff = this.size.width - newWidth;
      this.size.width = newWidth;
      this.position.x += widthDiff;
    }

    if (this.resizeEdge.top) {
      const newHeight = Math.max(MIN_HEIGHT, this.size.height - dy);
      const heightDiff = this.size.height - newHeight;
      this.size.height = newHeight;
      this.position.y += heightDiff;
    }
  }

  private constrainHeight(): void {
    const maxHeight = window.innerHeight - this.position.y - WINDOW_CONFIG.TASKBAR_HEIGHT;
    this.size.height = Math.min(this.size.height, maxHeight);
  }

  // ============================================
  // WINDOW ACTIONS
  // ============================================

  onDragStart(event: MouseEvent): void {
    if (this.isFullscreen) return;

    this.isDragging = true;
    this.dragStart = {
      x: event.clientX - this.position.x,
      y: event.clientY - this.position.y
    };
  }

  onResizeStart(event: MouseEvent, edge: string): void {
    if (this.isFullscreen) return;

    event.preventDefault();
    event.stopPropagation();

    this.isResizing = true;
    this.resizeStart = { x: event.clientX, y: event.clientY };
    this.resizeEdge = {
      top: edge.includes('top'),
      right: edge.includes('right'),
      bottom: edge.includes('bottom'),
      left: edge.includes('left')
    };
  }

  onClose(): void {
    this.closeWindow.emit();
    this.windowClosed.emit();
    this.closed.emit();
  }

  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;

    if (this.isFullscreen) {
      this.saveStateAndMaximize();
    } else {
      this.restoreState();
    }

    this.cdr.markForCheck();
  }

  private saveStateAndMaximize(): void {
    this.previousPosition = { ...this.position };
    this.previousSize = { ...this.size };
    this.position = { x: 0, y: 0 };
    this.size = { width: window.innerWidth, height: window.innerHeight };
  }

  private restoreState(): void {
    if (this.previousPosition && this.previousSize) {
      this.position = { ...this.previousPosition };
      this.size = { ...this.previousSize };
    } else {
      this.position = { x: 100, y: 100 };
      this.size = { width: WINDOW_CONFIG.DEFAULT_WIDTH, height: WINDOW_CONFIG.DEFAULT_HEIGHT };
    }
  }

  onWindowClick(): void {
    this.focusWindow.emit();
  }

  onMinimize(): void {
    this.isMinimized = true;
    this.minimizeWindow.emit();
    this.cdr.markForCheck();
  }

  onRestore(): void {
    this.isMinimized = false;
    this.restoreWindow.emit();
    this.cdr.markForCheck();
  }

  maximize(): void {
    this.onRestore();
  }

  toggleVisibility(): void {
    this.isVisible = !this.isVisible;
    this.cdr.markForCheck();
  }

  // ============================================
  // WINDOW TYPE CHECKS
  // ============================================

  isPromptWindow(): boolean {
    return this.windowType === 'prompt';
  }

  isCvWindow(): boolean {
    return this.windowType === 'cv';
  }

  // ============================================
  // FOLDER NAVIGATION
  // ============================================

  onFolderPathClick(index: number): void {
    if (index < this.folderPath.length - 1) {
      this.folderPath = this.folderPath.slice(0, index + 1);
      this.cdr.markForCheck();
    }
  }

  navigateToFolder(newPath: string[]): void {
    this.folderPath = ['Desktop', ...newPath];
    this.cdr.markForCheck();
  }

  // ============================================
  // PROMPT COMMANDS
  // ============================================

  onEnter(): void {
    const command = this.currentInput.trim().toLowerCase();
    this.output.push(`C:\\> ${this.currentInput}`);
    this.executeCommand(command);
    this.currentInput = '';
    this.cdr.markForCheck();
  }

  private executeCommand(command: string): void {
    const responses: Record<string, () => void> = {
      [PROMPT_COMMANDS.HELP]: () => this.output.push(...this.helpCommands),
      [PROMPT_COMMANDS.ABOUT_ME]: () => this.output.push(
        'Ciao! Sono Gianluca, sono nato a Terracina (LT) il 25 Settembre 1997. ' +
        'Sono un full stack developer con una forte passione per il frontend e il design UI/UX. ' +
        'Amo creare interfacce utente intuitive e migliorare l\'esperienza utente attraverso il design.'
      ),
      [PROMPT_COMMANDS.WHY_XP]: () => this.output.push(
        'Ho scelto di ispirare il design del mio portfolio a Windows XP perché rappresenta il punto di partenza del mio viaggio digitale. ' +
        'È un omaggio nostalgico ai primi esperimenti su Paint e alle lunghe sessioni di Minesweeper. ' +
        'Nonostante oggi lavori con tecnologie avanzate, XP resta un simbolo delle mie radici. ' +
        'Il design fonde passato e futuro, con un\'estetica vintage che accompagna competenze moderne e progetti innovativi.'
      ),
      [PROMPT_COMMANDS.WHY_PROMPT]: () => this.output.push(
        'Ho scelto di implementare questo mini prompt perché rappresenta il mio primo vero approccio al mondo della programmazione. ' +
        'Da piccolo, il prompt di Windows era per me una porta verso un universo sconosciuto, e mi divertivo a esplorare i vari comandi, ' +
        'quasi sentendomi un hacker. Passavo ore cercando di capire come funzionassero le istruzioni e cosa potessi fare con quel semplice schermo nero e bianco.'
      ),
      [PROMPT_COMMANDS.CLEAR]: () => { this.output = []; }
    };

    const handler = responses[command];
    if (handler) {
      handler();
    } else if (command) {
      this.output.push(`Comando non riconosciuto: ${this.currentInput}`);
    }
  }

  // ============================================
  // MISC
  // ============================================

  openCvWindow(event: Event): void {
    event.preventDefault();
    console.warn('openCvWindow: DesktopComponent not injected');
  }

  selectIcon(event: MouseEvent): void {
    event.stopPropagation();
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}
