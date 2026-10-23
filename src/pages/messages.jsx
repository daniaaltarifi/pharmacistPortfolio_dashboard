import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Copy, Inbox, LoaderCircle, Mail, PenLine, RotateCw, Send, Trash2, Zap } from 'lucide-react'
import * as api from '@/lib/api'
import { useSiteData } from '@/lib/site-data'
import { useReadIds } from '@/lib/use-read-ids'
import { markRead } from '@/lib/read-messages'
import { formatAgo, initials } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PageHead } from '@/components/layout'
import { useToast } from '@/components/toast'

const fullDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' })

export function Avatar({ name }) {
  return (
    <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#2a4a75] text-xs font-semibold text-white">{initials(name)}</div>
  )
}

// Replies already sent for this message, oldest first.
function ReplyHistory({ replies }) {
  if (!replies?.length) return null
  return (
    <div className="flex flex-col gap-2">
      <span className="label">Replies sent</span>
      <ul className="flex flex-col gap-2">
        {replies.map((r) => (
          <li key={r.id} className="rounded-lg border border-panel-line bg-white p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn('pill', r.type === 'auto' ? 'bg-soft text-mute' : 'bg-primary text-white')}>
                {r.type === 'auto' ? 'Auto reply' : 'Custom reply'}
              </span>
              <b className="min-w-0 flex-1 truncate text-[13px]">{r.subject}</b>
              <small className="text-mute">{fullDate.format(new Date(r.createdAt))}</small>
            </div>
            {r.type === 'custom' && <p className="mt-2 text-[13px] leading-relaxed whitespace-pre-wrap text-mute">{r.body}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ComposeReply({ message, busy, errors, onSend, onCancel }) {
  const [subject, setSubject] = useState('Re: your message')
  const [body, setBody] = useState(`Dear ${message.name},\n\n`)

  return (
    <form
      className="flex flex-col gap-3 border-t border-panel-line px-[18px] py-3.5"
      onSubmit={(e) => {
        e.preventDefault()
        onSend({ subject, body })
      }}
    >
      <p className="text-[13px] text-mute">
        To <span className="font-mono">{message.email}</span>. Their original message is quoted under your reply.
      </p>
      <div className="flex flex-col gap-1.5">
        <label className="label" htmlFor="reply-subject">
          Subject
        </label>
        <input
          id="reply-subject"
          className="input"
          value={subject}
          maxLength={200}
          onChange={(e) => setSubject(e.target.value)}
          disabled={busy}
          required
        />
        {errors.subject && <span className="text-xs text-bad">{errors.subject}</span>}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="label" htmlFor="reply-body">
          Message
        </label>
        <textarea
          id="reply-body"
          className="input min-h-40 resize-y leading-relaxed"
          value={body}
          maxLength={10000}
          onChange={(e) => setBody(e.target.value)}
          disabled={busy}
          required
          autoFocus
        />
        {errors.body && <span className="text-xs text-bad">{errors.body}</span>}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button type="button" className="btn" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy || !subject.trim() || !body.trim()}>
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />} Send reply
        </button>
      </div>
    </form>
  )
}

function Reader({ message, onDeleted, onReplied }) {
  const toast = useToast()
  // idle | delete (confirm) | auto (confirm) | compose
  const [mode, setMode] = useState('idle')
  const [busy, setBusy] = useState(false)
  const [replyErrors, setReplyErrors] = useState({})

  useEffect(() => {
    markRead(message.id)
    setMode('idle')
    setReplyErrors({})
  }, [message.id])

  async function sendReply(kind, fields) {
    setBusy(true)
    setReplyErrors({})
    try {
      const reply = kind === 'auto' ? await api.sendAutoReply(message.id) : await api.sendCustomReply(message.id, fields)
      toast(`Reply sent to ${message.email}.`)
      onReplied(message.id, reply)
      setMode('idle')
    } catch (err) {
      setReplyErrors(err.fieldErrors ?? {})
      toast(err.message, 'bad')
    } finally {
      setBusy(false)
    }
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(message.email)
      toast('Email address copied.')
    } catch {
      toast(`Copy failed. The address is ${message.email}`, 'bad')
    }
  }

  async function destroy() {
    setBusy(true)
    try {
      await api.remove('/contact', message.id)
      toast('Message deleted.')
      onDeleted(message.id)
    } catch (err) {
      toast(err.message, 'bad')
      setBusy(false)
    }
  }

  return (
    <article className="panel lg:sticky lg:top-[84px]">
      <header className="panel-head">
        <h2 className="min-w-0 truncate text-[15.5px] font-semibold">{message.name}</h2>
      </header>
      <div className="flex flex-col gap-4 px-[18px] py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Avatar name={message.name} />
          <div className="min-w-0 flex-1">
            <span className="block truncate font-mono text-[13px] select-all">{message.email}</span>
            <small className="text-mute">{fullDate.format(new Date(message.createdAt))}</small>
          </div>
        </div>
        <p className="rounded-lg border border-panel-line bg-white p-4 leading-relaxed whitespace-pre-wrap">{message.message}</p>
        <ReplyHistory replies={message.replies} />
      </div>
      {mode === 'delete' ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-panel-line bg-bad-soft px-[18px] py-3.5">
          <span className="mr-auto text-[13px] font-medium text-bad">Delete this message? This cannot be undone.</span>
          <button type="button" className="btn" onClick={() => setMode('idle')} disabled={busy}>
            Keep it
          </button>
          <button type="button" className="btn btn-danger-solid" onClick={destroy} disabled={busy}>
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Delete
          </button>
        </div>
      ) : mode === 'auto' ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-panel-line bg-soft px-[18px] py-3.5">
          <span className="mr-auto text-[13px] font-medium">
            Send the standard thank-you email to <span className="font-mono">{message.email}</span>?
          </span>
          <button type="button" className="btn" onClick={() => setMode('idle')} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={() => sendReply('auto')} disabled={busy}>
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />} Send
          </button>
        </div>
      ) : mode === 'compose' ? (
        <ComposeReply
          message={message}
          busy={busy}
          errors={replyErrors}
          onSend={(fields) => sendReply('custom', fields)}
          onCancel={() => {
            setMode('idle')
            setReplyErrors({})
          }}
        />
      ) : (
        <div className="flex flex-wrap items-center gap-2 border-t border-panel-line px-[18px] py-3.5">
          <button type="button" className="btn btn-danger" onClick={() => setMode('delete')}>
            <Trash2 className="size-4" /> Delete
          </button>
          <button type="button" className="btn btn-ghost" onClick={copyEmail} title="Copy email address">
            <Copy className="size-4" />
            <span className="sr-only">Copy email</span>
          </button>
          <button type="button" className="btn ml-auto" onClick={() => setMode('auto')}>
            <Zap className="size-4" /> Auto reply
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setMode('compose')}>
            <PenLine className="size-4" /> Custom reply
          </button>
        </div>
      )}
    </article>
  )
}

