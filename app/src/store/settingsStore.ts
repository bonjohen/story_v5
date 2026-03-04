/**
 * Settings store — manages user preferences for theme, motion, and accessibility.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ColorScheme = 'dark' | 'light' | 'high-contrast'
export type MotionPreference = 'full' | 'reduced'

export interface SettingsState {
  colorScheme: ColorScheme
  motionPreference: MotionPreference
  settingsOpen: boolean

  setColorScheme: (scheme: ColorScheme) => void
  setMotionPreference: (pref: MotionPreference) => void
  toggleSettings: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      colorScheme: 'dark',
      motionPreference:
        typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'reduced'
          : 'full',
      settingsOpen: false,

      setColorScheme: (colorScheme) => {
        set({ colorScheme })
        applyColorScheme(colorScheme)
      },
      setMotionPreference: (motionPreference) => {
        set({ motionPreference })
        applyMotionPreference(motionPreference)
      },
      toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
    }),
    {
      name: 'story-v5-settings',
      partialize: (state) => ({
        colorScheme: state.colorScheme,
        motionPreference: state.motionPreference,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyColorScheme(state.colorScheme)
          applyMotionPreference(state.motionPreference)
        }
      },
    },
  ),
)

function applyColorScheme(scheme: ColorScheme) {
  const root = document.documentElement
  if (scheme === 'dark') {
    root.setAttribute('data-theme', 'dark')
  } else if (scheme === 'light') {
    root.setAttribute('data-theme', 'light')
  } else {
    root.setAttribute('data-theme', 'high-contrast')
  }
}

function applyMotionPreference(pref: MotionPreference) {
  const root = document.documentElement
  if (pref === 'reduced') {
    root.setAttribute('data-motion', 'reduced')
  } else {
    root.removeAttribute('data-motion')
  }
}
