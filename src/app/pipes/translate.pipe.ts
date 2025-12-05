import { Pipe, PipeTransform, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { TranslationService } from '../services/translation.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Pipe per tradurre le chiavi nei template
 * Uso: {{ 'common.close' | translate }}
 * 
 * Ottimizzato con memoization per evitare ricalcoli inutili
 */
@Pipe({
    name: 'translate',
    pure: false
})
export class TranslatePipe implements PipeTransform, OnDestroy {
    private readonly destroy$ = new Subject<void>();
    private cachedKey = '';
    private cachedValue = '';
    private cachedLang = '';

    constructor(
        private readonly translationService: TranslationService,
        private readonly cdr: ChangeDetectorRef
    ) {
        this.translationService.language$
            .pipe(takeUntil(this.destroy$))
            .subscribe((lang) => {
                // Invalida cache quando cambia lingua
                if (lang !== this.cachedLang) {
                    this.cachedLang = lang;
                    this.cachedKey = '';
                    this.cachedValue = '';
                    this.cdr.markForCheck();
                }
            });
    }

    transform(key: string): string {
        // Return cached value if key hasn't changed and language is the same
        if (key === this.cachedKey && this.cachedLang === this.translationService.currentLanguage) {
            return this.cachedValue;
        }

        // Update cache
        this.cachedKey = key;
        this.cachedLang = this.translationService.currentLanguage;
        this.cachedValue = this.translationService.translate(key);

        return this.cachedValue;
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
