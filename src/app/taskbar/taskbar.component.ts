import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { TranslationService, Language } from '../services/translation.service';
import { OpenWindow } from 'src/utilities/interface/open-window.interface';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-taskbar',
  templateUrl: './taskbar.component.html',
  styleUrls: ['./taskbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskbarComponent implements OnInit, OnDestroy {
  @Input() openWindows: OpenWindow[] = [];
  @Output() readonly startClick = new EventEmitter<void>();
  @Output() readonly windowClick = new EventEmitter<number>();
  @Output() readonly openWindow = new EventEmitter<number>();

  currentTime = '';
  private timerId: ReturnType<typeof setInterval> | null = null;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly cdr: ChangeDetectorRef,
    private readonly translationService: TranslationService
  ) { }

  get currentLanguage(): Language {
    return this.translationService.currentLanguage;
  }

  onLanguageToggle(): void {
    this.translationService.toggleLanguage();
    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    this.updateTime();
    this.timerId = setInterval(() => {
      this.updateTime();
      this.cdr.markForCheck();
    }, 1000);

    this.translationService.language$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateTime();
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateTime(): void {
    const locale = this.currentLanguage === 'it' ? 'it-IT' : 'en-US';
    this.currentTime = new Date().toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  onStartClick(): void {
    this.startClick.emit();
  }

  onWindowClick(windowId: number): void {
    const window = this.openWindows.find(w => w.id === windowId);

    if (window) {
      this.windowClick.emit(windowId);
    } else {
      this.openWindow.emit(windowId);
    }
  }
}
