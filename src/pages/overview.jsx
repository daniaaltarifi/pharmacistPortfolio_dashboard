import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { CalendarDays, Check, CircleAlert, LoaderCircle, Plus } from 'lucide-react'
import * as api from '@/lib/api'
import { SECTIONS, findSection } from '@/lib/sections'
import { useSiteData } from '@/lib/site-data'
import { useReadIds } from '@/lib/use-read-ids'
import { formatAgo, greeting } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PageHead } from '@/components/layout'
import { Avatar } from './messages'

const monthFmt = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })
const dayFmt = new Intl.DateTimeFormat('en-US', { day: '2-digit', timeZone: 'UTC' })
const shortFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', timeZone: 'UTC' })

const utcDate = (ymd) => new Date(`${ymd}T00:00:00Z`)
const todayYmd = () => new Date().toISOString().slice(0, 10)

function Tile({ label, value, children }) {
  return (
    <div className="bg-brand flex flex-col gap-1.5 rounded-xl border border-line p-4 text-ink shadow-[0_8px_22px_rgba(27,71,121,.18)]">
      <span className="text-xs tracking-[.07em] text-muted uppercase">{label}</span>
      {value !== undefined && <span className="font-display text-[30px] leading-[1.1] font-semibold tabular-nums">{value}</span>}
      {children}
    </div>
  )
}

// Articles per month for the last 8 months, drawn to one scale.
function Sparkline({ counts }) {
  const w = 200
  const h = 34
  const top = Math.max(1, ...counts)
  const step = w / (counts.length - 1)
  const pts = counts.map((c, i) => [i * step, h - 3 - (c / top) * (h - 8)])
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const [lx, ly] = pts[pts.length - 1]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-[34px] w-full" role="img" aria-label={`Articles per month: ${counts.join(', ')}`}>
      <line x1="0" y1={h - 1} x2={w} y2={h - 1} stroke="rgba(27,71,121,.2)" strokeWidth="1" />
      <path d={`${line} L${w} ${h} L0 ${h} Z`} fill="rgba(27,71,121,.12)" />
      <path d={line} fill="none" stroke="#1b4779" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <circle cx={lx - 2} cy={ly} r="3" fill="#1b4779" />
    </svg>
  )
}

function Panel({ title, action, children, extra }) {
  return (
    <section className="panel">
      <header className="panel-head">
        <h2 className="text-[15.5px] font-semibold">{title}</h2>
        {extra}
        {action && (
          <Link to={action.to} className="ml-auto text-[12.5px] font-semibold text-white underline underline-offset-[3px]">
            {action.label}
          </Link>
        )}
      </header>
      {children}
    </section>
  )
}

function Status({ ok, warn, label, detail }) {
  return (
    <div className="flex items-center gap-2.5 text-[13.5px]">
      <span className={cn('pill', ok ? 'bg-ok-soft text-ok' : warn ? 'bg-warn-soft text-warn' : 'bg-bad-soft text-bad')}>
        {ok ? <Check className="size-3" /> : <CircleAlert className="size-3" />}
        {label}
      </span>
      <span className="ml-auto truncate font-mono text-xs text-mute">{detail}</span>
    </div>
  )
}

