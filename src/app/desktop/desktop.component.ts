import {
  Component,
  HostListener,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CdkDragEnd } from '@angular/cdk/drag-drop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { Icon } from 'src/utilities/interface/icon.interface';
import { Window, WindowType } from 'src/utilities/interface/window.interface';
import { TranslationService } from '../services/translation.service';
import {
  DESKTOP_CONFIG,
  WINDOW_TYPE_MAP,
  FULLSCREEN_WINDOWS,
  ICON_KEY_MAP
} from '../constants/app.constants';

/** Configurazione delle icone del desktop */
const DESKTOP_ICONS: Icon[] = [
  { id: 1, name: 'Computer', image: 'assets/icons/computer.png', position: { x: 20, y: 20 } },
  { id: 3, name: 'CV Gianluca', image: 'assets/icons/cv.png', position: { x: 20, y: 120 } },
  { id: 4, name: 'Prompt', image: 'assets/icons/prompt.png', position: { x: 20, y: 220 } },
  { id: 5, name: 'README', image: 'assets/icons/readme.png', position: { x: 20, y: 320 } },
  { id: 6, name: 'Paint', image: 'assets/icons/paint.png', position: { x: 20, y: 420 } },
  { id: 8, name: 'Blocco Note', image: 'assets/icons/paper.png', position: { x: 20, y: 520 } },
  { id: 9, name: 'Email', image: 'assets/icons/email.png', position: { x: 20, y: 620 } },
  { id: 10, name: 'Progetti', image: 'assets/icons/folder.png', position: { x: 150, y: 20 } },
  {
    id: 11,
    name: 'Uxability',
    image: 'assets/icons/folder.png',
    position: { x: 150, y: 120 },
    parentId: 10,
    description: `Uxability è un'applicazione web sviluppata in Angular che permette di analizzare l'accessibilità e le performance di qualsiasi sito web semplicemente inserendo l'URL desiderato. L'applicazione genera report dettagliati che evidenziano errori, criticità e suggerimenti pratici per il miglioramento, offrendo anche una heatmap interattiva che visualizza graficamente le aree problematiche del sito. Un sistema di intelligenza artificiale integrato fornisce spiegazioni approfondite e chiare sugli errori riscontrati, rendendo le informazioni accessibili anche a chi non ha competenze tecniche, e suggerisce soluzioni concrete per ottimizzare il codice e l'esperienza utente complessiva. Cosa aspetti, contattami per saperne di più!`
  },
  {
    id: 12,
    name: 'Estensione Web',
    image: 'assets/icons/folder.png',
    position: { x: 150, y: 220 },
    parentId: 10,
    description: `L'estensione web sviluppata, consente di migliorare sensibilmente l'accessibilità dei siti internet, offrendo strumenti avanzati e personalizzabili per adattare la navigazione alle esigenze delle persone con disabilità. L'utente può intervenire in tempo reale su testo, contrasti, colori, spaziature, font e livello di zoom, rendendo ogni sito più leggibile e fruibile. Grazie a questa estensione, l'esperienza di navigazione diventa più inclusiva e accessibile per tutti, senza la necessità di modificare il sito originale.`
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

  // Desktop state
  isStartMenuOpen = false;
  selectedIconId: number | null = null;
  openWindows: Window[] = [];
  icons: Icon[] = [];
  emailContent = '';

  // Z-index management
  private highestZIndex = 1000;

  // Touch events
  private lastTouchTime = 0;

  // Cleanup
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly sanitizer: DomSanitizer,
    private readonly cdr: ChangeDetectorRef,
    private readonly translationService: TranslationService
  ) {
    this.icons = [...DESKTOP_ICONS];
  }

  ngOnInit(): void {
    this.openWindow(5, 'README', 'assets/icons/readme.png');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    const icon = this.icons.find(i => i.id === id);
    if (icon) {
      this.openWindow(id, icon.name, icon.image);
    }
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
      pdfSrc: id === 3 ? this.getCvPdfUrl() : undefined,
      isMinimized: false,
      size: this.getWindowSize(id)
    };
  }

  private getWindowSize(id: number): { width: number; height: number } {
    if (FULLSCREEN_WINDOWS.includes(id as typeof FULLSCREEN_WINDOWS[number])) {
      return { width: window.innerWidth, height: window.innerHeight };
    }
    return { width: 800, height: 600 };
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
      this.openWindow(windowId, icon.name, icon.image);
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
    return 'assets/file/cv-gianluca.pdf';
  }

  getSafeCvPdfUrl(): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.getCvPdfUrl());
  }

  sendEmail(): void {
    const mailtoLink = `mailto:gianlucadark1@gmail.com?subject=Email%20da%20Windows%20XP&body=${encodeURIComponent(this.emailContent)}`;
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


