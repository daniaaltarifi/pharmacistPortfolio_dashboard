import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth'

export function LoginPage() {
  const { signIn, notice } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) return setError('Enter your email and password.')
    setBusy(true)
    try {
      await signIn(email.trim(), password)
    } catch (err) {
      if (err.status === 401) setError('Email or password is incorrect. Check both and try again.')
      else if (err.status === 429) setError('Too many sign-in attempts. Wait 15 minutes, then try again.')
      else setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const shown = error || notice
  return (
    <div className="grid min-h-full grid-cols-2 max-md:grid-cols-1">
      <div
        className="relative flex flex-col justify-between gap-8 overflow-hidden bg-[#0f1a2e] bg-cover bg-center p-12 text-[#d7e3f2] max-md:min-h-[320px] max-md:p-7"
        style={{
          backgroundImage:
            'linear-gradient(180deg, rgba(8,25,45,.25) 0%, rgba(8,25,45,.55) 45%, rgba(8,25,45,.92) 100%), url(/capsules.png)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-[9px] bg-primary font-display text-[17px] font-bold text-white">F</div>
          <div>
            <b className="block font-display text-[15px] text-white">Dashboard</b>
            <small className="text-xs text-[#a9bdd8]">Portfolio admin</small>
          </div>
        </div>
        <div>
          <h2 className="max-w-[14ch] text-[40px] leading-[1.1] font-semibold text-white max-md:text-3xl">
            Keep the portfolio as current as the practice.
          </h2>
          <p className="mt-3 max-w-[42ch]">Publish news, events, reports and awards to the portfolio without touching code.</p>
        </div>
        <div className="max-w-[360px] rounded-lg border border-white/20 bg-[#08192d]/45 px-3.5 py-3 font-mono text-[13px] leading-[1.8] text-[#6fd0dc] backdrop-blur-sm">
          GMP + RA + Leadership
          <br />→ 14 portfolio sections, one place to edit them
        </div>
      </div>

      <div className="grid place-items-center bg-white p-8 max-sm:px-4">
        <form
          onSubmit={submit}
          noValidate
          className="flex w-full max-w-[380px] flex-col gap-4 rounded-2xl border border-t-[5px] border-panel-line border-t-periwinkle bg-panel p-7 shadow-[0_20px_50px_rgba(27,71,121,.16)]"
        >
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-mute">Admin access only.</p>
          {shown && (
            <div role="alert" className="rounded-lg bg-bad-soft px-3 py-2.5 text-[13px] text-bad">
              {shown}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary py-2.5" disabled={busy}>
            {busy && <LoaderCircle className="size-4 animate-spin" />}
            Sign in
          </button>
          <span className="text-xs text-mute">After 10 failed attempts, sign-in pauses for 15 minutes.</span>
        </form>
      </div>
    </div>
  )
}
