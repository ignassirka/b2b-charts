import type { ComponentType, SVGProps } from 'react'

export interface TabDef<T extends string> {
  id: T
  label: string
  icon?: ComponentType<SVGProps<SVGSVGElement>>
}

interface TabsProps<T extends string> {
  tabs: TabDef<T>[]
  /** Undefined when this tab group's selection lives in a sibling group (e.g. Foundations vs the chart tabs). */
  active?: T
  onChange: (id: T) => void
}

export function Tabs<T extends string>({ tabs, active, onChange }: TabsProps<T>) {
  return (
    <div role="tablist" className="flex gap-1 rounded-lg border border-line bg-page p-1">
      {tabs.map((tab) => {
        const selected = tab.id === active
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-label transition-colors duration-150 ease-out ${
              selected
                ? 'bg-surface font-medium text-strong shadow-sm'
                : 'text-muted hover:text-strong'
            }`}
          >
            {Icon && <Icon className="h-4 w-4 shrink-0" />}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
