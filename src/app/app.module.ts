import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { DesktopComponent } from './desktop/desktop.component';
import { GameComponent } from './game/game.component';
import { TaskbarComponent } from './taskbar/taskbar.component';
import { WindowComponent } from './window/window.component';
import { SafePipe } from '../utilities/pipe/safe.pipe';
import { PaintComponent } from './paint/paint.component';
import { TranslatePipe } from './pipes/translate.pipe';
import { TranslationService } from './services/translation.service';
import { IT_TRANSLATIONS } from './i18n/it.translations';
import { EN_TRANSLATIONS } from './i18n/en.translations';

// Funzione per inizializzare le traduzioni
export function initializeTranslations(translationService: TranslationService) {
  return () => {
    translationService.registerTranslations('it', IT_TRANSLATIONS);
    translationService.registerTranslations('en', EN_TRANSLATIONS);
  };
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    DesktopComponent,
    GameComponent,
    TaskbarComponent,
    WindowComponent,
    SafePipe,
    PaintComponent,
    TranslatePipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    DragDropModule
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeTranslations,
      deps: [TranslationService],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
