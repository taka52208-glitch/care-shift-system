import { useState, useEffect } from 'react'
import { reportApi, type MonthlyReport } from '../utils/api'
import './Reports.css'

function Reports() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [report, setReport] = useState<MonthlyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadReport()
  }, [currentMonth])

  const loadReport = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await reportApi.getMonthly(currentMonth)
      setReport(data)
    } catch (e) {
      setError('レポートの読み込みに失敗しました')
      console.error('Failed to load report:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMonth(e.target.value)
  }

  if (loading) return <div className="loading">読み込み中...</div>
  if (error) return <div className="error">{error}</div>
  if (!report) return <div className="error">データがありません</div>

  const { totalWorkDays, totalHours, totalNightShifts, totalOvertime, staffReports, shiftDistribution } = report

  return (
    <div className="reports">
      <div className="page-header">
        <h1 className="page-title">レポート</h1>
        <div className="header-actions">
          <input
            type="month"
            className="month-picker"
            value={currentMonth}
            onChange={handleMonthChange}
          />
          <button className="btn btn-outline" onClick={() => window.print()}>PDF出力</button>
        </div>
      </div>

      <div className="summary-cards">
        <div className="card summary-card">
          <div className="summary-label">総勤務日数</div>
          <div className="summary-value">{totalWorkDays}日</div>
        </div>
        <div className="card summary-card">
          <div className="summary-label">総勤務時間</div>
          <div className="summary-value">{totalHours}時間</div>
        </div>
        <div className="card summary-card">
          <div className="summary-label">夜勤回数合計</div>
          <div className="summary-value">{totalNightShifts}回</div>
        </div>
        <div className="card summary-card">
          <div className="summary-label">時間外合計</div>
          <div className="summary-value">{totalOvertime}時間</div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">スタッフ別勤務時間</h2>
        <table className="hours-table">
          <thead>
            <tr>
              <th>スタッフ名</th>
              <th>勤務日数</th>
              <th>総勤務時間</th>
              <th>夜勤回数</th>
              <th>時間外</th>
            </tr>
          </thead>
          <tbody>
            {staffReports.map((staff) => (
              <tr key={staff.staffId}>
                <td className="staff-name">{staff.name}</td>
                <td>{staff.workDays}日</td>
                <td>{staff.totalHours}時間</td>
                <td>{staff.nightShifts}回</td>
                <td className={staff.overtime > 0 ? 'overtime-warning' : ''}>
                  {staff.overtime}時間
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 className="card-title">シフト分布</h2>
        <div className="shift-distribution">
          <div className="distribution-item">
            <div className="distribution-bar early" style={{ width: `${Math.max(5, shiftDistribution.early * 3)}px` }}></div>
            <span className="distribution-label">早番: {shiftDistribution.early}回</span>
          </div>
          <div className="distribution-item">
            <div className="distribution-bar day" style={{ width: `${Math.max(5, shiftDistribution.day * 3)}px` }}></div>
            <span className="distribution-label">日勤: {shiftDistribution.day}回</span>
          </div>
          <div className="distribution-item">
            <div className="distribution-bar late" style={{ width: `${Math.max(5, shiftDistribution.late * 3)}px` }}></div>
            <span className="distribution-label">遅番: {shiftDistribution.late}回</span>
          </div>
          <div className="distribution-item">
            <div className="distribution-bar night" style={{ width: `${Math.max(5, shiftDistribution.night * 3)}px` }}></div>
            <span className="distribution-label">夜勤: {shiftDistribution.night}回</span>
          </div>
          <div className="distribution-item">
            <div className="distribution-bar off" style={{ width: `${Math.max(5, shiftDistribution.off * 3)}px` }}></div>
            <span className="distribution-label">公休: {shiftDistribution.off}回</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">スタッフ別シフト詳細</h2>
        <table className="detail-table">
          <thead>
            <tr>
              <th>スタッフ名</th>
              <th>早番</th>
              <th>日勤</th>
              <th>遅番</th>
              <th>夜勤</th>
              <th>公休</th>
            </tr>
          </thead>
          <tbody>
            {staffReports.map((staff) => (
              <tr key={staff.staffId}>
                <td className="staff-name">{staff.name}</td>
                <td>{staff.earlyShifts}回</td>
                <td>{staff.dayShifts}回</td>
                <td>{staff.lateShifts}回</td>
                <td>{staff.nightShifts}回</td>
                <td>{staff.holidays}日</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Reports
