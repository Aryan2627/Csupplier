const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "import { Orders } from './pages/Orders';", 
  "import { Orders } from './pages/Orders';\nimport { Onboarding } from './pages/Onboarding';"
);

code = code.replace(
  '<Route path="/settings" element={<Layout><Settings /></Layout>} />',
  '<Route path="/settings" element={<Layout><Settings /></Layout>} />\n        <Route path="/vendor/onboarding" element={<Onboarding />} />\n        <Route path="/onboarding" element={<Onboarding />} />'
);

fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log("Updated App.tsx routes.");
