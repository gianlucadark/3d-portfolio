import {
  Component,
  HostListener,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  Renderer2
} from '@angular/core';
import { CdkDragEnd } from '@angular/cdk/drag-drop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Icon } from 'src/utilities/interface/icon.interface';
import { Window, WindowType } from 'src/utilities/interface/window.interface';
import { TranslationService } from '../services/translation.service';
import {
  DESKTOP_CONFIG,
  WINDOW_TYPE_MAP,
  FULLSCREEN_WINDOWS,
  ICON_KEY_MAP,
  ICON_GRID_CONFIG,
  WINDOW_CONFIG
} from '../constants/app.constants';

/** Configurazione delle icone del desktop */
const DESKTOP_ICONS: Icon[] = [
  { id: 1, name: 'icons.computer', image: 'assets/icons/computer.ico', position: { x: 0, y: 0 } },
  { id: 13, name: 'icons.curriculum', image: 'assets/icons/folder.ico', position: { x: 0, y: 0 } },
  { id: 4, name: 'icons.prompt', image: 'assets/icons/prompt.webp', position: { x: 0, y: 0 } },
  { id: 10, name: 'icons.projects', image: 'assets/icons/gd.webp', position: { x: 0, y: 0 } },
  { id: 6, name: 'icons.paint', image: 'assets/icons/paint.webp', position: { x: 0, y: 0 } },
  { id: 8, name: 'icons.notepad', image: 'assets/icons/paper.ico', position: { x: 0, y: 0 } },
  { id: 9, name: 'icons.email', image: 'assets/icons/email.png', position: { x: 0, y: 0 } },
  { id: 7, name: 'icons.trash', image: 'assets/icons/cestino.webp', position: { x: 0, y: 0 } },
  { id: 5, name: 'icons.readme', image: 'assets/icons/readme.ico', position: { x: 0, y: 0 } },
  { id: 99, name: 'icons.system32', image: 'assets/icons/computer.ico', position: { x: 0, y: 0 } },
  {
    id: 11,
    name: 'icons.uxability',
    image: 'assets/icons/folder.ico',
    position: { x: 0, y: 0 },
    parentId: 10
  },
  {
    id: 12,
    name: 'icons.webExtension',
    image: 'assets/icons/folder.ico',
    position: { x: 0, y: 0 },
    parentId: 10
  }
];

