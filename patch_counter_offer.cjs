const fs = require('fs');
let code = fs.readFileSync('src/pages/EventDetails.tsx', 'utf8');

const oldJSX = `<div style={{ fontSize: '0.85rem', color: '#475569', fontStyle: 'italic' }}>"{msg.offerDetails.reason}"</div>
                            </div>`;
                            
const newJSX = `<div style={{ fontSize: '0.85rem', color: '#475569', fontStyle: 'italic', marginBottom: '12px' }}>"{msg.offerDetails.reason}"</div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleAcceptCounterOffer(msg)} style={{ padding: '6px 12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Accept</button>
                                <button onClick={() => handleRejectCounterOffer(msg)} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Reject</button>
                              </div>
                            </div>`;

code = code.replace(oldJSX, newJSX);
fs.writeFileSync('src/pages/EventDetails.tsx', code, 'utf8');
console.log("Patched Counter Offer UI");
