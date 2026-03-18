// Desktop table row view for a single stand
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

function FillBar({ fill }) {
  const color = fill >= 90 ? '#ef4444' : fill >= 70 ? '#f59e0b' : '#22c55e'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,.07)', minWidth:56, maxWidth:80 }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width:`${fill}%`, background:color }} />
      </div>
      <span className="text-[11px] tabular-nums w-8 text-right" style={{ color:'#454545' }}>{fill}%</span>
    </div>
  )
}

export default function StandRow({ stand, index }) {
  const isAvail  = stand.status === 'AVAILABLE'
  const sColor   = isAvail ? '#22c55e' : '#ef4444'
  const hasCount = stand.available !== null && stand.total !== null
  const disp     = stand.available ?? stand.qty
  const qColor   = scarcityColor(disp, stand.total)

  return (
    <tr className="animate-in group transition-colors"
        style={{ animationDelay:`${index*22}ms`, borderBottom:'1px solid rgba(255,255,255,.04)' }}
        onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.018)'}
        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>

      {/* Stand name */}
      <td className="px-5 py-3.5 align-top">
        <div className="flex items-start gap-2.5">
          <span className="mt-1.5 flex-shrink-0" style={{ width:6, height:6, borderRadius:'50%', background:sColor, boxShadow:isAvail?`0 0 5px ${sColor}88`:'none', display:'inline-block', animation:isAvail?'pulse 2.5s ease-in-out infinite':'none' }} />
          <div>
            <div className="text-[13px] font-medium leading-snug" style={{ color:'#d4d4d4' }}>{stand.name}</div>
            {stand.perks?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {stand.perks.map((p,i) => (
                  <span key={i} className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                        style={{ background:'rgba(99,102,241,.1)', color:'#818cf8', border:'1px solid rgba(99,102,241,.18)' }}>
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3.5 align-top whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded"
              style={{ background:`${sColor}12`, color:sColor, border:`1px solid ${sColor}25` }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background:sColor, display:'inline-block' }} />
          {stand.status}
        </span>
      </td>

      {/* Avail / Total */}
      <td className="px-4 py-3.5 align-top">
        {stand.countLoading
          ? <div className="shimmer h-4 w-20 rounded" />
          : hasCount
            ? <div className="flex items-baseline gap-1">
                <span className="text-base font-bold tabular-nums" style={{ color:qColor }}>{stand.available.toLocaleString()}</span>
                <span className="text-[11px]" style={{ color:'#333' }}>/</span>
                <span className="text-[12px] tabular-nums" style={{ color:'#333' }}>{stand.total.toLocaleString()}</span>
              </div>
            : <span className="text-base font-bold tabular-nums" style={{ color:qColor }}>{disp.toLocaleString()}</span>
        }
      </td>

      {/* Fill */}
      <td className="px-4 py-3.5 align-top" style={{ minWidth:110 }}>
        {stand.countLoading
          ? <div className="shimmer h-3 w-24 rounded" />
          : stand.fill !== null
            ? <FillBar fill={stand.fill} />
            : <span style={{ color:'#2a2a2a', fontSize:11 }}>—</span>
        }
      </td>

      {/* Price */}
      <td className="px-4 py-3.5 align-top whitespace-nowrap">
        <span className="text-[13px] font-semibold tabular-nums" style={{ color:'#525252' }}>
          ₹{stand.price.toLocaleString('en-IN')}
        </span>
      </td>

      {/* Type */}
      <td className="px-4 py-3.5 align-top">
        <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ background:'rgba(255,255,255,.03)', color:'#383838', border:'1px solid rgba(255,255,255,.05)' }}>
          {stand.type}
        </span>
      </td>
    </tr>
  )
}
