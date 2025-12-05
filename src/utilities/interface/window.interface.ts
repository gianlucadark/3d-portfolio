/**
 * Tipi di finestra supportati dal sistema
 */
export type WindowType =
  | 'cv'
  | 'prompt'
  | 'readme'
  | 'paint'
  | 'computer'
  | 'recycle-bin'
  | 'notepad'
  | 'email'
  | 'default';

/**
 * Dimensioni di una finestra
 */
export interface WindowSize {
  width: number;
  height: number;
}

/**
 * Rappresenta una finestra nel sistema operativo
 */
export interface Window {
  /** ID univoco della finestra */
  id: number;

  /** Titolo visualizzato nella barra del titolo */
  title: string;

  /** Percorso dell'icona della finestra */
  icon: string;

  /** Indica se la finestra è aperta */
  isOpen: boolean;

  /** Z-index per la gestione della sovrapposizione */
  zIndex: number;

  /** Tipo di finestra */
  windowType?: WindowType;

  /** Sorgente PDF per finestre di tipo documento */
  pdfSrc?: string;

  /** Indica se la finestra è minimizzata */
  isMinimized: boolean;

  /** Dimensioni della finestra */
  size?: WindowSize;
}

