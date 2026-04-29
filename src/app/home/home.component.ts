import {
  ChangeDetectionStrategy, ChangeDetectorRef, ComponentRef,
  Component, ElementRef, HostListener, Injector,
  OnDestroy, OnInit, ViewChild, ViewContainerRef, createNgModuleRef
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BootService } from '../services/boot.service';
import { Language, TranslationService } from '../services/translation.service';
import { ThreeSceneService } from './three-scene.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('rendererContainer') rendererContainer!: ElementRef;
  @ViewChild('desktopContainer', { read: ViewContainerRef }) desktopContainer!: ViewContainerRef;
  @ViewChild('gameContainer', { read: ViewContainerRef }) gameContainer!: ViewContainerRef;

  isDarkMode = false;
  showPdfModal = false;
  showCatModal = false;
  showDesktop = false;
  showGame = false;
  isLoading = true;
  currentLanguage: Language = 'it';

  private readonly destroy$ = new Subject<void>();
  private threeInitialized = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private desktopCompRef: ComponentRef<any> | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private gameCompRef: ComponentRef<any> | null = null;

  constructor(
    private readonly translationService: TranslationService,
    private readonly threeSceneService: ThreeSceneService,
    private readonly bootService: BootService,
    private readonly cdr: ChangeDetectorRef,
    private readonly injector: Injector
  ) {}

  ngOnInit(): void {
    this.translationService.language$
      .pipe(takeUntil(this.destroy$))
      .subscribe(lang => {
        this.currentLanguage = lang;
        this.cdr.markForCheck();
      });

    this.bootService.enter$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showDesktop = true;
        this.openDesktop();
        this.initThreeIfNeeded();
        setTimeout(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }, 800);
        this.cdr.markForCheck();
      });

    this.threeSceneService.loadingComplete$
      .pipe(takeUntil(this.destroy$))
      .subscribe(complete => {
        if (complete && this.showDesktop && !this.showGame) {
          this.threeSceneService.setInitialPositionOnScreen();
        }
        this.cdr.markForCheck();
      });

    this.threeSceneService.screenClick$
      .pipe(takeUntil(this.destroy$))
      .subscribe(screen => {
        if (screen === 'desktop') {
          this.showDesktop = true;
          this.openDesktop();
        } else {
          this.openGame();
        }
        this.cdr.markForCheck();
      });

    this.threeSceneService.pdfClick$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showPdfModal = true;
        this.cdr.markForCheck();
      });

    this.threeSceneService.catClick$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showCatModal = true;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.desktopCompRef?.destroy();
    this.gameCompRef?.destroy();
  }

  private initThreeIfNeeded(): void {
    if (this.threeInitialized) return;
    this.threeInitialized = true;
    this.threeSceneService.initialize(this.rendererContainer);
  }

  /** Lazily loads DesktopModule on first open (after "Enter Portfolio" click). */
  private async openDesktop(): Promise<void> {
    if (this.desktopCompRef) return;

    const { DesktopModule } = await import('../desktop/desktop.module');
    const moduleRef = createNgModuleRef(DesktopModule, this.injector);
    const compRef = this.desktopContainer.createComponent(DesktopModule.rootComponent, { ngModuleRef: moduleRef });
    compRef.instance.closeDesktop.subscribe(() => this.returnFromDesktop());
    this.desktopCompRef = compRef;
    this.cdr.markForCheck();
  }

  /** Lazily loads GameModule on first open. */
  private async openGame(): Promise<void> {
    this.showGame = true;
    this.cdr.markForCheck();

    if (this.gameCompRef) return;

    // Inject Press Start 2P font only when the game opens (not in the initial bundle).
    if (!document.getElementById('font-press-start-2p')) {
      const link = document.createElement('link');
      link.id = 'font-press-start-2p';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
      document.head.appendChild(link);
    }

    const { GameModule } = await import('../game/game.module');
    const moduleRef = createNgModuleRef(GameModule, this.injector);
    const compRef = this.gameContainer.createComponent(GameModule.rootComponent, { ngModuleRef: moduleRef });
    compRef.instance.closeGame.subscribe(() => this.returnFromGame());
    this.gameCompRef = compRef;
    this.cdr.markForCheck();
  }

  returnFromDesktop(): void {
    this.showDesktop = false;
    this.desktopCompRef?.destroy();
    this.desktopCompRef = null;
    this.desktopContainer?.clear();
    this.initThreeIfNeeded();
    this.threeSceneService.setSceneVisible(true);
    this.threeSceneService.returnFromZoom();
    this.cdr.markForCheck();
  }

  returnFromGame(): void {
    this.showGame = false;
    this.gameCompRef?.destroy();
    this.gameCompRef = null;
    this.gameContainer?.clear();
    this.initThreeIfNeeded();
    this.threeSceneService.setSceneVisible(true);
    this.threeSceneService.returnFromZoom();
    this.cdr.markForCheck();
  }

  closePdfModal(): void {
    this.showPdfModal = false;
    this.cdr.markForCheck();
  }

  closeCatModal(): void {
    this.showCatModal = false;
    this.cdr.markForCheck();
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    this.threeSceneService.toggleDarkMode(this.isDarkMode);
    this.cdr.markForCheck();
  }

  toggleLanguage(): void {
    this.translationService.toggleLanguage();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showPdfModal) {
      this.closePdfModal();
    } else if (this.showCatModal) {
      this.closeCatModal();
    }
  }
}
