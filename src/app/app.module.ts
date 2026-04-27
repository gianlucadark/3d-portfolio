import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TranslationService } from './services/translation.service';
import { IT_TRANSLATIONS } from './i18n/it.translations';
import { EN_TRANSLATIONS } from './i18n/en.translations';

export function initializeTranslations(translationService: TranslationService) {
  return () => {
    translationService.registerTranslations('it', IT_TRANSLATIONS);
    translationService.registerTranslations('en', EN_TRANSLATIONS);
  };
}

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, AppRoutingModule],
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
