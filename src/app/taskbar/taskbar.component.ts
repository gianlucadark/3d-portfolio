import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { OpenWindow } from 'src/utilities/interface/open-window.interface';

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

  constructor(private readonly cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.updateTime();
    this.timerId = setInterval(() => {
      this.updateTime();
      this.cdr.markForCheck();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private updateTime(): void {
    this.currentTime = new Date().toLocaleTimeString('it-IT', {
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
