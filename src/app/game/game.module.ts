import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { GameComponent } from './game.component';

@NgModule({
  declarations: [GameComponent],
  imports: [SharedModule],
  exports: [GameComponent],
})
export class GameModule {
  /** Exposed so the dynamic loader can reference the class without a static import. */
  static readonly rootComponent = GameComponent;
}
