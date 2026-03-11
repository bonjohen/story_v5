/**
 * Instance Store — Zustand store for managing story instances.
 *
 * Provides CRUD operations for the active story instance and an index of
 * all saved instances. Persisted to localStorage via Zustand persist middleware.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StoryInstance, InstanceIndexEntry } from '../types.ts'
import { createInstance, instanceToIndexEntry } from '../types.ts'
import type {
  LoreCharacter,
  LorePlace,
  LoreObject,
  LoreFaction,
  PlotThread,
  WorldRule,
} from '../../generation/series/types.ts'

// ---------------------------------------------------------------------------
// Store Interface
// ---------------------------------------------------------------------------

export interface InstanceStoreState {
  // Instance index (lightweight entries for the selector)
  index: InstanceIndexEntry[]

  // All saved instances (keyed by instance_id)
  instances: Record<string, StoryInstance>

  // Active instance ID
  activeInstanceId: string | null

  // Derived: active instance (computed getter pattern via selector)
  // Use: useInstanceStore(s => s.instances[s.activeInstanceId!])

  // --- Instance CRUD ---
  createNewInstance: (title: string) => string
  loadInstance: (instance: StoryInstance) => void
  setActive: (instanceId: string | null) => void
  deleteInstance: (instanceId: string) => void
  renameInstance: (instanceId: string, title: string) => void

  // --- Character CRUD ---
  addCharacter: (character: LoreCharacter) => void
  updateCharacter: (id: string, changes: Partial<LoreCharacter>) => void
  removeCharacter: (id: string) => void

  // --- Place CRUD ---
  addPlace: (place: LorePlace) => void
  updatePlace: (id: string, changes: Partial<LorePlace>) => void
  removePlace: (id: string) => void

  // --- Object CRUD ---
  addObject: (obj: LoreObject) => void
  updateObject: (id: string, changes: Partial<LoreObject>) => void
  removeObject: (id: string) => void

  // --- Faction CRUD ---
  addFaction: (faction: LoreFaction) => void
  updateFaction: (id: string, changes: Partial<LoreFaction>) => void
  removeFaction: (id: string) => void

  // --- Plot Thread CRUD ---
  addThread: (thread: PlotThread) => void
  updateThread: (id: string, changes: Partial<PlotThread>) => void
  removeThread: (id: string) => void

  // --- World Rule CRUD ---
  addWorldRule: (rule: WorldRule) => void
  updateWorldRule: (id: string, changes: Partial<WorldRule>) => void
  removeWorldRule: (id: string) => void

  // --- Export/Import ---
  exportInstance: (instanceId: string) => StoryInstance | null
  importInstance: (instance: StoryInstance) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function touchInstance(inst: StoryInstance): StoryInstance {
  const now = new Date().toISOString()
  return {
    ...inst,
    metadata: { ...inst.metadata, updated_at: now },
    lore: { ...inst.lore, last_updated: now },
  }
}

function rebuildIndex(instances: Record<string, StoryInstance>): InstanceIndexEntry[] {
  return Object.values(instances)
    .map(instanceToIndexEntry)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useInstanceStore = create<InstanceStoreState>()(
  persist(
    (set, get) => ({
      index: [],
      instances: {},
      activeInstanceId: null,

      // --- Instance CRUD ---

      createNewInstance: (title) => {
        const inst = createInstance(title, 'manual')
        const id = inst.metadata.instance_id
        set((s) => {
          const instances = { ...s.instances, [id]: inst }
          return { instances, index: rebuildIndex(instances), activeInstanceId: id }
        })
        return id
      },

      loadInstance: (instance) => {
        const id = instance.metadata.instance_id
        set((s) => {
          const instances = { ...s.instances, [id]: instance }
          return { instances, index: rebuildIndex(instances), activeInstanceId: id }
        })
      },

      setActive: (instanceId) => set({ activeInstanceId: instanceId }),

      deleteInstance: (instanceId) => {
        set((s) => {
          const { [instanceId]: _, ...rest } = s.instances
          return {
            instances: rest,
            index: rebuildIndex(rest),
            activeInstanceId: s.activeInstanceId === instanceId ? null : s.activeInstanceId,
          }
        })
      },

      renameInstance: (instanceId, title) => {
        set((s) => {
          const inst = s.instances[instanceId]
          if (!inst) return s
          const updated = touchInstance({
            ...inst,
            metadata: { ...inst.metadata, title },
          })
          const instances = { ...s.instances, [instanceId]: updated }
          return { instances, index: rebuildIndex(instances) }
        })
      },

      // --- Entity CRUD (generic pattern) ---

      addCharacter: (character) => {
        set((s) => {
          const inst = s.activeInstanceId ? s.instances[s.activeInstanceId] : null
          if (!inst) return s
          const updated = touchInstance({
            ...inst,
            lore: { ...inst.lore, characters: [...inst.lore.characters, character] },
          })
          const instances = { ...s.instances, [inst.metadata.instance_id]: updated }
          return { instances, index: rebuildIndex(instances) }
        })
      },

      updateCharacter: (id, changes) => {
        set((s) => {
          const inst = s.activeInstanceId ? s.instances[s.activeInstanceId] : null
          if (!inst) return s
          const updated = touchInstance({
            ...inst,
            lore: {
              ...inst.lore,
              characters: inst.lore.characters.map((c) =>
                c.id === id ? { ...c, ...changes } : c,
              ),
            },
          })
          const instances = { ...s.instances, [inst.metadata.instance_id]: updated }
          return { instances, index: rebuildIndex(instances) }
        })
      },

      removeCharacter: (id) => {
        set((s) => {
          const inst = s.activeInstanceId ? s.instances[s.activeInstanceId] : null
          if (!inst) return s
          const updated = touchInstance({
            ...inst,
            lore: {
              ...inst.lore,
              characters: inst.lore.characters.filter((c) => c.id !== id),
            },
          })
          const instances = { ...s.instances, [inst.metadata.instance_id]: updated }
          return { instances, index: rebuildIndex(instances) }
        })
      },

      addPlace: (place) => {
        set((s) => {
          const inst = s.activeInstanceId ? s.instances[s.activeInstanceId] : null
          if (!inst) return s
          const updated = touchInstance({
            ...inst,
            lore: { ...inst.lore, places: [...inst.lore.places, place] },
          })
          const instances = { ...s.instances, [inst.metadata.instance_id]: updated }
          return { instances, index: rebuildIndex(instances) }
        })
      },

      updatePlace: (id, changes) => {
        set((s) => {
          const inst = s.activeInstanceId ? s.instances[s.activeInstanceId] : null
          if (!inst) return s
          const updated = touchInstance({
            ...inst,
            lore: {
              ...inst.lore,
              places: inst.lore.places.map((p) =>
                p.id === id ? { ...p, ...changes } : p,
              ),
            },
          })
          const instances = { ...s.instances, [inst.metadata.instance_id]: updated }
          return { instances, index: rebuildIndex(instances) }
        })
      },

      removePlace: (id) => {
        set((s) => {
          const inst = s.activeInstanceId ? s.instances[s.activeInstanceId] : null
          if (!inst) return s
          const updated = touchInstance({
            ...inst,
            lore: {
              ...inst.lore,
              places: inst.lore.places.filter((p) => p.id !== id),
            },
          })
          const instances = { ...s.instances, [inst.metadata.instance_id]: updated }
          return { instances, index: rebuildIndex(instances) }
        })
      },

      addObject: (obj) => {
        set((s) => {
          const inst = s.activeInstanceId ? s.instances[s.activeInstanceId] : null
          if (!inst) return s
          const updated = touchInstance({
            ...inst,
            lore: { ...inst.lore, objects: [...inst.lore.objects, obj] },
          })
          const instances = { ...s.instances, [inst.metadata.instance_id]: updated }
          return { instances, index: rebuildIndex(instances) }
        })
      },

      updateObject: (id, changes) => {
        set((s) => {
          const inst = s.activeInstanceId ? s.instances[s.activeInstanceId] : null
          if (!inst) return s
          const updated = touchInstance({
            ...inst,
            lore: {
              ...inst.lore,
              objects: inst.lore.objects.map((o) =>
                o.id === id ? { ...o, ...changes } : o,
              ),
            },
          })
          const instances = { ...s.instances, [inst.metadata.instance_id]: updated }
          return { instances, index: rebuildIndex(instances) }
        })
      },

      removeObject: (id) => {
        set((s) => {
          const inst = s.activeInstanceId ? s.instances[s.activeInstanceId] : null
          if (!inst) return s
          const updated = touchInstance({
            ...inst,
            lore: {
              ...inst.lore,
              objects: inst.lore.objects.filter((o) => o.id !== id),
            },
          })
          const instances = { ...s.instances, [inst.metadata.instance_id]: updated }
          return { instances, index: rebuildIndex(instances) }
        })
      },

      addFaction: (faction) => {
        set((s) => {
          const inst = s.activeInstanceId ? s.instances[s.activeInstanceId] : null
          if (!inst) return s
          const updated = touchInstance({
            ...inst,
            lore: { ...inst.lore, factions: [...inst.lore.factions, faction] },
          })
          const instances = { ...s.instances, [inst.metadata.instance_id]: updated }
          return { instances, index: rebuildIndex(instances) }
        })
      },

      updateFaction: (id, changes) => {
        set((s) => {
          const inst = s.activeInstanceId ? s.instances[s.activeInstanceId] : null
          if (!inst) return s
          const updated = touchInstance({
            ...inst,
            lore: {
              ...inst.lore,
              factions: inst.lore.factions.map((f) =>
                f.id === id ? { ...f, ...changes } : f,
              ),
            },
          })
          const instances = { ...s.instances, [inst.metadata.instance_id]: updated }
          return { instances, index: rebuildIndex(instances) }
        })
      },

      removeFaction: (id) => {
        set((s) => {
          const inst = s.activeInstanceId ? s.instances[s.activeInstanceId] : null
          if (!inst) return s
          const updated = touchInstance({
            ...inst,
            lore: {
              ...inst.lore,
              factions: inst.lore.factions.filter((f) => f.id !== id),
            },
          })
          const instances = { ...s.instances, [inst.metadata.instance_id]: updated }
          return { instances, index: rebuildIndex(instances) }
        })
      },

      addThread: (thread) => {
        set((s) => {
          const inst = s.activeInstanceId ? s.instances[s.activeInstanceId] : null
          if (!inst) return s
          const updated = touchInstance({
            ...inst,
            lore: { ...inst.lore, plot_threads: [...inst.lore.plot_threads, thread] },
          })
          const instances = { ...s.instances, [inst.metadata.instance_id]: updated }
          return { instances, index: rebuildIndex(instances) }
        })
      },

      updateThread: (id, changes) => {
        set((s) => {
          const inst = s.activeInstanceId ? s.instances[s.activeInstanceId] : null
          if (!inst) return s
          const updated = touchInstance({
            ...inst,
            lore: {
              ...inst.lore,
              plot_threads: inst.lore.plot_threads.map((t) =>
                t.id === id ? { ...t, ...changes } : t,
              ),
            },
          })
          const instances = { ...s.instances, [inst.metadata.instance_id]: updated }
          return { instances, index: rebuildIndex(instances) }
        })
      },

      removeThread: (id) => {
        set((s) => {
          const inst = s.activeInstanceId ? s.instances[s.activeInstanceId] : null
          if (!inst) return s
          const updated = touchInstance({
            ...inst,
            lore: {
              ...inst.lore,
              plot_threads: inst.lore.plot_threads.filter((t) => t.id !== id),
            },
          })
          const instances = { ...s.instances, [inst.metadata.instance_id]: updated }
          return { instances, index: rebuildIndex(instances) }
        })
      },

      addWorldRule: (rule) => {
        set((s) => {
          const inst = s.activeInstanceId ? s.instances[s.activeInstanceId] : null
          if (!inst) return s
          const updated = touchInstance({
            ...inst,
            lore: { ...inst.lore, world_rules: [...inst.lore.world_rules, rule] },
          })
          const instances = { ...s.instances, [inst.metadata.instance_id]: updated }
          return { instances, index: rebuildIndex(instances) }
        })
      },

      updateWorldRule: (id, changes) => {
        set((s) => {
          const inst = s.activeInstanceId ? s.instances[s.activeInstanceId] : null
          if (!inst) return s
          const updated = touchInstance({
            ...inst,
            lore: {
              ...inst.lore,
              world_rules: inst.lore.world_rules.map((r) =>
                r.id === id ? { ...r, ...changes } : r,
              ),
            },
          })
          const instances = { ...s.instances, [inst.metadata.instance_id]: updated }
          return { instances, index: rebuildIndex(instances) }
        })
      },

      removeWorldRule: (id) => {
        set((s) => {
          const inst = s.activeInstanceId ? s.instances[s.activeInstanceId] : null
          if (!inst) return s
          const updated = touchInstance({
            ...inst,
            lore: {
              ...inst.lore,
              world_rules: inst.lore.world_rules.filter((r) => r.id !== id),
            },
          })
          const instances = { ...s.instances, [inst.metadata.instance_id]: updated }
          return { instances, index: rebuildIndex(instances) }
        })
      },

      // --- Export/Import ---

      exportInstance: (instanceId) => {
        return get().instances[instanceId] ?? null
      },

      importInstance: (instance) => {
        const id = instance.metadata.instance_id
        set((s) => {
          const instances = { ...s.instances, [id]: instance }
          return { instances, index: rebuildIndex(instances), activeInstanceId: id }
        })
      },
    }),
    {
      name: 'story-instances',
      version: 1,
      partialize: (state) => ({
        index: state.index,
        instances: state.instances,
        activeInstanceId: state.activeInstanceId,
      }),
    },
  ),
)
