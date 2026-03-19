import React, { useState } from 'react'
import { RefreshCw, ChevronRight, ShieldCheck, Settings } from 'lucide-react'
import { BMS_DEMO, DISTRICT_DEMO } from '../utils/demoData'
import { isExtension } from '../utils/extensionCookies'

const COOKIE_KEY = 'seat_tracker_cookies'

export default function ConfigPanel({ onStart }) {
  const ext = isExtension()

  const [platform,    setPlatform]    = useState('bms')
  const [eventId,     setEventId]     = useState('')
  const [eventLink,   setEventLink]   = useState('')
  const [cookieStr,   setCookieStr]   = useState(() => localStorage.getItem(COOKIE_KEY) || '')
  const [showCookies, setShowCookies] = useState(false)
  const [auto,        setAuto]        = useState(true)
  const [secs,        setSecs]        = useState(10)

  const hasSavedCookies = !!cookieStr

  const submit = e => {
    e.preventDefault()
    if (!ext && cookieStr) localStorage.setItem(COOKIE_KEY, cookieStr)
    onStart({
      platform,
      eventId,
      eventLink,
      cookieStr: ext ? '' : cookieStr,
      autoRefresh: auto,
      interval: secs * 1000,
      intervalSec: secs,
    })
  }

  const demo = () => {
    const d = platform === 'bms' ? BMS_DEMO : DISTRICT_DEMO
    onStart({ platform, eventId: 'demo', eventLink: 'demo', cookieStr: '', autoRefresh: false, intervalSec: secs, _demoData: d })
  }

  const accentColor = platform === 'bms' ? '#e50914' : '#6366f1'
  const accentGrad  = platform === 'bms' ? 'linear-gradient(135deg,#e50914,#ff4444)' : 'linear-gradient(135deg,#6366f1,#818cf8)'

  return (
    <div style={{ minHeight: '100vh', background: '#080810', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' }}>

      {/* Glow */}
      <div style={{ position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse,rgba(99,102,241,0.12) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 14, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', marginBottom: 16 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#f5f5f5', letterSpacing: '-0.03em', marginBottom: 4 }}>Seat Tracker</div>
          <div style={{ fontSize: 12, color: '#303055', fontWeight: 500 }}>Real-time availability monitoring</div>
        </div>

        {/* Card */}
        <div style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24 }}>
          <form onSubmit={submit}>

            {/* Platform tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
              {[{ v: 'bms', label: 'BookMyShow', color: '#e50914' }, { v: 'district', label: 'District', color: '#6366f1' }].map(p => {
                const active = platform === p.v
                return (
                  <button key={p.v} type="button" onClick={() => setPlatform(p.v)} style={{
                    padding: '10px 0', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    border: `1px solid ${active ? p.color + '55' : 'rgba(255,255,255,0.07)'}`,
                    background: active ? p.color + '12' : 'transparent',
                    color: active ? p.color : '#383858', transition: 'all 0.15s',
                  }}>{p.label}</button>
                )
              })}
            </div>

            {/* Event input */}
            {platform === 'bms' ? (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Event ID</label>
                <input
                  value={eventId} onChange={e => setEventId(e.target.value)}
                  placeholder="ET00491227" required
                  style={{ ...inputStyle, marginTop: 8, fontSize: 15, fontWeight: 600, letterSpacing: '0.02em' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(229,9,20,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
                <div style={{ fontSize: 11, color: '#1e1e38', marginTop: 6 }}>From the BMS event URL — e.g. ET00491227</div>
              </div>
            ) : (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Event URL</label>
                <input
                  value={eventLink} onChange={e => setEventLink(e.target.value)}
                  placeholder="https://www.district.in/events/…" required
                  style={{ ...inputStyle, marginTop: 8 }}
                  onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
              </div>
            )}

            {/* Cookie section — hidden in extension mode */}
            {ext ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 9, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)', marginBottom: 16 }}>
                <ShieldCheck size={13} color="#4ade80" />
                <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 500 }}>Cookies read from your browser automatically</span>
              </div>
            ) : hasSavedCookies && !showCookies ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: 9, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={13} color="#4ade80" />
                  <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 500 }}>Cookies saved</span>
                </div>
                <button type="button" onClick={() => setShowCookies(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#353560', padding: 0 }}>
                  <Settings size={11} /> Update
                </button>
              </div>
            ) : (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Cookies</label>
                <textarea
                  value={cookieStr} onChange={e => setCookieStr(e.target.value)}
                  placeholder="Paste your BMS cookie string here…"
                  rows={3} required={!ext}
                  style={{ ...inputStyle, marginTop: 8, resize: 'vertical', fontSize: 11, fontFamily: 'monospace', lineHeight: 1.5 }}
                  onFocus={e => e.target.style.borderColor = `${accentColor}55`}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
                <div style={{ fontSize: 11, color: '#1e1e38', marginTop: 6 }}>DevTools → Network → any BMS request → Cookie header · Saved automatically</div>
              </div>
            )}

            {/* Auto refresh */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 18 }}>
              <button type="button" onClick={() => setAuto(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <Toggle on={auto} />
                <span style={{ fontSize: 13, fontWeight: 500, color: auto ? '#a0a0c0' : '#2e2e48', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <RefreshCw size={12} /> Auto Refresh
                </span>
              </button>
              {auto && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, color: '#252535' }}>every</span>
                  <input type="number" min={5} max={120} value={secs} onChange={e => setSecs(Number(e.target.value))}
                    style={{ width: 44, textAlign: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '4px 0', color: '#c0c0e0', fontSize: 13, fontWeight: 600, outline: 'none' }} />
                  <span style={{ fontSize: 12, color: '#252535' }}>sec</span>
                </div>
              )}
            </div>

            {/* Submit */}
            <button type="submit" style={{
              width: '100%', padding: '12px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: 700, color: '#fff', background: accentGrad,
              boxShadow: `0 4px 20px ${accentColor}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'opacity 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              Start Tracking <ChevronRight size={15} />
            </button>

          </form>
        </div>

        {/* Demo */}
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button onClick={demo} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#232340', textDecoration: 'underline', textUnderlineOffset: 3, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#5555a0'}
            onMouseLeave={e => e.currentTarget.style.color = '#232340'}>
            Preview demo — {platform === 'bms' ? 'KKR vs PBKS IPL 2026' : 'SRH Fan Meet'}
          </button>
        </div>

      </div>
    </div>
  )
}

const inputStyle = {
  display: 'block', width: '100%', padding: '10px 13px', borderRadius: 9, fontSize: 13,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  color: '#d0d0e8', outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
}

const labelStyle = {
  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#2a2a48',
}

function Toggle({ on }) {
  return (
    <div style={{ width: 34, height: 19, borderRadius: 10, background: on ? '#6366f1' : '#151525', border: `1px solid ${on ? '#6366f1' : '#202030'}`, position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 2, left: on ? 16 : 2, width: 13, height: 13, borderRadius: '50%', background: on ? '#fff' : '#2e2e48', transition: 'left 0.2s' }} />
    </div>
  )
}
