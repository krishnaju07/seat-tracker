import React, { useState } from 'react'
import { RefreshCw, ChevronRight, ShieldCheck } from 'lucide-react'
import { BMS_DEMO, DISTRICT_DEMO } from '../utils/demoData'
import { isExtension } from '../utils/extensionCookies'

export default function ConfigPanel({ onStart }) {
  const [platform,   setPlatform]   = useState('bms')
  const [eventId,    setEventId]    = useState('')
  const [eventLink,  setEventLink]  = useState('')
  const [cookieStr,  setCookieStr]  = useState('')
  const [auto,       setAuto]       = useState(true)
  const [secs,       setSecs]       = useState(10)

  const ext = isExtension()

  const submit = e => {
    e.preventDefault()
    onStart({ platform, eventId, eventLink, cookieStr, autoRefresh: auto, interval: secs * 1000, intervalSec: secs })
  }

  const demo = () => {
    const d = platform === 'bms' ? BMS_DEMO : DISTRICT_DEMO
    onStart({ platform, eventId: 'demo', eventLink: 'demo', cookieStr: '', autoRefresh: false, intervalSec: secs, _demoData: d })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>

      {/* Subtle top glow */}
      <div style={{ position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 16, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', marginBottom: 20 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#f5f5f5', letterSpacing: '-0.03em', marginBottom: 6 }}>Seat Tracker</div>
          <div style={{ fontSize: 13, color: '#383860', fontWeight: 500 }}>Real-time availability monitoring</div>
        </div>

        {/* Card */}
        <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28 }}>

          <form onSubmit={submit}>

            {/* Platform tabs */}
            <div style={{ marginBottom: 24 }}>
              <Label>Platform</Label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                {[
                  { v: 'bms',      label: 'BookMyShow', color: '#e50914' },
                  { v: 'district', label: 'District',   color: '#6366f1' },
                ].map(p => {
                  const active = platform === p.v
                  return (
                    <button key={p.v} type="button" onClick={() => setPlatform(p.v)}
                      style={{ padding: '11px 0', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `1px solid ${active ? p.color + '55' : 'rgba(255,255,255,0.07)'}`, background: active ? p.color + '12' : 'transparent', color: active ? p.color : '#383858', transition: 'all 0.15s' }}>
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* BMS */}
            {platform === 'bms' && (
              <Field label="Event ID" hint="e.g. ET00491227 — from the BMS event URL">
                <input value={eventId} onChange={e => setEventId(e.target.value)} placeholder="ET00491227" required style={inputStyle} onFocus={e => e.target.style.borderColor = 'rgba(229,9,20,0.4)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
              </Field>
            )}

            {/* District */}
            {platform === 'district' && (
              <Field label="Event URL" hint="Full district.in event link">
                <input value={eventLink} onChange={e => setEventLink(e.target.value)} placeholder="https://www.district.in/events/event-buy-tickets" required style={inputStyle} onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.4)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
              </Field>
            )}

            {/* Cookie input / status */}
            {ext ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', marginBottom: 18 }}>
                <ShieldCheck size={14} color="#4ade80" />
                <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 500 }}>Cookies auto-detected from browser</span>
              </div>
            ) : (
              <Field label="Cookies" hint="Paste your BMS cookie string from browser DevTools → Network → any BMS request → Cookie header">
                <textarea
                  value={cookieStr}
                  onChange={e => setCookieStr(e.target.value)}
                  placeholder="Paste cookie string here…"
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', fontSize: 11, fontFamily: 'monospace', lineHeight: 1.5 }}
                  onFocus={e => e.target.style.borderColor = platform === 'bms' ? 'rgba(229,9,20,0.4)' : 'rgba(99,102,241,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
              </Field>
            )}

            {/* Auto refresh */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 20 }}>
              <button type="button" onClick={() => setAuto(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <Toggle on={auto} />
                <span style={{ fontSize: 13, fontWeight: 500, color: auto ? '#a0a0c0' : '#2e2e48', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RefreshCw size={13} />
                  Auto Refresh
                </span>
              </button>
              {auto && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#252535' }}>every</span>
                  <input type="number" min={5} max={120} value={secs} onChange={e => setSecs(Number(e.target.value))}
                    style={{ width: 48, textAlign: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '5px 0', color: '#c0c0e0', fontSize: 13, fontWeight: 600, outline: 'none' }} />
                  <span style={{ fontSize: 12, color: '#252535' }}>sec</span>
                </div>
              )}
            </div>

            {/* Submit */}
            <button type="submit"
              style={{ width: '100%', padding: '13px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#fff', background: platform === 'bms' ? 'linear-gradient(135deg, #e50914, #ff4444)' : 'linear-gradient(135deg, #6366f1, #818cf8)', boxShadow: platform === 'bms' ? '0 4px 24px rgba(229,9,20,0.3)' : '0 4px 24px rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'opacity 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              Start Tracking <ChevronRight size={16} />
            </button>

          </form>
        </div>

        {/* Demo */}
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button onClick={demo} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#252540', textDecoration: 'underline', textUnderlineOffset: 3, transition: 'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = '#5555a0'} onMouseLeave={e => e.currentTarget.style.color = '#252540'}>
            Preview demo — {platform === 'bms' ? 'KKR vs PBKS IPL 2026' : 'SRH Fan Meet'}
          </button>
        </div>

      </div>
    </div>
  )
}

const inputStyle = {
  display: 'block', width: '100%', padding: '11px 14px', borderRadius: 10, fontSize: 13, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#d0d0e8', outline: 'none', transition: 'border-color 0.15s',
}

function Label({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#2a2a45', marginBottom: 0 }}>{children}</div>
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <Label>{label}</Label>
      <div style={{ marginTop: 10 }}>{children}</div>
      {hint && <div style={{ fontSize: 11, color: '#1e1e35', marginTop: 6 }}>{hint}</div>}
    </div>
  )
}

function Toggle({ on }) {
  return (
    <div style={{ width: 36, height: 20, borderRadius: 10, background: on ? '#6366f1' : '#151525', border: `1px solid ${on ? '#6366f1' : '#202030'}`, position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 2, left: on ? 17 : 2, width: 14, height: 14, borderRadius: '50%', background: on ? '#fff' : '#2e2e48', transition: 'left 0.2s' }} />
    </div>
  )
}
