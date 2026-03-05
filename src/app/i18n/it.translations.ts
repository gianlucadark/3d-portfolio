/**
 * Traduzioni in Italiano
 */
export const IT_TRANSLATIONS = {
    common: {
        close: 'Chiudi',
        minimize: 'Riduci a icona',
        maximize: 'Ingrandisci',
        restore: 'Ripristina',
        back: 'Indietro',
        forward: 'Avanti',
        search: 'Cerca',
        folders: 'Cartelle',
        address: 'Indirizzo',
        go: 'Vai',
        desktop: 'Desktop',
        send: 'Invia',
        clear: 'Pulisci',
        error: 'Errore'
    },

    loading: {
        welcome: 'Benvenuto nel mio mondo.',
        welcome2: 'Il portfolio di un developer annoiato',
        loadingText: 'Caricamento esperienza 3D...',
        enterButton: 'ENTRA',
        switchLang: 'Passa all\'Inglese'
    },

    menu: {
        file: 'File',
        edit: 'Modifica',
        view: 'Visualizza',
        favorites: 'Preferiti',
        tools: 'Strumenti',
        help: 'Guida'
    },

    icons: {
        computer: 'Computer',
        cv: 'CV Gianluca',
        prompt: 'Prompt',
        readme: 'README',
        paint: 'Paint',
        trash: 'Cestino',
        notepad: 'Blocco Note',
        email: 'Email',
        projects: 'Progetti',
        curriculum: 'Curriculum',
        uxability: 'Uxability',
        webExtension: 'Estensione Web'
    },

    startMenu: {
        user: 'Gianluca D\'Arcangelo',
        shutdown: 'Spegni computer',
        commandPrompt: 'Prompt dei Comandi'
    },

    readme: {
        title: 'Benvenuti nel mio Portfolio XP 🚀',
        noteLabel: 'Premessa',
        warning: 'Non è ottimizzato per mobile! D\'altronde...è pur sempre Windows XP!',
        intro: 'Ciao! Sono Gianluca D\'Arcangelo, nato nel 1997 e cresciuto con il suono d\'avvio di Windows XP e le prime connessioni a 56k. Questo portfolio è un tributo al sistema operativo che ha segnato l\'inizio della mia passione per la tecnologia e la creatività digitale.',
        cvLink: 'Se vuoi vedere direttamente il CV clicca qui'
    },

    prompt: {
        help: 'Digita "help" per vedere i comandi',
        commands: {
            aboutme: '- aboutme',
            whyxp: '- whyxp',
            whyprompt: '- whyprompt',
            clear: '- clear'
        },
        responses: {
            aboutme: 'Ciao! Sono Gianluca, sono nato a Terracina (LT) il 25 Settembre 1997. Sono un full stack developer con una forte passione per il frontend e il design UI/UX. Amo creare interfacce utente intuitive e migliorare l\'esperienza utente attraverso il design.',
            whyxp: 'Ho scelto di ispirare il design del mio portfolio a Windows XP perché rappresenta il punto di partenza del mio viaggio digitale. È un omaggio nostalgico ai primi esperimenti su Paint e alle lunghe sessioni di Minesweeper. Nonostante oggi lavori con tecnologie avanzate, XP resta un simbolo delle mie radici. Il design fonde passato e futuro, con un\'estetica vintage che accompagna competenze moderne e progetti innovativi.',
            whyprompt: 'Ho scelto di implementare questo mini prompt perché rappresenta il mio primo vero approccio al mondo della programmazione. Da piccolo, il prompt di Windows era per me una porta verso un universo sconosciuto, e mi divertivo a esplorare i vari comandi, quasi sentendomi un hacker. Passavo ore cercando di capire come funzionassero le istruzioni e cosa potessi fare con quel semplice schermo nero e bianco.',
            commandNotFound: 'Comando non riconosciuto:'
        }
    },

    email: {
        placeholder: 'Scrivi il tuo messaggio qui...',
        send: 'Invia Email',
        to: 'A:',
        cc: 'Cc:',
        subject: 'Oggetto:',
        sendBtn: 'Invia',
        cut: 'Taglia',
        copy: 'Copia',
        paste: 'Incolla',
        undo: 'Annulla'
    },

    projects: {
        uxability: {
            name: 'Uxability',
            subtitle: 'Analisi Accessibilità & Performance Web',
            description: 'Uxability è una moderna web app sviluppata con Next.js che permette di analizzare istantaneamente Performance, SEO, Accessibilità e Best Practices di qualsiasi sito web.',
            overview: 'Attraverso un\'interfaccia intuitiva e veloce, Uxability esegue un audit completo del tuo URL. Il sistema valuta i parametri vitali del web, fornendo punteggi chiari e suggerimenti tecnici per ottimizzare la velocità di caricamento, la visibilità sui motori di ricerca e l\'inclusività dei contenuti.',
            featuresTitle: 'Funzionalità Principali',
            feature1Title: 'Analisi Accessibilità',
            feature1Desc: 'Scansione completa del sito web secondo le linee guida WCAG 2.1, con identificazione di errori e warning classificati per gravità.',
            feature2Title: 'Analisi SEO',
            feature2Desc: 'Ottimizzazione per i motori di ricerca con controllo dei meta tag, struttura degli heading e qualità dei contenuti.',
            feature3Title: 'Report Dettagliati',
            feature3Desc: 'Generazione di report completi con metriche di accessibilità, performance e best practice, esportabili e condivisibili.',
            feature4Title: 'Best Practices',
            feature4Desc: 'Analisi della sicurezza, delle librerie utilizzate e delle moderne tecniche di sviluppo web.',
            feature5Title: 'Analisi Performance',
            feature5Desc: 'Misurazione dei Core Web Vitals (LCP, FID, CLS) e suggerimenti per ottimizzare velocità e reattività del sito.',
            feature6Title: 'Storico Analisi',
            feature6Desc: 'Tracciamento nel tempo delle analisi effettuate per monitorare i progressi e le migliorie apportate al sito.',
            techTitle: 'Stack Tecnologico',
            techStack: 'Next.js • React • TypeScript • Tailwind CSS • Framer Motion • Lucide React',
            ctaText: 'Cosa aspetti? Visita il sito e inizia l\'analisi!',
            visitWebsite: 'Visita il Sito',
            websiteUrl: 'https://uxability.vercel.app/',
            howItWorksTitle: 'Come Funziona',
            step1: 'Inserisci l\'URL del sito web da analizzare',
            step2: 'Uxability esegue una scansione completa del sito',
            step3: 'Visualizza il report dettagliato con tutti i parametri',
            step4: 'Ottimizza il sito seguendo i suggerimenti'
        },
        webExtension: {
            name: 'Estensione Web',
            subtitle: 'Accessibilità Web in Tempo Reale',
            description: 'L\'estensione web consente di migliorare sensibilmente l\'accessibilità dei siti internet, offrendo strumenti avanzati e personalizzabili per adattare la navigazione alle esigenze di tutti.',
            overview: 'L\'utente può intervenire in tempo reale su testo, contrasti, colori, spaziature, font e livello di zoom, rendendo ogni sito più leggibile e fruibile. Grazie a questa estensione, l\'esperienza di navigazione diventa più inclusiva e accessibile per tutti, senza la necessità di modificare il sito originale.',
            featuresTitle: 'Funzionalità Principali',
            feature1Title: 'Regolazione Testo',
            feature1Desc: 'Modifica dimensione, spaziatura, interlinea e font del testo su qualsiasi pagina web per una lettura più confortevole.',
            feature2Title: 'Contrasto & Colori',
            feature2Desc: 'Regolazione in tempo reale di contrasto, luminosità e saturazione. Modalità daltonismo con profili personalizzati.',
            feature3Title: 'Navigazione Semplificata',
            feature3Desc: 'Evidenziazione dei link, focus visibile potenziato e navigazione da tastiera migliorata per un\'esperienza più intuitiva.',
            feature4Title: 'Profili Personalizzati',
            feature4Desc: 'Salvataggio delle preferenze in profili personalizzati che si applicano automaticamente ai siti visitati.',
            feature5Title: 'Screen Reader Enhanced',
            feature5Desc: 'Miglioramento della compatibilità con screen reader attraverso l\'aggiunta automatica di attributi ARIA mancanti.',
            feature6Title: 'Zoom Intelligente',
            feature6Desc: 'Sistema di zoom adattivo che mantiene il layout leggibile senza rompere la struttura della pagina.',
            techTitle: 'Stack Tecnologico',
            techStack: 'JavaScript • Chrome Extension API • CSS Custom Properties • Web Accessibility API • Local Storage',
            ctaText: 'Vuoi rendere il web più accessibile? Contattami!',
            howItWorksTitle: 'Come Funziona',
            step1: 'Installa l\'estensione nel tuo browser',
            step2: 'Clicca sull\'icona dell\'estensione nella toolbar',
            step3: 'Personalizza i parametri di accessibilità',
            step4: 'Le modifiche si applicano istantaneamente alla pagina'
        }
    },

    desktop: {
        title: 'WINDOWS XP BY GIANLUCA D\'ARCANGELO',
        closeButton: 'ESCI',
        closeTooltip: 'Torna alla vista 3D',
        seeWorldButton: 'VEDI IL MIO MONDO',
        seeWorldTooltip: 'Esplora l\'ambiente 3D',
        startText: 'start'
    },

    diskInfo: {
        localDisk: 'Disco locale (C:)'
    },

    pacman: {
        mobileWarning: 'Ehi! Pac-Man ha bisogno di tasti veri per scappare dai fantasmi. Torna sul tuo PC o i fantasmi ti prenderanno anche nella vita reale! 👻',
        gameOver: 'GAME OVER',
        youWin: 'HAI VINTO!',
        pressStartPlay: 'PREMI START PER GIOCARE',
        pressStartRestart: 'PREMI SPAZIO PER RICOMINCIARE',
        exit: 'ESCI',
        start: 'INIZIA',
        restart: 'RIGIOCA',
        selectDifficulty: 'SELEZIONA DIFFICOLTÀ',
        easy: 'FACILE',
        normal: 'NORMALE',
        hard: 'DIFFICILE',
        controlsHint: '← → ↑ ↓ o WASD per muoverti',
        flappyScore: 'PUNTI',
        best: 'RECORD',
        tapHint: '👆 TOCCA per volare!'
    },

    darkMode: {
        enable: 'Attiva Dark Mode',
        disable: 'Attiva Light Mode'
    },

    pdfModal: {
        title: 'Curriculum Vitae',
        close: 'Chiudi'
    },

    paint: {
        pencil: 'Matita',
        eraser: 'Gomma',
        line: 'Linea',
        rect: 'Rettangolo',
        ellipse: 'Cerchio',
        clear: 'Pulisci'
    },

    notepad: {
        cvLink: '[ CLICCA QUI PER APRIRE IL CV ]'
    },
    catModal: {
        title: 'Presentazione Speciale: La mia Gatta 🐾',
        intro: 'Ciao a tutti! Volevo per forza esserci anche io in questo portfolio, non potevo mica lasciare tutto lo spazio a Gianluca!',
        description: 'Sono una gatta Siberiana di quasi 3 anni (li compio a breve, preparate i croccantini premium!). Mi piace molto "aiutare" Gianluca mentre programma, specialmente camminando sulla tastiera nei momenti meno opportuni o fissando il cursore con estremo sospetto.',
        personality: 'Sono bella, regale e soprattutto... sono io la vera padrona di casa (e di questo codice). Se il sito funziona bene, è merito delle mie fusa incoraggianti. Se ci sono bug... beh, probabilmente ho solo premuto qualche tasto di troppo.',
        close: 'Chiudi presentazione'
    }
};
