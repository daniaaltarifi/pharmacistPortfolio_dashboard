import { useEffect, useState } from 'react'
import { getReadIds } from './read-messages'

export function useReadIds() {
  const [ids, setIds] = useState(getReadIds)
  useEffect(() => {
    const update = () => setIds(getReadIds())
    window.addEventListener('formula-read-change', update)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener('formula-read-change', update)
      window.removeEventListener('storage', update)
    }
  }, [])
  return ids
}
