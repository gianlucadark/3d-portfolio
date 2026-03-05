/**
 * English Translations
 */
export const EN_TRANSLATIONS = {
    common: {
        close: 'Close',
        minimize: 'Minimize',
        maximize: 'Maximize',
        restore: 'Restore',
        back: 'Back',
        forward: 'Forward',
        search: 'Search',
        folders: 'Folders',
        address: 'Address',
        go: 'Go',
        desktop: 'Desktop',
        send: 'Send',
        clear: 'Clear',
        error: 'Error'
    },

    loading: {
        welcome: 'Welcome to my world.',
        welcome2: 'Just a bored developer\'s portfolio',
        loadingText: 'Loading 3D experience...',
        enterButton: 'ENTER',
        switchLang: 'Switch to Italian'
    },

    menu: {
        file: 'File',
        edit: 'Edit',
        view: 'View',
        favorites: 'Favorites',
        tools: 'Tools',
        help: 'Help'
    },

    icons: {
        computer: 'Computer',
        cv: 'Gianluca\'s CV',
        prompt: 'Command Prompt',
        readme: 'README',
        paint: 'Paint',
        trash: 'Recycle Bin',
        notepad: 'Notepad',
        email: 'Email',
        projects: 'Projects',
        curriculum: 'Curriculum',
        uxability: 'Uxability',
        webExtension: 'Web Extension'
    },

    startMenu: {
        user: 'Gianluca D\'Arcangelo',
        shutdown: 'Turn off computer',
        commandPrompt: 'Command Prompt'
    },

    readme: {
        title: 'Welcome to my XP Portfolio 🚀',
        noteLabel: 'Note',
        warning: 'Not optimized for mobile! After all... it\'s Windows XP!',
        intro: 'Hi! I\'m Gianluca D\'Arcangelo, born in 1997 and raised with the Windows XP startup sound and the first 56k connections. This portfolio is a tribute to the operating system that marked the beginning of my passion for technology and digital creativity.',
        cvLink: 'If you want to see my CV directly, click here'
    },

    prompt: {
        help: 'Type "help" to see available commands',
        commands: {
            aboutme: '- aboutme',
            whyxp: '- whyxp',
            whyprompt: '- whyprompt',
            clear: '- clear'
        },
        responses: {
            aboutme: 'Hi! I\'m Gianluca, born in Terracina (LT) on September 25, 1997. I\'m a full stack developer with a strong passion for frontend and UI/UX design. I love creating intuitive user interfaces and improving user experience through design.',
            whyxp: 'I chose to inspire my portfolio design on Windows XP because it represents the starting point of my digital journey. It\'s a nostalgic tribute to my first experiments on Paint and long Minesweeper sessions. Although I work with advanced technologies today, XP remains a symbol of my roots. The design blends past and future, with a vintage aesthetic that accompanies modern skills and innovative projects.',
            whyprompt: 'I chose to implement this mini prompt because it represents my first real approach to the world of programming. As a child, the Windows prompt was for me a door to an unknown universe, and I enjoyed exploring various commands, almost feeling like a hacker. I spent hours trying to understand how instructions worked and what I could do with that simple black and white screen.',
            commandNotFound: 'Command not recognized:'
        }
    },

    email: {
        placeholder: 'Write your message here...',
        send: 'Send Email',
        to: 'To:',
        cc: 'Cc:',
        subject: 'Subject:',
        sendBtn: 'Send',
        cut: 'Cut',
        copy: 'Copy',
        paste: 'Paste',
        undo: 'Undo'
    },

    projects: {
        uxability: {
            name: 'Uxability',
            subtitle: 'Web Accessibility & Performance Analysis',
            description: 'Uxability is a modern web app developed with Next.js that allows you to instantly analyze Performance, SEO, Accessibility, and Best Practices of any website.',
            overview: 'Through a fast and intuitive interface, Uxability performs a comprehensive audit of your URL. The system evaluates web vitals, providing clear scores and technical suggestions to optimize loading speed, search engine visibility, and content inclusivity.',
            featuresTitle: 'Key Features',
            feature1Title: 'Accessibility Analysis',
            feature1Desc: 'Complete website scan following WCAG 2.1 guidelines, with identification of errors and warnings classified by severity.',
            feature2Title: 'SEO Analysis',
            feature2Desc: 'Search engine optimization with meta tag checking, heading structure, and content quality analysis.',
            feature3Title: 'Detailed Reports',
            feature3Desc: 'Generation of complete reports with accessibility, performance, and best practice metrics, exportable and shareable.',
            feature4Title: 'Best Practices',
            feature4Desc: 'Security analysis, library checks, and modern web development technique validation.',
            feature5Title: 'Performance Analysis',
            feature5Desc: 'Measurement of Core Web Vitals (LCP, FID, CLS) and suggestions to optimize site speed and responsiveness.',
            feature6Title: 'Analysis History',
            feature6Desc: 'Tracking of analyses over time to monitor progress and improvements made to the site.',
            techTitle: 'Tech Stack',
            techStack: 'Next.js • React • TypeScript • Tailwind CSS • Framer Motion • Lucide React',
            ctaText: 'What are you waiting for? Visit the site and start the analysis!',
            visitWebsite: 'Visit Website',
            websiteUrl: 'https://uxability.vercel.app/',
            howItWorksTitle: 'How It Works',
            step1: 'Enter the URL of the website to analyze',
            step2: 'Uxability performs a complete scan of the site',
            step3: 'View the detailed report with all parameters',
            step4: 'Optimize the site following the suggestions'
        },
        webExtension: {
            name: 'Web Extension',
            subtitle: 'Real-Time Web Accessibility',
            description: 'The web extension allows you to significantly improve website accessibility, offering advanced and customizable tools to adapt navigation to everyone\'s needs.',
            overview: 'Users can intervene in real-time on text, contrasts, colors, spacing, fonts, and zoom level, making every site more readable and usable. Thanks to this extension, the browsing experience becomes more inclusive and accessible for everyone, without the need to modify the original site.',
            featuresTitle: 'Key Features',
            feature1Title: 'Text Adjustment',
            feature1Desc: 'Modify text size, spacing, line height, and font on any web page for a more comfortable reading experience.',
            feature2Title: 'Contrast & Colors',
            feature2Desc: 'Real-time adjustment of contrast, brightness, and saturation. Color blindness mode with customized profiles.',
            feature3Title: 'Simplified Navigation',
            feature3Desc: 'Link highlighting, enhanced visible focus, and improved keyboard navigation for a more intuitive experience.',
            feature4Title: 'Custom Profiles',
            feature4Desc: 'Save preferences in custom profiles that automatically apply to visited sites.',
            feature5Title: 'Screen Reader Enhanced',
            feature5Desc: 'Improved screen reader compatibility through automatic addition of missing ARIA attributes.',
            feature6Title: 'Smart Zoom',
            feature6Desc: 'Adaptive zoom system that keeps the layout readable without breaking the page structure.',
            techTitle: 'Tech Stack',
            techStack: 'JavaScript • Chrome Extension API • CSS Custom Properties • Web Accessibility API • Local Storage',
            ctaText: 'Want to make the web more accessible? Contact me!',
            howItWorksTitle: 'How It Works',
            step1: 'Install the extension in your browser',
            step2: 'Click on the extension icon in the toolbar',
            step3: 'Customize the accessibility parameters',
            step4: 'Changes apply instantly to the page'
        }
    },

    desktop: {
        title: 'WINDOWS XP BY GIANLUCA D\'ARCANGELO',
        closeButton: 'EXIT',
        closeTooltip: 'Return to 3D view',
        seeWorldButton: 'SEE MY WORLD',
        seeWorldTooltip: 'Explore the 3D environment',
        startText: 'start'
    },

    diskInfo: {
        localDisk: 'Local Disk (C:)'
    },

    pacman: {
        mobileWarning: 'Hey! Pac-Man needs real keys to escape ghosts. Get back to your PC or the ghosts will catch you even in real life! 👻',
        gameOver: 'GAME OVER',
        youWin: 'YOU WIN!',
        pressStartPlay: 'PRESS START TO PLAY',
        pressStartRestart: 'PRESS SPACE TO RESTART',
        exit: 'EXIT',
        start: 'START',
        restart: 'RESTART',
        selectDifficulty: 'SELECT DIFFICULTY',
        easy: 'EASY',
        normal: 'NORMAL',
        hard: 'HARD',
        controlsHint: '← → ↑ ↓ or WASD to move',
        flappyScore: 'SCORE',
        best: 'BEST',
        tapHint: '👆 TAP to flap!'
    },

    darkMode: {
        enable: 'Enable Dark Mode',
        disable: 'Enable Light Mode'
    },

    pdfModal: {
        title: 'Curriculum Vitae',
        close: 'Close'
    },

    paint: {
        pencil: 'Pencil',
        eraser: 'Eraser',
        line: 'Line',
        rect: 'Rectangle',
        ellipse: 'Ellipse',
        clear: 'Clear'
    },

    notepad: {
        cvLink: '[ CLICK HERE TO OPEN CV ]'
    },
    catModal: {
        title: 'Special Presentation: My Cat 🐾',
        intro: 'Hi everyone! I absolutely had to be in this portfolio, I couldn\'t let Gianluca take all the spotlight!',
        description: 'I\'m a Siberian cat almost 3 years old (birthday coming soon, keep those premium treats ready!). I love "helping" Gianluca while he codes, especially by walking on the keyboard at the worst possible moments or staring at the cursor with extreme suspicion.',
        personality: 'I\'m beautiful, regal and above all... I\'m the true boss of the house (and of this code). If the site works well, it\'s thanks to my encouraging purrs. If there are bugs... well, I probably just pressed a few too many keys.',
        close: 'Close presentation'
    }
};
