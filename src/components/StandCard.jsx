// Mobile card view for a single stand
import React from 'react'

function scarcityColor(available, total) {
  if (!available) return '#ef4444'
  if (total) {
    const r = available / total
    if (r < 0.1) return '#ef4444'
    if (r < 0.3) return '#f59e0b'
  } else {
    if (available <= 5)  return '#ef4444'
    if (available <= 20) return '#f59e0b'
  }
  return '#22c55e'
}

export default function StandCard({ stand, index }) {
  const isAvail = stand.status === 'AVAILABLE'
  const sColor  = isAvail ? '#22c55e' : '#ef4444'
  const hasCount= stand.available !== null && stand.total !== null
  const disp    = stand.available ?? stand.qty
  const qColor  = scarcityColor(disp, stand.total)

  return (
    <div className="animate-in rounded-xl p-4 flex flex-col gap-3"
         style={{ animationDelay:`${index*30}ms`, background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.06)' }}>

      {/* Top row: name + price */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="mt-1.5 flex-shrink-0" style={{ width:6, height:6, borderRadius:'50%', background:sColor, boxShadow:isAvail?`0 0 6px ${sColor}88`:'none', display:'inline-block', animation:isAvail?'pulse 2.5s ease-in-out infinite':'none' }} />
          <span className="text-sm font-medium text-neutral-200 leading-snug">{stand.name}</span>
        </div>
        <span className="text-sm font-semibold text-neutral-400 flex-shrink-0">₹{stand.price.toLocaleString('en-IN')}</span>
      </div>

      {/* Count + fill */}
      <div className="flex items-center gap-3">
        {stand.countLoading ? (
          <div className="shimmer rounded h-4 w-24" />
        ) : hasCount ? (
          <>
            <span className="text-xl font-bold tabular-nums" style={{ color:qColor }}>{stand.available.toLocaleString()}</span>
            <span className="text-xs text-neutral-700">/ {stand.total.toLocaleString()}</span>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,.07)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                     style={{ width:`${stand.fill}%`, background: stand.fill>=90?'#ef4444': stand.fill>=70?'#f59e0b':'#22c55e' }} />
              </div>
              <span className="text-[10px] text-neutral-600 tabular-nums w-8 text-right">{stand.fill}%</span>
            </div>
          </>
        ) : (
          <span className="text-xl font-bold tabular-nums" style={{ color:qColor }}>{disp.toLocaleString()}</span>
        )}
      </div>

      {/* Status + type + perks */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
              style={{ background:`${sColor}12`, color:sColor, border:`1px solid ${sColor}25` }}>
          <span style={{ width:4, height:4, borderRadius:'50%', background:sColor, display:'inline-block' }} />
          {stand.status}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
              style={{ background:'rgba(255,255,255,.04)', color:'#3a3a3a', border:'1px solid rgba(255,255,255,.06)' }}>
          {stand.type}
        </span>
        {stand.perks?.map((p,i) => (
          <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded"
                style={{ background:'rgba(99,102,241,.1)', color:'#818cf8', border:'1px solid rgba(99,102,241,.18)' }}>
            {p}
          </span>
        ))}
      </div>
    </div>
  )
}
