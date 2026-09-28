const fs = require('fs');
const path = require('path');

function patchSidebar(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');

  // Change Sidebar Background
  content = content.replace(/backgroundColor:\s*"#1e3a8a"/g, 'backgroundColor: "#071330", borderRight: "1px solid rgba(255,255,255,0.05)"');

  // Change Logo border
  content = content.replace(/borderBottom:\s*"1px solid rgba\(255,255,255,0\.1\)"/, 'borderBottom: "1px solid rgba(255,255,255,0.05)"');

  // Change active/inactive states in map
  content = content.replace(/color:\s*isActive \? "#fff" : "#93c5fd"/g, 'color: isActive ? "#fff" : "rgba(255,255,255,0.7)"');
  content = content.replace(/backgroundColor:\s*isActive \? "rgba\(255,255,255,0\.15\)" : "transparent"/g, 'backgroundColor: isActive ? "rgba(255,255,255,0.1)" : "transparent"');

  // Change logout button color
  content = content.replace(/color:\s*"#fca5a5"/g, 'color: "rgba(255,255,255,0.7)"');
  content = content.replace(/borderTop:\s*"1px solid rgba\(255,255,255,0\.1\)"/, 'borderTop: "1px solid rgba(255,255,255,0.05)"');
  
  // Change logout hover to match the same white translucent style instead of red (optional, but cleaner)
  content = content.replace(/backgroundColor = "rgba\(239,68,68,0\.15\)"/, 'backgroundColor = "rgba(255,255,255,0.08)"');
  
  fs.writeFileSync(filepath, content);
  console.log('Patched Sidebar colors in', filepath);
}

patchSidebar(path.join(__dirname, 'src/components/Layout.tsx'));
