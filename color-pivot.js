const fs = require('fs');
const path = require('path');

const globalsCssPath = path.join(__dirname, 'app', 'globals.css');
let cssContent = fs.readFileSync(globalsCssPath, 'utf8');

const replacements = [
    // Brand Colors
    { search: '--color-brand-50: #f5f3ff;', replace: '--color-brand-50: #fff6ee;' },
    { search: '--color-brand-100: #ede9fe;', replace: '--color-brand-100: #ffeadd;' },
    { search: '--color-brand-200: #ddd6fe;', replace: '--color-brand-200: #ffd3b9;' },
    { search: '--color-brand-300: #c4b5fd;', replace: '--color-brand-300: #ffb88f;' },
    { search: '--color-brand-400: #a78bfa;', replace: '--color-brand-400: #fe985c;' },
    { search: '--color-brand-500: #8b5cf6;', replace: '--color-brand-500: #fb7829;' },
    { search: '--color-brand-600: #7c3aed;', replace: '--color-brand-600: #eb6f00;' },
    { search: '--color-brand-700: #6d28d9;', replace: '--color-brand-700: #c2540c;' },
    { search: '--color-brand-800: #5b21b6;', replace: '--color-brand-800: #9a4413;' },
    { search: '--color-brand-900: #4c1d95;', replace: '--color-brand-900: #7d3914;' },

    // Shadows
    { search: '--shadow-tactile: 0 4px 0 0 #7c3aed, 0 8px 16px -4px rgba(124, 58, 237, 0.4);', replace: '--shadow-tactile: 0 4px 0 0 #eb6f00, 0 8px 16px -4px rgba(235, 111, 0, 0.4);' },
    { search: '--shadow-tactile-active: 0 2px 0 0 #7c3aed, 0 1px 4px -4px rgba(124, 58, 237, 0.4);', replace: '--shadow-tactile-active: 0 2px 0 0 #eb6f00, 0 1px 4px -4px rgba(235, 111, 0, 0.4);' },
    { search: '--shadow-hero: 0 1px 4px -4px #6d28d9, inset 0 -3px 0 0 #7e5ede, inset 0 3px 0 0 #ffffff40;', replace: '--shadow-hero: 0 1px 4px -4px #c2540c, inset 0 -3px 0 0 #fb7829, inset 0 3px 0 0 #ffffff40;' },
    { search: '--shadow-hero-active: 0 2px 4px -2px #6d28d9, inset 0 -1px 0 0 #7e5ede, inset 0 3px 0 0 #ffffff40;', replace: '--shadow-hero-active: 0 2px 4px -2px #c2540c, inset 0 -1px 0 0 #fb7829, inset 0 3px 0 0 #ffffff40;' },
    { search: '--shadow-badge: inset 0 -3px 0 0 #7e5ede, 0 1px 2px 0 rgba(0, 0, 0, 0.05);', replace: '--shadow-badge: inset 0 -3px 0 0 #fb7829, 0 1px 2px 0 rgba(0, 0, 0, 0.05);' },
];

let changed = false;
for (const rule of replacements) {
    if (cssContent.includes(rule.search)) {
        cssContent = cssContent.replace(rule.search, rule.replace);
        changed = true;
    } else {
        console.warn(`Could not find rule to replace: ${rule.search}`);
    }
}

if (changed) {
    fs.writeFileSync(globalsCssPath, cssContent, 'utf8');
    console.log('Successfully updated globals.css with new orange color palette (#eb6f00).');
} else {
    console.log('No changes were made to globals.css.');
}
