import { Route, Routes } from 'react-router'
import { LoaderCircle } from 'lucide-react'
import { AuthProvider, useAuth } from '@/lib/auth'
import { SiteDataProvider } from '@/lib/site-data'
import { ToastProvider } from '@/components/toast'
import { Layout, NotFound } from '@/components/layout'
import { LoginPage } from '@/pages/login'
import { OverviewPage } from '@/pages/overview'
import { MessagesPage } from '@/pages/messages'
import { SectionPage } from '@/pages/section-page'

function Gate() {
  const { status } = useAuth()

  if (status === 'checking') {
    return (
      <div className="grid h-full place-items-center text-mute">
        <span className="flex items-center gap-2">
          <LoaderCircle className="size-4 animate-spin" /> Checking your session…
        </span>
      </div>
    )
  }

  if (status !== 'signed-in') return <LoginPage />

  return (
    <SiteDataProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<OverviewPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="s/:sectionKey" element={<SectionPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </SiteDataProvider>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </ToastProvider>
  )
}
