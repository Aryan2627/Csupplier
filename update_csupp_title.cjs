const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');
code = code.replace(
  '<title>vendor-portal</title>',
  '<title>ProcGen | Vendor Portal</title>'
);
fs.writeFileSync('index.html', code, 'utf8');
console.log("Updated title in Csupplier");
