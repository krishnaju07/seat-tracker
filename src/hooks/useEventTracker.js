import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchBmsEventStands, enhanceBmsWithSeatCounts } from '../utils/bmsApi'
import { fetchDistrictEventStands } from '../utils/districtApi'
import { isExtension, getBmsCookieStr, getDistrictCookieStr } from '../utils/extensionCookies'

export function useEventTracker(config) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const intervalRef = useRef(null)
  const abortRef = useRef(false)   // cancel in-flight enhance when a new refresh starts

  const doFetch = useCallback(async () => {
    if (!config) return
    abortRef.current = true   // cancel any pending enhance
    await new Promise(r => setTimeout(r, 0))  // yield
    abortRef.current = false

    setLoading(true)
    setError(null)

    try {
      // Auto-detect cookies in extension context; fall back to manually provided string
      let cookieStr = config.cookieStr || ''
      if (isExtension()) {
        cookieStr = config.platform === 'bms'
          ? await getBmsCookieStr()
          : await getDistrictCookieStr()
      }

      if (config.platform === 'bms') {
        if (!config.eventId) throw new Error('Event ID is required')

        // Phase 1 — fast event info fetch (shows stands immediately)
        const initial = await fetchBmsEventStands(config.eventId, cookieStr)
        setData(initial)
        setLastUpdated(new Date())
        setLoading(false)

        // Phase 2 — exact seat counts via seatLayout, progressive updates
        abortRef.current = false
        await enhanceBmsWithSeatCounts(
          initial,
          cookieStr,
          (standIndex, update) => {
            if (abortRef.current) return
            setData(prev => {
              if (!prev) return prev
              const stands = [...prev.stands]
              stands[standIndex] = { ...stands[standIndex], ...update }
              const available = stands.reduce((s, st) => s + (st.available ?? st.qty), 0)
              const soldOut = stands.filter(st => (st.available ?? st.qty) === 0).length
              const activeStands = stands.filter(st => (st.available ?? st.qty) > 0).length
              return { ...prev, stands, available, soldOut, activeStands }
            })
          }
        )
        setLastUpdated(new Date())

      } else if (config.platform === 'district') {
        if (!config.eventLink) throw new Error('Event link is required')
        const result = await fetchDistrictEventStands(config.eventLink, cookieStr)
        setData(result)
        setLastUpdated(new Date())
        setLoading(false)
      }
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }, [config])

  useEffect(() => { doFetch() }, [doFetch])

  useEffect(() => {
    clearInterval(intervalRef.current)
    if (!config?.autoRefresh) return
    const ms = config.interval || 10000
    intervalRef.current = setInterval(doFetch, ms)
    return () => clearInterval(intervalRef.current)
  }, [doFetch, config?.autoRefresh, config?.interval])

  return { data, error, loading, lastUpdated, refresh: doFetch }
}
