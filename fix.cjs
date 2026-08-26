const fs = require('fs');
let content = fs.readFileSync('src/pages/Login.tsx', 'utf8');
content = content.replace(/fetch\(\`\/api\/vendor-auth\`/g, "fetch(`${getBaseUrl()}/api/vendor-auth`");
fs.writeFileSync('src/pages/Login.tsx', content);
console.log('Fixed API paths');
