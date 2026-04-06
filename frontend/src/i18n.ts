import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import deCommon from './locales/de/common.json'
import deSetup from './locales/de/setup.json'
import deSettings from './locales/de/settings.json'
import deDashboard from './locales/de/dashboard.json'
import deHa from './locales/de/ha.json'
import deDocker from './locales/de/docker.json'
import deBackup from './locales/de/backup.json'
import deNetwork from './locales/de/network.json'
import deBookmarks from './locales/de/bookmarks.json'
import deServices from './locales/de/services.json'
import deWidgets from './locales/de/widgets.json'
import deInstances from './locales/de/instances.json'
import deUnraid from './locales/de/unraid.json'

i18n.use(initReactI18next).init({
  lng: 'de',
  fallbackLng: 'de',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  resources: {
    de: {
      common: deCommon,
      setup: deSetup,
      settings: deSettings,
      dashboard: deDashboard,
      ha: deHa,
      docker: deDocker,
      backup: deBackup,
      network: deNetwork,
      bookmarks: deBookmarks,
      services: deServices,
      widgets: deWidgets,
      instances: deInstances,
      unraid: deUnraid}}})

export default i18n
