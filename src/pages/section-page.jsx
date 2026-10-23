import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { ImageIcon, LoaderCircle, Pencil, Plus, RotateCw, Search, Trash2, X } from 'lucide-react'
import * as api from '@/lib/api'
import { findSection, toForm, toPayload } from '@/lib/sections'
import { useSiteData } from '@/lib/site-data'
import { imageSrc } from '@/lib/format'
import { cn } from '@/lib/utils'
import { PageHead, NotFound } from '@/components/layout'
import { RecordForm } from '@/components/record-form'
import { useToast } from '@/components/toast'

function Thumb({ url }) {
  const [broken, setBroken] = useState(false)
  return (
    <div className="grid h-9 w-[52px] shrink-0 place-items-center overflow-hidden rounded-md bg-gradient-to-br from-primary to-aqua text-white/70">
      {url && !broken ? (
        <img src={imageSrc(url)} alt="" loading="lazy" className="size-full object-cover" onError={() => setBroken(true)} />
      ) : (
        <ImageIcon className="size-4" aria-hidden="true" />
      )}
    </div>
  )
}

function Editor({ section, record, onSaved, onDeleted, onClose }) {
  const isNew = !record
  const toast = useToast()
  const initial = useMemo(() => toForm(section, record), [section, record])
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setForm(initial)
    setErrors({})
    setFormError('')
    setConfirming(false)
  }, [initial])

  const dirty = JSON.stringify(form) !== JSON.stringify(initial)

  async function save(e) {
    e.preventDefault()
    const { body, errors: found } = toPayload(section, form)
    setErrors(found)
    setFormError('')
    if (Object.keys(found).length) return setFormError('Fix the highlighted fields, then save again.')

    setSaving(true)
    try {
      const saved = isNew ? await api.create(section.path, body) : await api.update(section.path, record.id, body)
      toast(isNew ? `${capitalize(section.singular)} added. It is live on the site.` : 'Changes saved. The site shows them now.')
      onSaved(saved)
    } catch (err) {
      const fieldErrors = err.fieldErrors ?? {}
      const known = Object.fromEntries(Object.entries(fieldErrors).filter(([k]) => section.fields.some((f) => f.name === k)))
      setErrors(known)
      setFormError(Object.keys(known).length ? 'The server rejected some fields. Fix them and save again.' : err.message)
    } finally {
      setSaving(false)
    }
  }

  async function destroy() {
    setDeleting(true)
    try {
      await api.remove(section.path, record.id)
      toast(`${capitalize(section.singular)} deleted.`)
      onDeleted(record.id)
    } catch (err) {
      setFormError(err.message)
      setConfirming(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <form className="panel lg:sticky lg:top-[84px]" onSubmit={save} noValidate>
      <header className="panel-head">
        <h2 className="text-[15.5px] font-semibold">{isNew ? `New ${section.singular}` : `Edit ${section.singular}`}</h2>
        {!isNew && <span className="pill bg-white text-ok">Published</span>}
        <button type="button" onClick={onClose} className="ml-auto rounded-md p-1 text-white hover:bg-white/20" aria-label="Close editor">
          <X className="size-4" />
        </button>
      </header>

      <div className="flex flex-col gap-3.5 px-[18px] py-4">
        {formError && (
          <div role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-[13px] text-bad">
            {formError}
          </div>
        )}
        <RecordForm section={section} form={form} setForm={setForm} errors={errors} />
      </div>

      {confirming ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-panel-line bg-bad-soft px-[18px] py-3.5">
          <span className="mr-auto text-[13px] font-medium text-bad">Delete this {section.singular}? It is removed from the site.</span>
          <button type="button" className="btn" onClick={() => setConfirming(false)} disabled={deleting}>
            Keep it
          </button>
          <button type="button" className="btn btn-danger-solid" onClick={destroy} disabled={deleting}>
            {deleting ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            Delete
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 border-t border-panel-line px-[18px] py-3.5">
          {!isNew && (
            <button type="button" className="btn btn-danger" onClick={() => setConfirming(true)}>
              <Trash2 className="size-4" /> Delete
            </button>
          )}
          <button type="button" className="btn ml-auto" onClick={isNew || !dirty ? onClose : () => setForm(initial)}>
            {isNew || !dirty ? 'Cancel' : 'Undo changes'}
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving || (!isNew && !dirty)}>
            {saving && <LoaderCircle className="size-4 animate-spin" />}
            {isNew ? `Add ${section.singular}` : 'Save changes'}
          </button>
        </div>
      )}
    </form>
  )
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function SectionPage() {
  const { sectionKey } = useParams()
  const section = findSection(sectionKey)
  const { lists, errors, setList } = useSiteData()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [chip, setChip] = useState('')
  const [reloading, setReloading] = useState(false)
  const toast = useToast()

  useEffect(() => {
    setQuery('')
    setChip('')
  }, [sectionKey])

  const items = section ? lists[section.key] : undefined
  const loadError = section ? errors[section.key] : null
  const editId = params.get('edit')
  const creating = params.get('new') === '1'
  const record = editId ? items?.find((r) => r.id === editId) : null

  const chips = useMemo(() => {
    if (!section?.filterBy || !items) return []
    return [...new Set(items.map(section.filterBy).filter(Boolean))].sort()
  }, [section, items])

  const shown = useMemo(() => {
    if (!section || !items) return []
    const q = query.trim().toLowerCase()
    return items.filter((r) => {
      if (chip && section.filterBy?.(r) !== chip) return false
      if (!q) return true
      return `${section.title(r, lists)} ${section.subtitle?.(r, lists) ?? ''}`.toLowerCase().includes(q)
    })
  }, [section, items, query, chip, lists])

  if (!section) return <NotFound />

  const select = (id) => setParams(id ? { edit: id } : {})
  const startNew = () => setParams({ new: '1' })
  const close = () => setParams({})

  async function refresh() {
    setReloading(true)
    try {
      setList(section.key, await api.list(section.path))
      // Category names on news come from the categories list.
      if (section.key === 'news-categories') setList('news', await api.list('/news'))
    } catch (err) {
      toast(err.message, 'bad')
    } finally {
      setReloading(false)
    }
  }

  async function handleSaved(saved) {
    await refresh()
    select(saved.id)
  }

  function handleDeleted(id) {
    setList(
      section.key,
      items.filter((r) => r.id !== id),
    )
    close()
  }

  const editorOpen = creating || Boolean(record)
  const Icon = section.icon

  return (
    <>
      <PageHead title={section.label} description={section.description}>
        <button type="button" className="btn" onClick={refresh} disabled={reloading}>
          <RotateCw className={cn('size-4', reloading && 'animate-spin')} /> Refresh
        </button>
        <button type="button" className="btn btn-primary" onClick={startNew}>
          <Plus className="size-4" /> New {section.singular}
        </button>
      </PageHead>

      <div className="flex flex-wrap items-center gap-2">
        {chips.length > 0 && (
          <>
            <button type="button" onClick={() => setChip('')} className={chipClass(!chip)}>
              All <span className="tabular-nums">{items.length}</span>
            </button>
            {chips.map((c) => (
              <button key={c} type="button" onClick={() => setChip(c === chip ? '' : c)} className={chipClass(c === chip)}>
                {c}
              </button>
            ))}
          </>
        )}
        <label className="ml-auto flex w-full max-w-[260px] items-center gap-2 rounded-lg border border-line bg-white px-2.5 py-1.5 text-mute focus-within:border-primary max-sm:max-w-none">
          <Search className="size-[15px]" aria-hidden="true" />
          <input
            id="section-filter"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Filter ${section.label.toLowerCase()}`}
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-mute"
          />
        </label>
      </div>

      <div className={cn('grid items-start gap-[18px]', editorOpen && 'xl:grid-cols-[minmax(0,1fr)_420px]')}>
        <div className="panel">
          {loadError && !items ? (
            <div className="flex flex-col items-start gap-3 p-6">
              <p className="text-bad">Could not load {section.label.toLowerCase()}: {loadError}</p>
              <button type="button" className="btn" onClick={refresh}>
                <RotateCw className="size-4" /> Try again
              </button>
            </div>
          ) : !items ? (
            <div className="flex items-center gap-2 p-6 text-mute">
              <LoaderCircle className="size-4 animate-spin" /> Loading {section.label.toLowerCase()}…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-start gap-3 p-8">
              <Icon className="size-8 text-sky" aria-hidden="true" />
              <h2 className="text-lg font-semibold">No {section.label.toLowerCase()} yet</h2>
              <p className="text-mute">Add the first {section.singular} and it appears on the portfolio right away.</p>
              <button type="button" className="btn btn-primary" onClick={startNew}>
                <Plus className="size-4" /> New {section.singular}
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse">
                  <thead>
                    <tr className="bg-brand">
                      <th className="px-3.5 py-3 text-left text-[11.5px] font-semibold tracking-[.07em] text-ink uppercase">
                        {capitalize(section.singular)}
                      </th>
                      {section.badge && <th className="px-3.5 py-3 text-left text-[11.5px] font-semibold tracking-[.07em] text-ink uppercase">Type</th>}
                      {section.meta && <th className="px-3.5 py-3 text-left text-[11.5px] font-semibold tracking-[.07em] text-ink uppercase">Details</th>}
                      <th className="w-24 px-3.5 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((r) => {
                      const selected = r.id === editId
                      return (
                        <tr
                          key={r.id}
                          onClick={() => select(r.id)}
                          className={cn('cursor-pointer even:bg-stripe hover:bg-selected/70', selected && 'bg-selected even:bg-selected')}
                        >
                          <td className={cn('border-b border-panel-line px-3.5 py-3', selected && 'shadow-[inset_3px_0_0_#2aa7b8]')}>
                            <div className="flex items-center gap-3">
                              {section.hasImage && <Thumb url={r.imageUrl} />}
                              <div className="min-w-0">
                                <b className="line-clamp-2 font-medium">{section.title(r, lists)}</b>
                                {section.subtitle?.(r, lists) && (
                                  <small className="line-clamp-1 text-[12.5px] text-mute">{section.subtitle(r, lists)}</small>
                                )}
                              </div>
                            </div>
                          </td>
                          {section.badge && (
                            <td className="border-b border-panel-line px-3.5 py-3">
                              {section.badge(r) && <span className="pill bg-[#e3f5f7] text-[#16808f]">{section.badge(r)}</span>}
                            </td>
                          )}
                          {section.meta && (
                            <td className="border-b border-panel-line px-3.5 py-3 whitespace-nowrap tabular-nums text-muted">{section.meta(r, lists)}</td>
                          )}
                          <td className="border-b border-panel-line px-2 py-3">
                            <div className="flex justify-end gap-0.5">
                              <button
                                type="button"
                                className="btn btn-ghost px-2"
                                aria-label={`Edit ${section.title(r, lists)}`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  select(r.id)
                                }}
                              >
                                <Pencil className="size-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {shown.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3.5 py-6 text-mute">
                          Nothing matches this filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between px-3.5 py-3 text-[13px] text-mute">
                <span>
                  Showing {shown.length} of {items.length}
                </span>
                <span className="max-sm:hidden">Same order as on the site</span>
              </div>
            </>
          )}
        </div>

        {editorOpen && (
          <Editor
            key={record?.id ?? 'new'}
            section={section}
            record={record}
            onSaved={handleSaved}
            onDeleted={handleDeleted}
            onClose={close}
          />
        )}
        {editId && items && !record && (
          <div className="panel p-5 text-mute">
            This {section.singular} no longer exists. It may have been deleted.
            <button type="button" className="btn mt-3 w-fit" onClick={close}>
              Close
            </button>
          </div>
        )}
      </div>
    </>
  )
}

function chipClass(on) {
  return cn(
    'rounded-full border px-3 py-1 text-[13px] transition-colors',
    on ? 'border-primary bg-primary text-white' : 'border-line bg-white text-mute hover:border-primary/40',
  )
}
