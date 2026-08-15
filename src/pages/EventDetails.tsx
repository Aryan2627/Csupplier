import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LocationAutocomplete from '../components/LocationAutocomplete';
import { ArrowLeft, Clock, Save, FileText, CheckCircle2, Calculator, Info, Leaf, Upload, Hash, Percent } from 'lucide-react';

export function EventDetails() {
  const params = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [vendorInfo, setVendorInfo] = useState<any>(null);
  const [existingBid, setExistingBid] = useState<any>(null);
  
  const [formData, setFormData] = useState<Record<string, string | number>>({});
  const [currency, setCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [products, setProducts] = useState<any[]>([]);
  const [rankInfo, setRankInfo] = useState<{rank: number, totalBids: number} | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const v = localStorage.getItem('vendor');
    if (!t) {
      navigate('/login');
      return;
    }
    setToken(t);
    if (v) setVendorInfo(JSON.parse(v));

    fetch(`http://localhost:3000/api/products`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(console.error);

    fetch(`http://localhost:3000/api/exchange-rates`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setExchangeRates(data);
      })
      .catch(console.error);
    
    fetch(`http://localhost:3000/api/vendor-events/${params.id}`, {
      headers: { 'Authorization': `Bearer ${t}` }
    })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('vendor');
          window.location.href = '/login';
          return;
        }
        if (!res.ok) throw new Error('Failed to fetch event');
        return res.json();
      })
      .then(data => {
        setEvent(data);
        let initialData: Record<string, any> = {};
        if (data.stages) {
          try {
            const stagesArr = JSON.parse(data.stages);
            if (stagesArr && stagesArr.length > 0 && stagesArr[0].templateFields) {
              stagesArr[0].templateFields.forEach((field: any) => {
                initialData[field.key] = field.role === 'Creator' ? (field.defaultValue || 0) : '';
                // Handle AutoFill
                if (field.autoFill && v) {
                  const vendorData = JSON.parse(v);
                  if (field.name.toLowerCase().includes('name')) initialData[field.key] = vendorData.name;
                  if (field.name.toLowerCase().includes('tax')) initialData[field.key] = 'VAT-89102-X';
                }
              });
            }
          } catch(e) {}
        }
        fetch(`http://localhost:3000/api/vendor-bids?eventId=${data.id}`, {
          headers: { 'Authorization': `Bearer ${t}` }
        })
          .then(res => res.json())
          .then(bidData => {
            if (bidData && Object.keys(bidData).length > 0) {
              setExistingBid(bidData);
              if (bidData.templateData) {
                try {
                  const parsed = JSON.parse(bidData.templateData);
                  initialData = { ...initialData, ...parsed };
                  if (bidData.currency) setCurrency(bidData.currency);
                } catch(e) {}
              }
            }
            setFormData(initialData);
            setLoading(false);
          })
          .catch(() => {
            setFormData(initialData);
            setLoading(false);
          });
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [params.id, navigate]);

  const templateFields = React.useMemo(() => {
    if (!event || !event.stages) return [];
    try {
      const stagesArr = JSON.parse(event.stages);
      if (stagesArr && stagesArr.length > 0 && stagesArr[0].templateFields) {
        return stagesArr[0].templateFields;
      }
    } catch(e) {}
    return [];
  }, [event]);

  const enableESG = templateFields.some((f: any) => f.enableESG);

  useEffect(() => {
    if (templateFields.length === 0) return;
    
    // Debounce the calculation to improve typing performance
    const timeout = setTimeout(() => {
      let updated = false;
      const newFormData = { ...formData };
      
      templateFields.forEach((field: any) => {
        if (field.role === 'Calculation' && field.formula) {
          try {
            let formulaStr = field.formula;
            const keys = Object.keys(formData).sort((a, b) => b.length - a.length);
            keys.forEach(k => {
              const val = newFormData[k] || 0;
              const regex = new RegExp(`\\b${k}\\b`, 'g');
              formulaStr = formulaStr.replace(regex, val.toString());
            });
            // eslint-disable-next-line no-eval
            const evaluated = Number(eval(formulaStr));
            
            // Prevent infinite loops from floating point or type mismatch
            if (!Number.isNaN(evaluated) && Number(newFormData[field.key]) !== evaluated) {
              newFormData[field.key] = evaluated;
              updated = true;
            }
          } catch (e) {}
        }
      });
      
      if (updated) {
        setFormData(newFormData);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [formData, templateFields]);

  useEffect(() => {
    if (!event || !event.endTime) {
      setTimeLeft('No End Time');
      return;
    }
    const calculateTimeLeft = () => {
      const difference = new Date(event.endTime).getTime() - new Date().getTime();
      if (difference <= 0) return 'Event Ended';
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      if (days > 0) return `${days}d ${hours}h ${minutes}m`;
      return `${hours}h ${minutes}m`;
    };
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 60000);
    return () => clearInterval(timer);
  }, [event]);

  const handleInputChange = (key: string, value: string) => {
    const numVal = parseFloat(value);
    setFormData(prev => ({
      ...prev,
      [key]: isNaN(numVal) ? value : numVal
    }));
  };

  const handleSubmit = async () => {
    if (!token) return;
    setIsSubmitting(true);
    
    try {
      let totalAmount = 0;
      if (formData['total_value']) {
        totalAmount = parseFloat(formData['total_value'] as string);
      }
      if (!totalAmount) {
        totalAmount = Object.values(formData).reduce((acc: number, val: any) => acc + (parseFloat(val) || 0), 0);
      }

      const baseCurrency = event.baseCurrency || 'USD';
      const exchangeRate = exchangeRates[currency] && exchangeRates[baseCurrency] 
        ? exchangeRates[baseCurrency] / exchangeRates[currency] 
        : 1.0;
      
      const convertedAmount = totalAmount * exchangeRate;

      if (existingBid && existingBid.amount !== undefined) {
        if (convertedAmount >= existingBid.amount) {
          alert(`Revised price must be strictly lower than your last quote of ${existingBid.amount} ${baseCurrency}`);
          setIsSubmitting(false);
          return;
        }
      }

      const res = await fetch('http://localhost:3000/api/vendor-bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          eventId: event.id,
          vendorName: vendorInfo?.name || 'Vendor',
          amount: convertedAmount,
          localAmount: totalAmount,
          currency: currency,
          exchangeRate: exchangeRate,
          templateData: formData
        })
      });

      if (res.ok) {
        alert("Bid successfully submitted!");
        navigate('/events');
      } else alert("Error submitting bid.");
    } catch (err) {
      alert("Network error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!event || event.feedbackMode !== 'Rank Based' || !vendorInfo) return;

    const pollRank = () => {
      fetch(`http://localhost:3000/api/vendor-rank?eventId=${event.id}&vendorName=${encodeURIComponent(vendorInfo.name)}`)
        .then(res => res.json())
        .then(data => {
          if (data.rank) {
            setRankInfo({ rank: data.rank, totalBids: data.totalBids });
          } else {
            setRankInfo(null);
          }
        })
        .catch(() => {});
    };

    pollRank(); // Initial fetch
    const interval = setInterval(pollRank, 5000);
    return () => clearInterval(interval);
  }, [event, vendorInfo]);

  if (loading) return <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>Loading Event Details...</div>;
  if (error) return <div style={{ padding: '24px', color: '#ef4444' }}>{error}</div>;
  if (!event) return null;

  // Group by sections for display
  const sections = Array.from(new Set(templateFields.map((f: any) => f.section || 'General')));

  return (
    <div style={{ backgroundColor: '#f8fafc', color: '#333', minHeight: '100%', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button onClick={() => navigate('/events')} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <ArrowLeft size={20} color="#475569" />
        </button>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>{event.title}</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '0.875rem' }}>{event.refId} • {event.type}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        
        {/* Main Content Area */}
        <div style={{ flex: '2', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#2563eb" /> Event Requirements
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Items Count</div>
                <div style={{ fontWeight: 500 }}>{event.itemsCount} Items</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Published Date</div>
                <div style={{ fontWeight: 500 }}>{new Date(event.createdAt).toLocaleDateString()}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#fff7ed', borderRadius: '8px', border: '1px solid #ffedd5', gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Clock size={24} color="#ea580c" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#c2410c', marginBottom: '2px', fontWeight: 600 }}>Time Remaining</div>
                  <div style={{ fontWeight: 700, fontSize: '1.25rem', color: '#ea580c' }}>{timeLeft}</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calculator size={18} color="#2563eb" /> Bid Submission Form
              </h2>
              {enableESG && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', backgroundColor: '#f0fdf4', padding: '6px 12px', borderRadius: '6px', border: '1px solid #bbf7d0', fontSize: '0.8rem', fontWeight: 600 }}>
                  <Leaf size={14} /> ESG Tracked Bid
                </div>
              )}
            </div>

            {templateFields.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {sections.map((section: any) => {
                  const sectionFields = templateFields.filter((f: any) => (f.section || 'General') === section);
                  
                  // Filter out fields hidden by conditional logic
                  const visibleFields = sectionFields.filter((f: any) => {
                    if (!f.dependsOn) return true;
                    return String(formData[f.dependsOn]) === f.dependsOnValue;
                  });

                  if (visibleFields.length === 0) return null;

                  return (
                    <div key={section} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>
                        {section}
                      </div>
                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {visibleFields.map((field: any) => {
                          const isReadOnly = field.role !== 'Participant';
                          
                          return (
                            <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 500, color: '#1e293b' }}>
                                {field.name}
                                {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                                {field.autoFill && <span style={{ fontSize: '0.7rem', padding: '2px 6px', backgroundColor: '#eff6ff', color: '#3b82f6', borderRadius: '4px' }}>Auto-Filled</span>}
                                {isReadOnly && <span style={{ fontSize: '0.7rem', padding: '2px 6px', backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: '4px' }}>{field.role === 'Creator' ? 'Buyer Set' : 'Calculated'}</span>}
                                {field.tooltip && (
                                  <div title={field.tooltip} style={{ color: '#94a3b8', cursor: 'help' }}><Info size={14} /></div>
                                )}
                              </label>

                              {/* Input Rendering based on Type */}
                              {field.role === 'Calculation' ? (
                                <div style={{ padding: '12px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', color: '#334155', fontWeight: 600 }}>
                                  {formData[field.key] || 0}
                                </div>
                              ) : field.type === 'dropdown' ? (
                                <select 
                                  value={formData[field.key] || ''} 
                                  onChange={e => handleInputChange(field.key, e.target.value)}
                                  disabled={isReadOnly}
                                  style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: isReadOnly ? '#f8fafc' : '#fff', fontSize: '0.95rem', outline: 'none' }}
                                >
                                  <option value="">Select an option...</option>
                                  {field.dropdownOptions?.split(',').map((opt: string, i: number) => {
                                    const label = opt.includes(':') ? opt.split(':')[0] : opt;
                                    return <option key={i} value={label.trim()}>{label.trim()}</option>;
                                  })}
                                </select>
                              ) : field.type === 'product' ? (
                                <select 
                                  value={formData[field.key] || ''} 
                                  onChange={e => handleInputChange(field.key, e.target.value)}
                                  disabled={isReadOnly}
                                  style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: isReadOnly ? '#f8fafc' : '#fff', fontSize: '0.95rem', outline: 'none' }}
                                >
                                  <option value="">Select a product...</option>
                                  {products.map(p => (
                                    <option key={p.id} value={p.name}>{p.name}</option>
                                  ))}
                                </select>
                              ) : field.type === 'location' ? (
                                <LocationAutocomplete
                                  value={(formData[field.key] as string) || ''}
                                  onChange={(val) => handleInputChange(field.key, val)}
                                  placeholder={`Search for ${field.name}`}
                                  style={{ padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: isReadOnly ? '#f8fafc' : '#fff', fontSize: '0.95rem', outline: 'none', pointerEvents: isReadOnly ? 'none' : 'auto' }}
                                />
                              ) : field.type === 'file' ? (
                                <div style={{ border: '1px dashed #cbd5e1', padding: '16px', borderRadius: '6px', textAlign: 'center', backgroundColor: '#f8fafc', cursor: 'pointer' }}>
                                  <Upload size={24} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Click to upload file or drag and drop</div>
                                </div>
                              ) : field.type === 'table' ? (
                                <div style={{ border: '1px solid #cbd5e1', padding: '16px', borderRadius: '6px', backgroundColor: '#f8fafc', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                                  [Multi-Row Table Interface - Interactive Grid]
                                </div>
                              ) : field.type === 'commodity' ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ padding: '12px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem', color: '#64748b' }}>
                                    LME Index applied
                                  </div>
                                  <span style={{ fontWeight: 600, color: '#94a3b8' }}>+</span>
                                  <input 
                                    type="number"
                                    value={formData[field.key] || ''}
                                    onChange={e => handleInputChange(field.key, e.target.value)}
                                    placeholder="Your Markup"
                                    style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
                                  />
                                </div>
                              ) : field.type === 'date' ? (
                                <input 
                                  type="date"
                                  value={formData[field.key] || ''}
                                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                                  readOnly={isReadOnly}
                                  style={{ 
                                    width: '100%', padding: '12px 16px', fontSize: '0.95rem',
                                    border: isReadOnly ? '1px solid #e2e8f0' : '1px solid #cbd5e1', 
                                    borderRadius: '6px', outline: 'none',
                                    backgroundColor: isReadOnly ? '#f8fafc' : '#ffffff',
                                    color: isReadOnly ? '#475569' : '#0f172a'
                                  }}
                                />
                              ) : (
                                <div style={{ position: 'relative' }}>
                                  {field.type === 'percentage' && <Percent size={14} color="#94a3b8" style={{ position: 'absolute', right: '16px', top: '15px' }} />}
                                  {field.type === 'number' && <Hash size={14} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '15px' }} />}
                                  <input 
                                    type={field.type === 'number' || field.type === 'percentage' ? 'number' : 'text'}
                                    value={formData[field.key] || ''}
                                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                                    readOnly={isReadOnly}
                                    placeholder={field.validationRule ? `Validating ${field.validationRule}...` : ''}
                                    style={{ 
                                      width: '100%', padding: `12px 16px 12px ${field.type === 'number' ? '40px' : '16px'}`, fontSize: '0.95rem',
                                      border: isReadOnly ? '1px solid #e2e8f0' : '1px solid #cbd5e1', 
                                      borderRadius: '6px', outline: 'none',
                                      backgroundColor: isReadOnly ? '#f8fafc' : '#ffffff',
                                      color: isReadOnly ? '#475569' : '#0f172a'
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                
                {(() => {
                  const totalField = templateFields.find((f: any) => f.name.toLowerCase().includes('total'));
                  const totalAmount = totalField ? (parseFloat(formData[totalField.key] as string) || 0) : 
                                     Object.values(formData).reduce((acc: number, val: any) => acc + (parseFloat(val) || 0), 0);
                  
                  const baseCurrency = event.baseCurrency || 'USD';
                  const exchangeRate = exchangeRates[currency] && exchangeRates[baseCurrency] 
                    ? exchangeRates[baseCurrency] / exchangeRates[currency] 
                    : 1.0;
                  
                  const convertedAmount = totalAmount * exchangeRate;
                  
                  return (
                    <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                      {rankInfo && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', backgroundColor: rankInfo.rank === 1 ? '#f0fdf4' : '#eff6ff', border: `2px solid ${rankInfo.rank === 1 ? '#22c55e' : '#3b82f6'}`, borderRadius: '12px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', animation: 'pulse 2s infinite' }}>
                          <span style={{ fontSize: '1.5rem' }}>{rankInfo.rank === 1 ? '🏆' : '📊'}</span>
                          <div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: rankInfo.rank === 1 ? '#15803d' : '#1d4ed8' }}>
                              You are currently Rank #{rankInfo.rank}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Out of {rankInfo.totalBids} competitors</div>
                          </div>
                          {rankInfo.rank > 1 && (
                            <div style={{ marginLeft: 'auto', padding: '4px 12px', backgroundColor: '#3b82f6', color: '#fff', fontSize: '0.8rem', fontWeight: 700, borderRadius: '20px' }}>
                              Lower your price to take the lead!
                            </div>
                          )}
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>Total Bidding Amount:</span>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#16a34a' }}>
                            {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                          </span>
                          {currency !== baseCurrency && (
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                              ≈ {convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {baseCurrency} (Buyer Currency)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div style={{ padding: '24px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '8px' }}>
                No template fields found.
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#0f172a' }}>Submit Your Bid</h3>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Bidding Currency</label>
              <select 
                value={currency} 
                onChange={e => setCurrency(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', outline: 'none' }}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="AUD">AUD (A$)</option>
              </select>
              <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#64748b' }}>
                Buyer Evaluation Currency: <strong style={{color: '#0f172a'}}>{event.baseCurrency || 'USD'}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #d1fae5', marginBottom: '24px' }}>
              <CheckCircle2 size={24} color="#10b981" />
              <div>
                <div style={{ fontSize: '0.875rem', color: '#065f46', fontWeight: 600 }}>Status</div>
                <div style={{ fontSize: '0.875rem', color: '#047857' }}>Open for bidding</div>
              </div>
            </div>

            {existingBid && (
              <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '0.85rem' }}>
                <span style={{ color: '#64748b' }}>Last Quoted Price:</span>
                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.1rem' }}>
                  {existingBid.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {event.baseCurrency || 'USD'}
                </div>
              </div>
            )}
            
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || templateFields.length === 0}
              style={{ 
                width: '100%', padding: '12px 24px', backgroundColor: '#2563eb', color: '#ffffff', 
                border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '1rem', 
                cursor: (isSubmitting || templateFields.length === 0) ? 'not-allowed' : 'pointer', 
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                opacity: (isSubmitting || templateFields.length === 0) ? 0.7 : 1,
                boxShadow: '0 4px 6px -1px rgba(37,99,235,0.2)'
              }}
            >
              {isSubmitting ? 'Submitting...' : <><Save size={18} /> {existingBid ? 'Revise Bid' : 'Submit Bid'}</>}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
