import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Save, FileText, CheckCircle2, Calculator } from 'lucide-react';

export function EventDetails() {
  const params = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [vendorInfo, setVendorInfo] = useState<any>(null);
  
  const [formData, setFormData] = useState<Record<string, string | number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const t = localStorage.getItem('token'); // Csupplier uses 'token'
    const v = localStorage.getItem('vendor'); // Csupplier uses 'vendor'
    if (!t) {
      navigate('/login');
      return;
    }
    setToken(t);
    if (v) setVendorInfo(JSON.parse(v));
    
    // Fetch Event
    fetch(`http://localhost:3000/api/vendor-events/${params.id}`, {
      headers: { 'Authorization': `Bearer ${t}` }
    })
      .then(res => {
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
                initialData[field.key] = field.role === 'Creator' ? (field.defaultValue || 0) : 0;
              });
            }
          } catch(e) {}
        }

        // Fetch existing bid if any
        fetch(`http://localhost:3000/api/vendor-bids?eventId=${data.id}`, {
          headers: { 'Authorization': `Bearer ${t}` }
        })
          .then(res => res.json())
          .then(bidData => {
            if (bidData && bidData.templateData) {
              try {
                const parsed = JSON.parse(bidData.templateData);
                initialData = { ...initialData, ...parsed };
              } catch(e) {}
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
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [params.id, navigate]);

  // Derived template fields
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

  // Evaluate formulas dynamically whenever formData changes
  useEffect(() => {
    if (templateFields.length === 0) return;
    
    let updated = false;
    const newFormData = { ...formData };
    
    templateFields.forEach((field: any) => {
      if (field.formula) {
        try {
          // simple replacement of variables
          let formulaStr = field.formula;
          // Sort keys by length descending to prevent partial replacements (e.g. replacing 'price' inside 'base_price')
          const keys = Object.keys(formData).sort((a, b) => b.length - a.length);
          keys.forEach(k => {
            const val = newFormData[k] || 0;
            // regex replace word boundary to safely replace variables
            const regex = new RegExp(`\\b${k}\\b`, 'g');
            formulaStr = formulaStr.replace(regex, val.toString());
          });
          
          // eslint-disable-next-line no-eval
          const evaluated = eval(formulaStr);
          if (newFormData[field.key] !== evaluated) {
            newFormData[field.key] = evaluated;
            updated = true;
          }
        } catch (e) {
          // ignore eval errors during partial input
        }
      }
    });
    
    if (updated) {
      setFormData(newFormData);
    }
  }, [formData, templateFields]);

  // Live countdown timer
  useEffect(() => {
    if (!event || !event.endTime) {
      setTimeLeft('No End Time');
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(event.endTime).getTime();
      const difference = end - now;

      if (difference <= 0) {
        return 'Event Ended';
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (days > 0) return `${days}d ${hours}h ${minutes}m`;
      return `${hours}h ${minutes}m ${seconds}s`;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

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
      // Find a field like 'total_value' to act as amount, or sum everything up as fallback
      let totalAmount = 0;
      if (formData['total_value']) {
        totalAmount = parseFloat(formData['total_value'] as string);
      } else {
        totalAmount = Object.values(formData).reduce((acc: number, val: any) => acc + (parseFloat(val) || 0), 0);
      }

      const res = await fetch('http://localhost:3000/api/vendor-bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: event.id,
          vendorName: vendorInfo?.name || 'Vendor',
          amount: totalAmount,
          templateData: formData
        })
      });

      if (res.ok) {
        alert("Bid successfully submitted!");
        navigate('/events');
      } else {
        alert("Error submitting bid.");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '24px', display: 'flex', justifyContent: 'center' }}>Loading Event Details...</div>;
  if (error) return <div style={{ padding: '24px', color: '#ef4444' }}>{error}</div>;
  if (!event) return null;

  return (
    <div style={{ backgroundColor: '#f8fafc', color: '#333', minHeight: '100%', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button 
          onClick={() => navigate('/events')}
          style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
        >
          <ArrowLeft size={20} color="#475569" />
        </button>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>{event.title}</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '0.875rem' }}>{event.refId} • {event.type}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        
        {/* Main Content Area */}
        <div style={{ flex: '2', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Info Card */}
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

          {/* Dynamic Template Form */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calculator size={18} color="#2563eb" /> Bid Submission Form
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '24px' }}>Please fill out the requested fields below. Calculated fields will update automatically.</p>

            {templateFields.length > 0 ? (
              <div 
                style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px', transition: 'background-color 0.2s', borderRadius: '8px' }}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasteData = e.clipboardData.getData('text');
                  // Split by newline and tab to get all cell values in order
                  const values = pasteData.split(/[\n\t]+/).filter(v => v.trim() !== '');
                  const newFormData = { ...formData };
                  
                  let valIndex = 0;
                  templateFields.forEach((field: any) => {
                    if (field.role === 'Participant' && valIndex < values.length) {
                      const numVal = parseFloat(values[valIndex]);
                      newFormData[field.key] = isNaN(numVal) ? values[valIndex] : numVal;
                      valIndex++;
                    }
                  });
                  
                  setFormData(newFormData);
                  
                  // Flash green
                  const div = e.currentTarget;
                  div.style.backgroundColor = '#dcfce3';
                  setTimeout(() => div.style.backgroundColor = 'transparent', 600);
                }}
              >
                <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>💡 Pro tip: Click anywhere here and press Ctrl+V to paste multiple values directly from Excel!</span>
                </div>
                {templateFields.map((field: any) => {
                  const isReadOnly = field.role !== 'Participant';
                  
                  return (
                    <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: 500, color: '#1e293b' }}>
                        {field.name}
                        {field.role === 'Creator' && <span style={{ marginLeft: '8px', fontSize: '0.75rem', padding: '2px 6px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '12px' }}>Set by Buyer</span>}
                        {field.role === 'Calculation' && <span style={{ marginLeft: '8px', fontSize: '0.75rem', padding: '2px 6px', backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: '12px' }}>Auto-calculated</span>}
                      </label>
                      <input 
                        type="text"
                        value={formData[field.key] === 0 && !isReadOnly ? '' : formData[field.key]}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        readOnly={isReadOnly}
                        placeholder={field.role === 'Participant' ? `Enter ${field.name.toLowerCase()}` : ''}
                        style={{ 
                          width: '100%', padding: '12px 16px', fontSize: '1rem',
                          border: isReadOnly ? '1px solid #e2e8f0' : '1px solid #cbd5e1', 
                          borderRadius: '6px', outline: 'none',
                          backgroundColor: isReadOnly ? '#f8fafc' : '#ffffff',
                          color: isReadOnly ? '#475569' : '#0f172a',
                          transition: 'border-color 0.2s',
                          boxShadow: isReadOnly ? 'none' : 'inset 0 1px 2px rgba(0,0,0,0.05)'
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '24px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '8px' }}>
                No template fields found for this event.
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Action Card */}
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#0f172a' }}>Submit Your Bid</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #d1fae5', marginBottom: '24px' }}>
              <CheckCircle2 size={24} color="#10b981" />
              <div>
                <div style={{ fontSize: '0.875rem', color: '#065f46', fontWeight: 600 }}>Status</div>
                <div style={{ fontSize: '0.875rem', color: '#047857' }}>Open for bidding</div>
              </div>
            </div>

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
              {isSubmitting ? 'Submitting...' : <><Save size={18} /> Submit Bid</>}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
