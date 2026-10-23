import {
  Atom,
  Award,
  BadgeCheck,
  BookOpen,
  Briefcase,
  CalendarDays,
  ChartColumn,
  FlaskConical,
  Images,
  Newspaper,
  Tags,
  User,
  Users,
} from 'lucide-react'
import { formatDate } from './format'

// One entry per portfolio section. Field rules mirror server/validators/*.js so the
// form catches mistakes before the API does.
//
// Field types:
//   text, textarea      string, `max` characters
//   number              optional whole number (sort order)
//   year                1900-2100; `nullable` sends null when empty (e.g. "Present")
//   date                YYYY-MM-DD
//   select              fixed `options`; `nullable` sends null when empty
//   category            a news category id, loaded from /news-categories
//   image               uploaded image URL or a site path like "/images/..."
//   list                array of strings, at most `maxItems` of `max` characters

const sortOrder = {
  name: 'sortOrder',
  label: 'Sort order',
  type: 'number',
  hint: 'Lower numbers show first on the site. Leave empty to add at the end.',
}

const imageUrl = { name: 'imageUrl', label: 'Image', type: 'image' }

export const SECTIONS = [
  // Career
  {
    key: 'profiles',
    group: 'Career',
    label: 'Professional profile',
    singular: 'role',
    path: '/profiles',
    icon: User,
    description: 'Roles shown in the Professional Profile timeline, with their bullet points.',
    fields: [
      { name: 'role', label: 'Role', type: 'text', max: 150, required: true },
      { name: 'org', label: 'Organization', type: 'text', max: 150, required: true },
      { name: 'place', label: 'Place', type: 'text', max: 120, required: true, half: true },
      { name: 'startYear', label: 'Start year', type: 'year', required: true, half: true },
      { name: 'endYear', label: 'End year', type: 'year', nullable: true, half: true, hint: 'Leave empty for "Present".' },
      { ...sortOrder, half: true },
      { name: 'summary', label: 'Summary', type: 'textarea', max: 1000, required: true },
      { name: 'points', label: 'Bullet points', type: 'list', maxItems: 20, max: 500 },
    ],
    title: (r) => r.role,
    subtitle: (r) => `${r.org} · ${r.place}`,
    meta: (r) => `${r.startYear} – ${r.endYear ?? 'Present'}`,
  },
  {
    key: 'experiences',
    group: 'Career',
    label: 'Experience',
    singular: 'experience',
    path: '/experiences',
    icon: Briefcase,
    description: 'Short experience highlights shown on the home page.',
    fields: [
      { name: 'title', label: 'Title', type: 'text', max: 120, required: true },
      { name: 'body', label: 'Body', type: 'textarea', max: 1000, required: true },
      sortOrder,
    ],
    title: (r) => r.title,
    subtitle: (r) => r.body,
    meta: (r) => (r.sortOrder != null ? `#${r.sortOrder}` : ''),
  },
  {
    key: 'accomplishments',
    group: 'Career',
    label: 'Accomplishments',
    singular: 'accomplishment',
    path: '/accomplishments',
    icon: FlaskConical,
    description: 'The accomplishments dial. The metric is the short label on each node.',
    fields: [
      { name: 'metric', label: 'Metric', type: 'text', max: 20, required: true, half: true, hint: 'Short label, e.g. "JPD" or "#1".' },
      { ...sortOrder, half: true },
      { name: 'title', label: 'Title', type: 'text', max: 150, required: true },
      { name: 'organization', label: 'Organization', type: 'text', max: 120, required: true },
      { name: 'body', label: 'Body', type: 'textarea', max: 1000, required: true },
    ],
    title: (r) => r.title,
    subtitle: (r) => r.organization,
    meta: (r) => r.metric,
  },
  {
    key: 'memberships',
    group: 'Career',
    label: 'Memberships',
    singular: 'membership',
    path: '/memberships',
    icon: Users,
    description: 'Boards, associations and committees.',
    fields: [
      { name: 'org', label: 'Organization', type: 'text', max: 150, required: true },
      { name: 'role', label: 'Role', type: 'text', max: 150, required: true },
      { name: 'period', label: 'Period', type: 'text', max: 100, required: true, half: true, hint: 'Free text, e.g. "2022 till now".' },
      {
        name: 'sector',
        label: 'Sector',
        type: 'select',
        nullable: true,
        half: true,
        options: [
          { value: 'Private', label: 'Private' },
          { value: 'Governmental', label: 'Governmental' },
        ],
      },
      sortOrder,
    ],
    title: (r) => r.org,
    subtitle: (r) => r.role,
    meta: (r) => r.period,
    badge: (r) => r.sector,
  },

  // Publications
  {
    key: 'news',
    group: 'Publications',
    label: 'News',
    singular: 'article',
    path: '/news',
    icon: Newspaper,
    description: 'Articles shown in the News section of the portfolio, newest first.',
    fields: [
      { name: 'title', label: 'Title', type: 'text', max: 200, required: true },
      { name: 'categoryId', label: 'Category', type: 'category', required: true, half: true },
      { name: 'publishedAt', label: 'Publish date', type: 'date', required: true, half: true },
      { name: 'description', label: 'Body', type: 'textarea', max: 20000, rows: 8, required: true },
      imageUrl,
    ],
    title: (r) => r.title,
    subtitle: (r) => r.category?.name,
    meta: (r) => formatDate(r.publishedAt),
    badge: (r) => r.category?.name,
    filterBy: (r) => r.category?.name,
    hasImage: true,
    dateField: 'publishedAt',
  },
  {
    key: 'news-categories',
    group: 'Publications',
    label: 'News categories',
    singular: 'category',
    path: '/news-categories',
    icon: Tags,
    description: 'Categories used to group news articles. A category that still has articles cannot be deleted.',
    fields: [{ name: 'name', label: 'Name', type: 'text', max: 50, required: true }],
    title: (r) => r.name,
    meta: (r, lists) => {
      const n = (lists.news ?? []).filter((a) => a.categoryId === r.id).length
      return `${n} ${n === 1 ? 'article' : 'articles'}`
    },
  },
  {
    key: 'events',
    group: 'Publications',
    label: 'Events',
    singular: 'event',
    path: '/events',
    icon: CalendarDays,
    description: 'Conferences, talks and workshops.',
    fields: [
      { name: 'title', label: 'Title', type: 'text', max: 200, required: true },
      { name: 'role', label: 'Role', type: 'text', max: 100, required: true, half: true, hint: 'e.g. "Keynote speaker".' },
      { name: 'eventDate', label: 'Event date', type: 'date', required: true, half: true },
      { name: 'location', label: 'Location', type: 'text', max: 150, required: true },
      { name: 'summary', label: 'Summary', type: 'textarea', max: 2000, required: true },
      imageUrl,
    ],
    title: (r) => r.title,
    subtitle: (r) => `${r.role} · ${r.location}`,
    meta: (r) => formatDate(r.eventDate),
    hasImage: true,
    dateField: 'eventDate',
  },
  {
    key: 'reports',
    group: 'Publications',
    label: 'Reports',
    singular: 'report',
    path: '/reports',
    icon: ChartColumn,
    description: 'Published reports and research.',
    fields: [
      { name: 'title', label: 'Title', type: 'text', max: 200, required: true },
      { name: 'publishedAt', label: 'Publish date', type: 'date', required: true },
      { name: 'description', label: 'Body', type: 'textarea', max: 20000, rows: 8, required: true },
      imageUrl,
    ],
    title: (r) => r.title,
    meta: (r) => formatDate(r.publishedAt),
    hasImage: true,
    dateField: 'publishedAt',
  },
  {
    key: 'projects',
    group: 'Publications',
    label: 'Projects',
    singular: 'project',
    path: '/projects',
    icon: Atom,
    description: 'Projects, in the order they were added.',
    fields: [
      { name: 'title', label: 'Title', type: 'text', max: 200, required: true },
      { name: 'description', label: 'Description', type: 'textarea', max: 2000, required: true },
      { name: 'highlights', label: 'Highlights', type: 'list', maxItems: 10, max: 60, hint: 'Short tags, up to 60 characters each.' },
      imageUrl,
    ],
    title: (r) => r.title,
    subtitle: (r) => (r.highlights ?? []).join(' · '),
    hasImage: true,
  },

  {
    key: 'gallery',
    group: 'Publications',
    label: 'Gallery',
    singular: 'photo',
    path: '/gallery',
    icon: Images,
    description: 'Photos on the Gallery page, newest first.',
    fields: [{ ...imageUrl, label: 'Photo', required: true }],
    // Only an image is stored, so the list shows the file name.
    title: (r) => decodeURIComponent((r.imageUrl ?? '').split('/').pop() || 'Photo'),
    hasImage: true,
  },

  // Recognition
  {
    key: 'awards',
    group: 'Recognition',
    label: 'Awards',
    singular: 'award',
    path: '/awards',
    icon: Award,
    description: 'Awards, newest first.',
    fields: [
      { name: 'title', label: 'Title', type: 'text', max: 200, required: true },
      { name: 'issuer', label: 'Issuer', type: 'text', max: 200, required: true, half: true },
      { name: 'year', label: 'Year', type: 'year', required: true, half: true },
      { name: 'description', label: 'Description', type: 'textarea', max: 2000, nullable: true },
      imageUrl,
    ],
    title: (r) => r.title,
    subtitle: (r) => r.issuer,
    meta: (r) => r.year,
    hasImage: true,
  },
  {
    key: 'certifications',
    group: 'Recognition',
    label: 'Certifications',
    singular: 'certification',
    path: '/certifications',
    icon: BadgeCheck,
    description: 'Professional certifications.',
    fields: [
      { name: 'title', label: 'Title', type: 'text', max: 200, required: true },
      { name: 'institution', label: 'Institution', type: 'text', max: 200, required: true, half: true },
      { name: 'year', label: 'Year', type: 'year', required: true, half: true },
      { name: 'description', label: 'Description', type: 'textarea', max: 2000, required: true },
      imageUrl,
    ],
    title: (r) => r.title,
    subtitle: (r) => r.institution,
    meta: (r) => r.year,
    hasImage: true,
  },
  {
    key: 'trainings',
    group: 'Recognition',
    label: 'Trainings',
    singular: 'training',
    path: '/trainings',
    icon: BookOpen,
    description: 'Courses and trainings completed.',
    fields: [
      { name: 'title', label: 'Title', type: 'text', max: 200, required: true },
      { name: 'provider', label: 'Provider', type: 'text', max: 200, required: true, half: true },
      { name: 'year', label: 'Year', type: 'year', required: true, half: true },
    ],
    title: (r) => r.title,
    subtitle: (r) => r.provider,
    meta: (r) => r.year,
  },
  {
    key: 'skills',
    group: 'Recognition',
    label: 'Skills',
    singular: 'skill',
    path: '/skills',
    icon: FlaskConical,
    description: 'Skills shown as periodic-table tiles. The symbol is the tile letters.',
    fields: [
      { name: 'name', label: 'Name', type: 'text', max: 100, required: true },
      { name: 'symbol', label: 'Symbol', type: 'text', max: 3, required: true, half: true, hint: 'Up to 3 letters, e.g. "Ra".' },
      { ...sortOrder, half: true },
    ],
    title: (r) => r.name,
    meta: (r) => r.symbol,
  },
]

