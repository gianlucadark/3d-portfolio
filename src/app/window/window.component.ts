import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { WINDOW_CONFIG, PROMPT_COMMANDS, FULLSCREEN_WINDOWS } from '../constants/app.constants';
import { TranslationService } from '../services/translation.service';
import { takeUntil } from 'rxjs/operators';

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
  @Input() pdfSrc: string | undefined;
  @Input() id!: number;
  @Input() isMinimized = false;

  // Output events
  @Output() readonly windowClosed = new EventEmitter<void>();
  @Output() readonly closeWindow = new EventEmitter<void>();
  @Output() readonly closed = new EventEmitter<void>();
  @Output() readonly focusWindow = new EventEmitter<void>();
  @Output() readonly minimizeWindow = new EventEmitter<void>();
  @Output() readonly restoreWindow = new EventEmitter<void>();
  @Output() readonly openOtherWindow = new EventEmitter<number>();

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

  // Touch drag state
  private touchStartY = 0;
  private touchStartTime = 0;
  private unlistenTouchMove: (() => void) | null = null;
  private unlistenTouchEnd: (() => void) | null = null;

  // Mouse drag/resize state (zone-less listeners attached only while active)
  private unlistenMouseMove: (() => void) | null = null;
  private unlistenMouseUp: (() => void) | null = null;
  private rafPending = false;
  private pendingX = 0;
  private pendingY = 0;

  // File explorer
  folderPath: string[] = [];

  // Prompt
  readonly helpCommands = ['- aboutme', '- whyxp', '- whyprompt', '- clear'];
  output: string[] = [];
  currentInput = '';

  // Notepad
  notepadText = '';

  // Cleanup
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly el: ElementRef,
    private readonly sanitizer: DomSanitizer,
    private readonly cdr: ChangeDetectorRef,
    private readonly translationService: TranslationService,
    private readonly ngZone: NgZone
  ) {
    this.position = this.calculateInitialPosition();
  }

  ngOnInit(): void {
    this.initializeWindow();
    this.updateFolderPath();
    this.adaptSizeForMobile();
    this.handleFullscreenWindows();

    this.translationService.language$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateFolderPath();
        this.cdr.markForCheck();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pdfSrc'] || changes['isMinimized']) {
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.unlistenTouchMove?.();
    this.unlistenTouchEnd?.();
    this.unlistenMouseMove?.();
    this.unlistenMouseUp?.();
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  private initializeWindow(): void {
    if (!this.pdfSrc && this.windowType === 'cv') {
      this.pdfSrc = 'assets/cv.pdf';
    }
  }

  private calculateInitialPosition(): Position {
    // Ensure window size doesn't exceed screen size
    this.size.width = Math.min(this.size.width, window.innerWidth * 0.95);
    this.size.height = Math.min(this.size.height, (window.innerHeight - WINDOW_CONFIG.TASKBAR_HEIGHT) * 0.9);

    if (this.initialPosition) {
      return this.initialPosition;
    }

    return {
      x: Math.max(0, (window.innerWidth - this.size.width) / 2),
      y: Math.max(0, (window.innerHeight - this.size.height - WINDOW_CONFIG.TASKBAR_HEIGHT) / 2)
    };
  }

  private adaptSizeForMobile(): void {
    if (window.innerWidth >= WINDOW_CONFIG.MOBILE_BREAKPOINT) return;
    // Su mobile le finestre aprono sempre a schermo intero per massima usabilità
    this.isFullscreen = true;
    this.size = { width: window.innerWidth, height: window.innerHeight - WINDOW_CONFIG.MOBILE_TASKBAR_HEIGHT };
    this.position = { x: 0, y: 0 };
    this.cdr.markForCheck();
  }

  private handleFullscreenWindows(): void {
    const shouldFullscreen = this.windowType === 'cv' ||
      (this.windowType === 'default' && FULLSCREEN_WINDOWS.includes(this.id as typeof FULLSCREEN_WINDOWS[number]));

    // Non doppio-toggling se già fullscreen (impostato da adaptSizeForMobile)
    if (shouldFullscreen && !this.isFullscreen) {
      this.toggleFullscreen();
    }
  }

  updateFolderPath(): void {
    const desktopName = this.translationService.translate('common.desktop');
    this.folderPath = [desktopName, this.title];
  }

  // ============================================
  // MOUSE EVENTS
  // ============================================
  // Drag/resize listeners are attached only while active (in onDragStart /
  // onResizeStart) and run outside the Angular zone — so a mousemove
  // anywhere in the document does NOT trigger global change detection.

  private handleDragAt(clientX: number, clientY: number): void {
    this.pendingX = this.clamp(clientX - this.dragStart.x, 0, window.innerWidth - this.size.width);
    this.pendingY = this.clamp(clientY - this.dragStart.y, 0, window.innerHeight - this.size.height - WINDOW_CONFIG.TASKBAR_HEIGHT);

    if (this.rafPending) return;
    this.rafPending = true;
    requestAnimationFrame(() => {
      this.rafPending = false;
      // Write straight to the DOM — bypasses ngStyle re-evaluation and
      // Angular CD on every frame. The component state is reconciled on
      // mouseup so subsequent renders stay correct.
      const node = this.el.nativeElement.querySelector('.window') as HTMLElement | null;
      if (node) {
        node.style.left = `${this.pendingX}px`;
        node.style.top = `${this.pendingY}px`;
      }
    });
  }

  private handleResize(event: MouseEvent): void {
    const dx = event.clientX - this.resizeStart.x;
    const dy = event.clientY - this.resizeStart.y;

    this.applyResizeDeltas(dx, dy);
    this.constrainHeight();

    this.resizeStart = { x: event.clientX, y: event.clientY };

    if (this.rafPending) return;
    this.rafPending = true;
    requestAnimationFrame(() => {
      this.rafPending = false;
      const node = this.el.nativeElement.querySelector('.window') as HTMLElement | null;
      if (node) {
        node.style.left = `${this.position.x}px`;
        node.style.top = `${this.position.y}px`;
        node.style.width = `${this.size.width}px`;
        node.style.height = `${this.size.height}px`;
      }
    });
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
    this.pendingX = this.position.x;
    this.pendingY = this.position.y;
    this.attachMouseDragListeners(/* isResize */ false);
  }

  onTouchDragStart(event: TouchEvent): void {
    if (this.isFullscreen) return;
    const touch = event.touches[0];
    if (!touch) return;

    this.isDragging = true;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();
    this.dragStart = {
      x: touch.clientX - this.position.x,
      y: touch.clientY - this.position.y
    };

    // Listener fuori NgZone: nessuna change detection su ogni frame di drag
    this.ngZone.runOutsideAngular(() => {
      const onMove = (e: TouchEvent) => {
        const t = e.touches[0];
        if (!t) return;
        // Rientra in zona solo per aggiornare la view
        this.ngZone.run(() => this.handleDragAt(t.clientX, t.clientY));
      };

      const onEnd = (e: TouchEvent) => {
        const t = e.changedTouches[0];
        if (t) {
          const deltaY = t.clientY - this.touchStartY;
          const elapsed = Date.now() - this.touchStartTime;
          // Swipe veloce verso il basso → minimize (gesto nativo iOS/Android)
          if (deltaY > 80 && elapsed < 400) {
            this.ngZone.run(() => this.onMinimize());
          }
        }
        this.isDragging = false;
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
        this.unlistenTouchMove = null;
        this.unlistenTouchEnd = null;
      };

      document.addEventListener('touchmove', onMove, { passive: true });
      document.addEventListener('touchend', onEnd, { passive: true });

      // Salva riferimenti per cleanup in ngOnDestroy
      this.unlistenTouchMove = () => document.removeEventListener('touchmove', onMove);
      this.unlistenTouchEnd = () => document.removeEventListener('touchend', onEnd);
    });
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
    this.attachMouseDragListeners(/* isResize */ true);
  }

  /**
   * Attach mousemove/mouseup outside the Angular zone — drag/resize updates
   * the DOM directly per frame without firing global change detection.
   * Listeners self-detach on mouseup; a single markForCheck() syncs state.
   */
  private attachMouseDragListeners(isResize: boolean): void {
    this.unlistenMouseMove?.();
    this.unlistenMouseUp?.();

    this.ngZone.runOutsideAngular(() => {
      const onMove = (e: MouseEvent) => {
        if (this.isDragging) {
          this.handleDragAt(e.clientX, e.clientY);
        } else if (this.isResizing) {
          this.handleResize(e);
        }
      };

      const onUp = () => {
        const wasDragging = this.isDragging;
        const wasResizing = this.isResizing;
        this.isDragging = false;
        this.isResizing = false;

        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        this.unlistenMouseMove = null;
        this.unlistenMouseUp = null;

        if (wasDragging) {
          // Reconcile component state with the DOM on release.
          this.ngZone.run(() => {
            this.position = { x: this.pendingX, y: this.pendingY };
            this.cdr.markForCheck();
          });
        } else if (wasResizing) {
          this.ngZone.run(() => this.cdr.markForCheck());
        }
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);

      this.unlistenMouseMove = () => document.removeEventListener('mousemove', onMove);
      this.unlistenMouseUp = () => document.removeEventListener('mouseup', onUp);
    });

    void isResize;
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
      [PROMPT_COMMANDS.HELP]: () => {
        const helpText = this.translationService.translate('prompt.help');
        this.output.push(helpText);
        this.output.push(...this.helpCommands);
      },
      [PROMPT_COMMANDS.ABOUT_ME]: () => {
        this.output.push(this.translationService.translate('prompt.responses.aboutme'));
      },
      [PROMPT_COMMANDS.WHY_XP]: () => {
        this.output.push(this.translationService.translate('prompt.responses.whyxp'));
      },
      [PROMPT_COMMANDS.WHY_PROMPT]: () => {
        this.output.push(this.translationService.translate('prompt.responses.whyprompt'));
      },
      [PROMPT_COMMANDS.CLEAR]: () => { this.output = []; }
    };

    const handler = responses[command];
    if (handler) {
      handler();
    } else if (command) {
      const errorMsg = this.translationService.translate('prompt.responses.commandNotFound');
      this.output.push(`${errorMsg} ${this.currentInput}`);
    }
  }

  // ============================================
  // MISC
  // ============================================

  openCvWindow(event: Event): void {
    event.preventDefault();
    this.openOtherWindow.emit(13);
  }

  openEmailWindow(): void {
    this.openOtherWindow.emit(9);
  }

  selectIcon(event: MouseEvent): void {
    event.stopPropagation();
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}
