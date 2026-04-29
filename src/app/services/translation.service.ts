import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IT_TRANSLATIONS } from '../i18n/it.translations';
import { EN_TRANSLATIONS } from '../i18n/en.translations';

/** Lingue supportate dall'applicazione */
export type Language = 'it' | 'en';

/** Chiave per localStorage */
const STORAGE_KEY = 'portfolio-language';

@Injectable({
    providedIn: 'root'
})
export class TranslationService {
    private readonly currentLanguage$ = new BehaviorSubject<Language>(this.loadSavedLanguage());
    private readonly translations: Record<Language, Record<string, unknown>> = {
        it: IT_TRANSLATIONS as Record<string, unknown>,
        en: EN_TRANSLATIONS as Record<string, unknown>
    };

    /** Observable della lingua corrente */
    readonly language$: Observable<Language> = this.currentLanguage$.asObservable();

    /** Ottiene la lingua corrente */
    get currentLanguage(): Language {
        return this.currentLanguage$.value;
    }

    private loadSavedLanguage(): Language {
        try {
            const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
            return saved === 'it' || saved === 'en' ? saved : 'en';
        } catch {
            return 'en';
        }
    }

    setLanguage(lang: Language): void {
        if (lang === this.currentLanguage) return;

        this.currentLanguage$.next(lang);

        try {
            localStorage.setItem(STORAGE_KEY, lang);
        } catch {
            // localStorage non disponibile
        }
    }

    toggleLanguage(): void {
        this.setLanguage(this.currentLanguage === 'it' ? 'en' : 'it');
    }

    translate(key: string, lang?: Language): string {
        const targetLang = lang ?? this.currentLanguage;
        const keys = key.split('.');

        let value: unknown = this.translations[targetLang];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = (value as Record<string, unknown>)[k];
            } else {
                return key;
            }
        }

        return typeof value === 'string' ? value : key;
    }

    getTranslations(lang?: Language): Record<string, unknown> {
        return this.translations[lang ?? this.currentLanguage];
    }
}
