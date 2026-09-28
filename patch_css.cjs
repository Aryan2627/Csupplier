const fs = require('fs');
const filepath = 'src/index.css';
let content = fs.readFileSync(filepath, 'utf8');
content = content.replace(/--accent-primary:\s*#4f46e5;/g, '--accent-primary: #2563eb;');
content = content.replace(/--accent-secondary:\s*#4338ca;/g, '--accent-secondary: #1d4ed8;');
fs.writeFileSync(filepath, content);
