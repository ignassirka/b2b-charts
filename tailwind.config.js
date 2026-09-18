/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: 'var(--page-bg)',
        surface: 'var(--card-surface)',
        'surface-raised': 'var(--card-surface-raised)',
        line: 'var(--card-border)',
        muted: 'var(--text-muted)',
        strong: 'var(--text-strong)',
        accent: 'var(--signal-neutral)',
        alert: 'var(--series-alert)',
        scrim: 'var(--scrim)',
      },
      borderRadius: {
        // Figma: --md, 12px on "Widget - medium"
        card: '12px',
        modal: '16px',
        swatch: '2px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        // Figma type scale: 10px / 16px line-height for axis + legend labels
        axis: ['10px', '16px'],
        meta: ['11px', '16px'],
        label: ['13px', '20px'],
        title: ['15px', '22px'],
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
