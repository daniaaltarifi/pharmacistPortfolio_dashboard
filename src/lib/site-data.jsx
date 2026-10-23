import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as api from './api'
import { SECTIONS } from './sections'

const SiteDataContext = createContext(null)

// Loads every section once after sign-in so the sidebar counts, overview and search share one copy.
// Section pages push their changes back with `setList` so everything stays in sync.
export function SiteDataProvider({ children }) {
  const [lists, setLists] = useState({})
  const [messages, setMessages] = useState(null)
  const [errors, setErrors] = useState({})

  const load = useCallback(async (signal) => {
    const results = await Promise.allSettled([
      ...SECTIONS.map((s) => api.list(s.path, { signal })),
      api.list('/contact', { signal }),
    ])
    if (signal?.aborted) return
    const nextLists = {}
    const nextErrors = {}
    SECTIONS.forEach((s, i) => {
      const r = results[i]
      if (r.status === 'fulfilled') nextLists[s.key] = r.value
      else nextErrors[s.key] = r.reason.message
    })
    const inbox = results[SECTIONS.length]
    if (inbox.status === 'fulfilled') setMessages(inbox.value)
    else nextErrors.messages = inbox.reason.message
    setLists(nextLists)
    setErrors(nextErrors)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal).catch(() => {})
    return () => controller.abort()
  }, [load])

  const setList = useCallback((key, items) => setLists((prev) => ({ ...prev, [key]: items })), [])

  const value = useMemo(
    () => ({ lists, messages, setMessages, errors, setList, reload: () => load() }),
    [lists, messages, errors, setList, load],
  )
  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>
}

export function useSiteData() {
  return useContext(SiteDataContext)
}
