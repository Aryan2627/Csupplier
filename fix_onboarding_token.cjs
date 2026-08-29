const fs = require('fs');
let code = fs.readFileSync('src/pages/Onboarding.tsx', 'utf8');

code = code.replace("localStorage.getItem('vendor_token')", "localStorage.getItem('token')");

fs.writeFileSync('src/pages/Onboarding.tsx', code, 'utf8');
console.log("Fixed token retrieval in Onboarding.tsx");
