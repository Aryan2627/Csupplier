const fs = require('fs');
let code = fs.readFileSync('src/pages/Onboarding.tsx', 'utf8');

code = code.replace("import { Layout } from '../components/Layout';", "");
code = code.replace("<Layout>", "");
code = code.replace("</Layout>", "");

fs.writeFileSync('src/pages/Onboarding.tsx', code, 'utf8');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace('<Route path="/vendor/onboarding" element={<Onboarding />} />', '<Route path="/vendor/onboarding" element={<Layout><Onboarding /></Layout>} />');
appCode = appCode.replace('<Route path="/onboarding" element={<Onboarding />} />', '<Route path="/onboarding" element={<Layout><Onboarding /></Layout>} />');
fs.writeFileSync('src/App.tsx', appCode, 'utf8');

console.log("Fixed Layout nesting.");
