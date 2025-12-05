import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/** Lingue supportate dall'applicazione */
export type Language = 'it' | 'en';

/** Chiave per localStorage */
const STORAGE_KEY = 'portfolio-language';

/**
 * Servizio per la gestione delle traduzioni
 * Gestisce il caricamento, la memorizzazione e il cambio di lingua
 */
@Injectable({
    providedIn: 'root'
})
export class TranslationService {
    private readonly currentLanguage$ = new BehaviorSubject<Language>(this.loadSavedLanguage());
    private readonly translations: Record<Language, Record<string, unknown>> = {
        it: {},
        en: {}
    };

    /** Observable della lingua corrente */
    readonly language$: Observable<Language> = this.currentLanguage$.asObservable();

    /** Ottiene la lingua corrente */
    get currentLanguage(): Language {
        return this.currentLanguage$.value;
    }

    /**
     * Carica la lingua salvata da localStorage o usa italiano come default
     */
    private loadSavedLanguage(): Language {
        try {
            const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
            return saved === 'it' || saved === 'en' ? saved : 'it';
        } catch {
            return 'it';
        }
    }

    /**
     * Imposta la lingua corrente e la salva in localStorage
     */
    setLanguage(lang: Language): void {
        if (lang === this.currentLanguage) return;

        this.currentLanguage$.next(lang);

        try {
            localStorage.setItem(STORAGE_KEY, lang);
        } catch {
            // localStorage non disponibile
        }
    }

    /**
     * Alterna tra le lingue disponibili
     */
    toggleLanguage(): void {
        this.setLanguage(this.currentLanguage === 'it' ? 'en' : 'it');
    }

    /**
     * Registra le traduzioni per una lingua
     */
    registerTranslations(lang: Language, translations: Record<string, unknown>): void {
        this.translations[lang] = translations;
    }

    /**
     * Ottiene una traduzione per chiave usando dot notation
     * @param key Chiave della traduzione (es: 'common.close')
     * @param lang Lingua target (opzionale, default: lingua corrente)
     * @returns La traduzione o la chiave se non trovata
     */
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

    /**
     * Ottiene tutte le traduzioni per una lingua
     */
    getTranslations(lang?: Language): Record<string, unknown> {
        return this.translations[lang ?? this.currentLanguage];
    }
}
