const fs = require('fs');
const path = require('path');

function patchTabs(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');

  // Add Lock import
  content = content.replace(/import \{([^}]+)\} from 'lucide-react';/, (match, p1) => {
    if (!p1.includes('Lock')) {
      return `import { ${p1}, Lock } from 'lucide-react';`;
    }
    return match;
  });

  // Inject isStageLocked function
  const renderStart = /return \(\s*<div style=\{\{ minHeight:/;
  
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

  if (!content.includes('isStageLocked')) {
    content = content.replace(renderStart, isStageLockedFunc + '\n  $&');
  }

  // Replace Tab rendering logic
  const tabRegex = /\{\/\*\s*Tabs\s*\*\/\}\s*\{parsedStages\.length > 1 && \(\s*<div style=\{\{ display: 'flex', gap: '0', padding: '0 32px', borderBottom: '1px solid #e4e4e7', backgroundColor: '#fff', overflowX: 'auto' \}\}>\s*\{parsedStages\.map\(\(stage: any, idx: number\) => \{\s*const isActive = idx === activeStageIndex;\s*return \([\s\S]*?<\/button>\s*\)\s*\}\)\}\s*<\/div>\s*\)\}/;

  const newTabs = `{/* Tabs */}
            {parsedStages.length > 1 && (
              <div style={{ display: 'flex', gap: '0', padding: '0 32px', borderBottom: '1px solid #e4e4e7', backgroundColor: '#fff', overflowX: 'auto' }}>
                {parsedStages.map((stage: any, idx: number) => {
                  const isActive = idx === activeStageIndex;
                  const locked = isStageLocked(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (locked) {
                          alert("Please complete the required fields in the Technical stage first.");
                          return;
                        }
                        setActiveStageIndex(idx);
                      }}
                      style={{
                        padding: '16px 24px', 
                        fontSize: '0.9rem', 
                        fontWeight: isActive ? 600 : 500, 
                        cursor: locked ? 'not-allowed' : 'pointer',
                        backgroundColor: 'transparent',
                        color: locked ? '#a1a1aa' : (isActive ? '#2563eb' : '#71717a'),
                        border: 'none',
                        borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                        display: 'flex', alignItems: 'center', gap: '8px'
                      }}
                      title={locked ? "Complete previous technical stages to unlock" : ""}
                    >
                      {locked && <Lock size={14} color="#a1a1aa" />}
                      {stage.type}
                    </button>
                  )
                })}
              </div>
            )}`;

  if (tabRegex.test(content)) {
    content = content.replace(tabRegex, newTabs);
    fs.writeFileSync(filepath, content);
    console.log('Patched Tabs successfully.');
  } else {
    console.log('Regex failed to match Tabs block.');
  }
}

patchTabs(path.join(__dirname, 'src/pages/EventDetails.tsx'));