export function MessagesPage() {
  const { messages, setMessages, errors } = useSiteData()
  const readIds = useReadIds()
  const [params, setParams] = useSearchParams()
  const [reloading, setReloading] = useState(false)
  const toast = useToast()
  const openId = params.get('open')
  const open = messages?.find((m) => m.id === openId)

  async function refresh() {
    setReloading(true)
    try {
      setMessages(await api.list('/contact'))
    } catch (err) {
      toast(err.message, 'bad')
    } finally {
      setReloading(false)
    }
  }

  const unread = (messages ?? []).filter((m) => !readIds.has(m.id)).length

  return (
    <>
      <PageHead title="Messages" description="Sent through the contact form on the portfolio, newest first.">
        <button type="button" className="btn" onClick={refresh} disabled={reloading}>
          <RotateCw className={cn('size-4', reloading && 'animate-spin')} /> Refresh
        </button>
      </PageHead>

      <div className={cn('grid items-start gap-[18px]', open && 'xl:grid-cols-[minmax(0,1fr)_460px]')}>
        <div className="panel">
          <header className="panel-head">
            <h2 className="text-[15.5px] font-semibold">Inbox</h2>
            {unread > 0 && <span className="pill bg-primary text-white">{unread} new</span>}
          </header>
          {errors.messages && !messages ? (
            <div className="flex flex-col items-start gap-3 p-6">
              <p className="text-bad">Could not load messages: {errors.messages}</p>
              <button type="button" className="btn" onClick={refresh}>
                <RotateCw className="size-4" /> Try again
              </button>
            </div>
          ) : !messages ? (
            <div className="flex items-center gap-2 p-6 text-mute">
              <LoaderCircle className="size-4 animate-spin" /> Loading messages…
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-start gap-2 p-8">
              <Inbox className="size-8 text-sky" aria-hidden="true" />
              <h2 className="text-lg font-semibold">No messages yet</h2>
              <p className="text-mute">Messages from the portfolio's contact form show up here.</p>
            </div>
          ) : (
            <ul className="px-[18px] py-1.5">
              {messages.map((m) => {
                const isNew = !readIds.has(m.id)
                return (
                  <li key={m.id} className="border-b border-panel-line last:border-0">
                    <button
                      type="button"
                      onClick={() => setParams({ open: m.id })}
                      className={cn('-mx-2 flex w-[calc(100%+16px)] gap-3 rounded-lg px-2 py-3 text-left hover:bg-white/60', m.id === openId && 'bg-selected')}
                    >
                      <Avatar name={m.name} />
                      <div className="min-w-0 flex-1">
                        <b className={cn('text-[13.5px]', isNew ? 'font-semibold' : 'font-medium')}>
                          {isNew && <span className="mr-1.5 inline-block size-[7px] rounded-full bg-aqua align-middle" aria-label="New" />}
                          {m.name}
                        </b>
                        {m.replies?.length > 0 && (
                          <span className="pill ml-2 bg-ok-soft text-ok">
                            <Mail className="size-3" aria-hidden="true" /> Replied
                          </span>
                        )}
                        <p className="truncate text-[13px] text-mute">{m.message}</p>
                      </div>
                      <time className="text-xs whitespace-nowrap text-mute" dateTime={m.createdAt}>
                        {formatAgo(m.createdAt)}
                      </time>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {open && (
          <Reader
            message={open}
            onDeleted={(id) => {
              setMessages(messages.filter((m) => m.id !== id))
              setParams({})
            }}
            onReplied={(id, reply) =>
              setMessages((list) => list.map((m) => (m.id === id ? { ...m, replies: [...(m.replies ?? []), reply] } : m)))
            }
          />
        )}
      </div>
    </>
  )
}
