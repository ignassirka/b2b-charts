import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  DEFAULT_DIRECTION,
  DIRECTIONS,
  assertDivergence,
  isDirectionId,
  type ChartDirection,
  type DirectionId,
} from './directions'

const STORAGE_KEY = 'b2b-charts:direction'

/** Length of the re-skin cross-fade. Entry animations are never replayed by a direction change. */
export const DIRECTION_FADE_MS = 250

function readStored(): DirectionId {
  if (typeof window === 'undefined') return DEFAULT_DIRECTION
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return isDirectionId(stored) ? stored : DEFAULT_DIRECTION
}

interface DirectionContextValue {
  direction: ChartDirection
  directionId: DirectionId
  setDirection: (id: DirectionId) => void
  /** True for `DIRECTION_FADE_MS` after a switch, so chrome can cross-fade without remounting. */
  fading: boolean
}

const DirectionContext = createContext<DirectionContextValue | null>(null)

export function DirectionProvider({ children }: { children: ReactNode }) {
  const [directionId, setDirectionId] = useState<DirectionId>(readStored)
  const [fading, setFading] = useState(false)

  useEffect(() => assertDivergence(), [])

  const setDirection = useCallback((id: DirectionId) => {
    setDirectionId((prev) => {
      if (prev === id) return prev
      window.localStorage.setItem(STORAGE_KEY, id)
      setFading(true)
      return id
    })
  }, [])

  useEffect(() => {
    if (!fading) return
    const timer = window.setTimeout(() => setFading(false), DIRECTION_FADE_MS)
    return () => window.clearTimeout(timer)
  }, [fading])

  const value = useMemo<DirectionContextValue>(
    () => ({ direction: DIRECTIONS[directionId], directionId, setDirection, fading }),
    [directionId, setDirection, fading],
  )

  return <DirectionContext.Provider value={value}>{children}</DirectionContext.Provider>
}

/**
 * Pins one direction for a subtree. Compare mode renders the same variant once per direction
 * by wrapping each cell in this — nothing downstream knows it is being compared.
 */
export function DirectionScope({ id, children }: { id: DirectionId; children: ReactNode }) {
  const parent = useDirectionContext()
  const value = useMemo<DirectionContextValue>(
    () => ({ ...parent, direction: DIRECTIONS[id], directionId: id }),
    [parent, id],
  )
  return <DirectionContext.Provider value={value}>{children}</DirectionContext.Provider>
}

function useDirectionContext(): DirectionContextValue {
  const ctx = useContext(DirectionContext)
  if (!ctx) throw new Error('DirectionProvider is missing')
  return ctx
}

/** The active style contract. Charts and chrome read every style decision through this. */
export function useDirection(): ChartDirection {
  return useDirectionContext().direction
}

export function useDirectionControls(): Omit<DirectionContextValue, 'direction'> {
  const { directionId, setDirection, fading } = useDirectionContext()
  return useMemo(() => ({ directionId, setDirection, fading }), [directionId, setDirection, fading])
}
