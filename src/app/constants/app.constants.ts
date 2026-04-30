/**
 * Costanti globali dell'applicazione
 * Centralizza tutte le configurazioni per una manutenzione più semplice
 */

// ============================================
// CONFIGURAZIONE FINESTRE
// ============================================
export const WINDOW_CONFIG = {
    MIN_WIDTH: 200,
    MIN_HEIGHT: 150,
    DEFAULT_WIDTH: 700,
    DEFAULT_HEIGHT: 550, // Reduced from 700 to fit better on standard screens
    TASKBAR_HEIGHT: 30,
    MOBILE_TASKBAR_HEIGHT: 44,
    MOBILE_BREAKPOINT: 768,
    MOBILE_WIDTH_RATIO: 0.9,
    MOBILE_HEIGHT_RATIO: 0.8,
    INITIAL_Z_INDEX: 1000
} as const;

export const ICON_GRID_CONFIG = {
    ITEM_WIDTH: 100,
    ITEM_HEIGHT: 100,
    PADDING_LEFT: 20,
    PADDING_TOP: 20,
    MARGIN: 10
} as const;

// ============================================
// CONFIGURAZIONE DESKTOP
// ============================================
export const DESKTOP_CONFIG = {
    DOUBLE_TAP_THRESHOLD: 300,
    ICON_SPACING: 100,
    ICON_START_X: 20,
    ICON_START_Y: 20,
    ICON_OFFSET_X: 130
} as const;

// ============================================
// CONFIGURAZIONE THREE.JS
// ============================================
export const THREE_CONFIG = {
    CAMERA: {
        FOV: 75,
        NEAR: 0.1,
        FAR: 1000,
        INITIAL_Z: 7,
        INITIAL_X_OFFSET: 0.1
    },
    CONTROLS: {
        DAMPING_FACTOR: 0.03,
        MIN_DISTANCE: 0.5,
        MAX_DISTANCE: 12
    },
    LIGHTS: {
        AMBIENT: {
            INTENSITY_LIGHT: 0.35,
            INTENSITY_DARK: 0.05
        },
        DIRECTIONAL: {
            INTENSITY_LIGHT: 1.4,
            INTENSITY_DARK: 0
        },
        RECT: {
            INTENSITY_LIGHT: 3,
            INTENSITY_DARK: 0
        },
        EXPOSURE: 0.55,
        ENVIRONMENT_INTENSITY: 0.2
    },
    ZOOM: {
        SCREEN_DISTANCE: 1.5,
        GAME_DISTANCE: 1.2,
        ANIMATION_DURATION: 1.5,
        RETURN_DURATION: 1.2
    },
    MODEL: {
        POSITION_Y_OFFSET: 3.5,
        POSITION_X_OFFSET: 0.5
    },
    SHADOW_MAP_SIZE: 1024,
    MAX_PIXEL_RATIO: 2,
    ENV_ROTATION: {
        X: -Math.PI / 3,
        Y: 0
    }
} as const;

// ============================================
// COMANDI PROMPT
// ============================================
export const PROMPT_COMMANDS = {
    HELP: 'help',
    ABOUT_ME: 'aboutme',
    WHY_XP: 'whyxp',
    WHY_PROMPT: 'whyprompt',
    CLEAR: 'clear'
} as const;

// ============================================
// MAPPA TIPI FINESTRA
// ============================================
export const WINDOW_TYPE_MAP: Record<number, string> = {
    1: 'computer',
    3: 'cv',
    4: 'prompt',
    5: 'readme',
    6: 'paint',
    7: 'recycle-bin',
    8: 'notepad',
    9: 'email',
    11: 'uxability',
    12: 'web-extension',
    13: 'cv'
} as const;

// ============================================
// FINESTRE FULLSCREEN
// ============================================
export const FULLSCREEN_WINDOWS = [3, 11, 12, 13] as const;

// ============================================
// MAPPA CHIAVI ICONE PER TRADUZIONE
// ============================================
export const ICON_KEY_MAP: Record<number, string> = {
    1: 'computer',
    3: 'cv',
    4: 'prompt',
    5: 'readme',
    6: 'paint',
    7: 'trash',
    8: 'notepad',
    9: 'email',
    10: 'projects',
    11: 'uxability',
    12: 'webExtension',
    13: 'curriculum',
    99: 'system32'
} as const;

