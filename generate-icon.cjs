// Generates public/icon128.png — run with: node generate-icon.js
const zlib = require('zlib')
const fs   = require('fs')

function makeIcon(SIZE) {
  const buf = Buffer.alloc(SIZE * SIZE * 4, 0)
  const S = SIZE / 128  // scale factor

  const set = (x, y, r, g, b, a = 255) => {
    x = Math.round(x); y = Math.round(y)
    if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return
    const i = (y * SIZE + x) * 4
    if (a >= 255) { buf[i]=r; buf[i+1]=g; buf[i+2]=b; buf[i+3]=255; return }
    const sa=a/255, da=buf[i+3]/255, oa=sa+da*(1-sa)
    if (oa<0.001) return
    buf[i]  =((r*sa+buf[i]  *da*(1-sa))/oa)|0
    buf[i+1]=((g*sa+buf[i+1]*da*(1-sa))/oa)|0
    buf[i+2]=((b*sa+buf[i+2]*da*(1-sa))/oa)|0
    buf[i+3]=(oa*255)|0
  }

  const fillCircle = (cx, cy, rad, [r,g,b], a=255) => {
    for (let y=Math.floor(cy-rad-1); y<=cy+rad+1; y++)
      for (let x=Math.floor(cx-rad-1); x<=cx+rad+1; x++) {
        const aa = Math.max(0, Math.min(1, rad+0.5-Math.hypot(x-cx,y-cy)))
        if (aa>0) set(x,y,r,g,b,(a*aa)|0)
      }
  }

  const strokeCircle = (cx, cy, rad, thick, [r,g,b], a=255) => {
    const inner=rad-thick/2, outer=rad+thick/2
    for (let y=Math.floor(cy-outer-1); y<=cy+outer+1; y++)
      for (let x=Math.floor(cx-outer-1); x<=cx+outer+1; x++) {
        const d=Math.hypot(x-cx,y-cy)
        const aa=Math.max(0, Math.min(1, d-inner+0.5, outer-d+0.5))
        if (aa>0) set(x,y,r,g,b,(a*aa)|0)
      }
  }

  const drawLine = (x1,y1,x2,y2,thick,[r,g,b],a=255) => {
    const steps=Math.ceil(Math.hypot(x2-x1,y2-y1))+1
    for (let i=0; i<=steps; i++) {
      const t=i/steps
      fillCircle(x1+(x2-x1)*t, y1+(y2-y1)*t, thick/2, [r,g,b], a)
    }
  }

  const fillRRect = (x,y,w,h,r,[R,G,B]) => {
    for (let py=y; py<y+h; py++)
      for (let px=x; px<x+w; px++) {
        let aa=1
        if      (px<x+r   && py<y+r  ) aa=Math.max(0,Math.min(1,r+0.5-Math.hypot(px-(x+r),   py-(y+r))))
        else if (px>=x+w-r && py<y+r  ) aa=Math.max(0,Math.min(1,r+0.5-Math.hypot(px-(x+w-r), py-(y+r))))
        else if (px<x+r   && py>=y+h-r) aa=Math.max(0,Math.min(1,r+0.5-Math.hypot(px-(x+r),   py-(y+h-r))))
        else if (px>=x+w-r && py>=y+h-r) aa=Math.max(0,Math.min(1,r+0.5-Math.hypot(px-(x+w-r), py-(y+h-r))))
        if (aa>0) set(px,py,R,G,B,(aa*255)|0)
      }
  }

  // ── Draw ──────────────────────────────────────────────────
  const cx=SIZE/2, cy=SIZE/2

  // Background: dark rounded square with subtle blue tint
  fillRRect(0,0,SIZE,SIZE,28*S, [9,9,22])

  // Subtle radial glow behind clock
  for (let y=0;y<SIZE;y++) for (let x=0;x<SIZE;x++) {
    const d=Math.hypot(x-cx,y-cy)/(SIZE*0.45)
    if (d<1) set(x,y, 50,45,120, ((1-d*d)*38)|0)
  }

  // Outer soft halo ring
  strokeCircle(cx,cy, 50*S, 6*S, [80,60,200], 35)

  // Clock face fill
  fillCircle(cx,cy, 46*S, [14,12,36])

  // Clock ring — indigo
  strokeCircle(cx,cy, 44*S, 3.5*S, [99,102,241], 230)
  // Inner accent ring
  strokeCircle(cx,cy, 39*S, 0.8*S, [70,73,180], 80)

  // Tick marks
  for (let i=0;i<12;i++) {
    const angle=(i/12)*Math.PI*2-Math.PI/2
    const major=i%3===0
    const r1=(major?34:37)*S, r2=41*S
    drawLine(
      cx+Math.cos(angle)*r1, cy+Math.sin(angle)*r1,
      cx+Math.cos(angle)*r2, cy+Math.sin(angle)*r2,
      (major?2.2:1.2)*S,
      major?[160,165,255]:[65,65,130],
      major?255:190
    )
  }

  // Hour hand → ~10 o'clock
  const hA = -Math.PI/2 - Math.PI/3
  drawLine(cx,cy, cx+Math.cos(hA)*22*S, cy+Math.sin(hA)*22*S, 3.2*S, [200,205,255], 245)

  // Minute hand → 12 o'clock
  const mA = -Math.PI/2
  drawLine(cx,cy, cx+Math.cos(mA)*31*S, cy+Math.sin(mA)*31*S, 2.4*S, [129,140,248], 245)

  // Second hand accent → ~4 o'clock
  const sA = Math.PI/2 + Math.PI/6
  drawLine(cx,cy, cx+Math.cos(sA)*28*S, cy+Math.sin(sA)*28*S, 1.2*S, [239,68,68], 220)

  // Center cap
  fillCircle(cx,cy, 5*S, [160,165,255])
  fillCircle(cx,cy, 2.5*S, [230,232,255])

  // ── PNG encode ──────────────────────────────────────────────
  const crcTab = (() => {
    const t = new Uint32Array(256)
    for (let n=0;n<256;n++) { let c=n; for(let k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; t[n]=c }
    return t
  })()
  const crc32 = b => { let c=0xFFFFFFFF; for(const x of b) c=crcTab[(c^x)&0xFF]^(c>>>8); return(c^0xFFFFFFFF)>>>0 }
  const chunk = (type,data) => {
    const tb=Buffer.from(type,'ascii'), db=Buffer.isBuffer(data)?data:Buffer.from(data)
    const len=Buffer.allocUnsafe(4); len.writeUInt32BE(db.length)
    const crc=Buffer.allocUnsafe(4); crc.writeUInt32BE(crc32(Buffer.concat([tb,db])))
    return Buffer.concat([len,tb,db,crc])
  }
  const ihdr=Buffer.allocUnsafe(13)
  ihdr.writeUInt32BE(SIZE,0); ihdr.writeUInt32BE(SIZE,4)
  ihdr[8]=8; ihdr[9]=6; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0
  const rows=[]; for(let y=0;y<SIZE;y++){rows.push(Buffer.from([0]));rows.push(buf.subarray(y*SIZE*4,(y+1)*SIZE*4))}
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk('IHDR',ihdr),
    chunk('IDAT',zlib.deflateSync(Buffer.concat(rows))),
    chunk('IEND',Buffer.alloc(0)),
  ])
}

fs.writeFileSync('public/icon16.png',  makeIcon(16))
fs.writeFileSync('public/icon48.png',  makeIcon(48))
fs.writeFileSync('public/icon128.png', makeIcon(128))
console.log('✓ Icons generated: icon16.png, icon48.png, icon128.png')
