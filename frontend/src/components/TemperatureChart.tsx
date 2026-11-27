import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TooltipContentProps } from 'recharts'
import type { DailyForecast } from '../types'
import { useSettings } from '../context/useSettings'
import type { WeatherTheme } from '../utils'
import { convertTemperature } from '../utils'

interface TemperatureColors {
  maximum: string
  minimum: string
  grid: string
  axis: string
}

interface TemperatureChartProps {
  forecast: DailyForecast[]
  theme: WeatherTheme
}

interface ChartForecastPoint extends DailyForecast {
  temperature_max: number
  temperature_min: number
}

const themeColors: Record<WeatherTheme, TemperatureColors> = {
  sunny: {
    maximum: '#d97706',
    minimum: '#0284c7',
    grid: '#e2e8f0',
    axis: '#64748b',
  },
  cloudy: {
    maximum: '#475569',
    minimum: '#0ea5e9',
    grid: '#e2e8f0',
    axis: '#64748b',
  },
  rainy: {
    maximum: '#2563eb',
    minimum: '#0891b2',
    grid: '#dbeafe',
    axis: '#64748b',
  },
  snowy: {
    maximum: '#0891b2',
    minimum: '#6366f1',
    grid: '#cffafe',
    axis: '#64748b',
  },
  stormy: {
    maximum: '#7c3aed',
    minimum: '#4f46e5',
    grid: '#ede9fe',
    axis: '#64748b',
  },
  night: {
    maximum: '#4f46e5',
    minimum: '#7c3aed',
    grid: '#e0e7ff',
    axis: '#64748b',
  },
}

function formatDate(value: string | number): string {
  const date = new Date(`${String(value)}T00:00:00`)
  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date)
}

function TemperatureTooltip({
  active,
  label,
  payload,
  colors,
  unit,
}: TooltipContentProps & {
  colors: TemperatureColors
  unit: 'C' | 'F'
}) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="min-w-36 rounded-2xl border border-white/80 bg-white/95 p-3 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95">
      <p className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
        {label === undefined ? '' : formatDate(label)}
      </p>
      <div className="space-y-1.5">
        {payload.map((point) => {
          if (typeof point.value !== 'number') {
            return null
          }

          const isMaximum = point.dataKey === 'temperature_max'
          return (
            <div
              className="flex items-center justify-between gap-4 text-xs"
              key={String(point.dataKey)}
            >
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full"
                  style={{
                    backgroundColor: isMaximum ? colors.maximum : colors.minimum,
                  }}
                />
                {isMaximum ? 'High' : 'Low'}
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {Math.round(point.value)}°{unit}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TemperatureChart({ forecast, theme }: TemperatureChartProps) {
  const { temperatureUnit, theme: colorTheme } = useSettings()
  const baseColors = themeColors[theme]
  const colors = {
    ...baseColors,
    grid: colorTheme === 'dark' ? '#334155' : baseColors.grid,
    axis: colorTheme === 'dark' ? '#cbd5e1' : baseColors.axis,
  }
  const chartData: ChartForecastPoint[] = forecast.map((day) => ({
    ...day,
    temperature_max: convertTemperature(day.temperature_max_c, temperatureUnit),
    temperature_min: convertTemperature(day.temperature_min_c, temperatureUnit),
  }))

  return (
    <section
      aria-label="Daily high and low temperatures"
      className="rounded-3xl border border-white/70 bg-white/65 p-4 shadow-xl shadow-slate-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/65 sm:p-6"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Temperature trend
        </h3>
        <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-0.5 w-4 rounded-full"
              style={{ backgroundColor: colors.maximum }}
            />
            High
          </span>
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-0.5 w-4 rounded-full"
              style={{ backgroundColor: colors.minimum }}
            />
            Low
          </span>
        </div>
      </div>

      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer height="100%" width="100%">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 8, right: 6, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="maximumTemperatureFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={colors.maximum} stopOpacity={0.22} />
                <stop offset="95%" stopColor={colors.maximum} stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="minimumTemperatureFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={colors.minimum} stopOpacity={0.14} />
                <stop offset="95%" stopColor={colors.minimum} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke={colors.grid}
              strokeDasharray="4 5"
              vertical={false}
            />
            <XAxis
              axisLine={false}
              dataKey="date"
              tick={{ fill: colors.axis, fontSize: 12 }}
              tickFormatter={formatDate}
              tickLine={false}
              tickMargin={10}
            />
            <YAxis
              axisLine={false}
              tick={{ fill: colors.axis, fontSize: 12 }}
              tickFormatter={(value: number | string) => `${Math.round(Number(value))}°`}
              tickLine={false}
              tickMargin={8}
              width={42}
            />
            <Tooltip
              content={(props) => (
                <TemperatureTooltip
                  {...props}
                  colors={colors}
                  unit={temperatureUnit}
                />
              )}
              cursor={{ stroke: colors.axis, strokeDasharray: '4 4', strokeOpacity: 0.35 }}
            />
            <Area
              activeDot={{ r: 5, strokeWidth: 0 }}
              dataKey="temperature_max"
              dot={forecast.length === 1 ? { r: 4 } : false}
              fill="url(#maximumTemperatureFill)"
              name="High"
              stroke={colors.maximum}
              strokeWidth={2.5}
              type="monotone"
            />
            <Area
              activeDot={{ r: 5, strokeWidth: 0 }}
              dataKey="temperature_min"
              dot={forecast.length === 1 ? { r: 4 } : false}
              fill="url(#minimumTemperatureFill)"
              name="Low"
              stroke={colors.minimum}
              strokeWidth={2.5}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

export default TemperatureChart
