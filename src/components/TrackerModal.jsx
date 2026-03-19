import React, { useState, useMemo, useRef, useEffect } from 'react'
import { X, Search, RefreshCw, Loader2, Bell } from 'lucide-react'

const PM = {
  bms:      { label: 'BMS',      color: '#e50914' },
  district: { label: 'District', color: '#6366f1' },
}

function remainPct(available, total) {
  if (available == null || total == null || total === 0) return null
  return Math.round((available / total) * 100)
}
function barColor(pct) {
  if (pct == null) return '#22c55e'
  if (pct < 20) return '#ef4444'
  if (pct < 40) return '#f59e0b'
  return '#22c55e'
}
function qtyColor(avail, total) {
  const pct = remainPct(avail, total)
  if (pct !== null) return barColor(pct)
  if (!avail) return '#ef4444'
  if (avail <= 5) return '#ef4444'
  if (avail <= 20) return '#f59e0b'
  return '#22c55e'
}

/* ── Stand row (with delta + newly-available highlight) ── */
function StandRow({ stand, index, highlight }) {
  const isAvail = stand.status === 'AVAILABLE'
  const sColor  = isAvail ? '#22c55e' : '#ef4444'
  const hasCt   = stand.available !== null && stand.total !== null
  const qty     = hasCt ? stand.available : (stand.qty ?? 0)
  const rPct    = hasCt ? remainPct(stand.available, stand.total) : null
  const qColor  = qtyColor(qty, stand.total)
  const diff    = highlight?.diff ?? 0
  const isNew   = highlight?.isNew ?? false

  return (
    <tr
      className="animate-in"
      style={{
        animationDelay: `${index * 16}ms`,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        transition: 'background 0.15s',
        background: isNew ? 'rgba(34,197,94,0.05)' : 'transparent',
      }}
      onMouseEnter={e => e.currentTarget.style.background = isNew ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)'}
      onMouseLeave={e => e.currentTarget.style.background = isNew ? 'rgba(34,197,94,0.05)' : 'transparent'}
    >
      {/* Stand name + type + NEW badge */}
      <td style={{ padding: '13px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#d0d0e0', lineHeight: 1.3 }}>{stand.name}</span>
          {isNew && (
            <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '2px 6px', borderRadius: 4, background: 'rgba(34,197,94,0.2)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.35)', flexShrink: 0, animation: 'pulse 1.5s ease-in-out 3' }}>
              NEW
            </span>
          )}
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#252548', marginTop: 3 }}>
          {stand.type}{stand.price ? ` · ₹${stand.price.toLocaleString('en-IN')}` : ''}
        </div>
      </td>

      {/* Status */}
      <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 11, fontWeight: 700, padding: '5px 11px', borderRadius: 6,
          background: `${sColor}15`, color: sColor, border: `1px solid ${sColor}30`,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: sColor, display: 'inline-block', animation: isAvail ? 'pulse 2.5s ease-in-out infinite' : 'none' }} />
          {stand.status}
        </span>
      </td>

      {/* QTY + delta badge */}
      <td style={{ padding: '13px 16px' }}>
        {stand.countLoading
          ? <div className="shimmer" style={{ height: 22, width: 60, borderRadius: 4 }} />
          : <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: qColor, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                {qty.toLocaleString()}
              </span>
              {hasCt && (
                <span style={{ fontSize: 11, color: '#2a2a45', fontVariantNumeric: 'tabular-nums' }}>
                  / {stand.total.toLocaleString()}
                </span>
              )}
              {diff !== 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: diff > 0 ? '#22c55e' : '#ef4444', animation: 'countUp 0.4s ease forwards' }}>
                  {diff > 0 ? `+${diff}` : diff}
                </span>
              )}
            </div>
        }
      </td>

      {/* Fill bar */}
      <td style={{ padding: '13px 20px 13px 0', minWidth: 150 }}>
        {stand.countLoading
          ? <div className="shimmer" style={{ height: 3, width: 100, borderRadius: 2 }} />
          : rPct !== null
            ? <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${rPct}%`, background: barColor(rPct), borderRadius: 2, transition: 'width 0.6s ease' }} />
                </div>
                <span style={{ fontSize: 11, color: '#2e2e50', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', minWidth: 38, textAlign: 'right' }}>
                  {rPct}%
                </span>
              </div>
            : <span style={{ fontSize: 11, color: '#1e1e35' }}>—</span>
        }
      </td>
    </tr>
  )
}

/* ── Main modal ── */
export default function TrackerModal({
  data, loading, error, lastUpdated,
  onRefresh, onClose,
  platform, autoRefresh, intervalSec, isDemo,
}) {
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('All')
  const [sortBy,   setSortBy]   = useState('default')
  const [notifOn,  setNotifOn]  = useState(false)
  const [highlights, setHighlights] = useState({})
  const prevSnapRef = useRef(null)
  const clearTimerRef = useRef(null)

  const pm = PM[platform] || PM.bms

  /* Check notification permission on mount */
  useEffect(() => {
    if ('Notification' in window) setNotifOn(Notification.permission === 'granted')
  }, [])

  /* Delta tracking — fires when all counts finish loading */
  useEffect(() => {
    if (!data) return
    if (data.stands.some(s => s.countLoading)) return // wait for all counts

    if (prevSnapRef.current) {
      const newH = {}
      const newlyAvailNames = []
      data.stands.forEach(curr => {
        const prev = prevSnapRef.current[curr.id]
        if (!prev) return
        const isNew = prev.status !== 'AVAILABLE' && curr.status === 'AVAILABLE'
        const diff  = (curr.available ?? curr.qty ?? 0) - prev.qty
        if (isNew || diff !== 0) newH[curr.id] = { isNew, diff: diff !== 0 ? diff : 0 }
        if (isNew) newlyAvailNames.push(curr.name)
      })

      if (Object.keys(newH).length > 0) {
        setHighlights(newH)
        clearTimerRef.current = setTimeout(() => setHighlights({}), 10_000)

        /* Browser notification */
        if (newlyAvailNames.length && notifOn && 'Notification' in window) {
          const body = newlyAvailNames.slice(0, 2).join(', ') + (newlyAvailNames.length > 2 ? ` +${newlyAvailNames.length - 2} more` : '')
          try { new Notification('Seats Now Available!', { body }) } catch {}
        }
      }
    }

    /* Save snapshot */
    const snap = {}
    data.stands.forEach(s => { snap[s.id] = { status: s.status, qty: s.available ?? s.qty ?? 0 } })
    prevSnapRef.current = snap

    return () => clearTimeout(clearTimerRef.current)
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleNotif = async () => {
    if (!('Notification' in window)) return
    if (Notification.permission === 'granted') { setNotifOn(v => !v); return }
    if (Notification.permission !== 'denied') {
      const p = await Notification.requestPermission()
      if (p === 'granted') setNotifOn(true)
    }
  }

  /* Aggregated stats */
  const stats = useMemo(() => {
    if (!data) return { totalAvail: 0, totalCap: 0, loadingCt: 0, remPct: null, activeCt: 0, soldCt: 0, allLoading: false }
    let avail = 0, cap = 0, lc = 0, active = 0, sold = 0
    for (const s of data.stands) {
      s.status === 'AVAILABLE' ? active++ : sold++
      if (s.countLoading) { lc++; continue }
      if (s.available !== null && s.total !== null) { avail += s.available; cap += s.total }
      else avail += (s.qty ?? 0)
    }
    return {
      totalAvail: avail, totalCap: cap, loadingCt: lc,
      remPct: cap > 0 ? Math.round((avail / cap) * 100) : null,
      activeCt: active, soldCt: sold,
      allLoading: lc === data.stands.length,
    }
  }, [data])

  /* Filtered + sorted stands */
  const filtered = useMemo(() => {
    if (!data?.stands) return []
    let list = data.stands.filter(s => {
      const ms = s.name.toLowerCase().includes(search.toLowerCase())
      const mf = filter === 'All'
        || (filter === 'Available' && s.status === 'AVAILABLE')
        || (filter === 'Sold Out'  && s.status !== 'AVAILABLE')
      return ms && mf
    })
    if (sortBy === 'price')      list = [...list].sort((a, b) => a.price - b.price)
    if (sortBy === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    if (sortBy === 'qty')        list = [...list].sort((a, b) => (b.available ?? b.qty ?? 0) - (a.available ?? a.qty ?? 0))
    if (sortBy === 'name')       list = [...list].sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [data, search, filter, sortBy])

  const overallAvail = (data?.available ?? 0) > 0

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div className="animate-modal" style={{
        width: '100%', maxWidth: 820, maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
        background: '#111118', borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 32px 96px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.07)',
      }}>

        {/* ══ HERO BANNER ══ */}
        <div style={{ position: 'relative', height: 170, flexShrink: 0, overflow: 'hidden' }}>
          {data?.bannerUrl
            ? <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${data.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center 25%' }} />
            : <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#0d0d20,#1a1a35)' }} />
          }
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right,rgba(8,8,20,0.92) 0%,rgba(8,8,20,0.55) 60%,rgba(8,8,20,0.15) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to top,#111118,transparent)' }} />

          {/* Top-right buttons */}
          <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 3, display: 'flex', gap: 6 }}>
            {'Notification' in window && (
              <button onClick={toggleNotif} title={notifOn ? 'Notifications on — click to mute' : 'Enable seat-available notifications'} style={{
                width: 28, height: 28, borderRadius: 7, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: notifOn ? 'rgba(34,197,94,0.2)' : 'rgba(0,0,0,0.55)',
                border: `1px solid ${notifOn ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.14)'}`,
                color: notifOn ? '#22c55e' : '#666',
              }}>
                <Bell size={12} />
              </button>
            )}
            <button onClick={onClose} style={{
              width: 28, height: 28, borderRadius: 7, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.14)', color: '#888',
            }}>
              <X size={13} />
            </button>
          </div>

          {/* Top-left badges */}
          <div style={{ position: 'absolute', top: 14, left: 18, zIndex: 2, display: 'flex', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', padding: '3px 8px', borderRadius: 4, background: pm.color, color: '#fff' }}>
              {pm.label}
            </span>
            {isDemo && <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '3px 8px', borderRadius: 4, background: 'rgba(234,179,8,0.2)', color: '#ca8a04', border: '1px solid rgba(234,179,8,0.3)' }}>Demo</span>}
          </div>

          {/* Event name + meta */}
          <div style={{ position: 'absolute', bottom: 16, left: 18, right: 52, zIndex: 2 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: 6, textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
              {loading && !data ? 'Loading…' : (data?.eventName || '—')}
              {loading && data && <Loader2 size={14} style={{ display: 'inline', marginLeft: 8, color: '#555', animation: 'spin 0.8s linear infinite', verticalAlign: 'middle' }} />}
            </div>
            {data && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.42)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {data.venueName && <span>{data.venueName}</span>}
                {data.venueName && (data.showDate || data.showTime) && <span style={{ opacity: 0.5 }}>·</span>}
                {(data.showDate || data.showTime) && <span>{data.showDate}{data.showDate && data.showTime ? ', ' : ''}{data.showTime}</span>}
              </div>
            )}
          </div>
        </div>

        {/* ══ STATS 3-COL ══ */}
        {(data || (loading && !data)) && (
          <div style={{ flexShrink: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>

            {/* Available */}
            <div style={{ padding: '18px 20px', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#252548', marginBottom: 8 }}>Available</div>
              {(loading && !data) || stats.allLoading
                ? <div className="shimmer" style={{ height: 34, width: 80, borderRadius: 5, marginBottom: 6 }} />
                : <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 34, fontWeight: 900, color: '#22c55e', lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                      {stats.totalAvail.toLocaleString('en-IN')}{stats.loadingCt > 0 ? '+' : ''}
                    </span>
                    {stats.totalCap > 0 && (
                      <span style={{ fontSize: 14, color: '#2a2a45', fontVariantNumeric: 'tabular-nums' }}>
                        / {stats.totalCap.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
              }
              {stats.remPct !== null && <div style={{ fontSize: 11, color: '#1a4a2c' }}>{stats.remPct}% remaining</div>}
              {stats.loadingCt > 0 && (
                <div style={{ fontSize: 11, color: '#2a2a45', display: 'flex', alignItems: 'center', gap: 4, marginTop: stats.allLoading ? 8 : 2 }}>
                  <Loader2 size={10} style={{ animation: 'spin 0.8s linear infinite' }} />
                  counting {stats.loadingCt}{stats.allLoading ? '' : ' more'}…
                </div>
              )}
            </div>

            {/* Active Stands */}
            <div style={{ padding: '18px 20px', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#252548', marginBottom: 8 }}>Active Stands</div>
              {loading && !data
                ? <div className="shimmer" style={{ height: 34, width: 55, borderRadius: 5, marginBottom: 8 }} />
                : <div style={{ fontSize: 34, fontWeight: 900, color: '#f59e0b', lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 6 }}>{stats.activeCt}</div>
              }
              {data && <div style={{ fontSize: 11, color: '#3a2a10' }}>{stats.soldCt} sold out</div>}
            </div>

            {/* Status */}
            <div style={{ padding: '18px 20px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#252548', marginBottom: 8 }}>Status</div>
              {loading && !data
                ? <div className="shimmer" style={{ height: 34, width: 110, borderRadius: 5, marginBottom: 8 }} />
                : <div style={{ fontSize: 20, fontWeight: 900, color: overallAvail ? '#22c55e' : '#ef4444', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 6 }}>
                    {overallAvail ? 'AVAILABLE' : 'SOLD OUT'}
                  </div>
              }
              {autoRefresh && !isDemo && data && <div style={{ fontSize: 11, color: '#1a4a2c' }}>every {intervalSec}s</div>}
            </div>
          </div>
        )}

        {/* ══ CAPACITY BAR ══ */}
        {stats.remPct !== null && (
          <div style={{ flexShrink: 0, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#202040' }}>Capacity Remaining</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#202040', fontVariantNumeric: 'tabular-nums' }}>{stats.remPct}%</span>
            </div>
            <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 2, width: `${stats.remPct}%`, background: barColor(stats.remPct), transition: 'width 0.7s ease' }} />
            </div>
          </div>
        )}

        {/* ══ SEARCH + FILTERS ══ */}
        <div style={{ flexShrink: 0, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 140, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Search size={13} style={{ color: '#333', flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stands…"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#c0c0e0' }} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 15, lineHeight: 1, padding: 0 }}>×</button>}
          </div>

          {['All', 'Available', 'Sold Out'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '8px 14px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
              background: filter === f ? 'rgba(255,255,255,0.11)' : 'transparent',
              border: `1px solid ${filter === f ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}`,
              color: filter === f ? '#e0e0f4' : '#282848', transition: 'all 0.12s',
            }}>{f}</button>
          ))}

          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
            padding: '8px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#282848', cursor: 'pointer', outline: 'none',
          }}>
            <option value="default">Sort: Default</option>
            <option value="price">Price ↑</option>
            <option value="price-desc">Price ↓</option>
            <option value="qty">Seats ↓</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>

        {/* ══ TABLE ══ */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {loading && !data && (
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...Array(7)].map((_, i) => <div key={i} className="shimmer" style={{ height: 54, borderRadius: 8, animationDelay: `${i * 55}ms` }} />)}
            </div>
          )}

          {error && <div style={{ margin: '16px 20px', padding: '12px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13 }}>{error}</div>}

          {data && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Stand', 'Status', 'QTY', 'Fill'].map((h, i) => (
                    <th key={h} style={{
                      padding: `10px ${i === 0 ? '20px' : '16px'}`, textAlign: 'left',
                      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                      color: '#1e1e3a', position: 'sticky', top: 0, background: '#111118', zIndex: 1,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={4} style={{ padding: '60px 20px', textAlign: 'center', color: '#252540', fontSize: 13 }}>No stands match your filter</td></tr>
                  : filtered.map((s, i) => <StandRow key={s.id} stand={s} index={i} highlight={highlights[s.id]} />)
                }
              </tbody>
            </table>
          )}
        </div>

        {/* ══ FOOTER ══ */}
        <div style={{
          flexShrink: 0, padding: '10px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0d0d16',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 11, color: '#18182e' }}>
            {isDemo ? 'demo mode — no live data' : data && `${filtered.length} / ${data.stands.length} stands`}
          </span>
          <button onClick={onRefresh} disabled={loading} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px', borderRadius: 7,
            fontSize: 12, fontWeight: 700,
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.13)',
            color: loading ? '#252545' : '#b0b0d0', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.55 : 1,
          }}>
            <RefreshCw size={11} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

      </div>
    </div>
  )
}
