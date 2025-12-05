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
    DEFAULT_WIDTH: 600,
    DEFAULT_HEIGHT: 700,
    TASKBAR_HEIGHT: 30,
    MOBILE_BREAKPOINT: 768,
    MOBILE_WIDTH_RATIO: 0.9,
    MOBILE_HEIGHT_RATIO: 0.8,
    INITIAL_Z_INDEX: 1000
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
            INTENSITY_LIGHT: 0.5,
            INTENSITY_DARK: 0.05
        },
        DIRECTIONAL: {
            INTENSITY_LIGHT: 1.0,
            INTENSITY_DARK: 0
        },
        RECT: {
            INTENSITY_LIGHT: 2,
            INTENSITY_DARK: 0
        }
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
    MAX_PIXEL_RATIO: 2
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
    9: 'email'
} as const;

// ============================================
// FINESTRE FULLSCREEN
// ============================================
export const FULLSCREEN_WINDOWS = [3, 11, 12] as const;

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
    12: 'webExtension'
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
        ROUGHNESS: 0.1,
        METALNESS: 0.05,
        CLEARCOAT: 0.8
    },
    GLASS: {
        TRANSMISSION: 0,
        ROUGHNESS: 0.8,
        METALNESS: 0.8,
        IOR: 1.5
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
