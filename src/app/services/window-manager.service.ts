import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Window } from 'src/utilities/interface/window.interface';

/**
 * Servizio per la gestione centralizzata delle finestre
 * Implementa il pattern Service per separare la logica di business
 */
@Injectable({
    providedIn: 'root'
})
export class WindowManagerService {
    private openWindows$ = new BehaviorSubject<Window[]>([]);
    private highestZIndex = 1000;

    /**
     * Observable delle finestre aperte
     */
    get windows$(): Observable<Window[]> {
        return this.openWindows$.asObservable();
    }

    /**
     * Ottiene l'array corrente delle finestre
     */
    get windows(): Window[] {
        return this.openWindows$.value;
    }

    /**
     * Apre una nuova finestra o porta in primo piano una esistente
     */
    openWindow(window: Window): void {
        const existingWindow = this.findWindow(window.id);

        if (existingWindow) {
            this.restoreWindow(window.id);
            this.bringToFront(window.id);
        } else {
            this.highestZIndex++;
            const newWindow = {
                ...window,
                zIndex: this.highestZIndex,
                isOpen: true,
                isMinimized: false
            };

            const currentWindows = this.openWindows$.value;
            this.openWindows$.next([...currentWindows, newWindow]);
        }
    }

    /**
     * Chiude una finestra
     */
    closeWindow(id: number): void {
        const currentWindows = this.openWindows$.value;
        const filteredWindows = currentWindows.filter(w => w.id !== id);
        this.openWindows$.next(filteredWindows);
    }

    /**
     * Minimizza una finestra
     */
    minimizeWindow(id: number): void {
        this.updateWindow(id, { isMinimized: true });
    }

    /**
     * Ripristina una finestra minimizzata
     */
    restoreWindow(id: number): void {
        this.updateWindow(id, { isMinimized: false });
    }

    /**
     * Porta una finestra in primo piano
     */
    bringToFront(id: number): void {
        this.highestZIndex++;
        this.updateWindow(id, { zIndex: this.highestZIndex });
    }

    /**
     * Trova una finestra per ID
     */
    findWindow(id: number): Window | undefined {
        return this.openWindows$.value.find(w => w.id === id);
    }

    /**
     * Aggiorna le proprietà di una finestra
     */
    private updateWindow(id: number, updates: Partial<Window>): void {
        const currentWindows = this.openWindows$.value;
        const updatedWindows = currentWindows.map(w =>
            w.id === id ? { ...w, ...updates } : w
        );
        this.openWindows$.next(updatedWindows);
    }

    /**
     * Chiude tutte le finestre
     */
    closeAllWindows(): void {
        this.openWindows$.next([]);
    }

    /**
     * Ottiene il numero di finestre aperte
     */
    getOpenWindowsCount(): number {
        return this.openWindows$.value.filter(w => w.isOpen && !w.isMinimized).length;
    }

    /**
     * Verifica se una finestra è aperta
     */
    isWindowOpen(id: number): boolean {
        const window = this.findWindow(id);
        return window?.isOpen && !window?.isMinimized || false;
    }
}
