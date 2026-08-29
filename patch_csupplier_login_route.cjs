const fs = require('fs');
let code = fs.readFileSync('src/pages/Login.tsx', 'utf8');

// There are two places with this logic: handleVerifyOTP and handlePasswordLogin
code = code.replace(/data\.vendor\.status === 'Onboarding in Progress' \? '\/vendor\/onboarding' : '\/vendor'/g, "(data.vendor.status === 'Onboarding in Progress' || data.vendor.status === 'Pending Onboarding' || data.vendor.status === 'Approval Pending') ? '/vendor/onboarding' : '/vendor'");

fs.writeFileSync('src/pages/Login.tsx', code, 'utf8');
console.log("Successfully patched Csupplier login routing.");
