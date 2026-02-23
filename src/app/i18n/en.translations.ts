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
            description: 'Uxability is a web application developed in Angular that allows you to analyze the accessibility and performance of any website simply by entering the desired URL.',
            overview: 'The application generates detailed reports that highlight errors, critical issues, and practical suggestions for improvement, also offering an interactive heatmap that graphically displays the problematic areas of the site. An integrated artificial intelligence system provides in-depth and clear explanations of the errors found, making the information accessible even to those without technical skills.',
            featuresTitle: 'Key Features',
            feature1Title: 'Accessibility Analysis',
            feature1Desc: 'Complete website scan following WCAG 2.1 guidelines, with identification of errors and warnings classified by severity.',
            feature2Title: 'Interactive Heatmap',
            feature2Desc: 'Graphical visualization of problematic areas of the site, allowing you to quickly identify zones that need intervention.',
            feature3Title: 'Detailed Reports',
            feature3Desc: 'Generation of complete reports with accessibility, performance, and best practice metrics, exportable and shareable.',
            feature4Title: 'AI Assistant',
            feature4Desc: 'Artificial intelligence system that explains errors in simple language and suggests concrete solutions for resolution.',
            feature5Title: 'Performance Analysis',
            feature5Desc: 'Measurement of Core Web Vitals (LCP, FID, CLS) and suggestions to optimize site speed and responsiveness.',
            feature6Title: 'Analysis History',
            feature6Desc: 'Tracking of analyses over time to monitor progress and improvements made to the site.',
            techTitle: 'Tech Stack',
            techStack: 'Angular • TypeScript • Node.js • Rust • Lighthouse API • OpenAI API • WCAG 2.1 • Chart.js',
            ctaText: 'What are you waiting for? Contact me to learn more!',
            howItWorksTitle: 'How It Works',
            step1: 'Enter the URL of the website to analyze',
            step2: 'Uxability performs a complete scan of the site',
            step3: 'View the detailed report with interactive heatmap',
            step4: 'AI explains errors and suggests corrections'
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
        pressStartRestart: 'PRESS START TO RESTART',
        exit: 'EXIT',
        start: 'START'
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
    }
};
