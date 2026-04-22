// src/hooks/useApi.js
import { useState, useEffect, useCallback } from 'react'

/**
 * Generic hook for API calls with loading, error and data state.
 * Usage:
 *   const { data, loading, error, refetch } = useApi(() => dashboardApi.getSummary())
 */
export function useApi(fetcher, deps = []) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, deps) // eslint-disable-line

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}

/**
 * Same as useApi but does NOT auto-fetch — call `execute(args)` manually.
 */
export function useLazyApi(fetcher) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher(...args)
      setData(result)
      return result
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [fetcher])

  return { data, loading, error, execute }
}
