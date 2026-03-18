export function parseCookies(cookieStr) {
  return (cookieStr || '').split('; ').reduce((acc, pair) => {
    const i = pair.indexOf('=')
    if (i === -1) return acc
    acc[pair.slice(0, i)] = decodeURIComponent(pair.slice(i + 1))
    return acc
  }, {})
}

export function parseJSONCookie(cookies, key) {
  try { return cookies[key] ? JSON.parse(cookies[key]) : null } catch { return null }
}

export function normalizeBmsId(raw) {
  return String(raw || '').replace(/^"+|"+$/g, '').trim()
}

function genTraceId() { return crypto.randomUUID().replace(/-/g, '').slice(0, 32) }
function genSpanId() { return crypto.randomUUID().replace(/-/g, '').slice(0, 16) }

export function buildHeaders(cookies, venueCode = '', sessionID = '', eventCode = '', canonicalUrl = '', extraHeaders = {}) {
  const ud = parseJSONCookie(cookies, 'ud') || {}
  const rgn = parseJSONCookie(cookies, 'rgn') || {}
  const userDetails = parseJSONCookie(cookies, 'userDetails') || {}
  const tid = genTraceId(), sid = genSpanId()

  return {
    accept: 'application/json, text/plain, */*',
    'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
    'content-type': 'application/json',
    'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    baggage: `sentry-environment=production,sentry-release=release_4322,sentry-public_key=4d17a59c2597410e714ab31d421148d9,sentry-trace_id=${tid}`,
    'sentry-trace': `${tid}-${sid}-0`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
    origin: 'https://in.bookmyshow.com',
    priority: 'u=1, i',
    contact: ud.MOBILE || '',
    email: (parseJSONCookie(cookies, 'userDetails') || {}).deemedUserEmail || '',
    memberid: ud.MEMBERID || '',
    'x-app-code': 'WEB',
    'x-bms-le-app-code': 'WEB',
    'x-platform': 'WEB',
    'x-platform-code': 'WEB',
    'x-event-code': eventCode,
    'x-access-token': ud.LSID || '',
    'x-lsid': ud.LSID || '',
    'x-member-id': ud.MEMBERID || '',
    'x-mobile': ud.MOBILE || '',
    'x-phone': ud.MOBILE || '',
    'x-deemed-mobile': userDetails.deemedUserMobile || ud.MOBILE || '',
    'x-region-code': rgn.regionCode || '',
    'x-region-slug': rgn.regionNameSlug || '',
    'x-geohash': rgn.GeoHash || '',
    'x-latitude': String(rgn.Lat || ''),
    'x-longitude': String(rgn.Long || ''),
    'x-location-selection': 'manual',
    'x-bms-id': normalizeBmsId(cookies.bmsId),
    'x-segments': 'false',
    'cf-ipcountry': 'IN',
    // Referer: aerial canvas URL matching the script pattern exactly
    ...(venueCode && sessionID ? {
      Referer: canonicalUrl
        ? `${canonicalUrl}/seat-layout/aerialcanvas/${venueCode}/${sessionID}`
        : `https://in.bookmyshow.com/sports/event/${venueCode}/${sessionID}`,
    } : {}),
    ...extraHeaders,
  }
}

/* ─── Event info (fast) ─── */
export async function fetchBmsEventInfo(eventId, cookieStr) {
  const cookies = parseCookies(cookieStr)
  const res = await fetch(
    `https://in.bookmyshow.com/api/le/events/info/${eventId}`,
    {
      headers: buildHeaders(cookies),
      credentials: 'include',
    }
  )
  if (!res.ok) throw new Error(`BMS API error: ${res.status}`)
  const json = await res.json()
  if (!json.data) throw new Error('No data in response')
  return json
}

/* ─── Single stand seat count from seatLayout API ─── */
export async function fetchSeatCount(venueCode, sessionID, areaCatCode, cookies, eventId = '', canonicalUrl = '') {
  const url = `https://in.bookmyshow.com/api/le/seatLayout?venueCode=${venueCode}&sessionID=${sessionID}&category=${areaCatCode}&appCode=WEB&appVersion=0`
  const res = await fetch(url, {
    headers: buildHeaders(cookies, venueCode, sessionID, eventId, canonicalUrl),
    credentials: 'include',
  })
  if (!res.ok) return null
  const json = await res.json()
  if (json.status === 403 || json.status === 401 || json.status === 400) return null
  const seats = Object.values(json.data || {})
  if (!seats.length) return null
  const available = seats.filter(s => s.isAvailable).length
  const total = seats.length
  return { available, total }
}

