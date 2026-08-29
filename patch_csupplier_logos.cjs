const fs = require('fs');

// Patch Login.tsx
let loginCode = fs.readFileSync('src/pages/Login.tsx', 'utf8');
const loginOld = `<div className="login-header">\n          <h2>ProcGen Supplier</h2>`;
const loginNew = `<div className="login-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>\n          <img src="/logo.webp" alt="ProcGen Logo" style={{ height: '48px', objectFit: 'contain' }} />\n          <h2 style={{ display: 'none' }}>ProcGen Supplier</h2>`;
if (loginCode.includes(`<div className="login-header">\n          <h2>ProcGen Supplier</h2>`)) {
    loginCode = loginCode.replace(`<div className="login-header">\n          <h2>ProcGen Supplier</h2>`, loginNew);
    fs.writeFileSync('src/pages/Login.tsx', loginCode, 'utf8');
}

// Patch Layout.tsx
let layoutCode = fs.readFileSync('src/components/Layout.tsx', 'utf8');
const layoutOld = `<div className="sidebar-header">\n          <h2 className="text-gradient">VendorPortal</h2>\n        </div>`;
const layoutNew = `<div className="sidebar-header" style={{ padding: '16px', background: '#fff', margin: '16px', borderRadius: '12px' }}>\n          <img src="/logo.webp" alt="ProcGen Logo" style={{ width: '100%', objectFit: 'contain' }} />\n          <h2 className="text-gradient" style={{ display: 'none' }}>VendorPortal</h2>\n        </div>`;
if (layoutCode.includes(layoutOld)) {
    layoutCode = layoutCode.replace(layoutOld, layoutNew);
    fs.writeFileSync('src/components/Layout.tsx', layoutCode, 'utf8');
}

console.log("Patched Csupplier logos.");
