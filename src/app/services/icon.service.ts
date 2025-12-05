import { Injectable } from '@angular/core';
import { Icon } from 'src/utilities/interface/icon.interface';
import {
    ASSET_PATHS,
    WINDOW_IDS,
    PROJECT_DESCRIPTIONS
} from '../constants/app.constants';

/**
 * Configurazione delle icone del desktop
 */
export const DESKTOP_ICONS: Icon[] = [
    {
        id: WINDOW_IDS.COMPUTER,
        name: 'Computer',
        image: ASSET_PATHS.ICONS.COMPUTER,
        position: { x: 20, y: 20 }
    },
    {
        id: WINDOW_IDS.CV,
        name: 'CV Gianluca',
        image: ASSET_PATHS.ICONS.CV,
        position: { x: 20, y: 120 }
    },
    {
        id: WINDOW_IDS.PROMPT,
        name: 'Prompt',
        image: ASSET_PATHS.ICONS.PROMPT,
        position: { x: 20, y: 220 }
    },
    {
        id: WINDOW_IDS.README,
        name: 'README',
        image: ASSET_PATHS.ICONS.README,
        position: { x: 20, y: 320 }
    },
    {
        id: WINDOW_IDS.PAINT,
        name: 'Paint',
        image: ASSET_PATHS.ICONS.PAINT,
        position: { x: 20, y: 420 }
    },
    {
        id: WINDOW_IDS.TRASH,
        name: 'Cestino',
        image: ASSET_PATHS.ICONS.TRASH,
        position: { x: 0, y: 0 } // Calcolato dinamicamente
    },
    {
        id: WINDOW_IDS.NOTEPAD,
        name: 'Blocco Note',
        image: ASSET_PATHS.ICONS.PAPER,
        position: { x: 20, y: 520 }
    },
    {
        id: WINDOW_IDS.EMAIL,
        name: 'Email',
        image: ASSET_PATHS.ICONS.EMAIL,
        position: { x: 20, y: 620 }
    },
    {
        id: WINDOW_IDS.PROJECTS,
        name: 'Progetti',
        image: ASSET_PATHS.ICONS.FOLDER,
        position: { x: 150, y: 20 }
    },
    {
        id: WINDOW_IDS.UXABILITY,
        name: 'Uxability',
        image: ASSET_PATHS.ICONS.FOLDER,
        position: { x: 150, y: 120 },
        parentId: WINDOW_IDS.PROJECTS,
        description: PROJECT_DESCRIPTIONS.UXABILITY
    },
    {
        id: WINDOW_IDS.WEB_EXTENSION,
        name: 'Estensione Web',
        image: ASSET_PATHS.ICONS.FOLDER,
        position: { x: 150, y: 220 },
        parentId: WINDOW_IDS.PROJECTS,
        description: PROJECT_DESCRIPTIONS.WEB_EXTENSION
    }
];

/**
 * Servizio per la gestione delle icone del desktop
 */
@Injectable({
    providedIn: 'root'
})
export class IconService {
    private icons: Icon[] = [];

    constructor() {
        this.initializeIcons();
    }

    /**
     * Inizializza le icone con posizioni calcolate dinamicamente
     */
    private initializeIcons(): void {
        this.icons = DESKTOP_ICONS.map(icon => {
            // Calcola posizione del cestino dinamicamente
            if (icon.id === WINDOW_IDS.TRASH) {
                return {
                    ...icon,
                    position: this.calculateTrashPosition()
                };
            }
            return { ...icon };
        });
    }

    /**
     * Calcola la posizione del cestino nell'angolo in basso a destra
     */
    private calculateTrashPosition(): { x: number; y: number } {
        return {
            x: window.innerWidth - 100,
            y: window.innerHeight - 124
        };
    }

    /**
     * Ottiene tutte le icone
     */
    getAllIcons(): Icon[] {
        return [...this.icons];
    }

    /**
     * Ottiene le icone del desktop (senza parent)
     */
    getDesktopIcons(): Icon[] {
        return this.icons.filter(icon => !icon.parentId);
    }

    /**
     * Ottiene le sotto-icone di una cartella
     */
    getSubIcons(parentId: number): Icon[] {
        return this.icons.filter(icon => icon.parentId === parentId);
    }

    /**
     * Trova un'icona per ID
     */
    findIcon(id: number): Icon | undefined {
        return this.icons.find(icon => icon.id === id);
    }

    /**
     * Ottiene la descrizione di un'icona
     */
    getIconDescription(id: number): string | undefined {
        return this.findIcon(id)?.description;
    }

    /**
     * Aggiorna la posizione di un'icona
     */
    updateIconPosition(id: number, position: { x: number; y: number }): void {
        const icon = this.findIcon(id);
        if (icon) {
            icon.position = position;
        }
    }

    /**
     * Ricalcola le posizioni dinamiche (es. dopo resize della finestra)
     */
    recalculateDynamicPositions(): void {
        const trashIcon = this.findIcon(WINDOW_IDS.TRASH);
        if (trashIcon) {
            trashIcon.position = this.calculateTrashPosition();
        }
    }

    /**
     * Verifica se un'icona è una cartella
     */
    isFolder(id: number): boolean {
        const icon = this.findIcon(id);
        return icon?.image.includes('folder') || false;
    }

    /**
     * Verifica se un'icona ha sotto-elementi
     */
    hasSubIcons(id: number): boolean {
        return this.getSubIcons(id).length > 0;
    }
}
