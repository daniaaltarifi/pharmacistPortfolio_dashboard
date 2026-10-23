import { useRef, useState } from 'react'
import { ImageIcon, LoaderCircle, Upload, X } from 'lucide-react'
import { uploadImage } from '@/lib/api'
import { imageSrc } from '@/lib/format'
import { cn } from '@/lib/utils'

const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BYTES = 5 * 1024 * 1024

// Uploads to POST /api/uploads/images and stores the returned URL. A site path such as
// "/images/v2/capsules.png" can also be typed in directly.
export function ImageField({ id, value, onChange, error }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [broken, setBroken] = useState(false)

  async function handleFile(file) {
    if (!file) return
    setUploadError('')
    if (!TYPES.includes(file.type)) return setUploadError('Use a JPG, PNG, WebP or GIF image.')
    if (file.size > MAX_BYTES) return setUploadError('This image is larger than 5 MB. Resize it and try again.')
    setBusy(true)
    try {
      const { url } = await uploadImage(file)
      setBroken(false)
      onChange(url)
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const shown = uploadError || error
  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFile(e.dataTransfer.files?.[0])
        }}
        className={cn(
          'flex items-center gap-3 rounded-xl border-[1.5px] border-dashed border-panel-line bg-white/50 p-3 text-[13px] text-mute',
          dragging && 'border-primary bg-soft',
        )}
      >
        <div className="grid h-[54px] w-[78px] shrink-0 place-items-center overflow-hidden rounded-md bg-gradient-to-br from-primary to-aqua text-white/80">
          {busy ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : value && !broken ? (
            <img src={imageSrc(value)} alt="" className="size-full object-cover" onError={() => setBroken(true)} />
          ) : (
            <ImageIcon className="size-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          {busy ? (
            <span>Uploading…</span>
          ) : (
            <>
              <span>Drop an image here or </span>
              <button type="button" className="font-medium text-primary underline underline-offset-2" onClick={() => inputRef.current?.click()}>
                browse
              </button>
              <span>. JPG, PNG, WebP or GIF, up to 5 MB.</span>
            </>
          )}
        </div>
        {value && !busy && (
          <button type="button" className="btn btn-ghost px-2" onClick={() => onChange('')} aria-label="Remove image" title="Remove image">
            <X className="size-4" />
          </button>
        )}
        <input ref={inputRef} type="file" accept={TYPES.join(',')} className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>
      <div className="flex items-center gap-2">
        <Upload className="size-3.5 shrink-0 text-mute" aria-hidden="true" />
        <input
          id={id}
          className="input py-1.5 font-mono text-xs"
          value={value}
          onChange={(e) => {
            setBroken(false)
            onChange(e.target.value)
          }}
          placeholder="or paste a URL, or a site path like /images/v2/capsules.png"
          aria-label="Image URL"
        />
      </div>
      {broken && value && !shown && <span className="text-xs text-warn">This image cannot be previewed. Check the URL.</span>}
      {shown && <span className="text-xs text-bad">{shown}</span>}
    </div>
  )
}
