import { useState, useEffect } from 'react'
import './Dashboard.css'

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://care-shift-system.onrender.com/api'

interface DashboardStats {
  staffCount: number
  currentMonth: string
  completionRate: number
  pendingRequests: number
  shiftsThisMonth: number
  shiftsByPattern: Array<{ name: string; color: string; count: number }>
}

interface WeeklyData {
  date: string
  dayOfWeek: string
  day: number
  shifts: Array<{ staff_name: string; pattern_name: string; code: string; color: string }>
  count: number
}

interface Activity {
  id: string
  staff_name: string
  request_type: string
  date: string
  status: string
  created_at: string
}

function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [weekly, setWeekly] = useState<WeeklyData[]>([])
  const [activity, setActivity] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const [statsRes, weeklyRes, activityRes] = await Promise.all([
        fetch(`${API_BASE}/dashboard/stats`, { headers }),
        fetch(`${API_BASE}/dashboard/weekly`, { headers }),
        fetch(`${API_BASE}/dashboard/activity`, { headers })
      ])

      if (statsRes.ok) setStats(await statsRes.json())
      if (weeklyRes.ok) {
        const data = await weeklyRes.json()
        setWeekly(Array.isArray(data) ? data : [])
      }
      if (activityRes.ok) {
        const data = await activityRes.json()
        setActivity(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.error('Failed to load dashboard:', e)
    } finally {
      setLoading(false)
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '未対応',
      approved: '承認済',
      rejected: '却下'
    }
    return labels[status] || status
  }

  if (loading) return <div className="loading">読み込み中...</div>

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">ダッシュボード</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.staffCount || 0}</div>
            <div className="stat-label">登録スタッフ数</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.currentMonth || '-'}</div>
            <div className="stat-label">現在のシフト月</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.completionRate || 0}%</div>
            <div className="stat-label">シフト充足率</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-value">{stats?.pendingRequests || 0}</div>
            <div className="stat-label">未対応の希望</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h2 className="card-title">今週のシフト概要</h2>
          <div className="weekly-grid">
            {weekly.map(day => (
              <div key={day.date} className={`weekly-day ${day.dayOfWeek === '日' || day.dayOfWeek === '土' ? 'weekend' : ''}`}>
                <div className="day-header">
                  <span className="day-number">{day.day}</span>
                  <span className="day-name">{day.dayOfWeek}</span>
                </div>
                <div className="day-count">{day.count}名</div>
                <div className="day-shifts">
                  {day.shifts.slice(0, 3).map((s, i) => (
                    <span key={i} className="shift-badge" style={{ backgroundColor: s.color }}>
                      {s.code}
                    </span>
                  ))}
                  {day.shifts.length > 3 && <span className="more">+{day.shifts.length - 3}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">シフト種別（今月）</h2>
          <div className="pattern-stats">
            {stats?.shiftsByPattern.map(p => (
              <div key={p.name} className="pattern-row">
                <span className="pattern-color" style={{ backgroundColor: p.color }}></span>
                <span className="pattern-name">{p.name}</span>
                <span className="pattern-count">{p.count}件</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">最近の希望シフト</h2>
          {activity.length === 0 ? (
            <div className="empty-state">希望シフトはありません</div>
          ) : (
            <div className="activity-list">
              {activity.map(a => (
                <div key={a.id} className="activity-item">
                  <div className="activity-info">
                    <span className="activity-name">{a.staff_name}</span>
                    <span className="activity-type">{a.request_type}</span>
                    <span className="activity-date">{a.date}</span>
                  </div>
                  <span className={`activity-status status-${a.status}`}>
                    {getStatusLabel(a.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
