import { useState, useEffect } from 'react'
import { patternApi, type ShiftPattern } from '../utils/api'
import './ShiftPatterns.css'

function ShiftPatterns() {
  const [patterns, setPatterns] = useState<ShiftPattern[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPatterns()
  }, [])

  const loadPatterns = async () => {
    try {
      const data = await patternApi.getAll()
      setPatterns(data)
    } catch (e) {
      console.error('Failed to load patterns:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('削除しますか？')) return
    try {
      await patternApi.delete(id)
      loadPatterns()
    } catch (e) {
      console.error('Failed to delete pattern:', e)
    }
  }

  if (loading) return <div className="loading">読み込み中...</div>

  return (
    <div className="shift-patterns">
      <div className="page-header">
        <h1 className="page-title">シフトパターン設定</h1>
        <button className="btn btn-primary">+ パターン追加</button>
      </div>

      <div className="patterns-grid">
        {patterns.map(pattern => (
          <div key={pattern.id} className="pattern-card card">
            <div className="pattern-header">
              <div className="pattern-color" style={{ backgroundColor: pattern.color }}>
                {pattern.code}
              </div>
              <div className="pattern-info">
                <h3 className="pattern-name">{pattern.name}</h3>
                <p className="pattern-time">{pattern.startTime} - {pattern.endTime}</p>
              </div>
            </div>
            <div className="pattern-details">
              <div className="detail-item">
                <span className="detail-label">休憩時間</span>
                <span className="detail-value">{pattern.breakTime}分</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">実働時間</span>
                <span className="detail-value">{pattern.breakTime > 0 ? '8時間' : '-'}</span>
              </div>
            </div>
            <div className="pattern-actions">
              <button className="btn btn-outline btn-sm">編集</button>
              <button className="btn btn-outline btn-sm btn-danger" onClick={() => handleDelete(pattern.id)}>削除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ShiftPatterns
