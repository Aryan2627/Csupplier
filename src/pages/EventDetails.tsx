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

    fetch(`https://sourcing.procgen.in/api/products`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(console.error);

    fetch(`https://sourcing.procgen.in/api/exchange-rates`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setExchangeRates(data);
      })
      .catch(console.error);
    
    fetch(`https://sourcing.procgen.in/api/vendor-events/${params.id}`, {
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
        fetch(`https://sourcing.procgen.in/api/vendor-bids?eventId=${data.id}`, {
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
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
      return `${hours}h ${minutes}m ${seconds}s`;
    };
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [event]);

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !existingBid) return;
    const newMsg = { id: Date.now(), sender: vendorInfo?.name || 'Vendor', type: 'text', msg: chatMessage, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
    const updatedHistory = [...chatHistory, newMsg];
    setChatHistory(updatedHistory);
    setChatMessage('');
    
    try {
      await fetch(`https://sourcing.procgen.in/api/vendor-bids`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id: existingBid.id, chatHistory: updatedHistory })
      });
    } catch(err) { console.error(err); }
  };

  
  const handleAcceptCounterOffer = async (msg: any) => {
    if (!existingBid) return;
    const newMsg = { id: Date.now(), sender: vendorInfo?.name || 'Vendor', type: 'text', msg: `âœ… I have accepted your counter offer of ${msg.offerDetails.price}`, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
    const updatedHistory = [...chatHistory, newMsg];
    setChatHistory(updatedHistory);
    
    try {
      await fetch(`https://sourcing.procgen.in/api/vendor-bids`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id: existingBid.id, chatHistory: updatedHistory })
      });
      alert('Counter offer accepted. The buyer has been notified.');
    } catch(err) { console.error(err); }
  };

  const handleRejectCounterOffer = async (msg: any) => {
    if (!existingBid) return;
    const newMsg = { id: Date.now(), sender: vendorInfo?.name || 'Vendor', type: 'text', msg: `âŒ I have rejected your counter offer of ${msg.offerDetails.price}`, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
    const updatedHistory = [...chatHistory, newMsg];
    setChatHistory(updatedHistory);
    
    try {
      await fetch(`https://sourcing.procgen.in/api/vendor-bids`, {
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

      const res = await fetch(`https://sourcing.procgen.in/api/vendor-bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          eventId: event.id,
          vendorName: vendorInfo?.name || 'Vendor',
          amount: convertedAmount,
          localAmount: totalAmount,
          currency: currency,
          exchangeRate: exchangeRate,
          templateData: JSON.stringify(formData)
        })
      });

      if (res.ok) {
        alert("Bid successfully submitted!");
        navigate('/events');
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Error submitting bid. Please try again.");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!event || (event.feedbackMode !== 'Rank Based' && event.type !== 'Rank based') || !vendorInfo) return;

    const pollRank = () => {
      fetch(`https://sourcing.procgen.in/api/vendor-rank?eventId=${event.id}&vendorName=${encodeURIComponent(vendorInfo.name)}`)
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
    <div style={{ backgroundColor: '#f0f4f8', color: '#18181b', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* NDA Modal */}
      {!hasAcceptedNDA && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(9, 9, 11, 0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#fff', padding: '40px', borderRadius: '16px', border: '1px solid #e4e4e7', maxWidth: '600px', width: '90%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
              <ShieldCheck size={32} color="#2563eb" />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 16px 0', color: '#09090b', letterSpacing: '-0.5px' }}>Non-Disclosure Agreement</h2>
            <p style={{ color: '#52525b', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '32px' }}>
              This sourcing event contains strictly confidential and proprietary information. By proceeding, you legally agree to keep all pricing, specifications, and buyer details confidential as per the standard Master NDA.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button 
                onClick={() => navigate('/vendor/events')} 
                style={{ padding: '10px 24px', backgroundColor: '#fff', color: '#3f3f46', border: '1px solid #d4d4d8', borderRadius: '8px', fontWeight: '500', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Decline & Exit
              </button>
              <button 
                onClick={acceptNDA} 
                style={{ padding: '10px 24px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '500', fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', transition: 'all 0.2s' }}
              >
                I Agree, Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div style={{ backgroundColor: '#1e3a8a', padding: '32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={() => navigate('/vendor/events')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', color: '#fff' }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '6px' }}>
              <h1 style={{ fontSize: '1.7rem', fontWeight: 700, color: '#ffffff', margin: 0, letterSpacing: '-0.3px' }}>{event.title}</h1>
              {getEventTypeBadge(parsedStages.length > 0 && parsedStages[activeStageIndex] ? parsedStages[activeStageIndex].type : event.type)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', color: '#bfdbfe', fontSize: '0.9rem', fontWeight: 500 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={14} /> Ref: {event.refId}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} color={timeLeft.includes('Ended') ? '#fca5a5' : '#fde047'} /> 
                Time Left: <strong style={{ color: timeLeft.includes('Ended') ? '#fca5a5' : '#fde047' }}>{timeLeft}</strong>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Hash size={14} /> {Array.from(new Set(allTemplateFields.map((f: any) => f._sourceItemId).filter(Boolean))).length || 1} Items</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1100px', margin: '32px auto', padding: '0 32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Form Container */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e4e4e7', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          
          <div style={{ padding: '24px 32px', borderBottom: '1px solid #e4e4e7', backgroundColor: '#f8fafc' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <Calculator size={18} color="#2563eb" /> Event Requirements & Response
            </h2>
            <p style={{ margin: '4px 0 0 26px', color: '#64748b', fontSize: '0.9rem' }}>Please complete the necessary technical and commercial details below.</p>
          </div>

          {/* Tabs */}
          {parsedStages.length > 1 && (
            <div style={{ display: 'flex', gap: '0', padding: '0 32px', borderBottom: '1px solid #e4e4e7', backgroundColor: '#fff', overflowX: 'auto' }}>
              {parsedStages.map((stage: any, idx: number) => {
                const isActive = idx === activeStageIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveStageIndex(idx)}
                    style={{
                      padding: '16px 24px', 
                      fontSize: '0.9rem', 
                      fontWeight: isActive ? 600 : 500, 
                      cursor: 'pointer',
                      backgroundColor: 'transparent',
                      color: isActive ? '#2563eb' : '#71717a',
                      border: 'none',
                      borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                      display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                  >
                    {stage.type}
                  </button>
                )
              })}
            </div>
          )}

          {/* Form Body */}
          <div style={{ padding: '32px' }}>
            {templateFields.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                {sections.map((section: any) => {
                  const sectionFields = templateFields.filter((f: any) => (f.section || 'General') === section);
                  
                  const visibleFields = sectionFields.filter((f: any) => {
                    if (!f.dependsOn || !f.dependsOn.field) return true;
                    return String(formData[f.dependsOn.field]) === String(f.dependsOn.value);
                  });

                  if (visibleFields.length === 0) return null;

                  const lineItemsMap = new Map<string, any[]>();
                  visibleFields.forEach((f: any) => {
                     const gid = f._sourceItemId || 'default';
                     if (!lineItemsMap.has(gid)) lineItemsMap.set(gid, []);
                     lineItemsMap.get(gid)!.push(f);
                  });
                  const lineItems = Array.from(lineItemsMap.entries());

                  return (
                    <div key={section}>
                      <div style={{ marginBottom: '20px', paddingBottom: '8px', borderBottom: '1px solid #e0e7ff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '4px', height: '18px', backgroundColor: '#2563eb', borderRadius: '2px' }} />
                        <h3 style={{ margin: 0, fontWeight: 600, color: '#1e3a8a', fontSize: '1.05rem', letterSpacing: '-0.2px' }}>{section}</h3>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {lineItems.map(([gid, itemFields], gIdx) => (
                          <div key={gid} style={{ 
                            display: 'flex', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: '12px', 
                            backgroundColor: '#fff',
                            overflow: 'hidden',
                            boxShadow: '0 2px 4px -1px rgba(0,0,0,0.03)'
                          }}>
                            <div style={{ 
                              width: '64px', 
                              backgroundColor: '#f8fafc', 
                              borderRight: '1px solid #e2e8f0', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              flexDirection: 'column',
                              gap: '4px',
                              color: '#94a3b8',
                              flexShrink: 0
                            }}>
                              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Item</span>
                              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e3a8a' }}>{gIdx + 1}</span>
                            </div>
                            <div style={{ 
                              display: 'flex', 
                              gap: '24px', 
                              overflowX: 'auto', 
                              padding: '20px 24px', 
                              flex: 1,
                              WebkitOverflowScrolling: 'touch'
                            }}>
                              {itemFields.map((field: any, idx: number) => {
                              const isReadOnly = field.role === 'Creator' || field.role === 'Calculation';
                              const val = formData[field.key] !== undefined ? formData[field.key] : '';

                              return (
                                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '280px', flex: '0 0 auto' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 500, color: '#3f3f46' }}>
                                  {field.name}
                                  {field.required && !isReadOnly && <span style={{ color: '#ef4444' }}>*</span>}
                                  {field.autoFill && <span style={{ fontSize: '0.65rem', padding: '2px 6px', backgroundColor: '#f4f4f5', color: '#52525b', borderRadius: '4px', border: '1px solid #e4e4e7' }}>Auto</span>}
                                  {isReadOnly && <span style={{ fontSize: '0.65rem', padding: '2px 6px', backgroundColor: '#f4f4f5', color: '#71717a', borderRadius: '4px', border: '1px solid #e4e4e7' }}>{field.role === 'Creator' ? 'Buyer Set' : 'Calculated'}</span>}
                                </label>
                              </div>

                              {field.type === 'long_text' ? (
                                <textarea 
                                  value={val}
                                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                                  disabled={isReadOnly}
                                  placeholder={field.placeholder || 'Enter details...'}
                                  style={{ 
                                    width: '100%', padding: '10px 12px', borderRadius: '6px', 
                                    border: '1px solid #e4e4e7', outline: 'none', fontSize: '0.9rem', 
                                    minHeight: '80px', resize: 'vertical',
                                    backgroundColor: isReadOnly ? '#fafafa' : '#fff',
                                    color: isReadOnly ? '#71717a' : '#18181b',
                                    transition: 'border-color 0.2s',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                                  }}
                                  onFocus={(e) => { if(!isReadOnly) e.target.style.borderColor = '#a1a1aa'; }}
                                  onBlur={(e) => { e.target.style.borderColor = '#e4e4e7'; }}
                                />
                              ) : field.type === 'boolean' ? (
                                <select
                                  value={val}
                                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                                  disabled={isReadOnly}
                                  style={{ 
                                    width: '100%', padding: '10px 12px', borderRadius: '6px', 
                                    border: '1px solid #e4e4e7', outline: 'none', fontSize: '0.9rem',
                                    backgroundColor: isReadOnly ? '#fafafa' : '#fff',
                                    color: isReadOnly ? '#71717a' : '#18181b',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
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
                                      width: '100%', padding: '16px', borderRadius: '6px', 
                                      border: '1px dashed #d4d4d8', outline: 'none', fontSize: '0.85rem',
                                      backgroundColor: isReadOnly ? '#fafafa' : '#fff',
                                      color: isReadOnly ? '#71717a' : '#52525b', cursor: isReadOnly ? 'not-allowed' : 'pointer'
                                    }}
                                  />
                                  {val && (
                                    <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <CheckCircle2 size={14} /> Uploaded: {val}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <input 
                                  type={field.type === 'number' ? 'number' : 'text'}
                                  value={val}
                                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                                  disabled={isReadOnly}
                                  placeholder={field.placeholder || ''}
                                  style={{ 
                                    width: '100%', padding: '10px 12px', borderRadius: '6px', 
                                    border: '1px solid #e4e4e7', outline: 'none', fontSize: '0.9rem',
                                    backgroundColor: isReadOnly ? '#fafafa' : '#fff',
                                    color: isReadOnly ? '#71717a' : '#18181b',
                                    transition: 'border-color 0.2s',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                                  }}
                                  onFocus={(e) => { if(!isReadOnly) e.target.style.borderColor = '#a1a1aa'; }}
                                  onBlur={(e) => { e.target.style.borderColor = '#e4e4e7'; }}
                                />
                              )}
                            </div>
                          );
                        })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', backgroundColor: '#fafafa', border: '1px dashed #e4e4e7', color: '#71717a', borderRadius: '8px' }}>
                No template fields found for this stage.
              </div>
            )}
          </div>
        </div>

        {/* Submit Card */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e4e4e7', padding: '24px 32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#1e3a8a', fontWeight: 600 }}>Finalize & Submit</h3>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Buyer Evaluation Currency: <strong style={{color: '#1e3a8a'}}>{event.baseCurrency || 'INR'}</strong>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', backgroundColor: '#ecfccb', borderRadius: '20px', border: '1px solid #d9f99d' }}>
              <CheckCircle2 size={16} color="#4d7c0f" />
              <div style={{ fontSize: '0.85rem', color: '#3f6212', fontWeight: 600 }}>Open for bidding</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: '#fafafa', borderRadius: '8px', border: '1px solid #e4e4e7' }}>
            {(() => {
              const totalField = allTemplateFields.find((f: any) => f.name.toLowerCase().includes('total'));
              let totalAmount = 0;
              if (formData['total_value']) {
                totalAmount = parseFloat(formData['total_value'] as string) || 0;
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

              return (
                <>
                  <div style={{ fontSize: '0.95rem', fontWeight: 500, color: '#3f3f46' }}>Total Bidding Amount:</div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#09090b', letterSpacing: '-0.5px' }}>
                      {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                    </div>
                    {currency !== baseCurrency && (
                      <div style={{ fontSize: '0.8rem', color: '#71717a', marginTop: '2px' }}>
                        â‰ˆ {convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {baseCurrency}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>

          {existingBid && (
            <div style={{ padding: '16px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#991b1b', fontSize: '0.9rem', fontWeight: 500 }}>Previous Quote:</span>
              <div style={{ fontWeight: 700, color: '#7f1d1d', fontSize: '1.1rem' }}>
                {existingBid.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {event.baseCurrency || 'INR'}
              </div>
            </div>
          )}
          
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || allTemplateFields.length === 0}
            style={{ 
              width: '100%', padding: '14px 24px', backgroundColor: '#2563eb', color: '#ffffff', 
              border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '1rem', 
              cursor: (isSubmitting || allTemplateFields.length === 0) ? 'not-allowed' : 'pointer', 
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
              opacity: (isSubmitting || allTemplateFields.length === 0) ? 0.7 : 1,
              boxShadow: '0 4px 6px -1px rgba(37,99,235,0.2)',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => { if(!(isSubmitting || allTemplateFields.length === 0)) e.currentTarget.style.backgroundColor = '#1d4ed8'; }}
            onMouseOut={(e) => { if(!(isSubmitting || allTemplateFields.length === 0)) e.currentTarget.style.backgroundColor = '#2563eb'; }}
          >
            {isSubmitting ? 'Submitting...' : <><Save size={18} /> {existingBid ? 'Submit Revised Bid' : 'Submit Final Bid'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
