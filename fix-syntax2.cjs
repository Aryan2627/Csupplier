const fs = require('fs');
const path = require('path');
function walk(dir) {
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes("https://sourcing.procgen.in")) {
                content = content.replace(/\$\{'https:\/\/cpanel-swart\.vercel\.app'\}/g, 'https://sourcing.procgen.in');
                content = content.replace(/\\\$\{'https:\/\/cpanel-swart\.vercel\.app'\}/g, 'https://sourcing.procgen.in');
                fs.writeFileSync(fullPath, content);
                console.log('Fixed ' + fullPath);
            }
        }
    });
}
walk('./src');
