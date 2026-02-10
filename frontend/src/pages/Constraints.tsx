import { useState, useEffect } from 'react'
import { constraintApi, type Constraint } from '../utils/api'
import './Constraints.css'

interface ConstraintMap {
  [key: string]: string | number | boolean
}

const defaultValues: ConstraintMap = {
  'staffing.minDayStaff': 3,
  'staffing.minNightStaff': 2,
  'staffing.minQualifiedDay': 1,
  'workLimit.maxConsecutiveDays': 5,
  'workLimit.maxNightShifts': 8,
  'workLimit.restAfterNight': 1,
  'holiday.weeklyHolidays': 2,
  'holiday.minMonthlyHolidays': 8,
  'other.prioritizeRequests': true,
  'other.fairDistribution': true,
}

function Constraints() {
  const [values, setValues] = useState<ConstraintMap>(defaultValues)
  const [constraints, setConstraints] = useState<Constraint[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadConstraints()
  }, [])

  const loadConstraints = async () => {
    try {
      const data = await constraintApi.getAll()
      setConstraints(data)
      const map: ConstraintMap = { ...defaultValues }
      data.forEach(c => {
        const key = `${c.category}.${c.key}`
        if (typeof c.value === 'boolean') {
          map[key] = c.value
        } else {
          map[key] = Number(c.value)
        }
      })
      setValues(map)
    } catch (e) {
      console.error('Failed to load constraints:', e)
    } finally {
      setLoading(false)
    }
  }

  const setValue = (key: string, value: number | boolean) => {
    setValues(prev => ({ ...prev, [key]: value }))
    setMessage('')
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      const items = Object.entries(values).map(([key, value]) => {
        const [category, k] = key.split('.')
        return { category, key: k, value }
      })
      await constraintApi.update(items)
      setMessage('設定を保存しました')
    } catch (e) {
      console.error('Failed to save constraints:', e)
      setMessage('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading">読み込み中...</div>

  return (
    <div className="constraints">
      <div className="page-header">
        <h1 className="page-title">制約条件設定</h1>
      </div>

      {message && (
        <div className={`constraint-message ${message.includes('失敗') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="constraints-grid">
        <div className="card constraint-section">
          <h2 className="section-title">人員配置</h2>
          <div className="constraint-form">
            <div className="form-row">
              <label>最低必要人数（日中）</label>
              <div className="input-group">
                <input
                  type="number"
                  value={values['staffing.minDayStaff'] as number}
                  onChange={e => setValue('staffing.minDayStaff', Number(e.target.value))}
                  min={1}
                />
                <span className="input-suffix">名</span>
              </div>
            </div>
            <div className="form-row">
              <label>最低必要人数（夜間）</label>
              <div className="input-group">
                <input
                  type="number"
                  value={values['staffing.minNightStaff'] as number}
                  onChange={e => setValue('staffing.minNightStaff', Number(e.target.value))}
                  min={1}
                />
                <span className="input-suffix">名</span>
              </div>
            </div>
            <div className="form-row">
              <label>介護福祉士（日中）</label>
              <div className="input-group">
                <input
                  type="number"
                  value={values['staffing.minQualifiedDay'] as number}
                  onChange={e => setValue('staffing.minQualifiedDay', Number(e.target.value))}
                  min={0}
                />
                <span className="input-suffix">名以上</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card constraint-section">
          <h2 className="section-title">勤務制限</h2>
          <div className="constraint-form">
            <div className="form-row">
              <label>連続勤務上限</label>
              <div className="input-group">
                <input
                  type="number"
                  value={values['workLimit.maxConsecutiveDays'] as number}
                  onChange={e => setValue('workLimit.maxConsecutiveDays', Number(e.target.value))}
                  min={1}
                />
                <span className="input-suffix">日</span>
              </div>
            </div>
            <div className="form-row">
              <label>月間夜勤上限</label>
              <div className="input-group">
                <input
                  type="number"
                  value={values['workLimit.maxNightShifts'] as number}
                  onChange={e => setValue('workLimit.maxNightShifts', Number(e.target.value))}
                  min={0}
                />
                <span className="input-suffix">回</span>
              </div>
            </div>
            <div className="form-row">
              <label>夜勤後の休日</label>
              <div className="input-group">
                <input
                  type="number"
                  value={values['workLimit.restAfterNight'] as number}
                  onChange={e => setValue('workLimit.restAfterNight', Number(e.target.value))}
                  min={0}
                />
                <span className="input-suffix">日以上</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card constraint-section">
          <h2 className="section-title">休日設定</h2>
          <div className="constraint-form">
            <div className="form-row">
              <label>週休日数</label>
              <div className="input-group">
                <input
                  type="number"
                  value={values['holiday.weeklyHolidays'] as number}
                  onChange={e => setValue('holiday.weeklyHolidays', Number(e.target.value))}
                  min={1}
                />
                <span className="input-suffix">日</span>
              </div>
            </div>
            <div className="form-row">
              <label>月間最低休日</label>
              <div className="input-group">
                <input
                  type="number"
                  value={values['holiday.minMonthlyHolidays'] as number}
                  onChange={e => setValue('holiday.minMonthlyHolidays', Number(e.target.value))}
                  min={1}
                />
                <span className="input-suffix">日</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card constraint-section">
          <h2 className="section-title">その他</h2>
          <div className="constraint-form">
            <div className="form-row checkbox-row">
              <label>
                <input
                  type="checkbox"
                  checked={values['other.prioritizeRequests'] as boolean}
                  onChange={e => setValue('other.prioritizeRequests', e.target.checked)}
                />
                希望シフトを優先する
              </label>
            </div>
            <div className="form-row checkbox-row">
              <label>
                <input
                  type="checkbox"
                  checked={values['other.fairDistribution'] as boolean}
                  onChange={e => setValue('other.fairDistribution', e.target.checked)}
                />
                公平なシフト配分を考慮
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="save-section">
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '設定を保存'}
        </button>
      </div>
    </div>
  )
}

export default Constraints
