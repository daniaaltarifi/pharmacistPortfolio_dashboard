// In dev, Vite proxies /api to the Express server. In production, set VITE_API_URL to the deployed server origin.
const API_URL = import.meta.env.VITE_API_URL || ''
const TOKEN_KEY = 'formula-admin-token'

let token = readToken()
let onUnauthorized = () => {}

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function getToken() {
  return token
}

export function setToken(value) {
  token = value
  try {
    if (value) localStorage.setItem(TOKEN_KEY, value)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Storage blocked (private mode): the session lasts until the tab closes.
  }
}

// The auth provider registers this so an expired token sends the admin back to sign in.
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

export class ApiError extends Error {
  constructor(message, status, fieldErrors) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors ?? {}
  }
}

export async function request(path, { method = 'GET', body, signal, auth = true } = {}) {
  const isForm = body instanceof FormData
  const headers = {}
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError('Cannot reach the server. Check that it is running and try again.', 0)
  }

  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    if (res.status === 401 && auth && token) onUnauthorized()
    throw new ApiError(data.error || 'Something went wrong. Please try again.', res.status, data.errors)
  }
  return data
}

export async function login(email, password) {
  const { data } = await request('/auth/login', { method: 'POST', body: { email, password }, auth: false })
  return data
}

// Ends every session for this admin on the server, on all devices.
export async function logout() {
  await request('/auth/logout', { method: 'POST' })
}

export async function getMe({ signal } = {}) {
  const { data } = await request('/auth/me', { signal })
  return data
}

export async function getHealth({ signal } = {}) {
  const started = performance.now()
  try {
    const data = await request('/health', { signal, auth: false })
    return { ...data, ms: Math.round(performance.now() - started) }
  } catch (err) {
    if (err.name === 'AbortError') throw err
    return { status: 'error', database: 'unknown', message: err.message }
  }
}

export async function list(path, { signal } = {}) {
  const { data } = await request(path, { signal })
  return data
}

export async function create(path, body) {
  const { data } = await request(path, { method: 'POST', body })
  return data
}

export async function update(path, id, body) {
  const { data } = await request(`${path}/${encodeURIComponent(id)}`, { method: 'PATCH', body })
  return data
}

export async function remove(path, id) {
  await request(`${path}/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// Emails the visitor the fixed thank-you text (server: templates/autoReply.js).
export async function sendAutoReply(messageId) {
  const { data } = await request(`/contact/${encodeURIComponent(messageId)}/reply/auto`, { method: 'POST' })
  return data
}

// Emails the visitor a reply written in the dashboard.
export async function sendCustomReply(messageId, { subject, body }) {
  const { data } = await request(`/contact/${encodeURIComponent(messageId)}/reply`, {
    method: 'POST',
    body: { subject, body },
  })
  return data
}

export async function uploadImage(file) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await request('/uploads/images', { method: 'POST', body: form })
  return data
}
