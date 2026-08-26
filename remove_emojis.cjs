const fs = require('fs');
const path = require('path');

const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2700}-\u{27BF}]|[\u{2600}-\u{26FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2B50}]|[\u{23F3}]|[\u{23F0}]|[\u{231A}]|[\u{231B}]/gu;

function removeEmojis(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            removeEmojis(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (emojiRegex.test(content)) {
                console.log(`Removing emojis from: ${fullPath}`);
                const newContent = content.replace(emojiRegex, '');
                fs.writeFileSync(fullPath, newContent, 'utf8');
            }
        }
    }
}

removeEmojis('src');
console.log('Finished removing emojis from Csupplier');
