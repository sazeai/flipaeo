const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'components', 'landing');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Replace pattern bars
    // With mb-16
    content = content.replace(/<div className="w-full h-3 sm:h-4 border-y border-stone-200 mb-16" style={{ backgroundImage: 'repeating-linear-gradient\(-45deg, transparent, transparent 6px, #e7e5e4 6px, #e7e5e4 7px\)' }}><\/div>/g, 
        '<div className="w-full h-px bg-stone-200 mb-16"></div>');
    
    // With relative and no mb-16
    content = content.replace(/<div className="relative w-full h-3 sm:h-4 border-y border-stone-200" style={{ backgroundImage: 'repeating-linear-gradient\(-45deg, transparent, transparent 6px, #e7e5e4 6px, #e7e5e4 7px\)' }}>/g, 
        '<div className="relative w-full h-px bg-stone-200">');
    
    // mb-24
    content = content.replace(/<div className="relative w-full h-3 sm:h-4 border-y border-stone-200 mb-24" style={{ backgroundImage: 'repeating-linear-gradient\(-45deg, transparent, transparent 6px, #e7e5e4 6px, #e7e5e4 7px\)' }}>/g, 
        '<div className="relative w-full h-px bg-stone-200 mb-24">');
    
    // mt-32
    content = content.replace(/<div className="relative w-full h-3 sm:h-4 border-y border-stone-200 mt-32" style={{ backgroundImage: 'repeating-linear-gradient\(-45deg, transparent, transparent 6px, #e7e5e4 6px, #e7e5e4 7px\)' }}>/g, 
        '<div className="relative w-full h-px bg-stone-200 mt-32">');

    // mb-16 relative
    content = content.replace(/<div className="relative w-full h-3 sm:h-4 border-y border-stone-200 mb-16" style={{ backgroundImage: 'repeating-linear-gradient\(-45deg, transparent, transparent 6px, #e7e5e4 6px, #e7e5e4 7px\)' }}>/g, 
        '<div className="relative w-full h-px bg-stone-200 mb-16">');

    // 2. Adjust corner offsets for all CornerSquare usages
    content = content.replace(/-left-\[5px\]/g, '-left-[10px]');
    content = content.replace(/-right-\[5px\]/g, '-right-[10px]');
    content = content.replace(/-top-\[5px\]/g, '-top-[10px]');
    content = content.replace(/-bottom-\[5px\]/g, '-bottom-[10px]');

    content = content.replace(/-left-\[4px\]/g, '-left-[10px]');
    content = content.replace(/-right-\[4px\]/g, '-right-[10px]');
    content = content.replace(/-top-\[4px\]/g, '-top-[10px]');
    content = content.replace(/-bottom-\[4px\]/g, '-bottom-[10px]');

    // Replace <CornerSquare with <CornerDot
    content = content.replace(/CornerSquare/g, 'CornerDot');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
            processFile(fullPath);
        }
    }
}

walkDir(directory);
console.log('Done.');
