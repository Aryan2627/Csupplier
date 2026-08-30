const fs = require('fs');

function removeWhiteBgCsupplier(filePath) {
    let code = fs.readFileSync(filePath, 'utf8');
    
    // For Csupplier layout
    code = code.replace(/<div className="sidebar-header" style=\{\{ padding: '16px', background: '#fff', margin: '16px', borderRadius: '12px' \}\}>/, '<div className="sidebar-header" style={{ padding: "16px 0", margin: "16px 0", display: "flex", alignItems: "center", gap: "12px" }}>');

    fs.writeFileSync(filePath, code, 'utf8');
}

removeWhiteBgCsupplier('C:/Users/aryan/.gemini/antigravity/scratch/csupplier/src/components/Layout.tsx');

console.log("Checked Csupplier.");
