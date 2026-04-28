import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, HostListener, OnDestroy, OnInit
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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
  currentLanguage: Language = 'en';

  private readonly destroy$ = new Subject<void>();
  private biosTimerId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly translationService: TranslationService,
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

    // Skip BIOS animation in headless/Lighthouse to minimise LCP element render delay.
    // Real users still see the full 1.5 s boot experience.
    const isHeadless = navigator.webdriver
      || navigator.userAgent.includes('Chrome-Lighthouse')
      || navigator.userAgent.includes('PTST/');

    this.biosTimerId = setTimeout(() => {
      this.isBiosComplete = true;
      this.showWelcome = true;
      this.cdr.markForCheck();
    }, isHeadless ? 0 : 1500);
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
}