// ============================================
// MATERIALI 3D
// ============================================
export const MATERIAL_CONFIG = {
    LED: {
        COLOR: 0xADD8E6,
        EMISSIVE_INTENSITY: 500,
        POINT_LIGHT_INTENSITY: 30,
        POINT_LIGHT_DISTANCE: 8
    },
    SCREEN: {
        EMISSIVE_INTENSITY: 0.8,
        ROUGHNESS: 0.3,
        METALNESS: 0.3
    },
    MARBLE: {
        ROUGHNESS: 0.02,
        METALNESS: 0,
        CLEARCOAT: 1.0,
        CLEARCOAT_ROUGHNESS: 0.015,
        ENV_MAP_INTENSITY: 5.0
    },
    WALL: {
        ROUGHNESS: 0.0,
        METALNESS: 0,
        TRANSMISSION: 1.0,
        IOR: 1.52,
        THICKNESS: 0.4,
        CLEARCOAT: 1.0,
        CLEARCOAT_ROUGHNESS: 0.02,
        REFLECTIVITY: 0.5,
        ENV_MAP_INTENSITY: 2.5,
    },
    GLASS: {
        TRANSMISSION: 0.88,
        ROUGHNESS: 0.04,
        METALNESS: 0,
        IOR: 1.52,
        CLEARCOAT: 0.9,
        CLEARCOAT_ROUGHNESS: 0.03,
        ENV_MAP_INTENSITY: 3.5,
        COLOR: 0xD0CCFF
    },
    CEILING: {
        EMISSIVE_INTENSITY: 3
    }
} as const;

// ============================================
// COLORI
// ============================================
export const COLORS = {
    ICE_BLUE: 0xADD8E6,
    WHITE: 0xffffff,
    BLACK: 0x000000,
    DARK_BACKGROUND: 0x050505,
    COSMOS: 0x080D14,
    YELLOW: 0xebeb00
} as const;

// ============================================
// CONFIGURAZIONE GAME PAC-MAN
// ============================================
export const PACMAN_CONFIG = {
    TILE_SIZE: 20,
    ROWS: 20,
    COLS: 20,
    SPEED: 0.15,
    POWER_MODE_DURATION: 600,
    GHOST_SPEED_MULTIPLIER: {
        BLINKY: 0.9,
        PINKY: 0.85,
        INKY: 0.8,
        CLYDE: 0.8
    },
    POINTS: {
        DOT: 10,
        POWER_PELLET: 50,
        BASE_GHOST: 200
    }
} as const;

// ============================================
// ID FINESTRE
// ============================================
export const WINDOW_IDS = {
    COMPUTER: 1,
    CV: 3,
    PROMPT: 4,
    README: 5,
    PAINT: 6,
    TRASH: 7,
    NOTEPAD: 8,
    EMAIL: 9,
    PROJECTS: 10,
    UXABILITY: 11,
    WEB_EXTENSION: 12,
    CURRICULUM: 13
} as const;

// ============================================
// PATH ASSET
// ============================================
export const ASSET_PATHS = {
    ICONS: {
        COMPUTER: 'assets/icons/computer.ico',
        CV: 'assets/icons/cv.webp',
        PROMPT: 'assets/icons/prompt.webp',
        README: 'assets/icons/readme.ico',
        PAINT: 'assets/icons/paint.webp',
        TRASH: 'assets/icons/cestino.webp',
        PAPER: 'assets/icons/paper.ico',
        EMAIL: 'assets/icons/email.png',
        FOLDER: 'assets/icons/folder.ico'
    }
} as const;

// ============================================
// DESCRIZIONI PROGETTI
// ============================================
export const PROJECT_DESCRIPTIONS = {
    UXABILITY: `Uxability è una web app moderna e performante, basata su Next.js e disponibile su https://uxability.vercel.app/, che permette di effettuare audit completi di qualsiasi sito web. Inserendo un URL, il sistema analizza istantaneamente Performance, SEO, Accessibilità e Best Practices, fornendo report dettagliati e suggerimenti mirati per migliorare l'esperienza utente e il posizionamento sui motori di ricerca. Uno strumento essenziale per developer e proprietari di siti che puntano all'eccellenza digitale.`,
    WEB_EXTENSION: `L'estensione web sviluppata, consente di migliorare sensibilmente l'accessibilità dei siti internet, offrendo strumenti avanzati e personalizzabili per adattare la navigazione alle esigenze delle persone con disabilità. L'utente può intervenire in tempo reale su testo, contrasti, colori, spaziature, font e livello di zoom, rendendo ogni sito più leggibile e fruibile. Grazie a questa estensione, l'esperienza di navigazione diventa più inclusiva e accessibile per tutti, senza la necessità di modificare il sito originale.`
} as const;
