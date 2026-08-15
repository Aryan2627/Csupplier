import fs from 'fs';
import path from 'path';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src');
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let original = content;
    
    // Replace 'http://localhost:3000/api...' with `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api...`
    content = content.replace(/'http:\/\/localhost:3000([^']*)'/g, "`\\${import.meta.env.VITE_API_URL || 'http://localhost:3000'}$1`");
    // Replace "http://localhost:3000/api..."
    content = content.replace(/"http:\/\/localhost:3000([^"]*)"/g, "`\\${import.meta.env.VITE_API_URL || 'http://localhost:3000'}$1`");
    // Replace `http://localhost:3000/api...`
    content = content.replace(/`http:\/\/localhost:3000([^`]*)`/g, "`\\${import.meta.env.VITE_API_URL || 'http://localhost:3000'}$1`");

    if (content !== original) {
        fs.writeFileSync(f, content);
        console.log('Updated ' + f);
    }
});
