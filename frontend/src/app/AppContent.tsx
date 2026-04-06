import { Dashboard } from '../pages/Dashboard'
import { ServicesPage } from '../pages/ServicesPage'
import { SettingsPage } from '../pages/Settings'
import { MediaPage } from '../pages/MediaPage'
import { WidgetsPage } from '../pages/WidgetsPage'
import { DockerPage } from '../pages/DockerPage'
import { HaPage } from '../pages/HaPage'
import { LogbuchPage } from '../pages/LogbuchPage'
import { NetworkPage } from '../pages/NetworkPage'
import { BackupPage } from '../pages/BackupPage'
import { AboutPage } from '../pages/AboutPage'
import { UnraidPage } from '../pages/UnraidPage'
import { BookmarksPage } from '../pages/BookmarksPage'
import { InstancesPage } from '../pages/InstancesPage'
import { ChangelogModal } from '../components/ChangelogModal'
import { ServiceModal } from '../components/ServiceModal'
import type { Service } from '../types'

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
  showChangelog: boolean
  setShowChangelog: (v: boolean) => void
}

export function AppContent(props: Props) {
  const {
    page,
    showModal,
    setShowModal,
    editService,
    setEditService,
    showAddWidget,
    setShowAddWidget,
    showAddHaPanel,
    setShowAddHaPanel,
    showChangelog,
    setShowChangelog,
  } = props

  const closeModal = () => {
    setShowModal(false)
    setEditService(null)
  }

  return (
    <>
      {page === 'dashboard' && <Dashboard />}
      {page === 'services' && <ServicesPage />}
      {page === 'media' && <MediaPage />}
      {page === 'widgets' && <WidgetsPage />}
      {page === 'docker' && <DockerPage />}
      {page === 'home_assistant' && <HaPage showAddPanel={showAddHaPanel} onCloseAddPanel={() => setShowAddHaPanel(false)} />}
      {page === 'logbuch' && <LogbuchPage />}
      {page === 'network' && <NetworkPage />}
      {page === 'backup' && <BackupPage />}
      {page === 'about' && <AboutPage onOpenChangelog={() => setShowChangelog(true)} />}
      {page === 'unraid' && <UnraidPage />}
      {page === 'bookmarks' && <BookmarksPage />}
      {page === 'instances' && <InstancesPage />}
      {page === 'settings' && <SettingsPage />}

      {showModal && (
        <ServiceModal
          service={editService}
          onClose={closeModal}
        />
      )}

      {showChangelog && (
        <ChangelogModal onClose={() => setShowChangelog(false)} />
      )}
    </>
  )
}
