const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

const effectBlock = `React.useEffect(() => {
    try {
      const v = localStorage.getItem('vendor');
      if (v) {
        const parsed = JSON.parse(v);
        if (parsed.name) setVendorName(parsed.name);
      }
    } catch(e) {}
  }, []);`;

const newEffectBlock = `
  const [vendorStatus, setVendorStatus] = React.useState('');
  
  React.useEffect(() => {
    try {
      const v = localStorage.getItem('vendor_info') || localStorage.getItem('vendor');
      if (v) {
        const parsed = JSON.parse(v);
        if (parsed.name) setVendorName(parsed.name);
        if (parsed.status) setVendorStatus(parsed.status);
      }
    } catch(e) {}
  }, []);
`;

code = code.replace(effectBlock, newEffectBlock);

const navItemsBlock = `const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Events', path: '/events', icon: CalendarDays },
    { name: 'Active Bids', path: '/bids', icon: Gavel },
    { name: 'Purchase Orders', path: '/orders', icon: ShoppingBag },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];`;

const newNavItemsBlock = `
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Events', path: '/events', icon: CalendarDays },
    { name: 'Active Bids', path: '/bids', icon: Gavel },
    { name: 'Purchase Orders', path: '/orders', icon: ShoppingBag },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];
  
  // Show Onboarding tab only if they are not fully onboarded
  if (vendorStatus && vendorStatus !== 'Onboarded' && vendorStatus !== 'Joined') {
    navItems.push({ name: 'Onboarding', path: '/onboarding', icon: User });
  }
`;

code = code.replace(navItemsBlock, newNavItemsBlock);

fs.writeFileSync('src/components/Layout.tsx', code, 'utf8');
console.log("Updated Layout for Onboarding tab.");
