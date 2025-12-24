import { useState, useEffect } from 'react'
import { staffApi, shiftApi, patternApi, type Staff, type Shift, type ShiftPattern } from '../utils/api'
import './ShiftCalendar.css'

function ShiftCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [staff, setStaff] = useState<Staff[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [patterns, setPatterns] = useState<ShiftPattern[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1
  const monthStr = `${year}-${String(month).padStart(2, '0')}`

  useEffect(() => {
    loadData()
  }, [monthStr])

  const loadData = async () => {
    try {
      const [staffData, shiftData, patternData] = await Promise.all([
        staffApi.getAll(),
        shiftApi.getAll(monthStr),
        patternApi.getAll()
      ])
      setStaff(staffData)
      setShifts(shiftData)
      setPatterns(patternData)
    } catch (e) {
      console.error('Failed to load data:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleCellClick = async (staffId: string, date: string, existingShift?: Shift) => {
    const patternOptions = patterns.map(p => `${p.code}: ${p.name}`).join('\n')
    const input = prompt(`シフトコードを入力:\n${patternOptions}\n(空欄で削除)`, existingShift ? patterns.find(p => p.id === existingShift.patternId)?.code : '')

    if (input === null) return

    if (input === '' && existingShift) {
      await shiftApi.delete(existingShift.id)
    } else if (input) {
      const pattern = patterns.find(p => p.code === input.toUpperCase())
      if (pattern) {
        if (existingShift) {
          await shiftApi.update(existingShift.id, { patternId: pattern.id })
        } else {
          await shiftApi.create({ staffId, date, patternId: pattern.id })
        }
      }
    }
    loadData()
  }

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(year, currentDate.getMonth() + delta, 1))
    setMessage(null)
  }

  const handleAutoGenerate = async () => {
    const confirmed = confirm(
      `${year}年${month}月のシフトを自動生成しますか？\n既存のシフトは上書きされます。`
    )
    if (!confirmed) return

    setGenerating(true)
    setMessage(null)

    try {
      const result = await shiftApi.autoGenerate(monthStr, true)
      if (result.success) {
        setMessage({
          type: result.warnings.length > 0 ? 'warning' : 'success',
          text: result.warnings.length > 0
            ? `${result.message}\n警告: ${result.warnings.slice(0, 3).join(', ')}${result.warnings.length > 3 ? '...' : ''}`
            : result.message
        })
        await loadData()
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'シフト生成に失敗しました' })
      console.error('Auto-generate failed:', e)
    } finally {
      setGenerating(false)
    }
  }

  const handleClearShifts = async () => {
    const confirmed = confirm(`${year}年${month}月のシフトをすべて削除しますか？`)
    if (!confirmed) return

    try {
      await shiftApi.clearMonth(monthStr)
      setMessage({ type: 'success', text: 'シフトを削除しました' })
      await loadData()
    } catch (e) {
      setMessage({ type: 'error', text: 'シフト削除に失敗しました' })
      console.error('Clear shifts failed:', e)
    }
  }

  const daysInMonth = new Date(year, month, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const getShift = (staffId: string, day: number) => {
    const date = `${monthStr}-${String(day).padStart(2, '0')}`
    return shifts.find(s => s.staffId === staffId && s.date === date)
  }

  const getPatternStyle = (patternId: string) => {
    const pattern = patterns.find(p => p.id === patternId)
    return pattern ? { backgroundColor: pattern.color, color: '#fff' } : {}
  }

  if (loading) return <div className="loading">読み込み中...</div>

  return (
    <div className="shift-calendar">
      <div className="page-header">
        <h1 className="page-title">シフト表</h1>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => changeMonth(-1)}>← 前月</button>
          <span className="current-month">{year}年{month}月</span>
          <button className="btn btn-outline" onClick={() => changeMonth(1)}>翌月 →</button>
          <button
            className="btn btn-primary"
            onClick={handleAutoGenerate}
            disabled={generating}
          >
            {generating ? '生成中...' : '自動生成'}
          </button>
          <button
            className="btn btn-danger"
            onClick={handleClearShifts}
            disabled={generating}
          >
            クリア
          </button>
        </div>
      </div>

      {message && (
        <div className={`message message-${message.type}`}>
          {message.text}
          <button className="message-close" onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      <div className="calendar-container card">
        <div className="calendar-scroll">
          <table className="shift-table">
            <thead>
              <tr>
                <th className="staff-column">スタッフ</th>
                {days.map(day => {
                  const date = new Date(year, month - 1, day)
                  const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6
                  return (
                    <th key={day} className={`day-column ${isWeekend ? 'weekend' : ''}`}>
                      <div className="day-number">{day}</div>
                      <div className="day-name">{dayOfWeek}</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {staff.map(s => (
                <tr key={s.id}>
                  <td className="staff-name">{s.name}</td>
                  {days.map(day => {
                    const date = new Date(year, month - 1, day)
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6
                    const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`
                    const shift = getShift(s.id, day)
                    const pattern = shift ? patterns.find(p => p.id === shift.patternId) : null
                    return (
                      <td key={day} className={`shift-cell ${isWeekend ? 'weekend' : ''}`}>
                        <div
                          className="shift-slot"
                          style={shift ? getPatternStyle(shift.patternId) : {}}
                          onClick={() => handleCellClick(s.id, dateStr, shift)}
                        >
                          {pattern?.code || ''}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="shift-legend">
        {patterns.map(p => (
          <span key={p.id} className="legend-item">
            <span className="legend-color" style={{ backgroundColor: p.color }}></span>
            {p.code}: {p.name}
          </span>
        ))}
      </div>
    </div>
  )
}

export default ShiftCalendar
