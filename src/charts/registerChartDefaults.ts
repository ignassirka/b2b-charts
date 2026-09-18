import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
} from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import zoomPlugin from 'chartjs-plugin-zoom'
import { customPlugins } from './plugins'

let done = false

/**
 * Registered once for the whole app.
 *
 * The built-in Tooltip plugin is deliberately never registered — every variant uses the
 * custom HTML tooltip instead, and leaving it out keeps the Chart.js default from
 * appearing anywhere by accident.
 */
export function registerChartDefaults() {
  if (done) return
  done = true

  Chart.register(
    ArcElement,
    BarController,
    BarElement,
    CategoryScale,
    DoughnutController,
    Filler,
    Legend,
    LineController,
    LineElement,
    LinearScale,
    PointElement,
    annotationPlugin,
    // Inert unless a chart opts in; only the fullscreen inspector does.
    zoomPlugin,
    ...customPlugins,
  )

  Chart.defaults.font.family = 'Inter, system-ui, -apple-system, sans-serif'
  Chart.defaults.font.size = 10 // Figma: axis + legend labels are 10px / 16px
  Chart.defaults.responsive = true
  Chart.defaults.maintainAspectRatio = false
  Chart.defaults.plugins.legend.display = false
  Chart.defaults.elements.arc.borderWidth = 0
  Chart.defaults.elements.line.borderWidth = 2
  Chart.defaults.elements.line.capBezierPoints = true
  Chart.defaults.elements.point.radius = 0
  Chart.defaults.elements.point.hitRadius = 12
  Chart.defaults.elements.bar.borderSkipped = false
  Chart.defaults.datasets.line.fill = false
}
