import { create } from 'zustand'

type Language = 'de'

interface LanguageStore {
  language: Language
  setLanguage: (_lang: string) => void
}

export const useLanguageStore = create<LanguageStore>((set) => ({
  language: 'de',
  setLanguage: () => set({ language: 'de' }),
}))
