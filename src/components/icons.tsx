import { useId, type ReactNode, type SVGProps } from 'react'

/**
 * Small inline icon set for the tab bar and the settings rail. Kept as plain SVG rather than
 * an icon library dependency — the project intentionally has no component library.
 */

type IconProps = SVGProps<SVGSVGElement>

function BaseIcon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

/** Represents the Donut tab and the "Donut settings" section. */
export function DonutIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="10" cy="10" r="7" />
      <circle cx="10" cy="10" r="2.75" />
    </BaseIcon>
  )
}

/** Represents the Bar tab and the "Bar settings" section. */
export function BarIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4.5 16V9.5" />
      <path d="M10 16V4" />
      <path d="M15.5 16v-5.5" />
    </BaseIcon>
  )
}

/** Represents the Line tab and the "Line settings" section. */
export function LineIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3.5 13.5 7.75 8.75l3 3L16.5 5" />
    </BaseIcon>
  )
}

/** Represents the Foundations tab. No matching settings section exists for it. */
export function FoundationsIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3.5" y="3.5" width="5.25" height="5.25" rx="1" />
      <rect x="11.25" y="3.5" width="5.25" height="5.25" rx="1" />
      <rect x="3.5" y="11.25" width="5.25" height="5.25" rx="1" />
      <rect x="11.25" y="11.25" width="5.25" height="5.25" rx="1" />
    </BaseIcon>
  )
}

/** Marks every chart widget's title, on the card and in the fullscreen inspector. Brand mark, not themed. */
export function WidgetIcon(props: IconProps) {
  // Gradient ids must be unique per instance — this icon repeats across every card on the page.
  const uid = useId()
  const linearId = `widget-icon-linear-${uid}`
  const radialId = `widget-icon-radial-${uid}`
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true" focusable="false" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.859 22.6714C12.6866 24.1593 14.8121 24.2399 15.7518 22.819L24.5137 9.56983C25.4429 8.16479 24.5539 6.28104 22.8712 6.08959L5.64942 4.13006C3.81332 3.92115 2.506 5.8572 3.39907 7.4627L3.46911 7.58796L11.1536 12.8535L11.0602 21.2302L11.859 22.6714Z"
        fill={`url(#${linearId})`}
      />
      <path
        d="M12.3521 21.2836L13.1297 20.1237L19.0364 11.2015C19.5528 10.4214 19.0599 9.37493 18.1255 9.26765L3.4668 7.58472L11.0604 21.2362C11.3376 21.7248 12.0383 21.7516 12.3521 21.2836Z"
        fill={`url(#${radialId})`}
      />
      <defs>
        <linearGradient id={linearId} x1="22.8047" y1="22.6704" x2="8.79181" y2="-1.49515" gradientUnits="userSpaceOnUse">
          <stop offset="0.0660125" stopColor="#8EFFEE" />
          <stop offset="0.4499" stopColor="#C9C7FF" />
          <stop offset="1" stopColor="#7341FF" />
        </linearGradient>
        <radialGradient
          id={radialId}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(12.3723 1.33519) rotate(93.7553) scale(22.2348 28.6742)"
        >
          <stop offset="0.403126" stopColor="#6D4AFF" />
          <stop offset="0.9944" stopColor="#00F0C3" />
        </radialGradient>
      </defs>
    </svg>
  )
}
