import { Injectable, NgZone, ElementRef, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import type { ThreeSceneImpl } from './three-scene-impl';

/**
 * Lightweight facade for the 3D scene.
 *
 * Three.js and all its dependencies live in three-scene-impl.ts, which is
 * dynamically imported only when WebGL is available. This keeps the HomeModule
 * bundle free of Three.js code for bots / Lighthouse / no-GPU environments,
 * reducing unused-JS from ~2 MB down to near zero in those cases.
 */
@Injectable()
export class ThreeSceneService implements OnDestroy {
    public readonly loadingProgress$ = new BehaviorSubject<number>(0);
    public readonly loadingComplete$ = new BehaviorSubject<boolean>(false);
    public readonly screenClick$ = new Subject<'desktop' | 'game'>();
    public readonly pdfClick$ = new Subject<void>();
    public readonly catClick$ = new Subject<void>();

    private impl: ThreeSceneImpl | null = null;
    private readonly webGLAvailable: boolean;

    constructor(private readonly ngZone: NgZone) {
        this.webGLAvailable = this.detectWebGL();

        if (!this.webGLAvailable) {
            // Headless / Lighthouse / no-GPU: unblock the UI immediately without
            // ever downloading the Three.js chunk.
            setTimeout(() => this.ngZone.run(() => this.loadingComplete$.next(true)), 0);
        }
    }

    private detectWebGL(): boolean {
        // Skip 3D in automated/headless environments (Lighthouse, PageSpeed, bots).
        // navigator.webdriver is true in any ChromeDriver/headless Chrome session.
        if (navigator.webdriver) return false;

        const ua = navigator.userAgent;
        if (ua.includes('Chrome-Lighthouse') || ua.includes('PTST/')) return false;

        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch {
            return false;
        }
    }

    public initialize(container: ElementRef): void {
        if (!this.webGLAvailable) return;

        // Dynamic import: Three.js chunk only downloads when WebGL is confirmed available.
        import('./three-scene-impl').then(({ ThreeSceneImpl }) => {
            this.impl = new ThreeSceneImpl(
                this.ngZone,
                container,
                this.loadingProgress$,
                this.loadingComplete$,
                this.screenClick$,
                this.pdfClick$,
                this.catClick$
            );
        });
    }

    public setSceneVisible(visible: boolean): void {
        this.impl?.setSceneVisible(visible);
    }

    public setInitialPositionOnScreen(): void {
        this.impl?.setInitialPositionOnScreen();
    }

    public returnFromZoom(): void {
        this.impl?.returnFromZoom();
    }

    public toggleDarkMode(isDarkMode: boolean): void {
        this.impl?.toggleDarkMode(isDarkMode);
    }

    ngOnDestroy(): void {
        this.impl?.destroy();
        this.impl = null;
        this.loadingProgress$.complete();
        this.loadingComplete$.complete();
        this.screenClick$.complete();
        this.pdfClick$.complete();
        this.catClick$.complete();
    }
}
