import { useState, Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { ToastProvider } from './components/Toast'
import { ConfirmDialogProvider } from './components/ConfirmDialog'
import { useStore } from './store/useStore'
import type { Service } from './types'
import { AppShell } from './app/AppShell'
import { AppContent } from './app/AppContent'
import { AppBoot } from './app/AppBoot'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(_err: Error, _info: ErrorInfo) {}
  render() {
    if (this.state.error) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div className="glass" style={{ padding: 32, borderRadius: 'var(--radius-xl)', maxWidth: 420, width: '100%', textAlign: 'center' }}>
            <h3 style={{ marginBottom: 12 }}>Etwas ist schiefgelaufen</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>{this.state.error.message}</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>Neu laden</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const { authReady, myBackground, checkAllServices } = useStore()
  const [page, setPage] = useState('dashboard')
  const [showModal, setShowModal] = useState(false)
  const [editService, setEditService] = useState<Service | null>(null)
  const [checking, setChecking] = useState(false)
  const [showAddWidget, setShowAddWidget] = useState(false)
  const [showAddHaPanel, setShowAddHaPanel] = useState(false)
  const [showChangelog, setShowChangelog] = useState(false)

  const handleCheckAll = async () => {
    setChecking(true)
    await checkAllServices()
    setChecking(false)
  }

  const handleAddService = () => {
    setEditService(null)
    setShowModal(true)
    setPage('services')
  }

  const handleEditService = (service: Service) => {
    setEditService(service)
    setShowModal(true)
  }

  void handleEditService

  return (
    <ErrorBoundary>
      <ToastProvider>
        <ConfirmDialogProvider>
          <>
            <AppBoot />

            {!authReady ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
              </div>
            ) : (
              <>
            {myBackground && (
              <div className="bg-user-image" style={{ backgroundImage: `url(${myBackground})` }} />
            )}

            <div className="bg-orbs">
              <div className="bg-orb bg-orb-1" />
              <div className="bg-orb bg-orb-2" />
              <div className="bg-orb bg-orb-3" />
            </div>

            <AppShell
              page={page}
              setPage={setPage}
              onAddService={() => setPage('control_center')}
              onAddWidget={() => setPage('control_center')}
              onCheckAll={handleCheckAll}
              checking={checking}
            >
              <AppContent
                page={page}
                showModal={showModal}
                setShowModal={setShowModal}
                editService={editService}
                setEditService={setEditService}
                showAddWidget={showAddWidget}
                setShowAddWidget={setShowAddWidget}
                showAddHaPanel={showAddHaPanel}
                setShowAddHaPanel={setShowAddHaPanel}
                showChangelog={showChangelog}
                setShowChangelog={setShowChangelog}
              />
            </AppShell>
              </>
            )}
          </>
        </ConfirmDialogProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}
