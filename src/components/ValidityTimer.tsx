import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface ValidityTimerProps {
  createdAt?: string | number;
  status?: string;
  compact?: boolean;
}

export function ValidityTimer({ createdAt, status, compact = false }: ValidityTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 15, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      let createdMs: number | null = null;

      if (createdAt) {
        createdMs = typeof createdAt === 'number' ? createdAt : new Date(createdAt).getTime();
      }

      if (!createdMs || isNaN(createdMs)) {
        const stored = localStorage.getItem('vendor_created_at');
        if (stored && !isNaN(Number(stored))) {
          createdMs = Number(stored);
        } else {
          createdMs = Date.now();
          localStorage.setItem('vendor_created_at', createdMs.toString());
        }
      }

      const TOTAL_VALIDITY_MS = 15 * 24 * 60 * 60 * 1000; // 15 Days in milliseconds
      const expiryMs = createdMs + TOTAL_VALIDITY_MS;
      const diff = expiryMs - Date.now();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const st = (status || '').toLowerCase();
  const isApprovedOrPending = [
    'approval pending', 'pending review', 'waiting for approval', 'onboarded', 'active', 'approved', 'joined'
  ].includes(st);

  if (isApprovedOrPending) {
    return null;
  }

  const isUrgent = timeLeft.days <= 3;
  const pad = (n: number) => n.toString().padStart(2, '0');

  if (compact) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 12px',
        backgroundColor: timeLeft.isExpired ? '#fef2f2' : isUrgent ? '#fff1f2' : '#f0fdf4',
        border: `1px solid ${timeLeft.isExpired ? '#fca5a5' : isUrgent ? '#fecdd3' : '#bbf7d0'}`,
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: 600,
        color: timeLeft.isExpired ? '#991b1b' : isUrgent ? '#9f1239' : '#166534'
      }}>
        <Clock size={14} style={{ flexShrink: 0 }} />
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {timeLeft.isExpired ? (
            'Validity Expired'
          ) : (
            `Validity: ${timeLeft.days}d ${pad(timeLeft.hours)}h ${pad(timeLeft.minutes)}m ${pad(timeLeft.seconds)}s`
          )}
        </span>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: timeLeft.isExpired ? '#fef2f2' : isUrgent ? '#fff1f2' : '#f0fdf4',
      border: `1px solid ${timeLeft.isExpired ? '#fca5a5' : isUrgent ? '#fecdd3' : '#bbf7d0'}`,
      borderRadius: '12px',
      padding: '16px 20px',
      marginBottom: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: timeLeft.isExpired ? '#fee2e2' : isUrgent ? '#ffe4e6' : '#dcfce7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: timeLeft.isExpired ? '#dc2626' : isUrgent ? '#e11d48' : '#16a34a',
            flexShrink: 0
          }}>
            {timeLeft.isExpired ? <AlertTriangle size={22} /> : <Clock size={22} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h4 style={{
                margin: 0,
                fontSize: '0.95rem',
                fontWeight: 700,
                color: timeLeft.isExpired ? '#991b1b' : isUrgent ? '#be123c' : '#166534'
              }}>
                {timeLeft.isExpired ? '15-Day Registration Validity Expired' : '15-Day Registration Validity'}
              </h4>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: timeLeft.isExpired ? '#dc2626' : isUrgent ? '#e11d48' : '#16a34a',
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {timeLeft.isExpired ? 'EXPIRED' : 'LIVE TIMER'}
              </span>
            </div>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '0.85rem',
              color: timeLeft.isExpired ? '#b91c1c' : isUrgent ? '#9f1239' : '#15803d',
              lineHeight: 1.4
            }}>
              {timeLeft.isExpired
                ? 'Your 15-day onboarding validity period has expired and your registration link is no longer valid. Please ask your buyer to issue a new invitation.'
                : 'Complete and submit your onboarding application before your validity period expires. Incomplete registrations are automatically purged after 15 days.'}
            </p>
          </div>
        </div>

        {!timeLeft.isExpired && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Days Box */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: '#ffffff',
              border: `1px solid ${isUrgent ? '#fda4af' : '#a7f3d0'}`,
              borderRadius: '8px',
              padding: '8px 12px',
              minWidth: '54px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: isUrgent ? '#be123c' : '#166534',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1
              }}>
                {pad(timeLeft.days)}
              </span>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b', marginTop: '4px', textTransform: 'uppercase' }}>
                Days
              </span>
            </div>

            <span style={{ fontWeight: 700, color: isUrgent ? '#be123c' : '#166534', fontSize: '1rem' }}>:</span>

            {/* Hours Box */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: '#ffffff',
              border: `1px solid ${isUrgent ? '#fda4af' : '#a7f3d0'}`,
              borderRadius: '8px',
              padding: '8px 12px',
              minWidth: '54px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: isUrgent ? '#be123c' : '#166534',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1
              }}>
                {pad(timeLeft.hours)}
              </span>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b', marginTop: '4px', textTransform: 'uppercase' }}>
                Hours
              </span>
            </div>

            <span style={{ fontWeight: 700, color: isUrgent ? '#be123c' : '#166534', fontSize: '1rem' }}>:</span>

            {/* Mins Box */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: '#ffffff',
              border: `1px solid ${isUrgent ? '#fda4af' : '#a7f3d0'}`,
              borderRadius: '8px',
              padding: '8px 12px',
              minWidth: '54px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: isUrgent ? '#be123c' : '#166534',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1
              }}>
                {pad(timeLeft.minutes)}
              </span>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b', marginTop: '4px', textTransform: 'uppercase' }}>
                Mins
              </span>
            </div>

            <span style={{ fontWeight: 700, color: isUrgent ? '#be123c' : '#166534', fontSize: '1rem' }}>:</span>

            {/* Secs Box */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: isUrgent ? '#fff1f2' : '#f0fdf4',
              border: `1px solid ${isUrgent ? '#e11d48' : '#16a34a'}`,
              borderRadius: '8px',
              padding: '8px 12px',
              minWidth: '54px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: isUrgent ? '#e11d48' : '#16a34a',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1
              }}>
                {pad(timeLeft.seconds)}
              </span>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: isUrgent ? '#e11d48' : '#16a34a', marginTop: '4px', textTransform: 'uppercase' }}>
                Secs
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
