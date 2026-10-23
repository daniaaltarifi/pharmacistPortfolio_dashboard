import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { ExternalLink, LayoutGrid, LoaderCircle, LogOut, Mail, Menu, Search, X } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useSiteData } from '@/lib/site-data'
import { useReadIds } from '@/lib/use-read-ids'
import { GROUPS, SECTIONS, findSection } from '@/lib/sections'
import { SITE_URL, initials } from '@/lib/format'
import { cn } from '@/lib/utils'

function NavItem({ to, icon: Icon, label, count, dot, end, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13.5px] font-medium text-ink transition-colors hover:bg-white/40',
          isActive && 'bg-white/60 font-semibold text-primary shadow-[inset_3px_0_0_#1b4779]',
        )
      }
    >
      <Icon className="size-4 shrink-0 opacity-85" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {dot > 0 && <span className="rounded-full bg-primary px-[7px] text-[11px] font-semibold text-white">{dot}</span>}
      {count != null && !dot && <span className="font-mono text-[11.5px] font-semibold text-white">{count}</span>}
    </NavLink>
  )
}

function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const { lists, messages } = useSiteData()
  const readIds = useReadIds()
  const unread = (messages ?? []).filter((m) => !readIds.has(m.id)).length

  return (
    <div className="bg-brand flex h-full flex-col gap-5 overflow-y-auto px-3.5 py-5">
      <div className="flex items-center gap-2.5 px-2">
        <div className="grid size-9 place-items-center rounded-[9px] bg-primary font-display text-[17px] font-bold text-white">F</div>
        <div>
          <b className="block font-display text-[15px] text-ink">Dashboard</b>
          <small className="text-xs text-ink/80">Portfolio admin</small>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5" aria-label="Dashboard">
        <NavItem to="/" end icon={LayoutGrid} label="Overview" onNavigate={onNavigate} />
        <NavItem to="/messages" icon={Mail} label="Messages" dot={unread} count={messages?.length} onNavigate={onNavigate} />
      </nav>

      {GROUPS.map((group) => (
        <nav key={group} className="flex flex-col gap-0.5" aria-label={group}>
          <h4 className="mb-1.5 px-2.5 text-[11px] font-bold tracking-[.1em] text-ink/85 uppercase">{group}</h4>
          {SECTIONS.filter((s) => s.group === group).map((s) => (
            <NavItem
              key={s.key}
              to={`/s/${s.key}`}
              icon={s.icon}
              label={s.label}
              count={lists[s.key]?.length}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      ))}

      <div className="mt-auto flex items-center gap-2.5 border-t border-primary/20 p-2.5">
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#2a4a75] text-xs font-semibold text-white">
          {user?.email ? initials(user.email.split('@')[0].replace(/[._-]/g, ' ')) : 'A'}
        </div>
        <div className="min-w-0 flex-1">
          <b className="block truncate text-[13px] font-medium text-ink">{user?.email ?? 'Administrator'}</b>
          <small className="text-[11.5px] text-ink/80">Admin</small>
        </div>
        <button
          type="button"
          onClick={() => {
            setSigningOut(true)
            logout()
          }}
          disabled={signingOut}
          className="btn btn-ghost px-2 text-white hover:text-ink"
          aria-label="Sign out on every device"
          title="Sign out on every device"
        >
          {signingOut ? <LoaderCircle className="size-4 animate-spin" /> : <LogOut className="size-4" />}
        </button>
      </div>
    </div>
  )
}

function GlobalSearch() {
  const { lists } = useSiteData()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    const out = []
    for (const s of SECTIONS) {
      for (const item of lists[s.key] ?? []) {
        const title = s.title(item) ?? ''
        const sub = s.subtitle?.(item) ?? ''
        if (`${title} ${sub}`.toLowerCase().includes(q)) out.push({ section: s, item, title })
        if (out.length >= 8) return out
      }
    }
    return out
  }, [query, lists])

  const go = (r) => {
    navigate(`/s/${r.section.key}?edit=${r.item.id}`)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  return (
    <div className="relative ml-auto w-full max-w-[300px] min-w-0 max-sm:max-w-none">
      <label className="flex items-center gap-2 rounded-lg border border-line bg-soft/60 px-2.5 py-1.5 text-mute focus-within:border-primary">
        <Search className="size-[15px] shrink-0" aria-hidden="true" />
        <input
          ref={inputRef}
          id="global-search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results[0]) go(results[0])
            if (e.key === 'Escape') e.currentTarget.blur()
          }}
          placeholder="Search all content"
          className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-mute"
          aria-label="Search all content"
        />
        <kbd className="rounded border border-line px-1.5 font-mono text-[11px] max-sm:hidden">Ctrl K</kbd>
      </label>
      {open && query.trim().length >= 2 && (
        <div className="absolute top-full right-0 left-0 z-40 mt-1.5 overflow-hidden rounded-lg border border-line bg-white shadow-xl">
          {results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-mute">Nothing matches "{query.trim()}".</p>
          ) : (
            results.map((r) => (
              <button
                key={`${r.section.key}-${r.item.id}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(r)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-soft"
              >
                <r.section.icon className="size-4 shrink-0 text-mute" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-sm">{r.title}</span>
                <span className="text-xs text-mute">{r.section.label}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function Breadcrumbs() {
  const { pathname } = useLocation()
  let trail = ['Overview']
  if (pathname.startsWith('/messages')) trail = ['Messages']
  else if (pathname.startsWith('/s/')) {
    const section = findSection(pathname.split('/')[2])
    if (section) trail = [section.group, section.label]
  }
  return (
    <span className="truncate text-[13px] text-mute">
      Admin /{' '}
      {trail.map((t, i) => (
        <span key={t}>
          {i === trail.length - 1 ? <b className="font-medium text-ink">{t}</b> : `${t} / `}
        </span>
      ))}
    </span>
  )
}

export function Layout() {
  const [drawer, setDrawer] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setDrawer(false), [pathname])

  return (
    <div className="grid min-h-full grid-cols-[248px_minmax(0,1fr)] max-lg:grid-cols-[minmax(0,1fr)]">
      <aside className="sticky top-0 h-screen max-lg:hidden">
        <Sidebar />
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close menu" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-[272px] max-w-[85vw] shadow-2xl">
            <Sidebar onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 border-b border-line bg-white px-7 py-3.5 max-sm:px-4">
          <button type="button" className="btn btn-ghost px-2 lg:hidden" onClick={() => setDrawer(true)} aria-label="Open menu">
            {drawer ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <Breadcrumbs />
          <GlobalSearch />
          <a className="btn" href={SITE_URL} target="_blank" rel="noreferrer">
            <ExternalLink className="size-[15px]" />
            <span className="max-sm:hidden">View site</span>
          </a>
        </header>
        <main className="flex min-w-0 flex-col gap-6 p-7 max-sm:px-4 max-sm:py-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function PageHead({ title, description, children }) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="min-w-0">
        <h1 className="text-[26px] font-semibold">{title}</h1>
        {description && <p className="mt-1 text-mute">{description}</p>}
      </div>
      {children && <div className="ml-auto flex flex-wrap gap-2">{children}</div>}
    </div>
  )
}

export function NotFound() {
  return (
    <div className="flex flex-col items-start gap-3">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-mute">This dashboard page does not exist.</p>
      <Link to="/" className="btn btn-primary">
        Back to overview
      </Link>
    </div>
  )
}
