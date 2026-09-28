const fs = require('fs');
const path = require('path');

function patchOnboarding(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');

  // Replace <Layout> with <> and </Layout> with </>
  content = content.replace(/<Layout>/g, '<>');
  content = content.replace(/<\/Layout>/g, '</>');
  
  // Remove import { Layout } if it exists
  content = content.replace(/import\s*\{\s*Layout\s*\}\s*from\s*'[^']+';?\n?/g, '');

  fs.writeFileSync(filepath, content);
  console.log('Patched Onboarding in', filepath);
}

patchOnboarding(path.join(__dirname, 'src/pages/Onboarding.tsx'));
