import { Suspense, lazy } from 'react'
import { ServiceModal } from '../components/ServiceModal'
import type { Service } from '../types'

const Dashboard = lazy(() => import('../pages/Dashboard').then(m => ({ default: m.Dashboard })))
const ServicesPage = lazy(() => import('../pages/ServicesPage').then(m => ({ default: m.ServicesPage })))
const SettingsPage = lazy(() => import('../pages/Settings').then(m => ({ default: m.SettingsPage })))
const DockerPage = lazy(() => import('../pages/DockerPage').then(m => ({ default: m.DockerPage })))
const HaPage = lazy(() => import('../pages/HaPage').then(m => ({ default: m.HaPage })))
const NetworkPage = lazy(() => import('../pages/NetworkPage').then(m => ({ default: m.NetworkPage })))
const BackupPage = lazy(() => import('../pages/BackupPage').then(m => ({ default: m.BackupPage })))
const UnraidPage = lazy(() => import('../pages/UnraidPage').then(m => ({ default: m.UnraidPage })))
const BookmarksPage = lazy(() => import('../pages/BookmarksPage').then(m => ({ default: m.BookmarksPage })))
const InstancesPage = lazy(() => import('../pages/InstancesPage').then(m => ({ default: m.InstancesPage })))
const ControlCenterPage = lazy(() => import('../pages/ControlCenter').then(m => ({ default: m.ControlCenterPage })))

interface Props {
  page: string
  showModal: boolean
  setShowModal: (v: boolean) => void
  editService: Service | null
  setEditService: (s: Service | null) => void
  showAddWidget: boolean
  setShowAddWidget: (v: boolean) => void
  showAddHaPanel: boolean
  setShowAddHaPanel: (v: boolean) => void
  setShowChangelog: (v: boolean) => void
}

function PageLoading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
    </div>
  )
}

export function AppContent(props: Props) {
  const {
    page,
    showModal,
    setShowModal,
    editService,
    setEditService,
    showAddHaPanel,
    setShowAddHaPanel,
    setShowChangelog} = props

  const closeModal = () => {
    setShowModal(false)
    setEditService(null)
  }

  return (
    <>
      <Suspense fallback={<PageLoading />}>
        {page === 'dashboard' && <Dashboard />}
        {page === 'services' && <ServicesPage />}
        {page === 'docker' && <DockerPage />}
        {page === 'home_assistant' && <HaPage showAddPanel={showAddHaPanel} onCloseAddPanel={() => setShowAddHaPanel(false)} />}
        {page === 'network' && <NetworkPage />}
        {page === 'backup' && <BackupPage />}
        {page === 'unraid' && <UnraidPage />}
        {page === 'bookmarks' && <BookmarksPage />}
        {page === 'instances' && <InstancesPage />}
        {page === 'control_center' && <ControlCenterPage />}
        {page === 'settings' && <SettingsPage />}
      </Suspense>

      {showModal && (
        <ServiceModal
          service={editService}
          onClose={closeModal}
        />
      )}

    </>
  )
}
