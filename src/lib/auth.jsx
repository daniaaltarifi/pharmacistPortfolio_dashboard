import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as api from './api'

const AuthContext = createContext(null)
const EMAIL_KEY = 'formula-admin-email'

// GET /api/auth/me returns only id and role, so the email from sign-in is kept for display.
function rememberEmail(email) {
  try {
    if (email) localStorage.setItem(EMAIL_KEY, email)
    else localStorage.removeItem(EMAIL_KEY)
  } catch {
    // Storage blocked: the sidebar falls back to "Administrator".
  }
}

function storedEmail() {
  try {
    return localStorage.getItem(EMAIL_KEY)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  // 'checking' while a stored token is verified, then 'signed-in' or 'signed-out'.
  const [status, setStatus] = useState(api.getToken() ? 'checking' : 'signed-out')
  const [user, setUser] = useState(null)
  const [notice, setNotice] = useState('')

  const signOut = useCallback((message = '') => {
    api.setToken(null)
    rememberEmail(null)
    setUser(null)
    setNotice(message)
    setStatus('signed-out')
  }, [])

  useEffect(() => {
    api.setUnauthorizedHandler(() => signOut('Your session has ended. Sign in again to continue.'))
  }, [signOut])

  // Verify a token left over from an earlier visit.
  useEffect(() => {
    if (status !== 'checking') return
    const controller = new AbortController()
    api
      .getMe({ signal: controller.signal })
      .then((me) => {
        if (me.role !== 'admin') return signOut('This account does not have admin access.')
        setUser({ ...me, email: storedEmail() })
        setStatus('signed-in')
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        // Token rejected or server unreachable: back to sign-in, with the reason.
        signOut(err.status === 0 ? err.message : 'Your session has ended. Sign in again to continue.')
      })
    return () => controller.abort()
  }, [status, signOut])

  const signIn = useCallback(async (email, password) => {
    const result = await api.login(email, password)
    if (result.user.role !== 'admin') throw new api.ApiError('This account does not have admin access.', 403)
    api.setToken(result.token)
    rememberEmail(result.user.email)
    setUser(result.user)
    setNotice('')
    setStatus('signed-in')
  }, [])

  // The sign-out button: ends the session on the server too, so a copied token stops working.
  const logout = useCallback(async () => {
    try {
      await api.logout()
      signOut()
    } catch (err) {
      // 401 means the session had already ended; the unauthorized handler has signed out.
      if (err.status === 401) return
      signOut('Signed out on this device. The server could not be reached, so other sessions stay active until they expire.')
    }
  }, [signOut])

  const value = useMemo(
    () => ({ status, user, notice, signIn, signOut, logout }),
    [status, user, notice, signIn, signOut, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
