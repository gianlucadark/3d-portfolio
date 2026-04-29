import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { SharedModule } from '../shared/shared.module';
import { DesktopComponent } from './desktop.component';
import { TaskbarComponent } from '../taskbar/taskbar.component';
import { WindowComponent } from '../window/window.component';
import { PaintComponent } from '../paint/paint.component';

/**
 * Lazy module for the full desktop experience.
 * Loaded only after the user clicks "Enter Portfolio" — never during the
 * Lighthouse / PSI audit — so DragDropModule and FormsModule stay out of
 * the critical-path bundle.
 */
@NgModule({
  declarations: [DesktopComponent, TaskbarComponent, WindowComponent, PaintComponent],
  imports: [SharedModule, FormsModule, DragDropModule],
  exports: [DesktopComponent],
})
export class DesktopModule {
  static readonly rootComponent = DesktopComponent;
}
