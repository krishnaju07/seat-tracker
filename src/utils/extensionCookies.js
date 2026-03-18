// Chrome extension cookie helpers — gracefully degrade outside extension context

export function isExtension() {
  return typeof chrome !== 'undefined' && typeof chrome.cookies?.getAll === 'function'
}

function buildCookieStr(cookies) {
  return cookies.map(c => `${c.name}=${encodeURIComponent(c.value)}`).join('; ')
}

export async function getBmsCookieStr() {
  if (!isExtension()) return ''
  const cookies = await chrome.cookies.getAll({ domain: 'in.bookmyshow.com' })
  return buildCookieStr(cookies)
}

export async function getDistrictCookieStr() {
  if (!isExtension()) return ''
  const cookies = await chrome.cookies.getAll({ domain: 'www.district.in' })
  return buildCookieStr(cookies)
}
