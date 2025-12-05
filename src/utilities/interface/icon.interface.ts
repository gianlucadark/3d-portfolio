/**
 * Rappresenta la posizione di un elemento sullo schermo
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Rappresenta un'icona sul desktop
 */
export interface Icon {
  /** ID univoco dell'icona */
  id: number;

  /** Nome visualizzato dell'icona */
  name: string;

  /** Percorso dell'immagine dell'icona */
  image: string;

  /** Posizione dell'icona sul desktop */
  position: Position;

  /** ID dell'icona parent (per sotto-cartelle) */
  parentId?: number;

  /** Descrizione dettagliata dell'icona */
  description?: string;
}
