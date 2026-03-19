// District (district.in) API — mirrors the console script logic

const BUYABLE = new Set(["available", "on_sale", "sale_started", "open", "forsale"])

function isBuyable(item) {
  return item && BUYABLE.has((item.item_state || item.state || "").toLowerCase().trim())
}

function getBasePrice(item) {
  if (!item) return 0
  return item.base_price ?? item.price ?? item.discounted_price ?? item.original_price ?? 0
}

export function extractSlug(url) {
  const m = String(url || "").match(/\/events\/([^?&#]+)/)
  return m ? m[1].replace(/-buy-tickets$/, "") : null
}

function parseCookiesStr(cookieStr) {
  return (cookieStr || "").split(";").reduce((acc, raw) => {
    const eq = raw.indexOf("=")
    if (eq < 0) return acc
    acc[raw.slice(0, eq).trim()] = raw.slice(eq + 1).trim()
    return acc
  }, {})
}

function buildDistrictHeaders(cookieStr, eventLink) {
  const cookies = parseCookiesStr(cookieStr)
  let cityId = 7, cityName = "Chennai", pCityName = "Chennai", deviceId = cookies["x-device-id"] || ""

  try {
    const loc = cookies["location"] ? JSON.parse(decodeURIComponent(cookies["location"])) : null
    if (loc) { cityId = loc.cityId || cityId; cityName = loc.cityName || cityName; pCityName = loc.pCityName || pCityName }
  } catch {}

  return {
    accept: "*/*",
    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
    platform: "district_web",
    referer: eventLink || "https://www.district.in",
    "sec-ch-ua": '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent": navigator.userAgent,
    "x-app-type": "ed_web",
    "x-cart-version": "V_1",
    "x-city-id": String(cityId),
    "x-city-name": cityName,
    "x-country-id": "1",
    "x-device-id": deviceId,
    "x-event-country-id": "1",
    "x-event-state-config": "true",
    "x-pcity-name": pCityName,
    "x-screen-type": "mobileweb",
  }
}

async function apiFetch(url, headers, cookieStr) {
  if (import.meta.env.DEV) {
    return fetch(url, { headers, credentials: 'include' })
  }
  return fetch('/api/proxy', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url, headers, cookieStr }),
  })
}

export async function fetchDistrictEventStands(eventLink, cookieStr) {
  const slug = extractSlug(eventLink)
  if (!slug) throw new Error(`Could not extract slug from URL: ${eventLink}`)

  const url = `https://www.district.in/gw/consumer/events/v1/event/getBySlug/${slug}?tagSummaryView=true`
  const res = await apiFetch(url, buildDistrictHeaders(cookieStr, eventLink), cookieStr)

  if (!res.ok) throw new Error(`District API error: ${res.status} ${res.statusText}`)
  const json = await res.json()
  if (!json.data) throw new Error("No data in District response")

  return normalizeDistrictResponse(json)
}

export function normalizeDistrictResponse(json) {
  const event = json.data
  const shows = event.all_shows || event.all_show_details || []
  const show = shows[0] || {}

  // Date / time from show
  let showDate = "", showTime = ""
  if (show.start_utc_timestamp) {
    const d = new Date(show.start_utc_timestamp)
    showDate = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
    showTime = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  } else if (show.date_string) {
    showDate = show.date_string
  }

  // Venue
  const venue = show.venue || {}
  const venueName = venue.name || venue.location_name || ""
  const location = venue.city || venue.address_city || ""

  // Banner — district uses several possible fields
  const bannerUrl = event.cover_image || event.event_image || event.banner_image
    || event.horizontal_cover_image || event.poster_image || ""

  // Queue info
  const qc = event.queue_configuration || {}
  const isQueueActive = !!qc.is_active

  // Items for sale
  const itemsForSale = event.items_for_sale || []
  const groups = itemsForSale.filter(
    g => g.item_group_type === "seats" || g.item_group_type === "ticket"
  )

  const stands = groups.map(g => {
    const items = g.items || []
    const availItem = items.find(isBuyable)
    const anyItem = items[0]

    const qty = availItem?.quantity_available_for_purchase ?? 0
    const price = getBasePrice(availItem || anyItem)
    const maxPerUser = availItem?.max_purchase_per_user ?? null
    const phases = items.filter(isBuyable).map(i => i.name).filter(Boolean)

    const isAvail = g.is_available !== false && !!availItem && qty > 0

    return {
      id: g._id || g.id || g.name,
      name: g.name || "Unknown",
      type: g.item_group_type === "seats" ? "SEATS" : "GENERAL",
      status: isAvail ? "AVAILABLE" : "SOLD OUT",
      qty: isAvail ? qty : 0,
      price,
      maxPerUser,
      perks: phases.length > 1 ? phases.slice(0, 3) : [],  // show phase names as chips if multiple
      seatsIoId: g.seats_io_id || null,
    }
  })

  // Aggregate stats
  const prices = stands.filter(s => s.price > 0).map(s => s.price)
  const priceMin = prices.length ? Math.min(...prices) : null
  const priceMax = prices.length ? Math.max(...prices) : null
  const available = stands.filter(s => s.status === "AVAILABLE").reduce((n, s) => n + s.qty, 0)
  const soldOut = stands.filter(s => s.qty === 0).length
  const activeStands = stands.filter(s => s.qty > 0).length

  // Queue timing
  let saleStart = null
  const sales = event.sales || []
  if (sales.length) {
    const now = Date.now()
    const upcoming = sales
      .filter(s => s.start_utc_timestamp)
      .map(s => ({ start: new Date(s.start_utc_timestamp).getTime(), end: s.end_utc_timestamp ? new Date(s.end_utc_timestamp).getTime() : Infinity }))
      .filter(({ start, end }) => start > now || (start <= now && now < end))
      .sort((a, b) => a.start - b.start)[0]
    if (upcoming) saleStart = upcoming.start
  }

  return {
    eventName: event.name || slug,
    venueName,
    location,
    showDate,
    showTime,
    bannerUrl,
    priceMin,
    priceMax,
    currencySymbol: "₹",
    available,
    totalStands: stands.length,
    soldOut,
    activeStands,
    stands,
    isQueueActive,
    saleStart,
    canonicalUrl: `https://www.district.in/events/${event.slug || ""}`,
  }
}
