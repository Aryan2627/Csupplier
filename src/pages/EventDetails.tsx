import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LocationAutocomplete from '../components/LocationAutocomplete';
import { ArrowLeft, Clock, Save, FileText, CheckCircle2, Calculator, Info, Leaf, Upload, Hash, Percent, ShieldCheck } from 'lucide-react';

export function EventDetails() {
  const params = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<any>(null);
  const [hasAcceptedNDA, setHasAcceptedNDA] = useState(false);

  useEffect(() => {
    if (params.id && localStorage.getItem(`nda_accepted_${params.id}`)) {
      setHasAcceptedNDA(true);
    }
  }, [params.id]);

  const acceptNDA = () => {
    if (params.id) {
      localStorage.setItem(`nda_accepted_${params.id}`, 'true');
      setHasAcceptedNDA(true);
    }
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [vendorInfo, setVendorInfo] = useState<any>(null);
  const [existingBid, setExistingBid] = useState<any>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  
  const [formData, setFormData] = useState<Record<string, string | number>>({});
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [currency, setCurrency] = useState('INR');
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

    fetch(`https://cpanel-swart.vercel.app/api/products`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(console.error);

    fetch(`https://cpanel-swart.vercel.app/api/exchange-rates`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setExchangeRates(data);
      })
      .catch(console.error);
    
    fetch(`https://cpanel-swart.vercel.app/api/vendor-events/${params.id}`, {
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
        fetch(`https://cpanel-swart.vercel.app/api/vendor-bids?eventId=${data.id}`, {
          headers: { 'Authorization': `Bearer ${t}` }
        })
          .then(res => res.json())
          .then(bidData => {
            if (bidData && Object.keys(bidData).length > 0) {
              setExistingBid(bidData);
              if (bidData.chatHistory) {
                try {
                  setChatHistory(typeof bidData.chatHistory === 'string' ? JSON.parse(bidData.chatHistory) : bidData.chatHistory);
                } catch(e) {}
              }
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

  const parsedStages = React.useMemo(() => {
    if (!event || !event.stages) return [];
    try { return JSON.parse(event.stages) || []; } catch(e) { return []; }
  }, [event]);

  const allTemplateFields = React.useMemo(() => {
    let all: any[] = [];
    parsedStages.forEach((s: any) => { if (s.templateFields) all = [...all, ...s.templateFields]; });
    return all;
  }, [parsedStages]);

  const templateFields = React.useMemo(() => {
    if (parsedStages.length > 0 && parsedStages[activeStageIndex]) {
      return parsedStages[activeStageIndex].templateFields || [];
    }
    return [];
  }, [parsedStages, activeStageIndex]);

  
  // Auto-calculate formula fields on mount if they haven't been calculated yet
  useEffect(() => {
    if (allTemplateFields.length > 0 && Object.keys(formData).length > 0) {
      let hasCalc = false;
      const next = { ...formData };
      let changed = false;
      
      allTemplateFields.forEach((f: any) => {
        if (f.role?.toLowerCase() === 'calculation' && f.formula) {
           hasCalc = true;
           const groupId = f._sourceItemId || 'default';
           const groupFields = allTemplateFields.filter((tf: any) => (tf._sourceItemId || 'default') === groupId);
           try {
             let expr = f.formula;
             const sortedFields = [...groupFields].sort((a, b) => (b.originalKey || b.key).length - (a.originalKey || a.key).length);
             sortedFields.forEach((gf: any) => {
               const vName = gf.originalKey || gf.key;
               if (expr.includes(vName)) {
                 let v = 0;
                 if (gf.role?.toLowerCase() === 'creator') v = Number(gf.defaultValue) || 0;
                 else v = Number(next[gf.key]) || 0;
                 expr = expr.replace(new RegExp(`\\b${vName}\\b`, 'g'), v.toString());
               }
             });
             // eslint-disable-next-line no-new-func
             const result = new Function('return ' + expr)();
             const newResult = Number(result) || 0;
             if (next[f.key] !== newResult) {
                 next[f.key] = newResult;
                 changed = true;
             }
           } catch(e) {}
        }
      });
      if (changed) {
        setFormData(next);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTemplateFields]); // Only run when template fields change (which happens on event load)

  const enableESG = templateFields.some((f: any) => f.enableESG);

  useEffect(() => {
    if (allTemplateFields.length === 0) return;
    
    // Debounce the calculation to improve typing performance
    const timeout = setTimeout(() => {
      let updated = false;
      const newFormData = { ...formData };
      
      allTemplateFields.forEach((field: any) => {
        if (field.role === 'Calculation' && field.formula) {
          try {
            let formulaStr = field.formula;
              const groupId = field._sourceItemId || 'default';
              const groupFields = allTemplateFields.filter((tf: any) => (tf._sourceItemId || 'default') === groupId);
              const sortedFields = [...groupFields].sort((a, b) => (b.originalKey || b.key).length - (a.originalKey || a.key).length);
              
              sortedFields.forEach((gf: any) => {
                const vName = gf.originalKey || gf.key;
                if (formulaStr.includes(vName)) {
                  let val = 0;
                  if (gf.role?.toLowerCase() === 'creator') val = Number(gf.defaultValue) || 0;
                  else val = Number(newFormData[gf.key]) || 0;
                  formulaStr = formulaStr.replace(new RegExp(`\\b${vName}\\b`, 'g'), val.toString());
                }
              });
              
              const evaluated = Number(new Function('return ' + formulaStr)());
            
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
  }, [formData, allTemplateFields]);

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

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !existingBid) return;
    const newMsg = { id: Date.now(), sender: vendorInfo?.name || 'Vendor', type: 'text', msg: chatMessage, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
    const updatedHistory = [...chatHistory, newMsg];
    setChatHistory(updatedHistory);
    setChatMessage('');
    
    try {
      await fetch(`https://cpanel-swart.vercel.app/api/vendor-bids`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id: existingBid.id, chatHistory: updatedHistory })
      });
    } catch(err) { console.error(err); }
  };

  
  const handleAcceptCounterOffer = async (msg: any) => {
    if (!existingBid) return;
    const newMsg = { id: Date.now(), sender: vendorInfo?.name || 'Vendor', type: 'text', msg: `? I have accepted your counter offer of ${msg.offerDetails.price}`, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
    const updatedHistory = [...chatHistory, newMsg];
    setChatHistory(updatedHistory);
    
    try {
      await fetch(`https://cpanel-swart.vercel.app/api/vendor-bids`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id: existingBid.id, chatHistory: updatedHistory })
      });
      alert('Counter offer accepted. The buyer has been notified.');
    } catch(err) { console.error(err); }
  };

  const handleRejectCounterOffer = async (msg: any) => {
    if (!existingBid) return;
    const newMsg = { id: Date.now(), sender: vendorInfo?.name || 'Vendor', type: 'text', msg: `? I have rejected your counter offer of ${msg.offerDetails.price}`, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
    const updatedHistory = [...chatHistory, newMsg];
    setChatHistory(updatedHistory);
    
    try {
      await fetch(`https://cpanel-swart.vercel.app/api/vendor-bids`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id: existingBid.id, chatHistory: updatedHistory })
      });
    } catch(err) { console.error(err); }
  };

  const handleInputChange = (key: string, value: string) => {
    const numVal = parseFloat(value);
    setFormData(prev => ({
      ...prev,
      [key]: isNaN(numVal) ? value : numVal
    }));
  };

  const handleSubmit = async () => {
    if (!token) return;

    // Validate Required Fields
    const missingFields: string[] = [];
    allTemplateFields.forEach((f: any) => {
      const isCreator = f.role?.toLowerCase() === 'creator';
      const isCalc = f.role?.toLowerCase() === 'calculation';
      if (f.required && !isCreator && !isCalc) {
        let isVisible = true;
        if (f.dependsOn && f.dependsOn.field) {
          isVisible = String(formData[f.dependsOn.field]) === String(f.dependsOn.value);
        }
        if (isVisible) {
          const val = formData[f.key];
          if (val === undefined || val === null || val === '') {
            missingFields.push(f.name);
          }
        }
      }
    });

    if (missingFields.length > 0) {
      alert(`Please fill out the following required fields:\n- ${missingFields.join('\n- ')}`);
      return;
    }

    setIsSubmitting(true);
    
    try {
      let totalAmount = 0;
      if (formData['total_value']) {
        totalAmount = parseFloat(formData['total_value'] as string);
      }
            if (!totalAmount) {
        let calcAmount = 0;
        const groupedFields = new Map<any, any[]>();
        allTemplateFields.forEach((f: any) => {
            const g = f._sourceItemId || 'default';
            if (!groupedFields.has(g)) groupedFields.set(g, []);
            groupedFields.get(g)!.push(f);
        });
        
        groupedFields.forEach(fields => {
          const calcFields = fields.filter(f => f.role?.toLowerCase() === 'calculation' && f.type === 'number');
          const targetFields = calcFields.length > 0 ? calcFields : fields.filter(f => f.role?.toLowerCase() === 'participant' && f.type === 'number');
          
          targetFields.forEach(f => {
            if (formData[f.key]) {
              calcAmount += parseFloat(formData[f.key] as string) || 0;
            }
          });
        });
        totalAmount = calcAmount;
      }

      const baseCurrency = event.baseCurrency || 'INR';
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

      const res = await fetch(`https://cpanel-swart.vercel.app/api/vendor-bids`, {
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
    if (!event || (event.feedbackMode !== 'Rank Based' && event.type !== 'Rank based') || !vendorInfo) return;

    const pollRank = () => {
      fetch(`https://cpanel-swart.vercel.app/api/vendor-rank?eventId=${event.id}&vendorName=${encodeURIComponent(vendorInfo.name)}`)
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

  const getEventTypeBadge = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('auction')) return <span style={{ padding: '6px 14px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '24px', fontWeight: 700, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px', letterSpacing: '0.5px', textTransform: 'uppercase' }}> LIVE AUCTION</span>;
    if (t.includes('tech')) return <span style={{ padding: '6px 14px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', borderRadius: '24px', fontWeight: 700, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px', letterSpacing: '0.5px', textTransform: 'uppercase' }}> TECHNICAL EVENT</span>;
    return <span style={{ padding: '6px 14px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '24px', fontWeight: 700, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px', letterSpacing: '0.5px', textTransform: 'uppercase' }}> STANDARD RFQ</span>;
  };

  // Group by sections for display
  const sections = Array.from(new Set(templateFields.map((f: any) => f.section || 'General')));

  return (
    <div style={{ backgroundColor: '#f8fafc', color: '#333', minHeight: '100%', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      {!hasAcceptedNDA && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2, 6, 23, 0.4)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div style={{ background: '#fff', padding: '48px', borderRadius: '24px', border: '1px solid #e2e8f0', maxWidth: '600px', width: '90%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <ShieldCheck size={64} color="#3b82f6" style={{ margin: '0 auto 24px auto' }} />
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: '0 0 16px 0', color: '#0f172a' }}>Non-Disclosure Agreement</h2>
            <p style={{ color: '#475569', fontSize: '1rem', lineHeight: '1.6', marginBottom: '32px' }}>
              This sourcing event contains strictly confidential and proprietary information. By proceeding, you legally agree to keep all pricing, specifications, and buyer details confidential as per the standard Master NDA.
            </p>
            <button onClick={acceptNDA} style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', border: 'none', padding: '16px 32px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer', width: '100%', transition: 'all 0.2s', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)' }}>
              I Agree & Accept NDA
            </button>
          </div>
        </div>
      )}
      <div style={{ pointerEvents: hasAcceptedNDA ? 'auto' : 'none' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', backgroundColor: '#fff', padding: '24px 32px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
        <button onClick={() => navigate('/events')} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          <ArrowLeft size={22} color="#475569" />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '10px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>{event.title}</h1>
            {getEventTypeBadge(parsedStages.length > 0 && parsedStages[activeStageIndex] ? parsedStages[activeStageIndex].type : event.type)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', color: '#64748b', fontSize: '0.95rem', fontWeight: 500 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={16} /> Ref: {event.refId}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} color="#ea580c" /> Time Left: <strong style={{ color: '#ea580c' }}>{timeLeft}</strong></span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Hash size={16} /> {event.itemsCount} Items</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
             <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '24px', borderBottom: '2px dashed #f1f5f9' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700 }}>
                  <Calculator size={24} color="#2563eb" /> Put Your Details
                </h2>
                <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Please fill out the technical and commercial requirements below.</p>
              </div>
              {enableESG && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', backgroundColor: '#f0fdf4', padding: '8px 16px', borderRadius: '20px', border: '1px solid #bbf7d0', fontSize: '0.85rem', fontWeight: 700, boxShadow: '0 2px 4px rgba(22, 163, 74, 0.1)' }}>
                  <Leaf size={16} /> ESG Tracked
                </div>
              )}
            </div>

            {parsedStages.length > 1 && (
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
                {parsedStages.map((stage: any, idx: number) => {
                  const isActive = idx === activeStageIndex;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveStageIndex(idx)}
                      style={{
                        padding: '12px 24px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
                        backgroundColor: isActive ? '#eff6ff' : 'transparent',
                        color: isActive ? '#2563eb' : '#64748b',
                        border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                        display: 'flex', alignItems: 'center', gap: '8px'
                      }}
                    >
                      {stage.type} - {stage.name}
                    </button>
                  )
                })}
              </div>
            )}
            
            {templateFields.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {sections.map((section: any) => {
                  const sectionFields = templateFields.filter((f: any) => (f.section || 'General') === section);
                  
                  // Filter out fields hidden by conditional logic
                  const visibleFields = sectionFields.filter((f: any) => {
                    if (!f.dependsOn || !f.dependsOn.field) return true;
                    return String(formData[f.dependsOn.field]) === String(f.dependsOn.value);
                  });

                  if (visibleFields.length === 0) return null;

                  return (
                    <div key={section} style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ padding: '16px 24px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '4px', height: '20px', backgroundColor: '#2563eb', borderRadius: '4px' }} />
                        <h3 style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '1.05rem', letterSpacing: '-0.3px' }}>{section}</h3>
                      </div>
                      <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
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
                                  style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: isReadOnly ? '#f8fafc' : '#fff', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}
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
                                  style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: isReadOnly ? '#f8fafc' : '#fff', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}
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
                                    onWheel={e => e.currentTarget.blur()}
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
                                      width: '100%', padding: '14px 16px', fontSize: '0.95rem',
                                      border: isReadOnly ? '1px solid #e2e8f0' : '1px solid #cbd5e1',
                                      borderRadius: '8px', outline: 'none', transition: 'all 0.2s', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
                                      backgroundColor: isReadOnly ? '#f8fafc' : '#ffffff',
                                      color: isReadOnly ? '#475569' : '#0f172a'
                                    }}
                                  />
                                ) : field.type === 'boolean' ? (
                                  <select
                                    value={formData[field.key] || ''}
                                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                                    disabled={isReadOnly}
                                    style={{ 
                                      width: '100%', padding: '14px 16px', fontSize: '0.95rem',
                                      border: isReadOnly ? '1px solid #e2e8f0' : '1px solid #cbd5e1',
                                      borderRadius: '8px', outline: 'none', transition: 'all 0.2s', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
                                      backgroundColor: isReadOnly ? '#f8fafc' : '#ffffff',
                                      color: isReadOnly ? '#475569' : '#0f172a'
                                    }}
                                  >
                                    <option value="">Select...</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                  </select>
                                ) : field.type === 'file' ? (
                                  <div style={{ position: 'relative' }}>
                                    <input 
                                      type="file"
                                      disabled={isReadOnly}
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                          handleInputChange(field.key, e.target.files[0].name);
                                        }
                                      }}
                                      style={{ 
                                        width: '100%', padding: '10px 16px', fontSize: '0.95rem',
                                        border: isReadOnly ? '1px solid #e2e8f0' : '1px solid #cbd5e1',
                                        borderRadius: '8px', outline: 'none', transition: 'all 0.2s', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
                                        backgroundColor: isReadOnly ? '#f8fafc' : '#ffffff',
                                        color: isReadOnly ? '#475569' : '#0f172a',
                                        cursor: isReadOnly ? 'not-allowed' : 'pointer'
                                      }}
                                    />
                                    {formData[field.key] && (
                                       <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                                         <span>✓ Uploaded: {formData[field.key]}</span>
                                       </div>
                                    )}
                                  </div>
                                ) : (
                                  <div style={{ position: 'relative' }}>
                                  {field.type === 'percentage' && <Percent size={14} color="#94a3b8" style={{ position: 'absolute', right: '16px', top: '15px' }} />}
                                  {field.type === 'number' && <Hash size={14} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '15px' }} />}
                                  <input 
                                    type={field.type === 'number' || field.type === 'percentage' ? 'number' : 'text'}
                                    value={formData[field.key] || ''}
                                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                                    onWheel={e => (field.type === 'number' || field.type === 'percentage') && e.currentTarget.blur()}
                                    readOnly={isReadOnly}
                                    placeholder={field.validationRule ? `Validating ${field.validationRule}...` : ''}
                                    style={{ 
                                      width: '100%', padding: `14px 16px 14px ${field.type === 'number' ? '40px' : '16px'}`, fontSize: '0.95rem',
                                      border: isReadOnly ? '1px solid #e2e8f0' : '1px solid #cbd5e1',
                                      borderRadius: '8px', outline: 'none', transition: 'all 0.2s', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
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
                  
                  const baseCurrency = event.baseCurrency || 'INR';
                  const exchangeRate = exchangeRates[currency] && exchangeRates[baseCurrency] 
                    ? exchangeRates[baseCurrency] / exchangeRates[currency] 
                    : 1.0;
                  
                  const convertedAmount = totalAmount * exchangeRate;
                  
                  return (
                    <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                      {rankInfo && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', backgroundColor: rankInfo.rank === 1 ? '#f0fdf4' : '#eff6ff', border: `2px solid ${rankInfo.rank === 1 ? '#22c55e' : '#3b82f6'}`, borderRadius: '12px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', animation: 'pulse 2s infinite' }}>
                          <span style={{ fontSize: '1.5rem' }}>{rankInfo.rank === 1 ? '' : ''}</span>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#0f172a' }}>Submit Your Bid</h3>
            
            <div style={{ marginBottom: '24px' }}>
              
              <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#64748b' }}>
                Buyer Evaluation Currency: <strong style={{color: '#0f172a'}}>{event.baseCurrency || 'INR'}</strong>
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
                  {existingBid.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {event.baseCurrency || 'INR'}
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

            {/* Negotiation Chat Box */}
            {existingBid && (
              <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}> Direct Negotiation</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', marginBottom: '16px', padding: '16px', border: '1px solid #f1f5f9', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                  {chatHistory.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', padding: '24px 0' }}>No messages yet.</div>
                  ) : (
                    chatHistory.map((msg: any) => (
                      <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'You' || msg.sender === 'Client' ? 'flex-start' : 'flex-end' }}>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '4px' }}>{msg.sender === (vendorInfo?.name || 'Vendor') ? 'You' : 'Client'} • {msg.time}</div>
                        {msg.type === 'counter_offer' ? (
                          <div style={{ backgroundColor: '#fff', border: '1px solid #10b981', padding: '12px', borderRadius: '8px', width: '80%' }}>
                            <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '8px', fontSize: '0.9rem' }}>Formal Counter Offer</div>
                            <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '4px' }}><strong>Price:</strong> ${msg.offerDetails.price}</div>
                            <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '4px' }}><strong>Expires:</strong> {msg.offerDetails.expiry}</div>
                            <div style={{ fontSize: '0.85rem', color: '#475569', fontStyle: 'italic', marginBottom: '12px' }}>"{msg.offerDetails.reason}"</div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleAcceptCounterOffer(msg)} style={{ padding: '6px 12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Accept</button>
                                <button onClick={() => handleRejectCounterOffer(msg)} style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Reject</button>
                              </div>
                            </div>
                        ) : (
                          <div style={{ padding: '10px 14px', backgroundColor: msg.sender === (vendorInfo?.name || 'Vendor') ? '#2563eb' : '#fff', color: msg.sender === (vendorInfo?.name || 'Vendor') ? '#fff' : '#0f172a', border: msg.sender === (vendorInfo?.name || 'Vendor') ? 'none' : '1px solid #cbd5e1', borderRadius: '12px', maxWidth: '85%', fontSize: '0.9rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            {msg.msg}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" placeholder="Type a message..." value={chatMessage} onChange={e => setChatMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} style={{ flex: 1, padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }} />
                  <button onClick={handleSendMessage} style={{ padding: '10px 16px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Send</button>
                </div>
              </div>
            )}
  
          </div>
        </div>
    </div>
</div>
  );
}