import { useState, useEffect } from 'react'
import { patternApi, type ShiftPattern } from '../utils/api'
import './ShiftPatterns.css'

const defaultForm = { name: '', code: '', startTime: '09:00', endTime: '18:00', breakTime: 60, color: '#22c55e' }

function ShiftPatterns() {
  const [patterns, setPatterns] = useState<ShiftPattern[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPattern, setEditingPattern] = useState<ShiftPattern | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [error, setError] = useState('')

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

  const openModal = (pattern?: ShiftPattern) => {
    setError('')
    if (pattern) {
      setEditingPattern(pattern)
      setForm({
        name: pattern.name,
        code: pattern.code,
        startTime: pattern.startTime,
        endTime: pattern.endTime,
        breakTime: pattern.breakTime,
        color: pattern.color,
      })
    } else {
      setEditingPattern(null)
      setForm(defaultForm)
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingPattern(null)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (editingPattern) {
        await patternApi.update(editingPattern.id, form)
      } else {
        await patternApi.create(form)
      }
      loadPatterns()
      closeModal()
    } catch (e) {
      const msg = e instanceof Error ? e.message : '保存に失敗しました'
      if (msg.includes('409')) {
        setError('このコードは既に使用されています')
      } else {
        setError(msg)
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('削除しますか？')) return
    try {
      await patternApi.delete(id)
      loadPatterns()
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      if (msg.includes('409')) {
        alert('このパターンは使用中のシフトがあるため削除できません')
      } else {
        console.error('Failed to delete pattern:', e)
      }
    }
  }

  if (loading) return <div className="loading">読み込み中...</div>

  return (
    <div className="shift-patterns">
      <div className="page-header">
        <h1 className="page-title">シフトパターン設定</h1>
        <button className="btn btn-primary" onClick={() => openModal()}>+ パターン追加</button>
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
              <button className="btn btn-outline btn-sm" onClick={() => openModal(pattern)}>編集</button>
              <button className="btn btn-outline btn-sm btn-danger" onClick={() => handleDelete(pattern.id)}>削除</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editingPattern ? 'パターン編集' : 'パターン追加'}</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>パターン名</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="例: 早番"
                  required
                />
              </div>
              <div className="form-group">
                <label>コード（1文字）</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="例: E"
                  maxLength={3}
                  required
                />
              </div>
              <div className="form-row-inline">
                <div className="form-group">
                  <label>開始時間</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={e => setForm({ ...form, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>終了時間</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={e => setForm({ ...form, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row-inline">
                <div className="form-group">
                  <label>休憩時間（分）</label>
                  <input
                    type="number"
                    value={form.breakTime}
                    onChange={e => setForm({ ...form, breakTime: Number(e.target.value) })}
                    min={0}
                    max={480}
                  />
                </div>
                <div className="form-group">
                  <label>カラー</label>
                  <input
                    type="color"
                    value={form.color}
                    onChange={e => setForm({ ...form, color: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeModal}>キャンセル</button>
                <button type="submit" className="btn btn-primary">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ShiftPatterns