export const GROUPS = ['Career', 'Publications', 'Recognition']

export function findSection(key) {
  return SECTIONS.find((s) => s.key === key)
}

// Form state -> request body. Returns { body, errors }.
export function toPayload(section, form) {
  const body = {}
  const errors = {}

  for (const field of section.fields) {
    const { name, label, type, required, nullable, max } = field
    const raw = form[name]

    if (type === 'list') {
      const items = (raw ?? []).map((s) => s.trim()).filter(Boolean)
      if (items.length > field.maxItems) errors[name] = `At most ${field.maxItems} items are allowed`
      else if (items.some((s) => s.length > max)) errors[name] = `Each item must be at most ${max} characters`
      body[name] = items
      continue
    }

    const value = typeof raw === 'string' ? raw.trim() : raw
    const empty = value === '' || value === null || value === undefined

    if (empty) {
      if (required) errors[name] = `${label} is required`
      else if (nullable || type === 'image') body[name] = null
      // Optional numbers (sort order) are left out so the server keeps or assigns them.
      continue
    }

    if (type === 'number' || type === 'year') {
      const n = Number(value)
      if (!Number.isInteger(n)) errors[name] = `${label} must be a whole number`
      else if (type === 'year' && (n < 1900 || n > 2100)) errors[name] = `${label} must be between 1900 and 2100`
      else body[name] = n
      continue
    }

    if (max && value.length > max) errors[name] = `${label} must be at most ${max} characters`
    body[name] = value
  }

  if (section.key === 'profiles' && body.endYear != null && body.startYear != null && body.endYear < body.startYear) {
    errors.endYear = 'End year cannot be before start year'
  }

  return { body, errors }
}

// Record from the API -> form state.
export function toForm(section, record) {
  const form = {}
  for (const { name, type } of section.fields) {
    const value = record?.[name]
    if (type === 'list') form[name] = Array.isArray(value) ? [...value] : []
    else if (value === null || value === undefined) form[name] = ''
    else form[name] = String(value)
  }
  return form
}
