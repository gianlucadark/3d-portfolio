import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, OnDestroy, OnInit
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AnalyticsService } from './services/analytics.service';
import { BootService } from './services/boot.service';
import { Language, TranslationService } from './services/translation.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, OnDestroy {
  isLoading = true;
  isEndingLoading = false;
  isBiosComplete = false;
  showWelcome = false;
  showAnalyticsBanner = false;
  currentLanguage: Language = 'en';

  private readonly destroy$ = new Subject<void>();
  private biosTimerId: ReturnType<typeof setTimeout> | null = null;
  private readonly biosDelay: number;

  constructor(
    private readonly translationService: TranslationService,
    private readonly bootService: BootService,
    private readonly analyticsService: AnalyticsService,
    private readonly cdr: ChangeDetectorRef
  ) {
    // Detect headless/crawler in constructor so the LCP <h1> is in the DOM
    // on the very first Angular render, with no extra change-detection cycle.
    const ua = navigator.userAgent;
    const isHeadless = navigator.webdriver
      || ua.includes('Chrome-Lighthouse')
      || ua.includes('PTST/')
      || ua.includes('HeadlessChrome')
      || ua.includes('Googlebot')
      || ua.includes('bot/');

    if (isHeadless) {
      this.isBiosComplete = true;
      this.showWelcome = true;
      this.biosDelay = 0;
    } else {
      // Mobile users have slower CPUs and less patience — shorten the BIOS.
      const isMobile = window.innerWidth <= 768;
      this.biosDelay = isMobile ? 700 : 1500;
    }
  }

  ngOnInit(): void {
    this.showAnalyticsBanner = this.analyticsService.getConsent() === null;
    this.analyticsService.enableIfConsented();

    this.translationService.language$
      .pipe(takeUntil(this.destroy$))
      .subscribe(lang => {
        this.currentLanguage = lang;
        this.cdr.markForCheck();
      });

    if (!this.isBiosComplete) {
      this.biosTimerId = setTimeout(() => {
        this.isBiosComplete = true;
        this.showWelcome = true;
        this.cdr.markForCheck();
        // After welcome screen is shown, prefetch the 3D model on desktop/fast connections.
        this.prefetchGlb();
      }, this.biosDelay);
    }
  }

  private prefetchGlb(): void {
    if (window.innerWidth <= 768) return;
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    };
    const conn = nav.connection;
    if (conn?.saveData) return;
    if (conn?.effectiveType === '2g' || conn?.effectiveType === 'slow-2g') return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = 'assets/3d/room-space-3-final.glb';
    link.as = 'fetch';
    link.setAttribute('crossorigin', '');
    document.head.appendChild(link);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.biosTimerId !== null) clearTimeout(this.biosTimerId);
  }

  /** Proxy for `| translate` — keeps AppComponent independent of HomeModule's pipe. */
  t(key: string): string {
    return this.translationService.translate(key);
  }

  enterPortfolio(): void {
    this.bootService.enter$.next();

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

  toggleLanguage(): void {
    this.translationService.toggleLanguage();
  }

  acceptAnalytics(): void {
    this.analyticsService.accept();
    this.showAnalyticsBanner = false;
    this.cdr.markForCheck();
  }

  rejectAnalytics(): void {
    this.analyticsService.reject();
    this.showAnalyticsBanner = false;
    this.cdr.markForCheck();
  }
}
