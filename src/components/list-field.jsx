import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react'

// Editable list of short strings (profile bullet points, project highlights).
export function ListField({ id, value, onChange, maxItems, max, error }) {
  const items = value ?? []
  const set = (i, text) => onChange(items.map((v, j) => (j === i ? text : v)))
  const move = (i, d) => {
    const next = [...items]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-2" id={id}>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="w-5 shrink-0 text-right font-mono text-xs text-mute">{i + 1}</span>
          <input
            id={`${id}-${i}`}
            className="input py-1.5"
            value={item}
            maxLength={max}
            onChange={(e) => set(i, e.target.value)}
            aria-label={`Item ${i + 1}`}
          />
          <button type="button" className="btn btn-ghost px-1.5" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
            <ArrowUp className="size-3.5" />
          </button>
          <button type="button" className="btn btn-ghost px-1.5" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
            <ArrowDown className="size-3.5" />
          </button>
          <button type="button" className="btn btn-ghost btn-danger px-1.5" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove item">
            <X className="size-3.5" />
          </button>
        </div>
      ))}
      <button type="button" className="btn self-start py-1.5" disabled={items.length >= maxItems} onClick={() => onChange([...items, ''])}>
        <Plus className="size-3.5" /> Add item
      </button>
      <span className="text-xs text-mute">
        {items.length} / {maxItems} items, up to {max} characters each.
      </span>
      {error && <span className="text-xs text-bad">{error}</span>}
    </div>
  )
}
