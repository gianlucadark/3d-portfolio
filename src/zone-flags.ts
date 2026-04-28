// These flags must be set BEFORE zone.js is imported (see polyfills.ts).

// requestAnimationFrame: Three.js's render loop already runs via
// ngZone.runOutsideAngular(), so zone.js patching rAF adds pure overhead.
(window as any).__Zone_disable_requestAnimationFrame = true;

// High-frequency DOM events handled entirely by Three.js canvas listeners
// (all registered outside Angular zone). Skipping zone patching eliminates
// unnecessary change-detection checks on every mouse/scroll/touch event.
(window as any).__zone_symbol__UNPATCHED_EVENTS = [
    'scroll', 'mousemove', 'wheel',
    'touchstart', 'touchmove', 'touchend',
    'resize'
];