/* ─── Normalize event info JSON into stand list ─── */
export function normalizeBmsResponse(json, eventId = '') {
  const d = json.data
  const session = d.sessionsInfo?.[0] || {}
  const venueCode = session.venueCode
  const sessionID = session.sessionID

  const bandsRaw = d.eventCards?.[venueCode]?.[session.date]?.[session.time] || {}
  const bandsArr = Object.values(bandsRaw)
  const firstBand = bandsArr[0] || {}

  const priceInfo = d.eventInfo?.price || {}
  const bannerUrl = d.eventInfo?.banner?.desktop?.[0]?.src || ''

  const stands = bandsArr.map(b => ({
    id: b.AreaCatCode || b.PriceCode,
    name: b.PriceDesc || 'Unknown',
    type: b.SeatLayout === 'Y' ? 'SEATS' : 'GENERAL',
    seatLayout: b.SeatLayout,            // 'Y' | 'N'
    price: parseFloat(b.Price) || 0,
    priceCode: b.PriceCode,
    areaCatCode: b.AreaCatCode,
    perks: Array.isArray(b.PriceDescEX) ? b.PriceDescEX.filter(Boolean) : [],
    available: null,
    total: null,
    fill: null,
    countLoading: b.SeatLayout === 'Y',
    status: (b.minAvailableSeats || 0) > 0 ? 'AVAILABLE' : 'SOLD OUT',
    qty: b.minAvailableSeats || 0,
  }))

  const available = stands.reduce((s, st) => s + st.qty, 0)
  const soldOut = stands.filter(st => st.qty === 0).length
  const activeStands = stands.filter(st => st.qty > 0).length
  const prices = stands.map(s => s.price).filter(Boolean)

  return {
    eventName: d.eventInfo?.title || eventId,
    venueName: firstBand.VenueName || '',
    location: firstBand.location || '',
    showDate: firstBand.ShowDateDisplay || '',
    showTime: firstBand.ShowTime || '',
    bannerUrl,
    priceMin: priceInfo.minPrice || (prices.length ? Math.min(...prices) : null),
    priceMax: priceInfo.maxPrice || (prices.length ? Math.max(...prices) : null),
    currencySymbol: priceInfo.currencySymbol || '₹',
    available,
    totalStands: stands.length,
    soldOut,
    activeStands,
    stands,
    venueCode,
    sessionID,
    canonicalUrl: d.seoInfo?.canonicalURL || '',
    eventId,
    bookingLimit: d.eventInfo?.ticketQtyLock?.limit ?? d.eventInfo?.ticketLimit ?? 2,
  }
}

/* ─── Full fetch: event info + seat counts in parallel ─── */
export async function fetchBmsEventStands(eventId, cookieStr) {
  const json = await fetchBmsEventInfo(eventId, cookieStr)
  return normalizeBmsResponse(json, eventId)
}

/**
 * Enhances an already-fetched BMS data object with accurate seat counts.
 * Fetches all SeatLayout='Y' stands in parallel (no delays — fine for monitoring).
 * Calls `onStandUpdate(updatedStand, standIndex)` after each stand's count arrives.
 */
export async function enhanceBmsWithSeatCounts(data, cookieStr, onStandUpdate) {
  const cookies = parseCookies(cookieStr)
  const { venueCode, sessionID } = data

  const seatableIndexes = data.stands
    .map((s, i) => ({ stand: s, i }))
    .filter(({ stand }) => stand.seatLayout === 'Y')

  if (!seatableIndexes.length) return data

  // Fetch all in parallel — each resolves independently
  const fetchPromises = seatableIndexes.map(async ({ stand, i }) => {
    const counts = await fetchSeatCount(venueCode, sessionID, stand.areaCatCode, cookies, data.eventId || '', data.canonicalUrl || '')
    if (!counts) return { i, update: { countLoading: false } }
    const fill = counts.total > 0
      ? Math.round(((counts.total - counts.available) / counts.total) * 100)
      : 0
    const update = {
      available: counts.available,
      total: counts.total,
      fill,
      qty: counts.available,
      countLoading: false,
      status: counts.available > 0 ? 'AVAILABLE' : 'SOLD OUT',
    }
    return { i, update }
  })

  // As each resolves, call onStandUpdate
  const results = await Promise.allSettled(
    fetchPromises.map(p => p.then(r => { onStandUpdate?.(r.i, r.update); return r }))
  )

  // Build final merged data
  const updatedStands = [...data.stands]
  results.forEach(r => {
    if (r.status === 'fulfilled' && r.value) {
      const { i, update } = r.value
      updatedStands[i] = { ...updatedStands[i], ...update }
    }
  })

  const available = updatedStands.reduce((s, st) => s + (st.available ?? st.qty), 0)
  const soldOut = updatedStands.filter(st => (st.available ?? st.qty) === 0).length
  const activeStands = updatedStands.filter(st => (st.available ?? st.qty) > 0).length

  return { ...data, stands: updatedStands, available, soldOut, activeStands }
}
