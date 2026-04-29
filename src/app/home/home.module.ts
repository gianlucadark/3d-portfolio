import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { SharedModule } from '../shared/shared.module';
import { HomeComponent } from './home.component';
import { DesktopComponent } from '../desktop/desktop.component';
import { TaskbarComponent } from '../taskbar/taskbar.component';
import { WindowComponent } from '../window/window.component';
import { PaintComponent } from '../paint/paint.component';
import { ThreeSceneService } from './three-scene.service';

@NgModule({
  declarations: [
    HomeComponent,
    DesktopComponent,
    TaskbarComponent,
    WindowComponent,
    PaintComponent,
  ],
  imports: [
    SharedModule,
    FormsModule,
    DragDropModule,
    RouterModule.forChild([{ path: '', component: HomeComponent }]),
  ],
  providers: [ThreeSceneService],
})
export class HomeModule {}
