import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { HomeComponent } from './home.component';
import { DesktopComponent } from '../desktop/desktop.component';
import { GameComponent } from '../game/game.component';
import { TaskbarComponent } from '../taskbar/taskbar.component';
import { WindowComponent } from '../window/window.component';
import { PaintComponent } from '../paint/paint.component';
import { TranslatePipe } from '../pipes/translate.pipe';
import { SafePipe } from '../../utilities/pipe/safe.pipe';
import { ThreeSceneService } from './three-scene.service';

@NgModule({
  declarations: [
    HomeComponent,
    DesktopComponent,
    GameComponent,
    TaskbarComponent,
    WindowComponent,
    PaintComponent,
    TranslatePipe,
    SafePipe,
  ],
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    RouterModule.forChild([{ path: '', component: HomeComponent }]),
  ],
  providers: [ThreeSceneService],
})
export class HomeModule {}
