import { Link } from 'react-router'
import { useSiteData } from '@/lib/site-data'
import { cn } from '@/lib/utils'
import { ImageField } from './image-field'
import { ListField } from './list-field'

function Counter({ value, max }) {
  const len = (value ?? '').length
  return (
    <span className={cn('font-mono text-xs tabular-nums', len > max ? 'text-bad' : 'text-mute')}>
      {len.toLocaleString()} / {max.toLocaleString()}
    </span>
  )
}

function Field({ section, field, value, onChange, error }) {
  const { lists } = useSiteData()
  const id = `${section.key}-${field.name}`
  const { type, max } = field
  const common = { id, 'aria-invalid': Boolean(error) || undefined, className: cn('input', error && 'border-bad') }

  let control
  if (type === 'textarea') {
    control = (
      <textarea {...common} rows={field.rows ?? 4} value={value} onChange={(e) => onChange(e.target.value)} className={cn(common.className, 'resize-y')} />
    )
  } else if (type === 'select' || type === 'category') {
    const options =
      type === 'category' ? (lists['news-categories'] ?? []).map((c) => ({ value: c.id, label: c.name })) : field.options
    control = (
      <select {...common} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{field.required ? 'Choose…' : 'None'}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    )
  } else if (type === 'image') {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="label" htmlFor={id}>
          {field.label} <span className="font-normal text-mute">(optional)</span>
        </label>
        <ImageField id={id} value={value} onChange={onChange} error={error} />
      </div>
    )
  } else if (type === 'list') {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="label">{field.label}</span>
        <ListField id={id} value={value} onChange={onChange} maxItems={field.maxItems} max={max} error={error} />
      </div>
    )
  } else {
    const inputType = type === 'date' ? 'date' : type === 'number' || type === 'year' ? 'number' : 'text'
    control = (
      <input
        {...common}
        type={inputType}
        inputMode={type === 'number' || type === 'year' ? 'numeric' : undefined}
        min={type === 'year' ? 1900 : undefined}
        max={type === 'year' ? 2100 : undefined}
        step={type === 'number' || type === 'year' ? 1 : undefined}
        placeholder={type === 'year' && field.nullable ? 'Present' : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }

  const optional = !field.required && type !== 'number'
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', field.half ? 'col-span-1' : 'col-span-2')}>
      <label className="label" htmlFor={id}>
        {field.label}
        {optional && <span className="font-normal text-mute"> (optional)</span>}
      </label>
      {control}
      {(error || field.hint || ((type === 'text' || type === 'textarea') && max)) && (
        <div className="flex items-start justify-between gap-3">
          {error ? <span className="text-xs text-bad">{error}</span> : <span className="text-xs text-mute">{field.hint}</span>}
          {(type === 'text' || type === 'textarea') && max > 20 && <Counter value={value} max={max} />}
        </div>
      )}
      {type === 'category' && (lists['news-categories'] ?? []).length === 0 && (
        <span className="text-xs text-warn">
          No categories yet.{' '}
          <Link to="/s/news-categories?new=1" className="underline">
            Create one first
          </Link>
          .
        </span>
      )}
    </div>
  )
}

export function RecordForm({ section, form, setForm, errors }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-3.5 max-sm:grid-cols-1 max-sm:[&>*]:col-span-1">
      {section.fields.map((field) => {
        const wide = field.type === 'image' || field.type === 'list'
        const el = (
          <Field
            key={field.name}
            section={section}
            field={field}
            value={form[field.name] ?? (field.type === 'list' ? [] : '')}
            error={errors[field.name]}
            onChange={(v) => setForm((f) => ({ ...f, [field.name]: v }))}
          />
        )
        return wide ? (
          <div key={field.name} className="col-span-2">
            {el}
          </div>
        ) : (
          el
        )
      })}
    </div>
  )
}
