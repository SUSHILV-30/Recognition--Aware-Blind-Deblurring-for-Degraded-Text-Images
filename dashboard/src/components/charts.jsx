import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis, LabelList,
} from 'recharts'
import { useThemeColors } from './ui.jsx'

function useAxis() {
  const c = useThemeColors()
  const tick = { fill: c.muted, fontSize: 12.5 }
  return {
    c,
    grid: <CartesianGrid stroke={c.rule} strokeDasharray="3 4" vertical={false} />,
    x: (props) => <XAxis tick={tick} axisLine={{ stroke: c.rule }} tickLine={false} {...props} />,
    y: (props) => <YAxis tick={tick} axisLine={false} tickLine={false} width={44} {...props} />,
    tooltip: (props) => (
      <Tooltip
        cursor={{ fill: c['surface-2'] }}
        contentStyle={{
          background: c.surface, border: `1px solid ${c.rule}`, borderRadius: 8,
          color: c.ink, fontSize: 13.5,
        }}
        labelStyle={{ color: c.ink, fontWeight: 600 }}
        {...props}
      />
    ),
    legend: <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 13.5, color: c.muted, paddingTop: 6 }} />,
  }
}

// series: [{ key, name, color }]
export function GroupedBars({ data, xKey, series, unit = '', domain, labels = false, height = 300, digits = 2 }) {
  const a = useAxis()
  return (
    <div className="chart-box" style={{ height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 18, right: 8, left: 0, bottom: 0 }} barCategoryGap="22%">
          {a.grid}
          {a.x({ dataKey: xKey })}
          {a.y({ domain: domain || [0, 'auto'], unit })}
          {a.tooltip({ formatter: (v) => (v == null ? '—' : `${Number(v).toFixed(digits)}${unit}`) })}
          {a.legend}
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[3, 3, 0, 0]} isAnimationActive={false}>
              {labels && (
                <LabelList dataKey={s.key} position="top" fontSize={11.5} fill={a.c.muted}
                  formatter={(v) => (v == null ? '' : Number(v).toFixed(digits))} />
              )}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function Trend({ data, xKey, series, unit = '', domain, height = 300, xLabel, digits = 2, rightKey }) {
  const a = useAxis()
  return (
    <div className="chart-box" style={{ height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 12, right: rightKey ? 0 : 12, left: 0, bottom: xLabel ? 14 : 0 }}>
          {a.grid}
          {a.x({ dataKey: xKey, label: xLabel ? { value: xLabel, position: 'insideBottom', offset: -8, fill: a.c.muted, fontSize: 12.5 } : undefined })}
          {a.y({ yAxisId: 'l', domain: domain || ['auto', 'auto'], unit })}
          {rightKey && a.y({ yAxisId: 'r', orientation: 'right', domain: ['auto', 'auto'] })}
          {a.tooltip({ cursor: { stroke: a.c.rule }, formatter: (v) => Number(v).toFixed(digits) })}
          {a.legend}
          {series.map((s) => (
            <Line
              key={s.key}
              yAxisId={s.key === rightKey ? 'r' : 'l'}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2.2}
              strokeDasharray={s.dashed ? '5 4' : undefined}
              dot={{ r: 3.2, fill: s.color, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
