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
    threeInitialized = false;

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
                    this.isBiosComplete = true;
                    this.showWelcome = true;
                    // Three.js finished loading while user is on desktop: position
                    // the camera at the screen so returnFromDesktop() has a visible
                    // zoom-out animation (screen → room) instead of a no-op tween.
                    if (this.showDesktop && !this.showGame) {
                        this.threeSceneService.setInitialPositionOnScreen();
                    }
                    this.cdr.markForCheck();
                }
                this.cdr.markForCheck();
            });

        // Show BIOS animation for 1.5s, then show welcome + "Enter" immediately
        // without waiting for Three.js (which loads only when 3D room is needed).
        this.biosTimerId = setTimeout(() => {
            this.isBiosComplete = true;
            this.showWelcome = true;
            this.isLoadingComplete = true;
            this.cdr.markForCheck();
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
        // Three.js is NOT initialized here — it loads on demand when the user
        // returns from the desktop to the 3D room (see initThreeIfNeeded).
        // This keeps Three.js completely out of the Lighthouse critical path.
    }

    private initThreeIfNeeded(): void {
        if (this.threeInitialized) return;
        this.threeInitialized = true;
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
        this.showDesktop = true;
        this.cdr.markForCheck();

        // Start loading Three.js in background while user explores the desktop.
        // By the time they close the desktop and want to see the 3D room,
        // the GLB will likely be ready. This keeps Three.js out of Lighthouse's
        // critical path entirely.
        this.initThreeIfNeeded();

        document.fonts.load('700 16px Syne');
        document.fonts.load('400 16px Inter');

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
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

