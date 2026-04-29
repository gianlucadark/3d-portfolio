import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { SharedModule } from '../shared/shared.module';
import { HomeComponent } from './home.component';
import { ThreeSceneService } from './three-scene.service';

@NgModule({
  declarations: [HomeComponent],
  imports: [
    SharedModule,
    RouterModule.forChild([{ path: '', component: HomeComponent }]),
  ],
  providers: [ThreeSceneService],
})
export class HomeModule {}