@Component({
  selector: 'app-desktop',
  templateUrl: './desktop.component.html',
  styleUrls: ['./desktop.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DesktopComponent implements OnInit, OnDestroy {
  @Output() readonly closeDesktop = new EventEmitter<void>();
  @ViewChild('selectionRectEl') private selectionRectEl!: ElementRef<HTMLDivElement>;

  // Desktop state
  isStartMenuOpen = false;
  selectedIconId: number | null = null;
  openWindows: Window[] = [];
  icons: Icon[] = [];
  emailContent = '';
  emailSubject = '';
  emailTo = 'gianlucadark1@gmail.com';
  currentLanguage = 'en';

  // BSOD Easter Egg
  showBsod = false;
  bsodCountdown = 5;
  private bsodTimer: ReturnType<typeof setInterval> | null = null;

  // Z-index management
  private highestZIndex = 1000;

  // Touch events
  private lastTouchTime = 0;

  // Selection rect (rubber-band)
  private isSelecting = false;
  private selStartX = 0;
  private selStartY = 0;
  private unlistenSelMove: (() => void) | null = null;
  private unlistenSelUp: (() => void) | null = null;

  // Cleanup
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly sanitizer: DomSanitizer,
    private readonly cdr: ChangeDetectorRef,
    private readonly translationService: TranslationService,
    private readonly renderer: Renderer2
  ) {
    this.icons = [...DESKTOP_ICONS];
  }

  ngOnInit(): void {
    this.calculateIconPositions();
    this.openWindow(5, this.getWindowTitle(5), 'assets/icons/readme.ico');

    this.translationService.language$
      .pipe(takeUntil(this.destroy$))
      .subscribe(lang => {
        this.currentLanguage = lang;
        this.updateTranslatedStrings();
        this.cdr.markForCheck();
      });
  }

  private updateTranslatedStrings(): void {
    this.emailSubject = this.translationService.translate('email.subject');
    // Qualsiasi altra stringa che deve essere aggiornata manualmente nel componente
  }

  @HostListener('window:resize')
  onResize(): void {
    this.calculateIconPositions();
    this.cdr.markForCheck();
  }

  private calculateIconPositions(): void {
    const desktopIcons = this.desktopIcons;
    const availableHeight = window.innerHeight - WINDOW_CONFIG.TASKBAR_HEIGHT - 60; // 60px margin for top/bottom
    const itemsPerColumn = Math.max(1, Math.floor(availableHeight / ICON_GRID_CONFIG.ITEM_HEIGHT));

    let standardIconIndex = 0;
    desktopIcons.forEach((icon) => {
      if (icon.id === 7) {
        icon.position = {
          x: window.innerWidth - ICON_GRID_CONFIG.ITEM_WIDTH - 20,
          y: window.innerHeight - WINDOW_CONFIG.TASKBAR_HEIGHT - ICON_GRID_CONFIG.ITEM_HEIGHT - 20
        };
      } else {
        const col = Math.floor(standardIconIndex / itemsPerColumn);
        const row = standardIconIndex % itemsPerColumn;

        icon.position = {
          x: ICON_GRID_CONFIG.PADDING_LEFT + (col * ICON_GRID_CONFIG.ITEM_WIDTH),
          y: ICON_GRID_CONFIG.PADDING_TOP + (row * ICON_GRID_CONFIG.ITEM_HEIGHT)
        };
        standardIconIndex++;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.bsodTimer !== null) {
      clearInterval(this.bsodTimer);
    }
    this.unlistenSelMove?.();
    this.unlistenSelUp?.();
  }

  // ============================================
  // RUBBER-BAND SELECTION
  // ============================================

  onDesktopMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.classList.contains('desktop')) return;

    this.isSelecting = true;
    this.selStartX = event.clientX;
    this.selStartY = event.clientY;

    const el = this.selectionRectEl.nativeElement;
    this.renderer.setStyle(el, 'left', `${event.clientX}px`);
    this.renderer.setStyle(el, 'top', `${event.clientY}px`);
    this.renderer.setStyle(el, 'width', '0px');
    this.renderer.setStyle(el, 'height', '0px');
    this.renderer.setStyle(el, 'display', 'block');

    this.unlistenSelMove = this.renderer.listen('document', 'mousemove', (e: MouseEvent) => {
      const x = Math.min(e.clientX, this.selStartX);
      const y = Math.min(e.clientY, this.selStartY);
      this.renderer.setStyle(el, 'left', `${x}px`);
      this.renderer.setStyle(el, 'top', `${y}px`);
      this.renderer.setStyle(el, 'width', `${Math.abs(e.clientX - this.selStartX)}px`);
      this.renderer.setStyle(el, 'height', `${Math.abs(e.clientY - this.selStartY)}px`);
    });

    this.unlistenSelUp = this.renderer.listen('document', 'mouseup', () => {
      this.isSelecting = false;
      this.renderer.setStyle(el, 'display', 'none');
      this.unlistenSelMove?.();
      this.unlistenSelUp?.();
      this.unlistenSelMove = null;
      this.unlistenSelUp = null;
    });
  }

  // ============================================
  // GETTERS
  // ============================================

  get desktopIcons(): Icon[] {
    return this.icons.filter(icon => !icon.parentId);
  }

  // ============================================
  // START MENU
  // ============================================

  toggleStartMenu(): void {
    this.isStartMenuOpen = !this.isStartMenuOpen;
    this.cdr.markForCheck();
  }

  // ============================================
  // ICON INTERACTIONS
  // ============================================

  onDragEnded(event: CdkDragEnd, icon: Icon): void {
    icon.position = {
      x: icon.position.x + event.distance.x,
      y: icon.position.y + event.distance.y
    };
  }

  selectIcon(event: MouseEvent, id: number): void {
    event.stopPropagation();
    this.selectedIconId = this.selectedIconId === id ? null : id;
    this.cdr.markForCheck();
  }

  openIcon(event: MouseEvent | TouchEvent, id: number): void {
    event.stopPropagation();
    if (id === 99) {
      this.triggerBsod();
      return;
    }
    const icon = this.icons.find(i => i.id === id);
    if (icon) {
      this.openWindow(id, this.getWindowTitle(id), icon.image);
    }
  }
triggerBsod(): void {
  if (this.showBsod) return; // Evita trigger multipli se l'utente clicca come un pazzo

  this.showBsod = true;
  this.bsodCountdown = 5;
  
  this.cdr.markForCheck();

  this.bsodTimer = setInterval(() => {
    this.bsodCountdown--;
    
    this.cdr.markForCheck();

    if (this.bsodCountdown <= 0) {
      clearInterval(this.bsodTimer!);
      this.bsodTimer = null;

      // Aspettiamo che leggano l'ultima battuta "> just kidding"
      setTimeout(() => {
        this.showBsod = false;

        this.cdr.markForCheck();
      }, 2500); // Alzato a 2.5s per godersi il finale
    }
  }, 2000);
}

  // ============================================
  // WINDOW MANAGEMENT
  // ============================================

  openWindow(id: number, title: string, icon: string): void {
    const existingWindow = this.openWindows.find(w => w.id === id);

    if (existingWindow) {
      existingWindow.isOpen = true;
      existingWindow.isMinimized = false;
      this.bringToFront(existingWindow);
    } else {
      const newWindow = this.createWindow(id, title, icon);
      this.openWindows.push(newWindow);
      this.bringToFront(newWindow);
    }

    this.cdr.markForCheck();
  }

  private createWindow(id: number, title: string, icon: string): Window {
    this.highestZIndex++;

    return {
      id,
      title,
      icon,
      isOpen: true,
      zIndex: this.highestZIndex,
      windowType: (WINDOW_TYPE_MAP[id] || 'default') as WindowType,
      pdfSrc: (id === 3 || id === 13) ? this.getCvPdfUrl() : undefined,
      isMinimized: false,
      size: this.getWindowSize(id)
    };
  }

  private getWindowSize(id: number): { width: number; height: number } {
    if (FULLSCREEN_WINDOWS.includes(id as typeof FULLSCREEN_WINDOWS[number])) {
      return {
        width: window.innerWidth,
        height: window.innerHeight - WINDOW_CONFIG.TASKBAR_HEIGHT
      };
    }
    return {
      width: WINDOW_CONFIG.DEFAULT_WIDTH,
      height: WINDOW_CONFIG.DEFAULT_HEIGHT
    };
  }

  bringToFront(window: Window): void {
    this.highestZIndex++;
    window.zIndex = this.highestZIndex;
    this.cdr.markForCheck();
  }

  onWindowFocus(windowId: number): void {
    const window = this.openWindows.find(w => w.id === windowId);
    if (window) {
      this.bringToFront(window);
    }
  }

  closeWindow(id: number | string): void {
    if (typeof id === 'number') {
      const index = this.openWindows.findIndex(w => w.id === id);
      if (index !== -1) {
        this.openWindows.splice(index, 1);
        this.cdr.markForCheck();
      }
    }
  }

  minimizeWindow(windowId: number): void {
    const window = this.openWindows.find(w => w.id === windowId);
    if (window) {
      window.isMinimized = true;
      this.cdr.markForCheck();
    }
  }

  restoreWindow(windowId: number): void {
    const window = this.openWindows.find(w => w.id === windowId);
    if (window) {
      window.isMinimized = false;
      this.bringToFront(window);
    }
  }

  onWindowClick(windowId: number): void {
    const window = this.openWindows.find(w => w.id === windowId);
    if (window) {
      if (window.isMinimized) {
        this.restoreWindow(windowId);
      } else {
        this.bringToFront(window);
      }
    }
  }

  toggleWindow(windowId: number): void {
    const window = this.openWindows.find(w => w.id === windowId);
    if (window) {
      if (window.isMinimized) {
        window.isMinimized = false;
      }
      this.bringToFront(window);
      this.cdr.markForCheck();
    }
  }

  onOpenWindow(windowId: number): void {
    const icon = this.icons.find(i => i.id === windowId);
    if (icon) {
      this.openWindow(windowId, this.getWindowTitle(windowId), icon.image);
    }
  }

  focusWindow(windowId: number): void {
    this.onWindowFocus(windowId);
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (target.classList.contains('desktop')) {
      this.selectedIconId = null;
      this.cdr.markForCheck();
    }

    if (!target.closest('.start-menu') && !target.closest('.start-button')) {
      this.isStartMenuOpen = false;
      this.cdr.markForCheck();
    }
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    const currentTime = Date.now();
    const timeDifference = currentTime - this.lastTouchTime;

    if (timeDifference < DESKTOP_CONFIG.DOUBLE_TAP_THRESHOLD && timeDifference > 0) {
      const target = event.target as HTMLElement;
      const iconElement = target.closest('.icon');

      if (iconElement) {
        const iconId = Number(iconElement.getAttribute('data-id'));
        this.openIcon(event, iconId);
      }
    }

    this.lastTouchTime = currentTime;
  }

  // ============================================
  // UTILITIES
  // ============================================

  getCvPdfUrl(): string {
    return 'assets/cv.pdf';
  }

  getSafeCvPdfUrl(): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.getCvPdfUrl());
  }

  sendEmail(): void {
    const mailtoLink = `mailto:${this.emailTo}?subject=${encodeURIComponent(this.emailSubject)}&body=${encodeURIComponent(this.emailContent)}`;
    window.location.href = mailtoLink;
  }

  getSubIcons(parentId: number): Icon[] {
    return this.icons.filter(icon => icon.parentId === parentId);
  }

  getIconDescription(id: number): string | undefined {
    return this.icons.find(i => i.id === id)?.description;
  }

  onClose(): void {
    this.closeDesktop.emit();
  }

  getIconKey(id: number): string {
    return ICON_KEY_MAP[id] || 'computer';
  }

  getWindowTitle(id: number): string {
    return this.translationService.translate(`icons.${this.getIconKey(id)}`);
  }
}


