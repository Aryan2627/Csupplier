const fs = require('fs');
const path = require('path');

function patchTabs(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  
  const isStageLockedFunc = `
  const isStageLocked = (targetIdx: number) => {
    for (let i = 0; i < targetIdx; i++) {
      const stage = parsedStages[i];
      if (stage && stage.type && stage.type.toLowerCase().includes('tech')) {
        const fields = stage.templateFields || [];
        const hasMissing = fields.some((f: any) => {
          const isCreator = f.role?.toLowerCase() === 'creator';
          const isCalc = f.role?.toLowerCase() === 'calculation';
          if (f.required && !isCreator && !isCalc) {
            let isVisible = true;
            if (f.dependsOn && f.dependsOn.field) {
               const parentKey = f.key.replace(f.originalKey, f.dependsOn.field);
               isVisible = formData[parentKey] === f.dependsOn.value;
            }
            const val = formData[f.key];
            if (isVisible && (val === undefined || val === null || val.toString().trim() === '')) {
              return true;
            }
          }
          return false;
        });
        if (hasMissing) return true;
      }
    }
    return false;
  };
`;

  if (!content.includes('const isStageLocked =')) {
    // Find where `return (` is for the main render block
    const returnBlockRegex = /return \(\s*<div style=\{\{\s*backgroundColor:\s*'#f0f4f8'/;
    if (returnBlockRegex.test(content)) {
      content = content.replace(returnBlockRegex, isStageLockedFunc + '\n  $&');
      fs.writeFileSync(filepath, content);
      console.log('Injected isStageLocked successfully.');
    } else {
      console.log('Regex failed to match return block.');
    }
  } else {
    console.log('isStageLocked already exists.');
  }
}

patchTabs(path.join(__dirname, 'src/pages/EventDetails.tsx'));
