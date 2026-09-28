const fs = require('fs');
const filepath = 'src/components/Layout.tsx';
let content = fs.readFileSync(filepath, 'utf8');
content = content.replace(/borderRadius:\s*"50%",\s*backgroundColor:\s*"#071330",\s*borderRight:\s*"1px solid rgba\(255,255,255,0\.05\)",/g, 'borderRadius: "50%", backgroundColor: "#071330",');
fs.writeFileSync(filepath, content);