function sessionExpiry() {
  try {
    const { exp } = JSON.parse(atob(api.getToken().split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    const hours = Math.round((exp * 1000 - Date.now()) / 3600000)
    return hours >= 1 ? `expires in ${hours} h` : 'expires within the hour'
  } catch {
    return 'active'
  }
}

export function OverviewPage() {
  const { lists, messages } = useSiteData()
  const readIds = useReadIds()
  const [health, setHealth] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    api.getHealth({ signal: controller.signal }).then(setHealth).catch(() => {})
    return () => controller.abort()
  }, [])

  const loaded = Object.keys(lists).length > 0
  const stats = useMemo(() => {
    const all = SECTIONS.flatMap((s) => lists[s.key] ?? [])
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const addedThisMonth = all.filter((r) => r.createdAt && new Date(r.createdAt) >= monthStart).length

    const today = todayYmd()
    const events = lists.events ?? []
    const upcoming = events.filter((e) => e.eventDate >= today).sort((a, b) => a.eventDate.localeCompare(b.eventDate))
    const past = events.filter((e) => e.eventDate < today).sort((a, b) => b.eventDate.localeCompare(a.eventDate))

    const now = new Date()
    const months = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 7 + i, 1))
      return d.toISOString().slice(0, 7)
    })
    const perMonth = months.map((m) => (lists.news ?? []).filter((n) => n.publishedAt?.startsWith(m)).length)

    const sections = SECTIONS.map((s) => {
      const items = lists[s.key] ?? []
      const latest = items.reduce((max, r) => (r.updatedAt && r.updatedAt > max ? r.updatedAt : max), '')
      return { section: s, count: items.length, latest }
    })

    return { total: all.length, addedThisMonth, upcoming, past, perMonth, months, sections }
  }, [lists])

  const unread = (messages ?? []).filter((m) => !readIds.has(m.id))
  const oldestUnread = unread[unread.length - 1]
  // Up to three upcoming events, then the most recent past ones.
  const timeline = [...stats.upcoming, ...stats.past].slice(0, 3)
  const newsSection = findSection('news')

  return (
    <>
      <PageHead title={`${greeting()}, Dr. Feras`} description="Everything published on the portfolio, in one place.">
        <Link to="/s/events?new=1" className="btn">
          <CalendarDays className="size-4" /> Add event
        </Link>
        <Link to="/s/news?new=1" className="btn btn-primary">
          <Plus className="size-4" /> New article
        </Link>
      </PageHead>

      <div className="grid grid-cols-4 gap-3.5 max-xl:grid-cols-2 max-sm:grid-cols-1">
        <Tile label="Published items" value={loaded ? stats.total : '–'}>
          <span className="text-[12.5px] text-muted">
            {stats.addedThisMonth > 0 ? (
              <>
                <b className="font-semibold text-[#1f6b4a] tabular-nums">+{stats.addedThisMonth}</b> this month across {SECTIONS.length} sections
              </>
            ) : (
              `across ${SECTIONS.length} sections`
            )}
          </span>
        </Tile>
        <Tile label="Unread messages" value={messages ? unread.length : '–'}>
          <span className="text-[12.5px] text-muted">
            {oldestUnread ? `from the contact form, oldest ${formatAgo(oldestUnread.createdAt)}` : 'Inbox is clear'}
          </span>
        </Tile>
        <Tile label="Upcoming events" value={loaded ? stats.upcoming.length : '–'}>
          <span className="truncate text-[12.5px] text-muted">
            {stats.upcoming[0]
              ? `next: ${stats.upcoming[0].title}, ${shortFmt.format(utcDate(stats.upcoming[0].eventDate))}`
              : 'None scheduled'}
          </span>
        </Tile>
        <Tile label="Articles per month">
          <Sparkline counts={stats.perMonth} />
          <span className="text-[12.5px] text-muted">
            last 8 months, {stats.perMonth.reduce((a, b) => a + b, 0)} in total
          </span>
        </Tile>
      </div>

      <div className="grid grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-[18px] max-xl:grid-cols-1">
        <Panel title="Portfolio sections">
          <div className="grid grid-cols-2 gap-x-6 px-[18px] pt-1.5 pb-3.5 max-sm:grid-cols-1">
            {stats.sections.map(({ section, count, latest }) => (
              <Link
                key={section.key}
                to={`/s/${section.key}`}
                className="flex items-center gap-2.5 border-b border-panel-line py-2.5 hover:text-primary"
              >
                <section.icon className="size-4 shrink-0 text-mute" aria-hidden="true" />
                <span className="flex-1 truncate">{section.label}</span>
                <span className="font-mono text-[13px] text-mute">{loaded ? count : '–'}</span>
                <span className="w-[76px] text-right text-xs text-mute">{latest ? shortFmt.format(new Date(latest)) : ''}</span>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel
          title="Messages"
          action={{ to: '/messages', label: 'Open inbox' }}
          extra={unread.length > 0 && <span className="pill bg-primary text-white">{unread.length} new</span>}
        >
          <div className="px-[18px] pt-1.5 pb-3.5">
            {!messages ? (
              <p className="py-3 text-mute">Loading…</p>
            ) : messages.length === 0 ? (
              <p className="py-3 text-mute">No messages yet. Messages from the contact form show up here.</p>
            ) : (
              messages.slice(0, 4).map((m) => (
                <Link key={m.id} to={`/messages?open=${m.id}`} className="flex gap-3 border-b border-panel-line py-3 last:border-0 hover:text-primary">
                  <Avatar name={m.name} />
                  <div className="min-w-0 flex-1">
                    <b className="text-[13.5px] font-semibold">
                      {!readIds.has(m.id) && <span className="mr-1.5 inline-block size-[7px] rounded-full bg-aqua align-middle" />}
                      {m.name}
                    </b>
                    <p className="truncate text-[13px] text-mute">{m.message}</p>
                  </div>
                  <time className="text-xs whitespace-nowrap text-mute">{formatAgo(m.createdAt)}</time>
                </Link>
              ))
            )}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-[18px] max-xl:grid-cols-1">
        <Panel title="Upcoming and recent events" action={{ to: '/s/events', label: 'All events' }}>
          <ul className="px-[18px] pt-1.5 pb-3.5">
            {!loaded ? (
              <li className="py-3 text-mute">Loading…</li>
            ) : timeline.length === 0 ? (
              <li className="py-3 text-mute">No events yet.</li>
            ) : (
              timeline.map((e) => {
                const d = utcDate(e.eventDate)
                const isUpcoming = e.eventDate >= todayYmd()
                return (
                  <li key={e.id} className="border-b border-panel-line last:border-0">
                    <Link to={`/s/events?edit=${e.id}`} className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 py-2.5 hover:text-primary">
                      <span className="font-mono text-xs leading-[1.3] text-mute uppercase">
                        {monthFmt.format(d)}
                        <b className="block font-display text-xl font-semibold text-ink">{dayFmt.format(d)}</b>
                      </span>
                      <div className="min-w-0">
                        <b className="font-semibold">{e.title}</b>{' '}
                        <span className={cn('pill', isUpcoming ? 'bg-[#e3f5f7] text-[#16808f]' : 'bg-ok-soft text-ok')}>
                          {isUpcoming ? 'Upcoming' : 'Past'}
                        </span>
                        {!e.imageUrl && <span className="pill ml-1 bg-warn-soft text-warn">No image</span>}
                        <small className="block text-mute">
                          {e.role} · {e.location}
                        </small>
                      </div>
                    </Link>
                  </li>
                )
              })
            )}
          </ul>
        </Panel>

        <Panel title="System status">
          <div className="flex flex-col gap-2.5 px-[18px] py-3.5">
            {!health ? (
              <span className="flex items-center gap-2 text-mute">
                <LoaderCircle className="size-4 animate-spin" /> Checking…
              </span>
            ) : (
              <>
                <Status ok={health.status === 'ok'} label="API" detail={health.ms != null ? `/api/health · ${health.ms} ms` : health.message} />
                <Status ok={health.database === 'connected'} label="Database" detail={health.database} />
              </>
            )}
            <Status ok={!!lists[newsSection.key]} warn label="Content" detail={loaded ? `${stats.total} items loaded` : 'loading'} />
            <Status warn label="Session" detail={sessionExpiry()} />
          </div>
        </Panel>
      </div>
    </>
  )
}
