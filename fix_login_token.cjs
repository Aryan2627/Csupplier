const fs = require('fs');
let code = fs.readFileSync('src/pages/Login.tsx', 'utf8');

code = code.replace("localStorage.setItem('vendor_token', token);", "localStorage.setItem('token', token);\n      localStorage.setItem('vendor_token', token);");

fs.writeFileSync('src/pages/Login.tsx', code, 'utf8');
console.log("Fixed token assignment in Login.tsx query param effect");
