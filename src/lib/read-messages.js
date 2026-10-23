// Which inbox messages this browser has opened. The server only stores the messages themselves.
const KEY = 'formula-admin-read-messages'

export function getReadIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) || '[]'))
  } catch {
    return new Set()
  }
}

export function markRead(id) {
  const ids = getReadIds()
  ids.add(id)
  try {
    localStorage.setItem(KEY, JSON.stringify([...ids].slice(-500)))
  } catch {
    // Storage blocked: the message just shows as new again next visit.
  }
  window.dispatchEvent(new Event('formula-read-change'))
}
