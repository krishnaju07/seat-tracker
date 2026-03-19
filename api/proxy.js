const ALLOWED = /^https:\/\/(in\.bookmyshow\.com|www\.district\.in)\//

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { url, headers = {}, cookieStr } = req.body || {}

  if (!url || !ALLOWED.test(url)) {
    return res.status(400).json({ error: 'invalid url' })
  }

  const reqHeaders = { ...headers }
  if (cookieStr) reqHeaders['cookie'] = cookieStr

  // Strip browser-only headers that Node fetch doesn't need
  for (const h of ['sec-fetch-dest', 'sec-fetch-mode', 'sec-fetch-site',
                    'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform']) {
    delete reqHeaders[h]
  }

  try {
    const upstream = await fetch(url, { headers: reqHeaders })
    const body = await upstream.text()
    res
      .status(upstream.status)
      .setHeader('content-type', upstream.headers.get('content-type') || 'application/json')
      .send(body)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
