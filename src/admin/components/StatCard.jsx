// StatCard.jsx — Reusable stats display card
import React from 'react'

function StatCard({ icon, value, label, color = 'blue', trend }) {
  const fmt = (v) => {
    if (typeof v === 'number') return v.toLocaleString('en-IN')
    return v ?? '—'
  }

  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-card-icon">{icon}</div>
      <div>
        <div className="stat-card-value">{fmt(value)}</div>
        <div className="stat-card-label">{label}</div>
        {trend && (
          <div className={`stat-card-trend ${trend.dir}`}>
            {trend.dir === 'up' ? '↑' : '↓'} {trend.text}
          </div>
        )}
      </div>
    </div>
  )
}

export default StatCard
