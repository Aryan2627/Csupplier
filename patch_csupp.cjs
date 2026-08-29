const fs = require('fs');
let code = fs.readFileSync('src/pages/EventDetails.tsx', 'utf8');

const brokenCalcRegex = /let formulaStr = field\.formula;\s*const keys = Object\.keys\(formData\)\.sort[^\}]+;\s*keys\.forEach[^\}]+}[^\}]+}\);\s*\/\/[^\n]+\s*const evaluated = Number\(eval\(formulaStr\)\);/m;

const correctCalcLogic = `let formulaStr = field.formula;
              const groupId = field._sourceItemId || 'default';
              const groupFields = templateFields.filter((tf: any) => (tf._sourceItemId || 'default') === groupId);
              const sortedFields = [...groupFields].sort((a, b) => (b.originalKey || b.key).length - (a.originalKey || a.key).length);
              
              sortedFields.forEach((gf: any) => {
                const vName = gf.originalKey || gf.key;
                if (formulaStr.includes(vName)) {
                  let val = 0;
                  if (gf.role?.toLowerCase() === 'creator') val = Number(gf.defaultValue) || 0;
                  else val = Number(newFormData[gf.key]) || 0;
                  formulaStr = formulaStr.replace(new RegExp(\`\\\\b\${vName}\\\\b\`, 'g'), val.toString());
                }
              });
              
              const evaluated = Number(new Function('return ' + formulaStr)());`;

if (brokenCalcRegex.test(code)) {
    code = code.replace(brokenCalcRegex, correctCalcLogic);
    fs.writeFileSync('src/pages/EventDetails.tsx', code, 'utf8');
    console.log("Successfully patched Csupplier calculations!");
} else {
    console.log("Regex didn't match.");
}
