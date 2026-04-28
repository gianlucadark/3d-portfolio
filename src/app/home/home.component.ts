import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild
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

  isDarkMode = false;
  showPdfModal = false;
  showCatModal = false;
  showDesktop = false;
  showGame = false;
  isLoading = true;
  currentLanguage: Language = 'it';

  private readonly destroy$ = new Subject<void>();
  private threeInitialized = false;

  constructor(
    private readonly translationService: TranslationService,
    private readonly threeSceneService: ThreeSceneService,
    private readonly bootService: BootService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.translationService.language$
      .pipe(takeUntil(this.destroy$))
      .subscribe(lang => {
        this.currentLanguage = lang;
        this.cdr.markForCheck();
      });

    // Show 3D controls once user has entered the portfolio.
    this.bootService.enter$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.showDesktop = true;
        this.initThreeIfNeeded();
        // Reveal controls after the loading screen fade-out (800 ms).
        setTimeout(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }, 800);
        this.cdr.markForCheck();
      });

    // Keep Three.js screen-position in sync when it finishes loading while the
    // desktop is already open (so returnFromDesktop gets a proper zoom-out start).
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
        } else {
          this.showGame = true;
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
  }

  private initThreeIfNeeded(): void {
    if (this.threeInitialized) return;
    this.threeInitialized = true;
    this.threeSceneService.initialize(this.rendererContainer);
  }

  returnFromDesktop(): void {
    this.showDesktop = false;
    this.initThreeIfNeeded();
    this.threeSceneService.setSceneVisible(true);
    this.threeSceneService.returnFromZoom();
    this.cdr.markForCheck();
  }

  returnFromGame(): void {
    this.showGame = false;
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
