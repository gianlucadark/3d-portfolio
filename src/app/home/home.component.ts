import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
import { TranslationService, Language } from '../services/translation.service';
import { ThreeSceneService } from './three-scene.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('rendererContainer') rendererContainer!: ElementRef;

    // UI State
    isDarkMode = false;
    showPdfModal = false;
    showCatModal = false;
    showDesktop = false;
    showGame = false;
    currentLanguage: Language = 'it';

    // Loading State
    isLoading = true;
    isEndingLoading = false; // For fade-out animation
    isLoadingComplete = false;
    loadingProgress = 0;

    // Iconic Boot Flow
    isBiosComplete = false;
    showWelcome = false;

    private readonly destroy$ = new Subject<void>();
    private biosTimerId: ReturnType<typeof setTimeout> | null = null;

    constructor(
        private readonly translationService: TranslationService,
        private readonly threeSceneService: ThreeSceneService,
        private readonly cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.translationService.language$
            .pipe(takeUntil(this.destroy$))
            .subscribe(lang => {
                this.currentLanguage = lang;
                this.cdr.markForCheck();
            });

        this.threeSceneService.loadingProgress$
            .pipe(takeUntil(this.destroy$))
            .subscribe(progress => {
                this.loadingProgress = progress;
                this.cdr.markForCheck();
            });

        this.threeSceneService.loadingComplete$
            .pipe(takeUntil(this.destroy$))
            .subscribe(complete => {
                this.isLoadingComplete = complete;
                if (complete) {
                    // Show welcome screen immediately — no artificial delay.
                    // isBiosComplete may already be true from the 1.5s timer below.
                    this.isBiosComplete = true;
                    this.showWelcome = true;
                    this.cdr.markForCheck();
                }
                this.cdr.markForCheck();
            });

        // Transition to welcome screen after BIOS animation completes (~1.5s),
        // regardless of Three.js loading status. This makes the LCP element
        // (h1.welcome-title) visible much sooner for real users on slow connections.
        // The enter button stays hidden until loadingComplete$ fires (showWelcome).
        this.biosTimerId = setTimeout(() => {
            if (!this.isBiosComplete) {
                this.isBiosComplete = true;
                this.cdr.markForCheck();
            }
        }, 1500);

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

    ngAfterViewInit(): void {
        this.threeSceneService.initialize(this.rendererContainer);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        if (this.biosTimerId !== null) {
            clearTimeout(this.biosTimerId);
        }
    }

    enterPortfolio(): void {
        // 1. Rendi il desktop presente nel DOM prima ancora di fare qualsiasi fade
        this.showDesktop = true;
        this.threeSceneService.setInitialPositionOnScreen();
        this.cdr.markForCheck();

        // Pre-warm brand fonts in background while user is on XP desktop,
        // so Syne is guaranteed loaded before any 3D modal opens (no FOUT).
        document.fonts.load('700 16px Syne');
        document.fonts.load('400 16px Inter');

        // 2. Double-rAF: garantisce che Angular dipinga il desktop prima del fade-out,
        //    evitando il flash del renderer 3D. Al momento del reveal passiamo a 60fps.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.threeSceneService.setSceneVisible(true);
                this.isEndingLoading = true;
                this.cdr.markForCheck();

                setTimeout(() => {
                    this.isLoading = false;
                    this.cdr.markForCheck();
                }, 800);
            });
        });
    }

    returnFromDesktop(): void {
        this.showDesktop = false;
        this.threeSceneService.returnFromZoom();
        this.cdr.markForCheck();
    }

    returnFromGame(): void {
        this.showGame = false;
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

