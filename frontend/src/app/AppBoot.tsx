import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguageStore } from '../store/useLanguageStore'
import { useStore } from '../store/useStore'
import { useDashboardStore } from '../store/useDashboardStore'

export function AppBoot() {
  const { language } = useLanguageStore()
  const { i18n } = useTranslation()
  const { checkAuth, loadAll, startHealthPolling, settings, loadMyBackground, authUser, authReady } = useStore()
  const { loadDashboard } = useDashboardStore()

  useEffect(() => {
    i18n.changeLanguage(language)
  }, [language, i18n])

  useEffect(() => {
    checkAuth()
      .then(() => Promise.all([loadAll(), loadDashboard(), loadMyBackground()]))
      .then(() => startHealthPolling())
  }, [checkAuth, loadAll, loadDashboard, loadMyBackground, startHealthPolling])

  useEffect(() => {
    if (settings) {
      document.documentElement.setAttribute('data-theme', settings.theme_mode)
      document.documentElement.setAttribute('data-accent', settings.theme_accent)
    }
  }, [settings])

  useEffect(() => {
    loadMyBackground()
  }, [authUser?.sub, loadMyBackground])

  useEffect(() => {
    const bg = document.documentElement.style
    if ((window as unknown as { __mardashBg?: string | null }).__mardashBg) {
      bg.setProperty('--user-bg-url', `url(${(window as unknown as { __mardashBg?: string | null }).__mardashBg})`)
    }
  }, [authReady])

  return null
}
