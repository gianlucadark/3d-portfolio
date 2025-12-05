import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
    showDesktop = false;
    showGame = false;
    currentLanguage: Language = 'it';

    // Loading State
    isLoading = true;
    isLoadingComplete = false;
    loadingProgress = 0;

    private readonly destroy$ = new Subject<void>();

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
    }

    ngAfterViewInit(): void {
        this.threeSceneService.initialize(this.rendererContainer);
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        // Service handles its own cleanup via OnDestroy if provided in root, 
        // but since we might want to destroy the scene when component is destroyed:
        // Actually providedIn: 'root' means singleton. 
        // If we want it to be destroyed with component, we should provide it in component providers.
        // But for now, let's assume we want to keep it or we should manually call cleanup if needed.
        // Given the providedIn: 'root', it won't be destroyed automatically.
        // We should probably add a cleanup method to service and call it here if we want to free resources.
        // However, the service implements OnDestroy, but that only triggers if the service itself is destroyed (e.g. if provided in component).
    }

    enterPortfolio(): void {
        this.isLoading = false;
        this.cdr.markForCheck();
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

    toggleDarkMode(): void {
        this.isDarkMode = !this.isDarkMode;
        this.threeSceneService.toggleDarkMode(this.isDarkMode);
        this.cdr.markForCheck();
    }

    toggleLanguage(): void {
        this.translationService.toggleLanguage();
    }
}

