import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { usePrefersReducedMotion } from '../theme/useThemeTokens'
import { WidgetIcon } from './icons'

const PANEL_VW = 0.92
const PANEL_MAX = 1600

/**
 * Open/close state for one card's fullscreen inspection, plus focus return.
 * Every variant gets this for free — nothing here knows what kind of chart it is.
 */
export function useChartExpand() {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [originRect, setOriginRect] = useState<DOMRect | null>(null)
  const wasOpen = useRef(false)

  const expand = useCallback(() => {
    const card = triggerRef.current?.closest('article')
    setOriginRect(card ? card.getBoundingClientRect() : null)
    setOpen(true)
  }, [])

  const close = useCallback(() => setOpen(false), [])

  // Returned after the dialog has actually gone, so nothing steals it back.
  useEffect(() => {
    if (wasOpen.current && !open) triggerRef.current?.focus()
    wasOpen.current = open
  }, [open])

  return { open, expand, close, triggerRef, originRect }
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

interface ChartModalProps {
  open: boolean
  onClose: () => void
  title: string
  /** The card the modal grew out of — drives the transform origin. */
  originRect: DOMRect | null
  chart: ReactNode
  inspector: ReactNode
}

export function ChartModal({
  open,
  onClose,
  title,
  originRect,
  chart,
  inspector,
}: ChartModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return

      const targets = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (!targets.length) return
      const first = targets[0]
      const last = targets[targets.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  // Grow from where the card sits rather than from the middle of the screen.
  const panelWidth = Math.min(window.innerWidth * PANEL_VW, PANEL_MAX)
  const panelLeft = (window.innerWidth - panelWidth) / 2
  const panelTop = window.innerHeight * 0.05
  const origin = originRect
    ? {
        transformOrigin: `${originRect.left + originRect.width / 2 - panelLeft}px ${
          originRect.top + originRect.height / 2 - panelTop
        }px`,
      }
    : undefined

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        aria-label="Close chart inspector"
        onClick={onClose}
        className={`absolute inset-0 cursor-default bg-scrim backdrop-blur-[2px] ${reduced ? '' : 'backdrop-enter'}`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${title} — fullscreen inspector`}
        tabIndex={-1}
        style={origin}
        className={`themed relative flex h-[90vh] w-[92vw] max-w-[1600px] overflow-hidden rounded-modal border border-line bg-surface outline-none ${
          reduced ? '' : 'modal-enter'
        }`}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-6">
          <header className="flex items-start gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex items-center gap-2">
                <WidgetIcon className="shrink-0" width={22} height={22} />
                <h2 className="text-title font-semibold text-strong">{title}</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-auto shrink-0 rounded-md border border-line px-2.5 py-1.5 text-meta font-medium text-muted transition-colors duration-150 ease-out hover:border-muted hover:text-strong"
            >
              Close
            </button>
          </header>
          <div className="min-h-0 flex-1">{chart}</div>
          <p className="text-meta text-muted opacity-70">
            Scroll to zoom the time axis, drag to zoom a range, pinch on touch.
          </p>
        </div>

        <aside
          aria-label="Chart inspector"
          className="flex w-[320px] shrink-0 flex-col border-l border-line bg-page"
        >
          {inspector}
        </aside>
      </div>
    </div>,
    document.body,
  )
}
