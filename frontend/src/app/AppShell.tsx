import type { ReactNode } from 'react'
import { Sidebar } from '../components/Sidebar'
import { Topbar } from '../components/Topbar'

interface Props {
  page: string
  setPage: (page: string) => void
  children: ReactNode
  onAddService: () => void
  onAddWidget: () => void
  onCheckAll: () => void
  checking: boolean
}

export function AppShell({
  page,
  setPage,
  children,
  onAddService,
  onAddWidget,
  onCheckAll,
  checking}: Props) {
  return (
    <div className="app-layout">
      <Sidebar page={page} onNavigate={setPage} />
      <div className="main-area">
        <Topbar
          page={page}
          onNavigate={setPage}
          onAddService={onAddService}
          onAddWidget={onAddWidget}
          onCheckAll={onCheckAll}
          checking={checking}
        />
        <main className="content-area">
          <div className="content-inner">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
